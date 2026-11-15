import { test, expect } from "@playwright/test";
import { instalarMocksApi } from "./helpers/mock-api.mjs";

function anexarMonitorErros(page) {
  const erros = [];
  page.on("pageerror", (erro) => erros.push(`pageerror: ${erro.message}`));
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      erros.push(`console.error: ${msg.text()}`);
    }
  });
  return erros;
}

async function prepararPagina(page, url) {
  const erros = anexarMonitorErros(page);
  await page.addInitScript(() => {
    localStorage.clear();
  });
  await instalarMocksApi(page);
  await page.goto(url, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts?.ready);
  return erros;
}

test.describe("Site principal (index.html)", () => {
  test("estado inicial, panorama global e atalhos", async ({ page }, testInfo) => {
    const erros = await prepararPagina(page, "/index.html");

    await expect(page.locator("#panorama-atualizacao")).not.toContainText("Sincronizando");
    await expect(page.locator("#top-pill-val-top1")).not.toContainText("Carregando");
    await expect(page.locator("#aviso-sem-perfil")).toBeVisible();

    await expect(page).toHaveScreenshot(`home-inicial-${testInfo.project.name}.png`, {
      fullPage: true,
      mask: [page.locator("#panorama-atualizacao")],
    });
    expect(erros).toEqual([]);
  });

  test("busca de perfil, troca de classe e todas as abas", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "chromium-mobile", "Fluxo completo das 7 abas roda no projeto desktop");
    const erros = await prepararPagina(page, "/index.html");

    // 1. Busca de jogador
    await page.fill("#input-nick", "halscriolo");
    await page.click('#formulario-busca button[type="submit"]');
    await expect(page.locator("#cabecalho-perfil")).toBeVisible();
    await expect(page.locator("#nome-jogador")).toContainText("Halscriolo");
    await expect(page.locator("#conteudo-resumo-perfil")).toBeVisible();
    await expect(page).toHaveScreenshot("home-aba-resumo.png", { fullPage: true });

    // 2. Troca de personagem para Clérigo e volta para Guerreiro
    await page.selectOption("#select-personagem", "cleric");
    await expect(page.locator("#conteudo-resumo-perfil")).toBeVisible();
    await expect(page).toHaveScreenshot("home-aba-resumo-cleric.png", { fullPage: true });
    await page.selectOption("#select-personagem", "warrior");
    await expect(page.locator("#conteudo-resumo-perfil")).toBeVisible();

    // 3. Aba Forjas
    await page.click("#aba-forjas");
    await expect(page.locator("#conteudo-forjas-perfil")).toBeVisible();
    await expect(page).toHaveScreenshot("home-aba-forjas.png", { fullPage: true });

    // 4. Aba Equipamentos
    await page.click("#aba-equipamentos");
    await expect(page.locator("#conteudo-equipamentos-perfil")).toBeVisible();
    await expect(page).toHaveScreenshot("home-aba-equipamentos.png", { fullPage: true });

    // 5. Aba Simulador (Ficha Visual + T6 Prismática)
    await page.click("#aba-simulador");
    await expect(page.locator("#simulador-container")).toBeVisible();
    await expect(page).toHaveScreenshot("home-aba-simulador-ficha.png", { fullPage: true });

    const btnT6 = page.locator('#simulador-container [data-sim-slot-tier="0:6"]').first();
    if (await btnT6.isVisible()) {
      await btnT6.click();
      await page.locator('#simulador-container [data-sim-gem-btn="0:0:ruby"]').first().click();
      await expect(page).toHaveScreenshot("home-aba-simulador-t6.png", { fullPage: true });
    }

    // Modo Criativo do Simulador + Restaurar exemplo
    const btnModoCriativo = page.locator('#simulador-container [data-sim-modo="criativo"]');
    if (await btnModoCriativo.isVisible()) {
      await btnModoCriativo.click();
      await expect(page).toHaveScreenshot("home-aba-simulador-criativo.png", { fullPage: true });
      await page.locator('#simulador-container [data-sim-modo="ficha"]').click();
    }
    await page.click("#btn-sim-resetar");

    // 6. Aba Monstros & Chefes
    await page.click("#aba-monstros");
    await page.fill("#input-monstro-zona", "28");
    await page.fill("#input-monstro-onda", "10");
    await page.fill("#input-monstro-jogadores", "25");
    await expect(page.locator("#resultado-monstros")).toBeVisible();
    await expect(page).toHaveScreenshot("home-aba-monstros.png", { fullPage: true });

    // 7. Aba Radar de Lives
    await page.click("#aba-radar-live");
    await page.fill("#input-radar-canal", "belky");
    await page.click("#btn-escanear-live");
    await expect(page.locator("#status-radar")).not.toContainText("Preparando", { timeout: 5000 });
    await expect(page).toHaveScreenshot("home-aba-radar.png", { fullPage: true });

    // 8. Aba Comparação (P1 vs P2)
    await page.click("#aba-comparacao");
    await expect(page.locator("#conteudo-comparacao-perfil")).toBeVisible();
    const inputNick2 = page.locator("#input-nick-p2, #input-comparar-nick").first();
    if (await inputNick2.isVisible()) {
      await inputNick2.fill("nando");
      await page.locator('#form-comparar button[type="submit"]').click();
      await expect(page.locator("#conteudo-comparacao-perfil")).toContainText("Nando");
    }
    await expect(page).toHaveScreenshot("home-aba-comparacao.png", { fullPage: true });

    expect(erros).toEqual([]);
  });

  test("alternância de fonte do site", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "chromium-mobile", "Teste de fonte no desktop");
    const erros = await prepararPagina(page, "/index.html");
    const valores = await page.locator("#fonte-site option").evaluateAll((opts) => opts.map((o) => o.value));
    if (valores.length > 1) {
      await page.selectOption("#fonte-site", valores[1]);
      await page.evaluate(() => document.fonts?.ready);
      await expect(page).toHaveScreenshot("home-fonte-alternativa.png", { fullPage: true });
    }
    expect(erros).toEqual([]);
  });
});

test.describe("Tier List do Nando (tierlist.html)", () => {
  test("visão inicial Por Utilidade · Todos", async ({ page }, testInfo) => {
    const erros = await prepararPagina(page, "/tierlist.html");

    await expect(page.locator("#tierlist-tabela .tl-card").first()).toBeVisible();
    await expect(page).toHaveScreenshot(`tierlist-utilidade-todos-${testInfo.project.name}.png`, {
      fullPage: true,
    });
    expect(erros).toEqual([]);
  });

  test("filtros por classe, detalhes contextualizados e modo Por FC com T6", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "chromium-mobile", "Fluxo completo da Tier List roda no projeto desktop");
    const erros = await prepararPagina(page, "/tierlist.html");

    // 1. Filtro Guerreiro + detalhe do Anel do Eclipse Arcano
    await page.click('[data-tl-cat="warrior"]');
    await page.click('[data-tl-card="ring_14"]');
    await expect(page.locator("#tierlist-detalhe")).toContainText("Singularidade");
    await expect(page).toHaveScreenshot("tierlist-guerreiro-eclipse.png", { fullPage: true });

    // 2. Filtro Clérigo + detalhe do Anel da Teia Escarlate
    await page.click('[data-tl-cat="cleric"]');
    await page.click('[data-tl-card="ring_19"]');
    await expect(page.locator("#tierlist-detalhe")).toContainText("4,6/s");
    await expect(page).toHaveScreenshot("tierlist-clerigo-teia.png", { fullPage: true });

    // 3. Filtro Arqueiro e Filtro Anéis
    await page.click('[data-tl-cat="archer"]');
    await expect(page.locator("#tierlist-tabela .tl-card").first()).toBeVisible();
    await page.click('[data-tl-cat="ring"]');
    await expect(page).toHaveScreenshot("tierlist-aneis.png", { fullPage: true });

    // 4. Modo Por FC + troca de anel de referência + gemas T6 Prismáticas
    await page.click('[data-tl-cat="todos"]');
    await page.click('[data-tl-modo="fc"]');
    await expect(page.locator("#tierlist-controles-fc")).toBeVisible();
    await page.selectOption("#tierlist-anel-referencia", "14");
    await page.locator('[data-tl-card="set_singular"]').click();
    await expect(page.locator("#tierlist-detalhe .tl-ficha-fc")).toBeVisible();
    await expect(page).toHaveScreenshot("tierlist-fc-ficha-padrao.png", { fullPage: true });

    // Seleciona a arma, coloca T6 Prismática e aplica Rubi em todos os engastes
    await page.click('[data-tl-selecionar-peca="weapon"]');
    await page.getByRole("button", { name: "T6 Prismática" }).click();
    await page.locator('[data-tl-gem-btn$=":ruby"]').first().click();
    const btnRepetir = page.locator('[data-tl-gem-repetir-ativo]');
    if (await btnRepetir.isVisible()) {
      await btnRepetir.click();
    }
    await expect(page.locator("#tierlist-detalhe")).toContainText("T6 Prismática");
    await expect(page).toHaveScreenshot("tierlist-fc-ficha-t6.png", { fullPage: true });

    // Restaurar cenário
    await page.click("#tierlist-restaurar-fc");
    await expect(page.locator("#tierlist-anel-referencia")).toHaveValue("0");

    expect(erros).toEqual([]);
  });
});

