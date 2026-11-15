import { dadosClasses, nomesClasses, nomesSlots } from "./dados.mjs";
import { escaparHtml, formatadorDecimal1, formatadorDecimal2, formatadorInteiro } from "./formato.mjs";
import { construirEditorEngastes } from "./simulador/engastes.mjs";

function listaAtributos(atributos) {
  return `<dl class="tl-ficha-atributos">${atributos.map(([rotulo, valor]) => `
    <div><dt>${rotulo}</dt><dd>${valor}</dd></div>
  `).join("")}</dl>`;
}

export function renderizarFichaFc(item, nivel, atributos, slotAtivo, engasteAtivo) {
  const { classe, itens, status, fc, fcBase } = item.referenciaFc;
  const inteiro = (n) => formatadorInteiro.format(n);
  const decimal = (n) => formatadorDecimal1.format(n);
  const anelEquipado = itens.find((peca) => peca.slot === "ring");
  const rotuloEquipamento = item.categoria === "ring" ? "Apenas o anel equipado"
    : anelEquipado ? "Conjunto 3/3 equipado · Com anel" : "Conjunto 3/3 equipado · Sem anel";
  const slots = ["weapon", "helmet", "armor", "ring"];
  const pecaAtiva = itens.find((peca) => peca.slot === slotAtivo);
  return `
    <div class="tl-ficha-fc">
      <h3 class="tl-detalhe-titulo">${escaparHtml(item.nome)}</h3>
      <div class="rs-sheet tl-ficha-visual">
        <section class="rs-panel rs-hero" aria-label="Personagem e equipamento">
          <div class="rs-stage-box big">
            <canvas data-tl-sprite="${item.id}" data-tl-heroi width="192" height="192" aria-hidden="true"></canvas>
          </div>
          <div class="rs-hero-head">
            <h2 style="color:${dadosClasses[classe].cor}">${nomesClasses[classe]}</h2>
            <span class="rs-lvl">NÍVEL <strong>${nivel}</strong></span>
          </div>
          <p class="note small">${rotuloEquipamento}</p>
          <div class="rs-htile fc tl-ficha-total">
            <span>FC SIMULADO</span>
            <strong>${inteiro(fc)} FC</strong>
            <small class="rs-fc-delta pos">+${inteiro(fc - fcBase)} sobre o personagem sem equipamento (${inteiro(fcBase)} FC)</small>
          </div>
          ${item.bonusConjunto ? `<div class="rs-set-box">${item.bonusConjunto.map(bonus => `<div class="small on">${escaparHtml(bonus)}</div>`).join("")}</div>` : ""}
          <h3 class="rs-equipado-title">Equipado</h3>
          <div class="rs-slots4">
            ${slots.map((slot) => {
              const index = itens.findIndex((peca) => peca.slot === slot);
              const peca = itens[index];
              if (!peca) return `<span class="rs-ibox tl-slot-vazio" title="${nomesSlots[slot]} vazio">—</span>`;
              return `<button type="button" class="rs-ibox rs-rbg-${peca.rarity} ${slot === slotAtivo ? "sel" : ""}" data-tl-selecionar-peca="${slot}" aria-pressed="${slot === slotAtivo}" aria-label="${escaparHtml(peca.name)}">
                <canvas data-tl-sprite="${item.id}" data-tl-peca="${index}" aria-hidden="true"></canvas>
                <span class="rs-gem-mark">${peca.gems.filter(Boolean).length}</span>
                <span class="rs-lv">${peca.itemLevel}</span>
              </button>`;
            }).join("")}
          </div>
        </section>
        <section class="rs-panel rs-attrs" aria-label="Atributos do personagem">
          <h2>Atributos</h2>
          <div class="rs-tiles">
            ${[
              ["Vida", inteiro(status.maxHp)], ["Ataque", decimal(status.atk)], ["Defesa", decimal(status.def)],
              ["ASPD bruta", formatadorDecimal2.format(status.aspd)], ["Crítico", `${decimal(status.crit)}%`],
              ["Dano crítico extra", `+${decimal(status.critDmg * 100)}%`],
            ].map(([rotulo, valor]) => `<div class="rs-tile"><span>${rotulo}</span><b>${valor}</b></div>`).join("")}
          </div>
          <h3 class="tl-ficha-atributos-titulo">Investidos</h3>
          ${listaAtributos([
            ["Força", atributos.str], ["Agilidade", atributos.agi], ["Vitalidade", atributos.vit],
            ["Defesa", atributos.def], ["Sorte", atributos.luk],
          ])}
          <h3 class="tl-ficha-atributos-titulo">Equipamento</h3>
          <div class="tl-ficha-equipamentos">
            ${itens.map((peca, index) => `
              <article class="tl-ficha-peca" data-tl-slot="${peca.slot}">
                <div class="tl-ficha-peca-topo">
                  <canvas data-tl-sprite="${item.id}" data-tl-peca="${index}" data-tl-escala="2" aria-hidden="true"></canvas>
                  <div>
                    <p class="note small">${nomesSlots[peca.slot]} · Nv. ${peca.itemLevel}</p>
                    <strong>${escaparHtml(peca.name)}</strong>
                  </div>
                </div>
                ${listaAtributos([
                  ["ATK", peca.atk], ["HP", peca.hp], ["DEF", peca.def], ["Crítico", `+${peca.crit} p.p.`], ["VEL", `+${peca.spd}%`],
                ])}
              </article>
            `).join("")}
          </div>
          <h3 class="tl-ficha-atributos-titulo">Gemas de ${escaparHtml(pecaAtiva.name)}</h3>
          <p class="note small">O tier e os engastes deste slot são compartilhados por todos os itens do ranking.</p>
          ${construirEditorEngastes({
            item: pecaAtiva, chavePeca: slotAtivo, engaste: engasteAtivo, prefixo: "tl", rolagem: 1,
          })}
          ${item.curvaEstimada ? '<p class="note small">Atributos do anel estimados para o nível de referência.</p>' : ""}
        </section>
      </div>
    </div>
  `;
}
