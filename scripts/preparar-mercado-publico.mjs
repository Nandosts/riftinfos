import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { prepararPublicacao } from "../src/mercado/publicacao.mjs";

const [entrada, saida] = process.argv.slice(2);
if (!entrada || !saida)
  throw new Error(
    "Uso: node scripts/preparar-mercado-publico.mjs arquivo-privado.json arquivo-publico.json",
  );
const texto = await readFile(entrada, "utf8");
if (Buffer.byteLength(texto) > 15000000)
  throw new Error("A consulta excede 15 MB.");
const dados = prepararPublicacao(JSON.parse(texto));
await mkdir(dirname(resolve(saida)), { recursive: true });
await writeFile(saida, JSON.stringify(dados, null, 2) + "\n");
console.log(
  `${dados.anuncios.length} anúncios anonimizados preparados em ${resolve(saida)}.`,
);
