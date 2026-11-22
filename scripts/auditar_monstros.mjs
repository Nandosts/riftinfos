import { catalogoTemasZona } from "../src/dados.mjs";
import { extrairBlocoBalanceado, obterBundleOficial } from "./lib/bundle_jogo.mjs";

const ID = "[A-Za-z_$][\\w$]*";
const NUM = "(?:\\d+(?:\\.\\d+)?|\\.\\d+)";

function analisarArgumentos(argv) {
  const opcoes = { bundleLocal: null, json: false };
  for (const arg of argv) {
    if (arg.startsWith("--bundle=")) opcoes.bundleLocal = arg.slice("--bundle=".length);
    else if (arg === "--json") opcoes.json = true;
    else if (arg === "--ajuda" || arg === "-h") {
      console.log(`Uso: node scripts/auditar_monstros.mjs [opções]

Audita fórmulas de escala de onda, chefes e lacaios de src/dados.mjs
contra o bundle oficial do RiftStream.

Códigos de saída (iguais em texto e --json):
  0 = Tudo alinhado
  2 = Regra do jogo diverge do catálogo local
  1 = Parser não reconheceu o formato do bundle (ex.: mudança de minificação/estrutura)

Opções:
  --bundle=CAMINHO  Usa um arquivo JS local em vez de baixar de riftstream.com.br
  --json            Imprime o relatório em JSON`);
      process.exit(0);
    } else {
      throw new Error(`Opção desconhecida: ${arg}`);
    }
  }
  return opcoes;
}

function buscarConstanteNumerica(bundle, nome) {
  const esc = nome.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const m = bundle.match(new RegExp(`(?:^|[,;\\s])${esc}=(${NUM})(?=[,;\\s]|$)`));
  return m ? Number(m[1]) : null;
}

function resolverValorNumerico(bundle, token) {
  if (token == null) return null;
  if (new RegExp(`^${NUM}$`).test(token)) return Number(token);
  return buscarConstanteNumerica(bundle, token);
}

function extrairFuncaoNomeada(bundle, nome, descricao) {
  const esc = nome.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return extrairMetodo(bundle, new RegExp(`function\\s+${esc}\\([^)]*\\)\\{`), descricao);
}

function extrairMetodo(bundle, assinaturaRegex, descricao) {
  const m = bundle.match(assinaturaRegex);
  if (!m) return { erroParser: `Método não localizado no bundle: ${descricao}`, corpo: null };
  const idxChave = bundle.indexOf("{", m.index);
  return { erroParser: null, corpo: extrairBlocoBalanceado(bundle, idxChave) };
}

function auditarFormulaOnda(bundle) {
  const errosParser = [];
  const divergencias = [];

  const fnMatch = bundle.match(new RegExp(`function\\s+${ID}\\(${ID},${ID},${ID}\\)\\{const\\s+${ID}=${ID}==="boss"`));
  if (!fnMatch) {
    errosParser.push("Função de escala base de inimigos (f0) não localizada no bundle.");
    return { errosParser, divergencias };
  }
  const idxChave = bundle.indexOf("{", fnMatch.index);
  const corpoF0 = extrairBlocoBalanceado(bundle, idxChave);

  const checarValor = (rotulo, atual, esperado) => {
    if (atual == null || Number.isNaN(atual)) {
      errosParser.push(`Não foi possível resolver valor numérico de ${rotulo}.`);
      return;
    }
    if (Math.abs(atual - esperado) > 1e-6) {
      divergencias.push(`${rotulo}: local=${esperado}, jogo=${atual}`);
    }
  };

  const checarNumero = (rotulo, regex, esperado) => {
    const m = corpoF0.match(regex);
    if (!m) {
      errosParser.push(`Não foi possível extrair ${rotulo} em f0.`);
      return;
    }
    checarValor(rotulo, Number(m[1]), esperado);
  };

  checarNumero("multParty (+2,5%/herói)", new RegExp(`\\(1\\+(${NUM})\\*${ID}\\)`), 0.025);
  checarNumero("defMult (+0,35/onda)", new RegExp(`1\\+\\(${ID}-1\\)\\*(${NUM})`), 0.35);
  checarNumero("skeleton.hp base", new RegExp(`"skeleton"\\?\\{hp:(${NUM})\\*`), 30);
  checarNumero("skeleton.atk base", new RegExp(`"skeleton"\\?\\{hp:${NUM}\\*${ID},atk:(${NUM})\\*`), 5);
  checarNumero("skeleton.def base", new RegExp(`"skeleton"\\?\\{hp:${NUM}\\*${ID},atk:${NUM}\\*${ID},def:(${NUM})\\*`), 1);
  checarNumero("goblin.hp base", new RegExp(`"goblin"\\?\\{hp:(${NUM})\\*`), 20);
  checarNumero("goblin.atk base", new RegExp(`"goblin"\\?\\{hp:${NUM}\\*${ID},atk:(${NUM})\\*`), 4.5);
  checarNumero("goblin.def base", new RegExp(`"goblin"\\?\\{hp:${NUM}\\*${ID},atk:${NUM}\\*${ID},def:(${NUM})\\*`), 0.5);
  checarNumero("boss.hp base", new RegExp(`:\\{hp:(${NUM})\\*`), 360);
  checarNumero("boss.def base", new RegExp(`:\\{hp:${NUM}\\*${ID},atk:[^,]+,def:(${NUM})\\*`), 3);

  // Resolve funções de curva de onda referenciadas por f0 (sem depender de nomes minificados)
  const VAL = `(?:${NUM}|${ID})`;
  const matchFnHp = corpoF0.match(new RegExp(`\\(${ID}\\?(${ID})\\(${ID}\\):(${ID})\\(${ID}\\)\\)\\*\\(1\\+${NUM}\\*${ID}\\)`));
  const matchFnAtk = corpoF0.match(new RegExp(`=${ID}\\?(${ID})\\(${ID}\\):(${ID})\\(${ID}\\)`));

  const auditarCurvaBase = (rotulo, fnNome, esperado) => {
    const fn = extrairFuncaoNomeada(bundle, fnNome, rotulo);
    if (fn.erroParser) {
      errosParser.push(fn.erroParser);
      return;
    }
    const mPow = fn.corpo.match(new RegExp(`Math\\.pow\\((${VAL}),`));
    if (!mPow) {
      errosParser.push(`Não foi possível extrair Math.pow(...) em ${rotulo} (${fnNome}).`);
      return;
    }
    checarValor(rotulo, resolverValorNumerico(bundle, mPow[1]), esperado);
  };

  const auditarCurvaChefe = (rotulo, fnNome, esperadoPos70, esperadoMult100) => {
    const fn = extrairFuncaoNomeada(bundle, fnNome, rotulo);
    if (fn.erroParser) {
      errosParser.push(fn.erroParser);
      return;
    }
    const mCorte70 = fn.corpo.match(new RegExp(`${ID}<=(${VAL})\\?`));
    const mFatorPos70 = fn.corpo.match(new RegExp(`Math\\.pow\\((${VAL}),${ID}-${VAL}\\)`));
    const mCorte100 = fn.corpo.match(new RegExp(`${ID}>=(${VAL})\\?${ID}\\*(${VAL}):${ID}`));

    if (!mCorte70) errosParser.push(`Não foi possível extrair limiar pós-70 em ${rotulo} (${fnNome}).`);
    else checarValor(`${rotulo} (limiar onda 70)`, resolverValorNumerico(bundle, mCorte70[1]), 70);

    if (!mFatorPos70) errosParser.push(`Não foi possível extrair fator pós-70 em ${rotulo} (${fnNome}).`);
    else checarValor(`${rotulo} (fator pós-70)`, resolverValorNumerico(bundle, mFatorPos70[1]), esperadoPos70);

    if (!mCorte100) errosParser.push(`Não foi possível extrair redução onda >=100 em ${rotulo} (${fnNome}).`);
    else {
      checarValor(`${rotulo} (limiar onda 100)`, resolverValorNumerico(bundle, mCorte100[1]), 100);
      checarValor(`${rotulo} (mult onda >=100)`, resolverValorNumerico(bundle, mCorte100[2]), esperadoMult100);
    }
  };

  if (!matchFnHp) {
    errosParser.push("Não foi possível identificar funções de curva de HP (normal/chefe) em f0.");
  } else {
    auditarCurvaBase("curva base HP/onda", matchFnHp[2], 1.105);
    auditarCurvaChefe("curva chefe HP", matchFnHp[1], 1.085, 0.8);
  }

  if (!matchFnAtk) {
    errosParser.push("Não foi possível identificar funções de curva de ATK (normal/chefe) em f0.");
  } else {
    auditarCurvaBase("curva base ATK/onda", matchFnAtk[2], 1.075);
    auditarCurvaChefe("curva chefe ATK", matchFnAtk[1], 1.055, 0.85);
  }

  return { errosParser, divergencias };
}

function auditarSpawnESteam(bundle) {
  const errosParser = [];
  const divergencias = [];
  let regrasVerificadas = 0;

  const spawn = extrairMetodo(bundle, /spawnEnemy\([^)]*\)\{/, "spawnEnemy");
  const steam = extrairMetodo(bundle, /steamSetup\([^)]*\)\{/, "steamSetup");
  const train = extrairMetodo(bundle, /trainCast\([^)]*\)\{/, "trainCast");

  for (const res of [spawn, steam, train]) {
    if (res.erroParser) errosParser.push(res.erroParser);
  }
  if (!spawn.corpo || !steam.corpo || !train.corpo) {
    return { errosParser, divergencias, regrasVerificadas };
  }

  function checar(temaIdx, alvo, fonte, regex, conferirValores) {
    regrasVerificadas++;
    const m = fonte.match(regex);
    if (!m) {
      errosParser.push(`[${catalogoTemasZona[temaIdx].nome}] Parser não reconheceu trecho de ${alvo}`);
      return;
    }
    const diff = conferirValores(m.slice(1).map(Number), catalogoTemasZona[temaIdx]);
    if (diff) {
      divergencias.push(`[${catalogoTemasZona[temaIdx].nome}] ${alvo}: ${diff}`);
    }
  }

  // Regexes independentes dos nomes minificados das variáveis (ID)
  const hpMul = `${ID}\\.hp\\*=(${NUM})`;
  const defMul = `${ID}\\.def\\*=(${NUM})`;
  const atkMul = `${ID}\\.atk\\*=(${NUM})`;
  const spdMul = `${ID}\\.speed\\*=(${NUM})`;

  checar(0, "Colosso Rúnico", spawn.corpo, new RegExp(`${ID}==="boss"\\?this\\.rng\\.next\\(\\)<${NUM}&&\\(${ID}\\.sub=1,${hpMul},${defMul},${atkMul},${spdMul}\\)`), ([hp, def, atk], t) => {
    const a = t.varianteAlternativa;
    return a.multHp === hp && a.multDef === def && a.multAtk === atk ? null : `local=(${a.multHp}/${a.multDef}/${a.multAtk}) vs jogo=(${hp}/${def}/${atk})`;
  });
  checar(0, "Gárgula de Pedra", spawn.corpo, new RegExp(`ruinsCount\\[0\\]\\+\\+%3===2&&\\(${ID}\\.sub=1,${hpMul},${defMul},${atkMul}`), ([hp, def], t) => {
    const m = t.lacaios.find((x) => x.nome === "Gárgula de Pedra")?.escalaOnda;
    return m?.multHp === hp && m?.multDef === def ? null : `local=(${m?.multHp}/${m?.multDef}) vs jogo=(${hp}/${def})`;
  });
  checar(0, "Espectro das Ruínas", spawn.corpo, new RegExp(`ruinsCount\\[1\\]\\+\\+%3===2&&\\(${ID}\\.sub=1,${hpMul},${atkMul}`), ([hp], t) => {
    const m = t.lacaios.find((x) => x.nome === "Espectro das Ruínas")?.escalaOnda;
    return m?.multHp === hp ? null : `local=${m?.multHp} vs jogo=${hp}`;
  });
  checar(1, "Goblin Ladino", spawn.corpo, new RegExp(`caveCount\\[0\\]\\+\\+;this\\.wave>=2&&\\(${ID}%4===3\\|\\|this\\.rng\\.next\\(\\)<${NUM}\\)&&\\(${ID}\\.sub=1,${ID}\\.x=[\\s\\S]{0,60},${ID}\\.face=1,${hpMul},${atkMul}`), ([hp], t) => {
    const m = t.lacaios.find((x) => x.nome === "Goblin Ladino")?.escalaOnda;
    return m?.multHp === hp && m?.ondaMinima === 2 ? null : `local=${m?.multHp} vs jogo=${hp}`;
  });
  checar(1, "Goblin Pesadelo", spawn.corpo, new RegExp(`caveCount\\[1\\]\\+\\+;this\\.wave>=2&&${ID}%3===2&&\\(${ID}\\.sub=1,${hpMul}\\)`), ([hp], t) => {
    const m = t.lacaios.find((x) => x.nome === "Goblin Pesadelo")?.escalaOnda;
    return m?.multHp === hp && m?.ondaMinima === 2 ? null : `local=${m?.multHp} vs jogo=${hp}`;
  });
  checar(2, "Lobos Gélido/Sombrio", spawn.corpo, new RegExp(`wolfCount\\+\\+%3===2[\\s\\S]{0,160}${ID}\\.hp\\*=${ID}\\?(${NUM}):(${NUM}),${ID}\\.atk\\*=${ID}\\?(${NUM}):(${NUM})`), ([hpSombrio, hpGelido], t) => {
    const g = t.lacaios.find((x) => x.nome === "Lobo Gélido")?.escalaOnda;
    const s = t.lacaios.find((x) => x.nome === "Lobo Sombrio")?.escalaOnda;
    return g?.multHp === hpGelido && s?.multHp === hpSombrio ? null : `local=(${g?.multHp}/${s?.multHp}) vs jogo=(${hpGelido}/${hpSombrio})`;
  });
  checar(3, "Carcereiro Acorrentado", spawn.corpo, new RegExp(`forgeCount\\[0\\]\\+\\+%4===3&&\\(${ID}\\.sub=1,${hpMul},${defMul},${atkMul}`), ([hp, def], t) => {
    const m = t.lacaios.find((x) => x.nome === "Carcereiro Acorrentado")?.escalaOnda;
    return m?.multHp === hp && m?.multDef === def ? null : `local=(${m?.multHp}/${m?.multDef}) vs jogo=(${hp}/${def})`;
  });
  checar(4, "Fungo Funesto", spawn.corpo, new RegExp(`swampCount\\[0\\]\\+\\+%4===3&&\\(${ID}\\.sub=1,${hpMul},${defMul},${atkMul}`), ([hp, def], t) => {
    const m = t.lacaios.find((x) => x.nome === "Fungo Funesto")?.escalaOnda;
    return m?.multHp === hp && m?.multDef === def ? null : `local=(${m?.multHp}/${m?.multDef}) vs jogo=(${hp}/${def})`;
  });
  checar(6, "Robô Sentinela", spawn.corpo, new RegExp(`galaxyCount\\[0\\]\\+\\+[\\s\\S]{0,200}${ID}===1\\?\\(${hpMul},${defMul}`), ([hp, def], t) => {
    const m = t.lacaios.find((x) => x.nome === "Robô Sentinela")?.escalaOnda;
    return m?.multHp === hp && m?.multDef === def ? null : `local=(${m?.multHp}/${m?.multDef}) vs jogo=(${hp}/${def})`;
  });
  checar(7, "Leão do Domador", spawn.corpo, new RegExp(`${ID}\\.sub=3,${ID}\\.pet=!0,${ID}\\.masterId=${ID}\\.id,${ID}\\.x=${ID}\\.x\\+16,${ID}\\.face=1,${hpMul},${atkMul}`), ([hp], t) => {
    const m = t.lacaios.find((x) => x.nome === "Leão do Domador")?.escalaOnda;
    return m?.multHp === hp && m?.ondaMinima === 3 ? null : `local=${m?.multHp} vs jogo=${hp}`;
  });
  checar(8, "Maquinista Titã / Regente Ticktack", steam.corpo, new RegExp(`${ID}==="boss"\\?${ID}\\.sub===1\\?\\(${hpMul},${spdMul}\\):\\(${hpMul},${defMul}`), ([hpAlt, , hpPrin, defPrin], t) => {
    return t.multHp === hpPrin && t.multDef === defPrin && t.varianteAlternativa?.multHp === hpAlt
      ? null
      : `local=(${t.multHp}/${t.multDef}, alt=${t.varianteAlternativa?.multHp}) vs jogo=(${hpPrin}/${defPrin}, alt=${hpAlt})`;
  });
  checar(8, "Caldeireiro", steam.corpo, new RegExp(`${ID}==="skeleton"\\?${ID}\\.sub===1\\?\\(${hpMul},${defMul},${atkMul}`), ([hp, def], t) => {
    const m = t.lacaios.find((x) => x.nome === "Caldeireiro")?.escalaOnda;
    return m?.multHp === hp && m?.multDef === def ? null : `local=(${m?.multHp}/${m?.multDef}) vs jogo=(${hp}/${def})`;
  });
  checar(8, "Metade do Autômato Bipartido", steam.corpo, new RegExp(`${ID}\\.sub===4\\?\\(${hpMul},${atkMul}`), ([hp], t) => {
    const m = t.lacaiosInvocados?.find((x) => x.nome === "Metade do Autômato Bipartido")?.escalaOnda;
    return m?.multHp === hp ? null : `local=${m?.multHp} vs jogo=${hp}`;
  });
  checar(8, "Autômato do Apito", train.corpo, new RegExp(`"whistle"[\\s\\S]{0,120}pet:!0,hp:(${NUM}),atk:(${NUM})`), ([hp], t) => {
    const m = t.lacaiosInvocados?.find((x) => x.nome === "Autômato do Apito")?.escalaOnda;
    return m?.multHp === hp && m?.ondaMinima === 10 ? null : `local=${m?.multHp} vs jogo=${hp}`;
  });

  // Garante que todos os lacaios locais tenham escalaOnda preenchida
  for (const tema of catalogoTemasZona) {
    for (const lacaio of tema.lacaios) {
      if (!lacaio.escalaOnda || !["skeleton", "goblin"].includes(lacaio.escalaOnda.base) || !(lacaio.escalaOnda.multHp > 0)) {
        divergencias.push(`[${tema.nome}] Lacaio '${lacaio.nome}' sem escalaOnda válida em src/dados.mjs`);
      }
    }
  }

  return { errosParser, divergencias, regrasVerificadas };
}

async function main() {
  const opcoes = analisarArgumentos(process.argv.slice(2));
  const { asset, codigo } = await obterBundleOficial(opcoes.bundleLocal);

  const errosParser = [];
  const divergencias = [];

  const matchZonasUso = codigo.match(new RegExp(`\\(this\\.zone-1\\)%(${ID})`));
  const zonasJogo = matchZonasUso ? buscarConstanteNumerica(codigo, matchZonasUso[1]) : null;
  if (zonasJogo == null) {
    errosParser.push("Não foi possível extrair o total de zonas no ciclo (this.zone-1 % N).");
  } else if (zonasJogo !== catalogoTemasZona.length) {
    divergencias.push(`Ciclo de zonas diferente: local=${catalogoTemasZona.length}, jogo=${zonasJogo}`);
  }

  const resOnda = auditarFormulaOnda(codigo);
  const resEntidades = auditarSpawnESteam(codigo);
  errosParser.push(...resOnda.errosParser, ...resEntidades.errosParser);
  divergencias.push(...resOnda.divergencias, ...resEntidades.divergencias);

  const totalLacaios = catalogoTemasZona.reduce((acc, t) => acc + t.lacaios.length, 0);

  if (opcoes.json) {
    console.log(JSON.stringify({
      asset,
      zonasJogo,
      zonasLocais: catalogoTemasZona.length,
      totalLacaios,
      regrasVerificadas: resEntidades.regrasVerificadas,
      errosParser,
      divergencias,
    }, null, 2));
  } else {
    console.log(`Bundle auditado: ${asset}`);
    console.log(`Zonas: ${catalogoTemasZona.length}/${zonasJogo ?? "?"} | Lacaios catalogados: ${totalLacaios} | Regras verificadas: ${resEntidades.regrasVerificadas}`);
    if (errosParser.length === 0 && divergencias.length === 0) {
      console.log("✅ Todas as fórmulas de onda, chefes e lacaios estão alinhados com o cliente oficial!");
    } else {
      if (errosParser.length) {
        console.log(`\n🔧 ${errosParser.length} erro(s) de parser (o bundle mudou estrutura/minificação):`);
        for (const e of errosParser) console.log(`- ${e}`);
      }
      if (divergencias.length) {
        console.log(`\n⚠️ ${divergencias.length} divergência(s) de regra entre o jogo e src/dados.mjs:`);
        for (const d of divergencias) console.log(`- ${d}`);
      }
    }
  }

  // Separa claramente erro de parser (1) de divergência de regra (2), igual em texto e JSON
  if (errosParser.length > 0) process.exitCode = 1;
  else if (divergencias.length > 0) process.exitCode = 2;
}

main().catch((erro) => {
  console.error("Erro ao auditar monstros:", erro.message);
  process.exit(1);
});
