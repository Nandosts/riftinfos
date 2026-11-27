import { test, expect } from "@playwright/test";
import { prepararPagina, verificarCanvasComSprite, verificarSemOverflowHorizontal } from "./helpers/ambiente.mjs";

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

    // Abre Opções Avançadas e desliga auto-stats para preservar valor manual
    await page.locator("#sim-details-avancadas summary").click();
    const chkAuto = page.locator('#simulador-container [data-sim-toggle-autostats="1"]');
    await expect(chkAuto).toBeVisible();
    if (await chkAuto.isChecked()) {
      await chkAuto.uncheck();
    }
    const inputFor = page.locator('#simulador-container [data-sim-attr="str"]').first();
    await inputFor.fill("350");
    await inputFor.dispatchEvent("change");
    await expect(inputFor).toHaveValue("350");

    // Busca na galeria com e sem resultado e filtro Todos vs Classe
    const buscaGaleria = page.locator("#sim-busca-peca-slot");
    await expect(buscaGaleria).toBeVisible();
    await page.locator('[data-sim-filtro-galeria="todos"]').click();
    await buscaGaleria.fill("Singularidade");
    await expect(page.locator("#simulador-container")).toContainText("Singularidade");
    await buscaGaleria.fill("TermoInexistenteXYZ");
    await expect(page.locator("#simulador-container")).toContainText(/Nenhuma peça encontrada/i);
    await buscaGaleria.fill("");

    // Importa perfil e depois restaura exemplo
    await page.fill("#input-nick", "halscriolo");
    await page.click('#formulario-busca button[type="submit"]');
    await page.click("#aba-simulador");
    await page.click("#btn-sim-importar");
    await expect(page.locator("#simulador-container")).toContainText(/Singularidade/i);
    await page.click("#btn-sim-resetar");

    expect(erros).toEqual([]);
  });

  test("recomenda o próximo atributo pelo objetivo de ouro", async ({ page }) => {
    const { erros } = await prepararPagina(page, "/index.html?aba=simulador");
    const sim = page.locator("#simulador-container");
    const objetivo = sim.getByLabel("Objetivo");
    await sim.locator('[data-sim-classe-btn="cleric"]').first().click();
    await expect(objetivo).toHaveValue("fc");
    for (const [valor, unidade] of [
      ["custo", "FC por 1 milhão de ouro"],
      ["dps", "DPS"],
      ["ehp", "vida efetiva"],
      ["cura", "poder de cura"],
    ]) {
      await objetivo.selectOption(valor);
      await expect(sim.locator(".rs-badge-melhor-attr")).toContainText(unidade);
    }
    await verificarSemOverflowHorizontal(page, "objetivo de gasto de ouro");
    await sim.locator('[data-sim-modo-vis="lista"]').first().click();
    await expect(objetivo).toHaveValue("cura");
    await sim.locator("#sim-classe").selectOption("archer");
    await expect(objetivo.locator('option[value="cura"]')).toHaveCount(0);
    await expect(objetivo).toHaveValue("fc");
    expect(erros).toEqual([]);
  });

  test("equipa peças da Cidade Mecânica e mostra as projeções dos anéis da Raid", async ({ page }) => {
    const { erros } = await prepararPagina(page, "/index.html?aba=simulador");
    const sim = page.locator("#simulador-container");
    await sim.locator('[data-sim-classe-btn="cleric"]').first().click();
    await expect(sim.locator(".rs-hero-tiles")).toContainText("CURA EM GRUPO");
    await expect(sim.locator(".rs-hero-tiles .rs-htile-dps")).toContainText(/DPS ESTIMADO\s*[\d.]+\/s/);
    await expect(sim.locator(".rs-live-summary-bar")).toContainText(/Cura em grupo:.*DPS:/s);
    await verificarSemOverflowHorizontal(page, "ficha do Clérigo com cura e DPS");
    await sim.locator("#sim-details-avancadas summary").click();
    await sim.locator('[data-sim-set-rapido="royalclock"]').first().click();
    await expect(sim.locator(".rs-set-box")).toContainText("Relojoeiro Real");
    await expect(sim).toContainText("Os atributos gerados automaticamente");
    await sim.locator('.rs-slots4 [data-sim-selecionar-slot="3"]').click();
    await sim.locator('[data-sim-equipar-anel="18"]').click();
    await expect(sim.locator(".rs-attrs")).toContainText("dano direto antes da DEF contra alvo já sangrando ou envenenado");
    await page.click("#aba-monstros");
    await page.selectOption("#select-monstro-origem", "simulador");
    await page.fill("#input-teto-dano-inimigos", "100");
    await expect(page.locator(".grade-tres-indicadores-boss")).toContainText("sem o veneno e o bônus condicional da Presa");
    await page.click("#aba-simulador");
    await sim.locator('[data-sim-equipar-anel="19"]').click();
    await expect(sim.locator(".rs-attrs")).toContainText("Teia Escarlate: escudo pessoal de");
    await expect(sim.locator(".rs-attrs")).toContainText("A primeira vem aos 3s");
    await sim.locator('[data-sim-modo-vis="lista"]').first().click();
    await expect(sim.locator(".sim-resumo-bonus-ativos")).toContainText("Teia Escarlate: escudo pessoal de");
    expect(erros).toEqual([]);
  });

  test("gemas T1-T6, seleção de engaste sem sobrescrever anterior, mistura de tiers, raridade, presets e melhorias (aplicar/desfazer)", async ({ page }, testInfo) => {
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

    // Abre Opções Avançadas e aplica rolagem máxima às gemas engastadas
    const detailsAvancadas = page.locator("#sim-details-avancadas");
    if (!(await detailsAvancadas.evaluate((el) => el.open))) {
      await detailsAvancadas.locator("summary").click();
    }
    const btnMax = page.locator('#simulador-container [data-sim-modo-roll="max"]');
    await expect(btnMax).toBeVisible();
    await btnMax.click();
    await page.locator('#simulador-container [data-sim-aplicar-roll-todas="1"]').click();

    const sim = page.locator("#simulador-container");
    await sim.getByRole("button", { name: "Lendário", exact: true }).click();
    await expect(sim.locator("[data-sim-selecionar-engaste]")).toHaveCount(4);
    await expect(sim.locator('[data-sim-selecionar-engaste="0"]')).toContainText("T5");
    await expect(sim.getByRole("button", { name: "T6 Prismática" })).toBeDisabled();
    await expect(sim.locator(".rs-gem-badge-top")).toContainText("4/4");

    await sim.locator('[data-sim-modo-vis="lista"]').click();
    const arma = sim.locator('.sim-slot-card[data-slot-index="0"]');
    const raridade = arma.getByTitle("Raridade");
    const engastes = arma.locator("[data-sim-engaste-tier]");
    for (const [rar, quantidade] of [["5", 3], ["3", 3], ["2", 2], ["1", 1], ["0", 0], ["6", 5], ["7", 6], ["4", 4]]) {
      await raridade.selectOption(rar);
      await expect(engastes).toHaveCount(quantidade);
    }
    const nivelArma = arma.getByTitle("Item Level");
    await nivelArma.fill("19");
    await nivelArma.dispatchEvent("change");
    await expect(engastes).toHaveCount(0);
    await nivelArma.fill("20");
    await nivelArma.dispatchEvent("change");
    await expect(engastes).toHaveCount(4);
    await expect(arma.locator(".badge-gemas-resumo")).toContainText("0/4");
    await sim.locator('[data-sim-modo-vis="ficha"]').click();
    await sim.locator('[data-sim-preset-criativo="gemas_safira"]').click();
    await expect(sim.locator(".rs-gem-badge-top")).toContainText("4/4");

    // Comparar melhorias por FC, DPS, HP e Cura + Aplicar e Desfazer
    const selOrdem = page.locator("#select-ordem-melhorias");
    await expect(selOrdem).toBeVisible();
    for (const crit of ["dps", "hp", "cura", "fc"]) {
      await selOrdem.selectOption(crit);
    }
    const btnDesfazer = page.locator("#btn-desfazer-melhoria");
    await expect(btnDesfazer).toBeDisabled();
    await page.locator("#bloco-comparar-melhorias .btn-aplicar-melhoria").first().click();
    await expect(btnDesfazer).toBeEnabled();
    await btnDesfazer.click();
    await expect(btnDesfazer).toBeDisabled();

    // Rótulos separados para DPS/s e FC
    await expect(page.locator("#simulador-container")).toContainText(/DPS/i);
    await expect(page.locator("#simulador-container")).toContainText(/FC/i);

    expect(erros).toEqual([]);
  });

  test("builds salvas (salvar, carregar, confirmar/cancelar, duplicar, excluir, reload) e compartilhamento por link + JSON", async ({ page, context }, testInfo) => {
    test.skip(testInfo.project.name === "chromium-mobile", "Persistência de builds e JSON no desktop");
    await prepararPagina(page, "/index.html");

    await page.fill("#input-nick", "halscriolo");
    await page.click('#formulario-busca button[type="submit"]');
    await page.click("#aba-simulador");

    // Abre o gerenciador de builds (<details>) explicitamente
    const detailsBuilds = page.locator("#painel-gerenciador-builds .detalhes-gerenciador-builds");
    await detailsBuilds.locator("summary").click();

    const inputNomeBuild = page.locator("#input-nome-nova-build");
    await expect(inputNomeBuild).toBeVisible();
    await inputNomeBuild.fill("BuildTesteLongaDeGuerreiroArcanoParaValidacao");
    await page.click("#btn-salvar-build-local");
    await expect(page.locator("#painel-gerenciador-builds")).toContainText("BuildTesteLongaDeGuerreiroArcanoParaValidacao");

    // Duplicar build cria 2 cards
    await page.locator("#painel-gerenciador-builds .btn-duplicar-build").first().click();
    await expect(page.locator("#painel-gerenciador-builds .card-build-salva")).toHaveCount(2);

    // Excluir a cópia volta para 1 card
    await page.locator("#painel-gerenciador-builds .btn-excluir-build").last().click();
    await expect(page.locator("#painel-gerenciador-builds .card-build-salva")).toHaveCount(1);

    // Reload preserva a build salva
    await page.reload({ waitUntil: "networkidle" });
    await page.click("#aba-simulador");
    await page.locator("#painel-gerenciador-builds .detalhes-gerenciador-builds summary").click();
    await expect(page.locator("#painel-gerenciador-builds")).toContainText("BuildTesteLongaDeGuerreiroArcanoParaValidacao");

    // Edita manualmente para testar cancelar e confirmar substituição ao carregar build
    await page.locator('#simulador-container [data-attr-btn="str"][data-delta="10"]').first().click();
    page.once("dialog", (d) => d.dismiss());
    await page.locator("#painel-gerenciador-builds .btn-carregar-build").first().click();

    page.once("dialog", (d) => d.accept());
    await page.locator("#painel-gerenciador-builds .btn-carregar-build").first().click();

    // Reimportar JSON válido atualiza a build
    const jsonValido = await page.evaluate(() => {
      const builds = window.RiftCompartilhamento.listarBuildsSalvas();
      return JSON.stringify(builds[0].dados);
    });
    await page.locator("#input-importar-json-build").setInputFiles({
      name: "build-valida.json",
      mimeType: "application/json",
      buffer: Buffer.from(jsonValido, "utf8"),
    });
    await expect(page.locator("#simulador-container")).toBeVisible();

    // Link de compartilhamento abre em contexto limpo preservando build
    const hashGerado = await page.evaluate(async () => {
      const builds = window.RiftCompartilhamento.listarBuildsSalvas();
      return window.RiftCompartilhamento.serializarBuildParaHash(builds[0].dados, null, "BuildTeste");
    });
    expect(hashGerado).toMatch(/^build=/);
    const novaAba = await context.newPage();
    await prepararPagina(novaAba, `/index.html?aba=simulador#${hashGerado}`);
    await expect(novaAba.locator("#simulador-container")).toContainText(/Singularidade/i);
    await novaAba.close();
  });
});

