import { buscarJsonApi } from "./api.mjs";
import { Explicacoes } from "./bibliotecas.mjs";
import { calcularMetricasCombate, calcularStatusSimulados } from "./combate.mjs";
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
  const tema = esc.infoTema;
  const fatorDefHeroi = 100 / (100 + heroi.status.def * 4);

  function calcularDueloInimigo(inimigo, multSkill = 1.25) {
    const fatorDefInimigo = 100 / (100 + inimigo.def * 4);
    const hitNormal = Math.max(1, Math.round(heroi.metricas.golpeNormalBruto * fatorDefInimigo));
    const hitCrit = Math.max(1, Math.round(heroi.metricas.golpeCritBruto * fatorDefInimigo));
    const dpsRealContraAlvo = Math.max(1, heroi.metricas.dpsCombateMedio * fatorDefInimigo);
    const ttk = inimigo.hp / dpsRealContraAlvo;

    const danoRecebido = Math.max(1, Math.round(inimigo.atk * fatorDefHeroi));
    const danoSkillFisica = Math.max(1, Math.round(inimigo.atk * multSkill * fatorDefHeroi));
    const golpesParaMorrer = Math.ceil(heroi.status.maxHp / danoRecebido);

    // No código oficial: hit(..., "bleed") IGNORA 100% da DEF (Math.max(1, Math.round(s)))!
    // applyBleed normal = 30% ATK/s por 4s (120% ATK total); forte (Assassino) = 50% ATK/s por 5.5s (275% ATK total)
    const bleedDpsNormal = Math.max(1, Math.round(inimigo.atk * 0.3));
    const bleedTotal4s = Math.max(1, Math.round(inimigo.atk * 1.2));

    return {
      hitNormal,
      hitCrit,
      dpsRealContraAlvo,
      ttk,
      danoRecebido,
      danoSkillFisica,
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
    const danoHitBasico = Math.max(1, Math.round(bossAtk * fatorDefHeroi));
    const danoHitSkill = Math.max(1, Math.round(bossAtk * tema.skillBossMult * fatorDefHeroi));
    const danoBleed4sRage = Math.max(1, Math.round(bossAtk * 1.2)); // 30% ATK/s por 4s (Dano Verdadeiro sem DEF!)
    const pctHpBleed = (danoBleed4sRage / Math.max(1, heroi.status.maxHp)) * 100;

    let sobreviveTxt;
    if (danoHitSkill >= heroi.status.maxHp) {
      sobreviveTxt = "Hit-Kill Físico na Skill";
    } else if (tema.temBleedBoss && danoBleed4sRage >= heroi.status.maxHp) {
      const segsParaMorrerNoBleed = (heroi.status.maxHp / (bossAtk * 0.3)).toFixed(1);
      sobreviveTxt = `Letal no Sangramento (${segsParaMorrerNoBleed}s s/ cura)`;
    } else if (tema.temBleedBoss) {
      sobreviveTxt = `Bleed tira ${pctHpBleed.toFixed(0)}% HP (Físico: ${Math.floor(heroi.status.maxHp / danoHitBasico)} hits)`;
    } else {
      sobreviveTxt = `Aguenta ${Math.floor(heroi.status.maxHp / danoHitSkill)} skills (${Math.floor(heroi.status.maxHp / danoHitBasico)} hits)`;
    }

    const corSobrevive =
      danoHitSkill >= heroi.status.maxHp || (tema.temBleedBoss && danoBleed4sRage >= heroi.status.maxHp)
        ? "#ff8a9b"
        : tema.temBleedBoss && pctHpBleed >= 50
          ? "var(--gold)"
          : "var(--green)";

    return `
      <tr>
        <th scope="row">${seg}s (Fúria ${nivelRage})</th>
        <td>${formatarNumeroCompacto(bossAtk)}</td>
        <td>${bossAspd.toFixed(2)}/s · Skill ${cdSkillRage.toFixed(1)}s</td>
        <td>${formatadorDecimal1.format(bossDef)}</td>
        <td>${formatarNumeroCompacto(danoHitBasico)} (Skill: ${formatarNumeroCompacto(danoHitSkill)})</td>
        <td style="color:#ff9aa8;font-weight:700;">${tema.temBleedBoss ? `${formatarNumeroCompacto(danoBleed4sRage)} (${formatarNumeroCompacto(bossAtk * 0.3)}/s)` : "Sem Bleed no Boss"}</td>
        <td style="color:${corSobrevive};">${sobreviveTxt}</td>
      </tr>
    `;
  }).join("");

  const bleedLetalNoBoss = tema.temBleedBoss && dotBoss4s >= heroi.status.maxHp;
  const segsParaMorrerNoDoT = dotBossPorSeg > 0 ? (heroi.status.maxHp / dotBossPorSeg).toFixed(1) : "—";
  const classeVeredito =
    dBoss.golpesParaMorrer <= 1 || bleedLetalNoBoss
      ? "perigo"
      : dBoss.golpesParaMorrer <= 5 || (tema.temBleedBoss && dotBoss4s >= heroi.status.maxHp * 0.5)
        ? "alerta"
        : "";

  let textoVeredito;
  if (dBoss.golpesParaMorrer <= 1) {
    textoVeredito = `⚠️ Perigo Físico: O Chefe da Zona ${esc.zona} (${tema.boss}) aplica Hit-Kill físico no 1º golpe (${formatarNumeroCompacto(dBoss.danoRecebido)} dano vs ${formatarNumeroCompacto(heroi.status.maxHp)} HP).`;
  } else if (bleedLetalNoBoss) {
    textoVeredito = `💀 Sangramento contínuo (${tema.boss}): Sua defesa reduz os ataques físicos (${dBoss.golpesParaMorrer} golpes necessários para derrota), mas o sangramento da habilidade ignora 100% da defesa (${formatarNumeroCompacto(dotBossPorSeg)}/s de dano verdadeiro). Neste cenário, este sangramento consumiria sua vida em aproximadamente ${segsParaMorrerNoDoT} segundos, sem cura ou escudo.`;
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
        <strong class="valor-indicador" style="color:${dBoss.golpesParaMorrer <= 1 || bleedLetalNoBoss ? '#ff8a9b' : 'var(--green)'};">
          ${dBoss.golpesParaMorrer <= 1 ? "Hit-Kill físico" : bleedLetalNoBoss ? `Sangramento (~${segsParaMorrerNoDoT}s)` : `${dBoss.golpesParaMorrer} golpes físicos`}
        </strong>
        <span class="nota-indicador">${dBoss.golpesParaMorrer <= 1 ? "Ataque físico supera vida máxima" : bleedLetalNoBoss ? "Dano que ignora defesa" : "Sobrevivência estável"}</span>
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
        <div class="card-info-linha"><span>Dano Físico do Chefe (c/ DEF)</span><strong>Básico: ${formatarNumeroCompacto(dBoss.danoRecebido)} · Skill (${tema.skillBossMult}×): ${formatarNumeroCompacto(dBoss.danoSkillFisica)}</strong></div>
        <div class="card-info-linha"><span>Sangramento / DoT (Ignora DEF!)</span><strong style="color:${dotBoss4s >= heroi.status.maxHp ? "#ff7a90" : "var(--gold)"};">${tema.temBleedBoss ? `${formatarNumeroCompacto(dotBossPorSeg)}/s (${formatarNumeroCompacto(dotBoss4s)} em 4s = ${((dotBoss4s / heroi.status.maxHp) * 100).toFixed(0)}% do seu HP)` : "Sem Sangramento nesta zona"}</strong></div>
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
              <th scope="col">Sangramento 4s (Ignora DEF)</th>
              <th scope="col">Impacto Real em Você</th>
            </tr>
          </thead>
          <tbody>${ticksRage}</tbody>
        </table>
      </div>
    </details>
  `;

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
