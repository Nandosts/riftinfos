import { rotulosStats } from "./dados.mjs";

const formatadorInteiro = new Intl.NumberFormat("pt-BR");
const formatadorPercentual = new Intl.NumberFormat("pt-BR", {
  style: "percent",
  maximumFractionDigits: 1,
});
const formatadorDecimal1 = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });
const formatadorDecimal2 = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });

function escaparHtml(valor) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatarNumeroCompacto(valor) {
  const n = Number(valor) || 0;
  if (n >= 1e9) return `${(n / 1e9).toFixed(2).replace(".", ",")}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2).replace(".", ",")}M`;
  if (n >= 1e4) return `${(n / 1e3).toFixed(1).replace(".", ",")}K`;
  return formatadorInteiro.format(Math.round(n));
}

function formatarDuracaoSegundos(seg) {
  const s = Math.max(0, Math.round(Number(seg) || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h >= 24) {
    const d = Math.floor(h / 24);
    const rh = h % 24;
    return `${d}d ${rh}h`;
  }
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
}

function formatarGemaTexto(gema) {
  const partes = [];
  if (gema.stat && gema.value) {
    const sufixo = gema.pct ? "%" : "";
    const valor = gema.pct ? (gema.value / 10).toFixed(1).replace(".", ",") : gema.value;
    partes.push(`+${valor}${sufixo} ${rotulosStats[gema.stat] || gema.stat.toUpperCase()}`);
  }
  if (gema.stat2 && gema.value2) {
    const sufixo = gema.pct2 ? "%" : "";
    const valor = gema.pct2 ? (gema.value2 / 10).toFixed(1).replace(".", ",") : gema.value2;
    partes.push(`+${valor}${sufixo} ${rotulosStats[gema.stat2] || gema.stat2.toUpperCase()}`);
  }
  return partes.join(" · ") || "Atributo";
}

export {
  escaparHtml,
  formatadorDecimal1,
  formatadorDecimal2,
  formatadorInteiro,
  formatadorPercentual,
  formatarDuracaoSegundos,
  formatarGemaTexto,
  formatarNumeroCompacto,
};
