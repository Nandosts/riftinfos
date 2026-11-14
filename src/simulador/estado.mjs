import { inferirAtributosBase } from "../combate.mjs";
import {
  catalogoAneis,
  catalogoArmas,
  catalogoConjuntos,
  catalogoGemas,
  nomesSlots,
  rotulosStats,
} from "../dados.mjs";

const simulacao = {
  simuladorEditadoManual: false,
  modoVisualizacaoSimulador: "ficha",
  slotSelecionadoSimulador: 0,
  engasteSelecionadoSimulador: 0,
  termoBuscaSlotSimulador: "",
  opcoesAvancadasAbertasSimulador: false,
  modoRolagemGemaSimulador: "max",
  autoCalcularStatsItemSimulador: true,
  filtroConjuntoSlotSimulador: "classe",
  estadoSimulador: criarModeloSimuladorPadrao(),
  historicoDesfazerSimulador: [],
};

const escalaGemasUz = [1, 1.6, 2.4, 3.5, 5];
const escalaGemasXz = [1, 2, 3.5, 6, 9];
const fatoresGemasHz = { atk: 1.5, crit: 0.8, spd: 0.8 };

const multiplicadoresRaridadeItem = [0.35, 0.45, 0.55, 0.68, 0.78, 0.84, 0.92, 1.0];

function obterRollFixoModoGema() {
  if (simulacao.modoRolagemGemaSimulador === "max") return 1.15;
  if (simulacao.modoRolagemGemaSimulador === "media") return 1.0;
  return null;
}

function sortearRolagemGema() {
  // Intervalo oficial do jogo: 0.85 a 1.15
  return 0.85 + Math.random() * 0.30;
}

function calcularValorGemaOficial(stat, tier, itemLevel = 300, ehPct = false, roll = 1.0) {
  const o = Math.min(5, Math.max(1, Number(tier) || 5)) - 1;
  if (ehPct || stat === "hp" || stat === "def") {
    // hp e def percentuais: 10 * Uz[o] (em decimos de %, ex: 10 * 5 = 50 -> 5.0%)
    const basePct = 10 * escalaGemasUz[o];
    return Math.max(1, Math.round(basePct * roll));
  }
  // stats planos: Hz[stat] * Xz[o] * (1 + itemLevel / 60)
  const fatorStat = fatoresGemasHz[stat] || 1.0;
  const nivelItem = Math.max(1, Number(itemLevel) || 100);
  const basePlana = fatorStat * escalaGemasXz[o] * (1 + nivelItem / 60);
  return Math.max(1, Math.round(basePlana * roll));
}

function criarGemaPreset(tipo, slot, tier = 5, itemLevel = 300, rollFixo = undefined) {
  if (!tipo || tipo === "none" || !catalogoGemas[tipo]) return null;
  const spec = catalogoGemas[tipo].porSlot[slot] || catalogoGemas[tipo].porSlot.weapon;
  const t = Math.min(5, Math.max(1, Number(tier) || 5));

  const rollModo = rollFixo === undefined ? obterRollFixoModoGema() : rollFixo;
  const roll1 = typeof rollModo === "number" ? rollModo : sortearRolagemGema();
  const roll2 = typeof rollModo === "number" ? rollModo : sortearRolagemGema();

  const val1 = calcularValorGemaOficial(spec.stat, t, itemLevel, spec.pct, roll1);
  const gema = {
    type: tipo,
    tier: t,
    name: `${catalogoGemas[tipo].nome} T${t}${t === 5 ? " Suprema" : ""}`,
    stat: spec.stat,
    value: val1,
    pct: spec.pct,
    roll1: Math.round(roll1 * 100),
  };

  if (t >= 5 && spec.stat2) {
    gema.stat2 = spec.stat2;
    gema.value2 = calcularValorGemaOficial(spec.stat2, t, itemLevel, spec.pct2, roll2);
    gema.pct2 = spec.pct2;
    gema.roll2 = Math.round(roll2 * 100);
  }
  return gema;
}

function recalcularGemasItem(item, rollForcado = undefined) {
  if (!item || !Array.isArray(item.gems)) return;
  const rollUsar = rollForcado === undefined ? obterRollFixoModoGema() : rollForcado;
  item.gems = item.gems.map((g) => {
    if (!g || !g.type) return null;
    const tierGema = Number(g.tier || item.gemTierPadrao || 5);
    return criarGemaPreset(g.type, item.slot, tierGema, item.itemLevel || 100, rollUsar);
  });
}

function recalcularGemasBuildComModo(rollForcado = undefined) {
  simulacao.estadoSimulador.itens.forEach((item) => {
    recalcularGemasItem(item, rollForcado);
  });
}

function calcularAtributosPadraoPeca(slot, classe, raridade = 7, itemLevel = 250) {
  const idxRaridade = Math.min(7, Math.max(0, Number(raridade) || 0));
  const multRar = multiplicadoresRaridadeItem[idxRaridade] ?? 1.0;
  const nv = Math.max(1, Number(itemLevel) || 1);

  if (slot === "weapon") {
    return {
      atk: Math.round(nv * 10.9 * multRar),
      def: Math.round(nv * 2.78 * multRar),
      hp: Math.round(nv * 12.1 * multRar),
      crit: Math.round(nv * 0.455 * multRar),
      spd: Math.max(4, Math.round(11 * multRar)),
    };
  }
  if (slot === "helmet") {
    return {
      atk: Math.round(nv * 3.63 * multRar),
      def: Math.round(nv * 3.64 * multRar),
      hp: Math.round(nv * 15.8 * multRar),
      crit: Math.round(nv * 0.455 * multRar),
      spd: Math.max(4, Math.round(10 * multRar)),
    };
  }
  if (slot === "armor") {
    return {
      atk: Math.round(nv * 3.63 * multRar),
      def: Math.round(nv * 6.38 * multRar),
      hp: Math.round(nv * 22.8 * multRar),
      crit: Math.round(nv * 0.455 * multRar),
      spd: Math.max(4, Math.round(9 * multRar)),
    };
  }
  return {
    atk: Math.round(nv * 3.68 * multRar),
    def: Math.round(nv * 2.40 * multRar),
    hp: Math.round(nv * 14.5 * multRar),
    crit: Math.round(nv * 0.60 * multRar),
    spd: Math.max(5, Math.round(15 * multRar)),
  };
}

function aplicarAtributosPadraoNoItem(item, recalcularGemas = true) {
  if (!item) return;
  const stats = calcularAtributosPadraoPeca(item.slot, simulacao.estadoSimulador.cls, item.rarity, item.itemLevel);
  item.atk = stats.atk;
  item.def = stats.def;
  item.hp = stats.hp;
  item.crit = stats.crit;
  item.spd = stats.spd;
  if (recalcularGemas) {
    recalcularGemasItem(item);
  }
}

function obterNomeOficialPecaConjunto(setKey, slot) {
  const info = catalogoConjuntos[setKey];
  if (!info) return `Peça (${nomesSlots[slot] || slot})`;
  if (slot === "weapon") return info.armaNome || catalogoArmas[info.armaKind]?.nome || `Arma (${info.nome})`;
  if (slot === "helmet") return info.elmoNome || `Elmo (${info.nome})`;
  if (slot === "armor") return info.armaduraNome || `Armadura (${info.nome})`;
  return `Peça (${info.nome})`;
}

function formatarBonusConjuntoCurto(bonusObj) {
  if (!bonusObj) return "—";
  const partes = [];
  if (bonusObj.atk) partes.push(`+${Math.round(bonusObj.atk * 100)}% ATK`);
  if (bonusObj.hp) partes.push(`+${Math.round(bonusObj.hp * 100)}% HP`);
  if (bonusObj.def) partes.push(`+${Math.round(bonusObj.def * 100)}% DEF`);
  if (bonusObj.spd) partes.push(`+${Math.round(bonusObj.spd * 100)}% VEL`);
  if (bonusObj.crit) partes.push(`+${bonusObj.crit}% CRÍT`);
  return partes.join(" · ") || "—";
}

function resumoCurtoGemaBotao(tipo, slot, tier, itemLevel = 300) {
  if (!tipo || tipo === "none" || !catalogoGemas[tipo]) return "";
  const spec = catalogoGemas[tipo].porSlot[slot] || catalogoGemas[tipo].porSlot.weapon;
  const t = Math.min(5, Math.max(1, Number(tier) || 5));
  const rollModo = obterRollFixoModoGema();

  const fmtTexto = (st, pct) => {
    const rot = rotulosStats[st] || st.toUpperCase();
    if (typeof rollModo === "number") {
      const val = calcularValorGemaOficial(st, t, itemLevel, pct, rollModo);
      if (pct) {
        return `+${(val / 10).toFixed(1).replace(".", ",")}% ${rot}`;
      }
      return `+${val} ${rot}`;
    }
    const min = calcularValorGemaOficial(st, t, itemLevel, pct, 0.85);
    const max = calcularValorGemaOficial(st, t, itemLevel, pct, 1.15);
    if (pct) {
      return `+${(min / 10).toFixed(1).replace(".", ",")}% a +${(max / 10).toFixed(1).replace(".", ",")}% ${rot}`;
    }
    return `+${min} a +${max} ${rot}`;
  };

  let txt = fmtTexto(spec.stat, spec.pct);
  if (t >= 5 && spec.stat2) {
    txt += ` · ${fmtTexto(spec.stat2, spec.pct2)}`;
  }
  return txt;
}

function criarModeloSimuladorPadrao() {
  return {
    cls: "warrior",
    level: 400,
    atributos: { str: 200, vit: 180, def: 150, agi: 140, luk: 120 },
    itens: [
      { id: "sim-weapon", slot: "weapon", name: "Lâmina da Singularidade", kind: "singblade", set: "singular", rarity: 7, itemLevel: 200, atk: 900, def: 300, hp: 2000, crit: 90, spd: 12, sockets: 6, gemTierPadrao: 5, gems: Array(6).fill(null) },
      { id: "sim-helmet", slot: "helmet", name: "Elmo da Singularidade", kind: "singhelm", set: "singular", rarity: 7, itemLevel: 200, atk: 550, def: 500, hp: 3200, crit: 75, spd: 8, sockets: 6, gemTierPadrao: 5, gems: Array(6).fill(null) },
      { id: "sim-armor", slot: "armor", name: "Couraça da Singularidade", kind: "singplate", set: "singular", rarity: 7, itemLevel: 200, atk: 600, def: 750, hp: 5000, crit: 70, spd: 8, sockets: 6, gemTierPadrao: 5, gems: Array(6).fill(null) },
      { id: "sim-ring", slot: "ring", name: "Anel do Eclipse Arcano", kind: "", look: 14, set: "", rarity: 7, itemLevel: 180, atk: 550, def: 220, hp: 1000, crit: 95, spd: 14, sockets: 6, gemTierPadrao: 5, gems: Array(6).fill(null) },
    ],
  };
}

function importarPerfilParaSimulador(perfil) {
  if (!perfil) return;
  const attrs = inferirAtributosBase(perfil);
  const slots = ["weapon", "helmet", "armor", "ring"];
  const itensImportados = slots.map((slot) => {
    const orig = (perfil.equipped || []).find((i) => i.slot === slot);
    if (!orig) {
      return {
        id: `sim-${slot}`,
        slot,
        name: `Peça (${nomesSlots[slot]})`,
        kind: "",
        look: slot === "ring" ? 14 : 0,
        set: "",
        rarity: 6,
        itemLevel: 100,
        atk: 0,
        def: 0,
        hp: 0,
        crit: 0,
        spd: 0,
        sockets: 6,
        gemTierPadrao: 5,
        gems: Array(6).fill(null),
      };
    }
    const origGems = Array.isArray(orig.gems) ? orig.gems : [];
    const tierDetectado = origGems.find((g) => g?.tier)?.tier || 5;
    return {
      ...orig,
      gemTierPadrao: tierDetectado,
      gems: Array.from({ length: 6 }, (_, i) => (origGems[i] ? { ...origGems[i] } : null)),
    };
  });

  simulacao.estadoSimulador = {
    cls: perfil.cls,
    level: perfil.level,
    atributos: { ...attrs },
    itens: itensImportados,
  };
  simulacao.simuladorEditadoManual = false;
}

const slotsAbertosSimulador = new Set([0]);
const iconesSlotsSimulador = { weapon: "🗡️", helmet: "🪖", armor: "🛡️", ring: "💍" };

function equiparConjuntoCompletoSimulador(setKey) {
  const infoSet = catalogoConjuntos[setKey];
  if (!infoSet) return;
  [0, 1, 2].forEach((idx) => {
    const it = simulacao.estadoSimulador.itens[idx];
    if (!it) return;
    it.set = setKey;
    if (idx === 0) {
      it.kind = infoSet.armaKind || it.kind || "";
      it.name = infoSet.armaNome || catalogoArmas[infoSet.armaKind]?.nome || it.name;
    } else if (idx === 1) {
      it.kind = infoSet.elmoKind || it.kind || "";
      it.name = infoSet.elmoNome || `Elmo (${infoSet.nome})`;
    } else if (idx === 2) {
      it.kind = infoSet.armaduraKind || it.kind || "";
      it.name = infoSet.armaduraNome || `Armadura (${infoSet.nome})`;
    }
    if (simulacao.autoCalcularStatsItemSimulador) {
      if (typeof infoSet.raridadePadrao === "number") {
        it.rarity = infoSet.raridadePadrao;
      }
      aplicarAtributosPadraoNoItem(it);
    }
  });
}

function obterResumoPassivasBuildSimulador() {
  const contagemSets = {};
  simulacao.estadoSimulador.itens.forEach((it) => {
    if (!it || it.slot === "cosmetic" || !it.set || !catalogoConjuntos[it.set]) return;
    contagemSets[it.set] = (contagemSets[it.set] || 0) + 1;
  });

  const setsDetectados = Object.entries(contagemSets).map(([chave, qtd]) => ({
    chave,
    qtd,
    info: catalogoConjuntos[chave],
  }));

  const armaItem = simulacao.estadoSimulador.itens[0];
  const anelItem = simulacao.estadoSimulador.itens[3];
  const armaInfo = armaItem?.kind ? catalogoArmas[armaItem.kind] : null;
  const anelInfo = Number(anelItem?.look) ? catalogoAneis[Number(anelItem.look)] : null;

  const contagemGemas = {};
  let totalGemas = 0;
  simulacao.estadoSimulador.itens.forEach((it) => {
    (it?.gems || []).slice(0, Number(it?.sockets ?? 6)).forEach((g) => {
      if (g && g.type) {
        contagemGemas[g.type] = (contagemGemas[g.type] || 0) + 1;
        totalGemas += 1;
      }
    });
  });

  return { setsDetectados, armaInfo, anelInfo, contagemGemas, totalGemas };
}

export {
  aplicarAtributosPadraoNoItem,
  criarGemaPreset,
  criarModeloSimuladorPadrao,
  equiparConjuntoCompletoSimulador,
  formatarBonusConjuntoCurto,
  importarPerfilParaSimulador,
  obterNomeOficialPecaConjunto,
  obterResumoPassivasBuildSimulador,
  recalcularGemasBuildComModo,
  recalcularGemasItem,
  resumoCurtoGemaBotao,
  simulacao,
  slotsAbertosSimulador,
};
