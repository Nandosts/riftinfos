import { validarColeta } from "./modelo.mjs";

const tipos = new Set(["topaz", "ruby", "sapphire", "emerald", "amethyst"]);
const textoPublico = (s) =>
  typeof s === "string" &&
  s.length <= 250 &&
  !/bearer\s|eyJ[A-Za-z0-9_-]{20,}\./i.test(s);

export function prepararPublicacao(arquivo) {
  const coleta = validarColeta(arquivo);
  if (!Number.isFinite(Date.parse(coleta.coletadoEm)))
    throw new Error("A consulta não tem data válida.");
  if (!Number.isInteger(coleta.totalFinal) || coleta.totalFinal < 0)
    throw new Error("A consulta não informa o total de anúncios.");
  if (coleta.anuncios.length === 0 && coleta.totalFinal > 0)
    throw new Error(
      "A coleta não trouxe anúncios válidos. A cópia pública não será substituída.",
    );
  if (
    Date.now() - Date.parse(coleta.coletadoEm) > 3600000 ||
    Date.parse(coleta.coletadoEm) > Date.now() + 60000
  )
    throw new Error(
      "Refaça a coleta: publique uma consulta com menos de uma hora.",
    );
  const vendedores = new Map();
  const anuncios = coleta.anuncios.map((a, i) => {
    if (!textoPublico(a.nome))
      throw new Error("Há um nome de item inesperado no arquivo.");
    if (!vendedores.has(a.vendedor))
      vendedores.set(a.vendedor, `Vendedor ${vendedores.size + 1}`);
    const atributos = Object.fromEntries(
      ["atk", "def", "hp", "crit", "spd"]
        .filter((k) => Number.isFinite(a.atributos?.[k]))
        .map((k) => [k, a.atributos[k]]),
    );
    const engastes = (Array.isArray(a.engastes) ? a.engastes : [])
      .slice(0, 6)
      .map((g) => {
        const tipo = g.kind || g.type;
        if (
          !tipos.has(tipo) ||
          !Number.isInteger(g.tier) ||
          g.tier < 1 ||
          g.tier > 6
        )
          throw new Error("Uma gema tem formato inesperado.");
        const gema = { kind: tipo, tier: g.tier };
        for (const k of ["stat", "stat2"])
          if (["atk", "def", "hp", "crit", "spd"].includes(g[k]))
            gema[k] = g[k];
        for (const k of ["value", "value2"])
          if (Number.isFinite(g[k])) gema[k] = g[k];
        for (const k of ["pct", "pct2"])
          if (typeof g[k] === "boolean") gema[k] = g[k];
        return gema;
      });
    return {
      id: `oferta-${i + 1}`,
      nome: a.nome,
      categoria: ["equip", "equipment", "gem", "scroll", "cosmetic"].includes(
        a.categoria,
      )
        ? a.categoria
        : "equipment",
      preco: a.preco,
      quantidade: a.quantidade,
      nivel: a.nivel,
      raridade: Number.isInteger(a.raridade) ? a.raridade : null,
      vendedor: vendedores.get(a.vendedor),
      expiraEm: a.expiraEm ? new Date(a.expiraEm).toISOString() : null,
      gemas: a.gemas,
      tipoGema: tipos.has(a.tipoGema) ? a.tipoGema : null,
      atributos,
      engastes,
    };
  });
  return {
    formato: "riftinfos-mercado-v1",
    publico: true,
    coletadoEm: coleta.coletadoEm,
    publicadoEm: new Date().toISOString(),
    totalInicial: Number.isInteger(coleta.totalInicial)
      ? coleta.totalInicial
      : coleta.totalFinal,
    totalFinal: coleta.totalFinal,
    anuncios,
    regras: {
      taxa:
        Number.isFinite(coleta.regras?.taxa) &&
        coleta.regras.taxa >= 0 &&
        coleta.regras.taxa < 1
          ? coleta.regras.taxa
          : null,
      faixas: (Array.isArray(coleta.regras?.faixas) ? coleta.regras.faixas : [])
        .filter(
          (r) =>
            textoPublico(r.nome) &&
            Number.isFinite(r.minimo) &&
            Number.isFinite(r.maximo) &&
            r.minimo >= 0 &&
            r.maximo >= r.minimo,
        )
        .map((r) => ({ nome: r.nome, minimo: r.minimo, maximo: r.maximo })),
    },
  };
}
