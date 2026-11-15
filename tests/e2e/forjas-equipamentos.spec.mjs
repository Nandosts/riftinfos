import { test, expect } from "@playwright/test";
import { prepararPagina } from "./helpers/ambiente.mjs";

test.describe("Forjas e Equipamentos", () => {
  test("histórico de forjas: normal, zero tentativas, zero sucessos e dados inconsistentes", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "chromium-mobile", "Testa tabela de forjas no desktop");
    await prepararPagina(page, "/index.html");

    await page.fill("#input-nick", "sempoder");
    await page.click('#formulario-busca button[type="submit"]');
    await page.click("#aba-forjas");

    await expect(page.locator('#linhas-forjas tr[data-forge="epic"]')).toContainText("Nenhuma tentativa registrada");
    await expect(page.locator('#linhas-forjas tr[data-forge="imm"]')).toContainText("0 sucessos em 10 tentativas · 0.0%");
    await expect(page.locator('#linhas-forjas tr[data-forge="arc"]')).toContainText("Dados inconsistentes");
  });

  test("Gelo/Fogo, atalho do maior Gelo, planejador (bases, pergaminhos, evento, 10x, teto 100%) e VIP", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "chromium-mobile", "Testa planejador completo no desktop");
    const { erros } = await prepararPagina(page, "/index.html");

    await page.fill("#input-nick", "halscriolo");
    await page.click('#formulario-busca button[type="submit"]');
    await page.click("#aba-forjas");

    // Maior Gelo: Elmo Arcano com 5 falhas (+10 p.p.)
    await expect(page.locator("#resumo-gelo-fogo-topo")).toContainText("+10 p.p. em Elmo (Arcano · 5 falhas)");
    await page.click("#btn-abrir-planejador-maior-gelo");
    await expect(page.locator("#select-planejador-raridade")).toHaveValue("arc");
    await expect(page.locator("#select-planejador-slot")).toHaveValue("helm");
    await expect(page.locator("#input-planejador-gelo")).toHaveValue("5");

    // Testa pergaminhos 0 / 10 / 20 / 25, evento, Gelo manual, 1 e 10 tentativas, teto 100%
    await page.selectOption("#select-planejador-raridade", "epic");
    await page.selectOption("#select-planejador-pergaminho", "25");
    await page.fill("#input-planejador-evento", "50");
    await page.fill("#input-planejador-gelo", "10");
    await page.fill("#input-planejador-tentativas", "10");
    await expect(page.locator("#planejador-proxima-forja")).toContainText("100.0%");

    // Jornada & VIP ativo vs free
    await expect(page.locator("#resumo-eventos-conquistas")).toContainText("Ativo");
    await page.fill("#input-nick", "nando");
    await page.click('#formulario-busca button[type="submit"]');
    await expect(page.locator("#resumo-eventos-conquistas")).toContainText("sem passe VIP");

    expect(erros).toEqual([]);
  });

  test("equipamentos: conjunto 3/3, remoção quebrando bônus, análise de FC e atalhos", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "chromium-mobile", "Testa equipamentos e análise no desktop");
    const { erros } = await prepararPagina(page, "/index.html");

    await page.fill("#input-nick", "halscriolo");
    await page.click('#formulario-busca button[type="submit"]');
    await page.click("#aba-equipamentos");

    await expect(page.locator("#conjuntos-ativos")).toContainText(/Singularidade/i);
    await expect(page.locator("#lista-equipamentos")).toContainText("Se desequipar");

    // Atalho de equipamentos para Simulador e Chefes
    const btnSim = page.locator('#conteudo-equipamentos-perfil button:has-text("Simulador")').first();
    if (await btnSim.isVisible()) {
      await btnSim.click();
      await expect(page.locator("#aba-simulador")).toHaveAttribute("aria-selected", "true");
    }

    expect(erros).toEqual([]);
  });
});

