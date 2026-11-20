import { test, expect } from "@playwright/test";
import {
  prepararPagina,
  verificarCanvasComSprite,
  verificarFonteSilkscreenCarregada,
  verificarSemOverflowHorizontal,
} from "./helpers/ambiente.mjs";

async function carregarPerfilHalscriolo(page) {
  await page.fill("#input-nick", "halscriolo");
  await page.click('#formulario-busca button[type="submit"]');
  await expect(page.locator("#cabecalho-perfil")).toBeVisible();
  await expect(page.locator("#nome-jogador")).toContainText("Halscriolo");
}

test.describe("Site principal (index.html)", () => {
  test("estado inicial, panorama global e atalhos", async ({ page }, testInfo) => {
    const { erros, controleApi } = await prepararPagina(page, "/index.html");

    await verificarFonteSilkscreenCarregada(page);
    await expect(page.getByRole("link", { name: /Tier List do Nando/i })).toBeVisible();
    await expect(page.locator("#panorama-atualizacao")).toContainText("15:30");
    await expect(page.locator("#top-pill-val-top1")).not.toContainText("Carregando");
    await expect(page.locator("#aviso-sem-perfil")).toBeVisible();
    await verificarSemOverflowHorizontal(page, `home-inicial-${testInfo.project.name}`);

    await expect(page).toHaveScreenshot(`home-inicial-${testInfo.project.name}.png`, {
      fullPage: true,
    });
    expect(controleApi.rotasInesperadas).toEqual([]);
    expect(erros).toEqual([]);
  });

  test("aba Resumo: busca de perfil e troca de classe", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "chromium-mobile", "Baseline de abas completas roda no desktop");
    const { erros, controleApi } = await prepararPagina(page, "/index.html");

    await carregarPerfilHalscriolo(page);
    await expect(page.locator("#conteudo-resumo-perfil")).toBeVisible();
    await expect(page.locator("#cabecalho-perfil")).toContainText("Guerreiro");
    await verificarSemOverflowHorizontal(page, "home-aba-resumo");
    await expect(page).toHaveScreenshot("home-aba-resumo.png", { fullPage: true });

    await page.selectOption("#select-personagem", "cleric");
    await expect(page.locator("#conteudo-resumo-perfil")).toBeVisible();
    await expect(page.locator("#cabecalho-perfil")).toContainText("Clérigo");
    await expect(page).toHaveScreenshot("home-aba-resumo-cleric.png", { fullPage: true });

    expect(controleApi.rotasInesperadas).toEqual([]);
    expect(erros).toEqual([]);
  });

  test("aba Forjas: taxas reais de counters.fuse_* e Gelo/Fogo", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "chromium-mobile", "Baseline de abas completas roda no desktop");
    const { erros, controleApi } = await prepararPagina(page, "/index.html");

    await carregarPerfilHalscriolo(page);
    await page.click("#aba-forjas");
    await expect(page.locator("#conteudo-forjas-perfil")).toBeVisible();
    await expect(page.locator("#linhas-forjas")).toContainText("120 sucessos em 400 tentativas");
    await expect(page.locator("#linhas-forjas")).toContainText("20 sucessos em 250 tentativas");
    await expect(page.locator("#linhas-forjas")).toContainText("3 sucessos em 50 tentativas");
    await expect(page.locator("#resumo-gelo-fogo-topo")).toContainText("+10 p.p. em Elmo (Arcano · 5 falhas)");
    await verificarSemOverflowHorizontal(page, "home-aba-forjas");

    await expect(page).toHaveScreenshot("home-aba-forjas.png", { fullPage: true });
    expect(controleApi.rotasInesperadas).toEqual([]);
    expect(erros).toEqual([]);
  });

  test("aba Equipamentos: peças, conjuntos e análise de FC", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "chromium-mobile", "Baseline de abas completas roda no desktop");
    const { erros, controleApi } = await prepararPagina(page, "/index.html");

    await carregarPerfilHalscriolo(page);
    await page.click("#aba-equipamentos");
    await expect(page.locator("#conteudo-equipamentos-perfil")).toBeVisible();
    await expect(page.locator("#lista-equipamentos")).toContainText("Lâmina da Singularidade");
    await verificarSemOverflowHorizontal(page, "home-aba-equipamentos");

    await expect(page).toHaveScreenshot("home-aba-equipamentos.png", { fullPage: true });
    expect(controleApi.rotasInesperadas).toEqual([]);
    expect(erros).toEqual([]);
  });

  test("aba Simulador: ficha visual, T6 Prismática e modo Lista", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "chromium-mobile", "Baseline de abas completas roda no desktop");
    const { erros, controleApi } = await prepararPagina(page, "/index.html");

    await carregarPerfilHalscriolo(page);
    await page.click("#aba-simulador");
    await expect(page.locator("#simulador-container")).toBeVisible();
    await verificarCanvasComSprite(page, "#sim-canvas-heroi");
    await verificarSemOverflowHorizontal(page, "home-aba-simulador-ficha");

    await expect(page).toHaveScreenshot("home-aba-simulador-ficha.png", {
      fullPage: true,
    });

    const btnT6 = page.locator('#simulador-container [data-sim-slot-tier="0:0:6"]');
    await expect(btnT6).toBeVisible();
    await expect(btnT6).toBeEnabled();
    await btnT6.click();

    const btnSafira = page.locator('#simulador-container [data-sim-gem-btn="0:0:sapphire"]');
    await expect(btnSafira).toBeVisible();
    await expect(btnSafira).toBeEnabled();
    await btnSafira.click();

    await expect(page.locator('#simulador-container [data-sim-selecionar-engaste="0"]')).toContainText(/T6/i);
    await expect(page.locator('#simulador-container [data-sim-selecionar-engaste="0"]')).toContainText(/Safira/i);
    await expect(page).toHaveScreenshot("home-aba-simulador-t6.png", {
      fullPage: true,
    });

    const btnModoLista = page.locator('#simulador-container [data-sim-modo-vis="lista"]').first();
    await expect(btnModoLista).toBeVisible();
    await btnModoLista.click();
    await expect(page).toHaveScreenshot("home-aba-simulador-lista.png", { fullPage: true });

    await page.locator('#simulador-container [data-sim-modo-vis="ficha"]').first().click();
    await page.click("#btn-sim-resetar");

    expect(controleApi.rotasInesperadas).toEqual([]);
    expect(erros).toEqual([]);
  });

  test("aba Monstros & Chefes: simulação de zona, onda e grupo", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "chromium-mobile", "Baseline de abas completas roda no desktop");
    const { erros, controleApi } = await prepararPagina(page, "/index.html");

    await carregarPerfilHalscriolo(page);
    await page.click("#aba-monstros");
    await page.fill("#input-monstro-zona", "18");
    await page.fill("#input-monstro-onda", "10");
    await page.fill("#input-monstro-jogadores", "25");
    await expect(page.locator("#resultado-monstros")).toBeVisible();
    await verificarSemOverflowHorizontal(page, "home-aba-monstros");

    await expect(page).toHaveScreenshot("home-aba-monstros.png", { fullPage: true });
    expect(controleApi.rotasInesperadas).toEqual([]);
    expect(erros).toEqual([]);
  });

  test("aba Radar de Lives: varredura concluída e contagem de perfis", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "chromium-mobile", "Baseline de abas completas roda no desktop");
    const { erros, controleApi } = await prepararPagina(page, "/index.html");

    await carregarPerfilHalscriolo(page);
    await page.click("#aba-radar-live");
    await page.fill("#input-radar-canal", "belky");
    await page.click("#btn-escanear-live");
    await expect(page.locator("#status-radar")).toContainText(/Varredura concluída/i, { timeout: 5000 });
    await expect(page.locator("#status-radar")).toContainText(/2/);
    await verificarSemOverflowHorizontal(page, "home-aba-radar");

    await expect(page).toHaveScreenshot("home-aba-radar.png", { fullPage: true });
    expect(controleApi.rotasInesperadas).toEqual([]);
    expect(erros).toEqual([]);
  });

  test("aba Comparação: P1 vs P2", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "chromium-mobile", "Baseline de abas completas roda no desktop");
    const { erros, controleApi } = await prepararPagina(page, "/index.html");

    await carregarPerfilHalscriolo(page);
    await page.click("#aba-comparacao");
    await expect(page.locator("#conteudo-comparacao-perfil")).toBeVisible();
    const inputNick2 = page.locator("#input-nick-p2, #input-comparar-nick").first();
    await expect(inputNick2).toBeVisible();
    await inputNick2.fill("nando");
    await page.locator('#form-comparar button[type="submit"]').click();
    await expect(page.locator("#conteudo-comparacao-perfil")).toContainText("Nando");
    await verificarSemOverflowHorizontal(page, "home-aba-comparacao");

    await expect(page).toHaveScreenshot("home-aba-comparacao.png", { fullPage: true });
    expect(controleApi.rotasInesperadas).toEqual([]);
    expect(erros).toEqual([]);
  });

  test("mobile: simulador com editor de gemas aberto", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-mobile", "Captura exclusiva do projeto mobile");
    const { erros, controleApi } = await prepararPagina(page, "/index.html");

    await carregarPerfilHalscriolo(page);
    await page.click("#aba-simulador");
    await expect(page.locator("#simulador-container .rs-stone-picker")).toBeVisible();
    await verificarCanvasComSprite(page, "#sim-canvas-heroi");
    await verificarSemOverflowHorizontal(page, "home-simulador-mobile");
    await page.evaluate(() => window.scrollTo(0, 0));

    await expect(page).toHaveScreenshot("home-simulador-chromium-mobile.png", {
      fullPage: true,
    });
    expect(controleApi.rotasInesperadas).toEqual([]);
    expect(erros).toEqual([]);
  });

  test("alternância de fonte do site", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "chromium-mobile", "Teste de fonte no desktop");
    const { erros, controleApi } = await prepararPagina(page, "/index.html");
    const valores = await page.locator("#fonte-site option").evaluateAll((opts) => opts.map((o) => o.value));
    expect(valores).toContain("limpa");
    await page.selectOption("#fonte-site", "limpa");
    await page.evaluate(() => document.fonts?.ready);
    await expect(page.locator("html")).toHaveAttribute("data-fonte", "limpa");
    await expect(page).toHaveScreenshot("home-fonte-alternativa.png", { fullPage: true });

    expect(controleApi.rotasInesperadas).toEqual([]);
    expect(erros).toEqual([]);
  });
});

test.describe("Tier List do Nando (tierlist.html)", () => {
  test("visão inicial Por Utilidade · Todos", async ({ page }, testInfo) => {
    const { erros, controleApi } = await prepararPagina(page, "/tierlist.html");

    await verificarFonteSilkscreenCarregada(page);
    await expect(page.locator("#tierlist-tabela .tl-card").first()).toBeVisible();
    await verificarSemOverflowHorizontal(page, `tierlist-inicial-${testInfo.project.name}`);
    await expect(page).toHaveScreenshot(`tierlist-utilidade-todos-${testInfo.project.name}.png`, {
      fullPage: true,
    });

    if (testInfo.project.name === "chromium-mobile") {
      await page.click('[data-tl-cat="cleric"]');
      await page.click('[data-tl-card="ring_19"]');
      await expect(page.locator("#tierlist-detalhe")).toContainText("4,6/s");
      await verificarSemOverflowHorizontal(page, "tierlist-detalhe-mobile");
      await expect(page).toHaveScreenshot("tierlist-detalhe-chromium-mobile.png", {
        fullPage: true,
      });
    }
    expect(controleApi.rotasInesperadas).toEqual([]);
    expect(erros).toEqual([]);
  });

  test("filtros por classe, detalhes contextualizados e modo Por FC com T6", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "chromium-mobile", "Fluxo completo da Tier List roda no projeto desktop");
    const { erros, controleApi } = await prepararPagina(page, "/tierlist.html");

    await page.click('[data-tl-cat="warrior"]');
    await page.click('[data-tl-card="ring_14"]');
    await expect(page.locator("#tierlist-detalhe")).toContainText("Singularidade");
    await expect(page).toHaveScreenshot("tierlist-guerreiro-eclipse.png", { fullPage: true });

    await page.click('[data-tl-cat="cleric"]');
    await page.click('[data-tl-card="ring_19"]');
    await expect(page.locator("#tierlist-detalhe")).toContainText("4,6/s");
    await expect(page).toHaveScreenshot("tierlist-clerigo-teia.png", { fullPage: true });

    await page.click('[data-tl-cat="archer"]');
    await expect(page.locator("#tierlist-tabela .tl-card").first()).toBeVisible();
    await page.click('[data-tl-cat="ring"]');
    await expect(page).toHaveScreenshot("tierlist-aneis.png", { fullPage: true });

    await page.click('[data-tl-cat="todos"]');
    await page.click('[data-tl-modo="fc"]');
    await expect(page.locator("#tierlist-controles-fc")).toBeVisible();
    await page.selectOption("#tierlist-anel-referencia", "14");
    await page.locator('[data-tl-card="set_singular"]').click();
    await expect(page.locator("#tierlist-detalhe .tl-ficha-fc")).toBeVisible();
    await verificarCanvasComSprite(page, "canvas[data-tl-heroi]");
    await expect(page).toHaveScreenshot("tierlist-fc-ficha-padrao.png", {
      fullPage: true,
    });

    await page.click('[data-tl-selecionar-peca="weapon"]');
    const btnT6 = page.getByRole("button", { name: "T6 Prismática" });
    await expect(btnT6).toBeVisible();
    await expect(btnT6).toBeEnabled();
    await btnT6.click();
    await page.locator('[data-tl-gem-btn$=":ruby"]').first().click();
    const btnRepetir = page.locator("[data-tl-gem-repetir-ativo]");
    await expect(btnRepetir).toBeVisible();
    await btnRepetir.click();

    await expect(page.locator("#tierlist-detalhe")).toContainText("T6 Prismática");
    await expect(page).toHaveScreenshot("tierlist-fc-ficha-t6.png", {
      fullPage: true,
    });

    await page.click("#tierlist-restaurar-fc");
    await expect(page.locator("#tierlist-anel-referencia")).toHaveValue("0");

    expect(controleApi.rotasInesperadas).toEqual([]);
    expect(erros).toEqual([]);
  });
});
