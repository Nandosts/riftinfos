import {
  catalogoAneis,
  catalogoConjuntos,
  catalogoEscalasPecas,
  nomesRaridade,
} from "../src/dados.mjs";
import { URL_API_PUBLICA } from "./lib/bundle_jogo.mjs";

const AMOSTRAS_MINIMAS_CONFIANCA = 3;

function analisarArgumentos(argv) {
  const opcoes = {
    alvo: "pendentes", // "pendentes" | "todos"
    filtroKind: null,
    filtroLook: null,
    paginasRanking: 4,
    concorrencia: 10,
    maxPerfis: 250,
    json: false,
  };
  for (const arg of argv) {
    if (arg.startsWith("--alvo=")) opcoes.alvo = arg.slice("--alvo=".length);
    else if (arg.startsWith("--kind=")) opcoes.filtroKind = arg.slice("--kind=".length);
    else if (arg.startsWith("--look=")) opcoes.filtroLook = Number(arg.slice("--look=".length));
    else if (arg.startsWith("--paginas=")) opcoes.paginasRanking = Math.max(1, Number(arg.slice("--paginas=".length)) || 1);
    else if (arg.startsWith("--max-perfis=")) opcoes.maxPerfis = Math.max(10, Number(arg.slice("--max-perfis=".length)) || 100);
    else if (arg.startsWith("--concorrencia=")) opcoes.concorrencia = Math.max(1, Math.min(20, Number(arg.slice("--concorrencia=".length)) || 8));
    else if (arg === "--json") opcoes.json = true;
    else if (arg === "--ajuda" || arg === "-h") {
      console.log(`Uso: node scripts/calibrar_curvas.mjs [opções]

Varre perfis públicos do ranking do RiftStream, separa as amostras por peça
e raridade e calcula a escala por nível (atk, def, hp, crit, spd).
Curvas com menos de ${AMOSTRAS_MINIMAS_CONFIANCA} amostras são marcadas como provisórias.

Opções:
  --alvo=pendentes|todos   Foca só nas peças estimadas/com curvaReferencia (padrão) ou todas
  --kind=KIND              Filtra um kind específico (ex.: --kind=steamhammer)
  --look=NUM               Filtra um anel específico pelo look (ex.: --look=19)
  --paginas=N              Quantas páginas do ranking consultar (padrão: 4)
  --max-perfis=N           Limite de perfis consultados (padrão: 250)
  --concorrencia=N         Requisições simultâneas (padrão: 10)
  --json                   Saída em JSON`);
      process.exit(0);
    } else {
      throw new Error(`Opção desconhecida: ${arg}`);
    }
  }
  if (!["pendentes", "todos"].includes(opcoes.alvo)) {
    throw new Error(`--alvo inválido: "${opcoes.alvo}". Use "pendentes" ou "todos".`);
  }
  return opcoes;
}

async function buscarJson(caminho, timeoutMs = 8000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const resp = await fetch(`${URL_API_PUBLICA}${caminho}`, { signal: ctrl.signal });
    if (!resp.ok) return null;
    return await resp.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function coletarAlvos(paginas, maxPerfis) {
  const alvos = new Map();
  for (let p = 1; p <= paginas; p++) {
    const dados = await buscarJson(`/api/ranking/characters?page=${p}&size=50&secondary=true`);
    const lista = dados?.items || [];
    for (const item of lista) {
      const login = item?.login || item?.user || item?.name;
      if (!login) continue;
      const cls = item?.cls || "";
      const chave = `${login}::${cls}`;
      if (!alvos.has(chave)) alvos.set(chave, { login: String(login), cls });
      if (alvos.size >= maxPerfis) break;
    }
    if (alvos.size >= maxPerfis || lista.length === 0) break;
  }
  return [...alvos.values()];
}

async function executarComConcorrencia(itens, limite, fn) {
  const resultados = [];
  let idx = 0;
  async function worker() {
    while (idx < itens.length) {
      const atual = itens[idx++];
      resultados.push(await fn(atual));
    }
  }
  await Promise.all(Array.from({ length: Math.min(limite, itens.length) }, () => worker()));
  return resultados;
}

function mediana(valores) {
  if (!valores.length) return 0;
  const ord = [...valores].sort((a, b) => a - b);
  const meio = Math.floor(ord.length / 2);
  return ord.length % 2 ? ord[meio] : (ord[meio - 1] + ord[meio]) / 2;
}

function arredondar3(v) {
  return Math.round(v * 1000) / 1000;
}

function obterAlvosPendentes() {
  const kinds = new Set();
  for (const [, cfg] of Object.entries(catalogoConjuntos)) {
    if (cfg.curvaReferencia) {
      kinds.add(cfg.armaKind);
      kinds.add(cfg.elmoKind);
      kinds.add(cfg.armaduraKind);
    }
  }
  const looks = new Set();
  for (const [look, cfg] of Object.entries(catalogoAneis)) {
    if (cfg.estimado) looks.add(Number(look));
  }
  return { kinds, looks };
}

function resumirAmostras(amostras, raridade) {
  const porStat = { atk: [], def: [], hp: [], crit: [], spd: [] };
  const niveis = [];
  for (const a of amostras) {
    const nv = Math.max(1, Number(a.itemLevel) || 1);
    niveis.push(nv);
    porStat.atk.push((Number(a.atk) || 0) / nv);
    porStat.def.push((Number(a.def) || 0) / nv);
    porStat.hp.push((Number(a.hp) || 0) / nv);
    porStat.crit.push((Number(a.crit) || 0) / nv);
    porStat.spd.push(Number(a.spd) || 0);
  }
  const nivelMin = Math.min(...niveis);
  const nivelMax = Math.max(...niveis);
  const provisoria = amostras.length < AMOSTRAS_MINIMAS_CONFIANCA;
  return {
    raridadeBase: raridade,
    raridadeNome: nomesRaridade[raridade] || `R${raridade}`,
    amostras: amostras.length,
    provisoria,
    nivelMin,
    nivelMax,
    curva: {
      atk: arredondar3(mediana(porStat.atk)),
      def: arredondar3(mediana(porStat.def)),
      hp: arredondar3(mediana(porStat.hp)),
      crit: arredondar3(mediana(porStat.crit)),
      spd: Math.round(mediana(porStat.spd)),
    },
  };
}

async function main() {
  const opcoes = analisarArgumentos(process.argv.slice(2));
  const pendentes = obterAlvosPendentes();

  if (!opcoes.json) {
    console.log(`Consultando ranking público (até ${opcoes.maxPerfis} perfis)...`);
  }
  const alvos = await coletarAlvos(opcoes.paginasRanking, opcoes.maxPerfis);
  if (!alvos.length) {
    throw new Error("Não foi possível obter perfis do ranking público.");
  }

  // Separa estritamente por (kind, rarity) e (look, rarity)
  const amostrasPorPeca = new Map();
  const amostrasPorAnel = new Map();
  let perfisValidos = 0;

  await executarComConcorrencia(alvos, opcoes.concorrencia, async ({ login, cls }) => {
    const qs = cls ? `?cls=${encodeURIComponent(cls)}` : "";
    const perfil = await buscarJson(`/api/profile/${encodeURIComponent(login)}${qs}`);
    if (!perfil || !Array.isArray(perfil.equipped)) return;
    perfisValidos++;
    for (const item of perfil.equipped) {
      if (!item || item.slot === "cosmetic" || !(item.itemLevel > 0) || !Number.isFinite(item.rarity)) continue;
      if (item.slot === "ring" && Number.isFinite(item.look)) {
        const chave = `${item.look}::${item.rarity}`;
        const lista = amostrasPorAnel.get(chave) || [];
        lista.push(item);
        amostrasPorAnel.set(chave, lista);
      } else if (item.kind) {
        const chave = `${item.kind}::${item.rarity}`;
        const lista = amostrasPorPeca.get(chave) || [];
        lista.push(item);
        amostrasPorPeca.set(chave, lista);
      }
    }
  });

  const relatorioPecas = [];
  const relatorioAneis = [];

  for (const [chave, lista] of [...amostrasPorPeca.entries()].sort()) {
    const [kind, rarStr] = chave.split("::");
    const raridade = Number(rarStr);
    if (opcoes.filtroKind && kind !== opcoes.filtroKind) continue;
    if (opcoes.filtroLook != null) continue;
    if (opcoes.alvo === "pendentes" && !opcoes.filtroKind && !pendentes.kinds.has(kind)) continue;
    relatorioPecas.push({
      kind,
      ...resumirAmostras(lista, raridade),
      escalaAtual: catalogoEscalasPecas[kind] || null,
    });
  }

  for (const [chave, lista] of [...amostrasPorAnel.entries()].sort()) {
    const [lookStr, rarStr] = chave.split("::");
    const look = Number(lookStr);
    const raridade = Number(rarStr);
    if (opcoes.filtroLook != null && look !== opcoes.filtroLook) continue;
    if (opcoes.filtroKind) continue;
    if (opcoes.alvo === "pendentes" && opcoes.filtroLook == null && !pendentes.looks.has(look)) continue;
    relatorioAneis.push({
      look,
      nome: catalogoAneis[look]?.nome || `Anel look ${look}`,
      ...resumirAmostras(lista, raridade),
      escalaAtual: catalogoAneis[look]?.escalaPorNivel || null,
    });
  }

  if (opcoes.json) {
    console.log(JSON.stringify({ perfisConsultados: alvos.length, perfisValidos, pecas: relatorioPecas, aneis: relatorioAneis }, null, 2));
    return;
  }

  console.log(`Perfis consultados: ${perfisValidos}/${alvos.length}`);
  if (relatorioPecas.length === 0 && relatorioAneis.length === 0) {
    console.log("Nenhuma amostra encontrada para os filtros selecionados.");
    if (opcoes.alvo === "pendentes") {
      console.log(`Alvos pendentes monitorados: ${pendentes.kinds.size} peças (${[...pendentes.kinds].slice(0, 6).join(", ")}...) e anéis [${[...pendentes.looks].join(", ")}].`);
    }
    return;
  }

  if (relatorioPecas.length > 0) {
    console.log("\n=== Curvas medidas de peças (separadas por raridade) ===");
    for (const r of relatorioPecas) {
      const c = r.curva;
      const selo = r.provisoria ? `PROVISÓRIA (<${AMOSTRAS_MINIMAS_CONFIANCA} amostras)` : "CALIBRADA";
      console.log(
        `  ${r.kind}: { raridadeBase: ${r.raridadeBase}, atk: ${c.atk}, def: ${c.def}, hp: ${c.hp}, crit: ${c.crit}, spd: ${c.spd} }, // [${selo}] ${r.raridadeNome} · ${r.amostras} amostra(s) · iLvl ${r.nivelMin}-${r.nivelMax}`
      );
    }
  }

  if (relatorioAneis.length > 0) {
    console.log("\n=== Curvas medidas de anéis (separadas por raridade) ===");
    for (const r of relatorioAneis) {
      const c = r.curva;
      const selo = r.provisoria ? `PROVISÓRIA (<${AMOSTRAS_MINIMAS_CONFIANCA} amostras)` : "CALIBRADA";
      console.log(
        `  // look ${r.look} (${r.nome}) [${selo}] ${r.raridadeNome} · ${r.amostras} amostra(s) · iLvl ${r.nivelMin}-${r.nivelMax}`
      );
      console.log(
        `  escalaPorNivel: { atk: ${c.atk}, def: ${c.def}, hp: ${c.hp}, crit: ${c.crit}, spd: ${c.spd} },`
      );
    }
  }
}

main().catch((erro) => {
  console.error("Erro ao calibrar curvas:", erro.message);
  process.exit(1);
});
