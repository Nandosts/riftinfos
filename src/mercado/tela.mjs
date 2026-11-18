import { validarColeta, resumirPrecos, custoPrismatica } from "./modelo.mjs";
import { escaparHtml } from "../formato.mjs";

const $ = (id) => document.getElementById(id);
const numero = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });
const fmt = (n) => (n == null ? "Sem dados" : numero.format(n));
let coleta = null;
const esc = (s) => escaparHtml(String(s ?? ""));

function calcular() {
  if (!coleta || !$("filtros-mercado").reportValidity()) return;
  const nome = $("mercado-item").value;
  const gemas = $("mercado-gemas").value;
  const raridade = $("mercado-raridade").value;
  const engaste = $("mercado-engaste").value.split(":");
  const resumo = resumirPrecos(coleta.anuncios, {
    nome,
    nivel: Number($("mercado-nivel").value),
    margem: Number($("mercado-margem").value),
    vendedor: $("mercado-vendedor").value.trim(),
    gemas: gemas === "" ? null : Number(gemas),
    incluirAtipicos: $("mercado-atipicos").checked,
    raridade: raridade === "" ? null : Number(raridade),
    gema:
      engaste.length === 2
        ? { tipo: engaste[0], tier: Number(engaste[1]) }
        : null,
  });
  const preco = Number($("mercado-preco").value);
  const taxa = coleta.regras?.taxa;
  const liquido =
    preco > 0 && Number.isFinite(taxa) && taxa >= 0 && taxa < 1
      ? preco - Math.floor(preco * taxa)
      : null;
  $("mercado-resumo").innerHTML = `
    <p class="mercado-alerta">${resumo.quantidade < 5 ? "Poucos anúncios comparáveis. Não há base para cravar o valor do item." : "Use a mediana como referência de oferta, não como garantia de venda."} ${resumo.atipicos} preço(s) sinalizado(s). Os atributos e engastes podem explicar parte das diferenças.</p>
    <div class="mercado-metricas">${[
      ["Anúncios usados", resumo.quantidade],
      ["Mediana / unidade", resumo.mediana],
      ["Média / unidade", resumo.media],
      ["Menor preço", resumo.minimo],
    ]
      .map(
        ([label, value]) => `<div>${label}<strong>${fmt(value)}</strong></div>`,
      )
      .join("")}</div>
    <p>Faixa central: ${fmt(resumo.p25)} a ${fmt(resumo.p75)} cristais. ${liquido !== null ? `Ao anunciar por ${fmt(preco)}, você recebe ${fmt(liquido)} após a taxa de ${fmt(taxa * 100)}% se vender.` : "Informe seu preço para calcular o líquido. A taxa precisa estar presente na coleta."}</p>
  `;
  $("mercado-linhas").innerHTML = resumo.linhas
    .map(
      (a) =>
        `<tr><td>${esc(a.nome)}</td><td>${fmt(a.nivel)}</td><td>${a.gemas}</td><td>${esc(a.vendedor)}</td><td>${fmt(a.unitario)}</td><td>${a.atipico ? "Fora da curva" : "Comparável"}</td><td><details><summary>Ver peça</summary><pre>${esc(JSON.stringify({ atributos: a.atributos || {}, engastes: a.engastes || [] }, null, 2))}</pre></details></td></tr>`,
    )
    .join("");
}

function mostrarReceita() {
  const tipo = $("craft-tipo").value;
  $("craft-chance").value = "";
  $("craft-ouro").value = "";
  $("craft-resultado").textContent = "";
  const receita = coleta?.receitas?.find((r) => r.tipo === tipo);
  if (
    receita &&
    Number.isFinite(receita.chance) &&
    receita.chance > 0 &&
    receita.chance <= 1
  )
    $("craft-chance").value = String(Math.round(receita.chance * 10000) / 100);
  if (Number.isFinite(receita?.ouro) && receita.ouro >= 0)
    $("craft-ouro").value = receita.ouro;
  const ofertas = (coleta?.anuncios || []).filter(
    (a) =>
      a.categoria === "gem" &&
      a.tipoGema === tipo &&
      a.nivel === 5 &&
      !a.meu &&
      a.vendedor.toLowerCase() !==
        $("mercado-vendedor").value.trim().toLowerCase(),
  );
  const unitarios = ofertas.map((a) => a.preco / a.quantidade);
  const faixas = coleta?.regras?.faixas || [];
  const faixaSuprema = faixas.find((r) => r.nome === "Gema tier 5 (cada)");
  if (Number.isFinite(faixaSuprema?.minimo) && faixaSuprema.minimo >= 0)
    $("craft-piso").value = faixaSuprema.minimo;
  $("craft-origem").textContent =
    `${receita?.chance ? "Chance recebida do jogo para a gema selecionada. Confira bônus e eventos antes de usar." : "Sem chance confirmada na coleta para esta gema. Informe a chance mostrada no jogo."} ${ofertas.length ? `${ofertas.length} oferta(s) de Suprema: menor preço unitário de ${fmt(Math.min(...unitarios))} cristais. O campo de custo continua sob sua escolha.` : "Nenhuma oferta comparável de Suprema nesta coleta."} Faixas recebidas do mercado: ${faixas.length ? faixas.map((r) => `${r.nome}: ${fmt(r.minimo)}–${fmt(r.maximo)}`).join("; ") : "não disponíveis; piso inicial de 20 informado pelo nando_sts"}. Ouro não é convertido em cristais.`;
}

function carregarColeta(dados) {
  try {
    const nova = validarColeta(dados);
    if (!Number.isFinite(Date.parse(nova.coletadoEm)))
      throw new Error("O arquivo não tem data de coleta válida.");
    coleta = nova;
    const nomes = [...new Set(coleta.anuncios.map((a) => a.nome))].sort(
      (a, b) => a.localeCompare(b, "pt-BR"),
    );
    $("mercado-item").replaceChildren(
      ...nomes.map((nome) => new Option(nome, nome)),
    );
    const nomesGemas = {
      topaz: "Topázio",
      ruby: "Rubi",
      sapphire: "Safira",
      emerald: "Esmeralda",
      amethyst: "Ametista",
    };
    const engastes = [
      ...new Set(
        coleta.anuncios.flatMap((a) =>
          Array.isArray(a.engastes)
            ? a.engastes.map((g) => `${g.kind || g.type}:${g.tier}`)
            : [],
        ),
      ),
    ].filter((s) => /^(topaz|ruby|sapphire|emerald|amethyst):[1-6]$/.test(s));
    $("mercado-engaste").replaceChildren(
      new Option("Qualquer tipo / tier", ""),
      ...engastes.map((s) => {
        const [tipo, tier] = s.split(":");
        return new Option(`${nomesGemas[tipo]} T${tier}`, s);
      }),
    );
    if (nomes.includes("Anel do Sanguessuga"))
      $("mercado-item").value = "Anel do Sanguessuga";
    $("estado-coleta").textContent =
      `${coleta.anuncios.length} anúncios válidos. Coleta de ${new Date(coleta.coletadoEm).toLocaleString("pt-BR")}. ${coleta.descartados} expirado(s), duplicado(s) ou inválido(s) descartado(s). ${coleta.totalInicial !== coleta.totalFinal ? "O total mudou durante a consulta; pode haver anúncios que entraram ou saíram." : "A paginação pode mudar enquanto o mercado recebe anúncios."} ${coleta.anuncios.length < coleta.totalFinal ? "A amostra é menor que o total informado pelo mercado." : ""} ${Date.now() - Date.parse(coleta.coletadoEm) > 3600000 ? "Esta coleta tem mais de uma hora. Atualize antes de decidir um preço." : ""}`;
    mostrarReceita();
    calcular();
  } catch (erro) {
    coleta = null;
    $("estado-coleta").textContent =
      `Não foi possível importar: ${erro.message}`;
    $("mercado-resumo").textContent = "";
    $("mercado-linhas").textContent = "";
    $("mercado-item").replaceChildren(new Option("Importe uma consulta", ""));
    $("craft-resultado").textContent = "";
  }
}
$("arquivo-mercado").addEventListener("change", async (evento) => {
  try {
    const arquivo = evento.target.files[0];
    if (!arquivo) return;
    if (arquivo.size > 15000000)
      throw new Error("O arquivo deve ter até 15 MB.");
    carregarColeta(JSON.parse(await arquivo.text()));
  } catch (erro) {
    $("estado-coleta").textContent = erro.message;
  }
});
async function atualizarConsulta() {
  $("atualizar-mercado").disabled = true;
  try {
    const resposta = await fetch(
      new URL("../../dados/mercado.json", import.meta.url),
      { cache: "no-store", signal: AbortSignal.timeout(12000) },
    );
    if (resposta.status === 404)
      throw new Error(
        "A primeira consulta do mercado ainda não foi publicada.",
      );
    if (!resposta.ok)
      throw new Error(
        "Não foi possível atualizar agora. A consulta anterior permanece disponível.",
      );
    carregarColeta(await resposta.json());
  } catch (erro) {
    $("estado-coleta").textContent =
      erro.message || "Falha ao atualizar a consulta.";
  } finally {
    $("atualizar-mercado").disabled = false;
  }
}
$("atualizar-mercado").addEventListener("click", atualizarConsulta);
void atualizarConsulta();
$("filtros-mercado").addEventListener("submit", (e) => {
  e.preventDefault();
  calcular();
});
$("mercado-item").addEventListener("change", () => {
  const anuncio = coleta?.anuncios.find(
    (a) => a.nome === $("mercado-item").value,
  );
  if (anuncio) $("mercado-nivel").value = anuncio.nivel;
  calcular();
});
$("craft-tipo").addEventListener("change", mostrarReceita);
$("mercado-vendedor").addEventListener("change", mostrarReceita);
$("craft-mercado").addEventListener("submit", (e) => {
  e.preventDefault();
  try {
    const precoSuprema = Number($("craft-suprema").value);
    const custo = custoPrismatica({
      precoSuprema,
      chance: Number($("craft-chance").value) / 100,
      pergaminho: Number($("craft-pergaminho").value),
      ouro: Number($("craft-ouro").value),
    });
    $("craft-resultado").textContent =
      `${precoSuprema < Number($("craft-piso").value) ? "Atenção: o custo informado está abaixo do piso anunciado que você definiu. Pode representar material próprio, não uma compra pelo mercado. " : ""}Custo esperado por Prismática: ${fmt(custo.cristais)} cristais + ${$("craft-ouro").value === "" ? "ouro não informado" : `${fmt(custo.ouro)} ouro`}. Média de ${fmt(custo.supremas)} Supremas em ${fmt(custo.tentativas)} tentativa(s). Um orçamento para ${custo.tentativas90} tentativas dá pelo menos 90% de chance de um sucesso; ${Number($("craft-chance").value) < 100 ? "ainda pode falhar" : "com 100%, a primeira tentativa tem sucesso no modelo"}. Esse custo não é garantia de preço de revenda.`;
  } catch (erro) {
    $("craft-resultado").textContent = erro.message;
  }
});
