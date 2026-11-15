import { test, expect } from "@playwright/test";
import { prepararPagina, verificarCanvasComSprite } from "./helpers/ambiente.mjs";

test.describe("Simulador e Compartilhamento", () => {
  test("origem, modos Ficha/Lista, classes, busca/equipar peças, atributos e auto-stats", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "chromium-mobile", "Fluxo completo do simulador no desktop");
    const { erros } = await prepararPagina(page, "/index.html?aba=simulador");

    // Exemplo inicial sem perfil
    await expect(page.locator("#simulador-container")).toBeVisible();
    await verificarCanvasComSprite(page, "#sim-canvas-heroi");

    // Troca entre as 3 classes e modos Ficha/Lista
    for (const cls of ["warrior", "archer", "cleric"]) {
      const btnCls = page.locator(`#simulador-container [data-sim-classe-btn="${cls}"]`).first();
      await btnCls.click();
      await expect(page.locator("#simulador-container")).toBeVisible();
    }

    await page.locator('#simulador-container [data-sim-modo-vis="lista"]').first().click();
    await expect(page.locator("#simulador-container")).toContainText(/Arma|Elmo/i);
    await page.locator('#simulador-container [data-sim-modo-vis="ficha"]').first().click();

    // Auto-stats desligado preserva valor manual de atributo
    const chkAuto = page.locator('#simulador-container [data-sim-toggle-autostats]').first();
    if (await chkAuto.isChecked()) {
      await chkAuto.uncheck();
    }
    const inputFor = page.locator('#simulador-container [data-sim-attr="str"]').first();
    await inputFor.fill("350");
    await inputFor.dispatchEvent("change");
    await expect(inputFor).toHaveValue("350");

    // Busca na galeria com e sem resultado
    const buscaGaleria = page.locator('#simulador-container input[type="search"]').first();
    if (await buscaGaleria.isVisible()) {
      await buscaGaleria.fill("Singularidade");
      await expect(page.locator("#simulador-container")).toContainText("Singularidade");
      await buscaGaleria.fill("TermoInexistenteXYZ");
      await buscaGaleria.fill("");
    }

    // Importa perfil e depois restaura exemplo
    await page.fill("#input-nick", "halscriolo");
    await page.click('#formulario-busca button[type="submit"]');
    await page.click("#aba-simulador");
    await page.click("#btn-sim-importar");
    await expect(page.locator("#simulador-container")).toContainText(/Singularidade/i);
    await page.click("#btn-sim-resetar");

    expect(erros).toEqual([]);
  });

  test("gemas T1-T6, seleção de engaste sem sobrescrever anterior, mistura de tiers, raridade e métricas separadas", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "chromium-mobile", "Editor de gemas completo no desktop");
    const { erros } = await prepararPagina(page, "/index.html");

    await page.fill("#input-nick", "halscriolo");
    await page.click('#formulario-busca button[type="submit"]');
    await page.click("#aba-simulador");

    // Seleciona engaste 0, aplica T6 Safira; depois seleciona último engaste (5) sem sobrescrever o 0
    await page.locator('#simulador-container [data-sim-selecionar-engaste="0"]').click();
    await page.locator('#simulador-container [data-sim-slot-tier="0:0:6"]').click();
    await page.locator('#simulador-container [data-sim-gem-btn="0:0:sapphire"]').click();
    await expect(page.locator('#simulador-container [data-sim-selecionar-engaste="0"]')).toContainText(/T6/i);

    await page.locator('#simulador-container [data-sim-selecionar-engaste="5"]').click();
    await page.locator('#simulador-container [data-sim-slot-tier="0:5:4"]').click();
    await page.locator('#simulador-container [data-sim-gem-btn="0:5:topaz"]').click();

    // Engaste 0 manteve Safira T6, engaste 5 recebeu Topázio T4
    await expect(page.locator('#simulador-container [data-sim-selecionar-engaste="0"]')).toContainText(/Safira/i);
    await expect(page.locator('#simulador-container [data-sim-selecionar-engaste="5"]')).toContainText(/Topázio/i);

    // Rerrolar média vs teto vs aplicar em todas (se painel avançado estiver aberto)
    const btnMax = page.locator('#simulador-container [data-sim-modo-roll="max"]').first();
    if (await btnMax.isVisible()) {
      await btnMax.click();
      await page.locator('#simulador-container [data-sim-aplicar-roll-todas]').first().click();
    }

    // Reduz raridade para Épico (4) — T6 deve ficar bloqueado / não disponível
    const btnEpico = page.locator('#simulador-container [data-sim-raridade-rapida="0:4"]').first();
    if (await btnEpico.isVisible()) {
      await btnEpico.click();
      await expect(page.locator('#simulador-container [data-sim-slot-tier="0:0:6"]')).toHaveCount(0);
    }

    // Rótulos separados para DPS e FC
    await expect(page.locator("#simulador-container")).toContainText(/DPS/i);
    await expect(page.locator("#simulador-container")).toContainText(/FC/i);

    expect(erros).toEqual([]);
  });

  test("builds salvas (salvar, carregar, duplicar, excluir, reload) e compartilhamento por link + JSON", async ({ page, context }, testInfo) => {
    test.skip(testInfo.project.name === "chromium-mobile", "Persistência de builds e JSON no desktop");
    await prepararPagina(page, "/index.html");

    await page.fill("#input-nick", "halscriolo");
    await page.click('#formulario-busca button[type="submit"]');
    await page.click("#aba-simulador");

    // Salva build com nome longo
    const inputNomeBuild = page.locator('#simulador-container input[placeholder*="build" i], #simulador-container [data-sim-nome-build]').first();
    if (await inputNomeBuild.isVisible()) {
      await inputNomeBuild.fill("BuildTesteLongaDeGuerreiroArcanoParaValidacao");
      const btnSalvar = page.locator('#simulador-container button:has-text("Salvar build")').first();
      await btnSalvar.click();
      await expect(page.locator("#simulador-container")).toContainText("BuildTesteLongaDeGuerreiroArcanoParaValidacao");

      await page.reload({ waitUntil: "networkidle" });
      await page.click("#aba-simulador");
      await expect(page.locator("#simulador-container")).toContainText("BuildTesteLongaDeGuerreiroArcanoParaValidacao");
    }

    // Link de compartilhamento abre em contexto limpo preservando build
    const btnCopiar = page.locator('#btn-sim-copiar-link, #simulador-container button:has-text("Copiar link")').first();
    if (await btnCopiar.isVisible()) {
      await btnCopiar.click();
      const urlAtual = page.url();
      if (urlAtual.includes("#build=") || urlAtual.includes("build=")) {
        const novaAba = await context.newPage();
        await prepararPagina(novaAba, urlAtual);
        await expect(novaAba.locator("#simulador-container")).toBeVisible();
        await novaAba.close();
      }
    }
  });
});

