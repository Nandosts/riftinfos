import { buscarJsonApi } from "./api.mjs";
import { escaparHtml, formatadorInteiro, formatadorPercentual } from "./formato.mjs";

const doc = typeof document !== "undefined" ? document : null;
const formatadorDecimal = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });

export const CONFIG_ALQUIMIA_SERVIDOR = Object.freeze({
  // Valores documentados na wiki oficial e no patch de 14/11/2026.
  // O servidor controla estes limites em GET /api/me/alchemy; podem mudar em atualizações.
  fragNeed: 5,
  maxRarityLiberada: 4, // 0=Comum .. 4=Lendário (Evento=5, Imortal=6 e Arcano=7 ficam fora)
  maxLevelLiberado: 4, // Patch 14/11/2026: até nível 110 (faixa do Nv. 4)
  maxLevelWiki: 5, // Wiki oficial do cliente já documenta Nv. 5 (111–150)
  patchReferencia: "14/11",
  loteDestruirTodos: 100,
  // Parâmetros de EXP controlados pelo servidor em /api/me/alchemy (null quando não validados pela sessão).
  destroyXp: null,
  xpIlvlDiv: null,
  craftXpMult: null,
  sessaoValidadaEm: null,
});

export const PECAS_ALQUIMIA = Object.freeze([
  {
    chave: "weapon",
    rotulo: "Arma",
    emblema: ["....#", "...#.", "#.#..", ".#...", "#.#.."],
  },
  {
    chave: "helmet",
    rotulo: "Elmo",
    emblema: [".###.", "#####", "#.#.#", "#...#", "....."],
  },
  {
    chave: "armor",
    rotulo: "Armadura",
    emblema: ["#.#.#", "#####", ".###.", ".###.", ".###."],
  },
  {
    chave: "ring",
    rotulo: "Anel",
    emblema: [".###.", "#...#", "#...#", "#...#", ".###."],
  },
]);

export const RARIDADES_ALQUIMIA = Object.freeze([
  {
    id: 0,
    rotulo: "Comum",
    metal: "Ferro",
    corTexto: "#c9c5d8",
    paleta: ["#9aa0ac", "#d6dae4", "#5a5f6c"],
    proximaRaridadeForja: { id: 1, rotulo: "Incomum", cor: "#6be08a" },
  },
  {
    id: 1,
    rotulo: "Incomum",
    metal: "Cobre",
    corTexto: "#6be08a",
    paleta: ["#d08a4a", "#f2c08a", "#7a4a22"],
    proximaRaridadeForja: { id: 2, rotulo: "Raro", cor: "#58a8ff" },
  },
  {
    id: 2,
    rotulo: "Raro",
    metal: "Prata",
    corTexto: "#58a8ff",
    paleta: ["#dfe8f6", "#ffffff", "#8a98b4"],
    proximaRaridadeForja: { id: 3, rotulo: "Épico", cor: "#c77dff" },
  },
  {
    id: 3,
    rotulo: "Épico",
    metal: "Mithril",
    corTexto: "#c77dff",
    paleta: ["#46d0e0", "#b8f6ff", "#1a7a90"],
    proximaRaridadeForja: { id: 4, rotulo: "Lendário", cor: "#ffb62e" },
  },
  {
    id: 4,
    rotulo: "Lendário",
    metal: "Ouro Rúnico",
    corTexto: "#ffb62e",
    paleta: ["#ffd24a", "#fff2a8", "#a87a12"],
    proximaRaridadeForja: { id: 6, rotulo: "Imortal", cor: "#ff2d3d" },
  },
]);

export const FAIXAS_NIVEL_ALQUIMIA = Object.freeze([
  {
    nivel: 1,
    ilvlLo: 0,
    ilvlHi: 24,
    status: "liberado",
    observacaoMarcos: "Parte da faixa fica abaixo do Nv. 20 (sem engastes de gemas); conjuntos Raro/Épico começam no Nv. 20+ e conjuntos Lendários no Nv. 30+.",
  },
  {
    nivel: 2,
    ilvlLo: 25,
    ilvlHi: 49,
    status: "liberado",
    observacaoMarcos: "Toda a faixa já aceita engastes de gemas (Nv. 20+); itens a partir do Nv. 30 entram na faixa de nível de conjuntos Lendários.",
  },
  {
    nivel: 3,
    ilvlLo: 50,
    ilvlHi: 79,
    status: "liberado",
    observacaoMarcos: "Toda a faixa aceita engastes (Nv. 20+) e fica acima do piso de nível 30 dos conjuntos Lendários.",
  },
  {
    nivel: 4,
    ilvlLo: 80,
    ilvlHi: 110,
    status: "liberado",
    observacaoMarcos: "Maior faixa anunciada na fase experimental (patch de 14/11/2026: até nível 110).",
  },
  {
    nivel: 5,
    ilvlLo: 111,
    ilvlHi: 150,
    status: "wiki",
    observacaoMarcos: "Documentado na wiki do cliente; a liberação depende do limite configurado no servidor. Confira na aba Alquimia do jogo.",
  },
]);

const FATORES_OURO_FORJA = Object.freeze([1, 1.35, 1.8, 2.5, 4, 3, 7, 11]);
const MAX_ITENS_LOTE_APRIMORAR = 30;

const CHANCES_FORJA_PADRAO = Object.freeze({
  fuseEpicChance: 0.5,
  fuseImmortalChance: 0.35,
  fuseArcaneChance: 0.25,
  luckScrollBonus: 0.1,
  origem: "padrao",
});

export function interpretarNumeroDecimal(valor) {
  if (valor === null || valor === undefined) return null;
  if (typeof valor === "number") {
    return Number.isFinite(valor) ? valor : null;
  }
  const limpo = String(valor).trim().replace(/\s+/g, "");
  if (!limpo) return null;
  // Aceita decimal com vírgula ou ponto (ex.: "81,75" ou "81.75")
  const normalizado = limpo.includes(",") && !limpo.includes(".")
    ? limpo.replace(",", ".")
    : limpo.replace(/,/g, ".");
  if (!/^\d+(\.\d+)?$/.test(normalizado)) return null;
  const numero = Number(normalizado);
  return Number.isFinite(numero) ? numero : null;
}

export function formatarNivelReferencia(valor) {
  if (!Number.isFinite(valor)) return "";
  return formatadorDecimal.format(valor);
}

export function obterPecaAlquimia(chave) {
  return PECAS_ALQUIMIA.find((peca) => peca.chave === chave) || PECAS_ALQUIMIA[0];
}

export function obterRaridadeAlquimia(idRaridade) {
  const indice = Math.max(0, Math.min(RARIDADES_ALQUIMIA.length - 1, Math.trunc(Number(idRaridade) || 0)));
  return RARIDADES_ALQUIMIA[indice];
}

export function obterFaixaNivelAlquimia(nivelAlquimia, config = CONFIG_ALQUIMIA_SERVIDOR) {
  const nivelNormalizado = Math.max(1, Math.min(FAIXAS_NIVEL_ALQUIMIA.length, Math.trunc(Number(nivelAlquimia) || 1)));
  const faixaBase = FAIXAS_NIVEL_ALQUIMIA.find((f) => f.nivel === nivelNormalizado) || FAIXAS_NIVEL_ALQUIMIA[0];
  const liberado = faixaBase.nivel <= (config.maxLevelLiberado ?? 4);
  const patchRef = config.patchReferencia || "14/11";
  const rotuloStatus = liberado
    ? (config.sessaoValidadaEm ? `Confirmado em ${config.sessaoValidadaEm}` : `Liberado no patch de ${patchRef}`)
    : "Documentado na wiki";
  const seloCurto = liberado
    ? (config.sessaoValidadaEm ? "Confirmado" : `Patch ${patchRef}`)
    : "Wiki";
  return {
    ...faixaBase,
    liberado,
    rotuloStatus,
    seloCurto,
  };
}

export function compararNivelEntradaSaida(nivelMedioItens, faixa) {
  const media = interpretarNumeroDecimal(nivelMedioItens);
  if (media === null || media < 1) return null;

  const mediaLimitada = Math.min(999, media);
  const difMin = faixa.ilvlLo - mediaLimitada;
  const difMax = faixa.ilvlHi - mediaLimitada;

  if (mediaLimitada > faixa.ilvlHi) {
    const perdaMin = Math.abs(difMax);
    const perdaMax = Math.abs(difMin);
    return {
      nivelMedio: mediaLimitada,
      ilvlLo: faixa.ilvlLo,
      ilvlHi: faixa.ilvlHi,
      relacao: "abaixo",
      resumo: `A faixa gerada (${faixa.ilvlLo}–${faixa.ilvlHi}) fica abaixo da média informada (redução de ${formatarNivelReferencia(perdaMin)} a ${formatarNivelReferencia(perdaMax)} níveis).`,
    };
  }
  if (mediaLimitada < faixa.ilvlLo) {
    return {
      nivelMedio: mediaLimitada,
      ilvlLo: faixa.ilvlLo,
      ilvlHi: faixa.ilvlHi,
      relacao: "acima",
      resumo: `A faixa gerada (${faixa.ilvlLo}–${faixa.ilvlHi}) fica acima da média informada (ganho de +${formatarNivelReferencia(difMin)} a +${formatarNivelReferencia(difMax)} níveis).`,
    };
  }
  return {
    nivelMedio: mediaLimitada,
    ilvlLo: faixa.ilvlLo,
    ilvlHi: faixa.ilvlHi,
    relacao: "dentro",
    resumo: `A média informada está dentro da faixa gerada (pode sair entre −${formatarNivelReferencia(Math.abs(difMin))} e +${formatarNivelReferencia(difMax)} níveis em relação à média).`,
  };
}

function retangulosMetalFragmento(idRaridade, paleta) {
  const [f, h, p] = paleta;
  if (idRaridade === 0) {
    return [
      [3, 6, 10, 6, p], [4, 4, 8, 9, p], [5, 3, 5, 2, p],
      [4, 5, 8, 7, f], [5, 4, 5, 1, f], [5, 5, 3, 2, h],
      [9, 9, 2, 2, p], [6, 10, 2, 1, p], [11, 6, 1, 2, h],
    ];
  }
  if (idRaridade === 1) {
    return [
      [2, 7, 12, 5, p], [3, 6, 10, 1, p], [3, 7, 10, 4, f],
      [4, 5, 8, 2, h], [4, 5, 8, 1, "#ffffff"], [3, 11, 10, 1, p],
      [5, 8, 6, 1, h], [12, 8, 1, 3, p],
    ];
  }
  if (idRaridade === 2) {
    return [
      [4, 3, 8, 10, p], [3, 4, 10, 8, p], [5, 4, 6, 8, f],
      [4, 5, 8, 6, f], [5, 5, 3, 3, h], [6, 6, 1, 1, "#ffffff"],
      [7, 1, 2, 2, "#ffffff"], [6, 2, 4, 1, "#ffffff"],
      [12, 10, 1, 3, h], [11, 11, 3, 1, h],
    ];
  }
  if (idRaridade === 3) {
    return [
      [7, 1, 2, 2, h], [6, 3, 4, 2, h], [5, 5, 6, 3, f],
      [4, 7, 8, 2, f], [5, 9, 6, 2, f], [6, 11, 4, 2, p],
      [7, 13, 2, 1, p], [7, 3, 1, 8, h], [9, 6, 2, 4, p],
      [2, 5, 1, 1, h], [13, 8, 1, 1, h], [3, 10, 1, 1, "#ffffff"],
      [12, 3, 1, 1, "#ffffff"],
    ];
  }
  return [
    [3, 2, 10, 12, p], [4, 3, 8, 10, f], [4, 3, 8, 1, h],
    [4, 3, 1, 10, h], [7, 5, 2, 6, p], [6, 6, 1, 1, p],
    [9, 8, 1, 1, p], [6, 10, 1, 1, p], [7, 5, 2, 1, "#ffffff"],
    [2, 1, 2, 2, "#ffffff"], [12, 1, 2, 2, "#ffffff"],
    [2, 13, 2, 2, h], [12, 13, 2, 2, h],
  ];
}

export function gerarSvgFragmento(chavePeca, idRaridade, { tamanho = 40, decorativo = true, titulo = "" } = {}) {
  const peca = obterPecaAlquimia(chavePeca);
  const raridade = obterRaridadeAlquimia(idRaridade);
  const [, brilho, sombra] = raridade.paleta;
  const retangulos = retangulosMetalFragmento(raridade.id, raridade.paleta);

  // Mini-emblema 5x5 no canto inferior direito (igual à função gp do cliente oficial)
  retangulos.push([10, 10, 6, 6, "#0d0b14"]);
  retangulos.push([10, 10, 6, 1, sombra]);
  retangulos.push([10, 10, 1, 6, sombra]);
  peca.emblema.forEach((linha, dy) => {
    [...linha].forEach((caractere, dx) => {
      if (caractere === "#") {
        retangulos.push([10 + dx, 10 + dy, 1, 1, brilho]);
      }
    });
  });

  const corpoRects = retangulos
    .map(([x, y, w, h, cor]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${cor}"/>`)
    .join("");

  const textoTitulo = titulo || `Fragmento de ${raridade.metal} (${peca.rotulo} ${raridade.rotulo})`;
  const atributosA11y = decorativo
    ? 'aria-hidden="true" focusable="false"'
    : `role="img" aria-label="${escaparHtml(textoTitulo)}"`;
  const tagTitulo = decorativo ? "" : `<title>${escaparHtml(textoTitulo)}</title>`;

  return `<svg class="svg-fragmento" width="${tamanho}" height="${tamanho}" viewBox="0 0 16 16" shape-rendering="crispEdges" ${atributosA11y}>${tagTitulo}${corpoRects}</svg>`;
}

export function calcularEstimativaExpCriacao(idRaridade, nivelAlquimia, config = CONFIG_ALQUIMIA_SERVIDOR) {
  if (
    !Array.isArray(config?.destroyXp) ||
    !Number.isFinite(config?.xpIlvlDiv) ||
    !Number.isFinite(config?.craftXpMult)
  ) {
    return null;
  }
  const raridade = obterRaridadeAlquimia(idRaridade);
  const faixa = obterFaixaNivelAlquimia(nivelAlquimia, config);
  const xpBase = Number(config.destroyXp[raridade.id] ?? 0);
  const divisor = Math.max(1, Number(config.xpIlvlDiv));
  const mediaFaixa = (faixa.ilvlLo + faixa.ilvlHi) / 2;
  const xpDestruirMedio = Math.max(1, Math.round(xpBase * (1 + mediaFaixa / divisor)));
  const xpEstimado = Math.round(xpDestruirMedio * Number(config.craftXpMult));
  return {
    xpEstimado,
    ehEstimativa: true,
    mediaFaixa,
  };
}

export function calcularAlquimiaFragmentos({
  peca = "weapon",
  raridade = 4,
  nivelAlquimia = 4,
  quantidadeItens = 20,
  fragmentosGuardados = 0,
  nivelMedioItens = null,
  config = CONFIG_ALQUIMIA_SERVIDOR,
} = {}) {
  const pecaInfo = obterPecaAlquimia(peca);
  const raridadeInfo = obterRaridadeAlquimia(raridade);
  const faixa = obterFaixaNivelAlquimia(nivelAlquimia, config);
  const custoFragmentos = Math.max(1, Math.trunc(Number(config?.fragNeed) || 5));

  const itensValidos = Math.max(0, Math.min(99999, Math.trunc(Number(quantidadeItens) || 0)));
  const guardadosValidos = Math.max(0, Math.min(99999, Math.trunc(Number(fragmentosGuardados) || 0)));
  const fragmentosTotais = itensValidos + guardadosValidos;

  // 1) Guardando todos os itens criados (sem reciclar o resultado)
  const criacoesGuardando = Math.floor(fragmentosTotais / custoFragmentos);
  const sobraGuardando = fragmentosTotais % custoFragmentos;
  const faltamGuardando = sobraGuardando === 0 ? custoFragmentos : custoFragmentos - sobraGuardando;

  // 2) Reciclando os itens criados de volta para gerar +1 fragmento por resultado descartado
  let saldoReciclando = fragmentosTotais;
  let criacoesReciclando = 0;
  if (custoFragmentos > 1) {
    while (saldoReciclando >= custoFragmentos) {
      criacoesReciclando += 1;
      saldoReciclando = saldoReciclando - custoFragmentos + 1;
    }
  }
  const sobraReciclandoTodos = saldoReciclando;
  // Se o jogador ficar com o último item criado em vez de reciclá-lo, terá 1 fragmento a menos na sobra
  const sobraSeGuardarUltimo = criacoesReciclando > 0 ? Math.max(0, sobraReciclandoTodos - 1) : sobraReciclandoTodos;
  const faltamReciclando = sobraReciclandoTodos === 0 ? custoFragmentos : Math.max(1, custoFragmentos - sobraReciclandoTodos);

  const lotesDestruicao = itensValidos > 0 ? Math.ceil(itensValidos / (config?.loteDestruirTodos || 100)) : 0;
  const estimativaExpCriacao = calcularEstimativaExpCriacao(raridadeInfo.id, faixa.nivel, config);
  const comparativoNivel = compararNivelEntradaSaida(nivelMedioItens, faixa);

  return {
    peca: pecaInfo,
    raridade: raridadeInfo,
    faixa,
    custoFragmentos,
    itensReciclados: itensValidos,
    fragmentosGuardados: guardadosValidos,
    fragmentosTotais,
    lotesDestruicao,
    comparativoNivel,
    guardandoResultados: {
      criacoes: criacoesGuardando,
      itensFinais: criacoesGuardando,
      sobraFragmentos: sobraGuardando,
      faltamParaProxima: faltamGuardando,
    },
    reciclandoResultados: {
      criacoes: criacoesReciclando,
      sobraSeReciclarTodos: sobraReciclandoTodos,
      sobraSeGuardarUltimo,
      criacoesExtras: Math.max(0, criacoesReciclando - criacoesGuardando),
      faltamParaProxima: faltamReciclando,
    },
    estimativaExpCriacao,
  };
}

export function calcularComparacaoDestinos({
  peca = "weapon",
  raridade = 4,
  nivelAlquimia = 4,
  quantidadeItens = 20,
  fragmentosGuardados = 0,
  nivelMedioItens = null,
  chancesWiki = CHANCES_FORJA_PADRAO,
  config = CONFIG_ALQUIMIA_SERVIDOR,
} = {}) {
  const mediaInterpretada = interpretarNumeroDecimal(nivelMedioItens);
  const mediaValida = mediaInterpretada !== null && mediaInterpretada >= 1
    ? Math.min(999, mediaInterpretada)
    : null;

  const alquimia = calcularAlquimiaFragmentos({
    peca,
    raridade,
    nivelAlquimia,
    quantidadeItens,
    fragmentosGuardados,
    nivelMedioItens: mediaValida,
    config,
  });

  const destinoForja = alquimia.raridade.proximaRaridadeForja;
  const itensPorForja = destinoForja.id >= 3 ? 4 : 3; // Regra zl do jogo: t >= 3 ? 4 : 3
  const tentativasForja = Math.floor(alquimia.itensReciclados / itensPorForja);
  const sobraItensForja = alquimia.itensReciclados % itensPorForja;
  const pisoForja = destinoForja.id === 7 ? 130 : destinoForja.id === 6 ? 100 : 0;

  // Preserva média decimal na multiplicação (como a função YI do cliente oficial)
  let nivelMinForja = null;
  let nivelMaxForja = null;
  let pisoAplicado = false;
  let ouroPorTentativaForja = null;
  let ouroTotalForja = null;

  if (mediaValida !== null) {
    nivelMinForja = Math.max(1, pisoForja, Math.floor(mediaValida * 1.15));
    nivelMaxForja = Math.max(nivelMinForja, pisoForja, Math.floor(mediaValida * 1.3));
    pisoAplicado = pisoForja > 0 && nivelMinForja === pisoForja;
    const nivelRefForja = Math.floor((nivelMinForja + nivelMaxForja) / 2);
    const fatorOuro = FATORES_OURO_FORJA[destinoForja.id] ?? 4;
    ouroPorTentativaForja = Math.round((5 + nivelRefForja * 2) * fatorOuro * 2);
    ouroTotalForja = ouroPorTentativaForja * tentativasForja;
  }

  const temRoleta = destinoForja.id >= 4;
  let chanceBaseForja = 1;
  if (destinoForja.id === 4) {
    chanceBaseForja = Number.isFinite(chancesWiki?.fuseEpicChance) ? chancesWiki.fuseEpicChance : 0.5;
  } else if (destinoForja.id === 6) {
    chanceBaseForja = Number.isFinite(chancesWiki?.fuseImmortalChance) ? chancesWiki.fuseImmortalChance : 0.35;
  } else if (destinoForja.id === 7) {
    chanceBaseForja = Number.isFinite(chancesWiki?.fuseArcaneChance) ? chancesWiki.fuseArcaneChance : 0.25;
  }

  const lotesAprimorar = alquimia.itensReciclados > 0
    ? Math.ceil(alquimia.itensReciclados / MAX_ITENS_LOTE_APRIMORAR)
    : 0;

  return {
    nivelMedioItens: mediaValida,
    temNivelReferencia: mediaValida !== null,
    alquimia,
    forja: {
      destinoRaridade: destinoForja,
      itensPorTentativa: itensPorForja,
      tentativasPossiveis: tentativasForja,
      sobraItens: sobraItensForja,
      nivelMin: nivelMinForja,
      nivelMax: nivelMaxForja,
      pisoAplicado,
      pisoForja,
      temRoleta,
      chanceBase: chanceBaseForja,
      ouroPorTentativa: ouroPorTentativaForja,
      ouroTotal: ouroTotalForja,
      origemChance: chancesWiki?.origem || "padrao",
    },
    aprimorar: {
      itensDisponiveis: alquimia.itensReciclados,
      maxPorLote: MAX_ITENS_LOTE_APRIMORAR,
      lotesNecessarios: lotesAprimorar,
    },
  };
}

// ============================================================================
// INTERFACE E CONTROLES DA PÁGINA alquimia.html
// ============================================================================

const estadoPagina = {
  pecaGaleria: "weapon",
  peca: "weapon",
  raridade: 4,
  nivelAlquimia: 4,
  quantidadeItens: 9,
  fragmentosGuardados: 0,
  nivelMedioItens: null,
  tabelaCompletaAberta: null,
  chancesWiki: { ...CHANCES_FORJA_PADRAO },
};

function obterTabelaCompletaAbertaInicial() {
  if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
    return window.matchMedia("(min-width: 641px)").matches;
  }
  return true;
}

function renderizarGaleriaFragmentos() {
  const grade = doc?.querySelector("#galeria-fragmentos");
  if (!grade) return;

  const peca = obterPecaAlquimia(estadoPagina.pecaGaleria);
  grade.innerHTML = RARIDADES_ALQUIMIA.map((raridade) => {
    const svg = gerarSvgFragmento(peca.chave, raridade.id, { tamanho: 48, decorativo: true });
    return `
      <article class="card-fragmento" style="--cor-raridade:${raridade.corTexto};">
        <div class="card-fragmento-icone">${svg}</div>
        <div class="card-fragmento-texto">
          <strong style="color:${raridade.corTexto};">${escaparHtml(raridade.metal)}</strong>
          <span class="small">${escaparHtml(raridade.rotulo)} · ${escaparHtml(peca.rotulo)}</span>
          <span class="muted micro-nota">1 item = 1 frag · ${CONFIG_ALQUIMIA_SERVIDOR.fragNeed} frags = 1 novo</span>
        </div>
      </article>
    `;
  }).join("");

  doc.querySelectorAll("[data-galeria-peca]").forEach((botao) => {
    const ativo = botao.dataset.galeriaPeca === peca.chave;
    botao.classList.toggle("ativa", ativo);
    botao.setAttribute("aria-pressed", ativo ? "true" : "false");
  });
}

function renderizarTabelaFaixas() {
  const tbody = doc?.querySelector("#corpo-tabela-faixas");
  if (!tbody) return;

  tbody.innerHTML = FAIXAS_NIVEL_ALQUIMIA.map((faixaBase) => {
    const faixa = obterFaixaNivelAlquimia(faixaBase.nivel, CONFIG_ALQUIMIA_SERVIDOR);
    const badgeStatus = faixa.liberado
      ? `<span class="badge-alx badge-liberado">✓ ${escaparHtml(faixa.rotuloStatus)}</span>`
      : `<span class="badge-alx badge-wiki">📖 ${escaparHtml(faixa.rotuloStatus)}</span>`;
    return `
      <tr class="${faixa.liberado ? "" : "linha-faixa-wiki"}">
        <th scope="row">Nível ${faixa.nivel}</th>
        <td><strong>Nv. ${faixa.ilvlLo}–${faixa.ilvlHi}</strong></td>
        <td>${badgeStatus}</td>
        <td>${escaparHtml(faixa.observacaoMarcos)}</td>
      </tr>
    `;
  }).join("");
}

function renderizarIconesRadiosCalculadora() {
  const containerPecas = doc?.querySelector("#grupo-radio-peca");
  const containerRaridades = doc?.querySelector("#grupo-radio-raridade");
  const containerNiveis = doc?.querySelector("#grupo-radio-nivel");

  if (containerPecas) {
    containerPecas.innerHTML = PECAS_ALQUIMIA.map((peca) => {
      const id = `radio-peca-${peca.chave}`;
      const checado = estadoPagina.peca === peca.chave ? "checked" : "";
      const svg = gerarSvgFragmento(peca.chave, estadoPagina.raridade, { tamanho: 28, decorativo: true });
      return `
        <div class="opcao-radio-card">
          <input type="radio" id="${id}" name="peca" value="${peca.chave}" class="visually-hidden" ${checado}>
          <label for="${id}" class="rotulo-radio-card">
            <span class="radio-icone">${svg}</span>
            <span class="radio-titulo">${escaparHtml(peca.rotulo)}</span>
          </label>
        </div>
      `;
    }).join("");
  }

  if (containerRaridades) {
    containerRaridades.innerHTML = RARIDADES_ALQUIMIA.map((raridade) => {
      const id = `radio-raridade-${raridade.id}`;
      const checado = estadoPagina.raridade === raridade.id ? "checked" : "";
      const svg = gerarSvgFragmento(estadoPagina.peca, raridade.id, { tamanho: 28, decorativo: true });
      return `
        <div class="opcao-radio-card" style="--cor-raridade:${raridade.corTexto};">
          <input type="radio" id="${id}" name="raridade" value="${raridade.id}" class="visually-hidden" ${checado}>
          <label for="${id}" class="rotulo-radio-card rotulo-radio-raridade">
            <span class="radio-icone">${svg}</span>
            <span class="radio-titulo" style="color:${raridade.corTexto};">${escaparHtml(raridade.rotulo)}</span>
            <span class="radio-subtitulo">${escaparHtml(raridade.metal)}</span>
          </label>
        </div>
      `;
    }).join("");
  }

  if (containerNiveis) {
    containerNiveis.innerHTML = FAIXAS_NIVEL_ALQUIMIA.map((faixaBase) => {
      const faixa = obterFaixaNivelAlquimia(faixaBase.nivel, CONFIG_ALQUIMIA_SERVIDOR);
      const id = `radio-nivel-${faixa.nivel}`;
      const checado = estadoPagina.nivelAlquimia === faixa.nivel ? "checked" : "";
      return `
        <div class="opcao-radio-card">
          <input type="radio" id="${id}" name="nivel_alquimia" value="${faixa.nivel}" class="visually-hidden" ${checado}>
          <label for="${id}" class="rotulo-radio-card ${faixa.liberado ? "" : "rotulo-radio-wiki"}">
            <span class="radio-titulo">Nv. ${faixa.nivel}</span>
            <span class="radio-subtitulo">Itens ${faixa.ilvlLo}–${faixa.ilvlHi}</span>
            <span class="radio-selo ${faixa.liberado ? "selo-liberado" : "selo-wiki"}">${escaparHtml(faixa.seloCurto)}</span>
          </label>
        </div>
      `;
    }).join("");
  }
}

function atualizarIconesRadiosPorSelecao() {
  PECAS_ALQUIMIA.forEach((peca) => {
    const icone = doc?.querySelector(`label[for="radio-peca-${peca.chave}"] .radio-icone`);
    if (icone) {
      icone.innerHTML = gerarSvgFragmento(peca.chave, estadoPagina.raridade, { tamanho: 28, decorativo: true });
    }
  });
  RARIDADES_ALQUIMIA.forEach((raridade) => {
    const icone = doc?.querySelector(`label[for="radio-raridade-${raridade.id}"] .radio-icone`);
    if (icone) {
      icone.innerHTML = gerarSvgFragmento(estadoPagina.peca, raridade.id, { tamanho: 28, decorativo: true });
    }
  });
}

function montarBlocoNivelEntradaSaida(alquimia) {
  const { faixa, comparativoNivel } = alquimia;
  if (!comparativoNivel) {
    return `
      <div class="comparativo-nivel-entrada comparativo-nivel-pendente" data-relacao-nivel="pendente">
        <div class="comparativo-nivel-grid">
          <div>
            <span class="small muted">Seus itens de entrada</span>
            <p class="comparativo-nivel-valor muted">Informe o nível médio acima</p>
          </div>
          <span class="comparativo-seta" aria-hidden="true">➜</span>
          <div>
            <span class="small muted">Saída na Alquimia (Nv. ${faixa.nivel})</span>
            <p class="comparativo-nivel-valor" data-valor="faixa-gerada">Nv. ${faixa.ilvlLo}–${faixa.ilvlHi}</p>
          </div>
          <span class="badge-alx ${faixa.liberado ? "badge-liberado" : "badge-wiki"}">${faixa.liberado ? `✓ ${escaparHtml(faixa.rotuloStatus)}` : `📖 ${escaparHtml(faixa.rotuloStatus)}`}</span>
        </div>
        <p class="small muted" style="margin:8px 0 0;">
          Preencha o <strong>nível médio dos seus itens</strong> no formulário acima (ex.: <code>81,75</code> ou <code>150</code>) para ver se a Alquimia eleva ou reduz o nível em relação às suas peças e calcular a faixa e o ouro da Forja.
        </p>
      </div>
    `;
  }

  const seloRelacao = comparativoNivel.relacao === "abaixo"
    ? '<span class="badge-alx badge-alerta">↓ Saída abaixo da média</span>'
    : comparativoNivel.relacao === "acima"
      ? '<span class="badge-alx badge-liberado">↑ Saída acima da média</span>'
      : '<span class="badge-alx badge-ciano">↔ Média dentro da faixa</span>';

  return `
    <div class="comparativo-nivel-entrada comparativo-nivel-${comparativoNivel.relacao}" data-relacao-nivel="${comparativoNivel.relacao}">
      <div class="comparativo-nivel-grid">
        <div>
          <span class="small muted">Seus itens de entrada</span>
          <p class="comparativo-nivel-valor" data-valor="nivel-entrada">Média Nv. ${escaparHtml(formatarNivelReferencia(comparativoNivel.nivelMedio))}</p>
        </div>
        <span class="comparativo-seta" aria-hidden="true">➜</span>
        <div>
          <span class="small muted">Saída na Alquimia (Nv. ${faixa.nivel})</span>
          <p class="comparativo-nivel-valor" data-valor="faixa-gerada">Nv. ${faixa.ilvlLo}–${faixa.ilvlHi}</p>
        </div>
        <div class="comparativo-badges">
          ${seloRelacao}
          <span class="badge-alx ${faixa.liberado ? "badge-liberado" : "badge-wiki"}">${faixa.liberado ? `✓ ${escaparHtml(faixa.rotuloStatus)}` : `📖 ${escaparHtml(faixa.rotuloStatus)}`}</span>
        </div>
      </div>
      <p class="small comparativo-nivel-resumo">${escaparHtml(comparativoNivel.resumo)}</p>
    </div>
  `;
}

function renderizarResultadosCalculadora() {
  const containerResultado = doc?.querySelector("#resultado-calculadora-alquimia");
  const containerComparacao = doc?.querySelector("#conteudo-comparacao-destinos");
  if (!containerResultado || !containerComparacao) return;

  const detalhesExistente = containerComparacao.querySelector("#detalhes-tabela-comparacao");
  if (detalhesExistente) {
    estadoPagina.tabelaCompletaAberta = detalhesExistente.open;
  } else if (estadoPagina.tabelaCompletaAberta === null) {
    estadoPagina.tabelaCompletaAberta = obterTabelaCompletaAbertaInicial();
  }

  const comparacao = calcularComparacaoDestinos({
    peca: estadoPagina.peca,
    raridade: estadoPagina.raridade,
    nivelAlquimia: estadoPagina.nivelAlquimia,
    quantidadeItens: estadoPagina.quantidadeItens,
    fragmentosGuardados: estadoPagina.fragmentosGuardados,
    nivelMedioItens: estadoPagina.nivelMedioItens,
    chancesWiki: estadoPagina.chancesWiki,
    config: CONFIG_ALQUIMIA_SERVIDOR,
  });

  const { alquimia, forja, aprimorar } = comparacao;
  const svgSelecionado = gerarSvgFragmento(alquimia.peca.chave, alquimia.raridade.id, { tamanho: 40, decorativo: true });

  const avisoNivelWiki = alquimia.faixa.liberado
    ? ""
    : `<p class="aviso-inline-wiki"><strong>Nota sobre o Nível ${alquimia.faixa.nivel}:</strong> esta faixa (${alquimia.faixa.ilvlLo}–${alquimia.faixa.ilvlHi}) está documentada na wiki do cliente, mas o patch de 14/11/2026 liberou até o nível 110 (Nv. 4). A disponibilidade efetiva depende da configuração ativa no servidor.</p>`;

  const textoExpEstimado = alquimia.estimativaExpCriacao
    ? `+≈${formatadorInteiro.format(alquimia.estimativaExpCriacao.xpEstimado)} EXP por criação (estimativa baseada na configuração observada do servidor; pode mudar em ajustes).`
    : "Estimativa exibida na aba Alquimia do jogo (+≈EXP por criação), calculada pelo servidor a partir da raridade e do nível médio da faixa atual.";

  const resumoEntrada = alquimia.fragmentosGuardados > 0
    ? `${formatadorInteiro.format(alquimia.itensReciclados)} equipamento(s) para reciclar + ${formatadorInteiro.format(alquimia.fragmentosGuardados)} fragmento(s) guardado(s) = <strong>${formatadorInteiro.format(alquimia.fragmentosTotais)} fragmentos de ${escaparHtml(alquimia.raridade.metal)}</strong> (${escaparHtml(alquimia.peca.rotulo)} ${escaparHtml(alquimia.raridade.rotulo)})`
    : `${formatadorInteiro.format(alquimia.itensReciclados)} equipamento(s) para reciclar = <strong>${formatadorInteiro.format(alquimia.fragmentosTotais)} fragmentos de ${escaparHtml(alquimia.raridade.metal)}</strong> (${escaparHtml(alquimia.peca.rotulo)} ${escaparHtml(alquimia.raridade.rotulo)})`;

  const detalheLotesDestruicao = alquimia.lotesDestruicao > 1
    ? ` · No jogo, "Destruir todos" processa até ${CONFIG_ALQUIMIA_SERVIDOR.loteDestruirTodos} itens por lote (${alquimia.lotesDestruicao} lotes).`
    : "";

  const textoSobraReciclando = alquimia.reciclandoResultados.criacoes > 0
    ? `Se guardar o último item criado (em vez de reciclá-lo): <strong>1 peça guardada</strong> e <strong>${formatadorInteiro.format(alquimia.reciclandoResultados.sobraSeGuardarUltimo)} fragmento(s)</strong> de sobra. Se reciclar também o último: <strong>0 peças guardadas</strong> e <strong>${formatadorInteiro.format(alquimia.reciclandoResultados.sobraSeReciclarTodos)} fragmento(s)</strong>.`
    : `Ainda não há ${alquimia.custoFragmentos} fragmentos para a primeira criação. Faltam <strong>${formatadorInteiro.format(alquimia.reciclandoResultados.faltamParaProxima)} fragmento(s)</strong>.`;

  containerResultado.innerHTML = `
    <div class="resumo-entrada-calc" style="--cor-raridade:${alquimia.raridade.corTexto};">
      <div class="resumo-entrada-icone">${svgSelecionado}</div>
      <div class="resumo-entrada-texto">
        <p>${resumoEntrada}</p>
        <p class="small muted">Receita documentada na wiki: ${alquimia.custoFragmentos} fragmentos iguais → 1 ${escaparHtml(alquimia.peca.rotulo)} <strong style="color:${alquimia.raridade.corTexto};">${escaparHtml(alquimia.raridade.rotulo)}</strong> (sujeito à configuração do servidor)${detalheLotesDestruicao}</p>
      </div>
    </div>

    ${avisoNivelWiki}
    ${montarBlocoNivelEntradaSaida(alquimia)}

    <div class="grade-dois-modos">
      <article class="card-modo-resultado" id="card-modo-guardando">
        <div class="card-modo-topo">
          <h3>Guardando os resultados</h3>
          <span class="badge-alx badge-neutro">Sem reciclar criados</span>
        </div>
        <p class="valor-destaque-calc" data-valor="criacoes-guardando">${formatadorInteiro.format(alquimia.guardandoResultados.criacoes)} ${alquimia.guardandoResultados.criacoes === 1 ? "criação" : "criações"}</p>
        <dl class="lista-metricas-calc">
          <div>
            <dt>Itens criados guardados</dt>
            <dd><strong>${formatadorInteiro.format(alquimia.guardandoResultados.itensFinais)}</strong> (${escaparHtml(alquimia.peca.rotulo)} ${escaparHtml(alquimia.raridade.rotulo)})</dd>
          </div>
          <div>
            <dt>Fragmentos sobrando</dt>
            <dd><strong data-valor="sobra-guardando">${formatadorInteiro.format(alquimia.guardandoResultados.sobraFragmentos)}</strong> de ${alquimia.custoFragmentos}</dd>
          </div>
          <div>
            <dt>Faltam para mais 1 criação</dt>
            <dd>${formatadorInteiro.format(alquimia.guardandoResultados.faltamParaProxima)} fragmento(s)</dd>
          </div>
        </dl>
      </article>

      <article class="card-modo-resultado" id="card-modo-reciclando">
        <div class="card-modo-topo">
          <h3>Reciclando os resultados</h3>
          <span class="badge-alx badge-ciano">Cada descartado devolve +1 frag</span>
        </div>
        <p class="valor-destaque-calc" data-valor="criacoes-reciclando">${formatadorInteiro.format(alquimia.reciclandoResultados.criacoes)} ${alquimia.reciclandoResultados.criacoes === 1 ? "criação" : "criações"}</p>
        <dl class="lista-metricas-calc">
          <div>
            <dt>Criações extras pelo ciclo</dt>
            <dd><strong>+${formatadorInteiro.format(alquimia.reciclandoResultados.criacoesExtras)}</strong> além das criações diretas</dd>
          </div>
          <div>
            <dt>Sobra (guardando o último item)</dt>
            <dd><strong data-valor="sobra-guardando-ultimo">${formatadorInteiro.format(alquimia.reciclandoResultados.sobraSeGuardarUltimo)}</strong> de ${alquimia.custoFragmentos}</dd>
          </div>
          <div>
            <dt>Sobra (reciclando todos)</dt>
            <dd><strong data-valor="sobra-reciclando">${formatadorInteiro.format(alquimia.reciclandoResultados.sobraSeReciclarTodos)}</strong> de ${alquimia.custoFragmentos}</dd>
          </div>
        </dl>
        <p class="small muted nota-ciclo-reciclar">${textoSobraReciclando}</p>
      </article>
    </div>

    <div class="faixa-gerada-bloco">
      <p class="small muted" style="margin:0;"><strong>Marcos da faixa (Nv. ${alquimia.faixa.ilvlLo}–${alquimia.faixa.ilvlHi}):</strong> ${escaparHtml(alquimia.faixa.observacaoMarcos)}</p>
      <p class="small muted" style="margin:6px 0 0;"><strong>EXP de criação (estimativa):</strong> ${escaparHtml(textoExpEstimado)}</p>
      <p class="small muted" style="margin:6px 0 0;">O cliente do jogo não informa probabilidades de conjuntos nem faixas fechadas de atributos para itens gerados na Alquimia.</p>
    </div>
  `;

  // Textos claros de saldo usado em cada caminho (Alquimia usa itens + fragmentos guardados; Forja e Aprimorar usam só equipamentos)
  const temGuardados = alquimia.fragmentosGuardados > 0;
  const origemSaldoAlquimia = temGuardados
    ? `Usa <strong>${formatadorInteiro.format(alquimia.fragmentosTotais)} frag.</strong> (${formatadorInteiro.format(alquimia.itensReciclados)} equipamento(s) + ${formatadorInteiro.format(alquimia.fragmentosGuardados)} fragmento(s) guardado(s))`
    : `Usa <strong>${formatadorInteiro.format(alquimia.fragmentosTotais)} frag.</strong> (${formatadorInteiro.format(alquimia.itensReciclados)} equipamento(s))`;

  const textoSaldoAlquimia = `${origemSaldoAlquimia}.<br>Guardando: <strong>${formatadorInteiro.format(alquimia.guardandoResultados.criacoes)}</strong> criação(ões) (sobra ${formatadorInteiro.format(alquimia.guardandoResultados.sobraFragmentos)} frag). Reciclando: <strong>${formatadorInteiro.format(alquimia.reciclandoResultados.criacoes)}</strong> criação(ões).`;

  const textoSaldoForja = alquimia.itensReciclados === 0 && temGuardados
    ? `Usa <strong>só equipamentos</strong> (0 informados — os ${formatadorInteiro.format(alquimia.fragmentosGuardados)} fragmentos guardados não entram na Forja).`
    : `${temGuardados ? `Usa <strong>só os ${formatadorInteiro.format(alquimia.itensReciclados)} equipamento(s)</strong> (ignora fragmentos guardados): ` : ""}<strong>${formatadorInteiro.format(forja.tentativasPossiveis)} tentativa(s)</strong> de ${forja.itensPorTentativa} itens${forja.sobraItens > 0 ? ` · sobra ${formatadorInteiro.format(forja.sobraItens)} item(ns)` : " · sem sobra"}.`;

  const textoSaldoAprimorar = alquimia.itensReciclados === 0 && temGuardados
    ? `Usa <strong>só equipamentos</strong> (0 informados — os ${formatadorInteiro.format(alquimia.fragmentosGuardados)} fragmentos guardados não entram no Aprimorar).`
    : aprimorar.itensDisponiveis > 0
      ? `${temGuardados ? `Usa <strong>só os ${formatadorInteiro.format(aprimorar.itensDisponiveis)} equipamento(s)</strong> (ignora fragmentos guardados): ` : ""}<strong>${formatadorInteiro.format(aprimorar.itensDisponiveis)} doador(es)</strong> em ${formatadorInteiro.format(aprimorar.lotesNecessarios)} lote(s) de até ${aprimorar.maxPorLote} peças.`
      : "Informe ao menos 1 equipamento para calcular lotes.";

  const textoChanceForja = forja.temRoleta
    ? `Chance base observada de ${formatadorPercentual.format(forja.chanceBase)} (roleta com risco de perder os itens; soma Gelo até +10 p.p. e Pergaminho de Sorte).`
    : "Sem roleta de falha (sucesso garantido nesta raridade).";

  const textoChanceCurtoForja = forja.temRoleta
    ? `Chance base ${formatadorPercentual.format(forja.chanceBase)} (+ Gelo / Pergaminho)`
    : "Sem roleta de falha";

  const notaPisoForja = forja.pisoAplicado
    ? ` (piso mínimo Nv. ${forja.pisoForja} aplicado)`
    : "";

  const textoNivelForja = comparacao.temNivelReferencia
    ? `<strong>Nv. ${formatadorInteiro.format(forja.nivelMin)}–${formatadorInteiro.format(forja.nivelMax)}</strong> (+15% a +30% sobre média Nv. ${escaparHtml(formatarNivelReferencia(comparacao.nivelMedioItens))})${notaPisoForja}.`
    : `Informe o nível médio dos equipamentos acima para calcular +15% a +30%${forja.pisoForja > 0 ? ` (piso Nv. ${forja.pisoForja} em ${escaparHtml(forja.destinoRaridade.rotulo)})` : ""}.`;

  const textoOuroForja = comparacao.temNivelReferencia
    ? `Estimativa de <strong>${formatadorInteiro.format(forja.ouroPorTentativa)}g</strong> por tentativa${forja.tentativasPossiveis > 0 ? ` (~${formatadorInteiro.format(forja.ouroTotal)}g para ${formatadorInteiro.format(forja.tentativasPossiveis)} tentativa(s))` : ""}.`
    : "Depende do nível médio dos equipamentos (informe acima para estimar o custo por tentativa).";

  const resumoNivelAlquimiaCard = alquimia.comparativoNivel
    ? `<strong>Nv. ${alquimia.faixa.ilvlLo}–${alquimia.faixa.ilvlHi}</strong> (entrada média Nv. ${escaparHtml(formatarNivelReferencia(alquimia.comparativoNivel.nivelMedio))})`
    : `<strong>Nv. ${alquimia.faixa.ilvlLo}–${alquimia.faixa.ilvlHi}</strong> (Alquimia Nv. ${alquimia.faixa.nivel}${alquimia.faixa.liberado ? "" : " · wiki"})`;

  const resumoNivelForjaCard = comparacao.temNivelReferencia
    ? `<strong>Nv. ${formatadorInteiro.format(forja.nivelMin)}–${formatadorInteiro.format(forja.nivelMax)}</strong>${notaPisoForja}`
    : `Informe o nível médio (+15% a +30%${forja.pisoForja > 0 ? `, piso ${forja.pisoForja}` : ""})`;

  const resumoOuroForjaCard = comparacao.temNivelReferencia
    ? `~${formatadorInteiro.format(forja.ouroPorTentativa)}g / tentativa`
    : "Informe o nível médio";

  const rotuloLinhaSaldo = temGuardados
    ? "Saldo usado e resultado"
    : `Com ${formatadorInteiro.format(alquimia.itensReciclados)} equipamento(s)`;

  const atributoOpenDetalhes = estadoPagina.tabelaCompletaAberta ? " open" : "";

  containerComparacao.innerHTML = `
    <div class="grade-resumo-caminhos" aria-label="Resumo por caminho">
      <article class="card-caminho" data-caminho="alquimia">
        <h3>⚗️ Alquimia (Nv. ${alquimia.faixa.nivel})</h3>
        <dl class="lista-caminho">
          <div>
            <dt>Entrega</dt>
            <dd>Novo <strong>${escaparHtml(alquimia.peca.rotulo)} ${escaparHtml(alquimia.raridade.rotulo)}</strong> (mesma raridade)</dd>
          </div>
          <div>
            <dt>Saldo usado</dt>
            <dd>${textoSaldoAlquimia}</dd>
          </div>
          <div>
            <dt>Nível gerado</dt>
            <dd>${resumoNivelAlquimiaCard}</dd>
          </div>
          <div>
            <dt>Risco e ouro</dt>
            <dd>Sem roleta · <strong>0g</strong> na criação (ouro só ao subir nível)</dd>
          </div>
        </dl>
      </article>

      <article class="card-caminho" data-caminho="forja">
        <h3>🔨 Forja (Fundição)</h3>
        <dl class="lista-caminho">
          <div>
            <dt>Entrega</dt>
            <dd>Tenta <strong style="color:${forja.destinoRaridade.cor};">${escaparHtml(alquimia.peca.rotulo)} ${escaparHtml(forja.destinoRaridade.rotulo)}</strong> (+1 etapa)</dd>
          </div>
          <div>
            <dt>Saldo usado</dt>
            <dd>${textoSaldoForja}</dd>
          </div>
          <div>
            <dt>Nível gerado</dt>
            <dd>${resumoNivelForjaCard}</dd>
          </div>
          <div>
            <dt>Risco e ouro</dt>
            <dd>${escaparHtml(textoChanceCurtoForja)} · ${resumoOuroForjaCard}</dd>
          </div>
        </dl>
      </article>

      <article class="card-caminho" data-caminho="aprimorar">
        <h3>⬆️ Aprimorar</h3>
        <dl class="lista-caminho">
          <div>
            <dt>Entrega</dt>
            <dd>Sobe o nível de uma <strong>${escaparHtml(alquimia.peca.rotulo)}</strong> que você já usa</dd>
          </div>
          <div>
            <dt>Saldo usado</dt>
            <dd>${textoSaldoAprimorar}</dd>
          </div>
          <div>
            <dt>Nível gerado</dt>
            <dd>Conforme EXP dos doadores (prévia no jogo)</dd>
          </div>
          <div>
            <dt>Risco e ouro</dt>
            <dd>Sem falha · cobra ouro por item doado</dd>
          </div>
        </dl>
      </article>
    </div>

    <details id="detalhes-tabela-comparacao" class="detalhes-tabela-comparacao"${atributoOpenDetalhes}>
      <summary class="sumario-tabela-comparacao">📋 Tabela comparativa completa (critério por critério)</summary>
      <div class="tabela-alquimia-wrap" tabindex="0" role="region" aria-labelledby="caption-comparacao-destinos">
        <table class="tabela-comparacao-destinos">
          <caption id="caption-comparacao-destinos" class="sr-only">Comparação objetiva entre Alquimia, Forja e Aprimorar</caption>
          <thead>
            <tr>
              <th scope="col">Critério</th>
              <th scope="col">⚗️ Alquimia (Nv. ${alquimia.faixa.nivel})</th>
              <th scope="col">🔨 Forja (Fundição)</th>
              <th scope="col">⬆️ Aprimorar</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">O que entrega</th>
              <td>Cria novo(s) <strong>${escaparHtml(alquimia.peca.rotulo)} ${escaparHtml(alquimia.raridade.rotulo)}</strong> na mesma raridade.</td>
              <td>Tenta subir para <strong style="color:${forja.destinoRaridade.cor};">${escaparHtml(alquimia.peca.rotulo)} ${escaparHtml(forja.destinoRaridade.rotulo)}</strong> (+1 etapa).</td>
              <td>Converte equipamentos em EXP para subir o nível de uma <strong>${escaparHtml(alquimia.peca.rotulo)}</strong> que você já possui.</td>
            </tr>
            <tr>
              <th scope="row">${rotuloLinhaSaldo}</th>
              <td>${textoSaldoAlquimia}</td>
              <td>${textoSaldoForja}</td>
              <td>${textoSaldoAprimorar}</td>
            </tr>
            <tr>
              <th scope="row">Nível resultante</th>
              <td><strong>Nv. ${alquimia.faixa.ilvlLo}–${alquimia.faixa.ilvlHi}</strong> (faixa fixa da Alquimia Nv. ${alquimia.faixa.nivel}${alquimia.faixa.liberado ? "" : " · wiki"}).</td>
              <td>${textoNivelForja}</td>
              <td>Sobe o nível da peça alvo escolhida conforme o EXP dos doadores (o jogo mostra a prévia antes de confirmar).</td>
            </tr>
            <tr>
              <th scope="row">Risco de falha</th>
              <td>Nenhum (criação sem roleta).</td>
              <td>${escaparHtml(textoChanceForja)}</td>
              <td>Nenhum (o ganho de EXP é sempre aplicado).</td>
            </tr>
            <tr>
              <th scope="row">Custo em ouro</th>
              <td><strong>0g</strong> para reciclar e criar (ouro só é cobrado ao subir o nível da Alquimia).</td>
              <td>${textoOuroForja}</td>
              <td>Cobrado por item sacrificado; cresce com raridade e EXP (prévia exibida no jogo antes de confirmar).</td>
            </tr>
            <tr>
              <th scope="row">O que entra / fica fora</th>
              <td>Arma, Elmo, Armadura e Anel até Lendário (e usa fragmentos já guardados). Bloqueia Evento, Imortal, Arcano, cosméticos/auras, consumíveis, equipados, favoritos e itens com gemas.</td>
              <td>Somente equipamentos da mesma raridade e tipo (fragmentos guardados não entram); aceita itens de Evento junto com Épicos e Auras elegíveis. Bloqueia equipados, favoritos, consumíveis e itens com gemas.</td>
              <td>Somente equipamentos do mesmo tipo de peça (independente da raridade; fragmentos guardados não entram). Bloqueia equipados, favoritos e itens com gemas; a peça alvo mantém suas gemas.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </details>

    <p class="note small" style="margin:12px 0 0;">
      A comparação acima apresenta apenas o comportamento de cada mecânica no jogo. A escolha depende do seu objetivo com estes itens — por exemplo, manter a raridade sem risco, tentar avançar raridade e nível, ou investir na peça que você já usa.
    </p>
  `;

  const novoDetalhes = containerComparacao.querySelector("#detalhes-tabela-comparacao");
  novoDetalhes?.addEventListener("toggle", () => {
    estadoPagina.tabelaCompletaAberta = novoDetalhes.open;
  });
}

function vincularEventos() {
  if (!doc) return;

  doc.querySelectorAll("[data-galeria-peca]").forEach((botao) => {
    botao.addEventListener("click", () => {
      estadoPagina.pecaGaleria = botao.dataset.galeriaPeca || "weapon";
      renderizarGaleriaFragmentos();
    });
  });

  const form = doc.querySelector("#form-calculadora-alquimia");
  form?.addEventListener("submit", (evento) => {
    evento.preventDefault();
    renderizarResultadosCalculadora();
  });

  form?.addEventListener("change", (evento) => {
    const alvo = evento.target;
    if (!(alvo instanceof HTMLInputElement)) return;
    if (alvo.name === "peca") {
      estadoPagina.peca = alvo.value;
      atualizarIconesRadiosPorSelecao();
      renderizarResultadosCalculadora();
    } else if (alvo.name === "raridade") {
      estadoPagina.raridade = Number(alvo.value);
      atualizarIconesRadiosPorSelecao();
      renderizarResultadosCalculadora();
    } else if (alvo.name === "nivel_alquimia") {
      estadoPagina.nivelAlquimia = Number(alvo.value);
      renderizarResultadosCalculadora();
    }
  });

  const vincularInputInteiro = (seletor, chaveEstado, { min = 0, max = 99999, padrao = 0 } = {}) => {
    const input = doc.querySelector(seletor);
    if (!input) return;

    const aplicar = (corrigirCampo) => {
      const bruto = input.value.trim();
      if (bruto === "") {
        estadoPagina[chaveEstado] = padrao;
        input.removeAttribute("aria-invalid");
        if (corrigirCampo) input.value = String(padrao);
        renderizarResultadosCalculadora();
        return;
      }
      const numero = Number(bruto);
      const invalido = !Number.isFinite(numero) || numero < min || numero > max;
      if (invalido && !corrigirCampo) return;
      const normalizado = Math.max(min, Math.min(max, Math.trunc(Number.isFinite(numero) ? numero : padrao)));
      estadoPagina[chaveEstado] = normalizado;
      input.removeAttribute("aria-invalid");
      if (corrigirCampo && String(normalizado) !== bruto) {
        input.value = String(normalizado);
      }
      renderizarResultadosCalculadora();
    };

    input.addEventListener("input", () => {
      input.removeAttribute("aria-invalid");
      aplicar(false);
    });
    input.addEventListener("blur", () => {
      const numero = Number(input.value);
      if (input.value.trim() !== "" && (!Number.isFinite(numero) || numero < min || numero > max)) {
        input.setAttribute("aria-invalid", "true");
      }
      aplicar(true);
    });
  };

  vincularInputInteiro("#input-alquimia-quantidade", "quantidadeItens", { min: 0, max: 99999, padrao: 0 });
  vincularInputInteiro("#input-alquimia-guardados", "fragmentosGuardados", { min: 0, max: 99999, padrao: 0 });

  // Campos de nível médio de referência (opcionais, aceitam decimal com vírgula ou ponto e ficam sincronizados)
  const inputsNivelMedio = [
    doc.querySelector("#input-alquimia-nivel-medio"),
    doc.querySelector("#input-comparacao-nivel-medio"),
  ].filter(Boolean);

  const sincronizarInputsNivelMedio = (origem, valorTexto) => {
    inputsNivelMedio.forEach((campo) => {
      if (campo !== origem) {
        campo.value = valorTexto;
        campo.removeAttribute("aria-invalid");
      }
    });
  };

  inputsNivelMedio.forEach((input) => {
    input.addEventListener("input", () => {
      const bruto = input.value.trim();
      input.removeAttribute("aria-invalid");
      if (bruto === "") {
        estadoPagina.nivelMedioItens = null;
        sincronizarInputsNivelMedio(input, "");
        renderizarResultadosCalculadora();
        return;
      }
      const numero = interpretarNumeroDecimal(bruto);
      if (numero !== null && numero >= 1 && numero <= 999) {
        estadoPagina.nivelMedioItens = numero;
        sincronizarInputsNivelMedio(input, bruto);
        renderizarResultadosCalculadora();
      }
    });

    input.addEventListener("blur", () => {
      const bruto = input.value.trim();
      if (bruto === "") {
        estadoPagina.nivelMedioItens = null;
        input.removeAttribute("aria-invalid");
        sincronizarInputsNivelMedio(input, "");
        renderizarResultadosCalculadora();
        return;
      }
      const numero = interpretarNumeroDecimal(bruto);
      if (numero === null || numero < 1 || numero > 999) {
        input.setAttribute("aria-invalid", "true");
        return;
      }
      const formatado = formatarNivelReferencia(numero);
      estadoPagina.nivelMedioItens = numero;
      input.removeAttribute("aria-invalid");
      input.value = formatado;
      sincronizarInputsNivelMedio(input, formatado);
      renderizarResultadosCalculadora();
    });
  });

  doc.querySelectorAll("[data-atalho-quantidade]").forEach((botao) => {
    botao.addEventListener("click", () => {
      const valor = Math.max(0, Math.trunc(Number(botao.dataset.atalhoQuantidade) || 0));
      estadoPagina.quantidadeItens = valor;
      const input = doc.querySelector("#input-alquimia-quantidade");
      if (input) {
        input.value = String(valor);
        input.removeAttribute("aria-invalid");
      }
      renderizarResultadosCalculadora();
    });
  });
}

async function sincronizarChancesWiki() {
  try {
    const wiki = await buscarJsonApi("/api/wiki", undefined, 6000);
    if (wiki && typeof wiki === "object") {
      estadoPagina.chancesWiki = {
        fuseEpicChance: Number.isFinite(wiki.fuseEpicChance) ? wiki.fuseEpicChance : CHANCES_FORJA_PADRAO.fuseEpicChance,
        fuseImmortalChance: Number.isFinite(wiki.fuseImmortalChance) ? wiki.fuseImmortalChance : CHANCES_FORJA_PADRAO.fuseImmortalChance,
        fuseArcaneChance: Number.isFinite(wiki.fuseArcaneChance) ? wiki.fuseArcaneChance : CHANCES_FORJA_PADRAO.fuseArcaneChance,
        luckScrollBonus: Number.isFinite(wiki.luckScrollBonus) ? wiki.luckScrollBonus : CHANCES_FORJA_PADRAO.luckScrollBonus,
        origem: "api",
      };
      renderizarResultadosCalculadora();
    }
  } catch {
    // Mantém os valores padrão observados sem bloquear a página
  }
}

function iniciarPaginaAlquimia() {
  if (!doc || !doc.querySelector("#form-calculadora-alquimia")) return;
  renderizarGaleriaFragmentos();
  renderizarTabelaFaixas();
  renderizarIconesRadiosCalculadora();
  renderizarResultadosCalculadora();
  vincularEventos();
  sincronizarChancesWiki();
}

if (doc) {
  if (doc.readyState === "loading") {
    doc.addEventListener("DOMContentLoaded", iniciarPaginaAlquimia);
  } else {
    iniciarPaginaAlquimia();
  }
}
