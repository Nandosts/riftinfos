import { test } from "node:test";
import assert from "node:assert/strict";
import {
  resumirPrecos,
  custoPrismatica,
  validarColeta,
} from "../../src/mercado/modelo.mjs";

const anuncio = (id, preco, resto = {}) => ({
  id: String(id),
  nome: "Anel do Sanguessuga",
  preco,
  nivel: 402,
  quantidade: 1,
  gemas: 0,
  vendedor: "outro",
  raridade: 6,
  ...resto,
});
test("separa raridade, nível, engastes, vendedor e anúncio próprio", () => {
  const linhas = [
    anuncio(1, 300),
    anuncio(2, 422, { vendedor: "nandosts", gemas: 1 }),
    anuncio(3, 100, { nivel: 100 }),
    anuncio(4, 500, { meu: true }),
    anuncio(5, 1000, { raridade: 4 }),
  ];
  const r = resumirPrecos(linhas, {
    nome: "Anel do Sanguessuga",
    nivel: 402,
    margem: 50,
    vendedor: "NANDOSTS",
    raridade: 6,
  });
  assert.equal(r.quantidade, 1);
  assert.equal(r.mediana, 300);
  assert.equal(
    resumirPrecos(linhas, {
      nome: "Anel do Sanguessuga",
      gemas: 1,
      vendedor: "nandosts",
    }).quantidade,
    0,
  );
});
test("normaliza pilhas por unidade e sinaliza outliers sem removê-los da tabela", () => {
  const dados = Array.from({ length: 9 }, (_, i) =>
    anuncio(i, 40, { quantidade: 2 }),
  );
  dados.push(anuncio(9, 9999));
  const r = resumirPrecos(dados, { nome: "Anel do Sanguessuga" });
  assert.equal(r.mediana, 20);
  assert.equal(r.media, 20);
  assert.equal(r.quantidade, 9);
  assert.equal(r.linhas.length, 10);
  assert.equal(r.atipicos, 1);
  assert.equal(
    resumirPrecos(dados, { nome: "Anel do Sanguessuga", incluirAtipicos: true })
      .quantidade,
    10,
  );
  assert.equal(
    resumirPrecos(dados.slice(8), { nome: "Anel do Sanguessuga" }).atipicos,
    0,
  );
});
test("custo esperado respeita falha, pergaminho e ouro em moedas separadas", () => {
  assert.deepEqual(custoPrismatica({ precoSuprema: 20, chance: 0.5 }), {
    cristais: 160,
    ouro: 0,
    supremas: 8,
    tentativas: 2,
    tentativas90: 4,
  });
  assert.equal(
    custoPrismatica({
      precoSuprema: 20,
      chance: 0.75,
      pergaminho: 10,
      ouro: 3000,
    }).cristais,
    120,
  );
  assert.equal(
    custoPrismatica({ precoSuprema: 20, chance: 0.75, ouro: 3000 }).ouro,
    4000,
  );
  assert.equal(
    custoPrismatica({ precoSuprema: 20, chance: 1 }).tentativas90,
    1,
  );
  for (const chance of [0, -1, 1.01, NaN])
    assert.throws(() => custoPrismatica({ precoSuprema: 20, chance }));
});
test("importação descarta anúncios inválidos, repetidos e expirados", () => {
  const r = validarColeta({
    formato: "riftinfos-mercado-v1",
    anuncios: [
      anuncio(1, 100),
      anuncio(1, 100),
      anuncio(2, -1),
      anuncio(3, 50, { expiraEm: "2020-01-01" }),
      anuncio(4, 50, { quantidade: 0 }),
    ],
  });
  assert.equal(r.anuncios.length, 1);
  assert.equal(r.descartados, 4);
  assert.throws(() => validarColeta({ anuncios: [] }));
});
