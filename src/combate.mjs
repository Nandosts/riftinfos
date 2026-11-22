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

function aplicarTetoGolpeHeroi(danoMitigado, maxHp, ehBleedOuDot = false) {
  const danoBase = Math.max(1, Math.round(Number(danoMitigado) || 0));
  if (ehBleedOuDot) return danoBase;
  const tetoGolpe = Math.max(1, Math.ceil((Number(maxHp) || 1) * 0.6));
  return Math.min(danoBase, tetoGolpe);
}

function calcularDanoDiretoInimigo(danoBruto, { def, hp }, teto = 1) {
  const danoMitigado = Math.max(1, Math.round(danoBruto * 100 / (100 + def * 4)));
  const limite = teto < 1 ? Math.max(1, Math.ceil(hp * teto)) : null;
  const dano = limite === null ? danoMitigado : Math.min(danoMitigado, limite);
  return { dano, limite };
}

function calcularFaixaGolpeInimigo(danoBruto, inimigo, teto) {
  const min = calcularDanoDiretoInimigo(danoBruto * 0.9, inimigo, teto);
  const max = calcularDanoDiretoInimigo(danoBruto * 1.1, inimigo, teto);
  return {
    minimo: min.dano,
    maximo: max.dano,
    creditoMinimo: Math.min(min.dano, inimigo.hp),
    creditoMaximo: Math.min(max.dano, inimigo.hp),
    limite: max.limite,
  };
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

function calcularMetricasCombate(classe, nivel, status, listaItens, {
  inimigo,
  teto = 1,
  multDanoHeroi = 1,
  alvosAoAlcance = inimigo ? 1 : 2,
} = {}) {
  const itens = listaItens || [];
  const arma = itens.find((i) => i.slot === "weapon");
  const anel = itens.find((i) => i.slot === "ring");
  const infoClasse = dadosClasses[classe] || dadosClasses.warrior;
  const infoArma = (arma?.kind && catalogoArmas[arma.kind]) || null;
  const anelAtivo = anel && (anel.rarity ?? 0) >= 6 && anel.name !== "Peça (Anel)"
    ? catalogoAneis[anel.look] || null
    : null;

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

  function danoMedioAcerto(bruto, chanceCrit = taxaCrit) {
    if (!inimigo) return bruto * ((1 - chanceCrit) + chanceCrit * multCrit);
    function danoMedioGolpe(multiplicador) {
      let total = 0;
      for (let amostra = 0; amostra < 10; amostra++) {
        const variacao = 0.91 + amostra * 0.02;
        total += calcularDanoDiretoInimigo(bruto * multiplicador * variacao * multDanoHeroi, inimigo, teto).dano;
      }
      return total / 10;
    }
    return (1 - chanceCrit) * danoMedioGolpe(1) + chanceCrit * danoMedioGolpe(multCrit);
  }

  const ef = infoArma?.efeito;
  const uptime = ef?.dur > 0 && ef.cada > 0 ? ef.dur / ef.cada : 0;
  function danoMedioComBuff(bruto) {
    if (ef?.tipo === "buff_atk") {
      return (1 - uptime) * danoMedioAcerto(bruto) + uptime * danoMedioAcerto(bruto * ef.atkMult);
    }
    if (ef?.tipo === "buff_crit") return danoMedioAcerto(bruto, (1 - uptime) * taxaCrit + uptime);
    return danoMedioAcerto(bruto);
  }

  const cdSkillReal = infoClasse.cdBaseSkill * 1.5 * (infoArma?.cdMult || 1.0);
  const skillAlvos = infoArma?.skillAlvos || (classe === "archer" ? 3 : 1);
  const skillMult = infoArma?.skillMult ?? infoClasse.multBaseSkill;
  const skillDeDano = classe !== "cleric" || infoArma?.skillTipo === "dano" || infoArma?.skillTipo === "misto";
  const skillExigeGrupo = classe === "warrior" || arma?.kind === "voidstaff" || arma?.kind === "lantern";
  const usaSkill = skillDeDano && (!skillExigeGrupo || alvosAoAlcance >= 2);
  function cadenciasDeAtaque(fatorVelocidade) {
    const taxaBasica = cadenciaReal * fatorVelocidade;
    if (!usaSkill || taxaBasica <= 0) return { basica: taxaBasica, skill: 0 };
    const intervaloBasico = 1 / taxaBasica;
    const intervaloAto = intervaloBasico / cdBasicoMult;
    const animacaoSkill = Math.max(0.2, Math.min(infoClasse.animacaoAtaque * 1.15, intervaloAto * 0.92));
    const pausaSkill = Math.max(intervaloAto, animacaoSkill + 0.15);
    // A habilidade pronta ainda espera terminar o intervalo do último ataque.
    const ataquesBasicos = Math.max(0, Math.ceil((cdSkillReal - pausaSkill) / intervaloBasico - 1e-9));
    const duracaoCiclo = pausaSkill + ataquesBasicos * intervaloBasico;
    return { basica: ataquesBasicos / duracaoCiclo, skill: 1 / duracaoCiclo };
  }
  const cadencias = cadenciasDeAtaque(1);
  const buffVelocidadeAtivo = ef?.tipo === "buff_aspd" ? uptime : 0;
  const cadenciasComBuff = buffVelocidadeAtivo > 0 ? cadenciasDeAtaque(2) : cadencias;
  const cadenciaBasica = cadencias.basica * (1 - buffVelocidadeAtivo) + cadenciasComBuff.basica * buffVelocidadeAtivo;
  const cadenciaSkill = cadencias.skill * (1 - buffVelocidadeAtivo) + cadenciasComBuff.skill * buffVelocidadeAtivo;
  const acertosSkill = infoArma?.skillMultiplicadoresPorAcerto ?? [skillMult];

  let skillDanoPorAlvo = 0;
  let skillDanoTotal = 0;
  if (skillDeDano) {
    skillDanoPorAlvo = status.atk * speedBonus * acertosSkill.reduce((soma, mult) => soma + mult, 0) * fatorCritEsperado;
    if (infoArma?.skillDecaimento && skillAlvos > 1) {
      skillDanoTotal =
        skillDanoPorAlvo *
        ((1 - Math.pow(infoArma.skillDecaimento, skillAlvos)) / (1 - infoArma.skillDecaimento));
    } else if (infoArma?.skillFatorSecundario != null && skillAlvos > 1) {
      skillDanoTotal =
        skillDanoPorAlvo * (1 + (skillAlvos - 1) * infoArma.skillFatorSecundario);
    } else {
      skillDanoTotal = skillDanoPorAlvo * skillAlvos;
    }
  }

  const healPower = (status.atk * 2.4 + (nivel || 1) * 1.5 + 6) * speedBonus;
  const curaSkillLuzDivina = classe === "cleric"
    ? healPower * (infoArma?.curaMult ?? 0.85)
    : 0;
  const escudoAurora = infoArma?.escudoMult ? healPower * infoArma.escudoMult : 0;

  const fatorEco = anelAtivo && anel.look === 14 ? 1.2 : 1;
  const dpsBasico = danoMedioComBuff(golpeNormalBruto) * cadenciaBasica * fatorEco;

  let analiseEfeitoArma = null;
  let dpsEfeitoArma = 0;

  if (ef) {
    if (ef.tipo === "dano" || ef.tipo === "dano_carta") {
      const pesoCarta = ef.tipo === "dano_carta" ? 1 / 3 : 1;
      const danoMedioSemDefesa = status.atk * speedBonus * ef.mult * fatorCritEsperado;
      const danoMedio = inimigo
        ? (ef.multiplicadoresPorAcerto ?? [ef.mult]).reduce(
          (total, mult) => total + danoMedioAcerto(status.atk * speedBonus * mult), 0
        )
        : danoMedioSemDefesa;
      dpsEfeitoArma = danoMedio / ef.cada * pesoCarta;
      analiseEfeitoArma = {
        tipo: ef.tipo,
        nome: infoArma.nome,
        cada: ef.cada,
        mult: ef.mult,
        danoMedioSemDefesa,
        texto: ef.texto,
      };
    } else if (ef.tipo === "singularity") {
      analiseEfeitoArma = {
        tipo: ef.tipo,
        nome: infoArma.nome,
        cada: ef.cada,
        texto: ef.texto,
        pctMobBase: ef.pctMob,
        pctBossBase: ef.pctBoss,
        chanceEco: fatorEco > 1 ? 0.2 : 0,
        pctBossEfetivo: ef.pctBoss * fatorEco,
      };
    }
  }

  if (!infoArma?.efeito?.semEco) dpsEfeitoArma *= fatorEco;
  const dpsSkillPorAlvo = cadenciaSkill > 0
    ? acertosSkill.reduce((total, mult) => total + danoMedioComBuff(status.atk * speedBonus * mult), 0) * cadenciaSkill * fatorEco
    : 0;

  const coberturaAnelBleed =
    anelAtivo && anel.look === 10
      ? Math.min(1, cadenciaBasica * (anelAtivo.bleedDur || 2.5))
      : 0;
  const dpsAnelBleed =
    coberturaAnelBleed > 0
      ? status.atk * (anelAtivo.bleedDpsMult || 0.25) * coberturaAnelBleed
      : 0;
  const efArma = infoArma?.efeito;
  let dpsBleedVerdadeiro = dpsAnelBleed;
  if (efArma?.bleedDpsMult && efArma?.bleedDur && efArma?.cada > 0) {
    const janelaArma = Math.min(1, efArma.bleedDur / efArma.cada);
    const dpsBleedArmaPico = status.atk * efArma.bleedDpsMult;
    dpsBleedVerdadeiro =
      janelaArma * Math.max(dpsBleedArmaPico, dpsAnelBleed) +
      (1 - janelaArma) * dpsAnelBleed;
  }

  const dpsFisicoMedio = dpsBasico + dpsSkillPorAlvo + dpsEfeitoArma;
  const dpsCombateMedio = dpsFisicoMedio + dpsBleedVerdadeiro;
  const veneno = anelAtivo?.veneno;
  const presaIxtharra = veneno ? {
    dpsDiretoContraAlvoAfetado: dpsFisicoMedio * (1 + veneno.bonusContraSangramento),
    danoVenenoPorSegundo: status.atk * veneno.danoPorSegundo,
  } : null;
  const escudoTeiaEscarlate = Math.round(status.maxHp * (anelAtivo?.escudoVidaMaxima ?? 0));
  const reducaoDefesa = (status.def * 4) / (100 + status.def * 4);
  const ehp = status.maxHp * (1 + status.def * 0.04);

  const revives = [];
  if (arma?.kind === "emberblade") revives.push("Arma Brasa Eterna (60% HP + 30% escudo)");
  if (arma?.kind === "ankh") revives.push("Cetro da Vida (skill revive 55% HP)");
  if (arma?.kind === "worldstaff") revives.push("Árvore-Mundo (revive 50% a cada 15s)");
  if (arma?.kind === "clockscepter") revives.push("Relojoeiro Real (revive 45% a cada 14s)");
  if (anelAtivo && anel.look === 13) revives.push("Anel Fênix Rubra (40% HP + 20% escudo)");
  if (anelAtivo && anel.look === 15) revives.push("Anel Coração do Vazio (70% HP + 40% escudo)");

  return {
    arma,
    infoArma,
    anel,
    anelAtivo,
    speedBonus,
    cadenciaReal,
    cadenciaBasica,
    fatorCritEsperado,
    multCrit,
    golpeNormalBruto,
    golpeCritBruto,
    golpeMedioBruto,
    dpsBasico,
    dpsSkill: skillDanoPorAlvo > 0 ? dpsSkillPorAlvo * (skillDanoTotal / skillDanoPorAlvo) : 0,
    dpsSkillPorAlvo,
    cadenciaSkill,
    dpsFisicoMedio,
    dpsBleedVerdadeiro,
    dpsCombateMedio,
    dpsEfeitoArma,
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
    presaIxtharra,
    escudoTeiaEscarlate,
  };
}

function calcularImpactoComboSkillDot({
  maxHp,
  danoFisicoCombo,
  danoFisicoComboMin = danoFisicoCombo,
  danoFisicoComboMax = danoFisicoCombo,
  dotPorSeg,
  duracaoSeg = 4,
  intervaloTickSeg = 0.5,
  golpeExtraAntesDot = 0,
  atrasoAntesDotSeg = 0,
  golpeExtraFimDot = 0,
  primeiroTickImediato = false,
}) {
  const hpMaximo = Math.max(1, Number(maxHp) || 1);
  const hitInicial = Math.max(0, Math.round(danoFisicoCombo || 0));
  const hitInicialMin = Math.max(0, Math.round(danoFisicoComboMin ?? hitInicial));
  const hitInicialMax = Math.max(hitInicialMin, Math.round(danoFisicoComboMax ?? hitInicial));
  const hitAntesDot = Math.max(0, Math.round(golpeExtraAntesDot || 0));
  const hitFimDot = Math.max(0, Math.round(golpeExtraFimDot || 0));
  const atrasoDot = hitAntesDot > 0 ? Math.max(0, Number(atrasoAntesDotSeg) || 0) : 0;
  const danoPorTick = dotPorSeg > 0 ? Math.max(1, Math.round(dotPorSeg * intervaloTickSeg)) : 0;
  const totalTicks = danoPorTick > 0 ? Math.max(1, Math.round(duracaoSeg / intervaloTickSeg)) : 0;
  const danoDotTotal = danoPorTick * totalTicks;
  const danoFisicoTotal = hitInicial + hitAntesDot + hitFimDot;
  const danoTotalCombo = danoFisicoTotal + danoDotTotal;
  const hpAposHitInicial = Math.max(0, hpMaximo - hitInicial);
  const hpAposHitsPreDot = Math.max(0, hpAposHitInicial - hitAntesDot);
  const hpAposDot = Math.max(0, hpAposHitsPreDot - danoDotTotal);
  const hpAposCombo = Math.max(0, hpMaximo - danoTotalCombo);
  const letalNoCombo = danoPorTick > 0 && danoTotalCombo >= hpMaximo;

  let ticksParaMorrer = null;
  let tempoParaMorrerSeg = null;
  let causaQueda = null;
  if (letalNoCombo) {
    if (hpAposHitInicial <= 0) {
      ticksParaMorrer = 0;
      tempoParaMorrerSeg = 0;
      causaQueda = "impacto";
    } else if (hitAntesDot > 0 && hpAposHitsPreDot <= 0) {
      ticksParaMorrer = 0;
      tempoParaMorrerSeg = atrasoDot;
      causaQueda = "segundo_golpe";
    } else if (hpAposDot <= 0) {
      ticksParaMorrer = Math.min(totalTicks, Math.ceil(hpAposHitsPreDot / danoPorTick));
      const tempoDosTicks = primeiroTickImediato
        ? (ticksParaMorrer === 1 ? 0.017 : (ticksParaMorrer - 1) * intervaloTickSeg)
        : ticksParaMorrer * intervaloTickSeg;
      tempoParaMorrerSeg = Number((atrasoDot + tempoDosTicks).toFixed(2));
      causaQueda = "dot";
    } else {
      ticksParaMorrer = totalTicks;
      tempoParaMorrerSeg = Number((atrasoDot + duracaoSeg).toFixed(2));
      causaQueda = "golpe_final";
    }
  }

  const pctHpCombo = (danoTotalCombo / hpMaximo) * 100;
  const limiarImpactoMin = hitInicialMin;
  const limiarImpactoMax = hitInicialMax;
  const limiarPrimeiroTickMin = hitInicialMin + hitAntesDot + danoPorTick;
  const limiarPrimeiroTickMedio = hitInicial + hitAntesDot + danoPorTick;
  const limiarPrimeiroTickMax = hitInicialMax + hitAntesDot + danoPorTick;
  const pctHpPrimeiroTickMedio = Math.min(100, (limiarPrimeiroTickMedio / hpMaximo) * 100);
  const tempoPrimeiroTickSeg = primeiroTickImediato ? atrasoDot + 0.017 : atrasoDot + intervaloTickSeg;

  return {
    hitInicial,
    hitInicialMin,
    hitInicialMax,
    hitAntesDot,
    hitFimDot,
    danoFisicoTotal,
    danoPorTick,
    totalTicks,
    duracaoSeg,
    atrasoDot,
    intervaloTickSeg,
    danoDotTotal,
    danoTotalCombo,
    hpAposHitInicial,
    hpAposCombo,
    letalNoCombo,
    ticksParaMorrer,
    tempoParaMorrerSeg,
    causaQueda,
    pctHpCombo,
    limiarImpactoMin,
    limiarImpactoMax,
    limiarPrimeiroTickMin,
    limiarPrimeiroTickMedio,
    limiarPrimeiroTickMax,
    pctHpPrimeiroTickMedio,
    tempoPrimeiroTickSeg,
  };
}

export {
  agregarItens,
  aplicarTetoGolpeHeroi,
  calcularDanoDiretoInimigo,
  calcularFaixaGolpeInimigo,
  calcularFc,
  calcularImpactoComboSkillDot,
  calcularMetricasCombate,
  calcularStatusSimulados,
  inferirAtributosBase,
};
