import { test, expect } from "@playwright/test";
import { prepararPagina } from "./helpers/ambiente.mjs";

test.describe("Chefes, Radar e Comparação", () => {
  test("Chefes: origem, limites zona/onda/jogadores, escalas 70/100, Fúria, sangramento e sync pela live", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "chromium-mobile", "Testa simulador de chefes no desktop");
    const { erros } = await prepararPagina(page, "/index.html");

    await page.fill("#input-nick", "halscriolo");
    await page.click('#formulario-busca button[type="submit"]');
    await page.click("#aba-monstros");

    // Transições de zona 1 (TTK rápido), 69 -> 70 -> 100 (Fúria / sangramento / escala de grupo) e onda 10
    await page.fill("#input-monstro-zona", "1");
    await page.fill("#input-monstro-onda", "10");
    await page.fill("#input-monstro-jogadores", "1");
    await expect(page.locator("#resultado-monstros")).toContainText("0s (Fúria 0)");
    await expect(page.locator("#resultado-monstros")).toContainText("75s (Fúria 5)");

    for (const [zona, onda, jogadores] of [
      ["69", "10", "5"],
      ["70", "10", "25"],
      ["100", "10", "500"],
    ]) {
      await page.fill("#input-monstro-zona", zona);
      await page.fill("#input-monstro-onda", onda);
      await page.fill("#input-monstro-jogadores", jogadores);
      await expect(page.locator("#resultado-monstros")).toBeVisible();
    }

    // Trocar origem para Build do Simulador
    await page.selectOption("#select-monstro-origem", "simulador");
    await expect(page.locator("#resultado-monstros")).toContainText("Build do Simulador");

    // Sincronizar pela live (exigindo opção disponível)
    const selectSync = page.locator("#select-monstro-live-sync");
    await expect(selectSync).toBeVisible();
    await selectSync.selectOption("belky");
    await expect(page.locator("#input-monstro-zona")).toHaveValue("24");
    await expect(page.locator("#input-monstro-onda")).toHaveValue("5");
    await expect(page.locator("#input-monstro-jogadores")).toHaveValue("45");

    await selectSync.selectOption("kick:nando");
    await expect(page.locator("#input-monstro-zona")).toHaveValue("31");
    await expect(page.locator("#input-monstro-onda")).toHaveValue("10");
    await expect(page.locator("#aviso-monstro-live-sync")).toContainText("Z29-W5");
    await expect(page.locator("#aviso-monstro-live-sync")).toContainText("285 ondas");
    await expect(page.locator("#aviso-monstro-live-sync")).toContainText("Recorde: Z31-W10");

    expect(erros).toEqual([]);
  });

  test("Radar de Lives: paginação, limite de 12 páginas, retry de indisponíveis, filtros locais e ação VS", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "chromium-mobile", "Testa radar completo no desktop");
    let falharSempoder = true;
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
                total: 650,
                totalPages: 13,
                items:
                  pagina === 1
                    ? [
                        { login: "halscriolo", displayName: "Halscriolo", cls: "warrior", level: 320, fc: 195000000 },
                        { login: "nando", displayName: "Nando", cls: "archer", level: 310, fc: 182000000 },
                        { login: "sempoder", displayName: "Sempoder", cls: "warrior", level: 280, fc: 0 },
                      ]
                    : [],
              }),
            });
          },
          profile: async (route) => {
            const { PERFIS_MOCK } = await import("./helpers/mock-api.mjs");
            const url = new URL(route.request().url());
            const login = decodeURIComponent(url.pathname.replace("/api/profile/", "")).toLowerCase();
            if (login === "sempoder" && falharSempoder) {
              return route.fulfill({ status: 503, contentType: "application/json", body: "{}" });
            }
            const dados = PERFIS_MOCK[login]?.warrior || PERFIS_MOCK[login]?.archer || PERFIS_MOCK.halscriolo.warrior;
            return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(dados) });
          },
        },
      },
      permitirErrosConsole: true,
    });

    // Sem P1 carregado: escaneia Belky, verifica aviso de limite de 12 páginas e 1 perfil indisponível
    await page.click("#aba-radar-live");
    await page.fill("#input-radar-canal", "belky");
    await page.click("#btn-escanear-live");
    await expect(page.locator("#status-radar")).toContainText(/Varredura concluída/i, { timeout: 5000 });
    await expect(page.locator("#resultado-radar-live")).toContainText("limite de 12 páginas atingido");
    await expect(page.locator("#resultado-radar-live")).toContainText("1 temporariamente indisponíveis");
    await expect(page.locator("#resultado-radar-live")).toContainText("Potencial (média 5 runs)");
    await expect(page.locator("#resultado-radar-live")).toContainText("Aguardando 1ª run");
    await expect(page.locator("#resultado-radar-live [data-radar-comparar]")).toHaveCount(0);

    // Retry recupera o perfil indisponível
    falharSempoder = false;
    const btnRetry = page.locator("#btn-radar-tentar-indisponiveis");
    await expect(btnRetry).toBeVisible();
    await btnRetry.click();
    await expect(page.locator("#resultado-radar-live")).toContainText("3 analisados com sucesso");

    const chamadasPerfilAntesFiltro = controleApi.chamadasApi.filter((u) => (u.pathname || String(u)).includes("/api/profile/")).length;

    // Filtros de texto, classe e sem correspondência NÃO devem reconsultar /api/profile/
    await page.selectOption("#select-radar-classe", "archer");
    await expect(page.locator("#resultado-radar-live")).toContainText("Nando");
    await page.fill("#input-radar-busca", "TermoInexistenteRadarXYZ");
    await expect(page.locator("#resultado-radar-live")).not.toContainText("Nando");
    await page.locator('#resultado-radar-live button:has-text("Limpar Filtros")').click();
    await expect(page.locator("#resultado-radar-live")).toContainText("Halscriolo");

    const chamadasPerfilDepoisFiltro = controleApi.chamadasApi.filter((u) => (u.pathname || String(u)).includes("/api/profile/")).length;
    expect(chamadasPerfilDepoisFiltro).toBe(chamadasPerfilAntesFiltro);

    // Carrega P1 clicando em um jogador do Radar e depois usa o botão VS
    await page.locator('#resultado-radar-live [data-radar-abrir="halscriolo"]').first().click();
    await expect(page.locator("#nome-jogador")).toContainText("Halscriolo");
    await page.click("#aba-radar-live");
    await page.click("#btn-escanear-live");
    await expect(page.locator('#resultado-radar-live [data-radar-comparar="nando"]')).toBeVisible();
    await page.locator('#resultado-radar-live [data-radar-comparar="nando"]').click();
    await expect(page.locator("#aba-comparacao")).toHaveAttribute("aria-selected", "true");
    await expect(page.locator("#resultado-comparacao")).toContainText("Nando");

    expect(erros).toEqual([]);
  });

  test("Comparação: P1 vs P2, Twitch vs Kick, Top 1, cura de Clérigo, troca de classe P2 e filtro Apenas diferenças", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "chromium-mobile", "Testa comparação completa no desktop");
    const { erros } = await prepararPagina(page, "/index.html");

    await page.fill("#input-nick", "halscriolo");
    await page.click('#formulario-busca button[type="submit"]');
    await page.click("#aba-comparacao");

    // Quando P1 já é o Top 1 Geral / Guerreiro, o botão indica "(Você)" e fica desabilitado
    await expect(page.locator("#btn-comparar-warrior")).toBeDisabled();

    // Comparar com Kick:Nando
    await page.fill("#input-comparar-nick", "nando");
    await page.selectOption("#select-comparar-plataforma", "kick");
    await page.click("#btn-comparar");
    await expect(page.locator("#resultado-comparacao")).toContainText("Nando");

    // Atalho vs Top Clérigo (exibe linha de cura e seletor de múltiplas classes para P2)
    await page.click("#btn-comparar-cleric");
    await expect(page.locator("#resultado-comparacao")).toContainText(/Cura da Luz Divina/i);

    // Filtro Apenas diferenças (exigindo visibilidade)
    const chkDif = page.locator("#check-apenas-diferencas");
    await expect(chkDif).toBeVisible();
    await chkDif.check();
    await expect(page.locator("#resultado-comparacao")).toHaveClass(/ocultar-sem-diferenca/);
    await chkDif.uncheck();
    await expect(page.locator("#resultado-comparacao")).not.toHaveClass(/ocultar-sem-diferenca/);

    expect(erros).toEqual([]);
  });
});

