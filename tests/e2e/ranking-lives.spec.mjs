import { test, expect } from "@playwright/test";
import { prepararPagina, verificarSemOverflowHorizontal } from "./helpers/ambiente.mjs";

test.describe("Ranking de Lives & Comunidade", () => {
  test("carrega ranking.html com canal da URL, card do streamer e tabela com badges de fidelidade", async ({ page }) => {
    const { erros, controleApi } = await prepararPagina(page, "/ranking.html?canal=belky");

    await expect(page.locator("h1")).toContainText("Ranking da Live");
    await expect(page.locator("#card-info-canal")).toBeVisible();
    await expect(page.locator("#card-info-canal")).toContainText("Belky");

    // Tabela com jogadores do mock
    const tabela = page.locator("#corpo-tabela-ranking");
    await expect(tabela.locator("tr")).toHaveCount(3);
    await expect(tabela).toContainText("Halscriolo");
    await expect(tabela).toContainText("Nando");

    // Halscriolo tem topChannel belky no mock -> deve mostrar badge ⭐ Fiel
    const linhaHalscriolo = tabela.locator("tr", { hasText: "Halscriolo" });
    await expect(linhaHalscriolo.locator(".badge-fiel")).toBeVisible();

    // Nando tem topChannel kick:nando no mock -> deve mostrar que é turista
    const linhaNando = tabela.locator("tr", { hasText: "Nando" }).first();
    await expect(linhaNando.locator(".badge-turista")).toBeVisible();

    expect(controleApi.rotasInesperadas).toEqual([]);
    expect(erros).toEqual([]);
  });

  test("filtros de classe, plataforma Kick/Twitch, FC mínimo e busca por nome", async ({ page }) => {
    await prepararPagina(page, "/ranking.html?canal=belky");
    const tabela = page.locator("#corpo-tabela-ranking");

    // 1. Filtro por Classe (Arqueiro)
    await page.selectOption("#select-ranking-classe", "archer");
    await expect(tabela.locator("tr")).toHaveCount(1);
    await expect(tabela).toContainText("Nando");

    // Volta para todas as classes
    await page.selectOption("#select-ranking-classe", "");
    await expect(tabela.locator("tr")).toHaveCount(3);

    // 2. Filtro por Plataforma (Kick)
    await page.selectOption("#select-ranking-plat", "kick");
    await expect(tabela.locator("tr")).toHaveCount(1);
    await expect(tabela).toContainText("Nando Kick");

    // Volta para todas
    await page.selectOption("#select-ranking-plat", "");
    await expect(tabela.locator("tr")).toHaveCount(3);

    // 3. Filtro por FC Mínimo (chip 100M+)
    await page.fill("#input-ranking-min-fc", "190000000");
    await expect(tabela.locator("tr")).toHaveCount(1);
    await expect(tabela).toContainText("Halscriolo");

    // 4. Limpar Filtros
    await page.click("#btn-ranking-limpar-filtros");
    await expect(tabela.locator("tr")).toHaveCount(3);
  });

  test("filtro de fidelidade '⭐ Apenas Fiéis da Live' isola membros da comunidade", async ({ page }) => {
    await prepararPagina(page, "/ranking.html?canal=belky");
    const tabela = page.locator("#corpo-tabela-ranking");

    await expect(tabela.locator("tr")).toHaveCount(3);

    // Ativa o filtro de fidelidade
    await page.check("#check-ranking-fiel");

    // Apenas Halscriolo (cujo canal principal é Belky) permanece
    await expect(tabela.locator("tr")).toHaveCount(1);
    await expect(tabela).toContainText("Halscriolo");
    await expect(tabela.locator(".badge-fiel")).toBeVisible();

    // Desativa o filtro de fidelidade
    await page.uncheck("#check-ranking-fiel");
    await expect(tabela.locator("tr")).toHaveCount(3);
  });

  test("ordenação crescente e decrescente", async ({ page }) => {
    await prepararPagina(page, "/ranking.html?canal=belky");
    const tabela = page.locator("#corpo-tabela-ranking");

    // Padrão decrescente: Halscriolo (195M) primeiro, Nando Kick (85M) por último
    await expect(tabela.locator("tr").first()).toContainText("Halscriolo");
    await expect(tabela.locator("tr").last()).toContainText("Nando Kick");

    // Alterna para crescente
    await page.click("#btn-ranking-sentido-ordem");
    await expect(page.locator("#btn-ranking-sentido-ordem")).toContainText("Crescente");
    await expect(tabela.locator("tr").first()).toContainText("Nando Kick");
    await expect(tabela.locator("tr").last()).toContainText("Halscriolo");
  });

  test("responsividade da tabela em viewport móvel de 320px sem overflow horizontal", async ({ page }) => {
    await prepararPagina(page, "/ranking.html?canal=belky");
    await page.setViewportSize({ width: 320, height: 750 });
    await expect(page.locator("#corpo-tabela-ranking tr").first()).toBeVisible();
    await verificarSemOverflowHorizontal(page, "ranking-lives-320px");
  });
});
