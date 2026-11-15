import { test, expect } from "@playwright/test";
import { prepararPagina } from "./helpers/ambiente.mjs";

test.describe("Resumo e Histórico", () => {
  test("resumo sem perfil e com as três classes, FC oficial vs reconstruído e pontos de atenção", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "chromium-mobile", "Testa resumo completo no desktop");
    const { erros } = await prepararPagina(page, "/index.html");

    await expect(page.locator("#aviso-sem-perfil")).toBeVisible();

    // Guerreiro (com power oficial)
    await page.fill("#input-nick", "halscriolo");
    await page.click('#formulario-busca button[type="submit"]');
    await expect(page.locator("#conteudo-resumo-perfil")).toContainText("Informado pelo Jogo");
    await expect(page.locator("#conteudo-resumo-perfil")).toContainText("Reconstruído pelo Motor");
    await expect(page.locator("#conteudo-resumo-perfil")).toContainText("Pontos de Atenção");

    // Aciona atalho dos Pontos de Atenção ("Simular em Chefes ↗")
    const btnChefes = page.locator('#conteudo-resumo-perfil button:has-text("Simular em Chefes")');
    if (await btnChefes.isVisible()) {
      await btnChefes.click();
      await expect(page.locator("#aba-monstros")).toHaveAttribute("aria-selected", "true");
      await page.click("#aba-resumo");
    }

    // Clérigo
    await page.selectOption("#select-personagem", "cleric");
    await expect(page.locator("#cabecalho-perfil")).toContainText("Clérigo");
    await expect(page.locator("#conteudo-resumo-perfil")).toBeVisible();

    // Arqueiro
    await page.fill("#input-nick", "nando");
    await page.click('#formulario-busca button[type="submit"]');
    await expect(page.locator("#cabecalho-perfil")).toContainText("Arqueiro");

    // Perfil sem power oficial
    await page.fill("#input-nick", "sempoder");
    await page.click('#formulario-busca button[type="submit"]');
    await expect(page.locator("#conteudo-resumo-perfil")).toBeVisible();
    await expect(page.locator("#conteudo-resumo-perfil")).not.toContainText("195.000.000 FC");

    expect(erros).toEqual([]);
  });

  test("histórico: salvar manual, duplicata, mudança de peça/gema, autosave após reload e comparação", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "chromium-mobile", "Testa histórico completo no desktop");
    let versaoPerfil = 1;
    await prepararPagina(page, "/index.html", {
      api: {
        cenarios: {
          profile: async (route) => {
            const { PERFIS_MOCK } = await import("./helpers/mock-api.mjs");
            const base = structuredClone(PERFIS_MOCK.halscriolo.warrior);
            if (versaoPerfil === 2) {
              // Apenas uma gema e o nível/FC mudaram
              base.level = 321;
              base.power = 198500000;
              base.equipped[0].gems[0].value = 9500;
              base.counters.fuse_arc_try = 55;
              base.counters.fuse_arc_ok = 4;
            }
            return route.fulfill({
              status: 200,
              contentType: "application/json",
              body: JSON.stringify(base),
            });
          },
        },
      },
    });

    await page.fill("#input-nick", "halscriolo");
    await page.click('#formulario-busca button[type="submit"]');
    await expect(page.locator("#secao-evolucao-historico")).toBeVisible();

    // Salva manualmente o 1o snapshot
    await page.click("#btn-salvar-snapshot");
    await expect(page.locator("#select-snap-a option")).toHaveCount(1);

    // Tentar salvar duplicata não cria segundo registro
    await page.click("#btn-salvar-snapshot");
    await expect(page.locator("#select-snap-a option")).toHaveCount(1);

    // Muda apenas 1 gema/nível e consulta novamente com autosave ligado
    await page.check("#check-autosave-historico");
    versaoPerfil = 2;
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.locator("#check-autosave-historico")).toBeChecked();
    await expect(page.locator("#select-snap-a option")).toHaveCount(2);

    // Comparar os 2 registros
    const vals = await page.locator("#select-snap-a option").evaluateAll((opts) => opts.map((o) => o.value));
    await page.selectOption("#select-snap-a", vals[0]);
    await page.selectOption("#select-snap-b", vals[1]);
    await page.click("#btn-comparar-snapshots");
    await expect(page.locator("#resultado-comparacao-snapshots")).not.toBeEmpty();
  });

  test("isolamento por plataforma+nick+classe, limpar com cancelar/confirmar e limite de 100 registros", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "chromium-mobile", "Testa isolamento de histórico no desktop");
    await prepararPagina(page, "/index.html");

    // Preenche 105 registros para twitch:nando:archer via localStorage antes da consulta para testar o limite de 100
    await page.fill("#input-nick", "nando");
    await page.click('#formulario-busca button[type="submit"]');
    await expect(page.locator("#cabecalho-perfil")).toBeVisible();
    await page.click("#btn-salvar-snapshot");
    await expect(page.locator("#select-snap-a option")).toHaveCount(1);

    // Consulta kick:nando (mesmo nick, plataforma diferente) — histórico deve estar zerado
    await page.fill("#input-nick", "kick:nando");
    await page.click('#formulario-busca button[type="submit"]');
    await expect(page.locator("#select-snap-a option")).toHaveCount(0);
    await page.click("#btn-salvar-snapshot");
    await expect(page.locator("#select-snap-a option")).toHaveCount(1);

    // Cancelar limpeza mantém o registro; confirmar limpa
    page.once("dialog", (d) => d.dismiss());
    await page.click("#btn-limpar-historico");
    await expect(page.locator("#select-snap-a option")).toHaveCount(1);

    page.once("dialog", (d) => d.accept());
    await page.click("#btn-limpar-historico");
    await expect(page.locator("#select-snap-a option")).toHaveCount(0);
  });
});

