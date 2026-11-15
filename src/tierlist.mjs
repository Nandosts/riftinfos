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

// Classificação prática de utilidade (Chefe, Raid, Ondas, Suporte) deixando claro pontos fortes e limitações
const UTILIDADE_CONJUNTOS = {
  // Guerreiro
  singular: { tier: "S+", tag: "Chefe / DPS%", motivo: "Por que é tão bom: arranca 4% da vida máxima do chefe a cada 13s ignorando defesa, dando muito mais DPS que qualquer Arcano em zonas altas. Limitação: tem menos status brutos/FC por ser Imortal e o corte percentual não brilha tanto em mobs fracos." },
  thunderlord: { tier: "S", tag: "Dano + Stun", motivo: "Por que é tão bom: maior DPS físico Arcano do Guerreiro (+48% ATK, +15% VEL) com raio em cadeia a cada 11s + stun rápido. Limitação: contra chefes de zona altíssima, perde em dano para a Singularidade." },
  tamer: { tier: "S", tag: "Sangramento", motivo: "Por que é tão bom: mistura bom dano com sobrevivência (+22% HP, +18% DEF) e aplica sangramento puro que ignora defesa e desacelera o alvo. Limitação: tem menos explosão imediata que o Senhor do Trovão em lutas curtas." },
  chrono: { tier: "A", tag: "Maior Stun do Jogo", motivo: "Por que é tão bom: tem o maior atordoamento/congelamento do jogo (1,7s em monstros / 0,9s em chefe a cada 14s na tela toda). Limitação: por ser Imortal, entrega menos ATK, Vida e FC que os conjuntos Arcanos." },
  obsidian: { tier: "A", tag: "Tanque / Escudo", motivo: "Por que é tão bom: dá o maior FC e a maior resistência do Guerreiro (+48% HP, +40% DEF) + escudo de 10% a cada 12s. Limitação: tem o menor bônus ofensivo (+15% ATK) e o menor DPS entre os Arcanos." },
  strongman: { tier: "B", tag: "Stun Curto", motivo: "Por que não é tão bom: apesar dos +47% ATK e +25% HP, o stun é curto e só acerta inimigos colados (até 140px) a cada 12s, perdendo em alcance e dano para Trovão e Domador." },
  ember: { tier: "B", tag: "Auto-Revive", motivo: "Por que não é tão bom: o auto-revive (50% HP) ajuda só no começo da Raid, mas fica obsoleto assim que você consegue o Anel do Coração do Vazio ou Fênix Rubra, além de ter pouco dano." },
  gore: { tier: "B", tag: "Roubo de Vida", motivo: "Por que não é tão bom: o roubo de vida (25% a cada 8s) ajuda no início dos Imortais, mas perde espaço para o Anel do Sanguessuga e para sets Arcanos com muito mais status." },

  // Arqueiro
  abysshunter: { tier: "S+", tag: "DPS Chefe + Cura", motivo: "Por que é tão bom: maior conjunto ofensivo do Arqueiro (+58% ATK, +20% VEL, +14% CRÍT), dispara 3,2× ATK no inimigo de maior vida e ainda se cura em 8% HP a cada 11s. Limitação: não dá escudo para o grupo como o Aurora." },
  auroraborealis: { tier: "S", tag: "DPS + Escudo", motivo: "Por que é tão bom: entrega o maior FC do Arqueiro com ótimo dano em área (1,4× ATK) + escudo de 10% HP para o time todo a cada 12s. Limitação: em dano puro de alvo único, fica um pouco atrás do Caçador Abissal." },
  firework: { tier: "S", tag: "Dano Explosivo", motivo: "Por que é tão bom: forte em ondas e chefe (+48% ATK, +18% VEL, +12% CRÍT) batendo 2,4× ATK no alvo principal a cada 10s. Limitação: não tem autocura nem escudo defensivo." },
  trapeze: { tier: "A", tag: "Velocidade", motivo: "Por que é tão bom: muita velocidade (+33% VEL) e dispara em até 4 alvos a cada 9s (1,8× ATK), ótimo para limpar ondas. Limitação: bônus de ATK bem menor (+22%) para chefes." },
  predator: { tier: "A", tag: "100% Crítico", motivo: "Por que é tão bom: garante 100% de Crítico por 3,5s a cada 9s (+45% ATK, +22% CRÍT), sendo o melhor Imortal de dano. Limitação: por ser Imortal, tem base menor e 5 engastes de gema contra 6 dos Arcanos." },
  tempest: { tier: "B", tag: "Lentidão", motivo: "Por que não é tão bom: dá bastante velocidade (+37% VEL), mas seu efeito só desacelera inimigos sem dar dano extra explosivo nem sobrevivência." },
  dragon: { tier: "B", tag: "Dano Imortal", motivo: "Por que não é tão bom: tem bom +60% ATK, mas a baforada (2,4× ATK a cada 11s) não compensa a falta de velocidade e os status menores de Imortal." },
  luna: { tier: "C", tag: "Início Imortal", motivo: "Por que não é tão bom: só adiciona 2 flechas extras de 55% na skill a cada 8s, ficando bem abaixo de Predador e de qualquer Arcano." },

  // Clérigo
  seraphgold: { tier: "S+", tag: "Cura + Escudo", motivo: "Por que é tão bom: melhor suporte completo do jogo (+90% HP, +65% ATK, +10% VEL) — cura 20–30% HP e dá 8% de escudo para todo o time a cada 14s. Limitação: não revive aliados mortos como a Árvore-Mundo." },
  fortune: { tier: "S+", tag: "Escudo em Grupo", motivo: "Por que é tão bom: rei da proteção na Raid e chefes, aplicando escudo de 25% HP por 7s + 10% de cura no time inteiro a cada 12s. Limitação: tem o menor bônus de ataque entre os Clérigos Arcanos." },
  worldtree: { tier: "S+", tag: "Revive na Raid", motivo: "Por que é tão bom: é o único conjunto de alto nível que revive 1 aliado morto a cada 15s (com 50% HP), sendo indispensável na Raid Covil de Vexxaris. Limitação: por ser Imortal, tem menos status e FC que os Arcanos." },
  eclipsepriest: { tier: "S", tag: "Stun + Dano", motivo: "Por que é tão bom: melhor Clérigo de dano e controle (+85% ATK, +20% VEL), atordoando a tela inteira (1,3s monstros / 0,5s chefe) a cada 15s. Limitação: não dá cura extra nem escudo na passiva da arma." },
  communion: { tier: "A", tag: "Buff +30% ATK", motivo: "Por que é tão bom: dá +30% ATK por 5s e cura 25% HP para o time todo a cada 12s. Limitação: status base Imortais ficam atrás de Serafim e Cartomante." },
  illusion: { tier: "A", tag: "Híbrido", motivo: "Por que não é tão bom quanto os S+: tem ótimos status Arcanos (+75% ATK, +60% HP), mas o efeito a cada 10s é aleatório (1/3 cura em 1 alvo, 1/3 escudo, 1/3 dano), tirando a confiabilidade na Raid." },
  constel: { tier: "B", tag: "Escudo Imortal", motivo: "Por que não é tão bom: funciona como uma versão menor da Madame Cartomante (escudo de 20% por 6s a cada 16s sem a cura extra e com menos HP)." },
  echo: { tier: "C", tag: "Cura Dupla 18s", motivo: "Por que não é tão bom: a cada 18s zera apenas o cooldown da própria skill de cura do Clérigo (não reseta passivas de arma nem habilidades de aliados), ficando muito atrás de Árvore-Mundo, Comunhão e Constelação." },
};

const UTILIDADE_ANEIS = {
  18: { tier: "S+", tag: "Raid · ATK/CRÍT", motivo: "Por que é tão bom: exclusivo da Raid Covil de Vexxaris com a maior curva de Ataque e Crítico brutos do jogo (~4,05 ATK e ~0,64 CRÍT por nível). Limitação: não tem efeito especial extra na luta." },
  14: { tier: "S+", tag: "Eco +20% DPS", motivo: "Por que é tão bom: tem alto ATK/CRÍT e 20% de chance de repetir 100% do golpe (+20% DPS médio em chefe) além de ricochetear 60% em 2 alvos. Limitação: o eco não duplica o corte percentual da Singularidade." },
  15: { tier: "S+", tag: "Auto-Revive 70%", motivo: "Por que é tão bom: dá auto-revive garantido (70% HP + 40% escudo) com muita Vida e Defesa, salvando runs inteiras na Raid. Limitação: tem menos ATK/VEL que os anéis puramente ofensivos." },
  19: { tier: "S", tag: "Raid · Tanque/VEL", motivo: "Por que é tão bom: exclusivo da Raid com o maior ganho bruto de Vida, Defesa e +18% Velocidade, liderando em FC. Limitação: tem menos ATK/CRÍT e não possui passiva de auto-revive." },
  16: { tier: "S", tag: "Escala +40% ATK", motivo: "Por que é tão bom: ganha até +40% ATK acumulando abates e tem +18% VEL, sendo excelente em ondas. Limitação: em chefe solo sem adds para matar, o bônus demora para carregar." },
  11: { tier: "S", tag: "Roubo de Vida 8%", motivo: "Por que é tão bom: cura 8% de TODO o dano causado sem cooldown (golpes, skills e passivas), enchendo a vida em 1–2 hits contra chefes. Limitação: por ser Imortal, tem 5 gemas/status menores e não salva de hit-kill." },
  17: { tier: "A", tag: "Limpa Controle", motivo: "Por que não é tão bom quanto os S+: limpa stun/lentidão e dá 12% escudo + 8% cura a cada 10s, mas entrega menos ATK e menos sobrevivência de emergência que o Coração do Vazio." },
  10: { tier: "A", tag: "Sangramento", motivo: "Por que não é tão bom quanto os Arcanos: o sangramento que ignora defesa (60% ATK/s por 3s) é útil contra chefes altos, mas seus atributos brutos de Imortal são bem menores." },
  13: { tier: "B", tag: "Revive Imortal", motivo: "Por que não é tão bom: garante auto-revive com 40% HP para quem ainda não tem o Coração do Vazio, porém é diretamente superado por ele em tudo." },
  12: { tier: "B", tag: "Finalizador", motivo: "Por que não é tão bom: os +60% de dano só ativam quando o inimigo já está abaixo de 30% de vida, perdendo muito valor na maior parte da luta." },
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

const UTILIDADE_ANEIS_POR_CLASSE = {
  warrior: {
    15: { tier: "S+", tag: "Auto-Revive 70%", motivo: "Essencial na Raid e na linha de frente: revive com 70% HP + 40% escudo e dá ótima Vida/Defesa." },
    19: { tier: "S+", tag: "Tanque +18% VEL", motivo: "Melhor pacote bruto de Vida, Defesa e +18% Velocidade para o Guerreiro aguentar chefes pesados." },
    11: { tier: "S+", tag: "Roubo de Vida 8%", motivo: "Cura 8% de TODO o dano causado sem cooldown: com Singularidade ou DPS alto, enche a vida inteira em 1 hit." },
    18: { tier: "S", tag: "ATK/CRÍT Brutos", motivo: "Maior dano bruto para builds Arcanas ofensivas (Senhor do Trovão / Domador)." },
    14: { tier: "S", tag: "Eco +20% DPS", motivo: "Repete 100% do golpe em 20% das vezes (+20% DPS em golpes normais)." },
    17: { tier: "S", tag: "Limpa Controle", motivo: "Remove stun/lentidão da linha de frente a cada 10s e ainda dá 12% escudo + 8% cura." },
    10: { tier: "A", tag: "Sangramento", motivo: "Bom contra chefes de defesa muito alta: aplica sangramento que ignora defesa." },
    16: { tier: "A", tag: "+40% ATK Ondas", motivo: "Escala até +40% ATK acumulando abates; ótimo em ondas, mais fraco em chefe solo." },
    13: { tier: "B", tag: "Revive Imortal", motivo: "Alternativa Imortal ao Coração do Vazio (auto-revive com 40% HP)." },
    12: { tier: "B", tag: "Finalizador", motivo: "+60% dano abaixo de 30% de vida do alvo." },
  },
  archer: {
    18: { tier: "S+", tag: "ATK/CRÍT Brutos", motivo: "Melhor pacote ofensivo para o Arqueiro: ATK e Crítico altíssimos multiplicados pela velocidade base 1,10/s." },
    14: { tier: "S+", tag: "Eco +20% DPS", motivo: "Repete 100% da flecha em 20% das vezes (+20% DPS em alvo único) e ricocheteia em 2 alvos." },
    11: { tier: "S+", tag: "Roubo de Vida 8%", motivo: "Como o Arqueiro tem o maior DPS contínuo à distância, recupera a vida inteira quase instantaneamente." },
    16: { tier: "S", tag: "+40% ATK +18% VEL", motivo: "Excelente para limpar ondas (+40% ATK por almas) e aumentar o SpeedBonus com +18% VEL." },
    15: { tier: "S", tag: "Auto-Revive 70%", motivo: "Salva muito na Raid Covil de Vexxaris, onde o Arqueiro tem menos vida base." },
    19: { tier: "A", tag: "Sobrevivência +VEL", motivo: "Dá +18% VEL e muita Vida/Defesa para evitar morrer em um golpe." },
    10: { tier: "A", tag: "Sangramento", motivo: "Sangramento puro que ignora defesa contra chefes altos." },
    17: { tier: "A", tag: "Limpa Controle", motivo: "Escudo + cura + limpeza de controle a cada 10s." },
    13: { tier: "B", tag: "Revive Imortal", motivo: "Auto-revive Imortal (40% HP) até conseguir o Coração do Vazio." },
    12: { tier: "B", tag: "Finalizador", motivo: "+60% dano abaixo de 30% de vida." },
  },
  cleric: {
    15: { tier: "S+", tag: "Auto-Revive 70%", motivo: "Anel #1 de suporte na Raid: garante que o Clérigo volte vivo (70% HP + 40% escudo) para continuar curando/revivendo o time." },
    19: { tier: "S+", tag: "Vida/DEF +18% VEL", motivo: "Maior resistência e +18% Velocidade para o Clérigo ficar vivo e lançar curas mais rápido." },
    17: { tier: "S", tag: "Escudo + Limpa CC", motivo: "Ótima sinergia com Clérigo: limpa controles, aplica escudo de 12% e cura 8% a cada 10s." },
    18: { tier: "S", tag: "Muito ATK p/ Cura", motivo: "Maior Ataque e Crítico brutos, aumentando direto o valor das curas do Clérigo." },
    14: { tier: "A", tag: "Dano / Eclipse", motivo: "Boa opção se estiver jogando de Cajado do Eclipse focado em dano + stun." },
    13: { tier: "A", tag: "Revive Imortal", motivo: "Boa alternativa Imortal para garantir auto-revive (40% HP) na Raid." },
    16: { tier: "B", tag: "ATK em Ondas", motivo: "Bom para dano em ondas, mas menos útil em chefes/Raid para Clérigo." },
    11: { tier: "B", tag: "Roubo de Vida 8%", motivo: "Clérigo causa menos dano que Guerreiro/Arqueiro, então aproveita menos os 8% de roubo de vida." },
    10: { tier: "B", tag: "Sangramento", motivo: "Dano contínuo auxiliar em chefes." },
    12: { tier: "C", tag: "Finalizador", motivo: "Pouco aproveitado por builds de suporte/cura." },
  },
};

function calcularFcPadraoAnel(look, cls = "warrior") {
  const base = { str: 500, agi: 500, vit: 500, def: 500, luk: 100 };
  const nivel = 750;
  const rar = look >= 14 ? 7 : 6;
  const setRef = cls === "archer"
    ? { h: "abyssmask", a: "abyssvest", w: "abyssbow", s: "abysshunter" }
    : cls === "cleric"
      ? { h: "serafhalo", a: "serafrobe", w: "serafscepter", s: "seraphgold" }
      : { h: "thunderhelm", a: "thunderplate", w: "thunderaxe", s: "thunderlord" };
  const itens = [
    { slot: "helmet", rarity: 7, itemLevel: 300, kind: setRef.h, set: setRef.s, look: 0, sockets: 6 },
    { slot: "armor", rarity: 7, itemLevel: 300, kind: setRef.a, set: setRef.s, look: 0, sockets: 6 },
    { slot: "weapon", rarity: 7, itemLevel: 300, kind: setRef.w, set: setRef.s, look: 0, sockets: 6 },
    { slot: "ring", rarity: rar, itemLevel: 300, kind: "ring", look, sockets: rar >= 7 ? 6 : 5 },
  ].map((it) => {
    aplicarAtributosPadraoNoItem(it);
    it.gems = Array.from({ length: it.sockets }, () => criarGemaPreset("topaz", it.slot, 5, 300, 0.5));
    return it;
  });
  const st = calcularStatusSimulados(cls, nivel, base, itens);
  return Math.round(calcularFc(cls, st));
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
      fcPorClasse: {
        warrior: calcularFcPadraoAnel(look, "warrior"),
        archer: calcularFcPadraoAnel(look, "archer"),
        cleric: calcularFcPadraoAnel(look, "cleric"),
      },
      utilPorClasse: {
        warrior: UTILIDADE_ANEIS_POR_CLASSE.warrior[look] || util,
        archer: UTILIDADE_ANEIS_POR_CLASSE.archer[look] || util,
        cleric: UTILIDADE_ANEIS_POR_CLASSE.cleric[look] || util,
      },
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
      fcPorClasse: {
        warrior: calcularFcPadraoAnel(look, "warrior"),
        archer: calcularFcPadraoAnel(look, "archer"),
        cleric: calcularFcPadraoAnel(look, "cleric"),
      },
      utilPorClasse: {
        warrior: UTILIDADE_ANEIS_POR_CLASSE.warrior[look] || util,
        archer: UTILIDADE_ANEIS_POR_CLASSE.archer[look] || util,
        cleric: UTILIDADE_ANEIS_POR_CLASSE.cleric[look] || util,
      },
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

function obterItemContextualizado(item) {
  if (item.categoria === "ring" && ["warrior", "archer", "cleric"].includes(categoriaAtual)) {
    const u = item.utilPorClasse?.[categoriaAtual];
    const fc = item.fcPorClasse?.[categoriaAtual];
    return {
      ...item,
      tierUtilidade: u?.tier || item.tierUtilidade,
      tagUtilidade: u?.tag || item.tagUtilidade,
      motivoUtilidade: u?.motivo || item.motivoUtilidade,
      fcRef: fc ?? item.fcRef,
    };
  }
  return item;
}

function renderizarDetalhe() {
  if (!containerDetalhe) return;
  const raw = CATALOGO_TIERLIST.find((x) => x.id === itemSelecionadoId);
  const item = raw ? obterItemContextualizado(raw) : null;
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
  const filtrados = CATALOGO_TIERLIST
    .filter((item) => {
      if (categoriaAtual === "todos") return true;
      if (["warrior", "archer", "cleric"].includes(categoriaAtual)) {
        return item.categoria === categoriaAtual || item.categoria === "ring";
      }
      return item.categoria === categoriaAtual;
    })
    .map(obterItemContextualizado);

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

