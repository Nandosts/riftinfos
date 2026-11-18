import { test } from "node:test";
import assert from "node:assert/strict";
import { prepararPublicacao } from "../../src/mercado/publicacao.mjs";

const coleta = () => ({
  formato: "riftinfos-mercado-v1",
  coletadoEm: new Date().toISOString(),
  totalInicial: 1,
  totalFinal: 1,
  token: "token-privado",
  saldo: 100,
  receitas: [{ chance: 0.8, ouro: 5000 }],
  regras: {
    taxa: 0.1,
    saldo: 50,
    faixas: [{ nome: "Gema tier 5 (cada)", minimo: 20, maximo: 500 }],
  },
  anuncios: [
    {
      id: "id-original-privado",
      nome: "Anel do Sanguessuga",
      categoria: "equipment",
      preco: 422,
      quantidade: 1,
      nivel: 402,
      raridade: 6,
      gemas: 1,
      vendedor: "meu-nick-original",
      meu: true,
      token: "outro-token-privado",
      atributos: { atk: 524, def: 393, hp: 2238, extra: "nao-exportar" },
      engastes: [
        {
          kind: "topaz",
          tier: 6,
          stat: "crit",
          value: 80,
          stat2: "spd",
          value2: 75,
          pct: false,
          pct2: false,
          dono: "minha-conta",
        },
      ],
    },
  ],
});

test("publicação só inclui campos permitidos e remove todos os dados da conta", () => {
  const resultado = prepararPublicacao(coleta());
  const texto = JSON.stringify(resultado);
  for (const segredo of [
    "token-privado",
    "saldo",
    "receitas",
    "meu-nick-original",
    "id-original-privado",
    '"meu"',
    "nao-exportar",
    "minha-conta",
  ])
    assert.ok(!texto.includes(segredo), segredo);
  assert.equal(resultado.anuncios[0].preco, 422);
  assert.equal(resultado.anuncios[0].vendedor, "Vendedor 1");
  assert.equal(resultado.anuncios[0].engastes[0].tier, 6);
  assert.equal(resultado.regras.faixas[0].minimo, 20);
});

test("vendedor repetido mantém grupo anônimo sem manter o identificador original", () => {
  const dados = coleta();
  dados.anuncios.push({ ...dados.anuncios[0], id: "outro-id" });
  dados.totalFinal = 2;
  assert.equal(prepararPublicacao(dados).anuncios[1].vendedor, "Vendedor 1");
});

test("coletas antigas, vazias inesperadamente ou com data futura não sobrescrevem o público", () => {
  for (const data of [
    "2020-01-01",
    "invalida",
    new Date(Date.now() + 120000).toISOString(),
  ])
    assert.throws(() => prepararPublicacao({ ...coleta(), coletadoEm: data }));
  assert.throws(() => prepararPublicacao({ ...coleta(), anuncios: [] }));
  assert.equal(
    prepararPublicacao({ ...coleta(), totalFinal: 0, anuncios: [] }).anuncios
      .length,
    0,
  );
});
