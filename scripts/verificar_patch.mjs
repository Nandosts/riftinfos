import fs from "node:fs";
import path from "node:path";
import {
  catalogoAneis,
  catalogoArmas,
  catalogoConjuntos,
  catalogoTemasZona,
  dadosClasses,
} from "../src/dados.mjs";
import {
  avaliarExpressaoSegura,
  exigirRegex,
  extrairBlocoBalanceado,
  obterBundleOficial,
} from "./lib/bundle_jogo.mjs";

const CAMINHO_REFERENCIA = path.join(process.cwd(), "scripts", ".ultimo_bundle_auditado.json");

function analisarArgumentos(argv) {
  const opcoes = { bundleLocal: null, salvarReferencia: false, json: false };
  for (const arg of argv) {
    if (arg.startsWith("--bundle=")) opcoes.bundleLocal = arg.slice("--bundle=".length);
    else if (arg === "--salvar-referencia") opcoes.salvarReferencia = true;
    else if (arg === "--json") opcoes.json = true;
    else if (arg === "--ajuda" || arg === "-h") {
      console.log(`Uso: node scripts/verificar_patch.mjs [opções]

Códigos de saída (iguais em texto e --json):
  0 = Nenhuma divergência encontrada
  2 = Divergência/novidade de patch detectada
  1 = Erro de leitura/rede ou âncora não reconhecida no bundle

Opções:
  --bundle=CAMINHO     Compara um bundle JS local em vez de baixar do site
  --salvar-referencia  Salva o hash/resumo atual em scripts/.ultimo_bundle_auditado.json
  --json               Imprime o relatório completo em JSON`);
      process.exit(0);
    } else {
      throw new Error(`Opção desconhecida: ${arg}`);
    }
  }
  return opcoes;
}

function parseBonusTexto(textoBonus) {
  const mapa = { Ataque: "atk", Vida: "hp", Defesa: "def", "Vel.": "spd", "Crítico": "crit" };
  const res = {};
  for (const parte of String(textoBonus || "").split(",")) {
    const m = parte.trim().match(/^\+(\d+(?:[.,]\d+)?)%\s+(.+)$/);
    if (!m) continue;
    const chave = mapa[m[2].trim()];
    if (!chave) continue;
    const num = Number(m[1].replace(",", "."));
    res[chave] = chave === "crit" ? num : Number((num / 100).toFixed(4));
  }
  return res;
}

function compararObjetosNumericos(a = {}, b = {}, tol = 0.0005) {
  const chaves = new Set([...Object.keys(a), ...Object.keys(b)]);
  const diffs = [];
  for (const k of chaves) {
    const va = Number(a[k] || 0);
    const vb = Number(b[k] || 0);
    if (Math.abs(va - vb) > tol) diffs.push(`${k}: local=${va} vs jogo=${vb}`);
  }
  return diffs;
}

function buscarConstanteNumerica(bundle, nome) {
  const escaped = nome.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const m = bundle.match(new RegExp(`(?:^|[,;\\s])${escaped}=(\\d+(?:\\.\\d+)?|\\.\\d+)(?=[,;\\s]|$)`));
  return m ? Number(m[1]) : null;
}

function auditarBundleContraLocal(bundle) {
  const alertas = [];
  const resumo = {};

  // 1. Constantes de combate (sem travar no valor atual na âncora!)
  const matchF8 = exigirRegex(bundle, /=\{skillCd:\d+(?:\.\d+)?,skillCdWarrior:/, "objeto tuning de combate");
  const tuningJogo = avaliarExpressaoSegura(extrairBlocoBalanceado(bundle, matchF8.index + 1));

  const matchSpeedBonus = exigirRegex(
    bundle,
    /speedBonus\(([A-Za-z_$][\w$]*)\)\{return\s+\1\.side==="hero"&&\1\.aspd>([A-Za-z_$][\w$]*)\?\1\.aspd\/\2:1\}/,
    "função speedBonus(e)"
  );
  const capAspdJogo = buscarConstanteNumerica(bundle, matchSpeedBonus[2]);
  if (capAspdJogo == null) {
    throw new Error(`Não foi possível ler o valor da constante de cap de ASPD (${matchSpeedBonus[2]}).`);
  }
  if (capAspdJogo !== 4.6) {
    alertas.push(`Cap de ASPD (speedBonus) mudou: local=4.6, jogo=${capAspdJogo}`);
  }

  const matchZonasUso = exigirRegex(bundle, /\(this\.zone-1\)%([A-Za-z_$][\w$]*)/, "módulo do ciclo de zonas");
  const qtdZonasJogo = buscarConstanteNumerica(bundle, matchZonasUso[1]);
  if (qtdZonasJogo == null) {
    throw new Error(`Não foi possível ler o valor da constante de zonas (${matchZonasUso[1]}).`);
  }

  resumo.zonasCiclo = { local: catalogoTemasZona.length, jogo: qtdZonasJogo };
  if (qtdZonasJogo !== catalogoTemasZona.length) {
    alertas.push(`Ciclo de zonas mudou: local=${catalogoTemasZona.length}, jogo=${qtdZonasJogo}`);
  }

  resumo.combate = {
    capAspd: capAspdJogo,
    skillCdMult: tuningJogo.skillCd,
    hitCapWarrior: tuningJogo.hitCapWarrior,
    hitCapCleric: tuningJogo.hitCapCleric,
    hitCapArcher: tuningJogo.hitCapArcher,
    rageInterval: tuningJogo.rageInterval,
    rageAtk: tuningJogo.rageAtk,
    rageDef: tuningJogo.rageDef,
  };
  for (const cls of ["Warrior", "Cleric", "Archer"]) {
    if (tuningJogo[`hitCap${cls}`] !== 0.6) {
      alertas.push(`hitCap${cls} mudou para ${tuningJogo[`hitCap${cls}`]} (esperado 0.6)`);
    }
  }
  if (tuningJogo.skillCd !== 1.5) {
    alertas.push(`tuning.skillCd mudou para ${tuningJogo.skillCd} (esperado 1.5)`);
  }

  // 2. Classes (Ke)
  const matchKe = exigirRegex(bundle, /=\{warrior:\{label:"Guerreiro"/, "dados das classes");
  const classesJogo = avaliarExpressaoSegura(extrairBlocoBalanceado(bundle, matchKe.index + 1));
  for (const [cls, infoJogo] of Object.entries(classesJogo)) {
    const local = dadosClasses[cls];
    if (!local) {
      alertas.push(`Nova classe detectada no jogo: ${cls}`);
      continue;
    }
    if (infoJogo.skillCd !== local.cdBaseSkill) {
      alertas.push(`CD base da skill de ${cls} mudou: local=${local.cdBaseSkill}, jogo=${infoJogo.skillCd}`);
    }
    for (const stat of ["hp", "atk", "def", "aspd"]) {
      if (infoJogo.base[stat] !== local.base[stat]) {
        alertas.push(`Base ${cls}.${stat} mudou: local=${local.base[stat]}, jogo=${infoJogo.base[stat]}`);
      }
    }
  }

  // 3. Conjuntos oficiais (Qs)
  const matchQs = exigirRegex(bundle, /=\{berserker:\{name:"Fúria do Berserker"/, "catálogo oficial de conjuntos");
  const conjuntosJogo = avaliarExpressaoSegura(extrairBlocoBalanceado(bundle, matchQs.index + 1));
  const novosConjuntos = [];
  const conjuntosAlterados = [];
  for (const [key, infoJogo] of Object.entries(conjuntosJogo)) {
    const local = catalogoConjuntos[key];
    if (!local) {
      novosConjuntos.push(`${key} (${infoJogo.name} · ${infoJogo.cls})`);
      continue;
    }
    const diffB2 = compararObjetosNumericos(local.b2, parseBonusTexto(infoJogo.b2));
    const diffB3 = compararObjetosNumericos(local.b3, parseBonusTexto(infoJogo.b3));
    if (diffB2.length || diffB3.length) {
      conjuntosAlterados.push(`${key}: ${[...diffB2.map((d) => `b2.${d}`), ...diffB3.map((d) => `b3.${d}`)].join(", ")}`);
    }
  }
  for (const key of Object.keys(catalogoConjuntos)) {
    if (!conjuntosJogo[key]) alertas.push(`Conjunto local '${key}' não encontrado no bundle do jogo`);
  }
  if (novosConjuntos.length) alertas.push(`Novos conjuntos no jogo (${novosConjuntos.length}): ${novosConjuntos.join(", ")}`);
  if (conjuntosAlterados.length) alertas.push(`Bônus de conjuntos divergentes:\n  - ${conjuntosAlterados.join("\n  - ")}`);
  resumo.conjuntos = { local: Object.keys(catalogoConjuntos).length, jogo: Object.keys(conjuntosJogo).length, novos: novosConjuntos };

  // 4. Passivas periódicas de armas (sem travar em every:12,dur:4)
  const matchRs = exigirRegex(bundle, /=\{tempbow:\{every:\d+(?:\.\d+)?,dur:\d+(?:\.\d+)?\}/, "tabela de recargas das armas");
  const passivasJogo = avaliarExpressaoSegura(extrairBlocoBalanceado(bundle, matchRs.index + 1));
  const novasPassivas = [];
  const recargasAlteradas = [];
  for (const [kind, cfg] of Object.entries(passivasJogo)) {
    const local = catalogoArmas[kind];
    if (!local) {
      novasPassivas.push(`${kind} (cada ${cfg.every}s)`);
    } else if (local.efeito?.cada && local.efeito.cada !== cfg.every) {
      recargasAlteradas.push(`${kind}: local=${local.efeito.cada}s vs jogo=${cfg.every}s`);
    }
  }
  if (novasPassivas.length) alertas.push(`Novas armas com passiva periódica: ${novasPassivas.join(", ")}`);
  if (recargasAlteradas.length) alertas.push(`Recargas periódicas divergentes: ${recargasAlteradas.join(", ")}`);
  resumo.passivasArmas = { jogo: Object.keys(passivasJogo).length, novas: novasPassivas, divergentes: recargasAlteradas };

  // 5. Anéis Imortais e Arcanos
  const matchSb = exigirRegex(bundle, /=\[\{look:10,name:/, "lista de anéis Imortais");
  const aneisImo = avaliarExpressaoSegura(extrairBlocoBalanceado(bundle, matchSb.index + 1, "[", "]"));
  const matchQ0 = exigirRegex(bundle, /=\[\{look:14,name:/, "lista de anéis Arcanos");
  const aneisArc = avaliarExpressaoSegura(extrairBlocoBalanceado(bundle, matchQ0.index + 1, "[", "]"));
  const todosAneis = [...aneisImo, ...aneisArc];
  const novosAneis = [];
  for (const anel of todosAneis) {
    if (!catalogoAneis[anel.look]) {
      novosAneis.push(`look ${anel.look} (${anel.name})`);
    }
  }
  if (novosAneis.length) alertas.push(`Novos anéis no jogo: ${novosAneis.join(", ")}`);
  resumo.aneisEspeciais = { jogo: todosAneis.length, novos: novosAneis };

  // 6. Calibração pendente
  const pendentesCurva = Object.entries(catalogoConjuntos)
    .filter(([, c]) => Boolean(c.curvaReferencia))
    .map(([k, c]) => `${k} (ref: ${c.curvaReferencia})`);
  const aneisEstimados = Object.entries(catalogoAneis)
    .filter(([, a]) => Boolean(a.estimado))
    .map(([look, a]) => `look ${look} (${a.nome})`);
  resumo.calibracaoPendente = { conjuntos: pendentesCurva, aneis: aneisEstimados };

  return { resumo, alertas };
}

async function main() {
  const opcoes = analisarArgumentos(process.argv.slice(2));
  const { origem, asset, codigo } = await obterBundleOficial(opcoes.bundleLocal);
  const { resumo, alertas } = auditarBundleContraLocal(codigo);

  let refAnterior = null;
  if (fs.existsSync(CAMINHO_REFERENCIA)) {
    try {
      refAnterior = JSON.parse(fs.readFileSync(CAMINHO_REFERENCIA, "utf8"));
    } catch {
      refAnterior = null;
    }
  }

  const assetMudou = refAnterior ? refAnterior.asset !== asset : null;

  if (opcoes.salvarReferencia) {
    const payload = {
      atualizadoEm: new Date().toISOString(),
      asset,
      tamanhoBytes: codigo.length,
      resumo,
    };
    fs.writeFileSync(CAMINHO_REFERENCIA, JSON.stringify(payload, null, 2) + "\n", "utf8");
  }

  if (opcoes.json) {
    console.log(JSON.stringify({ origem, asset, tamanhoBytes: codigo.length, assetMudou, alertas, resumo }, null, 2));
  } else {
    console.log(`Bundle vivo: ${asset} (${codigo.length.toLocaleString("pt-BR")} bytes)`);
    if (refAnterior) {
      console.log(
        assetMudou
          ? `⚡ NOVO BUILD DETECTADO! Anterior: ${refAnterior.asset} → Atual: ${asset}`
          : `✓ Mesmo build da última referência (${refAnterior.asset}).`
      );
    } else {
      console.log("ℹ️ Sem referência salva ainda. Use --salvar-referencia para gravar o build atual.");
    }

    console.log(
      `Resumo: ${resumo.zonasCiclo.jogo} zonas | ${resumo.conjuntos.jogo} conjuntos | ${resumo.passivasArmas.jogo} passivas de arma | ${resumo.aneisEspeciais.jogo} anéis especiais`
    );

    if (alertas.length === 0) {
      console.log("✅ Nenhuma divergência estrutural entre o bundle do jogo e src/dados.mjs!");
    } else {
      console.log(`\n⚠️ ${alertas.length} ponto(s) para revisar:`);
      for (const a of alertas) console.log(`- ${a}`);
    }

    if (resumo.calibracaoPendente.conjuntos.length || resumo.calibracaoPendente.aneis.length) {
      console.log("\n📊 Calibração de atributos ainda pendente (use npm run calibrar:curvas):");
      if (resumo.calibracaoPendente.conjuntos.length) {
        console.log(`  Conjuntos: ${resumo.calibracaoPendente.conjuntos.join(", ")}`);
      }
      if (resumo.calibracaoPendente.aneis.length) {
        console.log(`  Anéis: ${resumo.calibracaoPendente.aneis.join(", ")}`);
      }
    }
  }

  // Mesmo código de saída em texto e JSON
  if (alertas.length > 0) process.exitCode = 2;
}

main().catch((erro) => {
  console.error("Erro ao verificar patch:", erro.message);
  process.exit(1);
});
