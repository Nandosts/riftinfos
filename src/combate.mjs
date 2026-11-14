import {
  catalogoAneis,
  catalogoArmas,
  catalogoConjuntos,
  dadosClasses,
} from "./dados.mjs";

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
      if (!gema) continue;
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
  if (!perfil) return { str: 0, vit: 0, def: 0, agi: 0, luk: 0 };
  const classe = perfil.cls || "warrior";
  const dados = dadosClasses[classe] || dadosClasses.cleric;
  const nivel = Number(perfil.level) || 1;
  const r = Math.max(0, nivel - 1);
  const st = perfil.stats || {};
  const { fixos, gemasFixas, gemasPercent, multConjuntos, critConjunto } =
    agregarItens(perfil.equipped || []);

  if (st.atk == null || st.maxHp == null || st.def == null || st.aspd == null || st.crit == null) {
    return { str: 0, vit: 0, def: 0, agi: 0, luk: 0 };
  }

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

function calcularMetricasCombate(classe, nivel, status, listaItens) {
  const itens = listaItens || [];
  const arma = itens.find((i) => i.slot === "weapon");
  const anel = itens.find((i) => i.slot === "ring");
  const infoClasse = dadosClasses[classe] || dadosClasses.warrior;
  const infoArma = (arma?.kind && catalogoArmas[arma.kind]) || null;
  const anelAtivo = anel && (anel.rarity ?? 0) >= 6 ? catalogoAneis[anel.look] || null : null;

  const capAspd = 4.6;
  const speedBonus = status.aspd > capAspd ? status.aspd / capAspd : 1.0;
  const multBasico = infoArma?.basicMult || 1.0;
  const cdBasicoMult = infoArma?.cdBasicMult || 1.0;
  const cadenciaReal = Math.min(status.aspd, capAspd) / cdBasicoMult;

  const taxaCrit = Math.min(1, Math.max(0, (status.crit || 0) / 100));
  const multCrit = 1.75 + (status.critDmg || 0);
  const fatorCritEsperado = (1 - taxaCrit) + taxaCrit * multCrit;

  const golpeNormalBruto = status.atk * speedBonus * multBasico;
  const golpeCritBruto = golpeNormalBruto * multCrit;
  const golpeMedioBruto = golpeNormalBruto * fatorCritEsperado;

  const cdSkillReal = infoClasse.cdBaseSkill * 1.5 * (infoArma?.cdMult || 1.0);
  const skillAlvos = infoArma?.skillAlvos || (classe === "archer" ? 3 : 1);
  const skillMult = infoArma?.skillMult ?? infoClasse.multBaseSkill;
  const skillFatorCrit = infoArma?.skillSemCrit ? 1.0 : fatorCritEsperado;

  let skillDanoPorAlvo = 0;
  let skillDanoTotal = 0;
  if (classe !== "cleric" || infoArma?.skillTipo === "dano" || infoArma?.skillTipo === "misto") {
    skillDanoPorAlvo = status.atk * speedBonus * skillMult * skillFatorCrit;
    skillDanoTotal = skillDanoPorAlvo * skillAlvos;
  }

  const healPower = (status.atk * 2.4 + (nivel || 1) * 1.5 + 6) * speedBonus;
  const curaSkillLuzDivina = classe === "cleric"
    ? healPower * (infoArma?.curaMult ?? 0.85)
    : 0;
  const escudoAurora = infoArma?.escudoMult ? healPower * infoArma.escudoMult : 0;

  let dpsBasico = golpeMedioBruto * cadenciaReal;
  const dpsSkill = cdSkillReal > 0 ? skillDanoTotal / cdSkillReal : 0;

  // Bônus médios de uptime/anel no DPS
  let fatorAnelDps = 1.0;
  if (anelAtivo && anel.look === 14) {
    // Eclipse Arcano: +20% echo no alvo principal (e +60% em até 2 alvos extras em mob)
    fatorAnelDps = 1.2;
  }

  let analiseEfeitoArma = null;
  let dpsEfeitoBugado = 0;
  let dpsEfeitoCorrigido = 0;

  if (infoArma?.efeito) {
    const ef = infoArma.efeito;
    if (ef.tipo === "buff_atk") {
      // Ceifa-Reis: uptime 4/12 com +60% ATK
      dpsBasico *= 1 + (ef.dur / ef.cada) * (ef.atkMult - 1);
    } else if (ef.tipo === "buff_aspd") {
      // Tempestade Escarlate: dobra cadência por 4s a cada 12s
      dpsBasico *= 1 + ef.dur / ef.cada;
    } else if (ef.tipo === "buff_crit") {
      // Predador Carmesim: 100% crit por 3.5s a cada 9s
      const fatorUptime = ef.dur / ef.cada;
      const fatorCritMedioEfetivo = (1 - fatorUptime) * fatorCritEsperado + fatorUptime * multCrit;
      dpsBasico = golpeNormalBruto * fatorCritMedioEfetivo * cadenciaReal;
    } else if (ef.tipo === "dano" || ef.tipo === "dano_carta") {
      const pesoCarta = ef.tipo === "dano_carta" ? 1 / 3 : 1;
      const danoBugado = status.atk * ef.mult;
      const danoCorrigido = status.atk * speedBonus * ef.mult * fatorCritEsperado;
      dpsEfeitoBugado = (danoBugado / ef.cada) * pesoCarta;
      dpsEfeitoCorrigido = (danoCorrigido / ef.cada) * pesoCarta;
      analiseEfeitoArma = {
        bugado: true,
        nome: infoArma.nome,
        cada: ef.cada,
        mult: ef.mult,
        danoAtualSemDefesa: danoBugado,
        danoCorrigidoSemDefesa: danoCorrigido,
        razaoPerda: danoBugado > 0 ? danoCorrigido / danoBugado : 1,
        texto: ef.texto,
      };
    } else if (ef.tipo === "singularity") {
      const multAnelBoss = anelAtivo && anel.look === 14 ? 1.6 : (anelAtivo && anel.look === 12 ? 1.6 : 1.0);
      analiseEfeitoArma = {
        bugado: false,
        nome: infoArma.nome,
        cada: ef.cada,
        texto: ef.texto,
        pctBossEfetivo: ef.pctBoss * multAnelBoss,
      };
    }
  }

  const dpsCombateMedio = dpsBasico * fatorAnelDps + (skillDanoPorAlvo / cdSkillReal) + dpsEfeitoBugado;
  const reducaoDefesa = (status.def * 4) / (100 + status.def * 4);
  const ehp = status.maxHp * (1 + status.def * 0.04);

  const revives = [];
  if (arma?.kind === "emberblade") revives.push("Arma Brasa Eterna (60% HP + 30% escudo)");
  if (arma?.kind === "ankh") revives.push("Cetro da Vida (skill revive 55% HP)");
  if (arma?.kind === "worldstaff") revives.push("Árvore-Mundo (revive 50% a cada 15s)");
  if (anelAtivo && anel.look === 13) revives.push("Anel Fênix Rubra (40% HP + 20% escudo)");
  if (anelAtivo && anel.look === 15) revives.push("Anel Coração do Vazio (70% HP + 40% escudo)");

  return {
    arma,
    infoArma,
    anel,
    anelAtivo,
    speedBonus,
    cadenciaReal,
    fatorCritEsperado,
    multCrit,
    golpeNormalBruto,
    golpeCritBruto,
    golpeMedioBruto,
    dpsBasico: dpsBasico * fatorAnelDps,
    dpsSkill,
    dpsCombateMedio,
    dpsEfeitoBugado,
    dpsEfeitoCorrigido,
    cdSkillReal,
    skillMult,
    skillAlvos,
    skillDanoPorAlvo,
    skillDanoTotal,
    healPower,
    curaSkillLuzDivina,
    escudoAurora,
    reducaoDefesa,
    ehp,
    revives,
    analiseEfeitoArma,
  };
}

export {
  agregarItens,
  calcularFc,
  calcularMetricasCombate,
  calcularStatusSimulados,
  inferirAtributosBase,
};
