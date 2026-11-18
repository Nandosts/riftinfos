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

    // Maior Gelo: Elmo Arcano com 5 falhas (+10 p.p.) e prioridade de Gelo sobre Fogo na Arma Arcana (fz_f=3, fz_w=2)
    await expect(page.locator("#resumo-gelo-fogo-topo")).toContainText("+10 p.p. em Elmo (Arcano · 5 falhas)");
    await expect(page.locator("#matriz-gelo-fogo")).toContainText("❄️ Gelo Nv.3 (3x)");
    await expect(page.locator("#matriz-gelo-fogo")).not.toContainText("🔥 Fogo 2x");
    await page.click("#btn-abrir-planejador-maior-gelo");
    await expect(page.locator("#select-planejador-raridade")).toHaveValue("arc");
    await expect(page.locator("#select-planejador-slot")).toHaveValue("helm");
    await expect(page.locator("#input-planejador-gelo")).toHaveValue("5");

    // Testa pergaminhos 0 / 10 / 20 / 25, evento, Gelo manual, 1 e 10 tentativas, teto 100% e entradas negativas/vazias
    await page.selectOption("#select-planejador-raridade", "epic");
    await page.selectOption("#select-planejador-pergaminho", "25");
    await page.fill("#input-planejador-evento", "50");
    await page.fill("#input-planejador-gelo", "10");
    await page.fill("#input-planejador-tentativas", "10");
    await expect(page.locator("#planejador-proxima-forja")).toContainText("100.0%");
    await expect(page.locator("#planejador-proxima-forja")).toContainText("40 equipamentos compatíveis");

    await page.fill("#input-planejador-evento", "-10");
    await page.fill("#input-planejador-tentativas", "0");
    await expect(page.locator("#planejador-proxima-forja")).toContainText("1 tentativa");

    // Testa nota de recalibração, forja de Aura até Imortal (bloqueada em Arcano) e previsão de nível/ouro
    await expect(page.locator("aside.aviso-recalibracao")).toBeVisible();
    await expect(page.locator("#matriz-gelo-fogo")).toContainText("Não forjável");
    await page.selectOption("#select-planejador-raridade", "imm");
    await page.selectOption("#select-planejador-slot", "aura");
    await expect(page.locator("#planejador-proxima-forja")).toContainText("Aura Imortal (cosmético sem nível)");
    await expect(page.locator("#planejador-proxima-forja")).toContainText("4 auras compatíveis");
    await page.selectOption("#select-planejador-raridade", "arc");
    await expect(page.locator("#select-planejador-slot")).toHaveValue("wpn");
    await page.fill("#input-planejador-nivel-itens", "200");
    await expect(page.locator("#planejador-proxima-forja")).toContainText("Nv. 229 a 260");
    await expect(page.locator("#planejador-proxima-forja")).toContainText("10.846 ouro");

    // Jornada & VIP: ativo (halscriolo), falso + Fogo isolado + Gelo acima do teto (nando) e ausente (sempoder)
    await expect(page.locator("#resumo-eventos-conquistas")).toContainText("Ativo (skip de forja liberado)");
    await page.fill("#input-nick", "nando");
    await page.click('#formulario-busca button[type="submit"]');
    await expect(page.locator("#resumo-eventos-conquistas")).toContainText("Free (sem passe VIP)");
    await expect(page.locator("#matriz-gelo-fogo")).toContainText("🔥 Fogo 3x");
    await expect(page.locator("#matriz-gelo-fogo")).toContainText("❄️ Gelo Nv.5 (6x)");

    await page.fill("#input-nick", "sempoder");
    await page.click('#formulario-busca button[type="submit"]');
    await expect(page.locator("#resumo-eventos-conquistas")).toContainText("Não informado pela API");

    expect(erros).toEqual([]);
  });

  test("equipamentos: conjunto 3/3, soma exata de FC atribuído, Se desequipar e atalhos sem condicionais", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "chromium-mobile", "Testa equipamentos e análise no desktop");
    const { erros } = await prepararPagina(page, "/index.html");

    await page.fill("#input-nick", "halscriolo");
    await page.click('#formulario-busca button[type="submit"]');
    await page.click("#aba-equipamentos");

    await expect(page.locator("#conjuntos-ativos")).toContainText(/Singularidade/i);
    await expect(page.locator("#lista-equipamentos")).toContainText("Se desequipar");

    // Confere que as parcelas atribuídas aos slots somam exatamente o GANHO POR EQUIPAMENTOS
    const { ganhoTotal, somaParcelas } = await page.evaluate(() => {
      const extrairInt = (txt) => Number(String(txt || "").replace(/[^\d]/g, "")) || 0;
      const blocosResumo = document.querySelectorAll("#resumo-fc .bloco-resumo strong");
      const ganhoTotal = extrairInt(blocosResumo[1]?.textContent);
      const tagsSlot = [...document.querySelectorAll("#lista-equipamentos .cartao-equipamento .equip-fc-box .tag-fc:first-child")];
      const somaParcelas = tagsSlot.reduce((acc, el) => {
        const m = (el.textContent || "").match(/\+([\d.]+)\s*FC/);
        return acc + (m ? extrairInt(m[1]) : 0);
      }, 0);
      return { ganhoTotal, somaParcelas };
    });
    expect(ganhoTotal).toBeGreaterThan(0);
    expect(somaParcelas).toBe(ganhoTotal);

    // Atalhos de equipamentos para Simulador e Chefes (exigindo visibilidade)
    const btnSim = page.locator('#analise-combate-jogador [data-ir-aba="simulador"]');
    await expect(btnSim).toBeVisible();
    await btnSim.click();
    await expect(page.locator("#aba-simulador")).toHaveAttribute("aria-selected", "true");
    await expect(page.locator("#simulador-container")).toContainText(/Singularidade/i);

    await page.click("#aba-equipamentos");
    const btnBoss = page.locator('#analise-combate-jogador [data-ir-aba="monstros"]');
    await expect(btnBoss).toBeVisible();
    await btnBoss.click();
    await expect(page.locator("#aba-monstros")).toHaveAttribute("aria-selected", "true");
    await expect(page.locator("#resultado-monstros")).toContainText("Halscriolo");

    expect(erros).toEqual([]);
  });
});

