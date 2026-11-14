import { alternarVisibilidadeAba } from "./abas.mjs";
import {
  Analise,
  CALCULATION_VERSION,
  Explicacoes,
  Historico,
} from "./bibliotecas.mjs";
import { catalogoConjuntos, nomesClasses } from "./dados.mjs";
import { escaparHtml, formatadorInteiro, formatarNumeroCompacto } from "./formato.mjs";
import { estadoPerfil } from "./perfil.mjs";

const gradeIndicadoresPrincipais = document.querySelector("#grade-indicadores-principais");
const blocoFcDetalhado = document.querySelector("#bloco-fc-detalhado");
const blocoPontosAtencao = document.querySelector("#bloco-pontos-atencao");
const secaoEvolucaoHistorico = document.querySelector("#secao-evolucao-historico");
const conteudoGlossarioBusca = document.querySelector("#conteudo-glossario-busca");
const inputBuscaGlossario = document.querySelector("#input-busca-glossario");

function renderizarResumoPersonagem(perfil, statusCalculados, metricasCombate, classe, plataforma) {
  if (!perfil) return;

  const analiseObj = Analise.analisarPerfilParaResumo
    ? Analise.analisarPerfilParaResumo(perfil, statusCalculados, metricasCombate, classe, catalogoConjuntos)
    : null;
  if (!analiseObj) return;

  // 1. Grade de Indicadores Principais (máx 4 por linha)
  if (gradeIndicadoresPrincipais) {
    const cardsHtml = analiseObj.indicadores
      .map((ind) => {
        const badgeHtml = Explicacoes.criarBadgeOrigemHtml ? Explicacoes.criarBadgeOrigemHtml(ind.origem) : "";
        const botaoAjuda = Explicacoes.criarBotaoAjudaHtml ? Explicacoes.criarBotaoAjudaHtml(ind.id, `Entenda ${ind.titulo}`) : "";
        let valorFormatado = "—";
        if (typeof ind.valor === "number") {
          valorFormatado =
            ind.valor > 999999
              ? `${formatarNumeroCompacto(ind.valor)} ${ind.unidade || ""}`
              : `${formatadorInteiro.format(Math.round(ind.valor))} ${ind.unidade || ""}`;
        } else if (ind.valor != null) {
          valorFormatado = `${ind.valor} ${ind.unidade || ""}`.trim();
        }

        return `
          <article class="card-indicador" data-indicador-id="${escaparHtml(ind.id)}">
            <header class="card-indicador-topo">
              <span class="card-indicador-titulo">${escaparHtml(ind.titulo)}</span>
              ${badgeHtml}
            </header>
            <div class="card-indicador-valor">
              ${escaparHtml(valorFormatado)}
              ${botaoAjuda}
            </div>
            <p class="card-indicador-resumo">${escaparHtml(ind.resumo)}</p>
            <details class="card-indicador-detalhes">
              <summary class="sumario-card-detalhes">Ver detalhes</summary>
              <p class="note" style="margin:4px 0 0;">${escaparHtml(ind.detalhes)}</p>
            </details>
          </article>
        `;
      })
      .join("");
    gradeIndicadoresPrincipais.innerHTML = cardsHtml;
  }

  // 2. Bloco FC Detalhado (FC Oficial vs Reconstruído)
  if (blocoFcDetalhado) {
    const fcComp = analiseObj.comparacaoFc;
    const diffTexto =
      fcComp.diferencaAbsoluta != null
        ? `${fcComp.diferencaAbsoluta >= 0 ? "+" : ""}${formatadorInteiro.format(fcComp.diferencaAbsoluta)} FC` +
          (fcComp.diferencaPercentual != null
            ? ` (${fcComp.diferencaPercentual >= 0 ? "+" : ""}${fcComp.diferencaPercentual.toFixed(3)}%)`
            : "")
        : "—";

    const badgeJogo = Explicacoes.criarBadgeOrigemHtml ? Explicacoes.criarBadgeOrigemHtml("jogo") : "";
    const badgeCalc = Explicacoes.criarBadgeOrigemHtml ? Explicacoes.criarBadgeOrigemHtml("calculado") : "";

    blocoFcDetalhado.innerHTML = `
      <h3 class="titulo-bloco-secao">FC Oficial vs Reconstruído</h3>
      <div class="grade-comparacao-fc">
        <div class="item-comparacao-fc">
          <span class="muted small">Informado pelo Jogo ${badgeJogo}</span>
          <strong>${fcComp.informado != null ? formatadorInteiro.format(fcComp.informado) + " FC" : "—"}</strong>
        </div>
        <div class="item-comparacao-fc">
          <span class="muted small">Reconstruído pelo Motor ${badgeCalc}</span>
          <strong>${fcComp.reconstruido != null ? formatadorInteiro.format(fcComp.reconstruido) + " FC" : "—"}</strong>
        </div>
        <div class="item-comparacao-fc">
          <span class="muted small">Diferença</span>
          <strong style="color:${fcComp.concordanciaPerfeita ? "var(--green)" : "var(--gold)"};">${escaparHtml(diffTexto)}</strong>
        </div>
      </div>
      <p class="note" style="margin-top:8px;">${escaparHtml(fcComp.explicacao)}</p>
    `;
  }

  // 3. Pontos de Atenção Determinísticos (Até 3)
  if (blocoPontosAtencao) {
    const pontos = analiseObj.pontosAtencao || [];
    if (pontos.length === 0) {
      blocoPontosAtencao.innerHTML = `
        <h3 class="titulo-bloco-secao">Pontos de Atenção</h3>
        <p class="note">Nenhum ponto de atenção crítico detectado na build atual.</p>
      `;
    } else {
      const pontosHtml = pontos
        .map((p) => `
          <article class="card-ponto-atencao ${escaparHtml(p.tipo)}">
            <div class="ponto-atencao-conteudo">
              <span class="ponto-atencao-titulo">${p.icone || "•"} ${escaparHtml(p.titulo)}</span>
              <p class="ponto-atencao-texto">${escaparHtml(p.texto)}</p>
              <small class="muted">${escaparHtml(p.explicacao)}</small>
            </div>
            <button type="button" class="btn-secundario ponto-atencao-acao-btn" data-acao-aba="${escaparHtml(p.acaoAba)}">${escaparHtml(p.acaoTexto)} ↗</button>
          </article>
        `)
        .join("");

      blocoPontosAtencao.innerHTML = `
        <h3 class="titulo-bloco-secao">Pontos de Atenção</h3>
        <div class="grade-pontos-atencao">${pontosHtml}</div>
      `;

      blocoPontosAtencao.querySelectorAll(".ponto-atencao-acao-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          const abaAlvo = btn.dataset.acaoAba;
          if (abaAlvo) {
            alternarVisibilidadeAba(abaAlvo);
          }
        });
      });
    }
  }

  // 4. Seção de Evolução (Histórico, Seção 10)
  renderizarSecaoEvolucaoHistorico(perfil, classe, plataforma);

  // 5. Glossário Interativo
  renderizarSecaoGlossario();
}

function renderizarSecaoEvolucaoHistorico(perfil, classe, plataforma) {
  if (!secaoEvolucaoHistorico || !perfil || !Historico.obterHistoricoPersonagem) return;

  const nick = perfil.login || perfil.displayName;
  const snapshots = Historico.obterHistoricoPersonagem(plataforma, nick, classe);
  const autoSaveAtivo = Historico.obterConfigAutoSave ? Historico.obterConfigAutoSave() : false;

  let htmlSnapshots = "";
  if (snapshots.length === 0) {
    htmlSnapshots = `
      <p class="note">O histórico começa quando você salva uma consulta neste navegador. Ele não acompanha o jogo com a página fechada e não sincroniza entre dispositivos.</p>
    `;
  } else {
    const opcoesSnapshots = snapshots
      .map((s, idx) => {
        const d = new Date(s.capturedAt);
        const dataFmt = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
        const fcFmt = s.profile?.power ? formatarNumeroCompacto(s.profile.power) + " FC" : "—";
        return `<option value="${idx}">Consulta #${idx + 1} · ${dataFmt} (${fcFmt})</option>`;
      })
      .reverse()
      .join("");

    htmlSnapshots = `
      <div class="comparador-snapshots-painel">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
          <span style="font-weight:600; font-size:0.84rem; color:var(--gold);">Comparar consultas salvas:</span>
          <span class="muted small">${snapshots.length} consulta(s) gravada(s) (máx. 100)</span>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr auto; gap:8px; align-items:end; margin-top:8px;">
          <div class="campo">
            <label for="select-snap-a">Consulta Base</label>
            <select id="select-snap-a">${opcoesSnapshots}</select>
          </div>
          <div class="campo">
            <label for="select-snap-b">Consulta Comparada</label>
            <select id="select-snap-b">${opcoesSnapshots}</select>
          </div>
          <button type="button" id="btn-comparar-snapshots" class="btn-secundario" style="min-height:48px;">Comparar</button>
        </div>
        <div id="resultado-comparacao-snapshots" style="margin-top:10px;"></div>
      </div>
    `;
  }

  secaoEvolucaoHistorico.innerHTML = `
    <div class="historico-topo-acoes">
      <h3 class="titulo-bloco-secao">Sua Evolução no Rift</h3>
      <div class="acoes-inline">
        <button type="button" id="btn-salvar-snapshot" class="btn-secundario btn-compacto">💾 Salvar consulta agora</button>
        <button type="button" id="btn-limpar-historico" class="btn-secundario btn-compacto" title="Limpar histórico deste personagem" ${snapshots.length === 0 ? "disabled" : ""}>🗑 Limpar</button>
        <label class="historico-autosave-label">
          <input type="checkbox" id="check-autosave-historico" ${autoSaveAtivo ? "checked" : ""}>
          <span>Salvar consultas automaticamente neste navegador</span>
        </label>
      </div>
    </div>
    <div class="secao-historico-evolucao">${htmlSnapshots}</div>
  `;

  const btnSalvar = document.querySelector("#btn-salvar-snapshot");
  if (btnSalvar) {
    btnSalvar.addEventListener("click", () => {
      const res = Historico.salvarSnapshotConsulta(plataforma, nick, classe, perfil, estadoPerfil.sourceUpdatedAt, CALCULATION_VERSION);
      if (res.duplicado) {
        btnSalvar.textContent = "✓ Já salvo recentemente!";
      } else if (res.sucesso) {
        btnSalvar.textContent = "✓ Consulta salva!";
        renderizarSecaoEvolucaoHistorico(perfil, classe, plataforma);
      } else {
        btnSalvar.textContent = "Erro ao salvar";
      }
      setTimeout(() => {
        if (btnSalvar) btnSalvar.textContent = "💾 Salvar consulta agora";
      }, 2500);
    });
  }

  const checkAuto = document.querySelector("#check-autosave-historico");
  if (checkAuto) {
    checkAuto.addEventListener("change", (e) => {
      Historico.definirConfigAutoSave(e.target.checked);
    });
  }

  const btnLimpar = document.querySelector("#btn-limpar-historico");
  if (btnLimpar) {
    btnLimpar.addEventListener("click", () => {
      if (confirm(`Deseja limpar todo o histórico salvo de ${nick} (${nomesClasses[classe] || classe})?`)) {
        Historico.limparHistoricoPersonagem(plataforma, nick, classe);
        renderizarSecaoEvolucaoHistorico(perfil, classe, plataforma);
      }
    });
  }

  const btnComp = document.querySelector("#btn-comparar-snapshots");
  if (btnComp) {
    btnComp.addEventListener("click", () => {
      const selA = document.querySelector("#select-snap-a");
      const selB = document.querySelector("#select-snap-b");
      const resDiv = document.querySelector("#resultado-comparacao-snapshots");
      if (!selA || !selB || !resDiv) return;

      const idxA = parseInt(selA.value, 10);
      const idxB = parseInt(selB.value, 10);
      const snapA = snapshots[idxA];
      const snapB = snapshots[idxB];
      if (!snapA || !snapB) return;

      const comp = Historico.compararSnapshots(snapA, snapB);
      if (!comp) return;

      const deltaFcSinal = comp.fc.delta >= 0 ? "+" : "";
      const deltaFcPctTexto = comp.fc.deltaPct != null ? ` (${deltaFcSinal}${comp.fc.deltaPct.toFixed(2)}%)` : "";
      const deltaLvlSinal = comp.nivel.delta >= 0 ? "+" : "";

      let itensHtml = "";
      if (comp.alteracoesItens.length > 0) {
        itensHtml = `<ul style="margin:4px 0; padding-left:18px; font-size:0.8rem;">${comp.alteracoesItens.map((it) => `<li>${escaparHtml(it.descricao)}</li>`).join("")}</ul>`;
      } else {
        itensHtml = `<p class="note" style="margin:4px 0;">Nenhum equipamento trocado entre estas consultas.</p>`;
      }

      let forjasHtml = "";
      if (comp.evolucaoForjas.length > 0) {
        forjasHtml = `<ul style="margin:4px 0; padding-left:18px; font-size:0.8rem;">${comp.evolucaoForjas.map((f) => `<li>${escaparHtml(f.contador)}: ${f.antigo} → ${f.novo} (${f.delta >= 0 ? "+" : ""}${f.delta})${f.possivelReset ? " ⚠️ (Possível reset de contador registrado)" : ""}</li>`).join("")}</ul>`;
      } else {
        forjasHtml = `<p class="note" style="margin:4px 0;">Nenhuma tentativa de forja adicional registrada no período.</p>`;
      }

      resDiv.innerHTML = `
        <div style="background:#100d22; padding:10px; border:1px solid var(--line); font-size:0.82rem; margin-top:8px;">
          <p style="margin:0 0 6px; font-weight:700; color:var(--cyan);">${escaparHtml(comp.periodo.textoJanela)}</p>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:8px;">
            <div><strong>Variação de FC:</strong> <span style="color:${comp.fc.delta >= 0 ? "var(--green)" : "#ff6b5a"};">${deltaFcSinal}${formatadorInteiro.format(comp.fc.delta)} FC${deltaFcPctTexto}</span></div>
            <div><strong>Variação de Nível:</strong> ${deltaLvlSinal}${comp.nivel.delta} níveis</div>
          </div>
          <div><strong>Mudanças de Equipamento:</strong>${itensHtml}</div>
          <div style="margin-top:6px;"><strong>Evolução dos Contadores de Forja:</strong>${forjasHtml}</div>
        </div>
      `;
    });
  }
}

function renderizarSecaoGlossario() {
  if (!conteudoGlossarioBusca || !Explicacoes.renderizarGlossarioHtml) return;
  conteudoGlossarioBusca.innerHTML = Explicacoes.renderizarGlossarioHtml(inputBuscaGlossario?.value || "");

  if (inputBuscaGlossario && !inputBuscaGlossario.dataset.ouvinteVinculado) {
    inputBuscaGlossario.dataset.ouvinteVinculado = "true";
    inputBuscaGlossario.addEventListener("input", (e) => {
      conteudoGlossarioBusca.innerHTML = Explicacoes.renderizarGlossarioHtml(e.target.value);
    });
  }
}

export {
  renderizarResumoPersonagem,
  renderizarSecaoGlossario,
};
