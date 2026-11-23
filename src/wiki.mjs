import { gerarSvgFragmento } from "./alquimia.mjs";
import { coresRaridade, nomesClasses, nomesRaridade, nomesSlots } from "./dados.mjs";
import { escaparHtml } from "./formato.mjs";
import { estagiosAparencia, montarCatalogoWiki } from "./wiki-catalogo.mjs";

const sprites = window.RiftSprites;
const catalogo = montarCatalogoWiki(sprites?.catalogoKindsOficial);
const itens = document.querySelector("#wiki-itens");
const status = document.querySelector("#wiki-status");
const filtros = document.querySelector("#wiki-filtros");
const busca = document.querySelector("#wiki-busca");
const categoria = document.querySelector("#wiki-categoria");
const classe = document.querySelector("#wiki-classe");
const raridade = document.querySelector("#wiki-raridade");
const nomesCategoria = { ...nomesSlots, gem: "Gema", consumable: "Consumível", fragment: "Fragmento" };

function normalizar(valor) {
  return valor.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

function renderizarIcone(item, tier = 3) {
  if (item.imagem) return `<img src="${item.imagem}" width="40" height="40" alt="" loading="lazy">`;
  if (item.slot === "fragment") {
    return gerarSvgFragmento(item.peca, item.rarity, { tamanho: 40 });
  }
  return `<canvas data-wiki-tier="${tier}" width="48" height="48" aria-hidden="true"></canvas>`;
}

function desenharIcones(raiz, item) {
  if (!sprites) return;
  for (const canvas of raiz.querySelectorAll("canvas[data-wiki-tier]")) {
    if (item.slot === "gem") sprites.desenharIconeGema(canvas, item.tipo, item.gemTier);
    else sprites.desenharIconeItem(canvas, { ...item, tier: Number(canvas.dataset.wikiTier) }, item.classe);
  }
}

function renderizarDetalhe(item) {
  const detalhes = [item.detalhe, item.obtencao, item.notaVisual].filter(Boolean).map((texto) => `<p>${escaparHtml(texto)}</p>`);
  if (item.temEstagios) {
    detalhes.push(`<ul class="wiki-visuais">${estagiosAparencia.map(({ tier, nome, niveis }) => `
      <li>${renderizarIcone(item, tier)}<strong>${nome}</strong><span class="note small">${niveis}</span></li>
    `).join("")}</ul>`);
  }
  return detalhes.join("");
}

function renderizarCatalogo() {
  const termos = normalizar(busca.value.trim()).split(/\s+/).filter(Boolean);
  const resultados = catalogo.filter((item) =>
    (!categoria.value || categoria.value === item.slot) &&
    (!classe.value || !item.classe || classe.value === item.classe) &&
    (!raridade.value || Number(raridade.value) === item.rarity) &&
    termos.every((termo) => normalizar([item.nome, item.conjunto, item.buscaExtra].filter(Boolean).join(" ")).includes(termo))
  );
  const itensPorId = new Map(resultados.map((item) => [item.id, item]));
  status.textContent = resultados.length ? `${resultados.length} ${resultados.length === 1 ? "item" : "itens"}` : "Nenhum item encontrado.";
  itens.innerHTML = resultados.map((item) => {
    const rotulo = [
      nomesCategoria[item.slot], nomesClasses[item.classe], nomesRaridade[item.rarity],
      item.gemTier && `T${item.gemTier}`, item.conjunto,
    ].filter(Boolean).join(" · ");
    const topo = `${renderizarIcone(item)}<span>
      <strong class="wiki-item-cor" style="--wiki-cor:${coresRaridade[item.rarity] || "var(--text)"}">${escaparHtml(item.nome)}</strong>
      <small>${escaparHtml(rotulo)}</small>
    </span>`;
    return `<details class="wiki-item" data-wiki-id="${escaparHtml(item.id)}"><summary>${topo}</summary><div class="wiki-detalhe"></div></details>`;
  }).join("");

  for (const card of itens.children) {
    const item = itensPorId.get(card.dataset.wikiId);
    desenharIcones(card, item);
    card.addEventListener("toggle", () => {
      const detalhe = card.querySelector(".wiki-detalhe");
      if (!card.open || detalhe.hasChildNodes()) return;
      detalhe.innerHTML = renderizarDetalhe(item);
      desenharIcones(detalhe, item);
    });
  }
}

document.querySelector("#wiki-estagios").innerHTML = estagiosAparencia.map(({ nome, niveis }) =>
  `<li><strong>${nome}</strong><span class="note small">${niveis}</span></li>`
).join("");
raridade.insertAdjacentHTML("beforeend", nomesRaridade.map((nome, id) => `<option value="${id}">${nome}</option>`).join(""));
filtros.addEventListener("submit", (evento) => evento.preventDefault());
filtros.addEventListener("input", renderizarCatalogo);
renderizarCatalogo();
