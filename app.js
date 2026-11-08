const endpointPerfilRemoto = "https://4o9ys9ib13.execute-api.us-east-1.amazonaws.com/api/profile/";
const endpointPerfilProxyLocal = "/api/profile/";
const proxiesPublicos = [
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
];

const nomesClasses = {
  warrior: "Guerreiro",
  cleric: "Clérigo",
  archer: "Arqueiro",
};

const dadosClasses = {
  warrior: {
    k: 0.6,
    base: { hp: 120, atk: 9, def: 4, aspd: 0.95 },
    growth: { hp: 19, atk: 1.6, def: 1.1 },
    cor: "#ff6b5a",
  },
  cleric: {
    k: 0.84,
    base: { hp: 85, atk: 6, def: 2, aspd: 0.8 },
    growth: { hp: 9, atk: 1.1, def: 0.5 },
    cor: "#ffe27a",
  },
  archer: {
    k: 0.72,
    base: { hp: 70, atk: 11, def: 1.5, aspd: 1.1 },
    growth: { hp: 8, atk: 1.9, def: 0.4 },
    cor: "#7be07b",
  },
};

const catalogoConjuntos = {
  berserker: { nome: "Fúria do Berserker", b2: { atk: 0.12 }, b3: { hp: 0.15, crit: 6 } },
  lunar: { nome: "Ordem Lunar", b2: { hp: 0.12, def: 0.1 }, b3: { atk: 0.15, spd: 0.1 } },
  wind: { nome: "Arqueiro do Vento", b2: { atk: 0.1, spd: 0.05 }, b3: { crit: 6, spd: 0.1 } },
  volcano: { nome: "Titã Vulcânico", b2: { atk: 0.15, def: 0.1 }, b3: { hp: 0.2, atk: 0.12, crit: 5 } },
  reaperset: { nome: "Ceifador Espectral", b2: { atk: 0.1, crit: 6 }, b3: { atk: 0.2, spd: 0.1 } },
  dawn: { nome: "Serafim da Aurora", b2: { hp: 0.18, def: 0.1 }, b3: { atk: 0.25, hp: 0.12 } },
  abyss: { nome: "Arconte do Vazio", b2: { atk: 0.15, crit: 5 }, b3: { atk: 0.2, spd: 0.12 } },
  stellar: { nome: "Caçador Estelar", b2: { atk: 0.12, spd: 0.08 }, b3: { crit: 8, atk: 0.15 } },
  cosmicvan: { nome: "Vanguarda Cósmica", b2: { atk: 0.1, def: 0.08 }, b3: { hp: 0.15, atk: 0.1 } },
  oracle: { nome: "Oráculo Interestelar", b2: { hp: 0.12, atk: 0.08 }, b3: { atk: 0.15, spd: 0.1 } },
  etehunter: { nome: "Caçador de Etês", b2: { atk: 0.1, crit: 5 }, b3: { crit: 8, spd: 0.1 } },
  prism: { nome: "Mestre Prismático", b2: { atk: 0.12, crit: 6 }, b3: { hp: 0.1, atk: 0.2, spd: 0.1 } },
  ember: { nome: "Brasa Eterna", b2: { hp: 0.2, def: 0.15 }, b3: { atk: 0.3, hp: 0.25 } },
  gore: { nome: "Carnificina", b2: { atk: 0.25, crit: 8 }, b3: { atk: 0.4, spd: 0.15 } },
  echo: { nome: "Eco Rubro", b2: { hp: 0.2, atk: 0.15 }, b3: { atk: 0.35, spd: 0.2 } },
  communion: { nome: "Comunhão Rubra", b2: { hp: 0.25, def: 0.15 }, b3: { atk: 0.3, hp: 0.25 } },
  predator: { nome: "Predador Carmesim", b2: { atk: 0.2, crit: 8 }, b3: { atk: 0.3, crit: 10, spd: 0.1 } },
  tempest: { nome: "Tempestade Escarlate", b2: { atk: 0.2, spd: 0.12 }, b3: { atk: 0.3, spd: 0.25 } },
  chrono: { nome: "Cronarca", b2: { def: 0.15, spd: 0.12 }, b3: { atk: 0.3, spd: 0.2, hp: 0.15 } },
  singular: { nome: "Singularidade", b2: { atk: 0.25, crit: 6 }, b3: { atk: 0.4, hp: 0.2, crit: 10 } },
  constel: { nome: "Constelação", b2: { hp: 0.22, def: 0.15 }, b3: { atk: 0.3, hp: 0.25, spd: 0.1 } },
  worldtree: { nome: "Árvore-Mundo", b2: { hp: 0.3, atk: 0.1 }, b3: { hp: 0.4, atk: 0.25 } },
  luna: { nome: "Luar Prateado", b2: { atk: 0.22, spd: 0.1 }, b3: { atk: 0.35, crit: 8, spd: 0.1 } },
  dragon: { nome: "Dragão Ancestral", b2: { atk: 0.2, crit: 8 }, b3: { atk: 0.4, hp: 0.15, crit: 10 } },
  tamer: { nome: "Domador de Feras", b2: { atk: 0.3, hp: 0.2 }, b3: { atk: 0.55, hp: 0.25, spd: 0.15 } },
  strongman: { nome: "Homem-Forte", b2: { hp: 0.35, def: 0.25 }, b3: { atk: 0.5, hp: 0.4, crit: 10 } },
  illusion: { nome: "Ilusionista", b2: { hp: 0.3, atk: 0.25 }, b3: { atk: 0.5, hp: 0.3, spd: 0.2 } },
  fortune: { nome: "Madame Cartomante", b2: { hp: 0.35, def: 0.2 }, b3: { hp: 0.55, atk: 0.35 } },
  trapeze: { nome: "Trapezista", b2: { atk: 0.3, spd: 0.15 }, b3: { atk: 0.5, crit: 12, spd: 0.25 } },
  firework: { nome: "Pirotécnico", b2: { atk: 0.3, crit: 10 }, b3: { atk: 0.6, crit: 15, hp: 0.15 } },
};

const nomesRaridade = ["Comum", "Incomum", "Raro", "Épico", "Lendário", "Evento", "Imortal", "Arcano"];
const coresRaridade = ["#c9c5d8", "#6be08a", "#58a8ff", "#c77dff", "#ffb62e", "#ff7a1a", "#ff2d3d", "#eb34b1"];
const nomesSlots = {
  weapon: "Arma",
  helmet: "Elmo",
  armor: "Armadura",
  ring: "Anel",
  cosmetic: "Cosmético",
};
const coresGemas = {
  ruby: "#ff4d5e",
  sapphire: "#4da3ff",
  topaz: "#ffc93c",
  emerald: "#4de08a",
  amethyst: "#b36bff",
};
const rotulosStats = {
  atk: "ATK",
  def: "DEF",
  hp: "HP",
  crit: "CRÍT",
  spd: "VEL",
};

const tiposForja = [
  { chave: "epic", rotulo: "Épico", chanceBase: 0.5 },
  { chave: "imm", rotulo: "Imortal", chanceBase: 0.35 },
  { chave: "arc", rotulo: "Arcano", chanceBase: 0.25 },
];

const formatadorInteiro = new Intl.NumberFormat("pt-BR");
const formatadorPercentual = new Intl.NumberFormat("pt-BR", {
  style: "percent",
  maximumFractionDigits: 1,
});

const formularioBusca = document.querySelector("#formulario-busca");
const inputNick = document.querySelector("#input-nick");
const selectPlataforma = document.querySelector("#select-plataforma");
const statusConsulta = document.querySelector("#status-consulta");
const painelResultado = document.querySelector("#painel-resultado");
const imgAvatar = document.querySelector("#avatar-jogador");
const selectPersonagem = document.querySelector("#select-personagem");
const corpoTabela = document.querySelector("#linhas-forjas");

const abaForjas = document.querySelector("#aba-forjas");
const abaEquipamentos = document.querySelector("#aba-equipamentos");
const secaoForjas = document.querySelector("#secao-forjas");
const secaoEquipamentos = document.querySelector("#secao-equipamentos");
const containerResumoFc = document.querySelector("#resumo-fc");
const containerConjuntos = document.querySelector("#conjuntos-ativos");
const containerListaEquipamentos = document.querySelector("#lista-equipamentos");

let jogadorAtual;
let requisicaoAtiva;

function configurarAbas() {
  function alternarAba(abaAtiva) {
    const ehForjas = abaAtiva === "forjas";
    abaForjas.setAttribute("aria-selected", ehForjas ? "true" : "false");
    abaEquipamentos.setAttribute("aria-selected", ehForjas ? "false" : "true");

    if (ehForjas) {
      secaoForjas.removeAttribute("hidden");
      secaoEquipamentos.setAttribute("hidden", "until-found");
    } else {
      secaoEquipamentos.removeAttribute("hidden");
      secaoForjas.setAttribute("hidden", "until-found");
    }
  }

  abaForjas.addEventListener("click", () => alternarAba("forjas"));
  abaEquipamentos.addEventListener("click", () => alternarAba("equipamentos"));

  // Sincronização acessível do evento beforematch (busca nativa na página)
  document.addEventListener("beforematch", (evento) => {
    if (secaoEquipamentos.contains(evento.target)) {
      alternarAba("equipamentos");
    } else if (secaoForjas.contains(evento.target)) {
      alternarAba("forjas");
    }
  });

  // Fallback para navegadores sem suporte a hidden="until-found"
  if (!("onbeforematch" in HTMLElement.prototype)) {
    abaForjas.addEventListener("click", () => {
      secaoForjas.hidden = false;
      secaoEquipamentos.hidden = true;
    });
    abaEquipamentos.addEventListener("click", () => {
      secaoEquipamentos.hidden = false;
      secaoForjas.hidden = true;
    });
  }
}
configurarAbas();

function atualizarParametrosUrl(jogador, classeSelecionada) {
  if (window.location.protocol === "file:") return;
  try {
    const urlPagina = new URL(window.location.href);
    urlPagina.searchParams.set("nick", jogador.nick);
    urlPagina.searchParams.set("plataforma", jogador.plataforma);
    if (classeSelecionada) {
      urlPagina.searchParams.set("cls", classeSelecionada);
    } else {
      urlPagina.searchParams.delete("cls");
    }
    window.history.replaceState(null, "", urlPagina);
  } catch {
    // Ignora se o ambiente bloquear replaceState
  }
}

async function buscarRespostaPerfil(loginApi, classeDesejada, sinalAborto) {
  const params = classeDesejada ? `?cls=${encodeURIComponent(classeDesejada)}` : "";
  const loginCodificado = encodeURIComponent(loginApi);
  const urlAwsDireta = `${endpointPerfilRemoto}${loginCodificado}${params}`;

  const rotasTentativa = [];

  // Se servido por um servidor HTTP (incluindo o servidor local)
  if (window.location.protocol !== "file:") {
    rotasTentativa.push(`${endpointPerfilProxyLocal}${loginCodificado}${params}`);
  } else {
    rotasTentativa.push(`http://127.0.0.1:4173/api/profile/${loginCodificado}${params}`);
  }

  rotasTentativa.push(urlAwsDireta);
  for (const proxyFn of proxiesPublicos) {
    rotasTentativa.push(proxyFn(urlAwsDireta));
  }

  let ultimoErro;
  for (const rota of rotasTentativa) {
    if (sinalAborto.aborted) break;
    try {
      const sinalComTimeout = AbortSignal.any([sinalAborto, AbortSignal.timeout(9000)]);
      const resposta = await fetch(rota, {
        credentials: "omit",
        signal: sinalComTimeout,
      });

      if (resposta.status === 404) {
        return { resposta, urlPublica: new URL(urlAwsDireta) };
      }

      if (resposta.ok) {
        return { resposta, urlPublica: new URL(urlAwsDireta) };
      }
    } catch (erro) {
      ultimoErro = erro;
    }
  }

  throw ultimoErro || new Error("Falha ao comunicar com os servidores do RiftStream.");
}

/* ==========================================================================
   Cálculo Preciso de Força de Combate (FC) e Atributos
   ========================================================================== */

function calcularFc(classe, stats) {
  const dados = dadosClasses[classe] || dadosClasses.cleric;
  const dps =
    stats.atk *
    stats.aspd *
    (1 + (stats.crit / 100) * (0.5 + (stats.critDmg || 0)));
  const ehp = stats.maxHp * (1 + stats.def * 0.04);
  return Math.round(dados.k * Math.sqrt(Math.max(0, dps * ehp)));
}

function agregarItens(listaItens) {
  const fixos = { atk: 0, def: 0, hp: 0, crit: 0, spd: 0 };
  const gemasFixas = { atk: 0, def: 0, hp: 0, crit: 0, spd: 0 };
  const gemasPercent = { atk: 0, def: 0, hp: 0, crit: 0, spd: 0 };
  const contagemConjuntos = {};

  for (const item of listaItens || []) {
    if (!item || item.slot === "cosmetic") continue;
    for (const k of ["atk", "def", "hp", "crit", "spd"]) {
      fixos[k] += item[k] || 0;
    }
    if (item.set) {
      contagemConjuntos[item.set] = (contagemConjuntos[item.set] || 0) + 1;
    }
    for (const gema of item.gems || []) {
      for (const [chaveStat, chaveValor, chavePct] of [
        ["stat", "value", "pct"],
        ["stat2", "value2", "pct2"],
      ]) {
        const stat = gema[chaveStat];
        const val = gema[chaveValor] || 0;
        if (stat) {
          if (gema[chavePct]) {
            gemasPercent[stat] += val;
          } else {
            gemasFixas[stat] += val;
          }
        }
      }
    }
  }

  const multConjuntos = { atk: 1.0, def: 1.0, hp: 1.0, spd: 1.0 };
  let critConjunto = 0;

  for (const [chaveSet, contagem] of Object.entries(contagemConjuntos)) {
    const config = catalogoConjuntos[chaveSet];
    if (!config) continue;
    if (contagem >= 2) {
      for (const k of ["atk", "def", "hp", "spd"]) {
        multConjuntos[k] *= 1 + (config.b2[k] || 0);
      }
      critConjunto += config.b2.crit || 0;
    }
    if (contagem >= 3) {
      for (const k of ["atk", "def", "hp", "spd"]) {
        multConjuntos[k] *= 1 + (config.b3[k] || 0);
      }
      critConjunto += config.b3.crit || 0;
    }
  }

  return {
    fixos,
    gemasFixas,
    gemasPercent,
    multConjuntos,
    critConjunto,
    contagemConjuntos,
  };
}

function inferirAtributosBase(perfil) {
  const classe = perfil.cls;
  const dados = dadosClasses[classe] || dadosClasses.cleric;
  const nivel = perfil.level;
  const r = Math.max(0, nivel - 1);
  const st = perfil.stats;
  const { fixos, gemasFixas, gemasPercent, multConjuntos, critConjunto } =
    agregarItens(perfil.equipped);

  function resolverQuad(base, ganho, mult, alvo) {
    const a = 0.015 * ganho;
    const b = ganho + 0.015 * base;
    const c = base - alvo / Math.max(0.0001, mult);
    const disc = Math.max(0, b * b - 4 * a * c);
    const x = (-b + Math.sqrt(disc)) / (2 * a);
    return Math.max(0, Math.round(x));
  }

  const str = resolverQuad(
    dados.base.atk + dados.growth.atk * r + fixos.atk + gemasFixas.atk,
    1.5,
    multConjuntos.atk * (1 + gemasPercent.atk / 1000.0),
    st.atk
  );

  const vit = resolverQuad(
    dados.base.hp + dados.growth.hp * r + fixos.hp + gemasFixas.hp,
    10.0,
    multConjuntos.hp * (1 + gemasPercent.hp / 1000.0),
    st.maxHp
  );

  const def = resolverQuad(
    dados.base.def + dados.growth.def * r + fixos.def + gemasFixas.def,
    0.8,
    multConjuntos.def * (1 + gemasPercent.def / 1000.0),
    st.def
  );

  const spdMult =
    (1 + (fixos.spd + gemasFixas.spd) / 100.0) * multConjuntos.spd;
  const agi = Math.max(
    0,
    Math.round(((st.aspd / (dados.base.aspd * spdMult)) - 1.0) / 0.02)
  );

  const critTotal = st.crit + (st.critDmg || 0) / 0.03;
  const luk = Math.max(
    0,
    Math.round((critTotal - 5.0 - fixos.crit - gemasFixas.crit - critConjunto) / 0.4)
  );

  return { str, vit, def, agi, luk };
}

function calcularStatusSimulados(classe, nivel, atributos, listaItens) {
  const dados = dadosClasses[classe] || dadosClasses.cleric;
  const r = Math.max(0, nivel - 1);
  const { fixos, gemasFixas, gemasPercent, multConjuntos, critConjunto } =
    agregarItens(listaItens);

  const atk =
    Math.round(
      (dados.base.atk +
        dados.growth.atk * r +
        atributos.str * 1.5 +
        fixos.atk +
        gemasFixas.atk) *
        (1 + atributos.str * 0.015) *
        multConjuntos.atk *
        (1 + gemasPercent.atk / 1000.0) *
        10
    ) / 10;

  const maxHp = Math.round(
    (dados.base.hp +
      dados.growth.hp * r +
      atributos.vit * 10.0 +
      fixos.hp +
      gemasFixas.hp) *
      (1 + atributos.vit * 0.015) *
      multConjuntos.hp *
      (1 + gemasPercent.hp / 1000.0)
  );

  const def =
    Math.round(
      (dados.base.def +
        dados.growth.def * r +
        atributos.def * 0.8 +
        fixos.def +
        gemasFixas.def) *
        (1 + atributos.def * 0.015) *
        multConjuntos.def *
        (1 + gemasPercent.def / 1000.0) *
        10
    ) / 10;

  const aspd =
    Math.round(
      dados.base.aspd *
        (1 + atributos.agi * 0.02) *
        (1 + (fixos.spd + gemasFixas.spd) / 100.0) *
        multConjuntos.spd *
        100
    ) / 100;

  const critBruto =
    5.0 +
    atributos.luk * 0.4 +
    fixos.crit +
    gemasFixas.crit +
    critConjunto;
  const crit = Math.min(60.0, Math.round(critBruto * 10) / 10);
  const critDmg = Math.round(Math.max(0, critBruto - 60.0) * 0.03 * 1000) / 1000;

  return { atk, maxHp, def, aspd, crit, critDmg };
}

/* ==========================================================================
   Renderização dos Componentes
   ========================================================================== */

function formatarGemaTexto(gema) {
  const partes = [];
  if (gema.stat && gema.value) {
    const sufixo = gema.pct ? "%" : "";
    const valor = gema.pct ? (gema.value / 10).toFixed(1) : gema.value;
    partes.push(`+${valor}${sufixo} ${rotulosStats[gema.stat] || gema.stat.toUpperCase()}`);
  }
  if (gema.stat2 && gema.value2) {
    const sufixo = gema.pct2 ? "%" : "";
    const valor = gema.pct2 ? (gema.value2 / 10).toFixed(1) : gema.value2;
    partes.push(`+${valor}${sufixo} ${rotulosStats[gema.stat2] || gema.stat2.toUpperCase()}`);
  }
  return partes.join(" · ") || "Atributo";
}

function renderizarEquipamentosEGemas(perfil) {
  const classe = perfil.cls;
  const nivel = perfil.level;
  const itensEquipados = perfil.equipped || [];
  const atributos = inferirAtributosBase(perfil);

  const statusAtuais = calcularStatusSimulados(classe, nivel, atributos, itensEquipados);
  const fcTotal = calcularFc(classe, statusAtuais);

  const statusSemItens = calcularStatusSimulados(classe, nivel, atributos, []);
  const fcSemItens = calcularFc(classe, statusSemItens);
  const ganhoTotalEquips = Math.max(0, fcTotal - fcSemItens);
  const pctGanhoTotal = fcSemItens > 0 ? ganhoTotalEquips / fcSemItens : 0;

  // 1. Resumo no topo
  containerResumoFc.innerHTML = `
    <div class="bloco-resumo">
      <span>FORÇA TOTAL (FC)</span>
      <strong>${formatadorInteiro.format(fcTotal)}</strong>
      <small>Nível ${formatadorInteiro.format(nivel)} · ${nomesClasses[classe]}</small>
    </div>
    <div class="bloco-resumo">
      <span>GANHO POR EQUIPAMENTOS</span>
      <strong>+${formatadorInteiro.format(ganhoTotalEquips)}</strong>
      <small>+${formatadorPercentual.format(pctGanhoTotal)} de aumento</small>
    </div>
    <div class="bloco-resumo">
      <span>FC BASE (SEM ITENS)</span>
      <strong>${formatadorInteiro.format(fcSemItens)}</strong>
      <small>Atributos: F${atributos.str} V${atributos.vit} D${atributos.def} A${atributos.agi} S${atributos.luk}</small>
    </div>
  `;

  // 2. Conjuntos ativos
  const { contagemConjuntos } = agregarItens(itensEquipados);
  const cartoesConjuntos = [];
  for (const [chaveSet, contagem] of Object.entries(contagemConjuntos)) {
    const config = catalogoConjuntos[chaveSet];
    if (!config || contagem < 2) continue;
    const bonusDesc = [];
    if (contagem >= 2) bonusDesc.push(`2 peças ativas`);
    if (contagem >= 3) bonusDesc.push(`3 peças ativas (completo)`);
    cartoesConjuntos.push(`
      <div class="cartao-conjunto">
        <div>
          <b>${config.nome}</b> (${contagem}/3 peças)
          <div class="bonus-lista">${bonusDesc.join(" · ")}</div>
        </div>
        <span class="tag-fc">Conjunto Ativo</span>
      </div>
    `);
  }
  containerConjuntos.innerHTML = cartoesConjuntos.join("");

  // 3. Lista detalhada de equipamentos e gemas
  const slotsOrdem = ["weapon", "helmet", "armor", "ring", "cosmetic"];
  const itensOrdenados = [...itensEquipados].sort((a, b) => {
    return slotsOrdem.indexOf(a.slot) - slotsOrdem.indexOf(b.slot);
  });

  const elementosEquipamentos = itensOrdenados.map((item) => {
    const ehCosmetico = item.slot === "cosmetic";
    const nomeSlot = nomesSlots[item.slot] || item.slot;
    const nomeRaridade = nomesRaridade[item.rarity] || "Comum";
    const corRaridade = coresRaridade[item.rarity] || "#c9c5d8";

    // Impacto do slot completo (item + gemas + conjuntos)
    const itensSemEsteSlot = itensEquipados.filter((it) => it.id !== item.id);
    const fcSemEsteSlot = calcularFc(
      classe,
      calcularStatusSimulados(classe, nivel, atributos, itensSemEsteSlot)
    );
    const deltaSlotTotal = Math.max(0, fcTotal - fcSemEsteSlot);

    // Impacto do item base sozinho (sem suas gemas)
    const itensComItemLimpoDeGemas = itensEquipados.map((it) =>
      it.id === item.id ? { ...it, gems: [] } : it
    );
    const fcItemLimpo = calcularFc(
      classe,
      calcularStatusSimulados(classe, nivel, atributos, itensComItemLimpoDeGemas)
    );
    const deltaGemasItem = Math.max(0, fcTotal - fcItemLimpo);
    const deltaItemBase = Math.max(0, fcItemLimpo - fcSemEsteSlot);

    // Atributos nativos do item
    const chipsAtributos = [];
    for (const [st, rotulo] of Object.entries(rotulosStats)) {
      if (item[st]) {
        const sufixo = st === "crit" || st === "spd" ? "%" : "";
        chipsAtributos.push(`<span class="chip-stat">+${item[st]}${sufixo} ${rotulo}</span>`);
      }
    }

    // Gemas engastadas
    const gemas = item.gems || [];
    const maxSockets = item.sockets || gemas.length;
    const cardsGemas = [];

    gemas.forEach((gema, idx) => {
      // Simula a remoção apenas desta gema
      const itensSemEstaGema = itensEquipados.map((it) => {
        if (it.id !== item.id) return it;
        return {
          ...it,
          gems: (it.gems || []).filter((_, iGema) => iGema !== idx),
        };
      });
      const fcSemEstaGema = calcularFc(
        classe,
        calcularStatusSimulados(classe, nivel, atributos, itensSemEstaGema)
      );
      const deltaGemaIndividual = Math.max(0, fcTotal - fcSemEstaGema);
      const corGema = coresGemas[gema.type] || "#8fd0ff";

      cardsGemas.push(`
        <div class="cartao-gema">
          <div class="gema-info">
            <span class="gema-icone" style="--cor-gema: ${corGema};"></span>
            <div class="gema-texto">
              <span class="gema-nome" style="color: ${corGema};">${gema.name || "Gema"}</span>
              <span class="gema-stats">${formatarGemaTexto(gema)}</span>
            </div>
          </div>
          <span class="gema-fc">+${formatadorInteiro.format(deltaGemaIndividual)} FC</span>
        </div>
      `);
    });

    // Slots vazios
    for (let i = gemas.length; i < maxSockets; i++) {
      cardsGemas.push(`
        <div class="cartao-gema vazio">
          <div class="gema-info">
            <span class="gema-icone" style="--cor-gema: #443c68;"></span>
            <div class="gema-texto">
              <span class="gema-nome">Espaço vazio</span>
              <span class="gema-stats">Sem gema engastada</span>
            </div>
          </div>
          <span>—</span>
        </div>
      `);
    }

    return `
      <article class="cartao-equipamento">
        <div class="equip-topo">
          <div class="equip-titulo">
            <span class="equip-slot">${nomeSlot}</span>
            <div class="equip-nome" style="color: ${corRaridade};">${item.name}</div>
            <div class="equip-meta">
              ${nomeRaridade} · Nv. ${item.itemLevel || 1}
              ${item.set && catalogoConjuntos[item.set] ? ` · Conjunto ${catalogoConjuntos[item.set].nome}` : ""}
            </div>
          </div>
          <div class="equip-fc-box">
            <span class="tag-fc">+${formatadorInteiro.format(deltaSlotTotal)} FC total</span>
            ${
              !ehCosmetico && gemas.length > 0
                ? `<span class="tag-fc secundaria">Item: +${formatadorInteiro.format(deltaItemBase)} FC</span>
                   <span class="tag-fc secundaria">Gemas: +${formatadorInteiro.format(deltaGemasItem)} FC</span>`
                : ""
            }
          </div>
        </div>

        ${chipsAtributos.length > 0 ? `<div class="atributos-item">${chipsAtributos.join("")}</div>` : ""}

        ${
          !ehCosmetico && maxSockets > 0
            ? `<div class="grade-gemas">${cardsGemas.join("")}</div>`
            : ""
        }
      </article>
    `;
  });

  containerListaEquipamentos.innerHTML = elementosEquipamentos.join("");
}

function renderizarPerfil(perfil, urlPublica, plataforma) {
  const nomeExibicao = perfil.displayName || perfil.login;
  document.querySelector("#nome-jogador").textContent = nomeExibicao;
  document.querySelector("#plataforma-jogador").textContent =
    plataforma === "kick" ? "KICK" : "TWITCH";
  document.querySelector("#link-json").href = urlPublica.href;

  if (imgAvatar) {
    if (perfil.avatar) {
      imgAvatar.src = perfil.avatar;
      imgAvatar.alt = `Avatar de ${nomeExibicao}`;
      imgAvatar.onerror = () => {
        imgAvatar.hidden = true;
      };
      imgAvatar.hidden = false;
    } else {
      imgAvatar.hidden = true;
    }
  }

  const niveisPorClasse = new Map(
    (perfil.classes ?? []).map((item) => [item.cls, item.level])
  );
  if (perfil.cls && !niveisPorClasse.has(perfil.cls)) {
    niveisPorClasse.set(perfil.cls, perfil.level);
  }

  const opcoesPersonagem = Object.entries(nomesClasses)
    .filter(([chave]) => niveisPorClasse.has(chave))
    .map(([chave, nome]) => {
      const nivel = niveisPorClasse.get(chave);
      const sufixoNivel = nivel
        ? ` (Nv. ${formatadorInteiro.format(nivel)})`
        : "";
      return new Option(`${nome}${sufixoNivel}`, chave);
    });

  selectPersonagem.replaceChildren(...opcoesPersonagem);
  selectPersonagem.value = perfil.cls;

  // 1. Tabela da aba de Forjas
  const linhas = tiposForja.map(({ chave, rotulo, chanceBase }) => {
    const tentativas = perfil.counters?.[`fuse_${chave}_try`] ?? 0;
    const sucessos = perfil.counters?.[`fuse_${chave}_ok`] ?? 0;
    const linha = document.createElement("tr");
    linha.dataset.forge = chave;

    const cabecalho = document.createElement("th");
    cabecalho.scope = "row";
    cabecalho.textContent = rotulo;
    linha.append(cabecalho);

    const valores = [
      formatadorPercentual.format(chanceBase),
      formatadorInteiro.format(tentativas),
      formatadorInteiro.format(sucessos),
      tentativas > 0 && sucessos <= tentativas
        ? formatadorPercentual.format(sucessos / tentativas)
        : "—",
    ];

    for (const valor of valores) {
      const celula = document.createElement("td");
      celula.textContent = valor;
      linha.append(celula);
    }

    return linha;
  });
  corpoTabela.replaceChildren(...linhas);

  // 2. Detalhe da aba de Equipamentos, Gemas e FC
  renderizarEquipamentosEGemas(perfil);

  painelResultado.hidden = false;
}

async function consultarPerfil(jogador, classeDesejada) {
  requisicaoAtiva?.abort();
  const controlador = new AbortController();
  requisicaoAtiva = controlador;

  const nomePlataforma = jogador.plataforma === "kick" ? "Kick" : "Twitch";
  const loginApi =
    jogador.plataforma === "kick" ? `kick:${jogador.nick}` : jogador.nick;

  painelResultado.hidden = true;
  delete statusConsulta.dataset.error;
  statusConsulta.textContent = `Consultando ${jogador.nick} na ${nomePlataforma}…`;

  try {
    const { resposta, urlPublica } = await buscarRespostaPerfil(
      loginApi,
      classeDesejada,
      controlador.signal
    );

    if (resposta.status === 404) {
      throw new Error(
        `Perfil não encontrado na ${nomePlataforma}. Confira o nick ou tente a outra plataforma.`
      );
    }
    if (!resposta.ok) {
      throw new Error("O RiftStream não respondeu à consulta. Tente novamente.");
    }

    const perfil = await resposta.json();
    if (requisicaoAtiva !== controlador) return;

    if (
      perfil.login?.toLowerCase() !== loginApi.toLowerCase() ||
      !Object.hasOwn(nomesClasses, perfil.cls)
    ) {
      throw new Error("O RiftStream retornou um perfil diferente do solicitado.");
    }

    jogadorAtual = jogador;
    atualizarParametrosUrl(jogador, perfil.cls);
    renderizarPerfil(perfil, urlPublica, jogador.plataforma);

    const poderFormatado = Number.isFinite(perfil.power)
      ? ` · Poder ${formatadorInteiro.format(perfil.power)}`
      : "";
    statusConsulta.textContent = `${nomesClasses[perfil.cls]} · Nível ${formatadorInteiro.format(perfil.level)}${poderFormatado}`;
  } catch (erro) {
    if (requisicaoAtiva !== controlador) return;
    statusConsulta.dataset.error = "true";
    if (erro instanceof TypeError || erro.name === "TimeoutError") {
      statusConsulta.textContent =
        window.location.protocol === "file:"
          ? "Falha de conexão em arquivo local. Abra http://127.0.0.1:4173/ no navegador."
          : "Falha de conexão com a API do RiftStream. Tentando reconectar…";
      return;
    }
    statusConsulta.textContent = erro.message;
  }
}

function normalizarEntradaNick(valorBruto, plataformaSelecionada) {
  const texto = String(valorBruto ?? "").trim().toLowerCase();
  const ehPrefixoKick = texto.startsWith("kick:");
  const nickLimpo = texto.replace(/^kick:/, "").replace(/^@/, "");
  const plataforma = ehPrefixoKick
    ? "kick"
    : plataformaSelecionada === "kick"
    ? "kick"
    : "twitch";
  return { nick: nickLimpo, plataforma };
}

formularioBusca.addEventListener("submit", (evento) => {
  evento.preventDefault();
  const dados = new FormData(formularioBusca);
  const { nick, plataforma } = normalizarEntradaNick(
    dados.get("nick"),
    dados.get("plataforma")
  );

  if (!/^[a-z0-9_]{1,25}$/.test(nick)) {
    requisicaoAtiva?.abort();
    requisicaoAtiva = undefined;
    painelResultado.hidden = true;
    statusConsulta.dataset.error = "true";
    statusConsulta.textContent = "Informe um nick válido, sem o link do canal.";
    return;
  }

  inputNick.value = nick;
  selectPlataforma.value = plataforma;
  void consultarPerfil({ nick, plataforma });
});

selectPersonagem.addEventListener("change", () => {
  if (jogadorAtual) {
    void consultarPerfil(jogadorAtual, selectPersonagem.value);
  }
});

const parametrosIniciais = new URLSearchParams(window.location.search);
const nickInicial = parametrosIniciais.get("nick");
if (nickInicial) {
  const { nick, plataforma } = normalizarEntradaNick(
    nickInicial,
    parametrosIniciais.get("plataforma")
  );
  const classeInicial = parametrosIniciais.get("cls");
  if (/^[a-z0-9_]{1,25}$/.test(nick)) {
    inputNick.value = nick;
    selectPlataforma.value = plataforma;
    void consultarPerfil(
      { nick, plataforma },
      Object.hasOwn(nomesClasses, classeInicial) ? classeInicial : undefined
    );
  }
}
