import { catalogoGemas } from "../dados.mjs";
import { escaparHtml, formatarGemaTexto } from "../formato.mjs";
import { limitarTierGema, resumoCurtoGemaBotao, rotuloTierGema } from "./estado.mjs";

export function construirEditorEngastes({ item: itemAtivo, chavePeca: idxAtivo, engaste, prefixo = "sim", rolagem }) {
  const maxGemasAtivo = Math.max(0, Math.min(6, Number(itemAtivo.sockets ?? 6)));
  const tierSlotAtivo = limitarTierGema(itemAtivo.gemTierPadrao, itemAtivo.rarity);
  const qtdGemasAtivas = itemAtivo.gems.slice(0, maxGemasAtivo).filter(Boolean).length;
  const engasteAtivo = Math.min(Math.max(0, maxGemasAtivo - 1), Math.max(0, engaste));
  const botoesTierHtml = [1, 2, 3, 4, 5, 6].map((t) => `
    <button type="button" class="btn-tier-gema ${tierSlotAtivo === t ? "ativa" : ""}" data-${prefixo}-slot-tier="${idxAtivo}:${t}" aria-pressed="${tierSlotAtivo === t}" ${t > limitarTierGema(6, itemAtivo.rarity) ? 'disabled title="Prismáticas exigem peças Imortais ou Arcanas"' : ""}>
      ${rotuloTierGema(t)}
    </button>
  `).join("");

  const sockets6Html = Array.from({ length: maxGemasAtivo }, (_, idxGema) => {
    const gema = itemAtivo.gems[idxGema] || null;
    const selecionado = idxGema === engasteAtivo;
    const infoGema = gema?.type ? catalogoGemas[gema.type] : null;
    const tierGema = gema?.tier || tierSlotAtivo;
    const resumoCurto = gema
      ? formatarGemaTexto(gema).replace(/^[^:]+:\s*/, "").split(" · ")[0]
      : "Vazio";

    return `
      <button
        type="button"
        class="rs-socket-btn ${selecionado ? "sel" : ""} ${gema ? "filled" : "empty"}"
        data-${prefixo}-selecionar-engaste="${idxGema}"
        aria-pressed="${selecionado}"
        title="${escaparHtml(`Engaste ${idxGema + 1}: ${gema ? formatarGemaTexto(gema) : "Vazio"}`)}"
      >
        <span class="rs-socket-num">#${idxGema + 1}</span>
        <span class="rs-socket-icon">
          ${
            infoGema
              ? `<canvas class="rs-canvas-gema-socket" data-${prefixo}-canvas-gema="${gema.type}:${tierGema}:1" width="16" height="16"></canvas>`
              : `<span class="rs-socket-empty-diamond">◇</span>`
          }
        </span>
        <strong class="rs-socket-name" style="color:${infoGema ? infoGema.cor : "var(--muted)"};">${infoGema ? infoGema.nome : "Vazio"}</strong>
        <small class="rs-socket-val">${escaparHtml(resumoCurto)}</small>
      </button>
    `;
  }).join("");

  const gemaNoEngasteAtivo = itemAtivo.gems[engasteAtivo] || null;
  const tipoNoEngasteAtivo = gemaNoEngasteAtivo?.type || null;

  const opcoesPedraEngasteAtivoHtml = Object.entries(catalogoGemas).map(([tk, tv]) => {
    const estaSelecionada = tipoNoEngasteAtivo === tk;
    const tierExibicao = estaSelecionada ? gemaNoEngasteAtivo.tier || tierSlotAtivo : tierSlotAtivo;
    const subtexto = estaSelecionada
      ? formatarGemaTexto(gemaNoEngasteAtivo).replace(/^[^:]+:\s*/, "")
      : resumoCurtoGemaBotao(tk, itemAtivo.slot, tierExibicao, itemAtivo.itemLevel, rolagem);

    return `
      <button
        type="button"
        class="btn-gema-opcao ${estaSelecionada ? "ativa" : ""}"
        data-${prefixo}-gem-btn="${idxAtivo}:${engasteAtivo}:${tk}"
        aria-pressed="${estaSelecionada ? "true" : "false"}"
        title="${estaSelecionada ? "Clique para remover a pedra deste engaste" : `Colocar ${tv.nome} T${tierSlotAtivo} no Engaste #${engasteAtivo + 1}`}"
      >
        <strong class="gema-titulo-btn">
          <canvas class="rs-canvas-gema-mini" data-${prefixo}-canvas-gema="${tk}:${tierExibicao}:1" width="16" height="16"></canvas>
          ${tv.nome}
        </strong>
        <small class="gema-sub-btn">${escaparHtml(subtexto)}</small>
      </button>
    `;
  }).join("");

  return `
    <div class="sim-gemas-bloco">
      <div class="sim-gemas-topo">
        <div>
          <span>ENGASTES DE GEMAS (${qtdGemasAtivas}/${maxGemasAtivo})</span>
        </div>
        <div class="sim-tier-bar">
          ${botoesTierHtml}
          <button type="button" class="btn-mini" data-${prefixo}-gem-reroll="${idxAtivo}" title="Recalcula as gemas desta peça">🎲 Re-rolar</button>
          <button type="button" class="btn-mini" data-${prefixo}-gem-limpar="${idxAtivo}" title="Remove todas as gemas desta peça">Limpar</button>
        </div>
      </div>

      ${maxGemasAtivo > 0 ? `
      <div class="rs-sockets6" role="group" aria-label="Engastes da peça">
        ${sockets6Html}
      </div>

      <div class="rs-stone-picker">
        <div class="rs-stone-picker-head">
          <span>Escolher pedra para o <strong>Engaste #${engasteAtivo + 1}</strong>:</span>
          <div class="rs-stone-picker-actions">
            ${gemaNoEngasteAtivo ? `
              ${maxGemasAtivo > 1 ? `<button type="button" class="btn-mini btn-atalho-ativo" data-${prefixo}-gem-repetir-ativo="${idxAtivo}:${engasteAtivo}" title="Preencher os engastes com gemas do mesmo tipo e tier">
                Repetir nos ${maxGemasAtivo} engastes
              </button>` : ""}
              <button type="button" class="btn-mini" data-${prefixo}-gem-limpar-unico="${idxAtivo}:${engasteAtivo}" title="Remover pedra apenas do Engaste #${engasteAtivo + 1}">
                ✕ Esvaziar #${engasteAtivo + 1}
              </button>
            ` : ""}
          </div>
        </div>
        <div class="rs-stone-options-row">
          ${opcoesPedraEngasteAtivoHtml}
        </div>
      </div>
      ` : `<p class="small muted">Esta peça não tem engastes.</p>`}
    </div>
  `;
}
