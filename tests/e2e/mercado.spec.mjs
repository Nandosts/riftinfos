import { test, expect } from "@playwright/test";
import { prepararPagina } from "./helpers/ambiente.mjs";

test("mercado importa ofertas, exclui próprio vendedor e calcula risco do craft", async ({
  page,
}, testInfo) => {
  const coleta = {
    formato: "riftinfos-mercado-v1",
    coletadoEm: new Date().toISOString(),
    totalInicial: 2,
    totalFinal: 2,
    regras: { taxa: 0.1 },
    anuncios: [
      {
        id: "1",
        nome: "Anel do Sanguessuga",
        preco: 300,
        quantidade: 1,
        nivel: 393,
        gemas: 0,
        vendedor: "Outro",
      },
      {
        id: "2",
        nome: "Anel do Sanguessuga",
        preco: 422,
        quantidade: 1,
        nivel: 402,
        gemas: 1,
        vendedor: "nandosts",
      },
    ],
  };
  await page.route("**/dados/mercado.json", (route) =>
    route.fulfill({ json: coleta }),
  );
  const { erros } = await prepararPagina(page, "/mercado.html");
  await expect(page.locator("#estado-coleta")).toContainText(
    "2 anúncios válidos",
  );
  await expect(page.getByText("Baixar extensão de consulta")).toHaveCount(0);
  await page.locator("#arquivo-mercado").setInputFiles({
    name: "mercado.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(coleta)),
  });
  await expect(page.locator("#estado-coleta")).toContainText(
    "2 anúncios válidos",
  );
  await page.fill("#mercado-vendedor", "nandosts");
  await page.fill("#mercado-preco", "422");
  await page
    .locator("#filtros-mercado")
    .getByRole("button", { name: "Calcular", exact: true })
    .click();
  await expect(page.locator("#mercado-linhas tr")).toHaveCount(1);
  await expect(page.locator("#mercado-resumo")).toContainText("380");
  await expect(page.locator("#mercado-resumo")).toContainText(
    "Poucos anúncios",
  );
  await page.fill("#craft-chance", "50");
  await page.getByRole("button", { name: "Calcular custo esperado" }).click();
  await expect(page.locator("#craft-resultado")).toContainText("160 cristais");
  await expect(page.locator("#craft-resultado")).toContainText("4 tentativas");
  const largura = await page.evaluate(() => ({
    tela: innerWidth,
    pagina: document.documentElement.scrollWidth,
  }));
  expect(largura.pagina).toBeLessThanOrEqual(largura.tela);
  await page.screenshot({
    path: `/tmp/riftinfos-mercado-${testInfo.project.name}.png`,
    fullPage: true,
  });
  expect(erros).toEqual([]);
});
