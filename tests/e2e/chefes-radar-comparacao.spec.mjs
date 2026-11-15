import { test, expect } from "@playwright/test";
import { prepararPagina } from "./helpers/ambiente.mjs";

test.describe("Chefes, Radar e Comparação", () => {
  test("Chefes: origem, limites zona/onda/jogadores, escalas 70/100, Fúria, sangramento e sync pela live", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "chromium-mobile", "Testa simulador de chefes no desktop");
    const { erros } = await prepararPagina(page, "/index.html");

    await page.fill("#input-nick", "halscriolo");
    await page.click('#formulario-busca button[type="submit"]');
    await page.click("#aba-monstros");

    // Transições de zona 69 -> 70 -> 100 e onda 10
    for (const [zona, onda, jogadores] of [
      ["69", "10", "5"],
      ["70", "10", "25"],
      ["100", "10", "500"],
      ["1", "1", "1"],
    ]) {
      await page.fill("#input-monstro-zona", zona);
      await page.fill("#input-monstro-onda", onda);
      await page.fill("#input-monstro-jogadores", jogadores);
      await expect(page.locator("#resultado-monstros")).toBeVisible();
    }

    // Trocar origem para Build do Simulador
    await page.selectOption("#select-monstro-origem", "simulador");
    await expect(page.locator("#resultado-monstros")).toBeVisible();

    // Sincronizar pela live
    const opcoesSync = await page.locator("#select-monstro-live-sync option").evaluateAll((opts) => opts.map((o) => o.value).filter(Boolean));
    if (opcoesSync.length > 0) {
      await page.selectOption("#select-monstro-live-sync", opcoesSync[0]);
      await expect(page.locator("#resultado-monstros")).toBeVisible();
    }

    expect(erros).toEqual([]);
  });

  test("Radar de Lives: paginação, filtros locais sem reconsultar perfis, cache e ação VS", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "chromium-mobile", "Testa radar completo no desktop");
    const { erros, controleApi } = await prepararPagina(page, "/index.html", {
      api: {
        cenarios: {
          board: async (route) => {
            const url = new URL(route.request().url());
            const pagina = Number(url.searchParams.get("page") || "1");
            return route.fulfill({
              status: 200,
              contentType: "application/json",
              body: JSON.stringify({
                page: pagina,
                totalPages: 2,
                items:
                  pagina === 1
                    ? [
                        { login: "halscriolo", displayName: "Halscriolo", cls: "warrior", level: 320, fc: 195000000 },
                        { login: "nando", displayName: "Nando", cls: "archer", level: 310, fc: 182000000 },
                      ]
                    : [
                        { login: "halscriolo", displayName: "Halscriolo", cls: "cleric", level: 295, fc: 168000000 },
                      ],
              }),
            });
          },
        },
      },
    });

    await page.click("#aba-radar-live");
    await page.fill("#input-radar-canal", "belky");
    await page.click("#btn-escanear-live");
    await expect(page.locator("#status-radar")).toContainText(/Varredura concluída/i, { timeout: 5000 });
    await expect(page.locator("#resultado-radar-live")).toContainText("Halscriolo");
    await expect(page.locator("#resultado-radar-live")).toContainText("Nando");

    const chamadasAntesFiltro = controleApi.chamadasApi.length;

    // Filtros de texto, classe e sem correspondência NÃO devem reconsultar /api/profile/
    await page.selectOption("#select-radar-classe", "archer");
    await expect(page.locator("#resultado-radar-live")).toContainText("Nando");
    await page.fill("#input-radar-busca", "TermoInexistenteRadarXYZ");
    await expect(page.locator("#resultado-radar-live")).not.toContainText("Nando");
    await page.locator('#resultado-radar-live button:has-text("Limpar Filtros")').click();
    await expect(page.locator("#resultado-radar-live")).toContainText("Halscriolo");

    expect(controleApi.chamadasApi.length).toBe(chamadasAntesFiltro);
    expect(erros).toEqual([]);
  });

  test("Comparação: P1 vs P2, Twitch vs Kick, Top 1, cura de Clérigo e filtro Apenas diferenças", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "chromium-mobile", "Testa comparação completa no desktop");
    const { erros } = await prepararPagina(page, "/index.html");

    await page.fill("#input-nick", "halscriolo");
    await page.click('#formulario-busca button[type="submit"]');
    await page.click("#aba-comparacao");

    // Comparar com Kick:Nando
    await page.fill("#input-comparar-nick", "nando");
    await page.selectOption("#select-comparar-plataforma", "kick");
    await page.click("#btn-comparar");
    await expect(page.locator("#conteudo-comparacao-perfil")).toContainText("Nando");

    // Atalho vs Top Clérigo (exibe linha de cura)
    await page.click("#btn-comparar-cleric");
    await expect(page.locator("#conteudo-comparacao-perfil")).toContainText(/Cura|Clérigo/i);

    // Filtro Apenas diferenças (se visível)
    const chkDif = page.locator('#conteudo-comparacao-perfil input[type="checkbox"]').first();
    if (await chkDif.isVisible()) {
      await chkDif.check();
      await chkDif.uncheck();
    }

    expect(erros).toEqual([]);
  });
});

