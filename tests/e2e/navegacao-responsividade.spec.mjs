import { test, expect } from "@playwright/test";
import {
  prepararPagina,
  verificarFonteSilkscreenCarregada,
  verificarSemOverflowHorizontal,
} from "./helpers/ambiente.mjs";

test.describe("Navegação, fontes e responsividade", () => {
  test("responsividade sem overflow horizontal em 320px e nos breakpoints principais", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "chromium-mobile", "Testa larguras explícitas no projeto desktop");
    const largurasHome = [320, 519, 521, 639, 641, 899, 901, 1019, 1021, 1280];
    const largurasTierList = [320, 419, 421, 639, 641, 1280];

    await prepararPagina(page, "/index.html");
    await page.fill("#input-nick", "sempoder");
    await page.click('#formulario-busca button[type="submit"]');
    await expect(page.locator("#cabecalho-perfil")).toBeVisible();
    await expect(page.locator("#nome-jogador")).toContainText("JogadorSemPoderOficialComNomeBemLongoParaTeste");

    for (const largura of largurasHome) {
      await page.setViewportSize({ width: largura, height: 800 });
      await verificarSemOverflowHorizontal(page, `home-${largura}px`);
    }

    await page.click("#aba-forjas");
    await page.setViewportSize({ width: 320, height: 800 });
    await verificarSemOverflowHorizontal(page, "home-forjas-320px");

    await prepararPagina(page, "/tierlist.html");
    for (const largura of largurasTierList) {
      await page.setViewportSize({ width: largura, height: 800 });
      await verificarSemOverflowHorizontal(page, `tierlist-${largura}px`);
    }
  });

  test("tabelas mantêm rolagem interna sem empurrar a largura da página", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "chromium-mobile", "Testa viewport estreita 320px no desktop");
    await prepararPagina(page, "/index.html");
    await page.setViewportSize({ width: 320, height: 760 });
    await page.fill("#input-nick", "halscriolo");
    await page.click('#formulario-busca button[type="submit"]');
    await expect(page.locator("#cabecalho-perfil")).toBeVisible();

    await page.click("#aba-forjas");
    await expect(page.locator("#linhas-forjas")).toBeVisible();
    await verificarSemOverflowHorizontal(page, "tabela-forjas-320px");

    const scrollTabela = await page.locator("#secao-forjas .tabela-scroll, #secao-forjas .table-wrap, #secao-forjas table").first().evaluate((el) => {
      const container = el.closest(".tabela-scroll, .table-wrap") || el.parentElement;
      return {
        overflowX: getComputedStyle(container).overflowX,
        scrollWidth: container.scrollWidth,
        clientWidth: container.clientWidth,
      };
    });
    expect(scrollTabela.clientWidth).toBeLessThanOrEqual(320);
  });

  test("abas por mouse, teclado, ?aba=, aba inválida e histórico do navegador", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "chromium-mobile", "Teste de teclado e navegação desktop");
    await prepararPagina(page, "/index.html?aba=forjas");
    await expect(page.locator("#aba-forjas")).toHaveAttribute("aria-selected", "true");
    await expect(page.locator("#secao-forjas")).toBeVisible();

    // Teclado: ArrowRight -> Equipamentos, End -> Comparação, Home -> Resumo
    await page.locator("#aba-forjas").focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#aba-equipamentos")).toHaveAttribute("aria-selected", "true");
    await expect(page.locator("#aba-equipamentos")).toBeFocused();
    await expect(page.locator("#secao-equipamentos")).toBeVisible();

    await page.keyboard.press("End");
    await expect(page.locator("#aba-comparacao")).toHaveAttribute("aria-selected", "true");
    await expect(page.locator("#secao-comparacao")).toBeVisible();

    await page.keyboard.press("Home");
    await expect(page.locator("#aba-resumo")).toHaveAttribute("aria-selected", "true");
    await expect(page.locator("#secao-resumo")).toBeVisible();

    // Aba inválida cai em resumo
    await prepararPagina(page, "/index.html?aba=inexistente");
    await expect(page.locator("#aba-resumo")).toHaveAttribute("aria-selected", "true");

    // Voltar / Avançar com histórico real
    await page.goto("/index.html?aba=monstros", { waitUntil: "networkidle" });
    await expect(page.locator("#aba-monstros")).toHaveAttribute("aria-selected", "true");
    await page.goBack({ waitUntil: "networkidle" });
    await expect(page.locator("#aba-resumo")).toHaveAttribute("aria-selected", "true");
    await page.goForward({ waitUntil: "networkidle" });
    await expect(page.locator("#aba-monstros")).toHaveAttribute("aria-selected", "true");
  });

  test("persistência de fonte entre reload e navegação home <-> tierlist, com fallback sem storage", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "chromium-mobile", "Teste de fonte desktop");
    await prepararPagina(page, "/index.html");
    await verificarFonteSilkscreenCarregada(page);

    await page.selectOption("#fonte-site", "limpa");
    await expect(page.locator("html")).toHaveAttribute("data-fonte", "limpa");

    await page.reload({ waitUntil: "networkidle" });
    await expect(page.locator("html")).toHaveAttribute("data-fonte", "limpa");
    await expect(page.locator("#fonte-site")).toHaveValue("limpa");

    await page.click('a[href*="tierlist.html"]');
    await page.waitForLoadState("networkidle");
    await expect(page.locator("html")).toHaveAttribute("data-fonte", "limpa");
    await expect(page.locator("#fonte-site")).toHaveValue("limpa");

    await page.selectOption("#fonte-site", "pixelada");
    await page.click('a[href*="index.html"]');
    await page.waitForLoadState("networkidle");
    await expect(page.locator("html")).toHaveAttribute("data-fonte", "pixelada");

    // Storage indisponível (lançando SecurityError) não quebra a troca em memória
    await page.addInitScript(() => {
      Object.defineProperty(window, "localStorage", {
        get() {
          throw new DOMException("Storage bloqueado", "SecurityError");
        },
      });
    });
    await page.goto("/index.html", { waitUntil: "networkidle" });
    await expect(page.locator("html")).toHaveAttribute("data-fonte", "pixelada");
    await page.selectOption("#fonte-site", "limpa");
    await expect(page.locator("html")).toHaveAttribute("data-fonte", "limpa");
  });

  test("tooltips e glossário: foco, Esc e busca com e sem acentos", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "chromium-mobile", "Teste de tooltip e glossário");
    await prepararPagina(page, "/index.html");
    await page.fill("#input-nick", "halscriolo");
    await page.click('#formulario-busca button[type="submit"]');
    await expect(page.locator("#cabecalho-perfil")).toBeVisible();

    const btnAjuda = page.locator(".btn-ajuda-termo").first();
    await expect(btnAjuda).toBeVisible();
    await btnAjuda.hover();
    await expect(btnAjuda.locator(".tooltip-conteudo")).toBeVisible();
    await btnAjuda.click();
    await expect(btnAjuda.locator(".tooltip-conteudo")).toBeVisible();
    await page.keyboard.press("Escape");

    const detalhesGlossario = page.locator("#detalhes-glossario-termos");
    await detalhesGlossario.locator("summary").click();
    await expect(detalhesGlossario).toHaveAttribute("open", "");

    const inputBusca = page.locator("#input-busca-glossario");
    await inputBusca.fill("Arcano");
    await expect(page.locator("#conteudo-glossario-busca")).toContainText(/Arcano/i);

    // Busca com acento / sem correspondência
    await inputBusca.fill("Épico");
    await expect(page.locator("#conteudo-glossario-busca")).toContainText(/Épico/i);

    await inputBusca.fill("zzzzTermoInexistente999");
    await expect(page.locator("#conteudo-glossario-busca")).toContainText(/Nenhum termo/i);
  });
});

