import {
  catalogoAneis,
  catalogoArmas,
  catalogoConjuntos,
  coresRaridade,
  nomesClasses,
} from "./dados.mjs";
import { calcularFc, calcularStatusSimulados } from "./combate.mjs";
import { aplicarAtributosPadraoNoItem, criarGemaPreset } from "./simulador/estado.mjs";
import { escaparHtml, formatarNumeroCompacto } from "./formato.mjs";
import { renderizarFichaFc } from "./tierlist-ficha.mjs";

const containerTabela = document.querySelector("#tierlist-tabela");
const containerDetalhe = document.querySelector("#tierlist-detalhe");
const descricaoModo = document.querySelector("#tierlist-descricao-modo");

let modoAtual = "utilidade"; // "utilidade" | "fc"
let categoriaAtual = "todos"; // "todos" | "warrior" | "archer" | "cleric" | "ring"
let itemSelecionadoId = null;

const NIVEL_ITEM_REFERENCIA = 300;
const NIVEL_PERSONAGEM_REFERENCIA = 750;
const ATRIBUTOS_REFERENCIA = { str: 140, agi: 140, vit: 140, def: 140, luk: 140 };

const UTILIDADE_CONJUNTOS = {
  singular: { tier: "S+", prioridade: 20, tag: "Dano em chefes", motivo: "A implosão escala com a vida máxima do chefe e ignora defesa. Combina com o Eclipse Arcano para dano e com o Sanguessuga para recuperar vida.", limite: "O dano vem em pulsos. A implosão tem 1,4s de atraso e pode cair fora da janela em que o chefe recebe dano." },
  thunderlord: { tier: "S", prioridade: 130, tag: "Dano + controle", motivo: "Alto bônus de ataque e crítico. O raio a cada 11s causa dano e interrompe até cinco inimigos.", limite: "Cada salto perde força e o atordoamento dura menos em chefes." },
  tamer: { tier: "S", prioridade: 140, tag: "Sangramento", motivo: "Combina ataque e vida com dano em área e sangramento que ignora defesa.", limite: "Parte do dano vem ao longo do tempo, enquanto o raio do Trovão concentra o dano no acerto." },
  obsidian: { tier: "S", prioridade: 120, tag: "Tanque / Escudo", motivo: "Vida e defesa altas, com escudo próprio e dano em área. Lidera o FC de referência entre os conjuntos do Guerreiro.", limite: "O escudo protege só o portador. O bônus de ataque é menor que o do Trovão e o do Domador." },
  chrono: { tier: "A", prioridade: 230, tag: "Maior atordoamento", motivo: "Maior atordoamento entre as armas da lista. Congela inimigos visíveis por 1,7s, ou 0,9s em chefes, a cada 14s.", limite: "A passiva controla os inimigos sem causar dano." },
  strongman: { tier: "A", prioridade: 220, tag: "Tanque + controle", motivo: "Muita vida e defesa, mais uma onda de choque que causa dano e atordoa.", limite: "A onda só alcança inimigos a até 140 px e o atordoamento dura 0,5s em chefes." },
  ember: { tier: "A", prioridade: 240, tag: "Auto-revive na Raid", motivo: "Renasce com 60% de HP e escudo de 30%. Pode somar uma ressurreição à da Fênix Rubra ou do Coração do Vazio.", limite: "O revive da arma é usado uma vez por jornada ou Raid e ocupa o lugar de uma passiva ofensiva." },
  gore: { tier: "B", prioridade: 330, tag: "Ataque + roubo de vida", motivo: "A Ceifa-Reis dá +60% de ataque e 25% de roubo de vida em dano direto durante 4s a cada 12s.", limite: "A sustentação fica concentrada na janela de 4s." },

  abysshunter: { tier: "S+", prioridade: 70, tag: "Dano em chefes + autocura", motivo: "Bônus altos de ataque e crítico. A maré atinge com mais força o inimigo com mais vida atual e ainda recupera 8% do próprio HP.", limite: "A autocura beneficia só o portador." },
  auroraborealis: { tier: "S", prioridade: 100, tag: "Dano + escudo em grupo", motivo: "Lidera o FC de referência do Arqueiro e combina dano em área com escudo para o grupo.", limite: "A passiva tem menor multiplicador no alvo principal que a do Caçador Abissal." },
  firework: { tier: "S", prioridade: 150, tag: "Dano explosivo", motivo: "Foguete a cada 10s, com dano de 2,4× no alvo principal e 1,2× nos demais.", limite: "O alvo principal é sorteado entre os inimigos visíveis. O foguete não dá cura nem escudo." },
  trapeze: { tier: "A", prioridade: 280, tag: "Dano frontal + VEL", motivo: "Velocidade alta e um disparo de 1,8× em até quatro inimigos a cada 9s.", limite: "Contra um chefe isolado, perde o benefício de acertar vários alvos." },
  predator: { tier: "A", prioridade: 270, tag: "Janela de 100% crítico", motivo: "Garante 100% de chance de crítico durante 3,5s a cada 9s.", limite: "Fora dessa janela, volta à chance normal. A comparação com a Tempestade depende dos atributos da build." },
  tempest: { tier: "A", prioridade: 260, tag: "Cadência temporária", motivo: "A passiva da arma dobra a cadência dos ataques básicos durante 4s a cada 12s. Vale também contra chefe isolado.", limite: "O efeito vem da passiva, tem duração limitada e não reduz a recarga da Rajada de Flechas." },
  dragon: { tier: "B", prioridade: 320, tag: "Baforada em área", motivo: "Bônus alto de ataque e uma baforada de 2,4× nos inimigos visíveis a cada 12s.", limite: "O efeito entrega dano periódico sem sustentação própria." },
  luna: { tier: "C", prioridade: 350, tag: "Ricochete de flechas", motivo: "Durante 4s a cada 10s, as flechas ricocheteiam 55% do dano em até dois alvos adicionais.", limite: "O ricochete depende de outros inimigos próximos do alvo." },

  seraphgold: { tier: "S+", prioridade: 50, tag: "Cura + escudo", motivo: "Cura cada aliado vivo em 20% do HP máximo, ou 30% se estiver abaixo de metade da vida, e dá escudo de 8%.", limite: "O pulso protege e cura quem está vivo. Para levantar aliados, a Árvore-Mundo é a opção desta lista." },
  fortune: { tier: "S+", prioridade: 40, tag: "Escudo em grupo", motivo: "Proteção para dano pesado. A cada 12s, dá escudo de 25% do HP por 7s e cura 10% do HP dos aliados vivos.", limite: "Tem o menor bônus de ataque entre os conjuntos Arcanos do Clérigo." },
  worldtree: { tier: "S+", prioridade: 30, tag: "Revive na Raid", motivo: "A cada 15s, revive um aliado com 50% do HP e cura o grupo em 8%, ou 16% quando ninguém precisa reviver.", limite: "Revive um aliado por pulso. O Cetro da Vida também pode reviver pela skill, fora desta seleção de conjuntos." },
  eclipsepriest: { tier: "S", prioridade: 160, tag: "Controle + dano", motivo: "Alto ataque e passiva de dano em área a cada 15s. Atordoa por 1,3s, ou 0,5s em chefes.", limite: "A cura normal continua disponível. A passiva da arma não adiciona cura nem escudo." },
  communion: { tier: "S", prioridade: 110, tag: "Cura + ataque em grupo", motivo: "A cada 12s, cura 25% do HP máximo dos aliados vivos e dá +30% de ataque por 5s.", limite: "O bônus ofensivo dura só parte do ciclo e o pulso não dá escudo." },
  illusion: { tier: "A", prioridade: 250, tag: "Cura, escudo ou dano", motivo: "A cada 10s, sorteia cura de 40% no aliado mais ferido, escudo de 12% no grupo ou dano de 1,6× nos inimigos.", limite: "O sorteio impede contar com um efeito específico no momento em que o grupo precisa dele." },
  constel: { tier: "A", prioridade: 210, tag: "Escudo em grupo", motivo: "Protege o grupo com escudo de 20% do HP por 6s a cada 16s.", limite: "O pulso é menos frequente que o da Cartomante e não adiciona cura." },
  echo: { tier: "C", prioridade: 340, tag: "Reset da Luz Divina", motivo: "A cada 18s, prepara um reset da recarga. A próxima Luz Divina zera a recarga quando é usada.", limite: "A segunda cura depende de o grupo ainda precisar dela. O reset afeta só a Luz Divina do portador, sem proteção, revive ou buff de grupo na passiva." },
};

const UTILIDADE_ANEIS = {
  18: { tier: "S", prioridade: 190, tag: "Ataque e crítico", motivo: "Boa escolha de atributos brutos para dano. Na Raid, escudo, purificação ou revive podem fazer mais diferença para o grupo.", limite: "Curva de atributos estimada. Sem passiva de combate." },
  14: { tier: "S+", prioridade: 60, tag: "Eco de golpes e skills", motivo: "Útil para dano em chefes e contra grupos. Pode repetir a implosão da Singularidade com o Guerreiro vivo.", limite: "O eco é aleatório. O ricochete depende de inimigos próximos." },
  15: { tier: "S+", prioridade: 80, tag: "Auto-revive 70%", motivo: "Uma segunda chance na Raid, com vida e defesa altas.", limite: "A ressurreição do anel só pode ser usada uma vez por jornada ou Raid." },
  19: { tier: "S", prioridade: 180, tag: "Vida, defesa e VEL", motivo: "Lidera o FC estimado entre os anéis nos cenários de referência das três classes.", limite: "Curva de atributos estimada. Sem passiva de combate ou ressurreição." },
  16: { tier: "S", prioridade: 200, tag: "Almas + ceifa", motivo: "Acumula ataque e dispara uma ceifa conforme o grupo abate inimigos.", limite: "Contra chefes isolados, faltam abates para alimentar o efeito." },
  11: { tier: "S", prioridade: 170, tag: "Roubo de vida 8%", motivo: "Recupera vida entre golpes pesados, inclusive com a implosão da Singularidade.", limite: "Depende do dano direto causado e de sobreviver entre os golpes. Não concede escudo nem ressurreição." },
  17: { tier: "S+", prioridade: 10, tag: "Escudo + purificação", motivo: "Prioridade de suporte na Raid. A cada 10s, dá escudo ao grupo e limpa sangramento e controles, ajudando vários aliados a continuar lutando.", limite: "O escudo dura 4s, escala com a vida do portador e a cura do pulso atende só o aliado mais ferido." },
  10: { tier: "A", prioridade: 300, tag: "Sangramento", motivo: "Dano contínuo que ignora defesa, útil contra chefes resistentes.", limite: "O sangramento depende de contato repetido e o anel tem atributos de Imortal." },
  13: { tier: "A", prioridade: 245, tag: "Revive Imortal", motivo: "Alternativa ao Coração do Vazio para a Raid. Pode acumular com o revive da Brasa Eterna.", limite: "Renasce com menos vida e escudo que o Coração do Vazio." },
  12: { tier: "B", prioridade: 310, tag: "Finalizador", motivo: "Reforça o dano direto na fase final, inclusive na implosão da Singularidade.", limite: "Só ativa quando o alvo já está com 30% de vida ou menos." },
};

function calcularFcReferencia(classe, pecas) {
  const itens = pecas.map((peca) => {
    const item = { ...peca };
    item.itemLevel = NIVEL_ITEM_REFERENCIA;
    item.sockets = item.rarity === 7 ? 6 : 5;
    aplicarAtributosPadraoNoItem(item);
    item.gems = Array.from({ length: item.sockets }, () => criarGemaPreset("topaz", item.slot, 5, item.itemLevel, 1));
    return item;
  });
  const status = calcularStatusSimulados(classe, NIVEL_PERSONAGEM_REFERENCIA, ATRIBUTOS_REFERENCIA, itens);
  const statusBase = calcularStatusSimulados(classe, NIVEL_PERSONAGEM_REFERENCIA, ATRIBUTOS_REFERENCIA, []);
  return { classe, itens, status, fc: calcularFc(classe, status), fcBase: calcularFc(classe, statusBase) };
}

const UTILIDADE_ANEIS_POR_CLASSE = {
  warrior: {
    14: { tier: "S+", prioridade: 25, tag: "Dano em chefes", motivo: "Primeira escolha para dano com Singularidade. Sem mitigação adicional, a implosão de 4% fica em 4,8% da vida máxima do chefe em média por ativação, ou 8% quando sai o eco." },
    15: { tier: "S+", prioridade: 55, motivo: "Primeira escolha para voltar à linha de frente após cair na Raid." },
    19: { tier: "S+", prioridade: 85, motivo: "Prioriza vida e defesa para aguentar chefes pesados. Acima de 4,6/s, a VEL extra aumenta o dano de golpes que usam SpeedBonus." },
    11: { tier: "S+", prioridade: 65, motivo: "Primeira escolha para sustentação. A implosão da Singularidade pode recuperar bastante vida quando causa dano alto." },
    18: { tier: "S", prioridade: 175, motivo: "Boa escolha de atributos ofensivos para Senhor do Trovão e Domador." },
    17: { tier: "S+", prioridade: 35, motivo: "A vida alta do Guerreiro fortalece o escudo para todo o grupo. Boa escolha para segurar dano pesado e limpar controles na Raid." },
    10: { tier: "A", prioridade: 295, motivo: "Complementa o dano contra chefes com defesa alta." },
    16: { tier: "A", prioridade: 305, motivo: "Ganha valor quando o chefe traz lacaios que o grupo pode abater." },
    13: { tier: "A", prioridade: 235, motivo: "Dá outra chance ao Guerreiro de linha de frente e combina com a Brasa Eterna." },
    12: { tier: "A", prioridade: 255, motivo: "Serve para encurtar a fase final do chefe com mais dano direto." },
  },
  archer: {
    18: { tier: "S+", prioridade: 85, motivo: "Ataque e crítico brutos fortalecem os golpes do Arqueiro. Crítico acima de 60% vira dano crítico." },
    14: { tier: "S+", prioridade: 75, motivo: "Reforça flechas, skills e passivas de dano elegíveis contra o chefe e seus lacaios." },
    11: { tier: "S+", prioridade: 95, motivo: "Aproveita o dano direto à distância para recuperar vida ao longo da luta." },
    16: { tier: "S", prioridade: 195, motivo: "Bom quando há lacaios. Acima de 4,6/s, os +18% VEL reforçam o dano via SpeedBonus." },
    15: { tier: "S", prioridade: 115, motivo: "Protege uma classe de vida base baixa em tentativas de Raid." },
    19: { tier: "A", prioridade: 215, motivo: "Boa opção quando sobreviver limita o dano. A VEL reforça a potência dos golpes acima do teto." },
    10: { tier: "A", prioridade: 300, motivo: "As flechas mantêm sangramento contra chefes com defesa alta." },
    17: { tier: "S", prioridade: 105, motivo: "Escudo e purificação ainda ajudam todo o grupo. Se a proteção já estiver coberta, o Eclipse Arcano tem mais valor para o dano do Arqueiro." },
    13: { tier: "A", prioridade: 245, motivo: "Alternativa Imortal para recuperar a tentativa se o Arqueiro cair." },
    12: { tier: "B", prioridade: 310, motivo: "Fortalece rajadas e outros acertos diretos na fase final do chefe." },
  },
  cleric: {
    15: { tier: "S+", prioridade: 80, motivo: "Ajuda o Clérigo a voltar vivo para continuar curando ou revivendo o grupo." },
    19: { tier: "S", prioridade: 125, motivo: "Vida e defesa ajudam o Clérigo a continuar em campo. Acima de 4,6/s, a VEL eleva a potência da Luz Divina pelo SpeedBonus, com a mesma recarga." },
    17: { tier: "S+", prioridade: 10, motivo: "Complementa as curas do Clérigo com escudo em grupo e purificação. Ajuda a equipe a atravessar picos de dano e voltar a agir após controle." },
    18: { tier: "S", prioridade: 135, tag: "Ataque para cura", motivo: "O ataque fortalece a Luz Divina. O crítico extra beneficia apenas o dano." },
    14: { tier: "A", prioridade: 265, motivo: "Boa escolha para o Cajado do Eclipse focado em dano. O eco pode repetir o dano da passiva, sem repetir o atordoamento." },
    13: { tier: "A", prioridade: 235, motivo: "Alternativa Imortal para manter alguém curando após uma queda na Raid." },
    16: { tier: "B", prioridade: 315, motivo: "Tem mais valor para uma build ofensiva em lutas com abates frequentes." },
    11: { tier: "B", prioridade: 325, motivo: "A sustentação varia com o dano direto. Uma build de suporte tende a aproveitar menos o efeito." },
    10: { tier: "B", prioridade: 335, motivo: "Acrescenta dano contra chefes, sem aumentar o poder de cura." },
    12: { tier: "C", prioridade: 345, motivo: "Tem pouco impacto numa build de suporte. O bônus afeta o dano, sem aumentar a cura." },
  },
};

function formatarBonusCurto(b) {
  if (!b) return "—";
  const nomes = { atk: "ATK", hp: "HP", def: "DEF", spd: "VEL", crit: "CRÍT" };
  return Object.entries(b)
    .map(([k, v]) => k === "crit" ? `+${v} p.p. de crítico bruto`
      : `+${(v * 100).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}% ${nomes[k] || k}`)
    .join(", ");
}

function construirCatalogoItens() {
  const lista = [];
  for (const [key, setInfo] of Object.entries(catalogoConjuntos)) {
    if ((setInfo.raridadePadrao || 0) < 6) continue;
    const arma = catalogoArmas[setInfo.armaKind];
    const util = UTILIDADE_CONJUNTOS[key] || { tier: "B", tag: "Conjunto", motivo: "" };
    const rarity = setInfo.raridadePadrao;
    const referenciaFc = calcularFcReferencia(setInfo.classe, [
      { slot: "weapon", kind: setInfo.armaKind, name: setInfo.armaNome, rarity, set: key },
      { slot: "helmet", kind: setInfo.elmoKind, name: setInfo.elmoNome, rarity, set: key },
      { slot: "armor", kind: setInfo.armaduraKind, name: setInfo.armaduraNome, rarity, set: key },
    ]);
    const bonusConjunto = [
      `Bônus 2/3: ${formatarBonusCurto(setInfo.b2)}`,
      `Bônus adicional 3/3: ${formatarBonusCurto(setInfo.b3)}`,
    ];
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
      prioridadeUtilidade: util.prioridade ?? Number.MAX_SAFE_INTEGER,
      tagUtilidade: util.tag,
      motivoUtilidade: util.motivo,
      limiteUtilidade: util.limite,
      referenciaFc,
      bonusConjunto,
      detalhes: [
        ...bonusConjunto,
        `Arma (${setInfo.armaNome}): ${arma?.efeito?.texto || "Sem efeito extra."}`,
      ],
    });
  }

  for (let look = 10; look <= 19; look++) {
    const anel = catalogoAneis[look];
    if (!anel) continue;
    const rar = anel.raridadeMin;
    const util = UTILIDADE_ANEIS[look] || { tier: "B", tag: "Anel", motivo: "" };
    const peca = { slot: "ring", kind: "ring", name: anel.nome, rarity: rar, look };
    const referenciaPorClasse = Object.fromEntries(
      Object.keys(nomesClasses).map((classe) => [classe, calcularFcReferencia(classe, [peca])])
    );
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
      prioridadeUtilidade: util.prioridade ?? Number.MAX_SAFE_INTEGER,
      tagUtilidade: util.tag,
      motivoUtilidade: util.motivo,
      limiteUtilidade: util.limite,
      referenciaFc: referenciaPorClasse.warrior,
      referenciaPorClasse,
      curvaEstimada: anel.estimado,
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
  const ordenados = [...itensFiltrados].sort((a, b) => b.referenciaFc.fc - a.referenciaFc.fc);
  if (ordenados.length === 0) return {};
  const maxFc = ordenados[0].referenciaFc.fc;
  const minFc = ordenados[ordenados.length - 1].referenciaFc.fc;
  const span = Math.max(1, maxFc - minFc);

  const grupos = { "S+": [], S: [], A: [], B: [], C: [] };
  ordenados.forEach((item, idx) => {
    const pct = (item.referenciaFc.fc - minFc) / span;
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
    arr.sort((a, b) => a.prioridadeUtilidade - b.prioridadeUtilidade);
  });
  return grupos;
}

function desenharTodosSprites() {
  if (!window.RiftSprites) return;
  document.querySelectorAll("canvas[data-tl-sprite]").forEach((canvas) => {
    const item = CATALOGO_TIERLIST.find((x) => x.id === canvas.dataset.tlSprite);
    if (!item) return;
    const escala = Number(canvas.dataset.tlEscala || 3);
    if (canvas.dataset.tlPeca !== undefined) {
      const { classe, itens } = obterItemContextualizado(item).referenciaFc;
      window.RiftSprites.desenharIconeItem(canvas, itens[Number(canvas.dataset.tlPeca)], classe, escala);
      return;
    }
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
    return {
      ...item,
      tierUtilidade: u?.tier || item.tierUtilidade,
      tagUtilidade: u?.tag || item.tagUtilidade,
      motivoUtilidade: u?.motivo || item.motivoUtilidade,
      prioridadeUtilidade: u?.prioridade ?? item.prioridadeUtilidade,
      referenciaFc: item.referenciaPorClasse[categoriaAtual],
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
  if (modoAtual === "fc") {
    containerDetalhe.innerHTML = renderizarFichaFc(item, NIVEL_PERSONAGEM_REFERENCIA, ATRIBUTOS_REFERENCIA);
    return;
  }

  const corRar = coresRaridade[item.raridade];
  const tierAtual = `Tier de utilidade ${item.tierUtilidade} · ${item.tagUtilidade}`;
  containerDetalhe.innerHTML = `
    <div class="tl-detalhe-icone">
      <canvas data-tl-sprite="${escaparHtml(item.id)}" data-tl-escala="3"></canvas>
    </div>
    <div>
      <div class="tl-detalhe-topo">
        <h3 class="tl-detalhe-titulo" style="color:${corRar};" aria-label="${escaparHtml(`${item.nome} · ${item.raridadeNome}`)}">${escaparHtml(item.nome)}</h3>
        <span class="tl-card-tag">${escaparHtml(item.categoriaLabel)}</span>
        <span class="tl-card-tag">${escaparHtml(tierAtual)}</span>
      </div>
      <p class="small"><strong>Ponto forte.</strong> ${escaparHtml(item.motivoUtilidade)}</p>
      ${item.limiteUtilidade ? `<p class="small"><strong>Limitação.</strong> ${escaparHtml(item.limiteUtilidade)}</p>` : ""}
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
      ? "FC simulado com uma base fixa de personagem. Clique em um item para ver a ficha de cálculo. Os tiers são relativos ao filtro e o FC usa atributos, sem passivas de combate."
      : "Avaliação do Nando para chefes e Raid. Em cada tier, a ordem dá mais peso a proteção do grupo, dano em chefes e sobrevivência.";
  }
  const metodologiaFc = document.querySelector("#tierlist-metodologia-fc");
  if (metodologiaFc) metodologiaFc.hidden = modoAtual !== "fc";

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
                ? `${formatarNumeroCompacto(item.referenciaFc.fc)} FC`
                : item.tagUtilidade;
              const rotulo = `${item.nome} · ${item.categoriaLabel} · ${item.raridadeNome} · ${badgeTag}`;
              return `
                <button type="button" class="tl-card ${clsRar} ${clsSel}" data-tl-card="${escaparHtml(item.id)}" aria-pressed="${item.id === itemSelecionadoId}" aria-label="${escaparHtml(rotulo)}">
                  <canvas data-tl-sprite="${escaparHtml(item.id)}" data-tl-escala="3"></canvas>
                  <span class="tl-card-nome">${escaparHtml(item.nome)}</span>
                  <span class="tl-card-classe">${escaparHtml(item.categoriaLabel)}</span>
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
      containerDetalhe?.focus({ preventScroll: true });
      const reduzirMovimento = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      containerDetalhe?.scrollIntoView?.({ behavior: reduzirMovimento ? "auto" : "smooth", block: "start" });
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

