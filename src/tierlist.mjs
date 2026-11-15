import {
  catalogoAneis,
  catalogoArmas,
  catalogoConjuntos,
  nomesClasses,
} from "./dados.mjs";
import { calcularFc, calcularStatusSimulados } from "./combate.mjs";
import { aplicarAtributosPadraoNoItem, criarGemaPreset } from "./simulador/estado.mjs";
import { escaparHtml, formatarNumeroCompacto } from "./formato.mjs";

const containerTabela = document.querySelector("#tierlist-tabela");
const containerDetalhe = document.querySelector("#tierlist-detalhe");
const descricaoModo = document.querySelector("#tierlist-descricao-modo");

let modoAtual = "utilidade"; // "utilidade" | "fc"
let categoriaAtual = "todos"; // "todos" | "warrior" | "archer" | "cleric" | "ring"
let itemSelecionadoId = null;

// Classificação prática de utilidade (Chefe, Raid, Ondas, Suporte) baseada nos efeitos reais
const UTILIDADE_CONJUNTOS = {
  // Guerreiro
  singular: { tier: "S+", tag: "Chefe / DPS%", motivo: "Insubstituível contra chefes de zona alta: tira 4% da vida máxima do chefe a cada 13s ignorando defesa." },
  thunderlord: { tier: "S", tag: "Dano + Stun", motivo: "Maior dano bruto Arcano do Guerreiro (+48% ATK, +15% VEL) com raio em cadeia a cada 11s e atordoamento." },
  tamer: { tier: "S", tag: "Sangramento", motivo: "Equilibrado em ataque e defesa; aplica sangramento puro que ignora defesa e reduz velocidade de ataque do alvo." },
  chrono: { tier: "A", tag: "Stun Global", motivo: "Maior duração de atordoamento/congelamento do jogo (1,7s monstros / 0,9s chefe a cada 14s), ótimo para controle." },
  obsidian: { tier: "A", tag: "Tanque / Escudo", motivo: "Focado em sobrevivência máxima (+48% HP, +40% DEF) com escudo de 10% a cada 12s; menor DPS entre os Arcanos." },
  strongman: { tier: "B", tag: "Stun Curto", motivo: "Bom ataque e stun curto de perto (1,3s / 0,5s chefe a cada 12s), mas perde em alcance e dano para Trovão/Domador." },
  ember: { tier: "B", tag: "Auto-Revive", motivo: "Útil como set de entrada na Raid pelo auto-revive (50% HP), porém superado por Anel do Coração do Vazio / Fênix." },
  gore: { tier: "B", tag: "Roubo de Vida", motivo: "Bom sustento solo no começo dos Imortais (25% lifesteal a cada 8s), mas escala menos no endgame." },

  // Arqueiro
  abysshunter: { tier: "S+", tag: "DPS Chefe + Cura", motivo: "Maior potencial ofensivo Arcano (+58% ATK, +20% VEL, +14% CRÍT) e disparo de 3,2× ATK no alvo de maior vida + autocura." },
  auroraborealis: { tier: "S", tag: "DPS + Escudo", motivo: "Combina ótimo dano em área (1,4× ATK) com escudo de 10% HP para o time inteiro a cada 12s." },
  firework: { tier: "S", tag: "Dano Explosivo", motivo: "Forte em grupos e chefe (2,4× ATK no alvo principal a cada 10s com +48% ATK, +18% VEL e +12% CRÍT)." },
  trapeze: { tier: "A", tag: "Velocidade", motivo: "Muito rápido (+33% VEL) e bate em até 4 alvos a cada 9s (1,8× ATK), ótimo para limpar ondas." },
  predator: { tier: "A", tag: "100% Crítico", motivo: "Mesmo sendo Imortal, garante 100% de Crítico por 3,5s a cada 9s — o melhor Imortal de dano para Arqueiro." },
  tempest: { tier: "B", tag: "Lentidão", motivo: "Bom set Imortal de transição com +37% VEL e redução de velocidade nos inimigos." },
  dragon: { tier: "B", tag: "Dano Imortal", motivo: "Bom bônus de ataque Imortal (+60% ATK) com baforada de fogo a cada 11s." },
  luna: { tier: "C", tag: "Início Imortal", motivo: "Bons status iniciais de Imortal, mas efeito em área (2 flechas) fica atrás dos demais." },

  // Clérigo
  seraphgold: { tier: "S+", tag: "Cura + Escudo", motivo: "Melhor suporte geral do jogo: +90% HP, +65% ATK e cura de 20–30% HP + escudo de 8% no time a cada 14s." },
  fortune: { tier: "S+", tag: "Escudo em Grupo", motivo: "Rei da proteção na Raid e chefes: aplica escudo de 25% HP por 7s + cura de 10% no time a cada 12s." },
  worldtree: { tier: "S+", tag: "Revive na Raid", motivo: "Mesmo sendo Imortal, revive 1 aliado morto a cada 15s (50% HP) — insubstituível na Raid Covil de Vexxaris." },
  eclipsepriest: { tier: "S", tag: "Stun + Dano", motivo: "Melhor Clérigo ofensivo e de controle: +85% ATK e atordoa a tela inteira (1,3s monstros / 0,5s chefe) a cada 15s." },
  communion: { tier: "A", tag: "Buff +30% ATK", motivo: "Excelente set Imortal de suporte ofensivo (+30% ATK para o time por 5s + 25% de cura a cada 12s)." },
  illusion: { tier: "A", tag: "Híbrido", motivo: "Status Arcanos altos (+75% ATK, +60% HP), mas efeito aleatório (1/3 cura, 1/3 escudo, 1/3 dano) reduz previsibilidade." },
  constel: { tier: "B", tag: "Escudo Imortal", motivo: "Versão Imortal da Madame Cartomante (escudo de 20% HP por 6s a cada 16s)." },
  echo: { tier: "C", tag: "Skill Dupla", motivo: "Zera o cooldown da próxima cura a cada 18s; útil solo, mas entrega menos utilidade em grupo." },
};

const UTILIDADE_ANEIS = {
  18: { tier: "S+", tag: "Raid · ATK/CRÍT", motivo: "Exclusivo da Raid Covil de Vexxaris: maior pacote bruto de Ataque e Crítico do jogo para maximizar dano e FC ofensivo." },
  14: { tier: "S+", tag: "Eco +20% DPS", motivo: "Eco do Eclipse repete 100% do golpe em 20% das vezes (+20% DPS médio em chefe) e ricocheteia 60% em 2 alvos." },
  15: { tier: "S+", tag: "Auto-Revive 70%", motivo: "Essencial na Raid e em builds de sobrevivência: revive automaticamente com 70% HP + 40% escudo e dá ótima Vida/Defesa." },
  19: { tier: "S", tag: "Raid · Tanque/VEL", motivo: "Exclusivo da Raid Covil de Vexxaris: maior ganho de Vida, Defesa e +18% Velocidade para resistir na linha de frente." },
  16: { tier: "S", tag: "Escala +40% ATK", motivo: "Ganha até +40% ATK acumulando abates na onda/fase e tem +18% VEL; excelente para limpar ondas e farmar." },
  17: { tier: "A", tag: "Limpa Controle", motivo: "A cada 10s remove stun/lentidão, dá 12% escudo e cura 8% HP; ótimo anel defensivo utilitário." },
  10: { tier: "A", tag: "Sangramento", motivo: "Melhor anel Imortal contra chefes de defesa muito alta: aplica sangramento que ignora defesa (60% ATK/s por 3s)." },
  13: { tier: "B", tag: "Revive Imortal", motivo: "Ótima opção Imortal antes do Coração do Vazio: garante auto-revive com 40% HP." },
  12: { tier: "B", tag: "Finalizador", motivo: "+60% dano quando o alvo está abaixo de 30% de vida; bom em Imortal, perde para passivas Arcanas." },
  11: { tier: "S", tag: "Roubo de Vida 8%", motivo: "Cura 8% de TODO o dano causado sem cooldown (golpes, skills e procs): enche a vida inteira em 1–2 hits contra chefes se você não tomar hit-kill." },
};

function calcularFcPadraoConjunto(setKey, setInfo) {
  const cls = setInfo.classe;
  const rar = setInfo.raridadePadrao;
  const base = { str: 500, agi: 500, vit: 500, def: 500, luk: 100 };
  const nivel = 750;
  const itens = [
    { slot: "helmet", rarity: rar, itemLevel: 300, kind: setInfo.elmoKind, set: setKey, look: 0, sockets: rar >= 7 ? 6 : 5 },
    { slot: "armor", rarity: rar, itemLevel: 300, kind: setInfo.armaduraKind, set: setKey, look: 0, sockets: rar >= 7 ? 6 : 5 },
    { slot: "weapon", rarity: rar, itemLevel: 300, kind: setInfo.armaKind, set: setKey, look: 0, sockets: rar >= 7 ? 6 : 5 },
    { slot: "ring", rarity: 7, itemLevel: 300, kind: "ring", look: 14, sockets: 6 },
  ].map((it) => {
    aplicarAtributosPadraoNoItem(it);
    it.gems = Array.from({ length: it.sockets }, () => criarGemaPreset("topaz", it.slot, 5, 300, 0.5));
    return it;
  });
  const st = calcularStatusSimulados(cls, nivel, base, itens);
  return Math.round(calcularFc(cls, st));
}

function calcularFcPadraoAnel(look) {
  const base = { str: 500, agi: 500, vit: 500, def: 500, luk: 100 };
  const nivel = 750;
  const rar = look >= 14 ? 7 : 6;
  const itens = [
    { slot: "helmet", rarity: 7, itemLevel: 300, kind: "thunderhelm", set: "thunderlord", look: 0, sockets: 6 },
    { slot: "armor", rarity: 7, itemLevel: 300, kind: "thunderplate", set: "thunderlord", look: 0, sockets: 6 },
    { slot: "weapon", rarity: 7, itemLevel: 300, kind: "thunderaxe", set: "thunderlord", look: 0, sockets: 6 },
    { slot: "ring", rarity: rar, itemLevel: 300, kind: "ring", look, sockets: rar >= 7 ? 6 : 5 },
  ].map((it) => {
    aplicarAtributosPadraoNoItem(it);
    it.gems = Array.from({ length: it.sockets }, () => criarGemaPreset("topaz", it.slot, 5, 300, 0.5));
    return it;
  });
  const st = calcularStatusSimulados("warrior", nivel, base, itens);
  return Math.round(calcularFc("warrior", st));
}

function formatarBonusCurto(b) {
  if (!b) return "—";
  const nomes = { atk: "ATK", hp: "HP", def: "DEF", spd: "VEL", crit: "CRÍT" };
  return Object.entries(b)
    .map(([k, v]) => `+${k === "crit" ? v : Math.round(v * 100)}% ${nomes[k] || k}`)
    .join(", ");
}

function construirCatalogoItens() {
  const lista = [];
  for (const [key, setInfo] of Object.entries(catalogoConjuntos)) {
    if ((setInfo.raridadePadrao || 0) < 6) continue;
    const arma = catalogoArmas[setInfo.armaKind];
    const util = UTILIDADE_CONJUNTOS[key] || { tier: "B", tag: "Conjunto", motivo: "" };
    const fcRef = calcularFcPadraoConjunto(key, setInfo);
    lista.push({
      id: `set_${key}`,
      categoria: setInfo.classe,
      categoriaLabel: nomesClasses[setInfo.classe] || setInfo.classe,
      nome: setInfo.nome,
      subnome: setInfo.armaNome,
      raridade: setInfo.raridadePadrao,
      raridadeNome: setInfo.raridadePadrao === 7 ? "Arcano" : "Imortal",
      slotSprite: "weapon",
      kindSprite: setInfo.armaKind,
      lookSprite: 0,
      classeSprite: setInfo.classe,
      tierUtilidade: util.tier,
      tagUtilidade: util.tag,
      motivoUtilidade: util.motivo,
      fcRef,
      detalhes: [
        `Bônus 2/3: ${formatarBonusCurto(setInfo.b2)}`,
        `Bônus 3/3: ${formatarBonusCurto(setInfo.b3)}`,
        `Arma (${setInfo.armaNome}): ${arma?.efeito?.texto || "Sem efeito extra."}`,
      ],
    });
  }

  for (let look = 10; look <= 19; look++) {
    const anel = catalogoAneis[look];
    if (!anel) continue;
    const rar = look >= 14 ? 7 : 6;
    const util = UTILIDADE_ANEIS[look] || { tier: "B", tag: "Anel", motivo: "" };
    const fcRef = calcularFcPadraoAnel(look);
    lista.push({
      id: `ring_${look}`,
      categoria: "ring",
      categoriaLabel: "Anel",
      nome: anel.nome,
      subnome: anel.foco || "",
      raridade: rar,
      raridadeNome: rar === 7 ? "Arcano" : "Imortal",
      slotSprite: "ring",
      kindSprite: "ring",
      lookSprite: look,
      classeSprite: "warrior",
      tierUtilidade: util.tier,
      tagUtilidade: util.tag,
      motivoUtilidade: util.motivo,
      fcRef,
      detalhes: [
        `Foco: ${anel.foco || "Equilibrado"}`,
        `Onde conseguir: ${anel.obtencao || "Chefes / Forja"}`,
        `Efeito: ${anel.efeito || "Atributos brutos por nível."}`,
      ],
    });
  }

  return lista;
}

const CATALOGO_TIERLIST = construirCatalogoItens();

function atribuirTiersPorFc(itensFiltrados) {
  const ordenados = [...itensFiltrados].sort((a, b) => b.fcRef - a.fcRef);
  if (ordenados.length === 0) return {};
  const maxFc = ordenados[0].fcRef;
  const minFc = ordenados[ordenados.length - 1].fcRef;
  const span = Math.max(1, maxFc - minFc);

  const grupos = { "S+": [], S: [], A: [], B: [], C: [] };
  ordenados.forEach((item, idx) => {
    const pct = (item.fcRef - minFc) / span;
    let tier = "C";
    if (ordenados.length <= 5) {
      tier = ["S+", "S", "A", "B", "C"][idx] || "C";
    } else if (pct >= 0.85) tier = "S+";
    else if (pct >= 0.65) tier = "S";
    else if (pct >= 0.35) tier = "A";
    else if (pct >= 0.15) tier = "B";
    else tier = "C";
    grupos[tier].push(item);
  });
  return grupos;
}

function atribuirTiersPorUtilidade(itensFiltrados) {
  const grupos = { "S+": [], S: [], A: [], B: [], C: [] };
  itensFiltrados.forEach((item) => {
    const t = grupos[item.tierUtilidade] ? item.tierUtilidade : "B";
    grupos[t].push(item);
  });
  Object.values(grupos).forEach((arr) => {
    arr.sort((a, b) => b.raridade - a.raridade || b.fcRef - a.fcRef);
  });
  return grupos;
}

function desenharTodosSprites() {
  if (!window.RiftSprites) return;
  document.querySelectorAll("canvas[data-tl-sprite]").forEach((canvas) => {
    const item = CATALOGO_TIERLIST.find((x) => x.id === canvas.dataset.tlSprite);
    if (!item) return;
    const escala = Number(canvas.dataset.tlEscala || 3);
    window.RiftSprites.desenharIconeItem(
      canvas,
      { slot: item.slotSprite, kind: item.kindSprite, rarity: item.raridade, look: item.lookSprite },
      item.classeSprite,
      escala
    );
  });
}

function renderizarDetalhe() {
  if (!containerDetalhe) return;
  const item = CATALOGO_TIERLIST.find((x) => x.id === itemSelecionadoId);
  if (!item) {
    containerDetalhe.innerHTML = `<div class="muted small">Clique em qualquer conjunto ou anel acima para ver os bônus, passiva, onde conseguir e FC simulado.</div>`;
    return;
  }

  const corRar = item.raridade === 7 ? "#eb34b1" : "#ff9d2e";
  const tierAtual = modoAtual === "fc" ? "Por FC" : `Tier ${item.tierUtilidade} · ${item.tagUtilidade}`;
  containerDetalhe.innerHTML = `
    <div class="tl-detalhe-icone">
      <canvas data-tl-sprite="${escaparHtml(item.id)}" data-tl-escala="3"></canvas>
    </div>
    <div>
      <div class="tl-detalhe-topo">
        <h3 class="tl-detalhe-titulo" style="color:${corRar};">${escaparHtml(item.nome)}</h3>
        <span class="tl-card-tag rar">${escaparHtml(item.raridadeNome)}</span>
        <span class="tl-card-tag">${escaparHtml(item.categoriaLabel)}</span>
        <span class="tl-card-tag">${escaparHtml(tierAtual)}</span>
        <span class="tl-card-tag" style="color:var(--gold);">FC Ref. Nv.300: ${formatarNumeroCompacto(item.fcRef)}</span>
      </div>
      <p style="margin:0; font-size:0.88rem; color:var(--text);"><strong>Avaliação prática:</strong> ${escaparHtml(item.motivoUtilidade)}</p>
      <ul class="tl-detalhe-lista">
        ${item.detalhes.map((linha) => `<li>${escaparHtml(linha)}</li>`).join("")}
      </ul>
    </div>
  `;
}

function renderizarTabela() {
  if (!containerTabela) return;
  const filtrados = CATALOGO_TIERLIST.filter((item) =>
    categoriaAtual === "todos" ? true : item.categoria === categoriaAtual
  );

  const grupos = modoAtual === "fc"
    ? atribuirTiersPorFc(filtrados)
    : atribuirTiersPorUtilidade(filtrados);

  if (!itemSelecionadoId || !filtrados.some((x) => x.id === itemSelecionadoId)) {
    const primeiro = Object.values(grupos).flat()[0];
    itemSelecionadoId = primeiro ? primeiro.id : null;
  }

  if (descricaoModo) {
    descricaoModo.textContent = modoAtual === "fc"
      ? "Ordenado pelo FC oficial calculado no motor do jogo (peças no Nv. 300, Topázios Supremos T5 e mesma base de atributos)."
      : "Ordenado pelo impacto real dentro do combate (Chefes, Raid Covil de Vexxaris, Sobrevivência/Suporte e Controle).";
  }

  const linhasMeta = [
    { key: "S+", classe: "tl-tier-splus", sub: modoAtual === "fc" ? "Topo FC" : "Meta" },
    { key: "S", classe: "tl-tier-s", sub: "Excelente" },
    { key: "A", classe: "tl-tier-a", sub: "Forte" },
    { key: "B", classe: "tl-tier-b", sub: "Situacional" },
    { key: "C", classe: "tl-tier-c", sub: "Entrada" },
  ];

  containerTabela.innerHTML = linhasMeta
    .map((meta) => {
      const itens = grupos[meta.key] || [];
      const cardsHtml = itens.length
        ? itens
            .map((item) => {
              const clsRar = item.raridade === 7 ? "arcano" : "imortal";
              const clsSel = item.id === itemSelecionadoId ? "selecionado" : "";
              const badgeTag = modoAtual === "fc"
                ? `${formatarNumeroCompacto(item.fcRef)} FC`
                : item.tagUtilidade;
              return `
                <button type="button" class="tl-card ${clsRar} ${clsSel}" data-tl-card="${escaparHtml(item.id)}" aria-pressed="${item.id === itemSelecionadoId}">
                  <canvas data-tl-sprite="${escaparHtml(item.id)}" data-tl-escala="3"></canvas>
                  <span class="tl-card-nome">${escaparHtml(item.nome)}</span>
                  <span class="tl-card-classe">${escaparHtml(item.categoriaLabel)} · ${escaparHtml(item.raridadeNome)}</span>
                  <span class="tl-card-tag">${escaparHtml(badgeTag)}</span>
                </button>
              `;
            })
            .join("")
        : `<div class="tl-linha-vazia">Nenhum item neste tier para o filtro atual.</div>`;

      return `
        <div class="tl-linha ${meta.classe}">
          <div class="tl-tier-badge">
            <span>${meta.key}</span>
            <small>${meta.sub}</small>
          </div>
          <div class="tl-itens-linha">${cardsHtml}</div>
        </div>
      `;
    })
    .join("");

  renderizarDetalhe();
  desenharTodosSprites();

  containerTabela.querySelectorAll("[data-tl-card]").forEach((btn) => {
    btn.addEventListener("click", () => {
      itemSelecionadoId = btn.dataset.tlCard;
      renderizarTabela();
    });
  });
}

document.querySelectorAll("[data-tl-modo]").forEach((btn) => {
  btn.addEventListener("click", () => {
    modoAtual = btn.dataset.tlModo;
    document.querySelectorAll("[data-tl-modo]").forEach((b) => b.classList.toggle("ativa", b === btn));
    renderizarTabela();
  });
});

document.querySelectorAll("[data-tl-cat]").forEach((btn) => {
  btn.addEventListener("click", () => {
    categoriaAtual = btn.dataset.tlCat;
    document.querySelectorAll("[data-tl-cat]").forEach((b) => b.classList.toggle("ativa", b === btn));
    renderizarTabela();
  });
});

renderizarTabela();
window.addEventListener("load", desenharTodosSprites);

