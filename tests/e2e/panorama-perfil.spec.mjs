import { test, expect } from "@playwright/test";
import { prepararPagina } from "./helpers/ambiente.mjs";

test.describe("Panorama, rankings, modal de live e consulta de perfil", () => {
  test("panorama identifica 3 canais distintos (maior live, melhor zona e mais nova)", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "chromium-mobile", "Testa panorama completo no desktop");
    const { erros, controleApi } = await prepararPagina(page, "/index.html");

    await expect(page.locator('[data-panorama-acao="live-maior"]')).toContainText("Belky");
    await expect(page.locator('[data-panorama-acao="live-maior"]')).toContainText("45");

    await expect(page.locator('[data-panorama-acao="live-melhor-zona"]')).toContainText("Nando");
    await expect(page.locator('[data-panorama-acao="live-melhor-zona"]')).toContainText("Z31");

    await expect(page.locator('[data-panorama-acao="live-mais-nova"]')).toContainText("CanalNovo");
    await expect(page.locator('[data-panorama-acao="consultar-top1"]')).toContainText("Halscriolo");

    expect(controleApi.rotasInesperadas).toEqual([]);
    expect(erros).toEqual([]);
  });

  test("panorama lida com lives vazias, erro em lives, erro em ranking e changelog ausente", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "chromium-mobile", "Testa cenários degradados no desktop");

    // 1. Lives vazias + changelog ausente
    await prepararPagina(page, "/index.html", {
      api: {
        cenarios: {
          runs: { tipo: "empty", body: { items: [] } },
          changelog: { tipo: "httpError", status: 404 },
        },
      },
      permitirErrosConsole: true,
    });
    await expect(page.locator("#top-pill-val-top1")).toContainText("Halscriolo");
    await expect(page.locator('[data-panorama-acao="live-maior"]')).toContainText(/Nenhuma|0 jogadores|—/i);

    // 2. Erro de lives com ranking disponível
    await prepararPagina(page, "/index.html", {
      api: {
        cenarios: {
          runs: { tipo: "httpError", status: 503 },
        },
      },
      permitirErrosConsole: true,
    });
    await expect(page.locator("#top-pill-val-top1")).toContainText("Halscriolo");

    // 3. Erro de ranking com lives disponíveis
    await prepararPagina(page, "/index.html", {
      api: {
        cenarios: {
          characters: { tipo: "httpError", status: 503 },
        },
      },
      permitirErrosConsole: true,
    });
    await expect(page.locator('[data-panorama-acao="live-maior"]')).toContainText("Belky");
    await expect(page.locator("#top-pill-val-top1")).toContainText(/Indisponível|—/i);
  });

  test("rankings e atalhos carregam plataforma, classe e parâmetros da URL corretamente", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "chromium-mobile", "Testa atalhos de ranking no desktop");
    await prepararPagina(page, "/index.html");

    await expect(page.locator("#top-pill-val-top1")).toContainText("Halscriolo");
    await expect(page.locator("#top-pill-val-warrior")).toContainText("Halscriolo");
    await expect(page.locator("#top-pill-val-cleric")).toContainText("Halscriolo");
    await expect(page.locator("#top-pill-val-archer")).toContainText("Nando");
    await expect(page.locator("#top-pill-val-level")).toContainText("Halscriolo");

    await page.locator("#detalhes-rankings summary").click();
    await page.locator('[data-top-alvo="archer"]').click();
    await expect(page.locator("#cabecalho-perfil")).toBeVisible();
    await expect(page.locator("#nome-jogador")).toContainText("Nando");
    await expect(page.locator("#select-personagem")).toHaveValue("archer");
    expect(page.url()).toContain("nick=nando");
    expect(page.url()).toContain("cls=archer");
  });

  test("modal de live: Twitch, Kick, ambas, fechamento e resposta atrasada não sobrescreve atual", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "chromium-mobile", "Testa modal de live no desktop");
    await prepararPagina(page, "/index.html", {
      api: {
        cenarios: {
          channel: async (route) => {
            const url = new URL(route.request().url());
            const canal = decodeURIComponent(url.pathname.split("/").pop());
            if (canal === "belky") {
              await new Promise((r) => setTimeout(r, 350));
              return route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                  login: "belky",
                  displayName: "Belky",
                  twitchLogin: "belky",
                  kickLogin: null,
                  zone: 24,
                  wave: 5,
                  playersNow: 45,
                  createdAt: "2026-11-15T10:00:00-03:00",
                  online: true,
                }),
              });
            }
            if (canal === "kick:nando") {
              return route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                  login: "kick:nando",
                  displayName: "Nando",
                  twitchLogin: null,
                  kickLogin: "nando",
                  zone: 31,
                  wave: 10,
                  playersNow: 18,
                  createdAt: "2026-11-15T13:00:00-03:00",
                  online: true,
                }),
              });
            }
            return route.fulfill({
              status: 200,
              contentType: "application/json",
              body: JSON.stringify({
                login: "canalnovo",
                displayName: "CanalNovo",
                twitchLogin: "canalnovo",
                kickLogin: "canalnovo_kick",
                zone: 20,
                wave: 4,
                playersNow: 12,
                createdAt: "2026-11-15T15:10:00-03:00",
                online: true,
              }),
            });
          },
        },
      },
    });

    // Abre CanalNovo (ambas plataformas), fecha com botão, abre Belky (lento), fecha com Esc e abre Kick (rápido)
    await page.click('[data-panorama-acao="live-mais-nova"]');
    const modal = page.locator("#modal-escolha-live");
    await expect(modal).toBeVisible();
    await expect(page.locator("#modal-live-titulo")).toContainText("CanalNovo");
    await expect(modal.locator('a[href*="twitch.tv/canalnovo"]')).toBeVisible();
    await expect(modal.locator('a[href*="kick.com/canalnovo_kick"]')).toBeVisible();

    await page.click("#btn-fechar-modal-live");
    await expect(modal).not.toBeVisible();

    // Dispara Belky (lento), fecha com Esc e abre Kick:Nando rapidamente
    await page.click('[data-panorama-acao="live-maior"]');
    await expect(modal).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(modal).not.toBeVisible();

    await page.click('[data-panorama-acao="live-melhor-zona"]');
    await expect(modal).toBeVisible();
    await expect(page.locator("#modal-live-titulo")).toContainText("Nando");
    await expect(modal.locator('a[href*="kick.com/nando"]')).toBeVisible();

    // Aguarda tempo suficiente para a resposta atrasada de Belky chegar e garante que não sobrescreveu Nando
    await page.waitForTimeout(450);
    await expect(page.locator("#modal-live-titulo")).toContainText("Nando");
  });

  test("normalização de entrada de perfil, parâmetros iniciais e classe desconhecida", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "chromium-mobile", "Testa normalização de entrada no desktop");
    await prepararPagina(page, "/index.html?nick=halscriolo&plataforma=twitch&cls=desconhecida");

    await expect(page.locator("#cabecalho-perfil")).toBeVisible();
    await expect(page.locator("#nome-jogador")).toContainText("Halscriolo");

    const entradasValidas = [
      "  @Halscriolo  ",
      "https://www.twitch.tv/halscriolo",
      "twitch:halscriolo",
    ];
    for (const entrada of entradasValidas) {
      await page.fill("#input-nick", entrada);
      await page.click('#formulario-busca button[type="submit"]');
      await expect(page.locator("#nome-jogador")).toContainText("Halscriolo");
    }

    await page.fill("#input-nick", "kick:nando");
    await page.click('#formulario-busca button[type="submit"]');
    await expect(page.locator("#nome-jogador")).toContainText("Nando");

    // Campo vazio mostra aviso/erro sem quebrar
    await page.fill("#input-nick", "   ");
    await page.click('#formulario-busca button[type="submit"]');
    await expect(page.locator("#status-consulta")).not.toBeEmpty();
  });

  test("consulta com perfil sem power e única classe disponível", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "chromium-mobile", "Testa perfil sem power no desktop");
    await prepararPagina(page, "/index.html");

    await page.fill("#input-nick", "sempoder");
    await page.click('#formulario-busca button[type="submit"]');
    await expect(page.locator("#cabecalho-perfil")).toBeVisible();
    await expect(page.locator("#nome-jogador")).toContainText("JogadorSemPoderOficialComNomeBemLongoParaTeste");
    await expect(page.locator("#select-personagem option")).toHaveCount(1);
    await expect(page.locator("#conteudo-resumo-perfil")).toBeVisible();
  });
});

