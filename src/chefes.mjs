import { buscarJsonApi } from "./api.mjs";
import { Explicacoes } from "./bibliotecas.mjs";
import { aplicarTetoGolpeHeroi, calcularMetricasCombate, calcularStatusSimulados } from "./combate.mjs";
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
const selectMonstroOrigem = document.querySelector("#select-monstro-origem");
const selectMonstroLiveSync = document.querySelector("#select-monstro-live-sync");
const containerResultadoMonstros = document.querySelector("#resultado-monstros");
let ultimaLiveSincronizada = null;
let varianteChefe = "principal";
let simularFrenesiGruk = false;

function calcularEscalaOnda(zona, onda, numJogadores) {
  const z = Math.max(1, Math.min(100, Number(zona) || 1));
  const w = Math.max(1, Math.min(10, Number(onda) || 1));
  const party = Math.max(1, Math.min(500, Number(numJogadores) || 1));
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
      hp: Math.round(base.hp * o),
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
    metricas: met,
  };
}

function renderizarSimuladorMonstros() {
  if (!containerResultadoMonstros) return;
  const zona = inputMonstroZona?.value || 16;
  const onda = inputMonstroOnda?.value || 10;
  const jogadores = inputMonstroJogadores?.value || 25;

  const esc = calcularEscalaOnda(zona, onda, jogadores);
  const heroi = obterHeroiBaseParaDuelo();
  const temaBase = esc.infoTema;
  const tema = temaBase.varianteAlternativa && varianteChefe === "alternativo"
    ? { ...temaBase, ...temaBase.varianteAlternativa }
    : temaBase;
  const frenesiGruk = Boolean(temaBase.varianteAlternativa && varianteChefe === "principal" && simularFrenesiGruk);
  esc.boss.hp = Math.round(esc.boss.hp * (tema.multHp || 1));
  esc.boss.def *= tema.multDef || 1;
  esc.boss.atk *= (tema.multAtk || 1) * (frenesiGruk ? 1.25 : 1);
  esc.boss.aspd *= frenesiGruk ? 1.15 : 1;
  const fatorDefHeroi = 100 / (100 + heroi.status.def * 4);
  const tetoGolpeHeroi = Math.max(1, Math.ceil(heroi.status.maxHp * 0.6));

  function calcularDueloInimigo(inimigo, multSkill = 1.25) {
    const fatorDefInimigo = 100 / (100 + inimigo.def * 4);
    const hitNormal = Math.max(1, Math.round(heroi.metricas.golpeNormalBruto * fatorDefInimigo));
    const hitCrit = Math.max(1, Math.round(heroi.metricas.golpeCritBruto * fatorDefInimigo));
    const dpsFisico = heroi.metricas.dpsFisicoMedio ?? heroi.metricas.dpsCombateMedio;
    const dpsBleed = heroi.metricas.dpsBleedVerdadeiro || 0;
    const dpsRealContraAlvo = Math.max(1, dpsFisico * fatorDefInimigo + dpsBleed);
    const ttk = inimigo.hp / dpsRealContraAlvo;

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
      hitNormal,
      hitCrit,
      dpsRealContraAlvo,
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

  const dBoss = calcularDueloInimigo(esc.boss, tema.skillBossMult);
  const dSkel = calcularDueloInimigo(esc.skeleton, 3.2);
  const dGob = calcularDueloInimigo(esc.goblin, 1.25);

  const danoSingBoss = heroi.metricas.arma?.kind === "singblade"
    ? Math.round(esc.boss.hp * (heroi.metricas.analiseEfeitoArma?.pctBossEfetivo || 0.04))
    : 0;

  // Cálculo do Dano Verdadeiro real da Zona (Sangramento / Poça / Aura que IGNORA DEF no código do jogo)
  const dotBossPorSeg = tema.fatorDotVerdadeiroPorSeg > 0
    ? Math.round(esc.boss.atk * tema.fatorDotVerdadeiroPorSeg)
    : dBoss.bleedDpsNormal;
  const dotBoss4s = dotBossPorSeg * 4;
  const bleedAssassinoSkel5s = Math.round(esc.skeleton.atk * 0.5 * 5.5); // 275% ATK do Esqueleto ignorando DEF

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
    const dotPorSegRage = bossAtk * (tema.fatorDotVerdadeiroPorSeg || 0.3);
    const danoBleed4sRage = Math.max(1, Math.round(dotPorSegRage * 4));
    const pctHpBleed = (danoBleed4sRage / Math.max(1, heroi.status.maxHp)) * 100;

    let sobreviveTxt;
    if (tema.temBleedBoss && danoBleed4sRage >= heroi.status.maxHp) {
      const segsBruto = heroi.status.maxHp / dotPorSegRage;
      const segsParaMorrerNoBleed = segsBruto < 0.1 ? "<0,1" : segsBruto.toFixed(1);
      sobreviveTxt = `Letal no dano contínuo (${segsParaMorrerNoBleed}s s/ cura)`;
    } else if (noTetoSkill) {
      sobreviveTxt = `Teto 60% HP (${skillsParaCair} skills / ${hitsBasicosParaCair} hits p/ cair)`;
    } else if (tema.temBleedBoss) {
      sobreviveTxt = `DoT tira ${pctHpBleed.toFixed(0)}% HP (Físico: ${hitsBasicosParaCair} hits)`;
    } else {
      sobreviveTxt = `Aguenta ${skillsParaCair} skills (${hitsBasicosParaCair} hits)`;
    }

    const corSobrevive =
      (tema.temBleedBoss && danoBleed4sRage >= heroi.status.maxHp) || danoBasicoSemTeto >= tetoGolpeHeroi
        ? "#ff8a9b"
        : noTetoSkill || (tema.temBleedBoss && pctHpBleed >= 50)
          ? "var(--gold)"
          : "var(--green)";

    return `
      <tr>
        <th scope="row">${seg}s (Fúria ${nivelRage})</th>
        <td>${formatarNumeroCompacto(bossAtk)}</td>
        <td>${bossAspd.toFixed(2)}/s · Skill ${cdSkillRage.toFixed(1)}s</td>
        <td>${formatadorDecimal1.format(bossDef)}</td>
        <td>${formatarNumeroCompacto(danoHitBasico)} (Skill: ${formatarNumeroCompacto(danoHitSkill)}${noTetoSkill ? " · teto" : ""})</td>
        <td style="color:#ff9aa8;font-weight:700;">${tema.temBleedBoss ? `${formatarNumeroCompacto(danoBleed4sRage)} (${formatarNumeroCompacto(dotPorSegRage)}/s)` : "Sem DoT no Boss"}</td>
        <td style="color:${corSobrevive};">${sobreviveTxt}</td>
      </tr>
    `;
  }).join("");

  const bleedLetalNoBoss = tema.temBleedBoss && dotBoss4s >= heroi.status.maxHp;
  const segsDoTBruto = dotBossPorSeg > 0 ? heroi.status.maxHp / dotBossPorSeg : 0;
  const segsParaMorrerNoDoT = dotBossPorSeg > 0 ? (segsDoTBruto < 0.1 ? "<0,1" : segsDoTBruto.toFixed(1)) : "—";
  const classeVeredito =
    bleedLetalNoBoss || dBoss.bateuTetoBasico
      ? "perigo"
      : dBoss.bateuTetoSkill || dBoss.golpesParaMorrer <= 5 || (tema.temBleedBoss && dotBoss4s >= heroi.status.maxHp * 0.5)
        ? "alerta"
        : "";

  let textoVeredito;
  if (bleedLetalNoBoss) {
    textoVeredito = `💀 Sangramento contínuo (${tema.boss}): Golpes físicos respeitam sua defesa e o teto de 60% HP (${dBoss.golpesParaMorrer} golpes necessários para derrota), mas o sangramento da habilidade ignora 100% da defesa e também o teto (${formatarNumeroCompacto(dotBossPorSeg)}/s de dano verdadeiro), consumindo sua vida em ~${segsParaMorrerNoDoT}s sem cura ou escudo.`;
  } else if (dBoss.bateuTetoBasico || dBoss.bateuTetoSkill) {
    textoVeredito = `⚠️ Teto Físico de 60% HP (${tema.boss}): O dano físico mitigado alcança o teto de proteção do jogo (${formatarNumeroCompacto(tetoGolpeHeroi)} por acerto = 60% da sua vida máxima, mínimo de 2 hits para cair de vida cheia). Cuidado com golpes seguidos${tema.temBleedBoss ? ` e com o sangramento de ${formatarNumeroCompacto(dotBossPorSeg)}/s (que ignora esse teto)` : ""}!`;
  } else if (tema.temBleedBoss) {
    const pctDoTHp = ((dotBoss4s / heroi.status.maxHp) * 100).toFixed(0);
    textoVeredito = `⚠️ Atenção às Skills (${tema.boss}): O Sangramento da skill ignora 100% da sua DEF e causa ${formatarNumeroCompacto(dotBossPorSeg)}/s (${formatarNumeroCompacto(dotBoss4s)} em 4s = ${pctDoTHp}% do seu HP). Você sobrevive se tiver cura ou escudo!`;
  } else {
    textoVeredito = `✅ Duelo na Zona ${esc.zona} (${tema.boss}): Você aguenta ${dBoss.golpesParaMorrer} golpes físicos do Chefe. Seu tempo para derrubá-lo solo é ~${dBoss.ttk < 1 ? "<1" : dBoss.ttk.toFixed(1)}s (${formatarNumeroCompacto(dBoss.dpsRealContraAlvo)} DPS real líquido).`;
  }

  const zonasAtalho = [10, 13, 16, 18, 20, 22, 25];
  const avisoLive = ultimaLiveSincronizada
    ? `<p class="note-compacto" id="aviso-monstro-live-sync" style="margin-bottom:8px;">📡 Live sincronizada: <strong>${escaparHtml(ultimaLiveSincronizada.nome)}</strong>${ultimaLiveSincronizada.potencialOndas > 0 ? ` · Potencial médio: <strong>${formatarZonaOndaDeOndas(ultimaLiveSincronizada.potencialOndas)}</strong> (${formatadorInteiro.format(ultimaLiveSincronizada.potencialOndas)} ondas)` : " · Potencial ainda sem runs fechadas"}${ultimaLiveSincronizada.bestZone ? ` · Recorde: Z${ultimaLiveSincronizada.bestZone}-W${ultimaLiveSincronizada.bestWave || 1}` : ""}</p>`
    : "";

  containerResultadoMonstros.innerHTML = `
    ${avisoLive}
    ${temaBase.varianteAlternativa ? `
      <div class="barra-atalhos controles-variante-chefe">
        <label>Chefe da zona
          <select id="select-variante-chefe">
            <option value="principal" ${varianteChefe === "principal" ? "selected" : ""}>${escaparHtml(temaBase.boss)} (50%)</option>
            <option value="alternativo" ${varianteChefe === "alternativo" ? "selected" : ""}>${escaparHtml(temaBase.varianteAlternativa.boss)} (50%)</option>
          </select>
        </label>
        ${varianteChefe === "principal" ? `<label><input id="input-frenesi-gruk" type="checkbox" ${simularFrenesiGruk ? "checked" : ""}> Simular frenesi do Gruk (50% de vida)</label>` : ""}
        <p class="small muted">O tema se repete a cada 8 zonas, incluindo a 18-10. A comparação mostra os valores da fase escolhida; não simula a luta inteira. No Mímico, o dano contínuo só atinge o herói engolido e o escudo não entra no TTK.</p>
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
        <strong class="valor-indicador">${formatarNumeroCompacto(dBoss.dpsRealContraAlvo)}/s</strong>
        <span class="nota-indicador">Considerando defesa de ${formatadorDecimal1.format(esc.boss.def)}</span>
      </div>
      <div class="card-indicador-boss">
        <span class="subtitulo-indicador">Tempo estimado para derrotar (TTK) ${Explicacoes.criarBadgeOrigemHtml("estimado")}</span>
        <strong class="valor-indicador" style="color:var(--gold);">${dBoss.ttk < 1 ? "< 1s" : `${dBoss.ttk.toFixed(1)}s`}</strong>
        <span class="nota-indicador">Em combate individual contínuo</span>
      </div>
      <div class="card-indicador-boss">
        <span class="subtitulo-indicador">Principal risco modelado ${Explicacoes.criarBadgeOrigemHtml("calculado")}</span>
        <strong class="valor-indicador" style="color:${bleedLetalNoBoss || dBoss.bateuTetoBasico ? '#ff8a9b' : dBoss.bateuTetoSkill ? 'var(--gold)' : 'var(--green)'};">
          ${bleedLetalNoBoss ? `Dano contínuo (~${segsParaMorrerNoDoT}s)` : dBoss.bateuTetoBasico || dBoss.bateuTetoSkill ? "Teto físico (2 hits)" : `${dBoss.golpesParaMorrer} golpes físicos`}
        </strong>
        <span class="nota-indicador">${bleedLetalNoBoss ? "Ignora DEF e o teto de 60% HP" : dBoss.bateuTetoBasico || dBoss.bateuTetoSkill ? "Jogo limita hit físico a 60% HP" : "Sobrevivência estável"}</span>
      </div>
    </div>

    <div class="card-info" style="border-color: rgba(240, 180, 41, 0.35);">
      <h4>🔥 Habilidades Reais do Chefe &amp; Mecânicas Letais — Zona ${esc.zona}: ${escaparHtml(tema.nome)}</h4>
      <div class="card-info-linha"><span>Chefe (${escaparHtml(tema.boss)})</span><strong>CD Base: ${tema.cdSkillBoss}s (-8% CD a cada 15s de Fúria)</strong></div>
      <p class="small" style="margin:2px 0 6px;color:var(--text);">${escaparHtml(tema.resumoSkillBoss)}</p>
      <div class="card-info-linha"><span>Por que morremos mesmo com DEF alta?</span><strong style="color:#ff8a9b;">Sangramento / Poça / Aura = DANO VERDADEIRO (Ignora 100% da DEF)</strong></div>
      <p class="small muted" style="margin:2px 0 0;">${escaparHtml(tema.resumoLacaios)}</p>
    </div>

    <div class="aviso-vazio-perfil" style="border-left-color: var(--gold);">
      <span>
        <strong>Zona ${esc.zona} · Onda ${esc.onda}</strong> (Onda global #${esc.waveAbsoluta} · ${escaparHtml(esc.temaNome)}) ·
        <strong>${esc.party} jogadores</strong> na live = <strong>+${((esc.multParty - 1) * 100).toFixed(1).replace(".", ",")}% HP</strong> nos monstros (${esc.temBoss ? `1 Chefe + ${esc.qtdMinions} lacaios` : `${esc.qtdMinions} inimigos`}).
      </span>
    </div>

    <div class="grade-monstros">
      <article class="card-monstro">
        <div class="card-monstro-topo">
          <h4>${escaparHtml(tema.melee)}</h4>
          <span class="small muted">${formatadorInteiro.format(esc.skeleton.gold)}g · ${formatadorInteiro.format(esc.skeleton.exp)} XP</span>
        </div>
        <div class="card-info-linha"><span>HP / DEF</span><strong>${formatarNumeroCompacto(esc.skeleton.hp)} / ${formatadorDecimal1.format(esc.skeleton.def)}</strong></div>
        <div class="card-info-linha"><span>ATK / ASPD</span><strong>${formatarNumeroCompacto(esc.skeleton.atk)} / ${esc.skeleton.aspd.toFixed(1)}/s</strong></div>
        <div class="card-info-linha"><span>Seu Golpe no Lacaio</span><strong>Normal: ${formatarNumeroCompacto(dSkel.hitNormal)} · Crítico: ${formatarNumeroCompacto(dSkel.hitCrit)}</strong></div>
        <div class="card-info-linha"><span>Tempo para Matar (Solo)</span><strong style="color:var(--gold);">${dSkel.ttk < 1 ? "<1s" : `${dSkel.ttk.toFixed(1)}s`}</strong></div>
        <div class="card-info-linha"><span>Hit Físico em Você (c/ DEF)</span><strong>${formatarNumeroCompacto(dSkel.danoRecebido)} (${dSkel.golpesParaMorrer} hits para morrer)</strong></div>
        <div class="card-info-linha"><span>Sangramento de Mob (s/ DEF)</span><strong style="color:#ff8a9b;">${formatarNumeroCompacto(dSkel.bleedDpsNormal)}/s (${formatarNumeroCompacto(dSkel.bleedTotal4s)} em 4s)</strong></div>
        <div class="card-info-linha"><span class="small muted">Mobs Assassinos de Elite</span><span class="small" style="color:#ff9aa8;">${formatarNumeroCompacto(bleedAssassinoSkel5s)} total em 5,5s</span></div>
      </article>

      <article class="card-monstro">
        <div class="card-monstro-topo">
          <h4>${escaparHtml(tema.ranged)}</h4>
          <span class="small muted">${formatadorInteiro.format(esc.goblin.gold)}g · ${formatadorInteiro.format(esc.goblin.exp)} XP</span>
        </div>
        <div class="card-info-linha"><span>HP / DEF</span><strong>${formatarNumeroCompacto(esc.goblin.hp)} / ${formatadorDecimal1.format(esc.goblin.def)}</strong></div>
        <div class="card-info-linha"><span>ATK / ASPD</span><strong>${formatarNumeroCompacto(esc.goblin.atk)} / ${esc.goblin.aspd.toFixed(1)}/s</strong></div>
        <div class="card-info-linha"><span>Seu Golpe no Lacaio</span><strong>Normal: ${formatarNumeroCompacto(dGob.hitNormal)} · Crítico: ${formatarNumeroCompacto(dGob.hitCrit)}</strong></div>
        <div class="card-info-linha"><span>Tempo para Matar (Solo)</span><strong style="color:var(--gold);">${dGob.ttk < 1 ? "<1s" : `${dGob.ttk.toFixed(1)}s`}</strong></div>
        <div class="card-info-linha"><span>Hit Físico em Você (c/ DEF)</span><strong>${formatarNumeroCompacto(dGob.danoRecebido)} (${dGob.golpesParaMorrer} hits para morrer)</strong></div>
        <div class="card-info-linha"><span>Poça Ácida no Chão (s/ DEF)</span><strong style="color:#ff8a9b;">${formatarNumeroCompacto(esc.goblin.atk * 0.7)}/s (se pisar dentro)</strong></div>
      </article>

      <article class="card-monstro boss">
        <div class="card-monstro-topo">
          <h4>${escaparHtml(tema.boss.toUpperCase())} (Z${esc.zona})</h4>
          <span class="small" style="color:var(--gold);">${formatadorInteiro.format(esc.boss.gold)}g · ${formatadorInteiro.format(esc.boss.exp)} XP</span>
        </div>
        <div class="card-info-linha"><span>HP Total (+${((esc.multParty - 1) * 100).toFixed(0)}% Party)</span><strong>${formatarNumeroCompacto(esc.boss.hp)}</strong></div>
        <div class="card-info-linha"><span>ATK / DEF (Mitigação)</span><strong>${formatarNumeroCompacto(esc.boss.atk)} / ${formatadorDecimal1.format(esc.boss.def)} (-${((1 - dBoss.fatorDefInimigo) * 100).toFixed(1)}%)</strong></div>
        <div class="card-info-linha"><span>Seu Golpe no Chefe</span><strong style="color:var(--gold);">Normal: ${formatarNumeroCompacto(dBoss.hitNormal)} · Crítico: ${formatarNumeroCompacto(dBoss.hitCrit)} <small class="muted" style="font-weight:400;">(${heroi.status.crit.toFixed(0)}% chance)</small></strong></div>
        <div class="card-info-linha"><span>DPS Real / TTK Solo</span><strong>${formatarNumeroCompacto(dBoss.dpsRealContraAlvo)}/s · ${dBoss.ttk.toFixed(1)}s</strong></div>
        ${danoSingBoss > 0 ? `<div class="card-info-linha"><span>Dano médio da Singularidade</span><strong style="color:var(--cyan);">-${formatarNumeroCompacto(danoSingBoss)} HP / 13s</strong></div>` : ""}
        <div class="card-info-linha"><span>Dano Físico do Chefe (c/ DEF)</span><strong>Básico: ${formatarNumeroCompacto(dBoss.danoRecebido)}${dBoss.bateuTetoBasico ? " (teto 60%)" : ""} · Skill (${tema.skillBossMult}×): ${formatarNumeroCompacto(dBoss.danoSkillFisica)}${dBoss.bateuTetoSkill ? " (teto 60%)" : ""}</strong></div>
        <div class="card-info-linha"><span>Dano contínuo (ignora DEF)</span><strong style="color:${dotBoss4s >= heroi.status.maxHp ? "#ff7a90" : "var(--gold)"};">${tema.temBleedBoss ? `${formatarNumeroCompacto(dotBossPorSeg)}/s (${formatarNumeroCompacto(dotBoss4s)} em 4s = ${((dotBoss4s / heroi.status.maxHp) * 100).toFixed(0)}% do seu HP)` : "Sem dano contínuo do chefe"}</strong></div>
        <div class="card-info-linha"><span>Tempo para Morrer no DoT</span><strong style="color:${bleedLetalNoBoss ? "#ff7a90" : "var(--green)"};">${tema.temBleedBoss ? (bleedLetalNoBoss ? `⚠️ ~${segsParaMorrerNoDoT}s (sem cura ou escudo)` : `✅ Sobrevive com ${formatarNumeroCompacto(heroi.status.maxHp - dotBoss4s)} HP (se não levar dano físico adicional)`) : "Seguro (sem dano contínuo do Chefe)"}</strong></div>
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
              <th scope="col">Dano contínuo em 4s (ignora DEF)</th>
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

export function configurarChefes() {
  // Eventos da aba Monstros & Boss
  [inputMonstroZona, inputMonstroOnda, inputMonstroJogadores, selectMonstroOrigem].forEach((el) => {
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
  inputMonstroJogadores,
  inputMonstroOnda,
  inputMonstroZona,
  renderizarSimuladorMonstros,
  selectMonstroLiveSync,
  selectMonstroOrigem,
};
