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
    await expect(page.locator('[data-panorama-acao="live-melhor-zona"]')).toContainText("Pot. Z29-W5");
    await expect(page.locator("#panorama-atualizacao")).toContainText("Maior potencial online: Nando (Z29-W5)");

    await expect(page.locator('[data-panorama-acao="live-mais-nova"]')).toContainText("CanalNovo");
    await expect(page.locator('[data-panorama-acao="consultar-top1"]')).toContainText("Halscriolo");

    expect(controleApi.rotasInesperadas).toEqual([]);
    expect(erros).toEqual([]);
  });

  test("descobre o canal mais novo na segunda página e reaproveita datas conhecidas", async ({ page }) => {
    const primeiraPagina = Array.from({ length: 14 }, (_, i) => ({
      login: `canal${i}`,
      name: `Canal ${i}`,
      bestZone: 3,
      bestWave: 5,
      playersNow: 100 - (i * 5),
      online: true,
    }));
    const estreante = { ...primeiraPagina[0], login: "kick:estreante", name: "Estreante", playersNow: 68 };
    const consultas = new Map();
    let falharSegundaPagina = false;
    await prepararPagina(page, "/index.html", {
      permitirErrosConsole: true,
      api: {
        cenarios: {
          runs: async (route) => {
            const numero = Number(new URL(route.request().url()).searchParams.get("page"));
            if (numero === 2 && falharSegundaPagina) {
              return route.fulfill({ status: 503, json: { error: "Página indisponível" } });
            }
            return route.fulfill({
              json: { page: numero, size: 14, total: 15, items: numero === 1 ? primeiraPagina : [estreante] },
            });
          },
          channel: (route) => {
            const login = decodeURIComponent(new URL(route.request().url()).pathname.split("/").pop());
            consultas.set(login, (consultas.get(login) || 0) + 1);
            return route.fulfill({
              json: {
                login,
                zone: 3,
                wave: 5,
                createdAt: login === estreante.login ? "2026-11-15T15:15:00-03:00" : "2026-10-01T10:00:00-03:00",
              },
            });
          },
        },
      },
    });
    const card = page.locator('[data-panorama-acao="live-mais-nova"]');
    const cardZona = page.locator('[data-panorama-acao="live-melhor-zona"]');
    await expect(card).toContainText("Canal mais novo online");
    await expect(cardZona).toContainText("Maior zona online");
    await expect(card).toContainText("Estreante");
    expect(consultas.size).toBe(15);

    await card.click();
    await expect(page.locator("#link-live-kick")).toHaveAttribute("href", "https://kick.com/estreante");
    await page.locator("#btn-fechar-modal-live").click();
    await page.locator("#aba-radar-live").click();
    await expect(page.locator('#select-radar-lives option[value="kick:estreante"]')).toBeAttached();

    const atualizar = page.locator("#btn-atualizar-lives-online");
    await atualizar.click();
    await expect.poll(() => consultas.get(estreante.login)).toBe(2);
    await expect(card).toContainText("Estreante");
    await expect.poll(() => consultas.get("canal6")).toBe(2);
    await expect(cardZona).toContainText("Maior zona online");

    falharSegundaPagina = true;
    await atualizar.click();
    await expect(card).toContainText("Canal mais novo entre os consultados");
    await expect(cardZona).toContainText("Maior zona entre lives consultadas");
    await expect(card).not.toContainText("Estreante");
    await expect(page.locator("#panorama-atualizacao")).toContainText("Consulta de canais novos incompleta");
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

    // 3. Erro de ranking com lives disponíveis (sem cache prévio)
    await page.evaluate(() => localStorage.clear());
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
    await expect(page.locator("#top-pill-val-level")).toContainText("Halscriolo");
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

    // Fechar clicando fora (backdrop de #modal-escolha-live)
    await page.mouse.click(5, 5);
    await expect(modal).not.toBeVisible();
  });

  test("normalização de entrada de perfil, parâmetros iniciais e classe desconhecida", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "chromium-mobile", "Testa normalização de entrada no desktop");
    await prepararPagina(page, "/index.html?nick=halscriolo&plataforma=twitch&cls=desconhecida");

    await expect(page.locator("#cabecalho-perfil")).toBeVisible();
    await expect(page.locator("#nome-jogador")).toContainText("Halscriolo");

    const entradasTwitch = [
      "  @Halscriolo  ",
      "https://www.twitch.tv/halscriolo",
      "https://riftstream.com.br/perfil/twitch/halscriolo",
      "twitch:halscriolo",
    ];
    for (const entrada of entradasTwitch) {
      await page.fill("#input-nick", entrada);
      await page.click('#formulario-busca button[type="submit"]');
      await expect(page.locator("#nome-jogador")).toContainText("Halscriolo");
    }

    const entradasKick = [
      "kick:nando",
      "https://kick.com/nando",
      "https://riftstream.com.br/perfil/kick/nando",
    ];
    for (const entrada of entradasKick) {
      await page.fill("#input-nick", entrada);
      await page.click('#formulario-busca button[type="submit"]');
      await expect(page.locator("#nome-jogador")).toContainText("Nando");
      await expect(page.locator("#select-plataforma")).toHaveValue("kick");
    }

    // Campo vazio e nick inválido mostram erro sem quebrar o perfil carregado
    await page.fill("#input-nick", "   ");
    await page.click('#formulario-busca button[type="submit"]');
    await expect(page.locator("#status-consulta")).not.toBeEmpty();

    await page.fill("#input-nick", "nick invalido!!!");
    await page.click('#formulario-busca button[type="submit"]');
    await expect(page.locator("#status-consulta")).toContainText(/Informe um nick válido/i);
    await expect(page.locator("#nome-jogador")).toContainText("Nando");
  });

  test("consulta com perfil sem power, sem equipamentos, avatar quebrado e única classe disponível", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "chromium-mobile", "Testa perfil sem power no desktop");
    let variante = "sempoder";
    await prepararPagina(page, "/index.html", {
      api: {
        cenarios: {
          profile: async (route) => {
            const { PERFIS_MOCK } = await import("./helpers/mock-api.mjs");
            const base = structuredClone(PERFIS_MOCK.sempoder.warrior);
            if (variante === "semEquipAvatarQuebrado") {
              base.equipped = [];
              base.avatar = "http://127.0.0.1:4179/avatar-inexistente-404.png";
            }
            return route.fulfill({
              status: 200,
              contentType: "application/json",
              body: JSON.stringify(base),
            });
          },
        },
      },
      permitirErrosConsole: true,
    });

    await page.fill("#input-nick", "sempoder");
    await page.click('#formulario-busca button[type="submit"]');
    await expect(page.locator("#cabecalho-perfil")).toBeVisible();
    await expect(page.locator("#nome-jogador")).toContainText("JogadorSemPoderOficialComNomeBemLongoParaTeste");
    await expect(page.locator("#select-personagem option")).toHaveCount(1);
    await expect(page.locator("#conteudo-resumo-perfil")).toBeVisible();

    variante = "semEquipAvatarQuebrado";
    await page.fill("#input-nick", "sempoder");
    await page.click('#formulario-busca button[type="submit"]');
    await expect(page.locator("#cabecalho-perfil")).toBeVisible();
    await expect(page.locator("#conteudo-resumo-perfil")).toBeVisible();
  });
});

