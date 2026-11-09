const apiRemota = "https://z6ywq6r3ub.execute-api.us-east-1.amazonaws.com";
const endpointPerfilRemoto = `${apiRemota}/api/profile/`;
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
const abaComparacao = document.querySelector("#aba-comparacao");
const secaoForjas = document.querySelector("#secao-forjas");
const secaoEquipamentos = document.querySelector("#secao-equipamentos");
const secaoComparacao = document.querySelector("#secao-comparacao");
const containerResumoFc = document.querySelector("#resumo-fc");
const containerConjuntos = document.querySelector("#conjuntos-ativos");
const containerAvisoSinergia = document.querySelector("#aviso-sinergia");
const containerListaEquipamentos = document.querySelector("#lista-equipamentos");

const formComparar = document.querySelector("#form-comparar");
const inputCompararNick = document.querySelector("#input-comparar-nick");
const selectCompararPlataforma = document.querySelector("#select-comparar-plataforma");
const btnCompararTop1 = document.querySelector("#btn-comparar-top1");
const statusComparacao = document.querySelector("#status-comparacao");
const resultadoComparacao = document.querySelector("#resultado-comparacao");
const compararP1Card = document.querySelector("#comparar-p1-card");
const compararP1Nome = document.querySelector("#comparar-p1-nome");

let jogadorAtual;
let perfilCarregadoP1;
let plataformaCarregadaP1;
let requisicaoAtiva;

function configurarAbas() {
  const abasConfig = [
    { id: "forjas", btn: abaForjas, sec: secaoForjas },
    { id: "equipamentos", btn: abaEquipamentos, sec: secaoEquipamentos },
    { id: "comparacao", btn: abaComparacao, sec: secaoComparacao },
  ];

  function alternarAba(abaAtiva) {
    abasConfig.forEach(({ id, btn, sec }) => {
      const ativa = id === abaAtiva;
      btn.setAttribute("aria-selected", ativa ? "true" : "false");
      if (ativa) {
        sec.removeAttribute("hidden");
      } else {
        sec.setAttribute("hidden", "until-found");
      }
    });
  }

  abaForjas.addEventListener("click", () => alternarAba("forjas"));
  abaEquipamentos.addEventListener("click", () => alternarAba("equipamentos"));
  if (abaComparacao) {
    abaComparacao.addEventListener("click", () => alternarAba("comparacao"));
  }

  // Sincronização acessível do evento beforematch (busca nativa na página)
  document.addEventListener("beforematch", (evento) => {
    if (secaoEquipamentos && secaoEquipamentos.contains(evento.target)) {
      alternarAba("equipamentos");
    } else if (secaoForjas && secaoForjas.contains(evento.target)) {
      alternarAba("forjas");
    } else if (secaoComparacao && secaoComparacao.contains(evento.target)) {
      alternarAba("comparacao");
    }
  });

  // Fallback para navegadores sem suporte a hidden="until-found"
  if (!("onbeforematch" in HTMLElement.prototype)) {
    abasConfig.forEach(({ id, btn }) => {
      btn.addEventListener("click", () => {
        abasConfig.forEach((a) => {
          a.sec.hidden = a.id !== id;
        });
      });
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
  let statusServidor;
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
      if (resposta.status >= 500 && (rota === urlAwsDireta || rota === rotasTentativa[0])) {
        statusServidor = resposta.status;
      }
    } catch (erro) {
      ultimoErro = erro;
    }
  }

  if (statusServidor) {
    throw new Error(`A API do RiftStream está indisponível (HTTP ${statusServidor}). Tente novamente em instantes.`);
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

  // 3. Aviso explicativo sobre Sinergia Multiplicativa vs Partição do FC
  if (containerAvisoSinergia) {
    containerAvisoSinergia.innerHTML = `
      <strong>Por que a conta fecha exatamente agora?</strong>
      <p>
        Os valores principais em dourado (<strong>+X FC</strong>) dividem com precisão absoluta os <strong>+${formatadorInteiro.format(ganhoTotalEquips)} FC</strong> ganhos com equipamentos (somando 100% da sua força de itens).
      </p>
      <p>
        Já a tag em vermelho <strong>"Se desequipar"</strong> mostra a perda marginal imediata: como o jogo calcula FC multiplicando <em>Ataque × Velocidade × Crítico × Vida × Defesa</em> e bônus de conjunto (+40%), remover uma única peça destrói a sinergia com o resto do set, derrubando mais FC do que a fatia individual daquele item.
      </p>
    `;
  }

  // 4. Ordenação e cálculo dos impactos marginais
  const slotsOrdem = ["weapon", "helmet", "armor", "ring", "cosmetic"];
  const itensOrdenados = [...itensEquipados].sort((a, b) => {
    return slotsOrdem.indexOf(a.slot) - slotsOrdem.indexOf(b.slot);
  });

  const slotsDados = itensOrdenados.map((item) => {
    const itensSemEsteSlot = itensEquipados.filter((it) => it.id !== item.id);
    const fcSemEsteSlot = calcularFc(
      classe,
      calcularStatusSimulados(classe, nivel, atributos, itensSemEsteSlot)
    );
    const perdaMarginalSlot = Math.max(0, fcTotal - fcSemEsteSlot);

    const itensComItemLimpoDeGemas = itensEquipados.map((it) =>
      it.id === item.id ? { ...it, gems: [] } : it
    );
    const fcItemLimpo = calcularFc(
      classe,
      calcularStatusSimulados(classe, nivel, atributos, itensComItemLimpoDeGemas)
    );
    const perdaMarginalGemas = Math.max(0, fcTotal - fcItemLimpo);
    const perdaMarginalItemBase = Math.max(0, fcItemLimpo - fcSemEsteSlot);

    const gemas = item.gems || [];
    const gemasDados = gemas.map((gema, idx) => {
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
      const perdaMarginalGema = Math.max(0, fcTotal - fcSemEstaGema);
      return { gema, idx, perdaMarginalGema };
    });

    return {
      item,
      perdaMarginalSlot,
      perdaMarginalItemBase,
      perdaMarginalGemas,
      gemasDados,
    };
  });

  // 5. Partição proporcional do ganho total entre os slots (soma 100% de ganhoTotalEquips)
  const somaPerdasMarginaisSlots = slotsDados.reduce(
    (acc, s) => acc + s.perdaMarginalSlot,
    0
  );

  let acumuladorFcSlots = 0;
  let idxMaiorSlot = 0;
  let maiorPerdaSlot = -1;

  slotsDados.forEach((s, idx) => {
    if (s.perdaMarginalSlot > maiorPerdaSlot) {
      maiorPerdaSlot = s.perdaMarginalSlot;
      idxMaiorSlot = idx;
    }
  });

  slotsDados.forEach((s) => {
    const proporcaoSlot =
      somaPerdasMarginaisSlots > 0
        ? s.perdaMarginalSlot / somaPerdasMarginaisSlots
        : 0;
    const fcAtribuidoSlot = Math.round(ganhoTotalEquips * proporcaoSlot);
    s.proporcaoSlot = proporcaoSlot;
    s.fcAtribuidoSlot = fcAtribuidoSlot;
    acumuladorFcSlots += fcAtribuidoSlot;
  });

  if (slotsDados.length > 0 && acumuladorFcSlots !== ganhoTotalEquips) {
    slotsDados[idxMaiorSlot].fcAtribuidoSlot += (ganhoTotalEquips - acumuladorFcSlots);
  }

  // 6. Partição interna do slot (Item base vs Gemas) e gemas individuais
  slotsDados.forEach((s) => {
    const somaPartesInternas = s.perdaMarginalItemBase + s.perdaMarginalGemas;
    if (somaPartesInternas > 0) {
      s.fcAtribuidoItemBase = Math.round(
        s.fcAtribuidoSlot * (s.perdaMarginalItemBase / somaPartesInternas)
      );
      s.fcAtribuidoGemasTotal = s.fcAtribuidoSlot - s.fcAtribuidoItemBase;
    } else {
      s.fcAtribuidoItemBase = s.fcAtribuidoSlot;
      s.fcAtribuidoGemasTotal = 0;
    }

    const somaPerdasGemas = s.gemasDados.reduce(
      (acc, g) => acc + g.perdaMarginalGema,
      0
    );
    let acumuladorGemas = 0;
    let idxMaiorGema = 0;
    let maiorPerdaGema = -1;

    s.gemasDados.forEach((g, idx) => {
      if (g.perdaMarginalGema > maiorPerdaGema) {
        maiorPerdaGema = g.perdaMarginalGema;
        idxMaiorGema = idx;
      }
      const propGema =
        somaPerdasGemas > 0 ? g.perdaMarginalGema / somaPerdasGemas : 0;
      const fcAtribuidoGema = Math.round(s.fcAtribuidoGemasTotal * propGema);
      g.fcAtribuidoGema = fcAtribuidoGema;
      g.proporcaoGemaNoItem =
        s.fcAtribuidoSlot > 0 ? fcAtribuidoGema / s.fcAtribuidoSlot : 0;
      acumuladorGemas += fcAtribuidoGema;
    });

    if (s.gemasDados.length > 0 && acumuladorGemas !== s.fcAtribuidoGemasTotal) {
      s.gemasDados[idxMaiorGema].fcAtribuidoGema +=
        (s.fcAtribuidoGemasTotal - acumuladorGemas);
    }
  });

  // 7. Renderização dos cards de equipamentos
  const elementosEquipamentos = slotsDados.map((s) => {
    const item = s.item;
    const ehCosmetico = item.slot === "cosmetic";
    const nomeSlot = nomesSlots[item.slot] || item.slot;
    const nomeRaridade = nomesRaridade[item.rarity] || "Comum";
    const corRaridade = coresRaridade[item.rarity] || "#c9c5d8";

    // Atributos nativos do item
    const chipsAtributos = [];
    for (const [st, rotulo] of Object.entries(rotulosStats)) {
      if (item[st]) {
        const sufixo = st === "crit" || st === "spd" ? "%" : "";
        chipsAtributos.push(`<span class="chip-stat">+${item[st]}${sufixo} ${rotulo}</span>`);
      }
    }

    // Gemas engastadas
    const maxSockets = item.sockets || s.gemasDados.length;
    const cardsGemas = [];

    s.gemasDados.forEach((g) => {
      const gema = g.gema;
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
          <div class="gema-fc-bloco">
            <span class="gema-fc">+${formatadorInteiro.format(g.fcAtribuidoGema)} FC</span>
            <span class="gema-fc-perda">-${formatadorInteiro.format(g.perdaMarginalGema)} se remover</span>
          </div>
        </div>
      `);
    });

    // Slots vazios
    for (let i = s.gemasDados.length; i < maxSockets; i++) {
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
            <span class="tag-fc">+${formatadorInteiro.format(s.fcAtribuidoSlot)} FC (${formatadorPercentual.format(s.proporcaoSlot)} do ganho)</span>
            ${
              !ehCosmetico && s.gemasDados.length > 0
                ? `<span class="tag-fc secundaria">Item: +${formatadorInteiro.format(s.fcAtribuidoItemBase)} FC</span>
                   <span class="tag-fc secundaria">Gemas: +${formatadorInteiro.format(s.fcAtribuidoGemasTotal)} FC</span>`
                : ""
            }
            ${
              s.perdaMarginalSlot > 0
                ? `<span class="tag-fc remover" title="Perda de FC se você desequipar este item agora">Se desequipar: -${formatadorInteiro.format(s.perdaMarginalSlot)} FC</span>`
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

  // 3. Estado e atalho da aba de Comparação
  perfilCarregadoP1 = perfil;
  plataformaCarregadaP1 = plataforma;
  atualizarCardP1Comparacao(perfil, plataforma);

  painelResultado.hidden = false;
}

function atualizarCardP1Comparacao(perfil, plataforma) {
  if (!compararP1Card) return;
  const nome = perfil.displayName || perfil.login;
  const avatarHtml = perfil.avatar
    ? `<img class="p1-card-avatar" src="${perfil.avatar}" alt="${nome}">`
    : `<div class="p1-card-avatar-placeholder"></div>`;
  compararP1Card.innerHTML = `
    ${avatarHtml}
    <div class="p1-card-info">
      <span class="card-versus-tag-plat">${plataforma.toUpperCase()}</span>
      <div class="p1-card-nome">${nome}</div>
      <div class="p1-card-meta">${nomesClasses[perfil.cls] || perfil.cls} · Nv. ${formatadorInteiro.format(perfil.level)}</div>
      <div class="p1-card-fc">${formatadorInteiro.format(perfil.power || 0)} FC</div>
    </div>
  `;

  const top1Classes = {
    cleric: { nick: "shulalino", plataforma: "twitch", rotulo: "shulalino" },
    warrior: { nick: "otaldojorginho", plataforma: "twitch", rotulo: "otaldojorginho" },
    archer: { nick: "isabxf", plataforma: "twitch", rotulo: "isabxf" },
  };
  const top1Atual = top1Classes[perfil.cls] || top1Classes.warrior;
  if (btnCompararTop1) {
    btnCompararTop1.textContent = `⚡ Top 1 (${top1Atual.rotulo})`;
    btnCompararTop1.onclick = () => {
      inputCompararNick.value = top1Atual.nick;
      selectCompararPlataforma.value = top1Atual.plataforma;
      void dispararComparacao(top1Atual.nick, top1Atual.plataforma);
    };
  }
}

async function dispararComparacao(nick2, plataforma2) {
  if (!perfilCarregadoP1) return;
  if (!/^[a-z0-9_\.\-]{1,40}$/i.test(nick2)) {
    statusComparacao.dataset.error = "true";
    statusComparacao.textContent = "Informe um nick válido para o Jogador 2.";
    return;
  }

  delete statusComparacao.dataset.error;
  statusComparacao.textContent = `Consultando ${nick2} na ${plataforma2 === "kick" ? "Kick" : "Twitch"}…`;
  resultadoComparacao.hidden = true;

  try {
    const loginApi2 = plataforma2 === "kick" ? `kick:${nick2}` : nick2;
    const { resposta } = await buscarRespostaPerfil(
      loginApi2,
      perfilCarregadoP1.cls,
      AbortSignal.timeout(9000)
    );

    if (resposta.status === 404) {
      throw new Error(`Jogador 2 ("${nick2}") não foi encontrado na ${plataforma2.toUpperCase()}.`);
    }
    if (!resposta.ok) {
      throw new Error("Falha ao comunicar com os servidores para consultar o Jogador 2.");
    }

    const perfilP2 = await resposta.json();
    if (perfilP2.cls !== perfilCarregadoP1.cls) {
      const nomeClasseP1 = nomesClasses[perfilCarregadoP1.cls] || perfilCarregadoP1.cls;
      const nomeClasseP2 = nomesClasses[perfilP2.cls] || perfilP2.cls;
      throw new Error(
        `A comparação só é permitida entre jogadores da mesma classe (${nomeClasseP1}). O Jogador 2 não possui personagem dessa classe (classe ativa: ${nomeClasseP2}).`
      );
    }
    renderizarPainelComparacao(perfilCarregadoP1, plataformaCarregadaP1, perfilP2, plataforma2);
    statusComparacao.textContent = `Comparação atualizada entre ${perfilCarregadoP1.displayName || perfilCarregadoP1.login} e ${perfilP2.displayName || perfilP2.login}.`;
    resultadoComparacao.hidden = false;
  } catch (erro) {
    statusComparacao.dataset.error = "true";
    statusComparacao.textContent = erro.message || "Erro ao comparar jogadores.";
  }
}

function renderizarPainelComparacao(p1, plat1, p2, plat2) {
  const at1 = inferirAtributosBase(p1);
  const st1 = calcularStatusSimulados(p1.cls, p1.level, at1, p1.equipped || []);
  const fc1 = calcularFc(p1.cls, st1);
  const stSemItens1 = calcularStatusSimulados(p1.cls, p1.level, at1, []);
  const fcSemItens1 = calcularFc(p1.cls, stSemItens1);
  const ganhoEquips1 = Math.max(0, fc1 - fcSemItens1);
  const dps1 = st1.atk * st1.aspd * (1 + (st1.crit / 100) * (0.5 + st1.critDmg));
  const ehp1 = st1.maxHp * (1 + st1.def * 0.04);
  const agg1 = agregarItens(p1.equipped || []);

  const at2 = inferirAtributosBase(p2);
  const st2 = calcularStatusSimulados(p2.cls, p2.level, at2, p2.equipped || []);
  const fc2 = calcularFc(p2.cls, st2);
  const stSemItens2 = calcularStatusSimulados(p2.cls, p2.level, at2, []);
  const fcSemItens2 = calcularFc(p2.cls, stSemItens2);
  const ganhoEquips2 = Math.max(0, fc2 - fcSemItens2);
  const dps2 = st2.atk * st2.aspd * (1 + (st2.crit / 100) * (0.5 + st2.critDmg));
  const ehp2 = st2.maxHp * (1 + st2.def * 0.04);
  const agg2 = agregarItens(p2.equipped || []);

  const nome1 = p1.displayName || p1.login;
  const nome2 = p2.displayName || p2.login;
  const p1VenceFc = fc1 >= fc2;
  const diffFc = Math.abs(fc1 - fc2);
  const menorFc = Math.min(fc1, fc2);
  const pctDiffFc = menorFc > 0 ? (diffFc / menorFc) * 100 : 0;
  const vencedorFc = p1VenceFc ? nome1 : nome2;

  // Versus Card
  const htmlVersus = `
    <div class="bloco-versus-topo">
      <div class="card-versus-jogador ${p1VenceFc ? 'vencedor' : ''}">
        ${p1.avatar ? `<img class="card-versus-avatar" src="${p1.avatar}" alt="${nome1}">` : '<div class="card-versus-avatar"></div>'}
        <div class="card-versus-detalhes">
          <span class="eyebrow">${plat1.toUpperCase()}</span>
          <div class="card-versus-nome">${nome1}</div>
          <div class="card-versus-meta">${nomesClasses[p1.cls] || p1.cls} · Nv. ${p1.level}</div>
          <div class="card-versus-fc">${formatadorInteiro.format(fc1)} FC</div>
        </div>
      </div>

      <div class="badge-diferenca-fc">
        <span class="eyebrow">VANTAGEM DE FORÇA</span>
        <strong>${vencedorFc}</strong>
        <span>+${formatadorInteiro.format(diffFc)} FC (+${pctDiffFc.toFixed(1)}%)</span>
      </div>

      <div class="card-versus-jogador ${!p1VenceFc ? 'vencedor' : ''}">
        ${p2.avatar ? `<img class="card-versus-avatar" src="${p2.avatar}" alt="${nome2}">` : '<div class="card-versus-avatar"></div>'}
        <div class="card-versus-detalhes">
          <span class="eyebrow">${plat2.toUpperCase()}</span>
          <div class="card-versus-nome">${nome2}</div>
          <div class="card-versus-meta">${nomesClasses[p2.cls] || p2.cls} · Nv. ${p2.level}</div>
          <div class="card-versus-fc">${formatadorInteiro.format(fc2)} FC</div>
        </div>
      </div>
    </div>
  `;

  function gerarLinhaStat(rotulo, v1, v2, formatadorFn) {
    const n1 = Number(v1);
    const n2 = Number(v2);
    const p1Ganhou = n1 > n2;
    const p2Ganhou = n2 > n1;
    const diff = Math.abs(n1 - n2);
    const menor = Math.min(n1, n2);
    const pct = menor > 0 ? (diff / menor) * 100 : 0;
    const tagDiff = diff > 0 ? `<span class="tag-diff pos">+${formatadorFn(diff)} (+${pct.toFixed(1)}%)</span>` : "";

    return `
      <tr>
        <th scope="row">${rotulo}</th>
        <td class="${p1Ganhou ? 'vencedor' : ''}">
          ${formatadorFn(n1)} ${p1Ganhou ? tagDiff : ''}
        </td>
        <td class="${p2Ganhou ? 'vencedor' : ''}">
          ${formatadorFn(n2)} ${p2Ganhou ? tagDiff : ''}
        </td>
      </tr>
    `;
  }

  const fmtInt = (val) => formatadorInteiro.format(Math.round(val));
  const fmtDec1 = (val) => Number(val).toFixed(1);
  const fmtDec2 = (val) => Number(val).toFixed(2);
  const fmtPct1 = (val) => `${Number(val).toFixed(1)}%`;

  // 1. Tabela de Atributos
  const htmlTabelaStats = `
    <div class="secao-comparacao-bloco">
      <h3 class="titulo-secao-comp">Atributos e Estatísticas de Combate</h3>
      <div class="table-wrap">
        <table class="tabela-comp">
          <thead>
            <tr>
              <th scope="col">Atributo</th>
              <th scope="col">${nome1}</th>
              <th scope="col">${nome2}</th>
            </tr>
          </thead>
          <tbody>
            ${gerarLinhaStat("Força de Combate (FC)", fc1, fc2, fmtInt)}
            ${gerarLinhaStat("Nível do Personagem", p1.level, p2.level, fmtInt)}
            ${gerarLinhaStat("Ataque (ATK)", st1.atk, st2.atk, fmtDec1)}
            ${gerarLinhaStat("Defesa (DEF)", st1.def, st2.def, fmtDec1)}
            ${gerarLinhaStat("Vida Máxima (HP)", st1.maxHp, st2.maxHp, fmtInt)}
            ${gerarLinhaStat("Velocidade de Ataque (ASPD)", st1.aspd, st2.aspd, fmtDec2)}
            ${gerarLinhaStat("Taxa de Crítico", st1.crit, st2.crit, fmtPct1)}
            ${gerarLinhaStat("Bônus de Dano Crítico", st1.critDmg * 100, st2.critDmg * 100, fmtPct1)}
            ${gerarLinhaStat("Vida Efetiva (EHP)", ehp1, ehp2, fmtInt)}
            ${gerarLinhaStat("DPS Estimado", dps1, dps2, fmtInt)}
            ${gerarLinhaStat("FC Base (sem itens)", fcSemItens1, fcSemItens2, fmtInt)}
            ${gerarLinhaStat("Ganho com Equipamentos", ganhoEquips1, ganhoEquips2, fmtInt)}
          </tbody>
        </table>
      </div>
    </div>
  `;

  // 2. Equipamentos e Conjuntos
  const slotsComparar = ["weapon", "helmet", "armor", "ring"];
  const itensP1 = p1.equipped || [];
  const itensP2 = p2.equipped || [];

  const mediaIlvl1 = itensP1.filter((i) => i.slot !== "cosmetic").reduce((a, b) => a + (b.itemLevel || 0), 0) / Math.max(1, itensP1.filter((i) => i.slot !== "cosmetic").length);
  const mediaIlvl2 = itensP2.filter((i) => i.slot !== "cosmetic").reduce((a, b) => a + (b.itemLevel || 0), 0) / Math.max(1, itensP2.filter((i) => i.slot !== "cosmetic").length);

  function formatarResumoConjuntos(agg) {
    const sets = [];
    for (const [k, count] of Object.entries(agg.contagemConjuntos)) {
      if (count >= 2 && catalogoConjuntos[k]) {
        sets.push(`${catalogoConjuntos[k].nome} (${count}/3)`);
      }
    }
    return sets.length > 0 ? sets.join(" · ") : "Nenhum conjunto ativo";
  }

  const linhasEquipamentos = slotsComparar.map((s) => {
    const it1 = itensP1.find((i) => i.slot === s);
    const it2 = itensP2.find((i) => i.slot === s);
    const nomeSlot = nomesSlots[s] || s;

    const desc1 = it1
      ? `<span style="color: ${coresRaridade[it1.rarity] || '#fff'}; font-weight: 600;">${it1.name}</span> <small style="color: var(--muted);">(Nv. ${it1.itemLevel || 1})</small>`
      : '<span style="color: var(--muted);">—</span>';
    const desc2 = it2
      ? `<span style="color: ${coresRaridade[it2.rarity] || '#fff'}; font-weight: 600;">${it2.name}</span> <small style="color: var(--muted);">(Nv. ${it2.itemLevel || 1})</small>`
      : '<span style="color: var(--muted);">—</span>';

    return `
      <tr>
        <th scope="row">${nomeSlot}</th>
        <td>${desc1}</td>
        <td>${desc2}</td>
      </tr>
    `;
  }).join("");

  const htmlEquipamentos = `
    <div class="secao-comparacao-bloco">
      <h3 class="titulo-secao-comp">Equipamentos e Conjuntos</h3>
      <div class="table-wrap">
        <table class="tabela-comp">
          <thead>
            <tr>
              <th scope="col">Peça / Métrica</th>
              <th scope="col">${nome1}</th>
              <th scope="col">${nome2}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Conjunto Ativo</th>
              <td style="color: var(--gold); font-weight: 600;">${formatarResumoConjuntos(agg1)}</td>
              <td style="color: var(--gold); font-weight: 600;">${formatarResumoConjuntos(agg2)}</td>
            </tr>
            ${gerarLinhaStat("Média de Item Level", mediaIlvl1, mediaIlvl2, fmtDec1)}
            ${linhasEquipamentos}
          </tbody>
        </table>
      </div>
    </div>
  `;

  // 3. Gemas
  const gemas1 = itensP1.flatMap((i) => i.gems || []);
  const gemas2 = itensP2.flatMap((i) => i.gems || []);
  const gemasSupremas1 = gemas1.filter((g) => g.tier === 5).length;
  const gemasSupremas2 = gemas2.filter((g) => g.tier === 5).length;

  const htmlGemas = `
    <div class="secao-comparacao-bloco">
      <h3 class="titulo-secao-comp">Gemas Engastadas</h3>
      <div class="table-wrap">
        <table class="tabela-comp">
          <thead>
            <tr>
              <th scope="col">Estatística de Gemas</th>
              <th scope="col">${nome1}</th>
              <th scope="col">${nome2}</th>
            </tr>
          </thead>
          <tbody>
            ${gerarLinhaStat("Total de Gemas", gemas1.length, gemas2.length, fmtInt)}
            ${gerarLinhaStat("Gemas Supremas (Tier 5)", gemasSupremas1, gemasSupremas2, fmtInt)}
            ${gerarLinhaStat("Bônus de % DEF nas Gemas", agg1.gemasPercent.def / 10, agg2.gemasPercent.def / 10, fmtPct1)}
            ${gerarLinhaStat("Bônus de % HP nas Gemas", agg1.gemasPercent.hp / 10, agg2.gemasPercent.hp / 10, fmtPct1)}
            ${gerarLinhaStat("Velocidade (SPD) nas Gemas", agg1.gemasFixas.spd, agg2.gemasFixas.spd, fmtInt)}
            ${gerarLinhaStat("Crítico (CRIT) nas Gemas", agg1.gemasFixas.crit, agg2.gemasFixas.crit, fmtInt)}
            ${gerarLinhaStat("Ataque (ATK) nas Gemas", agg1.gemasFixas.atk, agg2.gemasFixas.atk, fmtInt)}
          </tbody>
        </table>
      </div>
    </div>
  `;

  // 4. Forjas
  function celulaForja(p, chave) {
    const tryCnt = p.counters?.[`fuse_${chave}_try`] ?? 0;
    const okCnt = p.counters?.[`fuse_${chave}_ok`] ?? 0;
    const taxa = tryCnt > 0 ? ((okCnt / tryCnt) * 100).toFixed(1) + "%" : "—";
    return `${formatadorInteiro.format(okCnt)}/${formatadorInteiro.format(tryCnt)} (${taxa})`;
  }

  const htmlForjas = `
    <div class="secao-comparacao-bloco">
      <h3 class="titulo-secao-comp">Histórico de Forjas</h3>
      <div class="table-wrap">
        <table class="tabela-comp">
          <thead>
            <tr>
              <th scope="col">Raridade</th>
              <th scope="col">${nome1}</th>
              <th scope="col">${nome2}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row" style="color: #c77dff;">Épico</th>
              <td>${celulaForja(p1, "epic")}</td>
              <td>${celulaForja(p2, "epic")}</td>
            </tr>
            <tr>
              <th scope="row" style="color: #ff8073;">Imortal</th>
              <td>${celulaForja(p1, "imm")}</td>
              <td>${celulaForja(p2, "imm")}</td>
            </tr>
            <tr>
              <th scope="row" style="color: #ff8de6;">Arcano</th>
              <td>${celulaForja(p1, "arc")}</td>
              <td>${celulaForja(p2, "arc")}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  resultadoComparacao.innerHTML = `
    ${htmlVersus}
    ${htmlTabelaStats}
    ${htmlEquipamentos}
    ${htmlGemas}
    ${htmlForjas}
  `;
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
          : "Falha de conexão com a API do RiftStream. Tente novamente em instantes.";
      return;
    }
    statusConsulta.textContent = erro.message;
  }
}

function normalizarEntradaNick(valorBruto, plataformaSelecionada) {
  let texto = String(valorBruto ?? "").trim();
  let plataforma = plataformaSelecionada === "kick" ? "kick" : "twitch";

  // Suporte a URLs completas ou parciais do RiftStream
  // Ex: https://riftstream.com.br/perfil/kick/jeck-360 ou https://riftstream.com.br/perfil/xxmarciano
  const matchRift = texto.match(/riftstream\.com\.br\/perfil\/(?:(kick|twitch)\/)?([a-z0-9_\.\-]+)/i);
  if (matchRift) {
    if (matchRift[1]) {
      plataforma = matchRift[1].toLowerCase();
    }
    texto = matchRift[2];
  } else {
    // Suporte a URLs diretas de canais do Kick ou Twitch
    const matchKick = texto.match(/kick\.com\/([a-z0-9_\.\-]+)/i);
    const matchTwitch = texto.match(/twitch\.tv\/([a-z0-9_\.\-]+)/i);
    if (matchKick) {
      plataforma = "kick";
      texto = matchKick[1];
    } else if (matchTwitch) {
      plataforma = "twitch";
      texto = matchTwitch[1];
    }
  }

  // Suporte a prefixos explícitos (kick:nick, kick/nick, etc.)
  if (/^kick[:/]/i.test(texto)) {
    plataforma = "kick";
    texto = texto.replace(/^kick[:/]/i, "");
  } else if (/^twitch[:/]/i.test(texto)) {
    plataforma = "twitch";
    texto = texto.replace(/^twitch[:/]/i, "");
  }

  const nickLimpo = texto.replace(/^@/, "").trim().toLowerCase();
  return { nick: nickLimpo, plataforma };
}

formularioBusca.addEventListener("submit", (evento) => {
  evento.preventDefault();
  const dados = new FormData(formularioBusca);
  const { nick, plataforma } = normalizarEntradaNick(
    dados.get("nick"),
    dados.get("plataforma")
  );

  if (!/^[a-z0-9_\.\-]{1,40}$/i.test(nick)) {
    requisicaoAtiva?.abort();
    requisicaoAtiva = undefined;
    painelResultado.hidden = true;
    statusConsulta.dataset.error = "true";
    statusConsulta.textContent = "Informe um nick válido (ex. jeck-360 ou otaldojorginho).";
    return;
  }

  inputNick.value = nick;
  selectPlataforma.value = plataforma;
  void consultarPerfil({ nick, plataforma });
});

if (formComparar) {
  formComparar.addEventListener("submit", (evento) => {
    evento.preventDefault();
    const dados = new FormData(formComparar);
    const { nick, plataforma } = normalizarEntradaNick(
      dados.get("nick2"),
      dados.get("plataforma2")
    );
    void dispararComparacao(nick, plataforma);
  });
}

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
  if (/^[a-z0-9_\.\-]{1,40}$/i.test(nick)) {
    inputNick.value = nick;
    selectPlataforma.value = plataforma;
    void consultarPerfil(
      { nick, plataforma },
      Object.hasOwn(nomesClasses, classeInicial) ? classeInicial : undefined
    );
  }
}

// Atualiza dinamicamente o placeholder com o nick atual do Top 1 do ranking geral
async function atualizarPlaceholderTop1() {
  const rotas = [
    "/api/ranking/characters?page=1&size=1",
    `${apiRemota}/api/ranking/characters?page=1&size=1`,
  ];
  for (const rota of rotas) {
    try {
      const resp = await fetch(rota, { signal: AbortSignal.timeout(3000) });
      if (!resp.ok) continue;
      const dados = await resp.json();
      const top1 = dados?.items?.[0]?.login;
      if (top1) {
        inputNick.placeholder = `Ex. ${top1}`;
        break;
      }
    } catch {}
  }
}
void atualizarPlaceholderTop1();
