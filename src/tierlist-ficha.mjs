import { nomesClasses, nomesSlots } from "./dados.mjs";
import { escaparHtml, formatadorDecimal1, formatadorDecimal2, formatadorInteiro, formatarGemaTexto } from "./formato.mjs";

function listaAtributos(atributos) {
  return `<dl class="tl-ficha-atributos">${atributos.map(([rotulo, valor]) => `
    <div><dt>${rotulo}</dt><dd>${valor}</dd></div>
  `).join("")}</dl>`;
}

export function renderizarFichaFc(item, nivel, atributos) {
  const { classe, itens, status, fc, fcBase } = item.referenciaFc;
  const inteiro = (n) => formatadorInteiro.format(n);
  const decimal = (n) => formatadorDecimal1.format(n);
  const rotuloEquipamento = item.categoria === "ring" ? "Apenas o anel equipado" : "Conjunto 3/3 equipado · Sem anel";
  return `
    <div class="tl-ficha-fc">
      <div class="tl-ficha-cabecalho">
        <div>
          <h3 class="tl-detalhe-titulo">${escaparHtml(item.nome)}</h3>
          <p class="note small">${nomesClasses[classe]} · Nível ${nivel} · ${rotuloEquipamento}</p>
        </div>
        <div class="tl-ficha-total">
          <strong>${inteiro(fc)} FC</strong>
          <span class="small">+${inteiro(fc - fcBase)} sobre o personagem sem equipamento (${inteiro(fcBase)} FC)</span>
        </div>
      </div>
      <div class="tl-ficha-paineis">
        <div class="tl-ficha-bloco">
          <h4>Atributos investidos</h4>
          ${listaAtributos([
            ["Força", atributos.str], ["Agilidade", atributos.agi], ["Vitalidade", atributos.vit],
            ["Defesa", atributos.def], ["Sorte", atributos.luk],
          ])}
        </div>
        <div class="tl-ficha-bloco">
          <h4>Status com equipamento</h4>
          ${listaAtributos([
            ["ATK", decimal(status.atk)], ["HP", inteiro(status.maxHp)], ["DEF", decimal(status.def)],
            ["ASPD bruta", formatadorDecimal2.format(status.aspd)],
            ["Crítico", `${decimal(status.crit)}%`], ["Dano crítico extra", `+${decimal(status.critDmg * 100)}%`],
          ])}
        </div>
      </div>
      <h4>Equipamento e gemas</h4>
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
            <p class="small"><strong>${peca.gems.length}× ${escaparHtml(peca.gems[0].name)}</strong><br>
              ${escaparHtml(formatarGemaTexto(peca.gems[0]))} por gema · Rolagem 100%</p>
          </article>
        `).join("")}
      </div>
      ${item.bonusConjunto ? `<ul class="tl-detalhe-lista">${item.bonusConjunto.map(bonus => `<li>${escaparHtml(bonus)}</li>`).join("")}</ul>` : ""}
      ${item.curvaEstimada ? '<p class="note small">Atributos do anel estimados para o nível de referência.</p>' : ""}
    </div>
  `;
}
