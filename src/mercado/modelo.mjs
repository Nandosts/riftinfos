export function quantil(valores, p) {
  if (!valores.length) return null;
  const ordenados = [...valores].sort((a, b) => a - b);
  const posicao = (ordenados.length - 1) * p;
  const indice = Math.floor(posicao);
  return (
    ordenados[indice] +
    (ordenados[Math.ceil(posicao)] - ordenados[indice]) * (posicao - indice)
  );
}

export function validarColeta(dados) {
  if (
    dados?.formato !== "riftinfos-mercado-v1" ||
    !Array.isArray(dados.anuncios) ||
    dados.anuncios.length > 10000
  ) {
    throw new Error(
      "Escolha um arquivo exportado pela extensão Mercado do RiftInfos (até 10 mil anúncios).",
    );
  }
  const ids = new Set();
  const anuncios = dados.anuncios.filter((a) => {
    if (
      !a ||
      typeof a.id !== "string" ||
      ids.has(a.id) ||
      typeof a.nome !== "string" ||
      a.nome.length > 250 ||
      !Number.isFinite(a.preco) ||
      a.preco <= 0 ||
      !Number.isInteger(a.quantidade) ||
      a.quantidade < 1 ||
      !Number.isFinite(a.nivel) ||
      a.nivel < 0 ||
      !Number.isInteger(a.gemas) ||
      a.gemas < 0 ||
      a.gemas > 6
    )
      return false;
    ids.add(a.id);
    return (
      !a.expiraEm ||
      (Number.isFinite(Date.parse(a.expiraEm)) &&
        Date.parse(a.expiraEm) > Date.now())
    );
  });
  return {
    ...dados,
    anuncios: anuncios.map((a) => ({
      ...a,
      vendedor: String(a.vendedor || ""),
      categoria: String(a.categoria || ""),
      tipoGema: String(a.tipoGema || ""),
    })),
    descartados: dados.anuncios.length - anuncios.length,
  };
}

export function resumirPrecos(
  anuncios,
  {
    nome,
    nivel,
    margem = 50,
    vendedor = "",
    gemas = null,
    gema = null,
    raridade = null,
    incluirAtipicos = false,
  } = {},
) {
  const normalizar = (s) =>
    String(s || "")
      .trim()
      .toLocaleLowerCase("pt-BR");
  const comparaveis = anuncios.filter(
    (a) =>
      normalizar(a.nome) === normalizar(nome) &&
      !a.meu &&
      (!vendedor || normalizar(a.vendedor) !== normalizar(vendedor)) &&
      (nivel == null || Math.abs(a.nivel - nivel) <= margem) &&
      (gemas == null || a.gemas === gemas) &&
      (raridade == null || a.raridade === raridade) &&
      (!gema ||
        (Array.isArray(a.engastes) &&
          a.engastes.some(
            (g) => (g.kind || g.type) === gema.tipo && g.tier === gema.tier,
          ))),
  );
  const precos = comparaveis.map((a) => a.preco / a.quantidade);
  const medianaBruta = quantil(precos, 0.5);
  const q1 = quantil(precos, 0.25);
  const q3 = quantil(precos, 0.75);
  const intervalo = q3 - q1;
  const linhas = comparaveis.map((a) => {
    const unitario = a.preco / a.quantidade;
    const atipico =
      precos.length >= 8 &&
      (intervalo === 0
        ? unitario !== medianaBruta
        : unitario < q1 - 1.5 * intervalo || unitario > q3 + 1.5 * intervalo);
    return { ...a, unitario, atipico };
  });
  const usados = linhas
    .filter((a) => incluirAtipicos || !a.atipico)
    .map((a) => a.unitario);
  return {
    linhas,
    quantidade: usados.length,
    atipicos: linhas.filter((a) => a.atipico).length,
    mediana: quantil(usados, 0.5),
    p25: quantil(usados, 0.25),
    p75: quantil(usados, 0.75),
    media: usados.length
      ? usados.reduce((a, b) => a + b, 0) / usados.length
      : null,
    minimo: usados.length ? Math.min(...usados) : null,
  };
}

export function custoPrismatica({
  precoSuprema,
  chance,
  pergaminho = 0,
  ouro = 0,
}) {
  if (
    ![precoSuprema, chance, pergaminho, ouro].every(Number.isFinite) ||
    precoSuprema < 0 ||
    chance <= 0 ||
    chance > 1 ||
    pergaminho < 0 ||
    ouro < 0
  ) {
    throw new Error(
      "Informe um preço válido e a chance final de sucesso entre 0 e 100%.",
    );
  }
  return {
    cristais: (4 * precoSuprema + pergaminho) / chance,
    ouro: ouro / chance,
    supremas: 4 / chance,
    tentativas: 1 / chance,
    tentativas90:
      chance === 1 ? 1 : Math.ceil(Math.log(0.1) / Math.log(1 - chance)),
  };
}
