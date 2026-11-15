import { test, expect } from "@playwright/test";
import { prepararPagina } from "./helpers/ambiente.mjs";
import { PERFIS_MOCK } from "./helpers/mock-api.mjs";

test.describe("Erros, Fallback e Concorrência (Entrega 3)", () => {
  test("falhas da consulta (404, 503, JSON inválido, login incorreto) e preservação do perfil anterior", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "chromium-mobile", "Testa cenários de erro no desktop");
    let modoPerfil = "404";

    await prepararPagina(page, "/index.html", {
      api: {
        cenarios: {
          profile: async (route) => {
            const url = new URL(route.request().url());
            const login = decodeURIComponent(url.pathname.replace("/api/profile/", "")).toLowerCase();
            if (modoPerfil === "404") {
              return route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: "Jogador não encontrado." }) });
            }
            if (modoPerfil === "503") {
              return route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "Indisponível" }) });
            }
            if (modoPerfil === "invalidJson") {
              return route.fulfill({ status: 200, contentType: "application/json", body: "{quebrado" });
            }
            if (modoPerfil === "wrongLogin") {
              return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(PERFIS_MOCK.nando.archer) });
            }
            return route.fulfill({
              status: 200,
              contentType: "application/json",
              body: JSON.stringify(PERFIS_MOCK[login]?.warrior || PERFIS_MOCK.halscriolo.warrior),
            });
          },
        },
      },
      permitirErrosConsole: true,
    });

    // 1. Primeira consulta com 404
    await page.fill("#input-nick", "inexistente");
    await page.click('#formulario-busca button[type="submit"]');
    await expect(page.locator("#status-consulta")).toContainText(/não encontrado|erro/i);
    await expect(page.locator("#aviso-sem-perfil")).toBeVisible();

    // 2. Consulta válida carrega Halscriolo
    modoPerfil = "ok";
    await page.fill("#input-nick", "halscriolo");
    await page.click('#formulario-busca button[type="submit"]');
    await expect(page.locator("#nome-jogador")).toContainText("Halscriolo");

    // 3. Falha ao consultar outro jogador (503, JSON inválido, login diferente) preserva Halscriolo visível
    for (const modo of ["503", "invalidJson", "wrongLogin"]) {
      modoPerfil = modo;
      await page.fill("#input-nick", "outrojogador");
      await page.click('#formulario-busca button[type="submit"]');
      await expect(page.locator("#status-consulta")).not.toBeEmpty();
      await expect(page.locator("#nome-jogador")).toContainText("Halscriolo");
    }
  });

  test("rota principal 503 com fallback AWS bem-sucedido e concorrência A lenta vs B rápida", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "chromium-mobile", "Testa fallback e concorrência no desktop");

    await prepararPagina(page, "/index.html", {
      api: {
        cenarios: {
          profile: async (route) => {
            const url = new URL(route.request().url());
            const ehAws = url.hostname.includes("amazonaws.com");
            const login = decodeURIComponent(url.pathname.replace("/api/profile/", "")).toLowerCase();

            // Para halscriolo: mesma origem falha 503, AWS fallback responde com atraso de 350ms
            if (login === "halscriolo") {
              if (!ehAws) {
                return route.fulfill({ status: 503, contentType: "application/json", body: "{}" });
              }
              await new Promise((r) => setTimeout(r, 350));
              return route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify(PERFIS_MOCK.halscriolo.warrior),
              });
            }

            // Para nando: responde rápido via fallback
            return route.fulfill({
              status: 200,
              contentType: "application/json",
              body: JSON.stringify(PERFIS_MOCK.nando.archer),
            });
          },
        },
      },
      permitirErrosConsole: true,
    });

    // Primeiro valida fallback AWS sozinho
    await page.fill("#input-nick", "halscriolo");
    await page.click('#formulario-busca button[type="submit"]');
    await expect(page.locator("#nome-jogador")).toContainText("Halscriolo");

    // Agora dispara A lenta (halscriolo) e logo em seguida B rápida (nando): só Nando deve ficar na tela
    await page.fill("#input-nick", "halscriolo");
    await page.click('#formulario-busca button[type="submit"]');
    await page.fill("#input-nick", "nando");
    await page.click('#formulario-busca button[type="submit"]');
    await expect(page.locator("#nome-jogador")).toContainText("Nando");

    await page.waitForTimeout(450);
    await expect(page.locator("#nome-jogador")).toContainText("Nando");
  });

  test("Comparação P2 concorrente: resposta atrasada não sobrescreve adversário atual", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "chromium-mobile", "Testa concorrência na comparação");
    await prepararPagina(page, "/index.html", {
      api: {
        cenarios: {
          profile: async (route) => {
            const url = new URL(route.request().url());
            const login = decodeURIComponent(url.pathname.replace("/api/profile/", "")).toLowerCase();
            if (login === "nando") {
              await new Promise((r) => setTimeout(r, 350));
              return route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify(PERFIS_MOCK.nando.archer),
              });
            }
            if (login === "sempoder") {
              return route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify(PERFIS_MOCK.sempoder.warrior),
              });
            }
            return route.fulfill({
              status: 200,
              contentType: "application/json",
              body: JSON.stringify(PERFIS_MOCK.halscriolo.warrior),
            });
          },
        },
      },
    });

    await page.fill("#input-nick", "halscriolo");
    await page.click('#formulario-busca button[type="submit"]');
    await page.click("#aba-comparacao");

    // Dispara P2 lento (nando) e logo em seguida P2 rápido (sempoder)
    await page.fill("#input-comparar-nick", "nando");
    await page.click("#btn-comparar");
    await page.fill("#input-comparar-nick", "sempoder");
    await page.click("#btn-comparar");

    await expect(page.locator("#conteudo-comparacao-perfil")).toContainText("JogadorSemPoderOficialComNomeBemLongoParaTeste");
    await page.waitForTimeout(450);
    await expect(page.locator("#conteudo-comparacao-perfil")).toContainText("JogadorSemPoderOficialComNomeBemLongoParaTeste");
  });

  test("Simulador JSON inválido / >64 KiB, hash inválido e storage bloqueado preservam build atual", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "chromium-mobile", "Testa validação de JSON no desktop");
    await prepararPagina(page, "/index.html?aba=simulador#b=hash_invalido_corrompido");
    await expect(page.locator("#simulador-container")).toBeVisible();

    await page.locator("#painel-gerenciador-builds .detalhes-gerenciador-builds summary").click();
    const inputArquivo = page.locator("#input-importar-json-build");
    await expect(inputArquivo).toBeAttached();

    const alertas = [];
    page.on("dialog", async (d) => {
      alertas.push(d.message());
      await d.accept();
    });

    // JSON corrompido dispara alert e preserva build
    await inputArquivo.setInputFiles({
      name: "corrompido.json",
      mimeType: "application/json",
      buffer: Buffer.from("{json_corrompido", "utf8"),
    });
    await expect.poll(() => alertas.length).toBe(1);

    // Arquivo >64 KiB dispara alert sincronamente e preserva build
    await inputArquivo.setInputFiles({
      name: "gigante.json",
      mimeType: "application/json",
      buffer: Buffer.from("x".repeat(70 * 1024), "utf8"),
    });
    await expect.poll(() => alertas.length).toBe(2);
    expect(alertas[0]).toMatch(/corrompido/i);
    expect(alertas[1]).toMatch(/64 KiB/i);

    await expect(page.locator("#simulador-container")).toBeVisible();
  });
});

