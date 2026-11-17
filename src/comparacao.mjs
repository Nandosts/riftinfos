import { buscarRespostaPerfil, validarPerfilApi } from "./api.mjs";
import {
  agregarItens,
  calcularFc,
  calcularMetricasCombate,
  calcularStatusSimulados,
  inferirAtributosBase,
} from "./combate.mjs";
import {
  catalogoConjuntos,
  coresRaridade,
  dadosClasses,
  nomesClasses,
  nomesSlots,
} from "./dados.mjs";
import { escaparHtml, formatadorInteiro, formatarNumeroCompacto } from "./formato.mjs";
import { normalizarEntradaNick } from "./identidade.mjs";
import { top1DinamicoPorClasse, top1GeralDinamico } from "./panorama.mjs";
import { perfilCarregadoP1, plataformaCarregadaP1 } from "./perfil.mjs";

const formComparar = document.querySelector("#form-comparar");
const inputCompararNick = document.querySelector("#input-comparar-nick");
const selectCompararPlataforma = document.querySelector("#select-comparar-plataforma");
const btnCompararTop1 = document.querySelector("#btn-comparar-top1");
const btnCompararWarrior = document.querySelector("#btn-comparar-warrior");
const btnCompararCleric = document.querySelector("#btn-comparar-cleric");
const btnCompararArcher = document.querySelector("#btn-comparar-archer");
const statusComparacao = document.querySelector("#status-comparacao");
const resultadoComparacao = document.querySelector("#resultado-comparacao");
const compararP1Card = document.querySelector("#comparar-p1-card");

let requisicaoComparacaoAtiva;

export function limparComparacao() {
  requisicaoComparacaoAtiva?.abort();
  resultadoComparacao.hidden = true;
  delete statusComparacao.dataset.error;
  statusComparacao.textContent = "Escolha um segundo jogador para comparar os atributos.";
}

function atualizarCardP1Comparacao(perfil, plataforma) {
  if (!compararP1Card) return;
  const nome = perfil.displayName || perfil.login;
  const avatarHtml = perfil.avatar
    ? `<img class="p1-card-avatar" width="52" height="52" src="${escaparHtml(perfil.avatar)}" alt="${escaparHtml(nome)}">`
    : `<div class="p1-card-avatar-placeholder"></div>`;
  compararP1Card.innerHTML = `
    ${avatarHtml}
    <div class="p1-card-info">
      <span class="card-versus-tag-plat">${plataforma.toUpperCase()}</span>
      <div class="p1-card-nome">${escaparHtml(nome)}</div>
      <div class="p1-card-meta">${nomesClasses[perfil.cls] || perfil.cls} · Nv. ${formatadorInteiro.format(perfil.level)}</div>
      <div class="p1-card-fc">${formatadorInteiro.format(perfil.power || 0)} FC</div>
    </div>
  `;

  const loginP1Limpo = String(perfil.login || "").replace(/^kick:/i, "").toLowerCase();
  const topClasseAtual = top1DinamicoPorClasse[perfil.cls] || top1DinamicoPorClasse.warrior;
  const ehMesmoPersonagem = (top) => top.plataforma === plataforma && top.cls === perfil.cls && top.nick.toLowerCase() === loginP1Limpo;
  const ehMesmoTopClasse = ehMesmoPersonagem(topClasseAtual);

  if (btnCompararTop1) {
    if (ehMesmoTopClasse) {
      const ehTopGeral = ehMesmoPersonagem(top1GeralDinamico);
      btnCompararTop1.textContent = ehTopGeral ? `👑 Top 1 Geral (Você)` : `👑 vs Top 1 Geral (${top1GeralDinamico.rotulo})`;
      btnCompararTop1.disabled = ehTopGeral || !top1GeralDinamico.nick;
      btnCompararTop1.onclick = () => {
        inputCompararNick.value = top1GeralDinamico.nick;
        selectCompararPlataforma.value = top1GeralDinamico.plataforma;
        void dispararComparacao(top1GeralDinamico.nick, top1GeralDinamico.plataforma, top1GeralDinamico.cls);
      };
    } else {
      btnCompararTop1.textContent = `⚡ Top 1 ${nomesClasses[perfil.cls] || ""} (${topClasseAtual.rotulo})`;
      btnCompararTop1.disabled = !topClasseAtual.nick;
      btnCompararTop1.onclick = () => {
        inputCompararNick.value = topClasseAtual.nick;
        selectCompararPlataforma.value = topClasseAtual.plataforma;
        void dispararComparacao(topClasseAtual.nick, topClasseAtual.plataforma, perfil.cls);
      };
    }
  }

  if (btnCompararWarrior) {
    const topW = top1DinamicoPorClasse.warrior;
    const ehP1W = ehMesmoPersonagem(topW);
    btnCompararWarrior.textContent = ehP1W ? `🛡️ Guerreiro (Você)` : `🛡️ vs Guerreiro (${topW.rotulo})`;
    btnCompararWarrior.disabled = ehP1W || !topW.nick;
    btnCompararWarrior.onclick = () => {
      inputCompararNick.value = topW.nick;
      selectCompararPlataforma.value = topW.plataforma;
      void dispararComparacao(topW.nick, topW.plataforma, "warrior");
    };
  }

  if (btnCompararCleric) {
    const topC = top1DinamicoPorClasse.cleric;
    const ehP1C = ehMesmoPersonagem(topC);
    btnCompararCleric.textContent = ehP1C ? `✨ Clérigo (Você)` : `✨ vs Clérigo (${topC.rotulo})`;
    btnCompararCleric.disabled = ehP1C || !topC.nick;
    btnCompararCleric.onclick = () => {
      inputCompararNick.value = topC.nick;
      selectCompararPlataforma.value = topC.plataforma;
      void dispararComparacao(topC.nick, topC.plataforma, "cleric");
    };
  }

  if (btnCompararArcher) {
    const topA = top1DinamicoPorClasse.archer;
    const ehP1A = ehMesmoPersonagem(topA);
    btnCompararArcher.textContent = ehP1A ? `🏹 Arqueiro (Você)` : `🏹 vs Arqueiro (${topA.rotulo})`;
    btnCompararArcher.disabled = ehP1A || !topA.nick;
    btnCompararArcher.onclick = () => {
      inputCompararNick.value = topA.nick;
      selectCompararPlataforma.value = topA.plataforma;
      void dispararComparacao(topA.nick, topA.plataforma, "archer");
    };
  }
}

async function dispararComparacao(nick2, plataforma2, classeDesejadaP2) {
  if (!perfilCarregadoP1) return;
  if (!/^[a-z0-9_.\-]{1,40}$/i.test(nick2)) {
    requisicaoComparacaoAtiva?.abort();
    statusComparacao.dataset.error = "true";
    statusComparacao.textContent = "Informe um nick válido para o Jogador 2.";
    return;
  }

  requisicaoComparacaoAtiva?.abort();
  const controlador = new AbortController();
  requisicaoComparacaoAtiva = controlador;
  delete statusComparacao.dataset.error;
  statusComparacao.textContent = `Consultando ${nick2} na ${plataforma2 === "kick" ? "Kick" : "Twitch"}…`;
  resultadoComparacao.hidden = true;

  try {
    const loginApi2 = plataforma2 === "kick" ? `kick:${nick2}` : nick2;
    const { resposta, dados, loginConsultado } = await buscarRespostaPerfil(
      loginApi2,
      classeDesejadaP2 || undefined,
      controlador.signal
    );

    if (resposta.status === 404) {
      throw new Error(`Jogador 2 ("${nick2}") não foi encontrado na ${plataforma2.toUpperCase()}.`);
    }
    if (!resposta.ok) {
      throw new Error("Falha ao comunicar com os servidores para consultar o Jogador 2.");
    }

    if (controlador.signal.aborted) return;
    const perfilP2 = validarPerfilApi(dados, loginConsultado, classeDesejadaP2);
    if (inputCompararNick.value === nick2) inputCompararNick.value = loginConsultado.replace(/^kick:/, "");
    renderizarPainelComparacao(perfilCarregadoP1, plataformaCarregadaP1, perfilP2, plataforma2);
    statusComparacao.textContent = `Comparação atualizada entre ${perfilCarregadoP1.displayName || perfilCarregadoP1.login} (${nomesClasses[perfilCarregadoP1.cls] || perfilCarregadoP1.cls}) e ${perfilP2.displayName || perfilP2.login} (${nomesClasses[perfilP2.cls] || perfilP2.cls}).`;
    resultadoComparacao.hidden = false;
  } catch (erro) {
    if (controlador.signal.aborted) return;
    statusComparacao.dataset.error = "true";
    statusComparacao.textContent = erro.message || "Erro ao comparar jogadores.";
  }
}

function renderizarPainelComparacao(p1, plat1, p2, plat2) {
  const at1 = inferirAtributosBase(p1);
  const st1 = calcularStatusSimulados(p1.cls, p1.level, at1, p1.equipped || []);
  const fc1 = calcularFc(p1.cls, st1);
  const stSemItens1 = calcularStatusSimulados(p1.cls, p1.level, at1, []);
  const fcSemItens1 = calcularFc(p1.cls, stSemItens1);
  const ganhoEquips1 = Math.max(0, fc1 - fcSemItens1);
  const agg1 = agregarItens(p1.equipped || []);
  const met1 = calcularMetricasCombate(p1.cls, p1.level, st1, p1.equipped || []);

  const at2 = inferirAtributosBase(p2);
  const st2 = calcularStatusSimulados(p2.cls, p2.level, at2, p2.equipped || []);
  const fc2 = calcularFc(p2.cls, st2);
  const stSemItens2 = calcularStatusSimulados(p2.cls, p2.level, at2, []);
  const fcSemItens2 = calcularFc(p2.cls, stSemItens2);
  const ganhoEquips2 = Math.max(0, fc2 - fcSemItens2);
  const agg2 = agregarItens(p2.equipped || []);
  const met2 = calcularMetricasCombate(p2.cls, p2.level, st2, p2.equipped || []);

  const nome1 = p1.displayName || p1.login;
  const nome2 = p2.displayName || p2.login;
  const p1VenceFc = fc1 >= fc2;
  const diffFc = Math.abs(fc1 - fc2);
  const menorFc = Math.min(fc1, fc2);
  const pctDiffFc = menorFc > 0 ? (diffFc / menorFc) * 100 : 0;
  const vencedorFc = p1VenceFc ? nome1 : nome2;

  const k1 = dadosClasses[p1.cls]?.k || 0.6;
  const k2 = dadosClasses[p2.cls]?.k || 0.6;

  const mesmaClasse = p1.cls === p2.cls;
  const avisoClassesDiferentes = !mesmaClasse
    ? `<div class="aviso-classes-diferentes" style="background:#2a2342; border-left:3px solid var(--gold); padding:8px 12px; margin-bottom:12px; font-size:0.85rem;">
        <strong>Classes diferentes (${nomesClasses[p1.cls] || p1.cls} vs ${nomesClasses[p2.cls] || p2.cls}):</strong>
        Os atributos têm pesos distintos na fórmula de cada classe (multiplicador k=${k1.toFixed(2)} vs k=${k2.toFixed(2)}). As diferenças de FC refletem o balanceamento das classes além dos equipamentos.
      </div>`
    : "";

  const diffDps = Math.abs(met1.dpsCombateMedio - met2.dpsCombateMedio);
  const diffHp = Math.abs(st1.maxHp - st2.maxHp);
  const liderDps = met1.dpsCombateMedio >= met2.dpsCombateMedio ? nome1 : nome2;
  const liderHp = st1.maxHp >= st2.maxHp ? nome1 : nome2;

  let resumoEquilibrado;
  if (liderDps === liderHp) {
    resumoEquilibrado = `${escaparHtml(liderDps)} lidera em DPS estimado (+${formatarNumeroCompacto(diffDps)}/s) e em vida (+${formatadorInteiro.format(diffHp)} HP).`;
  } else {
    resumoEquilibrado = `${escaparHtml(liderDps)} tem maior DPS estimado (+${formatarNumeroCompacto(diffDps)}/s); ${escaparHtml(liderHp)} possui maior sobrevivência física (+${formatadorInteiro.format(diffHp)} HP).`;
  }

  const classesP2 = p2.classes || [];
  const seletorClassesP2 = (classesP2.length > 1)
    ? `<div class="p2-switch-classes" style="display:flex;gap:4px;flex-wrap:wrap;margin-top:6px;">
        ${classesP2.map((c) => `
          <button type="button" class="tag-fc ${c.cls === p2.cls ? "" : "secundaria"}" style="cursor:pointer;font-size:0.75rem;padding:2px 6px;" data-classe-comparacao="${c.cls}" aria-pressed="${c.cls === p2.cls}">
            ${nomesClasses[c.cls] || c.cls}
          </button>
        `).join("")}
      </div>`
    : "";

  const htmlVersus = `
    <div class="bloco-versus-topo">
      <div class="card-versus-jogador ${p1VenceFc ? "vencedor" : ""}">
        ${p1.avatar ? `<img class="card-versus-avatar" width="56" height="56" src="${escaparHtml(p1.avatar)}" alt="${escaparHtml(nome1)}">` : '<div class="card-versus-avatar"></div>'}
        <div class="card-versus-detalhes">
          <span class="eyebrow">${plat1.toUpperCase()}</span>
          <div class="card-versus-nome">${escaparHtml(nome1)}</div>
          <div class="card-versus-meta">${nomesClasses[p1.cls] || p1.cls} · Nv. ${p1.level}</div>
          <div class="card-versus-fc">${formatadorInteiro.format(fc1)} FC</div>
        </div>
      </div>

      <div class="badge-diferenca-fc">
        <span class="eyebrow">RESUMO COMPARATIVO</span>
        <strong style="font-size:0.95rem; line-height:1.3; color:var(--text);">${resumoEquilibrado}</strong>
        <span style="margin-top:4px; font-size:0.82rem; color:var(--gold);">Diferença em FC: +${formatadorInteiro.format(diffFc)} (+${pctDiffFc.toFixed(1)}%) para ${escaparHtml(vencedorFc)}</span>
      </div>

      <div class="card-versus-jogador ${!p1VenceFc ? "vencedor" : ""}">
        ${p2.avatar ? `<img class="card-versus-avatar" width="56" height="56" src="${escaparHtml(p2.avatar)}" alt="${escaparHtml(nome2)}">` : '<div class="card-versus-avatar"></div>'}
        <div class="card-versus-detalhes">
          <span class="eyebrow">${plat2.toUpperCase()}</span>
          <div class="card-versus-nome">${escaparHtml(nome2)}</div>
          <div class="card-versus-meta">${nomesClasses[p2.cls] || p2.cls} · Nv. ${p2.level}</div>
          <div class="card-versus-fc">${formatadorInteiro.format(fc2)} FC</div>
          ${seletorClassesP2}
        </div>
      </div>
    </div>
  `;

  function gerarLinhaStat(rotulo, v1, v2, formatadorFn) {
    const n1 = Number(v1);
    const n2 = Number(v2);
    const p1Ganhou = n1 > n2;
    const p2Ganhou = n2 > n1;
    const diff = Math.abs(n1 - n2);
    const menor = Math.min(n1, n2);
    const pct = menor > 0 ? (diff / menor) * 100 : 0;
    const semDif = diff === 0;
    const tagDiff = diff > 0 ? `<span class="tag-diff pos">+${formatadorFn(diff)} (+${pct.toFixed(1)}%)</span>` : "";

    return `
      <tr class="${semDif ? "linha-sem-diferenca" : ""}">
        <th scope="row">${rotulo}</th>
        <td class="${p1Ganhou ? "vencedor" : ""}">${formatadorFn(n1)} ${p1Ganhou ? tagDiff : ""}</td>
        <td class="${p2Ganhou ? "vencedor" : ""}">${formatadorFn(n2)} ${p2Ganhou ? tagDiff : ""}</td>
      </tr>
    `;
  }

  const fmtInt = (val) => formatadorInteiro.format(Math.round(val));
  const fmtDec1 = (val) => Number(val).toFixed(1);
  const fmtDec2 = (val) => Number(val).toFixed(2);
  const fmtPct1 = (val) => `${Number(val).toFixed(1)}%`;

  const htmlTabelaStats = `
    <div class="secao-comparacao-bloco">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:8px;">
        <h3 class="titulo-secao-comp" style="margin:0;">Atributos, Dano Real e Cura</h3>
        <label style="display:inline-flex; align-items:center; gap:6px; font-size:0.82rem; cursor:pointer;">
          <input type="checkbox" id="check-apenas-diferencas">
          Mostrar apenas diferenças
        </label>
      </div>
      <h3 class="titulo-secao-comp">Atributos, Dano Real e Cura</h3>
      <div class="table-wrap">
        <table class="tabela-comp">
          <thead>
            <tr>
              <th scope="col">Métrica</th>
              <th scope="col">${escaparHtml(nome1)}</th>
              <th scope="col">${escaparHtml(nome2)}</th>
            </tr>
          </thead>
          <tbody>
            ${gerarLinhaStat("Força de Combate (FC)", fc1, fc2, fmtInt)}
            ${gerarLinhaStat("DPS Real em Combate", met1.dpsCombateMedio, met2.dpsCombateMedio, fmtInt)}
            ${gerarLinhaStat("Golpe Normal Médio (Alvo 0 DEF)", met1.golpeNormalBruto, met2.golpeNormalBruto, fmtInt)}
            ${gerarLinhaStat("Golpe Crítico Médio (Alvo 0 DEF)", met1.golpeCritBruto, met2.golpeCritBruto, fmtInt)}
            ${p1.cls === "cleric" || p2.cls === "cleric" ? gerarLinhaStat("Cura da Luz Divina (Clérigo)", met1.curaSkillLuzDivina, met2.curaSkillLuzDivina, fmtInt) : ""}
            ${gerarLinhaStat("Mitigação de Defesa", met1.reducaoDefesa * 100, met2.reducaoDefesa * 100, fmtPct1)}
            ${gerarLinhaStat("Multiplicador da Classe (k)", k1, k2, fmtDec2)}
            ${gerarLinhaStat("Nível do Personagem", p1.level, p2.level, fmtInt)}
            ${gerarLinhaStat("Ataque (ATK)", st1.atk, st2.atk, fmtDec1)}
            ${gerarLinhaStat("Defesa (DEF)", st1.def, st2.def, fmtDec1)}
            ${gerarLinhaStat("Vida Máxima (HP)", st1.maxHp, st2.maxHp, fmtInt)}
            ${gerarLinhaStat("Velocidade da Ficha (ASPD)", st1.aspd, st2.aspd, fmtDec2)}
            ${gerarLinhaStat("Cadência Real no Combate (Cap 4,6/s)", met1.cadenciaReal, met2.cadenciaReal, (v) => `${Number(v).toFixed(2)}/s`)}
            ${gerarLinhaStat("Bônus Dano por Velocidade (>4,6)", met1.speedBonus, met2.speedBonus, (v) => `${Number(v).toFixed(2)}×`)}
            ${gerarLinhaStat("Taxa de Crítico", st1.crit, st2.crit, fmtPct1)}
            ${gerarLinhaStat("Bônus de Dano Crítico", st1.critDmg * 100, st2.critDmg * 100, fmtPct1)}
            ${gerarLinhaStat("Vida Efetiva (EHP)", met1.ehp, met2.ehp, fmtInt)}
            ${gerarLinhaStat("FC Base (sem itens)", fcSemItens1, fcSemItens2, fmtInt)}
            ${gerarLinhaStat("Ganho com Equipamentos", ganhoEquips1, ganhoEquips2, fmtInt)}
          </tbody>
        </table>
      </div>
    </div>
  `;

  const slotsComparar = ["weapon", "helmet", "armor", "ring"];
  const itensP1 = p1.equipped || [];
  const itensP2 = p2.equipped || [];
  const mediaIlvl1 = itensP1.filter((i) => i.slot !== "cosmetic").reduce((a, b) => a + (b.itemLevel || 0), 0) / Math.max(1, itensP1.filter((i) => i.slot !== "cosmetic").length);
  const mediaIlvl2 = itensP2.filter((i) => i.slot !== "cosmetic").reduce((a, b) => a + (b.itemLevel || 0), 0) / Math.max(1, itensP2.filter((i) => i.slot !== "cosmetic").length);

  function formatarResumoConjuntos(agg) {
    const sets = [];
    for (const [k, count] of Object.entries(agg.contagemConjuntos)) {
      if (count >= 2 && catalogoConjuntos[k]) {
        sets.push(`${catalogoConjuntos[k].nome} (${count}/3)`);
      }
    }
    return sets.length > 0 ? sets.join(" · ") : "Nenhum conjunto ativo";
  }

  const linhasEquipamentos = slotsComparar.map((s) => {
    const it1 = itensP1.find((i) => i.slot === s);
    const it2 = itensP2.find((i) => i.slot === s);
    const desc1 = it1
      ? `<span style="color: ${coresRaridade[it1.rarity] || "#fff"}; font-weight: 600;">${escaparHtml(it1.name)}</span> <small style="color: var(--muted);">(Nv. ${it1.itemLevel || 1})</small>`
      : '<span class="alerta-slot-vazio" style="color: #ff8a9b; font-weight:600;">⚠️ Espaço vazio</span>';
    const desc2 = it2
      ? `<span style="color: ${coresRaridade[it2.rarity] || "#fff"}; font-weight: 600;">${escaparHtml(it2.name)}</span> <small style="color: var(--muted);">(Nv. ${it2.itemLevel || 1})</small>`
      : '<span class="alerta-slot-vazio" style="color: #ff8a9b; font-weight:600;">⚠️ Espaço vazio</span>';
    const saoIguais = Boolean(it1 && it2 && it1.name === it2.name && it1.rarity === it2.rarity && it1.itemLevel === it2.itemLevel && it1.set === it2.set);
    return `<tr class="${saoIguais ? "linha-sem-diferenca" : ""}"><th scope="row">${nomesSlots[s] || s}</th><td>${desc1}</td><td>${desc2}</td></tr>`;
  }).join("");

  const htmlEquipamentos = `
    <div class="secao-comparacao-bloco">
      <h3 class="titulo-secao-comp">Equipamentos e Conjuntos</h3>
      <div class="table-wrap">
        <table class="tabela-comp">
          <thead>
            <tr>
              <th scope="col">Peça / Métrica</th>
              <th scope="col">${escaparHtml(nome1)}</th>
              <th scope="col">${escaparHtml(nome2)}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Conjunto Ativo</th>
              <td style="color: var(--gold); font-weight: 600;">${escaparHtml(formatarResumoConjuntos(agg1))}</td>
              <td style="color: var(--gold); font-weight: 600;">${escaparHtml(formatarResumoConjuntos(agg2))}</td>
            </tr>
            ${gerarLinhaStat("Média de Item Level", mediaIlvl1, mediaIlvl2, fmtDec1)}
            ${linhasEquipamentos}
          </tbody>
        </table>
      </div>
    </div>
  `;

  const gemas1 = itensP1.flatMap((i) => i.gems || []);
  const gemas2 = itensP2.flatMap((i) => i.gems || []);
  const gemasSupremas1 = gemas1.filter((g) => g.tier === 5).length;
  const gemasSupremas2 = gemas2.filter((g) => g.tier === 5).length;

  const htmlGemas = `
    <div class="secao-comparacao-bloco">
      <h3 class="titulo-secao-comp">Gemas Engastadas</h3>
      <div class="table-wrap">
        <table class="tabela-comp">
          <thead>
            <tr>
              <th scope="col">Estatística de Gemas</th>
              <th scope="col">${escaparHtml(nome1)}</th>
              <th scope="col">${escaparHtml(nome2)}</th>
            </tr>
          </thead>
          <tbody>
            ${gerarLinhaStat("Total de Gemas", gemas1.length, gemas2.length, fmtInt)}
            ${gerarLinhaStat("Gemas Supremas (Tier 5)", gemasSupremas1, gemasSupremas2, fmtInt)}
            ${gerarLinhaStat("Bônus de % DEF nas Gemas", agg1.gemasPercent.def / 10, agg2.gemasPercent.def / 10, fmtPct1)}
            ${gerarLinhaStat("Bônus de % HP nas Gemas", agg1.gemasPercent.hp / 10, agg2.gemasPercent.hp / 10, fmtPct1)}
            ${gerarLinhaStat("Velocidade (SPD) nas Gemas", agg1.gemasFixas.spd, agg2.gemasFixas.spd, fmtInt)}
            ${gerarLinhaStat("Crítico (CRIT) nas Gemas", agg1.gemasFixas.crit, agg2.gemasFixas.crit, fmtInt)}
            ${gerarLinhaStat("Ataque (ATK) nas Gemas", agg1.gemasFixas.atk, agg2.gemasFixas.atk, fmtInt)}
          </tbody>
        </table>
      </div>
    </div>
  `;

  function celulaForja(p, chave) {
    const tryCnt = p.counters?.[`fuse_${chave}_try`] ?? 0;
    const okCnt = p.counters?.[`fuse_${chave}_ok`] ?? 0;
    const taxa = tryCnt > 0 ? ((okCnt / tryCnt) * 100).toFixed(1) + "%" : "—";
    return `${formatadorInteiro.format(okCnt)}/${formatadorInteiro.format(tryCnt)} (${taxa})`;
  }

  const htmlForjas = `
    <div class="secao-comparacao-bloco">
      <h3 class="titulo-secao-comp">Histórico de Forjas</h3>
      <div class="table-wrap">
        <table class="tabela-comp">
          <thead>
            <tr>
              <th scope="col">Raridade</th>
              <th scope="col">${escaparHtml(nome1)}</th>
              <th scope="col">${escaparHtml(nome2)}</th>
            </tr>
          </thead>
          <tbody>
            <tr><th scope="row" style="color: #c77dff;">Épico</th><td>${celulaForja(p1, "epic")}</td><td>${celulaForja(p2, "epic")}</td></tr>
            <tr><th scope="row" style="color: #ff8073;">Imortal</th><td>${celulaForja(p1, "imm")}</td><td>${celulaForja(p2, "imm")}</td></tr>
            <tr><th scope="row" style="color: #ff8de6;">Arcano</th><td>${celulaForja(p1, "arc")}</td><td>${celulaForja(p2, "arc")}</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  resultadoComparacao.innerHTML = `${avisoClassesDiferentes}${htmlVersus}${htmlTabelaStats}${htmlEquipamentos}${htmlGemas}${htmlForjas}`;

  resultadoComparacao.querySelectorAll("[data-classe-comparacao]").forEach((botao) => {
    botao.addEventListener("click", () => {
      if (botao.dataset.classeComparacao !== p2.cls) {
        void dispararComparacao(p2.login.replace(/^kick:/i, ""), plat2, botao.dataset.classeComparacao);
      }
    });
  });

  const checkDif = resultadoComparacao.querySelector("#check-apenas-diferencas");
  if (checkDif) {
    checkDif.addEventListener("change", (e) => {
      resultadoComparacao.classList.toggle("ocultar-sem-diferenca", e.target.checked);
    });
  }
}

export function configurarComparacao() {
  if (formComparar) {
    formComparar.addEventListener("submit", (evento) => {
      evento.preventDefault();
      const dados = new FormData(formComparar);
      const { nick, plataforma } = normalizarEntradaNick(dados.get("nick2"), dados.get("plataforma2"));
      void dispararComparacao(nick, plataforma);
    });
  }
}

export {
  atualizarCardP1Comparacao,
  dispararComparacao,
  inputCompararNick,
  selectCompararPlataforma,
};
