import { buscarJsonApi } from "./api.mjs";
import { Compartilhamento, Explicacoes } from "./bibliotecas.mjs";
import {
  aplicarTetoGolpeHeroi,
  calcularDanoDiretoInimigo,
  calcularFaixaGolpeInimigo,
  calcularImpactoComboSkillDot,
  calcularMetricasCombate,
  calcularStatusSimulados,
} from "./combate.mjs";
import { catalogoTemasZona, nomesClasses } from "./dados.mjs";
import {
  escaparHtml,
  formatadorDecimal1,
  formatadorInteiro,
  formatarNumeroCompacto,
  formatarZonaOndaDeOndas,
} from "./formato.mjs";
import { perfilCarregadoP1 } from "./perfil.mjs";
import { simulacao } from "./simulador/estado.mjs";

const formMonstros = document.querySelector("#form-monstros");
const inputMonstroZona = document.querySelector("#input-monstro-zona");
const inputMonstroOnda = document.querySelector("#input-monstro-onda");
const inputMonstroJogadores = document.querySelector("#input-monstro-jogadores");
const inputMonstroHp = document.querySelector("#input-monstro-hp");
const inputMonstroDanoHeroi = document.querySelector("#input-monstro-dano-heroi");
const inputTetoDanoInimigos = document.querySelector("#input-teto-dano-inimigos");
const selectMonstroOrigem = document.querySelector("#select-monstro-origem");
const selectMonstroLiveSync = document.querySelector("#select-monstro-live-sync");
const containerResultadoMonstros = document.querySelector("#resultado-monstros");
let ultimaLiveSincronizada = null;
let varianteChefe = "principal";
let simularFrenesiGruk = false;

function calcularEscalaOnda(zona, onda, numJogadores, multHpInimigos) {
  const z = Math.max(1, Math.min(100, Math.trunc(Number(zona)) || 1));
  const w = Math.max(1, Math.min(10, Math.trunc(Number(onda)) || 1));
  const party = Math.max(1, Math.min(500, Math.trunc(Number(numJogadores)) || 1));
  const n = (z - 1) * 10 + w;

  const tp = (x) => Math.pow(1.105, x - 1);
  const ap = (x) => Math.pow(1.075, x - 1);
  const iw = (x) => (x <= 70 ? tp(x) : tp(70) * Math.pow(1.085, x - 70)) * (x >= 100 ? 0.8 : 1);
  const bw = (x) => (x <= 70 ? ap(x) : ap(70) * Math.pow(1.055, x - 70)) * (x >= 100 ? 0.85 : 1);

  const multParty = 1 + 0.025 * party;
  const defMult = 1 + (n - 1) * 0.35;

  function statsInimigo(kind) {
    const o = (kind === "boss" ? iw(n) : tp(n)) * multParty;
    const l = kind === "boss" ? bw(n) : ap(n);
    const base = kind === "skeleton"
      ? { hp: 30, atk: 5, def: 1, aspd: 0.8 }
      : kind === "goblin"
        ? { hp: 20, atk: 4.5, def: 0.5, aspd: 0.7 }
        : { hp: 360, atk: 9.5, def: 3, aspd: 0.5 };

    const xpGoldMult = kind === "boss" ? 12 : kind === "goblin" ? 1.2 : 1;
    const exp = Math.round((6 + 2 * n) * xpGoldMult);
    const gold = Math.round((2 + n) * xpGoldMult * (1 + Math.min(Math.max(0, n - 1), 99) / 99));

    return {
      hp: base.hp * o * multHpInimigos,
      atk: base.atk * l,
      def: base.def * defMult,
      aspd: base.aspd,
      exp,
      gold,
    };
  }

  const fatorHorda = 0.55 + 0.45 * Math.pow(party, 0.72);
  const qtdBase = Math.min(40, Math.max(2, Math.round((1.6 + n * 0.5) * fatorHorda)));
  const qtdMinions = w === 10 ? Math.max(2, Math.round(qtdBase * 0.5)) : qtdBase;
  const infoTema = catalogoTemasZona[(z - 1) % catalogoTemasZona.length];

  return {
    zona: z,
    onda: w,
    waveAbsoluta: n,
    party,
    multParty,
    temaNome: infoTema.nome,
    infoTema,
    temBoss: w === 10,
    qtdMinions,
    skeleton: statsInimigo("skeleton"),
    goblin: statsInimigo("goblin"),
    boss: statsInimigo("boss"),
  };
}

function obterHeroiBaseParaDuelo() {
  const origem = selectMonstroOrigem?.value || "perfil";
  if (origem === "simulador" || !perfilCarregadoP1) {
    const st = calcularStatusSimulados(simulacao.estadoSimulador.cls, simulacao.estadoSimulador.level, simulacao.estadoSimulador.atributos, simulacao.estadoSimulador.itens);
    const met = calcularMetricasCombate(simulacao.estadoSimulador.cls, simulacao.estadoSimulador.level, st, simulacao.estadoSimulador.itens);
    return {
      origemLabel: origem === "simulador" ? "Build do Simulador" : "Build Padrão do Simulador (nenhum jogador pesquisado)",
      cls: simulacao.estadoSimulador.cls,
      level: simulacao.estadoSimulador.level,
      status: st,
      itens: simulacao.estadoSimulador.itens,
      metricas: met,
    };
  }
  const st = perfilCarregadoP1.stats;
  const met = calcularMetricasCombate(perfilCarregadoP1.cls, perfilCarregadoP1.level, st, perfilCarregadoP1.equipped || []);
  return {
    origemLabel: `${perfilCarregadoP1.displayName || perfilCarregadoP1.login} (${nomesClasses[perfilCarregadoP1.cls]} Nv.${perfilCarregadoP1.level})`,
    cls: perfilCarregadoP1.cls,
    level: perfilCarregadoP1.level,
    status: st,
    itens: perfilCarregadoP1.equipped,
    metricas: met,
  };
}

function renderizarSimuladorMonstros() {
  if (!containerResultadoMonstros) return;
  const catalogoLacaiosAberto = containerResultadoMonstros.querySelector(".catalogo-lacaios-detalhes")?.open;
  const zona = inputMonstroZona?.value || 17;
  const onda = inputMonstroOnda?.value || 10;
  const jogadores = inputMonstroJogadores?.value || 25;

  const tetoDanoInimigos = Math.min(100, Math.max(5, Number(inputTetoDanoInimigos?.value || inputTetoDanoInimigos?.defaultValue || 66))) / 100;
  const temTetoDanoInimigos = tetoDanoInimigos < 1;
  const multHpInimigos = Math.max(1, Number(inputMonstroHp?.value || 100)) / 100;
  const multDanoHeroi = Math.min(1000, Math.max(10, Number(inputMonstroDanoHeroi?.value || 100))) / 100;
  const esc = calcularEscalaOnda(zona, onda, jogadores, multHpInimigos);
  const heroi = obterHeroiBaseParaDuelo();
  const temaBase = esc.infoTema;
  const tema = temaBase.varianteAlternativa && varianteChefe === "alternativo"
    ? { ...temaBase, ...temaBase.varianteAlternativa, temFrenesiGruk: false }
    : temaBase;
  const frenesiGruk = Boolean(tema.temFrenesiGruk && simularFrenesiGruk);
  const variantesNaOnda = [...temaBase.lacaios, ...(temaBase.lacaiosInvocados ?? [])]
    .filter(({ escalaOnda, chefe }) =>
      escalaOnda && esc.onda >= escalaOnda.ondaMinima && (!chefe || esc.temBoss && tema.boss === chefe)
    )
    .map(({ nome, escalaOnda }) => {
      const base = esc[escalaOnda.base];
      return {
        nome,
        hp: Math.max(1, Math.round(base.hp * escalaOnda.multHp)),
        def: base.def * (escalaOnda.multDef ?? 1),
      };
    })
    .sort((a, b) => a.hp - b.hp);
  esc.boss.hp = Math.max(1, Math.round(esc.boss.hp * (tema.multHp || 1)));
  esc.skeleton.hp = Math.max(1, Math.round(esc.skeleton.hp));
  esc.goblin.hp = Math.max(1, Math.round(esc.goblin.hp));
  esc.boss.def *= tema.multDef || 1;
  esc.boss.atk *= (tema.multAtk || 1) * (frenesiGruk ? 1.25 : 1);
  esc.boss.aspd *= frenesiGruk ? 1.15 : 1;
  const fatorDefHeroi = 100 / (100 + heroi.status.def * 4);
  const tetoGolpeHeroi = Math.max(1, Math.ceil(heroi.status.maxHp * 0.6));

  const efeitoArma = heroi.metricas.analiseEfeitoArma;
  const singularidade = efeitoArma?.tipo === "singularity" ? efeitoArma : null;

  function calcularDanoSingularidade(hp, chefe = false) {
    if (!singularidade) return 0;
    const percentual = chefe ? singularidade.pctBossBase : singularidade.pctMobBase;
    return calcularDanoDiretoInimigo(hp * percentual, { hp, def: 0 }, tetoDanoInimigos).dano;
  }

  function calcularDueloInimigo(inimigo, multSkill = 1.25, chefe = false) {
    const fatorDefInimigo = 100 / (100 + inimigo.def * 4);
    const hitNormal = calcularFaixaGolpeInimigo(heroi.metricas.golpeNormalBruto * multDanoHeroi, inimigo, tetoDanoInimigos);
    const hitCrit = calcularFaixaGolpeInimigo(heroi.metricas.golpeCritBruto * multDanoHeroi, inimigo, tetoDanoInimigos);
    const { dpsCombateMedio } = calcularMetricasCombate(heroi.cls, heroi.level, heroi.status, heroi.itens, {
      inimigo,
      teto: tetoDanoInimigos,
      multDanoHeroi,
    });
    const danoSingularidade = calcularDanoSingularidade(inimigo.hp, chefe);
    const dpsSingularidade = singularidade
      ? danoSingularidade * (1 + singularidade.chanceEco) / singularidade.cada
      : 0;
    const dpsEstimado = dpsCombateMedio + dpsSingularidade;
    const ttk = inimigo.hp / dpsEstimado;

    // No código oficial: golpes físicos/skills diretas em heróis têm teto de 60% do HP máximo por acerto (hitCap = 0.6)
    const danoRecebidoSemTeto = Math.max(1, Math.round(inimigo.atk * fatorDefHeroi));
    const danoSkillSemTeto = Math.max(1, Math.round(inimigo.atk * multSkill * fatorDefHeroi));
    const danoRecebido = aplicarTetoGolpeHeroi(danoRecebidoSemTeto, heroi.status.maxHp, false);
    const danoSkillFisica = aplicarTetoGolpeHeroi(danoSkillSemTeto, heroi.status.maxHp, false);
    const bateuTetoBasico = danoRecebidoSemTeto >= tetoGolpeHeroi;
    const bateuTetoSkill = danoSkillSemTeto >= tetoGolpeHeroi;
    const golpesParaMorrer = Math.ceil(heroi.status.maxHp / danoRecebido);

    // No código oficial: hit(..., "bleed") IGNORA 100% da DEF e também IGNORA o teto de 60% HP!
    // applyBleed normal = 30% ATK/s por 4s (120% ATK total); forte (Assassino) = 50% ATK/s por 5.5s (275% ATK total)
    const bleedDpsNormal = Math.max(1, Math.round(inimigo.atk * 0.3));
    const bleedTotal4s = Math.max(1, Math.round(inimigo.atk * 1.2));

    return {
      hp: inimigo.hp,
      hitNormal,
      hitCrit,
      danoSingularidade,
      dpsEstimado,
      ttk,
      danoRecebido,
      danoRecebidoSemTeto,
      danoSkillFisica,
      danoSkillSemTeto,
      bateuTetoBasico,
      bateuTetoSkill,
      golpesParaMorrer,
      fatorDefInimigo,
      bleedDpsNormal,
      bleedTotal4s,
    };
  }

  const dBoss = calcularDueloInimigo(esc.boss, tema.skillBossMult, true);
  const dSkel = calcularDueloInimigo(esc.skeleton, 3.2);
  const dGob = calcularDueloInimigo(esc.goblin, 1.25);

  function formatarFaixa(min, max) {
    const primeiro = formatadorInteiro.format(min);
    return min === max ? primeiro : `${primeiro}–${formatadorInteiro.format(max)}`;
  }

  function renderizarDanoPorAcerto(duelo) {
    const { hp, hitNormal, hitCrit, danoSingularidade } = duelo;
    const acertosParaDerrotar = ({ minimo, maximo }) => formatarFaixa(Math.ceil(hp / maximo), Math.ceil(hp / minimo));
    const mostrarCredito = hitNormal.creditoMaximo < hitNormal.maximo || hitCrit.creditoMaximo < hitCrit.maximo;
    return `
        <div class="card-info-linha"><span>Seu ataque básico (com DEF)</span><strong style="color:var(--gold);">Normal: ${formatarFaixa(hitNormal.minimo, hitNormal.maximo)} · Crítico: ${formatarFaixa(hitCrit.minimo, hitCrit.maximo)} <small class="muted">(${heroi.status.crit.toFixed(0)}%)</small></strong></div>
        <div class="card-info-linha"><span>Ataques básicos para derrotar</span><strong>Normais: ${acertosParaDerrotar(hitNormal)} · Críticos: ${acertosParaDerrotar(hitCrit)}</strong></div>
        ${mostrarCredito ? `<div class="card-info-linha"><span>Placar (alvo com vida cheia)</span><strong>Normal: ${formatarFaixa(hitNormal.creditoMinimo, hitNormal.creditoMaximo)} · Crítico: ${formatarFaixa(hitCrit.creditoMinimo, hitCrit.creditoMaximo)}</strong></div>` : ""}
        ${temTetoDanoInimigos ? `<div class="card-info-linha"><span>Teto de dano por acerto</span><strong>${formatadorInteiro.format(hitNormal.limite)}</strong></div>` : ""}
        ${singularidade ? `<div class="card-info-linha"><span>Singularidade (sem DEF)</span><strong style="color:var(--cyan);">${formatadorInteiro.format(danoSingularidade)} por implosão · ${singularidade.cada}s de recarga${singularidade.chanceEco ? " · 20% de chance de eco" : ""}</strong></div>` : ""}
    `;
  }

  const formatarTtk = (duelo) => {
    if (!Number.isFinite(duelo.ttk)) return "—";
    return duelo.ttk < 1 ? "&lt; 1s" : `${formatadorDecimal1.format(duelo.ttk)}s`;
  };

  // Cálculo do combo real (Hit físico da skill + golpes em sequência + DoT verdadeiro em ticks de 0,5s)
  const nomeSkillDot = tema.skillDotNome || "Skill c/ DoT";
  const multSkillDot = tema.skillDotMult ?? tema.skillBossMult;
  const duracaoDotSeg = tema.duracaoDotSeg || 4;
  const golpeExtraCfg = tema.skillDotGolpeExtra || null;
  const calcularHitDireto = (atkBase, mult, fatorVariacao = 1) =>
    aplicarTetoGolpeHeroi(Math.max(1, Math.round(atkBase * mult * fatorDefHeroi * fatorVariacao)), heroi.status.maxHp, false);

  function simularComboDotChefe(atkChefe) {
    if (!tema.temBleedBoss) return null;
    const dotPorSeg = Math.round(atkChefe * (tema.fatorDotVerdadeiroPorSeg || 0.3));
    const golpeExtraMedio = golpeExtraCfg ? calcularHitDireto(atkChefe, golpeExtraCfg.mult, 1) : 0;
    return calcularImpactoComboSkillDot({
      maxHp: heroi.status.maxHp,
      danoFisicoCombo: calcularHitDireto(atkChefe, multSkillDot, 1),
      danoFisicoComboMin: calcularHitDireto(atkChefe, multSkillDot, 0.9),
      danoFisicoComboMax: calcularHitDireto(atkChefe, multSkillDot, 1.1 * 1.75),
      dotPorSeg,
      duracaoSeg: duracaoDotSeg,
      golpeExtraAntesDot: golpeExtraCfg?.momento === "antes_dot" ? golpeExtraMedio : 0,
      atrasoAntesDotSeg: golpeExtraCfg?.momento === "antes_dot" ? golpeExtraCfg.atrasoSeg : 0,
      golpeExtraFimDot: golpeExtraCfg?.momento === "fim_dot" ? golpeExtraMedio : 0,
      primeiroTickImediato: tema.primeiroTickImediato || false,
    });
  }

  const comboDot = simularComboDotChefe(esc.boss.atk);
  const atkLadino = esc.skeleton.atk * 1.4;
  const bleedLadinoNormalPorSeg = Math.max(1, Math.round(atkLadino * 0.3));
  const bleedLadinoSuper5s = Math.max(1, Math.round(atkLadino * 0.5 * 5.5)); // 275% ATK do Ladino (+40% ATK) ignorando DEF
  const pocaSapoBoiPorSeg = Math.max(1, Math.round(esc.goblin.atk * 0.95 * 0.7)); // 70% ATK/s do Sapo-Boi (-5% ATK) por 5s ignorando DEF
  const vaporCaldeireiroTick = Math.max(1, Math.round(esc.skeleton.atk * 0.95 * 0.25)); // 25% ATK do Caldeireiro (-5% ATK) a cada 0,5s por 4,5s ignorando DEF e teto 60%

  // Tabela de Fúria (Rage a cada 15s: +10% ATK, +8% ASPD, -7% DEF, -5% HP máx, -8% CD da Skill)
  const ticksRage = [0, 15, 30, 45, 60, 75].map((seg) => {
    const nivelRage = seg / 15;
    const bossAtk = esc.boss.atk * Math.pow(1.1, nivelRage);
    const bossAspd = esc.boss.aspd * Math.pow(1.08, nivelRage);
    const bossDef = esc.boss.def * Math.pow(0.93, nivelRage);
    const cdSkillRage = tema.cdSkillBoss * Math.pow(0.92, nivelRage);
    const danoBasicoSemTeto = Math.max(1, Math.round(bossAtk * fatorDefHeroi));
    const danoSkillSemTeto = Math.max(1, Math.round(bossAtk * tema.skillBossMult * fatorDefHeroi));
    const danoHitBasico = aplicarTetoGolpeHeroi(danoBasicoSemTeto, heroi.status.maxHp, false);
    const danoHitSkill = aplicarTetoGolpeHeroi(danoSkillSemTeto, heroi.status.maxHp, false);
    const noTetoSkill = danoSkillSemTeto >= tetoGolpeHeroi;
    const hitsBasicosParaCair = Math.ceil(heroi.status.maxHp / danoHitBasico);
    const skillsParaCair = Math.ceil(heroi.status.maxHp / danoHitSkill);
    const comboRage = simularComboDotChefe(bossAtk);

    let sobreviveTxt;
    if (comboRage?.letalNoCombo) {
      const tempoFmt = formatadorDecimal1.format(comboRage.tempoParaMorrerSeg);
      sobreviveTxt = comboRage.causaQueda === "golpe_final"
        ? `Cai em ${tempoFmt}s (na expulsão após ${nomeSkillDot})`
        : comboRage.causaQueda === "segundo_golpe"
          ? `Cai em ${tempoFmt}s (no 2º golpe de ${nomeSkillDot})`
          : comboRage.ticksParaMorrer <= 1 && comboRage.atrasoDot === 0
            ? `Quase instantâneo (${tempoFmt}s · 1º tick após ${nomeSkillDot})`
            : `Cai em ${tempoFmt}s (${comboRage.ticksParaMorrer} ticks após ${nomeSkillDot})`;
    } else if (noTetoSkill) {
      sobreviveTxt = `Teto 60% HP (${skillsParaCair} skills / ${hitsBasicosParaCair} hits p/ cair)`;
    } else if (comboRage) {
      sobreviveTxt = `${nomeSkillDot} tira ${comboRage.pctHpCombo.toFixed(0)}% HP (Físico: ${hitsBasicosParaCair} hits)`;
    } else {
      sobreviveTxt = `Aguenta ${skillsParaCair} skills (${hitsBasicosParaCair} hits)`;
    }

    const corSobrevive =
      comboRage?.letalNoCombo || danoBasicoSemTeto >= tetoGolpeHeroi
        ? "#ff8a9b"
        : noTetoSkill || (comboRage && comboRage.pctHpCombo >= 50)
          ? "var(--gold)"
          : "var(--green)";

    return `
      <tr>
        <th scope="row">${seg}s (Fúria ${nivelRage})</th>
        <td>${formatarNumeroCompacto(bossAtk)}</td>
        <td>${bossAspd.toFixed(2)}/s · Skill ${cdSkillRage.toFixed(1)}s</td>
        <td>${formatadorDecimal1.format(bossDef)}</td>
        <td>${formatarNumeroCompacto(danoHitBasico)} (${escaparHtml(tema.skillBossNome || "Skill")}: ${formatarNumeroCompacto(danoHitSkill)}${noTetoSkill ? " · teto" : ""})</td>
        <td style="color:#ff9aa8;font-weight:700;">${comboRage ? `${formatarNumeroCompacto(comboRage.danoDotTotal)} (${formatarNumeroCompacto(comboRage.danoPorTick)}/0,5s)` : "Sem DoT na projeção"}</td>
        <td style="color:${corSobrevive};">${sobreviveTxt}</td>
      </tr>
    `;
  }).join("");

  const bleedLetalNoBoss = Boolean(comboDot?.letalNoCombo);
  const tempoComboFmt = comboDot?.tempoParaMorrerSeg != null ? formatadorDecimal1.format(comboDot.tempoParaMorrerSeg) : "—";
  const tempoPrimeiroTick = comboDot?.tempoPrimeiroTickSeg < 0.05
    ? "quase imediato"
    : `em cerca de ${formatadorDecimal1.format(comboDot?.tempoPrimeiroTickSeg)} s`;
  const resultadoVidaCheia = bleedLetalNoBoss
    ? {
      impacto: "Cai no impacto",
      segundo_golpe: `Cai no segundo golpe, aos ${tempoComboFmt} s`,
      golpe_final: `Cai na expulsão, aos ${tempoComboFmt} s`,
      dot: comboDot.tempoParaMorrerSeg < 0.05 ? "Cai quase na hora" : `Cai em cerca de ${tempoComboFmt} s`,
    }[comboDot.causaQueda]
    : comboDot ? `Sobrevive com ${formatarNumeroCompacto(comboDot.hpAposCombo)} HP` : "";
  const skillDireta = escaparHtml(tema.skillBossNome || `Skill (${tema.skillBossMult}×)`);
  const classeVeredito =
    bleedLetalNoBoss || dBoss.bateuTetoBasico
      ? "perigo"
      : dBoss.bateuTetoSkill || dBoss.golpesParaMorrer <= 5 || (comboDot && comboDot.pctHpCombo >= 50)
        ? "alerta"
        : "";

  let textoVeredito;
  if (bleedLetalNoBoss) {
    const detalheVelocidade =
      comboDot.causaQueda === "golpe_final"
        ? `derrubando você aos ${tempoComboFmt}s (na expulsão após ${nomeSkillDot}, sem cura/escudo)`
        : comboDot.causaQueda === "segundo_golpe"
          ? `derrubando você aos ${tempoComboFmt}s (no 2º golpe de ${nomeSkillDot}, sem cura/escudo)`
          : comboDot.ticksParaMorrer <= 1 && comboDot.atrasoDot === 0
            ? `derrubando você em ${tempoComboFmt}s (já no 1º tick — quase instantâneo sem cura/escudo)`
            : `derrubando você em ${tempoComboFmt}s (${comboDot.ticksParaMorrer} ticks de 0,5s sem cura/escudo)`;
    textoVeredito = `💀 Combo letal (${nomeSkillDot} · ${tema.boss}): O impacto inicial tira ${formatarNumeroCompacto(comboDot.hitInicial)} (c/ DEF) e o DoT verdadeiro ignora 100% da DEF e o teto de 60% HP (${formatarNumeroCompacto(comboDot.danoPorTick)} a cada 0,5s = ${formatarNumeroCompacto(comboDot.danoDotTotal)} em ${duracaoDotSeg}s), ${detalheVelocidade}.`;
  } else if (dBoss.bateuTetoBasico || dBoss.bateuTetoSkill) {
    textoVeredito = `⚠️ Teto Físico de 60% HP (${tema.boss}): O dano físico mitigado alcança o teto de proteção do jogo (${formatarNumeroCompacto(tetoGolpeHeroi)} por acerto = 60% da sua vida máxima, mínimo de 2 hits para cair de vida cheia). Cuidado com golpes seguidos${comboDot ? ` e com ${nomeSkillDot} (${formatarNumeroCompacto(comboDot.danoPorTick)}/0,5s s/ DEF, ignorando esse teto)` : ""}!`;
  } else if (comboDot) {
    textoVeredito = `⚠️ Atenção ao ${nomeSkillDot} (${tema.boss}): Hit inicial (${formatarNumeroCompacto(comboDot.hitInicial)}) + DoT verdadeiro (${formatarNumeroCompacto(comboDot.danoDotTotal)} em ${duracaoDotSeg}s, ignorando DEF) tiram ${comboDot.pctHpCombo.toFixed(0)}% do seu HP (${formatarNumeroCompacto(comboDot.danoTotalCombo)} no total). Você sobrevive se tiver cura ou escudo!`;
  } else {
    textoVeredito = `✅ Duelo na Zona ${esc.zona} (${tema.boss}): Você aguenta ${dBoss.golpesParaMorrer} golpes físicos do Chefe.`;
  }

  const zonasAtalho = [9, 12, 16, 17, 18, 20, 22, 27];
  const outroChefeNome = temaBase.varianteAlternativa
    ? (varianteChefe === "alternativo" ? temaBase.boss : temaBase.varianteAlternativa.boss)
    : "";
  const avisoLive = ultimaLiveSincronizada
    ? `<p class="note-compacto" id="aviso-monstro-live-sync" style="margin-bottom:8px;">📡 Live sincronizada: <strong>${escaparHtml(ultimaLiveSincronizada.nome)}</strong>${ultimaLiveSincronizada.potencialOndas > 0 ? ` · Potencial médio: <strong>${formatarZonaOndaDeOndas(ultimaLiveSincronizada.potencialOndas)}</strong> (${formatadorInteiro.format(ultimaLiveSincronizada.potencialOndas)} ondas)` : " · Potencial ainda sem runs fechadas"}${ultimaLiveSincronizada.bestZone ? ` · Recorde: Z${ultimaLiveSincronizada.bestZone}-W${ultimaLiveSincronizada.bestWave || 1}` : ""}</p>`
    : "";

  containerResultadoMonstros.innerHTML = `
    ${avisoLive}
    ${temaBase.varianteAlternativa ? `
      <div class="barra-atalhos controles-variante-chefe">
        <div class="controles-variante-cabecalho">
          <span class="badge-variante-chefe">⚔️ 2 chefes possíveis (50% / 50%)</span>
          <button type="button" class="btn-trocar-variante" data-trocar-variante-chefe>
            ⇄ Ver ${escaparHtml(outroChefeNome)}
          </button>
        </div>
        <div class="controles-variante-campos">
          <label>Chefe simulado
            <select id="select-variante-chefe">
              <option value="principal" ${varianteChefe === "principal" ? "selected" : ""}>${escaparHtml(temaBase.boss)} (50%)</option>
              <option value="alternativo" ${varianteChefe === "alternativo" ? "selected" : ""}>${escaparHtml(temaBase.varianteAlternativa.boss)} (50%)</option>
            </select>
          </label>
          ${tema.temFrenesiGruk ? `<label class="check-frenesi-gruk"><input id="input-frenesi-gruk" type="checkbox" ${simularFrenesiGruk ? "checked" : ""}> Simular frenesi do Gruk (50% de vida)</label>` : ""}
        </div>
        ${temaBase.notaVariante ? `<p class="small muted controles-variante-nota">${escaparHtml(temaBase.notaVariante)}</p>` : ""}
      </div>` : ""}
    <div class="barra-atalhos">
      <span class="rotulo-atalho">🎯 Zonas Rápidas:</span>
      ${zonasAtalho
        .map(
          (z) => `
        <button type="button" class="btn-mini ${esc.zona === z ? "ativo" : ""}" data-atalho-zona="${z}">
          Zona ${z}
        </button>
      `
        )
        .join("")}
      <span class="rotulo-atalho" style="margin-left:8px;">🌊 Onda:</span>
      <button type="button" class="btn-mini ${esc.onda === 1 ? "ativo" : ""}" data-atalho-onda="1">Onda 1 (Mobs)</button>
      <button type="button" class="btn-mini ${esc.onda === 10 ? "ativo" : ""}" data-atalho-onda="10">Onda 10 (CHEFE)</button>
    </div>

    <div class="veredito-duelo ${classeVeredito}">
      <span>${textoVeredito}</span>
      <span class="small" style="color:var(--cyan);">Herói: <strong>${escaparHtml(heroi.origemLabel)}</strong> (${formatarNumeroCompacto(heroi.status.maxHp)} HP)</span>
    </div>

    <div class="grade-tres-indicadores-boss">
      <div class="card-indicador-boss">
        <span class="subtitulo-indicador">DPS estimado contra o chefe ${Explicacoes.criarBadgeOrigemHtml("estimado")}</span>
        <strong class="valor-indicador">${formatarNumeroCompacto(dBoss.dpsEstimado)}/s</strong>
        <span class="nota-indicador">Considera 1 alvo, com DEF de ${formatadorDecimal1.format(esc.boss.def)}${temTetoDanoInimigos ? ` e teto de ${Math.round(tetoDanoInimigos * 100)}% do HP por acerto` : ""}.${singularidade ? " Inclui Singularidade." : ""}${heroi.metricas.presaIxtharra ? " Usa DPS base (sem o veneno e o bônus condicional da Presa)." : ""}</span>
      </div>
      <div class="card-indicador-boss">
        <span class="subtitulo-indicador">Tempo estimado para derrotar (TTK) ${Explicacoes.criarBadgeOrigemHtml("estimado")}</span>
        <strong class="valor-indicador" style="color:var(--gold);">${formatarTtk(dBoss)}</strong>
        <span class="nota-indicador">Em combate individual contínuo, com todos os ataques acertando.${heroi.cls === "warrior" ? " O Golpe Giratório exige dois inimigos próximos." : ""}${tema.notaDpsBoss ? ` ${escaparHtml(tema.notaDpsBoss)}` : ""}</span>
      </div>
      <div class="card-indicador-boss">
        <span class="subtitulo-indicador">Principal risco modelado ${Explicacoes.criarBadgeOrigemHtml("calculado")}</span>
        <strong class="valor-indicador" style="color:${bleedLetalNoBoss || dBoss.bateuTetoBasico ? '#ff8a9b' : dBoss.bateuTetoSkill ? 'var(--gold)' : 'var(--green)'};">
          ${bleedLetalNoBoss ? `${escaparHtml(nomeSkillDot)} (${tempoComboFmt}s)` : dBoss.bateuTetoBasico || dBoss.bateuTetoSkill ? "Teto físico (2 hits)" : `${dBoss.golpesParaMorrer} golpes físicos`}
        </strong>
        <span class="nota-indicador">${bleedLetalNoBoss ? "Ignora DEF e o teto de 60% HP" : dBoss.bateuTetoBasico || dBoss.bateuTetoSkill ? "Jogo limita hit físico a 60% HP" : "Estimativa contra golpes diretos"}</span>
      </div>
    </div>

    <div class="card-info" style="border-color: rgba(240, 180, 41, 0.35);">
      <h4>🔥 Habilidades Reais do Chefe &amp; Mecânicas Letais — Zona ${esc.zona}: ${escaparHtml(tema.nome)}</h4>
      <div class="card-info-linha"><span>Chefe (${escaparHtml(tema.boss)})</span><strong>CD Base: ${tema.cdSkillBoss}s (-8% CD a cada 15s de Fúria)</strong></div>
      <p class="small" style="margin:2px 0 6px;color:var(--text);">${escaparHtml(tema.resumoSkillBoss)}</p>
      <div class="card-info-linha"><span>Por que morremos mesmo com DEF alta?</span><strong style="color:#ff8a9b;">Sangramento / Poça / Aura = DANO VERDADEIRO (Ignora 100% da DEF)</strong></div>
      <section class="catalogo-lacaios" aria-labelledby="titulo-lacaios-zona">
        <details class="catalogo-lacaios-detalhes" ${catalogoLacaiosAberto ? "open" : ""}>
          <summary class="catalogo-lacaios-topo">
            <span id="titulo-lacaios-zona" class="catalogo-lacaios-titulo">Monstros da zona</span>
            <span class="catalogo-lacaios-contagem">${temaBase.lacaios.length} monstros${(() => {
              const comEfeito = temaBase.lacaios.filter((l) => Boolean(l.efeito)).length;
              return comEfeito > 0 ? ` · ${comEfeito} com efeitos` : "";
            })()}</span>
          </summary>
          <div class="catalogo-lacaios-conteudo">
            ${temaBase.mecanicaLacaios ? `<p class="catalogo-lacaios-mecanica">${escaparHtml(temaBase.mecanicaLacaios)}</p>` : ""}
            <p class="small muted">As recargas descritas são as do jogo em condições padrão. Um inimigo pode precisar esperar por um alvo válido ou pelo próximo ataque.</p>
            <dl class="lista-lacaios-zona">
              ${temaBase.lacaios.map(({ nome, tipo, descricao, pontos, efeito, tipoEfeito = "nenhum", destaque }) => {
                const listaPontos = Array.isArray(pontos) && pontos.length ? pontos : [descricao];
                const textoEfeito = efeito || "Nenhum (apenas dano direto).";
                return `
                <div class="card-lacaio card-lacaio--${escaparHtml(tipoEfeito)}">
                  <dt class="card-lacaio-topo">
                    <span class="card-lacaio-nome">${escaparHtml(nome)}</span>
                    <span class="card-lacaio-badges">
                      ${tipo ? `<span class="badge-lacaio-tipo">${escaparHtml(tipo)}</span>` : ""}
                      ${destaque ? `<span class="destaque-lacaio">${escaparHtml(destaque)}</span>` : ""}
                    </span>
                  </dt>
                  <dd class="card-lacaio-corpo">
                    <ul class="card-lacaio-pontos">
                      ${listaPontos.map((ponto) => `<li>${escaparHtml(ponto)}</li>`).join("")}
                      <li class="lacaio-efeito lacaio-efeito--${escaparHtml(tipoEfeito)}">
                        <strong>Efeito:</strong> ${escaparHtml(textoEfeito)}
                      </li>
                    </ul>
                  </dd>
                </div>`;
              }).join("")}
            </dl>
          </div>
        </details>
      </section>
    </div>

    <div class="aviso-vazio-perfil" style="border-left-color: var(--gold);">
      <span>
        <strong>Zona ${esc.zona} · Onda ${esc.onda}</strong> (Onda global #${esc.waveAbsoluta} · ${escaparHtml(esc.temaNome)}) ·
        <strong>${esc.party} heróis</strong> no início da onda = <strong>+${((esc.multParty - 1) * 100).toFixed(1).replace(".", ",")}% HP</strong> nos monstros (${esc.temBoss ? `1 Chefe + ${esc.qtdMinions} lacaios` : `${esc.qtdMinions} inimigos`}).
      </span>
    </div>

    ${variantesNaOnda.length ? `
      <section class="card-info" aria-labelledby="titulo-variantes-onda">
        <h4 id="titulo-variantes-onda">Vida dos lacaios nesta onda</h4>
        <p class="small muted">Os cards abaixo usam os atributos base do grupo. Aqui aparecem os lacaios que podem surgir na onda normal, já com seus ajustes. A Singularidade considera um alvo ao alcance, de vida cheia e sem escudo.</p>
        ${variantesNaOnda.map(({ nome, hp, def }) => {
          const dano = calcularDanoSingularidade(hp);
          const textoDano = singularidade
            ? ` · ${formatadorInteiro.format(dano)} por implosão da Singularidade${singularidade.chanceEco ? ` · ${formatadorInteiro.format(Math.min(hp, dano * 2))} com eco (20%)` : ""}`
            : "";
          return `<div class="card-info-linha"><span>${escaparHtml(nome)}</span><strong>${formatadorInteiro.format(hp)} HP · ${formatadorDecimal1.format(def)} DEF${textoDano}</strong></div>`;
        }).join("")}
      </section>` : ""}

    <div class="grade-monstros">
      <article class="card-monstro">
        <div class="card-monstro-topo">
          <h4>${escaparHtml(tema.melee)}</h4>
          <span class="small muted">Atributos base · ${formatadorInteiro.format(esc.skeleton.gold)}g · ${formatadorInteiro.format(esc.skeleton.exp)} XP</span>
        </div>
        <div class="card-info-linha"><span>HP / DEF base do grupo</span><strong>${formatarNumeroCompacto(esc.skeleton.hp)} / ${formatadorDecimal1.format(esc.skeleton.def)}</strong></div>
        <div class="card-info-linha"><span>ATK / ASPD</span><strong>${formatarNumeroCompacto(esc.skeleton.atk)} / ${esc.skeleton.aspd.toFixed(1)}/s</strong></div>
        ${renderizarDanoPorAcerto(dSkel)}
        <div class="card-info-linha"><span>Tempo estimado para derrotar (solo)</span><strong style="color:var(--gold);">${formatarTtk(dSkel)}</strong></div>
        <div class="card-info-linha"><span>Hit Físico em Você (c/ DEF)</span><strong>${formatarNumeroCompacto(dSkel.danoRecebido)} (${dSkel.golpesParaMorrer} hits para morrer)</strong></div>
        ${temaBase.mostrarBleedLadino && esc.onda >= 2 ? `
        <div class="card-info-linha"><span>Sangramento do Ladino (s/ DEF)</span><strong style="color:#ff8a9b;">${formatarNumeroCompacto(bleedLadinoNormalPorSeg)}/s (${formatarNumeroCompacto(bleedLadinoNormalPorSeg * 4)} em 4s)</strong></div>
        <div class="card-info-linha"><span class="small muted">Super do Ladino (3,2× + DoT)</span><span class="small" style="color:#ff9aa8;">${formatarNumeroCompacto(bleedLadinoSuper5s)} total em 5,5s</span></div>` : temaBase.mostrarVaporCaldeireiro ? `
        <div class="card-info-linha"><span>Vapor do Caldeireiro (s/ DEF)</span><strong style="color:#ff8a9b;">${formatarNumeroCompacto(vaporCaldeireiroTick)} a cada 0,5s (${formatarNumeroCompacto(vaporCaldeireiroTick * 2)}/s)</strong></div>
        <div class="card-info-linha"><span class="small muted">Nuvem 4,5s (ignora teto 60%)</span><span class="small" style="color:#ff9aa8;">${formatarNumeroCompacto(vaporCaldeireiroTick * 9)} total por nuvem</span></div>` : temaBase.destaqueMelee ? `
        <div class="card-info-linha"><span>${escaparHtml(temaBase.destaqueMelee.rotulo)}</span><strong class="small" style="color:var(--gold);">${escaparHtml(temaBase.destaqueMelee.texto)}</strong></div>` : ""}
      </article>

      <article class="card-monstro">
        <div class="card-monstro-topo">
          <h4>${escaparHtml(tema.ranged)}</h4>
          <span class="small muted">Atributos base · ${formatadorInteiro.format(esc.goblin.gold)}g · ${formatadorInteiro.format(esc.goblin.exp)} XP</span>
        </div>
        <div class="card-info-linha"><span>HP / DEF base do grupo</span><strong>${formatarNumeroCompacto(esc.goblin.hp)} / ${formatadorDecimal1.format(esc.goblin.def)}</strong></div>
        <div class="card-info-linha"><span>ATK / ASPD</span><strong>${formatarNumeroCompacto(esc.goblin.atk)} / ${esc.goblin.aspd.toFixed(1)}/s</strong></div>
        ${renderizarDanoPorAcerto(dGob)}
        <div class="card-info-linha"><span>Tempo estimado para derrotar (solo)</span><strong style="color:var(--gold);">${formatarTtk(dGob)}</strong></div>
        <div class="card-info-linha"><span>Hit Físico em Você (c/ DEF)</span><strong>${formatarNumeroCompacto(dGob.danoRecebido)} (${dGob.golpesParaMorrer} hits para morrer)</strong></div>
        ${temaBase.mostrarPocaAcida && esc.onda >= 2 ? `
        <div class="card-info-linha"><span>Poça Ácida do Sapo-Boi (s/ DEF)</span><strong style="color:#ff8a9b;">${formatarNumeroCompacto(pocaSapoBoiPorSeg)}/s por 5s (se pisar)</strong></div>` : temaBase.destaqueRanged ? `
        <div class="card-info-linha"><span>${escaparHtml(temaBase.destaqueRanged.rotulo)}</span><strong class="small" style="color:var(--gold);">${escaparHtml(temaBase.destaqueRanged.texto)}</strong></div>` : ""}
      </article>

      <article class="card-monstro boss">
        <div class="card-monstro-topo">
          <h4>${escaparHtml(tema.boss.toUpperCase())} (Z${esc.zona})</h4>
          ${esc.temBoss ? "" : `<span class="small muted">Referência com a escala da onda selecionada. O chefe aparece na onda 10.</span>`}
          <span class="small" style="color:var(--gold);">${formatadorInteiro.format(esc.boss.gold)}g · ${formatadorInteiro.format(esc.boss.exp)} XP</span>
        </div>
        ${temaBase.varianteAlternativa ? `
          <div class="banner-outro-chefe">
            <span>50% de chance nesta zona</span>
            <button type="button" class="btn-trocar-variante" data-trocar-variante-chefe>
              ⇄ Alternar para ${escaparHtml(outroChefeNome)} (50%)
            </button>
          </div>` : ""}
        <div class="card-info-linha"><span>HP Total (+${((esc.multParty - 1) * 100).toFixed(0)}% Party)</span><strong>${formatarNumeroCompacto(esc.boss.hp)}</strong></div>
        <div class="card-info-linha"><span>ATK / DEF (Mitigação)</span><strong>${formatarNumeroCompacto(esc.boss.atk)} / ${formatadorDecimal1.format(esc.boss.def)} (-${((1 - dBoss.fatorDefInimigo) * 100).toFixed(1)}%)</strong></div>
        ${renderizarDanoPorAcerto(dBoss)}
        ${tema.tempera ? `
          <div class="card-info-linha"><span>Dano direto para quebrar a Têmpera</span><strong>${formatadorInteiro.format(Math.ceil(esc.boss.hp * tema.tempera.limiarHp))} antes da redução</strong></div>
          ${singularidade ? `<div class="card-info-linha"><span>Implosão durante a Têmpera</span><strong>${formatadorInteiro.format(Math.max(1, Math.round(dBoss.danoSingularidade * tema.tempera.multDano)))} de dano · conta ${formatadorInteiro.format(dBoss.danoSingularidade)} para quebrar</strong></div>` : ""}
        ` : ""}
        ${tema.auraProximidade ? `<div class="card-info-linha"><span>${escaparHtml(tema.auraProximidade.nome)} (ao se aproximar)</span><strong>${formatarNumeroCompacto(Math.round(esc.boss.atk * tema.auraProximidade.fatorTick))} a cada ${formatadorDecimal1.format(tema.auraProximidade.intervaloSeg)} s, sem DEF</strong></div>` : ""}
        <div class="card-info-linha"><span>Golpes diretos (com DEF)</span><strong>Básico: ${formatarNumeroCompacto(dBoss.danoRecebido)}${dBoss.bateuTetoBasico ? " (teto 60%)" : ""} · ${skillDireta}: ${formatarNumeroCompacto(dBoss.danoSkillFisica)}${dBoss.bateuTetoSkill ? " (teto 60%)" : ""}</strong></div>
        ${comboDot ? `
          <section class="resumo-sobrevivencia-chefe" aria-label="Risco da habilidade">
            <div class="card-info-linha">
              <span>${escaparHtml(nomeSkillDot)}</span>
              <strong>${formatarNumeroCompacto(comboDot.danoPorTick)} a cada 0,5 s <small class="muted">(ignora DEF e teto de 60% HP)</small></strong>
            </div>
            <div class="card-info-linha">
              <span>Começando com vida cheia</span>
              <strong class="${bleedLetalNoBoss ? "risco-letal" : ""}">${resultadoVidaCheia}</strong>
            </div>
            <div class="card-info-linha">
              <span>Pode cair no primeiro dano contínuo <small>(${tempoPrimeiroTick})</small></span>
              <strong class="risco-letal">Com até ~${formatarNumeroCompacto(Math.min(heroi.status.maxHp, comboDot.limiarPrimeiroTickMedio)).replace(/K$/, " mil")} HP (${comboDot.pctHpPrimeiroTickMedio.toFixed(0)}% da barra)</strong>
            </div>
            <p class="small muted">Estimativa sem cura, escudo ou outros ataques.</p>
            <details>
              <summary>Ver detalhes do dano</summary>
              <p>Impacto: ${formatarNumeroCompacto(comboDot.hitInicial)} de dano típico com DEF. Pode derrubar com ${formatarNumeroCompacto(comboDot.limiarImpactoMin)}–${formatarNumeroCompacto(comboDot.limiarImpactoMax)} HP, conforme a variação do golpe e o crítico.</p>
              ${comboDot.hitAntesDot ? `<p>Segundo golpe: ${formatarNumeroCompacto(comboDot.hitAntesDot)} com DEF, aos ${formatadorDecimal1.format(comboDot.atrasoDot)} s.</p>` : ""}
              <p>Dano contínuo: ${formatarNumeroCompacto(comboDot.danoPorTick)} a cada 0,5 s (ignora DEF e o teto de 60% HP). Até ${formatarNumeroCompacto(comboDot.danoDotTotal)} em ${duracaoDotSeg} s.</p>
              ${comboDot.hitFimDot ? `<p>Golpe final: ${formatarNumeroCompacto(comboDot.hitFimDot)} com DEF.</p>` : ""}
              <p>Total da habilidade: ${formatarNumeroCompacto(comboDot.danoTotalCombo)} de dano (${comboDot.pctHpCombo.toFixed(0)}% do HP máximo).</p>
            </details>
          </section>` : `<p class="small muted">A projeção considera golpes diretos. Consulte as habilidades e os efeitos dos lacaios acima.</p>`}
        ${tema.notaComboDot ? `<p class="small muted" style="margin:6px 0 0;">${escaparHtml(tema.notaComboDot)}</p>` : ""}
      </article>
    </div>

    <details class="detalhes-boss-furia" style="margin-top:12px;">
      <summary class="sumario-expansivel">⏱️ Ver projeção temporal e fúria do chefe (a cada 15s)</summary>
      <div class="table-wrap" style="margin-top:8px;">
        <table class="tabela-comp">
          <thead>
            <tr>
              <th scope="col">Tempo de Luta</th>
              <th scope="col">ATK (+10%)</th>
              <th scope="col">Vel. / CD Skill</th>
              <th scope="col">DEF (-7%)</th>
              <th scope="col">Hit Físico / Skill (c/ DEF)</th>
              <th scope="col">DoT em ${duracaoDotSeg}s (s/ DEF)</th>
              <th scope="col">Impacto Real em Você</th>
            </tr>
          </thead>
          <tbody>${ticksRage}</tbody>
        </table>
      </div>
    </details>
  `;

  containerResultadoMonstros.querySelector("#select-variante-chefe")?.addEventListener("change", (e) => {
    varianteChefe = e.target.value;
    renderizarSimuladorMonstros();
  });
  containerResultadoMonstros.querySelectorAll("[data-trocar-variante-chefe]").forEach((btn) => {
    btn.addEventListener("click", () => {
      varianteChefe = varianteChefe === "alternativo" ? "principal" : "alternativo";
      renderizarSimuladorMonstros();
    });
  });
  containerResultadoMonstros.querySelector("#input-frenesi-gruk")?.addEventListener("change", (e) => {
    simularFrenesiGruk = e.target.checked;
    renderizarSimuladorMonstros();
  });

  containerResultadoMonstros.querySelectorAll("[data-atalho-zona]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (inputMonstroZona) inputMonstroZona.value = btn.dataset.atalhoZona;
      renderizarSimuladorMonstros();
    });
  });

  containerResultadoMonstros.querySelectorAll("[data-atalho-onda]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (inputMonstroOnda) inputMonstroOnda.value = btn.dataset.atalhoOnda;
      renderizarSimuladorMonstros();
    });
  });
}

export function configurarChefes(parametros = new URLSearchParams(window.location.search)) {
  const camposCenario = {
    zona: inputMonstroZona,
    onda: inputMonstroOnda,
    herois: inputMonstroJogadores,
    cap: inputTetoDanoInimigos,
    hpInimigos: inputMonstroHp,
    danoHeroi: inputMonstroDanoHeroi,
    origem: selectMonstroOrigem,
  };
  if (parametros.get("aba") === "monstros") {
    for (const [chave, campo] of Object.entries(camposCenario)) {
      const valor = parametros.get(chave);
      if (!campo || !valor) continue;
      const anterior = campo.value;
      campo.value = valor;
      if (!campo.value || !campo.validity.valid) campo.value = anterior;
    }
    varianteChefe = parametros.get("chefe") === "alternativo" ? "alternativo" : "principal";
    simularFrenesiGruk = parametros.get("frenesi") === "1";
  }

  const botaoCopiar = document.querySelector("#btn-copiar-cenario-monstros");
  const statusCopia = document.querySelector("#status-copiar-cenario-monstros");
  const campoLink = document.querySelector("#campo-link-cenario-monstros");
  const inputLink = document.querySelector("#link-cenario-monstros");
  botaoCopiar?.addEventListener("click", async () => {
    if (!formMonstros.reportValidity()) return;
    botaoCopiar.disabled = true;
    campoLink.hidden = true;
    statusCopia.textContent = "";
    try {
      const url = new URL(window.location.href);
      url.hash = "";
      url.searchParams.set("aba", "monstros");
      for (const [chave, campo] of Object.entries(camposCenario)) {
        url.searchParams.set(chave, campo.value || campo.defaultValue);
      }
      url.searchParams.set("chefe", varianteChefe);
      url.searchParams.set("frenesi", simularFrenesiGruk ? "1" : "0");
      if (!perfilCarregadoP1 || selectMonstroOrigem.value === "simulador") {
        url.searchParams.set("origem", "simulador");
        url.hash = await Compartilhamento.serializarBuildParaHash(simulacao.estadoSimulador, null, "Build Compartilhada");
      }
      const copia = await Compartilhamento.copiarTextoComFallback(url.href);
      statusCopia.textContent = copia.sucesso ? "Link copiado." : "Selecione e copie o link abaixo.";
      if (!copia.sucesso) {
        inputLink.value = url.href;
        campoLink.hidden = false;
        inputLink.focus();
        inputLink.select();
      }
    } catch {
      statusCopia.textContent = "Não foi possível gerar o link da simulação.";
    } finally {
      botaoCopiar.disabled = false;
    }
  });

  Object.values(camposCenario).forEach((el) => {
    el?.addEventListener("input", renderizarSimuladorMonstros);
    el?.addEventListener("change", renderizarSimuladorMonstros);
  });

  if (formMonstros) {
    formMonstros.addEventListener("submit", (e) => {
      e.preventDefault();
      renderizarSimuladorMonstros();
    });
  }

  if (selectMonstroLiveSync) {
    selectMonstroLiveSync.addEventListener("change", async (e) => {
      const canal = e.target.value;
      if (!canal) {
        ultimaLiveSincronizada = null;
        return;
      }
      try {
        const info = await buscarJsonApi(`/api/ranking/channel/${encodeURIComponent(canal)}`, undefined, 7000);
        if (info.zone) inputMonstroZona.value = info.zone;
        if (info.wave) inputMonstroOnda.value = info.wave;
        if (info.playersNow) inputMonstroJogadores.value = info.playersNow;
        ultimaLiveSincronizada = {
          nome: info.displayName || info.login || canal,
          potencialOndas: Number(info.potentialWaves ?? info.potential) || 0,
          bestZone: Number(info.bestZone) || 0,
          bestWave: Number(info.bestWave) || 0,
        };
        renderizarSimuladorMonstros();
      } catch {
        // Ignora erro pontual de sincronia
      }
    });
  }
}

export {
  calcularImpactoComboSkillDot,
  inputMonstroJogadores,
  inputMonstroOnda,
  inputMonstroZona,
  renderizarSimuladorMonstros,
  selectMonstroLiveSync,
  selectMonstroOrigem,
};
