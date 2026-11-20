import { Explicacoes } from "../bibliotecas.mjs";
import {
  calcularFc,
  calcularMetricasCombate,
  calcularStatusSimulados,
  inferirAtributosBase,
} from "../combate.mjs";
import {
  catalogoAneis,
  catalogoArmas,
  catalogoConjuntos,
  curvasReferenciaPecas,
  catalogoGemas,
  nomesClasses,
  nomesRaridade,
  nomesSlots,
} from "../dados.mjs";
import { escaparHtml, formatadorInteiro, formatarGemaTexto } from "../formato.mjs";
import { perfilCarregadoP1 } from "../perfil.mjs";
import { renderizarCompararMelhorias, renderizarPainelGerenciadorBuilds } from "./builds.mjs";
import { vincularEventosSimulador } from "./controles.mjs";
import { limitarTierGema, obterOrigemBuildSimulador, obterTierEngaste, resumoCurtoGemaBotao, simulacao, slotsAbertosSimulador } from "./estado.mjs";
import {
  construirBarraModoCriativoHtml,
  construirModoFichaVisualHtml,
  construirPainelResumoSimuladorHtml,
  renderizarCanvasesFichaSimulador,
} from "./ficha.mjs";

const containerSimulador = document.querySelector("#simulador-container");

function renderizarSimulador() {
  if (!containerSimulador) return;

  // Preserva estado dos cards expansíveis abertos e scroll interno da galeria
  const cardsExistentes = containerSimulador.querySelectorAll(".sim-slot-card");
  if (cardsExistentes.length > 0) {
    cardsExistentes.forEach((d) => {
      const idx = Number(d.dataset.slotIndex);
      if (!Number.isNaN(idx)) {
        if (d.open) {
          slotsAbertosSimulador.add(idx);
        } else {
          slotsAbertosSimulador.delete(idx);
        }
      }
    });
  }
  const detailsAvancadasExistente = containerSimulador.querySelector("#sim-details-avancadas");
  if (detailsAvancadasExistente) {
    simulacao.opcoesAvancadasAbertasSimulador = Boolean(detailsAvancadasExistente.open);
  }
  const galeriaAnterior = containerSimulador.querySelector(".rs-bag-list, .sim-galeria-itens");
  const scrollGaleriaAnterior = galeriaAnterior ? galeriaAnterior.scrollTop : 0;

  // Preserva rolagem e elemento com foco ativo
  const scrollYAnterior = typeof window !== "undefined" ? window.scrollY : 0;
  const scrollXAnterior = typeof window !== "undefined" ? window.scrollX : 0;
  const elementoFocadoAtivo = typeof document !== "undefined" ? document.activeElement : null;
  let seletorFocoRestaurar = null;
  let cursorBuscaIni = null;
  let cursorBuscaFim = null;
  if (elementoFocadoAtivo && containerSimulador.contains(elementoFocadoAtivo)) {
    if (elementoFocadoAtivo.id === "sim-busca-peca-slot") {
      seletorFocoRestaurar = "#sim-busca-peca-slot";
      cursorBuscaIni = elementoFocadoAtivo.selectionStart;
      cursorBuscaFim = elementoFocadoAtivo.selectionEnd;
    } else if (elementoFocadoAtivo.dataset?.simSelecionarEngaste) {
      seletorFocoRestaurar = `[data-sim-selecionar-engaste="${elementoFocadoAtivo.dataset.simSelecionarEngaste}"]`;
    } else if (elementoFocadoAtivo.dataset?.simGemBtn) {
      seletorFocoRestaurar = `[data-sim-gem-btn="${elementoFocadoAtivo.dataset.simGemBtn}"]`;
    } else if (elementoFocadoAtivo.dataset?.simSlotTier) {
      seletorFocoRestaurar = `[data-sim-slot-tier="${elementoFocadoAtivo.dataset.simSlotTier}"]`;
    } else if (elementoFocadoAtivo.dataset?.simEngasteTier) {
      seletorFocoRestaurar = `[data-sim-engaste-tier="${elementoFocadoAtivo.dataset.simEngasteTier}"]`;
    } else if (elementoFocadoAtivo.dataset?.simSelecaoSlot || elementoFocadoAtivo.dataset?.simSelecionarSlot) {
      const v = elementoFocadoAtivo.dataset.simSelecionarSlot;
      if (v !== undefined) seletorFocoRestaurar = `[data-sim-selecionar-slot="${v}"]`;
    } else if (elementoFocadoAtivo.dataset?.simAttr) {
      seletorFocoRestaurar = `[data-sim-attr="${elementoFocadoAtivo.dataset.simAttr}"]`;
    } else if (elementoFocadoAtivo.dataset?.simItemStat) {
      seletorFocoRestaurar = `[data-sim-item-stat="${elementoFocadoAtivo.dataset.simItemStat}"]`;
    } else if (elementoFocadoAtivo.dataset?.simItemCampo) {
      seletorFocoRestaurar = `[data-sim-item-campo="${elementoFocadoAtivo.dataset.simItemCampo}"]`;
    } else if (elementoFocadoAtivo.id) {
      seletorFocoRestaurar = `#${elementoFocadoAtivo.id}`;
    }
  }

  renderizarPainelGerenciadorBuilds();
  renderizarCompararMelhorias();

  const stSim = calcularStatusSimulados(simulacao.estadoSimulador.cls, simulacao.estadoSimulador.level, simulacao.estadoSimulador.atributos, simulacao.estadoSimulador.itens);
  const fcSim = calcularFc(simulacao.estadoSimulador.cls, stSim);
  const metSim = calcularMetricasCombate(simulacao.estadoSimulador.cls, simulacao.estadoSimulador.level, stSim, simulacao.estadoSimulador.itens);

  // Melhor atributo para +1 ponto em FC
  const mapaNomesAttrs = [
    { chave: "str", nome: "Força (FOR)" },
    { chave: "vit", nome: "Vitalidade (VIT)" },
    { chave: "def", nome: "Defesa (DEF)" },
    { chave: "agi", nome: "Agilidade (AGI)" },
    { chave: "luk", nome: "Sorte (SOR)" },
  ];
  let melhorAttr = mapaNomesAttrs[0];
  let melhorGanho = -1;
  for (const attr of mapaNomesAttrs) {
    const copiaAttrs = { ...simulacao.estadoSimulador.atributos, [attr.chave]: simulacao.estadoSimulador.atributos[attr.chave] + 1 };
    const fcTeste = calcularFc(simulacao.estadoSimulador.cls, calcularStatusSimulados(simulacao.estadoSimulador.cls, simulacao.estadoSimulador.level, copiaAttrs, simulacao.estadoSimulador.itens));
    const delta = fcTeste - fcSim;
    if (delta > melhorGanho) {
      melhorGanho = delta;
      melhorAttr = attr;
    }
  }

  let fcOrig = null;
  let metOrig = null;
  const classeSimulada = simulacao.estadoSimulador.cls;
  if (perfilCarregadoP1?.cls === classeSimulada) {
    const atOrig = inferirAtributosBase(perfilCarregadoP1);
    const stOrig = calcularStatusSimulados(perfilCarregadoP1.cls, perfilCarregadoP1.level, atOrig, perfilCarregadoP1.equipped || []);
    fcOrig = Number.isFinite(perfilCarregadoP1.power)
      ? perfilCarregadoP1.power
      : calcularFc(perfilCarregadoP1.cls, stOrig);
    metOrig = calcularMetricasCombate(perfilCarregadoP1.cls, perfilCarregadoP1.level, stOrig, perfilCarregadoP1.equipped || []);
  }

  const linhasAttrsHtml = mapaNomesAttrs.map(({ chave, nome }) => `
    <div class="sim-atributo-linha">
      <label for="sim-attr-${chave}">${nome}</label>
      <input id="sim-attr-${chave}" type="number" min="0" max="5000" value="${simulacao.estadoSimulador.atributos[chave]}" data-sim-attr="${chave}">
      <div class="sim-botoes-attr">
        <button type="button" class="btn-mini" data-attr-btn="${chave}" data-delta="-10">-10</button>
        <button type="button" class="btn-mini" data-attr-btn="${chave}" data-delta="-1">-1</button>
        <button type="button" class="btn-mini" data-attr-btn="${chave}" data-delta="1">+1</button>
        <button type="button" class="btn-mini" data-attr-btn="${chave}" data-delta="10">+10</button>
      </div>
    </div>
  `).join("");

  // Conjuntos da classe atual aparecem primeiro, mas permite todos (para testar forjas/builds híbridas)
  const conjuntosDaClasse = Object.entries(catalogoConjuntos).filter(([, v]) => v.classe === simulacao.estadoSimulador.cls);
  const conjuntosOutrasClasses = Object.entries(catalogoConjuntos).filter(([, v]) => v.classe !== simulacao.estadoSimulador.cls);

  const construirOptsConjunto = (valorAtual) => {
    const optVazio = `<option value="" ${!valorAtual ? "selected" : ""}>Sem conjunto</option>`;
    const grupoClasse = `<optgroup label="Conjuntos de ${nomesClasses[simulacao.estadoSimulador.cls]}">${conjuntosDaClasse
      .map(([k, v]) => `<option value="${k}" ${valorAtual === k ? "selected" : ""}>${escaparHtml(v.nome)}</option>`)
      .join("")}</optgroup>`;
    const grupoOutras = `<optgroup label="Outras Classes">${conjuntosOutrasClasses
      .map(([k, v]) => `<option value="${k}" ${valorAtual === k ? "selected" : ""}>${escaparHtml(v.nome)} (${nomesClasses[v.classe]})</option>`)
      .join("")}</optgroup>`;
    return optVazio + grupoClasse + grupoOutras;
  };

  const armasDaClasse = Object.entries(catalogoArmas).filter(([, v]) => v.classe === simulacao.estadoSimulador.cls);
  const armasOutras = Object.entries(catalogoArmas).filter(([, v]) => v.classe !== simulacao.estadoSimulador.cls);

  const construirOptsArma = (valorAtual) => {
    const optGen = `<option value="" ${!valorAtual ? "selected" : ""}>Arma genérica</option>`;
    const grupoClasse = `<optgroup label="Armas de ${nomesClasses[simulacao.estadoSimulador.cls]}">${armasDaClasse
      .map(([k, v]) => `<option value="${k}" ${valorAtual === k ? "selected" : ""}>${escaparHtml(v.nome)}</option>`)
      .join("")}</optgroup>`;
    const grupoOutras = `<optgroup label="Outras Classes">${armasOutras
      .map(([k, v]) => `<option value="${k}" ${valorAtual === k ? "selected" : ""}>${escaparHtml(v.nome)} (${nomesClasses[v.classe]})</option>`)
      .join("")}</optgroup>`;
    return optGen + grupoClasse + grupoOutras;
  };

  const construirOptsAnel = (valorAtual) => {
    return [`<option value="0" ${!Number(valorAtual) ? "selected" : ""}>Anel comum</option>`]
      .concat(
        Object.entries(catalogoAneis).map(
          ([k, v]) => `<option value="${k}" ${Number(valorAtual) === Number(k) ? "selected" : ""}>${escaparHtml(v.nome)}</option>`
        )
      )
      .join("");
  };

  const setAtivo3Pecas =
    simulacao.estadoSimulador.itens[0]?.set &&
    simulacao.estadoSimulador.itens[0]?.set === simulacao.estadoSimulador.itens[1]?.set &&
    simulacao.estadoSimulador.itens[0]?.set === simulacao.estadoSimulador.itens[2]?.set
      ? simulacao.estadoSimulador.itens[0].set
      : "";

  const resumoPainelDireitoHtml = construirPainelResumoSimuladorHtml(stSim, fcSim, metSim, fcOrig, metOrig);

  if (simulacao.modoVisualizacaoSimulador === "ficha") {
    const fichaHtml = construirModoFichaVisualHtml(
      linhasAttrsHtml,
      melhorAttr,
      melhorGanho,
      conjuntosDaClasse,
      setAtivo3Pecas,
      resumoPainelDireitoHtml,
      stSim,
      fcSim,
      metSim,
      fcOrig,
      metOrig
    );
    containerSimulador.innerHTML = fichaHtml;
  } else {
    const barraModoHtml = construirBarraModoCriativoHtml(conjuntosDaClasse, setAtivo3Pecas);
    const barraConjuntoRapidoHtml = `
      <div class="barra-atalhos">
        <span class="rotulo-atalho">⚡ Equipar Set Completo (${nomesClasses[simulacao.estadoSimulador.cls]}):</span>
        ${conjuntosDaClasse
          .map(
            ([k, v]) => `
          <button type="button" class="btn-mini ${setAtivo3Pecas === k ? "ativo" : ""}" data-sim-set-rapido="${k}">
            ${escaparHtml(v.nome)}
          </button>
        `
          )
          .join("")}
      </div>
    `;

    const slotsHtml = simulacao.estadoSimulador.itens.map((item, idxSlot) => {
      const ehArma = item.slot === "weapon";
      const ehAnel = item.slot === "ring";
      const maxGemas = Math.max(0, Math.min(6, Number(item.sockets ?? 6)));
      if (!Array.isArray(item.gems) || item.gems.length < 6) {
        const antigas = Array.isArray(item.gems) ? item.gems : [];
        item.gems = Array.from({ length: 6 }, (_, i) => (antigas[i] ? { ...antigas[i] } : null));
      }
      const qtdGemasAtivas = item.gems.slice(0, maxGemas).filter(Boolean).length;
      const maxTier = limitarTierGema(6, item.rarity);

      const linhasGemasHtml = Array.from({ length: maxGemas }, (_, idxGema) => {
        const gemaAtual = item.gems[idxGema] || null;
        const tipoAtual = gemaAtual?.type || gemaAtual?.kind || null;
        const tierEngaste = obterTierEngaste(item, idxGema);

        const botoesOpcoesHtml = Object.entries(catalogoGemas)
          .map(([tk, tv]) => {
            const estaSelecionada = tipoAtual === tk;
            const subtexto = estaSelecionada
              ? formatarGemaTexto(gemaAtual).replace(/^[^:]+:\s*/, "")
              : resumoCurtoGemaBotao(tk, item.slot, tierEngaste, item.itemLevel);
            return `
              <button
                type="button"
                class="btn-gema-opcao ${estaSelecionada ? "ativa" : ""}"
                data-sim-gem-btn="${idxSlot}:${idxGema}:${tk}"
                aria-pressed="${estaSelecionada ? "true" : "false"}"
                title="${estaSelecionada ? "Clique para desselecionar esta gema" : `Engastar ${tv.nome} T${tierEngaste}`}"
              >
                <strong class="gema-titulo-btn"><span class="gema-ponto-cor" style="background:${tv.cor};"></span>${tv.nome}</strong>
                <small class="gema-sub-btn">${escaparHtml(subtexto)}</small>
              </button>
            `;
          })
          .join("");

        return `
          <div class="sim-gema-linha com-tier">
            <label class="sim-gema-indice">
              <span>#${idxGema + 1}</span>
              <select data-sim-engaste-tier="${idxSlot}:${idxGema}" aria-label="Tier do engaste ${idxGema + 1}">
                ${Array.from({ length: maxTier }, (_, indice) => {
                  const tier = indice + 1;
                  return `<option value="${tier}" ${tierEngaste === tier ? "selected" : ""}>T${tier}</option>`;
                }).join("")}
              </select>
            </label>
            ${botoesOpcoesHtml}
          </div>
        `;
      }).join("");

      return `
        <details class="sim-slot-card sim-slot-card-expansivel" data-slot-index="${idxSlot}" ${slotsAbertosSimulador.has(idxSlot) ? "open" : ""}>
          <summary class="sim-slot-head sumario-expansivel">
            <span>
              <strong>${nomesSlots[item.slot]} · ${escaparHtml(item.name || "Peça")}</strong>
              <span class="small muted">${nomesRaridade[item.rarity] || "Comum"} · Nv.${item.itemLevel || 1}${item.set && catalogoConjuntos[item.set] ? ` · ${escaparHtml(catalogoConjuntos[item.set].nome)}` : ""}</span>
            </span>
            <span class="badge-gemas-resumo" style="font-size:0.8rem; color:var(--cyan); font-weight:600;">💎 ${qtdGemasAtivas}/${maxGemas} gemas ▾</span>
          </summary>
          <div class="sim-slot-conteudo" style="display:grid; gap:8px; margin-top:8px;">
            <div class="sim-slot-selects">
              <select data-sim-item-campo="${idxSlot}:set" title="Conjunto da Peça">
                ${construirOptsConjunto(item.set || "")}
              </select>
              <select data-sim-item-campo="${idxSlot}:rarity" title="Raridade">
                ${nomesRaridade.map((nr, rIdx) => `<option value="${rIdx}" ${Number(item.rarity) === rIdx ? "selected" : ""}>${nr}</option>`).join("")}
              </select>
              <input type="number" min="1" max="999" value="${item.itemLevel || 1}" title="Item Level" data-sim-item-campo="${idxSlot}:itemLevel">
            </div>
            ${
              ehArma
                ? `<select data-sim-item-campo="${idxSlot}:kind" title="Tipo de Arma">${construirOptsArma(item.kind || "")}</select>`
                : ehAnel
                  ? `<select data-sim-item-campo="${idxSlot}:look" title="Anel Especial">${construirOptsAnel(item.look || 0)}</select>`
                  : ""
            }
            <div class="sim-slot-stats">
              <label>ATK <input type="number" value="${item.atk || 0}" data-sim-item-stat="${idxSlot}:atk"></label>
              <label>DEF <input type="number" value="${item.def || 0}" data-sim-item-stat="${idxSlot}:def"></label>
              <label>HP <input type="number" value="${item.hp || 0}" data-sim-item-stat="${idxSlot}:hp"></label>
              <label>CRÍT% <input type="number" value="${item.crit || 0}" data-sim-item-stat="${idxSlot}:crit"></label>
              <label>VEL% <input type="number" value="${item.spd || 0}" data-sim-item-stat="${idxSlot}:spd"></label>
            </div>
            <div class="sim-gemas-bloco">
              <div class="sim-gemas-topo">
                <div>
                  <span>💎 Gemas (${qtdGemasAtivas}/${maxGemas}) ${Explicacoes.criarBadgeOrigemHtml("estimado")}</span>
                  <p class="small muted" style="margin:2px 0 0 0; font-size:0.75rem;">Modo: ${simulacao.modoRolagemGemaSimulador === "max" ? "Teto 115%" : simulacao.modoRolagemGemaSimulador === "media" ? "Média 100%" : "Sorteio 85% a 115%"}. Não altera o jogo.</p>
                </div>
                <div class="sim-tier-bar">
                  <button type="button" class="btn-mini" data-sim-gem-reroll="${idxSlot}" title="Recalcula as gemas engastadas nesta peça">🎲 Re-rolar</button>
                  <button type="button" class="btn-mini" data-sim-gem-repetir="${idxSlot}" title="Copia a gema da linha #1 para todas as 6 linhas">Repetir #1 nas 6</button>
                  <button type="button" class="btn-mini" data-sim-gem-limpar="${idxSlot}" title="Desseleciona todas as gemas desta peça">Limpar</button>
                </div>
              </div>
              ${linhasGemasHtml}
            </div>
          </div>
        </details>
      `;
    }).join("");

    containerSimulador.innerHTML = `
      ${barraModoHtml}
      <div class="sim-layout">
        <div class="sim-bloco">
          <h4>Personagem &amp; Pontos de Ouro</h4>
          <div class="sim-campos-topo">
            <div class="campo">
              <label for="sim-classe">Classe</label>
              <select id="sim-classe">
                ${Object.entries(nomesClasses).map(([k, n]) => `<option value="${k}" ${simulacao.estadoSimulador.cls === k ? "selected" : ""}>${n}</option>`).join("")}
              </select>
            </div>
            <div class="campo">
              <label for="sim-nivel">Nível</label>
              <input id="sim-nivel" type="number" min="1" max="2000" value="${simulacao.estadoSimulador.level}">
            </div>
          </div>

          ${linhasAttrsHtml}
          <div class="sim-dica-melhor" style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;">
            <span>💡 Melhor atributo agora: <strong>+1 em ${melhorAttr.nome}</strong> (+${formatadorInteiro.format(melhorGanho)} FC)</span>
            <span style="display:inline-flex;gap:6px;">
              <button type="button" class="btn-mini btn-atalho-ativo" data-attr-btn="${melhorAttr.chave}" data-delta="1">+1 ${melhorAttr.chave.toUpperCase()}</button>
              <button type="button" class="btn-mini btn-atalho-ativo" data-attr-btn="${melhorAttr.chave}" data-delta="10">+10 ${melhorAttr.chave.toUpperCase()}</button>
            </span>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px; margin-bottom:-2px;">
            <h4 style="margin:0;">Equipamentos &amp; Gemas</h4>
            <span style="display:inline-flex; gap:6px;">
              <button type="button" class="btn-mini" id="btn-sim-expandir-todos" title="Expandir todas as peças para editar gemas">Expandir Todas</button>
              <button type="button" class="btn-mini" id="btn-sim-recolher-todos" title="Recolher todas as peças">Recolher</button>
            </span>
          </div>
          ${barraConjuntoRapidoHtml}
          ${slotsHtml}
        </div>

        ${resumoPainelDireitoHtml}
      </div>
    `;
  }

  const origem = obterOrigemBuildSimulador();
  if (origem && origem.classe !== classeSimulada) {
    const aviso = document.createElement("p");
    aviso.className = "note-compacto";
    aviso.textContent = `Build iniciada com os atributos e equipamentos de ${origem.nome} (${nomesClasses[origem.classe]}). Confira os atributos e os requisitos das peças da classe simulada antes de usar este FC como referência.`;
    containerSimulador.prepend(aviso);
  }

  if (simulacao.estadoSimulador.itens.some(({ kind }) => curvasReferenciaPecas.has(kind))) {
    const aviso = document.createElement("p");
    aviso.className = "note-compacto";
    aviso.textContent = "Os novos conjuntos da Cidade Mecânica têm bônus e passivas do jogo. Os atributos gerados automaticamente para essas peças usam outros Arcanos como referência. Para estimar o FC de uma peça real, importe o personagem ou informe os atributos da peça.";
    containerSimulador.prepend(aviso);
  }

  vincularEventosSimulador();
  renderizarCanvasesFichaSimulador();

  const novaGaleria = containerSimulador.querySelector(".rs-bag-list, .sim-galeria-itens");
  if (novaGaleria && scrollGaleriaAnterior > 0) {
    novaGaleria.scrollTop = scrollGaleriaAnterior;
  }

  // Restaura o foco sem disparar auto-scroll do navegador
  if (seletorFocoRestaurar) {
    const elRestaurar = containerSimulador.querySelector(seletorFocoRestaurar);
    if (elRestaurar && typeof elRestaurar.focus === "function") {
      try {
        elRestaurar.focus({ preventScroll: true });
        if (
          elRestaurar.id === "sim-busca-peca-slot" &&
          cursorBuscaIni !== null &&
          typeof elRestaurar.setSelectionRange === "function"
        ) {
          elRestaurar.setSelectionRange(cursorBuscaIni, cursorBuscaFim ?? cursorBuscaIni);
        }
      } catch {}
    }
  }

  // Restaura precisamente a posição da tela (imediato e no próximo quadro)
  if (typeof window !== "undefined" && typeof window.scrollTo === "function") {
    window.scrollTo({ left: scrollXAnterior, top: scrollYAnterior, behavior: "instant" });
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => {
        window.scrollTo({ left: scrollXAnterior, top: scrollYAnterior, behavior: "instant" });
      });
    }
  }
}

export {
  containerSimulador,
  renderizarSimulador,
};
