import {
  calcularFc,
  calcularMetricasCombate,
  calcularStatusSimulados,
} from "../src/combate.mjs";
import {
  catalogoAneis,
  catalogoConjuntos,
  nomesClasses,
} from "../src/dados.mjs";
import {
  aplicarAtributosPadraoNoItem,
  criarGemaPreset,
  limitarTierGema,
} from "../src/simulador/estado.mjs";

const OBJETIVOS_VALIDOS = new Set(["fc", "dps", "cura", "escudo-aurora", "resistencia-fisica"]);

function analisarArgumentos(argv) {
  const opcoes = {
    classe: "cleric",
    objetivo: "escudo-aurora",
    nivel: 750,
    ilvl: 300,
    pontos: null,
    vitMinPct: 20,
    tierGema: 5,
    top: 5,
    raridadeMin: 6,
    json: false,
  };
  for (const arg of argv) {
    if (arg.startsWith("--classe=")) opcoes.classe = arg.slice("--classe=".length);
    else if (arg.startsWith("--objetivo=")) opcoes.objetivo = arg.slice("--objetivo=".length);
    else if (arg.startsWith("--nivel=")) opcoes.nivel = Math.max(1, Math.trunc(Number(arg.slice("--nivel=".length)) || 750));
    else if (arg.startsWith("--ilvl=")) opcoes.ilvl = Math.max(1, Math.trunc(Number(arg.slice("--ilvl=".length)) || 300));
    else if (arg.startsWith("--pontos=")) opcoes.pontos = Math.max(1, Math.trunc(Number(arg.slice("--pontos=".length)) || 750));
    else if (arg.startsWith("--vit-min=")) opcoes.vitMinPct = Math.max(0, Math.min(100, Number(arg.slice("--vit-min=".length)) || 0));
    else if (arg.startsWith("--tier-gema=")) opcoes.tierGema = Math.max(1, Math.min(6, Math.trunc(Number(arg.slice("--tier-gema=".length)) || 5)));
    else if (arg.startsWith("--top=")) opcoes.top = Math.max(1, Math.min(20, Math.trunc(Number(arg.slice("--top=".length)) || 5)));
    else if (arg.startsWith("--raridade-min=")) opcoes.raridadeMin = Math.trunc(Number(arg.slice("--raridade-min=".length)) || 4);
    else if (arg === "--json") opcoes.json = true;
    else if (arg === "--ajuda" || arg === "-h") {
      console.log(`Uso: node scripts/otimizar_build.mjs [opções]

Testa combinações de conjuntos, anéis, gemas e distribuição de atributos
usando o motor real de src/combate.mjs.

Opções:
  --classe=warrior|cleric|archer       Classe simulada (padrão: cleric)
  --objetivo=fc|dps|cura|escudo-aurora|resistencia-fisica
                                       Métrica maximizada (padrão: escudo-aurora)
  --nivel=N                            Nível do personagem (padrão: 750)
  --ilvl=N                             Nível dos itens (padrão: 300)
  --pontos=N                           Total exato de pontos de atributo (padrão: igual ao nível)
  --vit-min=PCT                        % mínima de pontos em VIT (padrão: 20)
  --tier-gema=1..6                     Tier máximo de gema (padrão: 5)
  --raridade-min=3|4|6|7               Raridade mínima dos conjuntos (padrão: 6)
  --top=N                              Quantas builds listar (padrão: 5)
  --json                               Saída em JSON`);
      process.exit(0);
    } else {
      throw new Error(`Opção desconhecida: ${arg}`);
    }
  }
  if (!nomesClasses[opcoes.classe]) {
    throw new Error(`Classe inválida: "${opcoes.classe}". Use: ${Object.keys(nomesClasses).join(", ")}.`);
  }
  if (!OBJETIVOS_VALIDOS.has(opcoes.objetivo)) {
    const dica = opcoes.objetivo === "sobrevivencia"
      ? ' Use "resistencia-fisica" (mede EHP contra dano físico).'
      : "";
    throw new Error(`Objetivo inválido: "${opcoes.objetivo}". Valores aceitos: ${[...OBJETIVOS_VALIDOS].join(", ")}.${dica}`);
  }
  if ((opcoes.objetivo === "cura" || opcoes.objetivo === "escudo-aurora") && opcoes.classe !== "cleric") {
    throw new Error(`O objetivo "${opcoes.objetivo}" é exclusivo da classe "cleric".`);
  }
  if (opcoes.pontos == null) opcoes.pontos = opcoes.nivel;
  return opcoes;
}

const PERFIS_GEMAS = [
  { nome: "Esm+Ame(Anel)", porSlot: (s) => (s === "ring" ? "amethyst" : "emerald") },
  { nome: "Topázio", porSlot: () => "topaz" },
  { nome: "Rubi", porSlot: () => "ruby" },
  { nome: "Esmeralda", porSlot: () => "emerald" },
  { nome: "Safira+Ame", porSlot: (s) => (s === "ring" ? "amethyst" : "sapphire") },
  { nome: "Ametista", porSlot: () => "amethyst" },
];

function criarItem(base, ilvl, perfilGema, tierMax) {
  const item = {
    ...base,
    itemLevel: ilvl,
    sockets: ({ 3: 3, 4: 4, 6: 5, 7: 6 })[base.rarity] ?? 2,
  };
  aplicarAtributosPadraoNoItem(item);
  const tier = limitarTierGema(tierMax, item.rarity);
  item.gems = Array.from({ length: item.sockets }, () =>
    criarGemaPreset(perfilGema.porSlot(item.slot), item.slot, tier, ilvl, 1)
  );
  return item;
}

/**
 * Aloca exatamente `pontos` inteiros respeitando `vit >= vitMin`, usando o método
 * dos maiores restos sobre os pesos de cada atributo.
 */
function alocarPontosExatos(pontos, vitMin, pesos) {
  const vitBase = Math.min(pontos, Math.max(0, vitMin));
  const saldo = pontos - vitBase;
  const chaves = ["str", "agi", "vit", "def", "luk"];
  const somaPesos = chaves.reduce((acc, k) => acc + Math.max(0, pesos[k] || 0), 0);

  const aloc = { str: 0, agi: 0, vit: vitBase, def: 0, luk: 0 };
  if (saldo > 0 && somaPesos > 0) {
    const restos = [];
    let distribuido = 0;
    for (const k of chaves) {
      const exato = (saldo * Math.max(0, pesos[k] || 0)) / somaPesos;
      const inteiro = Math.floor(exato);
      aloc[k] += inteiro;
      distribuido += inteiro;
      restos.push({ chave: k, fracao: exato - inteiro });
    }
    restos.sort((a, b) => b.fracao - a.fracao);
    let sobra = saldo - distribuido;
    for (let i = 0; i < sobra; i++) {
      aloc[restos[i % restos.length].chave]++;
    }
  } else if (saldo > 0) {
    aloc.vit += saldo;
  }

  const totalFinal = aloc.str + aloc.agi + aloc.vit + aloc.def + aloc.luk;
  if (totalFinal !== pontos || aloc.vit < vitBase) {
    throw new Error(`Erro interno de alocação: total=${totalFinal} (esperado ${pontos}), vit=${aloc.vit} (mín ${vitBase})`);
  }
  return aloc;
}

function gerarDistribuicoes(objetivo, pontos, vitMinPct) {
  const vitMin = Math.ceil((pontos * vitMinPct) / 100);
  const perfis = [];

  if (objetivo === "cura" || objetivo === "escudo-aurora") {
    for (const fracStr of [0.4, 0.5, 0.52, 0.6, 0.75, 1]) {
      perfis.push({ str: fracStr, agi: 1 - fracStr, vit: 0, def: 0, luk: 0 });
    }
  } else if (objetivo === "dps") {
    for (const [str, agi, luk] of [[0.45, 0.45, 0.1], [0.4, 0.4, 0.2], [0.5, 0.4, 0.1], [0.35, 0.35, 0.3], [0.5, 0.5, 0]]) {
      perfis.push({ str, agi, vit: 0, def: 0, luk });
    }
  } else if (objetivo === "resistencia-fisica") {
    for (const [vit, def, str] of [[0.7, 0.3, 0], [0.85, 0.15, 0], [1, 0, 0], [0.6, 0.4, 0], [0.5, 0.5, 0], [0.6, 0.2, 0.2]]) {
      perfis.push({ str, agi: 0, vit, def, luk: 0 });
    }
  } else {
    // FC: equilibra DPS * EHP respeitando vitMin
    for (const [str, agi, vit, def, luk] of [
      [0.2, 0.2, 0.2, 0.2, 0.2],
      [0.25, 0.25, 0.25, 0.25, 0],
      [0.28, 0.22, 0.26, 0.18, 0.06],
      [0.22, 0.28, 0.25, 0.15, 0.1],
      [0.3, 0.2, 0.3, 0.2, 0],
    ]) {
      // Calcula quanto VIT extra acima de vitMin esse perfil deseja
      const vitExtra = Math.max(0, Math.round(pontos * vit) - vitMin);
      const outrosPesos = { str, agi, vit: 0, def, luk };
      const somaOutros = str + agi + def + luk;
      const pesoVitNoSaldo = somaOutros > 0 && pontos > vitMin ? (vitExtra / Math.max(1, pontos - vitMin)) * somaOutros : 0;
      perfis.push({ ...outrosPesos, vit: pesoVitNoSaldo });
    }
  }

  return perfis.map((p) => alocarPontosExatos(pontos, vitMin, p));
}

function montarCandidatos(opcoes) {
  const conjuntosClasse = Object.entries(catalogoConjuntos).filter(
    ([, c]) => c.classe === opcoes.classe && c.raridadePadrao >= opcoes.raridadeMin
  );
  const candidatos = [];

  if (opcoes.objetivo === "escudo-aurora") {
    const dawn = catalogoConjuntos.dawn;
    candidatos.push({
      rotulo: "Serafim da Aurora 3/3 (Lendário)",
      pecas: [
        { slot: "weapon", kind: dawn.armaKind, name: dawn.armaNome, rarity: 4, set: "dawn" },
        { slot: "helmet", kind: dawn.elmoKind, name: dawn.elmoNome, rarity: 4, set: "dawn" },
        { slot: "armor", kind: dawn.armaduraKind, name: dawn.armaduraNome, rarity: 4, set: "dawn" },
      ],
    });
    for (const [key, cfg] of conjuntosClasse) {
      candidatos.push({
        rotulo: `2/3 ${cfg.nome} + Cetro da Aurora`,
        pecas: [
          { slot: "weapon", kind: "dawnscepter", name: "Cetro da Aurora", rarity: 4, set: "dawn" },
          { slot: "helmet", kind: cfg.elmoKind, name: cfg.elmoNome, rarity: cfg.raridadePadrao, set: key },
          { slot: "armor", kind: cfg.armaduraKind, name: cfg.armaduraNome, rarity: cfg.raridadePadrao, set: key },
        ],
      });
    }
  } else {
    for (const [key, cfg] of conjuntosClasse) {
      candidatos.push({
        rotulo: `${cfg.nome} 3/3`,
        pecas: [
          { slot: "weapon", kind: cfg.armaKind, name: cfg.armaNome, rarity: cfg.raridadePadrao, set: key },
          { slot: "helmet", kind: cfg.elmoKind, name: cfg.elmoNome, rarity: cfg.raridadePadrao, set: key },
          { slot: "armor", kind: cfg.armaduraKind, name: cfg.armaduraNome, rarity: cfg.raridadePadrao, set: key },
        ],
      });
    }
  }
  return candidatos;
}

function main() {
  const opcoes = analisarArgumentos(process.argv.slice(2));
  const candidatos = montarCandidatos(opcoes);
  const aneis = [14, 15, 16, 17, 18, 19].filter((look) => catalogoAneis[look]);
  const distribuicoes = gerarDistribuicoes(opcoes.objetivo, opcoes.pontos, opcoes.vitMinPct);

  const resultados = [];

  for (const cand of candidatos) {
    let melhorDoConjunto = null;
    for (const look of aneis) {
      const anelInfo = catalogoAneis[look];
      for (const perfilGema of PERFIS_GEMAS) {
        const itens = [
          ...cand.pecas.map((p) => criarItem(p, opcoes.ilvl, perfilGema, opcoes.tierGema)),
          criarItem({ slot: "ring", kind: "ring", name: anelInfo.nome, rarity: anelInfo.raridadeMin, look }, opcoes.ilvl, perfilGema, opcoes.tierGema),
        ];
        for (const attrs of distribuicoes) {
          const st = calcularStatusSimulados(opcoes.classe, opcoes.nivel, attrs, itens);
          const fc = calcularFc(opcoes.classe, st);
          const met = calcularMetricasCombate(opcoes.classe, opcoes.nivel, st, itens);
          const poderCura = opcoes.classe === "cleric" ? Math.round(met.healPower) : 0;
          const escudoAurora = Math.round(met.escudoAurora);
          const ehp = Math.round(met.ehp);

          let pontuacao = fc;
          if (opcoes.objetivo === "dps") pontuacao = met.dpsCombateMedio;
          else if (opcoes.objetivo === "cura") pontuacao = poderCura;
          else if (opcoes.objetivo === "escudo-aurora") pontuacao = escudoAurora;
          else if (opcoes.objetivo === "resistencia-fisica") pontuacao = ehp;

          if (!melhorDoConjunto || pontuacao > melhorDoConjunto.pontuacao) {
            melhorDoConjunto = {
              build: cand.rotulo,
              anel: anelInfo.nome,
              gemas: perfilGema.nome,
              atributos: attrs,
              totalPontos: attrs.str + attrs.agi + attrs.vit + attrs.def + attrs.luk,
              pontuacao: Math.round(pontuacao),
              fc,
              dps: Math.round(met.dpsCombateMedio),
              hp: st.maxHp,
              def: Math.round(st.def),
              atk: Math.round(st.atk),
              aspd: st.aspd,
              poderCura,
              escudoAurora,
              ehp,
            };
          }
        }
      }
    }
    if (melhorDoConjunto) resultados.push(melhorDoConjunto);
  }

  resultados.sort((a, b) => b.pontuacao - a.pontuacao);
  const top = resultados.slice(0, opcoes.top);

  if (opcoes.json) {
    console.log(JSON.stringify({ opcoes, top }, null, 2));
    return;
  }

  const fmt = (n) => Math.round(n).toLocaleString("pt-BR");
  console.log(
    `Otimizador · ${nomesClasses[opcoes.classe]} Nv.${opcoes.nivel} · iLvl ${opcoes.ilvl} · ${opcoes.pontos} pts (VIT mín. ${opcoes.vitMinPct}%) · Gemas T${opcoes.tierGema} · Objetivo: ${opcoes.objetivo.toUpperCase()}`
  );
  if (opcoes.objetivo === "resistencia-fisica") {
    console.log("Nota: resistência física classifica por EHP (HP × (1 + DEF × 0,04)); não modela dano verdadeiro/DoT (sangramento, poça ou vapor).");
  }
  console.log("");
  top.forEach((r, idx) => {
    const a = r.atributos;
    const destaque =
      opcoes.objetivo === "escudo-aurora" ? `Escudo: ${fmt(r.escudoAurora)} (Cura: ${fmt(r.poderCura)})`
        : opcoes.objetivo === "cura" ? `Poder de Cura: ${fmt(r.poderCura)}`
          : opcoes.objetivo === "dps" ? `DPS: ${fmt(r.dps)}/s`
            : opcoes.objetivo === "resistencia-fisica" ? `EHP físico: ${fmt(r.ehp)} (HP ${fmt(r.hp)} / DEF ${fmt(r.def)})`
              : `FC: ${fmt(r.fc)}`;
    console.log(`${idx + 1}. ${r.build} + ${r.anel}`);
    console.log(`   ${destaque} | Gemas: ${r.gemas} | STR ${a.str} / AGI ${a.agi} / VIT ${a.vit} / DEF ${a.def} / LUK ${a.luk} (total ${r.totalPontos})`);
    console.log(`   HP ${fmt(r.hp)} · ATK ${fmt(r.atk)} · DEF ${fmt(r.def)} · ASPD ${r.aspd.toFixed(1)} · FC ${fmt(r.fc)}`);
  });
}

main();
