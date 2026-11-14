import { Explicacoes } from "./bibliotecas.mjs";
import { chavesRaridadePity, indicesPecaPity, tiposForja } from "./dados.mjs";
import { escaparHtml, formatadorInteiro, formatadorPercentual, formatarDuracaoSegundos } from "./formato.mjs";

const corpoTabela = document.querySelector("#linhas-forjas");

const resumoGeloFogoTopo = document.querySelector("#resumo-gelo-fogo-topo");
const planejadorProximaForja = document.querySelector("#planejador-proxima-forja");

const containerMatrizGeloFogo = document.querySelector("#matriz-gelo-fogo");
const containerEventosConquistas = document.querySelector("#resumo-eventos-conquistas");

const estadoPlanejador = {
  raridade: "arc",
  slot: "wpn",
  pergaminho: 0,
  evento: 0,
  tentativas: 1,
  geloManual: null,
};

function renderizarResumoGeloFogoTopo(perfil) {
  if (!resumoGeloFogoTopo || !perfil) return;
  const counters = perfil.counters || {};

  const slotsPity = indicesPecaPity.map(({ idx, slot, rotulo }) => ({
    idx, rotulo, chave: { weapon: "wpn", helmet: "helm", armor: "chest", ring: "ring" }[slot]
  }));

  let maxGelo = { slot: "Arma", raridade: "Arcano", valor: 0, slotChave: "wpn", raridadeChave: "arc" };
  for (const s of slotsPity) {
    for (const r of [{ chave: "arc", id: 7, rotulo: "Arcano" }, { chave: "imm", id: 6, rotulo: "Imortal" }, { chave: "epic", id: 4, rotulo: "Épico" }]) {
      const g = Number(counters[`fz_f_${r.id}_${s.idx}`] || 0);
      if (g > maxGelo.valor) {
        maxGelo = { slot: s.rotulo, raridade: r.rotulo, valor: g, slotChave: s.chave, raridadeChave: r.chave };
      }
    }
  }

  const bonusPP = Math.min(5, maxGelo.valor) * 2;
  resumoGeloFogoTopo.innerHTML = `
    <div style="background:var(--panel-alt); border:1px solid var(--line); padding:12px; margin-bottom:12px;">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
        <div>
          <span class="muted small">Maior Bônus de Gelo (Pity) no Perfil</span>
          <p style="margin:2px 0 0; font-size:1.05rem; font-weight:700; color:var(--cyan);">
            +${bonusPP} p.p. em ${maxGelo.slot} (${maxGelo.raridade} · ${maxGelo.valor} falhas)
          </p>
        </div>
        <button type="button" id="btn-abrir-planejador-maior-gelo" class="btn-secundario btn-compacto">Planejar com esta peça ↗</button>
      </div>
      <p class="note" style="margin:6px 0 0;">Cada ponto de Gelo soma +2 p.p. de chance na forja (máximo de +10 p.p. no Nv.5). Sucesso reseta o contador da respectiva peça.</p>
    </div>
  `;

  const btnPity = document.querySelector("#btn-abrir-planejador-maior-gelo");
  if (btnPity) {
    btnPity.addEventListener("click", () => {
      const selRaridade = document.querySelector("#select-planejador-raridade");
      const selSlot = document.querySelector("#select-planejador-slot");
      if (selRaridade && selSlot) {
        selRaridade.value = maxGelo.raridadeChave;
        selSlot.value = maxGelo.slotChave;
        selRaridade.dispatchEvent(new Event("change"));
        selRaridade.scrollIntoView({ behavior: "smooth" });
      }
    });
  }
}

function renderizarPlanejadorForjas(perfil) {
  if (!planejadorProximaForja) return;

  const counters = perfil?.counters || {};
  const slotsPity = indicesPecaPity.map(({ idx, slot, rotulo }) => ({
    idx, rotulo, chave: { weapon: "wpn", helmet: "helm", armor: "chest", ring: "ring" }[slot]
  }));

  const raridades = [
    { chave: "arc", rotulo: "Arcano", base: 25, idRarity: 7 },
    { chave: "imm", rotulo: "Imortal", base: 35, idRarity: 6 },
    { chave: "epic", rotulo: "Épico", base: 50, idRarity: 4 },
  ];

  const cfgRaridade = raridades.find((r) => r.chave === estadoPlanejador.raridade) || raridades[0];
  const cfgSlot = slotsPity.find((s) => s.chave === estadoPlanejador.slot) || slotsPity[0];

  const geloPerfil = Number(counters[`fz_f_${cfgRaridade.idRarity}_${cfgSlot.idx}`] || 0);
  const geloAtual = estadoPlanejador.geloManual !== null ? estadoPlanejador.geloManual : geloPerfil;
  const geloNivel = Math.min(5, geloAtual);
  const bonusGeloPP = geloNivel * 2;

  const pergaminhoPP = Number(estadoPlanejador.pergaminho) || 0;
  const eventoPP = Math.max(0, Math.min(50, Number(estadoPlanejador.evento) || 0));
  const chanceProxima = Math.min(100, Math.max(0, cfgRaridade.base + bonusGeloPP + pergaminhoPP + eventoPP));

  const N = Math.max(1, Math.min(10, Number(estadoPlanejador.tentativas) || 1));
  let probTodasFalharem = 1.0;
  for (let i = 0; i < N; i++) {
    const nivelFalha = Math.min(5, geloAtual + i);
    const bonusGeloNaTentativa = nivelFalha * 2;
    const pi = Math.min(100, Math.max(0, cfgRaridade.base + bonusGeloNaTentativa + pergaminhoPP + eventoPP)) / 100;
    probTodasFalharem *= (1 - pi);
  }
  const chanceEmNTentativas = (1 - probTodasFalharem) * 100;

  const materiaisTotal = 4 * N;

  const composicaoTexto = `Base ${cfgRaridade.base}% + Gelo ${bonusGeloPP >= 0 ? "+" : ""}${bonusGeloPP} p.p. + Pergaminho +${pergaminhoPP} p.p. + Evento +${eventoPP} p.p. = ${chanceProxima.toFixed(1)}%`;

  const badgeCalc = Explicacoes.criarBadgeOrigemHtml ? Explicacoes.criarBadgeOrigemHtml("calculado") : "";
  const badgeEst = Explicacoes.criarBadgeOrigemHtml ? Explicacoes.criarBadgeOrigemHtml("estimado") : "";

  planejadorProximaForja.innerHTML = `
    <h3 class="titulo-bloco-secao">Planejador da Próxima Forja</h3>
    <p class="note-compacto">Simule a próxima tentativa e a progressão de Gelo. As chances base são referências; eventos ativos podem alterar as regras do servidor.</p>

    <div class="grid-planejador-inputs">
      <div class="campo">
        <label for="select-planejador-raridade">Raridade Alvo</label>
        <select id="select-planejador-raridade">
          ${raridades.map((r) => `<option value="${r.chave}" ${r.chave === estadoPlanejador.raridade ? "selected" : ""}>${r.rotulo} (Base ${r.base}%)</option>`).join("")}
        </select>
      </div>
      <div class="campo">
        <label for="select-planejador-slot">Tipo de Peça</label>
        <select id="select-planejador-slot">
          ${slotsPity.map((s) => `<option value="${s.chave}" ${s.chave === estadoPlanejador.slot ? "selected" : ""}>${s.rotulo}</option>`).join("")}
        </select>
      </div>
      <div class="campo">
        <label for="input-planejador-gelo">Gelo Atual (Pity: ${geloPerfil}x no perfil)</label>
        <input id="input-planejador-gelo" type="number" min="0" max="20" value="${geloAtual}" title="Sequência de falhas atual nesta peça">
      </div>
      <div class="campo">
        <label for="select-planejador-pergaminho">Pergaminho de Sorte</label>
        <select id="select-planejador-pergaminho">
          <option value="0" ${pergaminhoPP === 0 ? "selected" : ""}>Nenhum (+0 p.p.)</option>
          <option value="10" ${pergaminhoPP === 10 ? "selected" : ""}>Pergaminho de Sorte (+10 p.p.)</option>
          <option value="20" ${pergaminhoPP === 20 ? "selected" : ""}>Sorte Maior (+20 p.p.)</option>
          <option value="25" ${pergaminhoPP === 25 ? "selected" : ""}>Sorte Suprema (+25 p.p.)</option>
        </select>
      </div>
      <div class="campo">
        <label for="input-planejador-evento">Bônus de Evento (p.p.)</label>
        <input id="input-planejador-evento" type="number" min="0" max="50" value="${eventoPP}" placeholder="0">
      </div>
      <div class="campo">
        <label for="input-planejador-tentativas">Tentativas no Orçamento</label>
        <input id="input-planejador-tentativas" type="number" min="1" max="10" value="${N}">
      </div>
    </div>

    <div class="resultado-planejador-destaque">
      <div class="card-composicao-forja">
        <span>📐 Composição da próxima tentativa:</span>
        <div style="font-size:1.1rem; color:var(--gold); margin-top:4px;">${escaparHtml(composicaoTexto)}</div>
      </div>
      <div class="orcamento-forja-grid">
        <div class="item-comparacao-fc">
          <span class="muted small">Chance da Próxima Tentativa ${badgeCalc}</span>
          <strong style="color:var(--gold); font-size:1.3rem;">${chanceProxima.toFixed(1)}%</strong>
        </div>
        <div class="item-comparacao-fc">
          <span class="muted small">Chance de ≥1 Sucesso em ${N}x (c/ Gelo) ${badgeCalc}</span>
          <strong style="color:var(--cyan); font-size:1.3rem;">${chanceEmNTentativas.toFixed(1)}%</strong>
        </div>
        <div class="item-comparacao-fc">
          <span class="muted small">Orçamento Estimado (${N} tentativa${N > 1 ? "s" : ""}) ${badgeEst}</span>
          <strong>${materiaisTotal} equipamentos compatíveis · ouro depende dos níveis</strong>
        </div>
      </div>
      <p class="note" style="margin:0;">* São materiais para executar ${N} tentativa(s), sem reutilizar resultados. O custo em ouro é calculado pelo jogo conforme o nível e a raridade; consulte a confirmação da forja. Não garante sucesso.</p>
    </div>
  `;

  const selRaridade = document.querySelector("#select-planejador-raridade");
  const selSlot = document.querySelector("#select-planejador-slot");
  const inGelo = document.querySelector("#input-planejador-gelo");
  const selPerg = document.querySelector("#select-planejador-pergaminho");
  const inEvento = document.querySelector("#input-planejador-evento");
  const inTent = document.querySelector("#input-planejador-tentativas");

  const atualizarPlanejador = () => {
    if (selRaridade) estadoPlanejador.raridade = selRaridade.value;
    if (selSlot) estadoPlanejador.slot = selSlot.value;
    if (inGelo) estadoPlanejador.geloManual = inGelo.value !== "" ? Number(inGelo.value) : null;
    if (selPerg) estadoPlanejador.pergaminho = Number(selPerg.value) || 0;
    if (inEvento) estadoPlanejador.evento = Number(inEvento.value) || 0;
    if (inTent) estadoPlanejador.tentativas = Math.max(1, Math.min(10, Number(inTent.value) || 1));
    renderizarPlanejadorForjas(perfil);
  };

  [selRaridade, selSlot, selPerg].forEach((el) => el?.addEventListener("change", atualizarPlanejador));
  [inGelo, inEvento, inTent].forEach((el) => el?.addEventListener("input", atualizarPlanejador));
}

/* ==========================================================================
   Aba 2: Matriz de Gelo (Pity) e Fogo + Eventos & Conquistas
   ========================================================================== */

function renderizarMatrizGeloEFogo(perfil) {
  if (!containerMatrizGeloFogo) return;
  const counters = perfil.counters || {};
  const oportunidadesGelo = [];

  const linhasHtml = chavesRaridadePity.map(({ raridade, rotulo, chanceBase }) => {
    const celulas = indicesPecaPity.map(({ idx, rotulo: rotuloPeca }) => {
      const geloBruto = Number(counters[`fz_f_${raridade}_${idx}`] || 0);
      const fogoBruto = Number(counters[`fz_w_${raridade}_${idx}`] || 0);
      const geloNivel = Math.min(5, geloBruto);
      const bonusGelo = geloNivel * 2;
      const chanceEfetiva = chanceBase + bonusGelo;

      if (geloBruto > 0) {
        oportunidadesGelo.push({
          rotuloRaridade: rotulo,
          rotuloPeca,
          geloNivel,
          geloBruto,
          chanceEfetiva,
        });
      }

      const pipsGelo = Array.from({ length: 5 }, (_, i) =>
        `<i class="${i < geloNivel ? "on-ice" : ""}"></i>`
      ).join("");

      let conteudo;
      if (geloBruto > 0) {
        conteudo = `
          <div class="celula-gelo">
            <span class="badge-gelo ${geloNivel >= 5 ? "alto" : ""}">❄️ Gelo Nv.${geloNivel} (${geloBruto}x)</span>
            <div class="pips-gelo" aria-hidden="true">${pipsGelo}</div>
            <span class="chance-efetiva">+${bonusGelo}% → ${chanceEfetiva}%</span>
          </div>
        `;
      } else if (fogoBruto > 0) {
        const pipsFogo = Array.from({ length: 5 }, (_, i) =>
          `<i class="${i < Math.min(5, fogoBruto) ? "on-fire" : ""}"></i>`
        ).join("");
        conteudo = `
          <div class="celula-gelo">
            <span class="badge-fogo">🔥 Fogo ${fogoBruto}x</span>
            <div class="pips-gelo" aria-hidden="true">${pipsFogo}</div>
            <span class="small muted">${chanceBase}% base</span>
          </div>
        `;
      } else {
        conteudo = `
          <div class="celula-gelo">
            <span class="muted small">Neutro (${chanceBase}%)</span>
            <div class="pips-gelo" aria-hidden="true">${pipsGelo}</div>
          </div>
        `;
      }
      return `<td>${conteudo}</td>`;
    }).join("");

    return `
      <tr>
        <th scope="row">${rotulo} (${chanceBase}%)</th>
        ${celulas}
      </tr>
    `;
  }).join("");

  oportunidadesGelo.sort((a, b) => b.geloNivel - a.geloNivel || b.geloBruto - a.geloBruto);
  const resumoOportunidadesHtml = oportunidadesGelo.length
    ? `
      <div class="barra-atalhos">
        <span class="rotulo-atalho">❄️ Melhores Chances Acumuladas:</span>
        ${oportunidadesGelo.map((op) => `
          <span class="badge-gelo ${op.geloNivel >= 5 ? "alto" : ""}">
            ${op.rotuloRaridade} · <strong>${op.rotuloPeca}</strong>: Nv.${op.geloNivel} (${op.chanceEfetiva}% chance)
          </span>
        `).join("")}
      </div>
    `
    : "";

  containerMatrizGeloFogo.innerHTML = `
    <h3 class="titulo-secao-comp">Matriz de Gelo (Pity) e Fogo Atual por Peça</h3>
    ${resumoOportunidadesHtml}
    <div class="table-wrap">
      <table class="tabela-gelo">
        <thead>
          <tr>
            <th scope="col">Raridade Alvo</th>
            ${indicesPecaPity.map((p) => `<th scope="col">${p.rotulo}</th>`).join("")}
          </tr>
        </thead>
        <tbody>${linhasHtml}</tbody>
      </table>
    </div>
    <p class="note-compacto">Cada falha seguida no mesmo tipo de peça e raridade soma <strong>+2% de chance</strong> (máximo de +10% no Gelo Nv.5). O Fogo apenas indica sequência de sucessos e não altera a chance.</p>
  `;
}

function renderizarEventosEConquistas(perfil) {
  if (!containerEventosConquistas) return;
  const c = perfil.counters || {};
  const canais = Array.isArray(perfil.channels) ? perfil.channels : [];
  const achPts = perfil.achievementPoints || 0;
  const achDone = perfil.achievementsUnlocked || 0;
  const achTot = perfil.achievementsTotal || 0;

  const canaisHtml = canais.slice(0, 6).map((ch) => `
    <div class="card-info-linha">
      <span>${escaparHtml(ch.displayName || ch.login)}</span>
      <strong>${formatadorInteiro.format(ch.waves || 0)} ondas · ${formatarDuracaoSegundos(ch.seconds || 0)}</strong>
    </div>
  `).join("");

  const avisoVip = perfil.vip === false
    ? `<div class="card-info-linha"><span>Baú & VIP</span><strong>Free (${perfil.vip ? "VIP" : "sem passe VIP"})</strong></div>`
    : `<div class="card-info-linha"><span>Status VIP</span><strong style="color:var(--gold);">Ativo (skip de forja liberado)</strong></div>`;

  containerEventosConquistas.innerHTML = `
    <h3 class="titulo-secao-comp">Jornada, Eventos & Canais Frequentados</h3>
    <div class="grade-cards-info">
      <article class="card-info">
        <h4>Progresso Geral</h4>
        <div class="card-info-linha"><span>Melhor Onda Pessoal</span><strong>Onda ${formatadorInteiro.format(c.best_wave || 0)}</strong></div>
        <div class="card-info-linha"><span>Chefes Abatidos</span><strong>${formatadorInteiro.format(c.boss_kills || 0)}</strong></div>
        <div class="card-info-linha"><span>Monstros Abatidos</span><strong>${formatadorInteiro.format(c.kills || 0)}</strong></div>
        <div class="card-info-linha"><span>Tempo em Live</span><strong>${formatarDuracaoSegundos(perfil.totalSeconds || 0)}</strong></div>
        ${avisoVip}
      </article>
      <article class="card-info">
        <h4>Eventos & Conquistas</h4>
        <div class="card-info-linha"><span>Conquistas</span><strong>${achDone}/${achTot} (${formatadorInteiro.format(achPts)} pts)</strong></div>
        <div class="card-info-linha"><span>Meteoro Dourado</span><strong>${c.ev_goldmeteor_cleared || 0} vitórias · ${c.ev_goldmeteor_items || 0} itens</strong></div>
        <div class="card-info-linha"><span>Evento Natal</span><strong>${c.ev_christmas_cleared || 0} vitórias · ${c.ev_christmas_items || 0} itens</strong></div>
        <div class="card-info-linha"><span>Halloween</span><strong>${c.ev_halloween_cleared || 0} vitórias · ${c.ev_halloween_items || 0} itens</strong></div>
        <div class="card-info-linha"><span>Itens Lendários / Épicos</span><strong>${formatadorInteiro.format(c.legendary || 0)} / ${formatadorInteiro.format(c.epic || 0)}</strong></div>
      </article>
      <article class="card-info">
        <h4>Canais Mais Jogados</h4>
        ${canaisHtml || '<span class="muted small">Nenhum histórico público de canais.</span>'}
      </article>
    </div>
  `;
}

export function renderizarForjas(perfil) {
  const linhas = tiposForja.map(({ chave, rotulo, chanceBase }) => {
    const tentativas = perfil.counters?.[`fuse_${chave}_try`] ?? 0;
    const sucessos = perfil.counters?.[`fuse_${chave}_ok`] ?? 0;
    const linha = document.createElement("tr");
    linha.dataset.forge = chave;

    const cabecalho = document.createElement("th");
    cabecalho.scope = "row";
    cabecalho.textContent = rotulo;
    linha.append(cabecalho);

    let taxaTexto = "—";
    if (tentativas === 0) {
      taxaTexto = "Nenhuma tentativa registrada";
    } else if (sucessos > tentativas) {
      taxaTexto = "Dados inconsistentes";
    } else {
      const pct = (sucessos / tentativas) * 100;
      taxaTexto = `${sucessos} sucessos em ${tentativas} tentativas · ${pct.toFixed(1)}%`;
    }

    const valores = [
      formatadorPercentual.format(chanceBase),
      formatadorInteiro.format(tentativas),
      formatadorInteiro.format(sucessos),
      taxaTexto,
    ];

    for (const valor of valores) {
      const celula = document.createElement("td");
      celula.textContent = valor;
      linha.append(celula);
    }

    return linha;
  });
  corpoTabela.replaceChildren(...linhas);
  renderizarResumoGeloFogoTopo(perfil);
  renderizarMatrizGeloEFogo(perfil);
  renderizarPlanejadorForjas(perfil);
  renderizarEventosEConquistas(perfil);
}

export { renderizarPlanejadorForjas };
