import { inferirAtributosBase } from "../combate.mjs";
import {
  catalogoAneis,
  catalogoArmas,
  catalogoConjuntos,
  catalogoEscalasPecas,
  curvasReferenciaPecas,
  catalogoGemas,
  nomesSlots,
  rotulosStats,
} from "../dados.mjs";

const origemPorBuild = new WeakMap();
const tiersEngastesVazios = new WeakMap();

function obterOrigemBuildSimulador() {
  return origemPorBuild.get(simulacao.estadoSimulador);
}

const escalaGemasUz = [1, 1.6, 2.4, 3.5, 5, 7.5];
const escalaGemasXz = [1, 2, 3.5, 6, 9, 14];
const fatoresGemasHz = { atk: 1.5, crit: 0.8, spd: 0.8 };

const engastesPorRaridade = [0, 1, 2, 3, 4, 3, 5, 6];
const multiplicadoresRaridadeItem = [0.35, 0.45, 0.55, 0.68, 0.78, 0.84, 0.92, 1.0];

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

function obterRollFixoModoGema() {
  if (simulacao.modoRolagemGemaSimulador === "max") return 1.15;
  if (simulacao.modoRolagemGemaSimulador === "media") return 1.0;
  return null;
}

function sortearRolagemGema() {
  // Intervalo oficial do jogo: 0.85 a 1.15
  return 0.85 + Math.random() * 0.30;
}

function limitarTierGema(tier, raridade = 7) {
  return Math.min(raridade >= 6 ? 6 : 5, Math.max(1, Math.trunc(Number(tier)) || 5));
}

function obterTierEngaste(item, indice) {
  const tier = item.gems?.[indice]?.tier ?? tiersEngastesVazios.get(item)?.get(indice) ?? item.gemTierPadrao;
  return limitarTierGema(tier, item.rarity);
}

function definirTierEngaste(item, indice, tier) {
  const tierValido = limitarTierGema(tier, item.rarity);
  if (!tiersEngastesVazios.has(item)) tiersEngastesVazios.set(item, new Map());
  tiersEngastesVazios.get(item).set(indice, tierValido);
  const gema = item.gems?.[indice];
  if (gema && gema.tier !== tierValido) {
    item.gems[indice] = criarGemaPreset(gema.type || gema.kind, item.slot, tierValido, item.itemLevel);
  }
}

function rotuloTierGema(tier) {
  return `T${tier}${tier === 6 ? " Prismática" : tier === 5 ? " Suprema" : ""}`;
}

function calcularValorGemaOficial(stat, tier, itemLevel = 300, ehPct = false, roll = 1.0) {
  const o = limitarTierGema(tier) - 1;
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
  const t = limitarTierGema(tier);

  const rollModo = rollFixo === undefined ? obterRollFixoModoGema() : rollFixo;
  const roll1 = Array.isArray(rollModo) ? rollModo[0] : rollModo ?? sortearRolagemGema();
  const roll2 = Array.isArray(rollModo) ? rollModo[1] : rollModo ?? sortearRolagemGema();

  const val1 = calcularValorGemaOficial(spec.stat, t, itemLevel, spec.pct, roll1);
  const gema = {
    type: tipo,
    tier: t,
    name: `${catalogoGemas[tipo].nome} ${rotuloTierGema(t)}`,
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
    if (!g) return null;
    const tierGema = limitarTierGema(g.tier || item.gemTierPadrao, item.rarity);
    return criarGemaPreset(g.type || g.kind, item.slot, tierGema, item.itemLevel || 100, rollUsar);
  });
}

function adequarTierGemas(item) {
  if (item.rarity >= 6) return;
  if (item.gemTierPadrao > 5) item.gemTierPadrao = 5;
  if (item.gems?.some((gema) => gema?.tier > 5)) {
    item.gems = item.gems.map((gema) => gema?.tier > 5
      ? criarGemaPreset(gema.type || gema.kind, item.slot, 5, item.itemLevel)
      : gema);
  }
}

function recalcularGemasBuildComModo(rollForcado = undefined) {
  simulacao.estadoSimulador.itens.forEach((item) => {
    recalcularGemasItem(item, rollForcado);
  });
}

function adequarEngastesSimulados(item) {
  item.sockets = Number(item.itemLevel) >= 20 ? engastesPorRaridade[item.rarity] ?? 0 : 0;
  if (item.gems?.length !== item.sockets) {
    const gemas = item.gems;
    item.gems = Array.from({ length: item.sockets }, (_, indice) => gemas?.[indice] ?? null);
  }
  adequarTierGemas(item);
  return item;
}

function resolverKindEfetivoItem(item) {
  if (!item || item.slot === "ring") return "";
  if (item.kind) return item.kind;
  const infoSet = item.set ? catalogoConjuntos[item.set] : null;
  if (!infoSet) return "";
  if (item.slot === "weapon") return infoSet.armaKind || "";
  if (item.slot === "helmet") return infoSet.elmoKind || "";
  if (item.slot === "armor") return infoSet.armaduraKind || "";
  return "";
}

function calcularAtributosPadraoPeca(slot, classe, raridade = 7, itemLevel = 250, look = 0, kind = "") {
  const idxRaridade = Math.min(7, Math.max(0, Number(raridade) || 0));
  const multRar = multiplicadoresRaridadeItem[idxRaridade] ?? 1.0;
  const nv = Math.max(1, Number(itemLevel) || 1);

  if (slot !== "ring") {
    const kindPadraoClasse = slot === "weapon"
      ? ({ warrior: "sword", archer: "bow", cleric: "staff" }[classe] || "sword")
      : "";
    const kindCurva = curvasReferenciaPecas.get(kind) || kind;
    const escPeca = catalogoEscalasPecas[kindCurva] || catalogoEscalasPecas[kindPadraoClasse];
    if (escPeca) {
      const rarBase = escPeca.raridadeBase ?? 7;
      const fatorRar = multRar / (multiplicadoresRaridadeItem[rarBase] ?? 1.0);
      return {
        atk: Math.round(nv * escPeca.atk * fatorRar),
        def: Math.round(nv * escPeca.def * fatorRar),
        hp: Math.round(nv * escPeca.hp * fatorRar),
        crit: Math.round(nv * escPeca.crit * fatorRar),
        spd: escPeca.spd > 0 ? Math.max(4, Math.round(escPeca.spd * fatorRar)) : 0,
      };
    }
    return {
      atk: Math.round(nv * 3.355 * multRar),
      def: Math.round(nv * 2.81 * multRar),
      hp: Math.round(nv * 13.78 * multRar),
      crit: Math.round(nv * 0.485 * multRar),
      spd: Math.max(4, Math.round(8 * multRar)),
    };
  }

  const infoAnel = catalogoAneis[Number(look)];
  if (infoAnel?.escalaPorNivel) {
    const esc = infoAnel.escalaPorNivel;
    const rarBaseAnel = infoAnel.raridadeMin || 7;
    const fatorRar = multRar / (multiplicadoresRaridadeItem[rarBaseAnel] ?? 1.0);
    return {
      atk: Math.round(nv * esc.atk * fatorRar),
      def: Math.round(nv * esc.def * fatorRar),
      hp: Math.round(nv * esc.hp * fatorRar),
      crit: Math.round(nv * esc.crit * fatorRar),
      spd: Math.max(4, Math.round(esc.spd * fatorRar)),
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
  adequarTierGemas(item);
  const kindEfetivo = resolverKindEfetivoItem(item);
  const stats = calcularAtributosPadraoPeca(
    item.slot,
    simulacao?.estadoSimulador?.cls || "warrior",
    item.rarity,
    item.itemLevel,
    item.look,
    kindEfetivo
  );
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

function resumoCurtoGemaBotao(tipo, slot, tier, itemLevel = 300, rollModo = obterRollFixoModoGema()) {
  if (!tipo || tipo === "none" || !catalogoGemas[tipo]) return "";
  const spec = catalogoGemas[tipo].porSlot[slot] || catalogoGemas[tipo].porSlot.weapon;
  const t = limitarTierGema(tier);

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
  const w = calcularAtributosPadraoPeca("weapon", "warrior", 6, 200, 0, "singblade");
  const h = calcularAtributosPadraoPeca("helmet", "warrior", 6, 200, 0, "singhelm");
  const a = calcularAtributosPadraoPeca("armor", "warrior", 6, 200, 0, "singplate");
  const r = calcularAtributosPadraoPeca("ring", "warrior", 7, 180, 14, "");
  return {
    cls: "warrior",
    level: 400,
    atributos: { str: 200, vit: 180, def: 150, agi: 140, luk: 120 },
    itens: [
      { id: "sim-weapon", slot: "weapon", name: "Lâmina da Singularidade", kind: "singblade", set: "singular", rarity: 6, itemLevel: 200, ...w, gemTierPadrao: 5 },
      { id: "sim-helmet", slot: "helmet", name: "Elmo da Singularidade", kind: "singhelm", set: "singular", rarity: 6, itemLevel: 200, ...h, gemTierPadrao: 5 },
      { id: "sim-armor", slot: "armor", name: "Couraça da Singularidade", kind: "singplate", set: "singular", rarity: 6, itemLevel: 200, ...a, gemTierPadrao: 5 },
      { id: "sim-ring", slot: "ring", name: "Anel do Eclipse Arcano", kind: "", look: 14, set: "", rarity: 7, itemLevel: 180, ...r, gemTierPadrao: 5 },
    ].map(adequarEngastesSimulados),
  };
}

function importarPerfilParaSimulador(perfil) {
  if (!perfil) return;
  const attrs = inferirAtributosBase(perfil);
  const slots = ["weapon", "helmet", "armor", "ring"];
  const pecasImportadas = {};
  const itensImportados = slots.map((slot) => {
    const orig = (perfil.equipped || []).find((i) => i.slot === slot);
    if (!orig) {
      return adequarEngastesSimulados({
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
        gemTierPadrao: 5,
      });
    }
    pecasImportadas[slot] = {
      slot,
      kind: orig.kind || "",
      set: orig.set || "",
      look: Number(orig.look) || 0,
      rarity: Number(orig.rarity) || 7,
      itemLevel: Number(orig.itemLevel) || 100,
      atk: Number(orig.atk) || 0,
      def: Number(orig.def) || 0,
      hp: Number(orig.hp) || 0,
      crit: Number(orig.crit) || 0,
      spd: Number(orig.spd) || 0,
    };
    const origGems = Array.isArray(orig.gems) ? orig.gems : [];
    const tierDetectado = origGems.find((g) => g?.tier)?.tier || 5;
    return adequarEngastesSimulados({
      ...orig,
      gemTierPadrao: tierDetectado,
      gems: origGems.map((gema) => gema ? { ...gema } : null),
    });
  });

  simulacao.estadoSimulador = {
    cls: perfil.cls,
    level: perfil.level,
    atributos: { ...attrs },
    itens: itensImportados,
  };
  origemPorBuild.set(simulacao.estadoSimulador, {
    nome: perfil.displayName || perfil.login,
    classe: perfil.cls,
    cosmetico: perfil.equipped?.find((item) => item.slot === "cosmetic")?.kind,
    anelImportado: pecasImportadas.ring || null,
    pecasImportadas,
  });
  simulacao.simuladorEditadoManual = false;
}

function restaurarOuCalcularAtributosPeca(item, recalcularGemas = false) {
  if (!item) return;
  const imp = obterOrigemBuildSimulador()?.pecasImportadas?.[item.slot];
  const mesmaIdentidade = item.slot === "ring"
    ? imp && imp.look === Number(item.look)
    : imp && imp.kind === resolverKindEfetivoItem(item) && (imp.set || "") === (item.set || "");
  if (mesmaIdentidade && imp.itemLevel === Number(item.itemLevel) && imp.rarity === Number(item.rarity)) {
    adequarTierGemas(item);
    item.atk = imp.atk;
    item.def = imp.def;
    item.hp = imp.hp;
    item.crit = imp.crit;
    item.spd = imp.spd;
    if (recalcularGemas) recalcularGemasItem(item);
    return;
  }
  aplicarAtributosPadraoNoItem(item, recalcularGemas);
}

function aplicarTrocaAnelSimulador(anel, novoLook) {
  if (!anel) return;
  const look = Number(novoLook) || 0;
  if (Number(anel.look) !== look) limparVisualImportado(anel);
  anel.look = look;
  const infoAnel = catalogoAneis[look];
  anel.name = infoAnel?.nome || "Anel Comum";
  const imp = obterOrigemBuildSimulador()?.pecasImportadas?.ring;
  if (imp && imp.look === look && imp.itemLevel === Number(anel.itemLevel)) {
    anel.rarity = imp.rarity;
    restaurarOuCalcularAtributosPeca(anel, false);
    return;
  }
  if (infoAnel?.raridadeMin) {
    anel.rarity = infoAnel.raridadeMin;
  }
  if (simulacao.autoCalcularStatsItemSimulador) {
    aplicarAtributosPadraoNoItem(anel, false);
  } else {
    adequarTierGemas(anel);
  }
}

const slotsAbertosSimulador = new Set([0]);
const iconesSlotsSimulador = { weapon: "🗡️", helmet: "🪖", armor: "🛡️", ring: "💍" };

function limparVisualImportado(item) {
  delete item.vKind;
  delete item.vLook;
  delete item.vTier;
}

function equiparPecaConjuntoSimulador(item, setKey) {
  const info = catalogoConjuntos[setKey];
  if (!item || !info) return;
  const campoKind = { weapon: "armaKind", helmet: "elmoKind", armor: "armaduraKind" }[item.slot];
  if (!campoKind) return;

  const kind = info[campoKind] || "";
  if (item.set !== setKey || item.kind !== kind) {
    limparVisualImportado(item);
    item.look = 0;
  }
  item.set = setKey;
  item.kind = kind;
  item.name = obterNomeOficialPecaConjunto(setKey, item.slot);
  if (simulacao.autoCalcularStatsItemSimulador) {
    const imp = obterOrigemBuildSimulador()?.pecasImportadas?.[item.slot];
    if (imp && imp.kind === kind && imp.set === setKey && imp.itemLevel === Number(item.itemLevel)) {
      item.rarity = imp.rarity;
      restaurarOuCalcularAtributosPeca(item, false);
      return;
    }
    if (typeof info.raridadePadrao === "number") item.rarity = info.raridadePadrao;
    aplicarAtributosPadraoNoItem(item, false);
  }
}

function equiparConjuntoCompletoSimulador(setKey) {
  simulacao.estadoSimulador.itens.forEach((item) => equiparPecaConjuntoSimulador(item, setKey));
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
  adequarEngastesSimulados,
  adequarTierGemas,
  aplicarAtributosPadraoNoItem,
  aplicarTrocaAnelSimulador,
  criarGemaPreset,
  criarModeloSimuladorPadrao,
  definirTierEngaste,
  equiparConjuntoCompletoSimulador,
  equiparPecaConjuntoSimulador,
  limparVisualImportado,
  limitarTierGema,
  formatarBonusConjuntoCurto,
  importarPerfilParaSimulador,
  obterNomeOficialPecaConjunto,
  obterOrigemBuildSimulador,
  obterResumoPassivasBuildSimulador,
  obterTierEngaste,
  recalcularGemasBuildComModo,
  recalcularGemasItem,
  restaurarOuCalcularAtributosPeca,
  resumoCurtoGemaBotao,
  rotuloTierGema,
  sortearRolagemGema,
  simulacao,
  slotsAbertosSimulador,
};
