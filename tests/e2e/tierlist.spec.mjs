import { test, expect } from "@playwright/test";
import { prepararPagina, verificarCanvasComSprite } from "./helpers/ambiente.mjs";

test.describe("Tier List (funcional completo)", () => {
  test("matriz completa 2x5 (Por Utilidade e Por FC x Todos, classes e Anéis) e catálogo por classe, conjuntos, armas e anéis", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "chromium-mobile", "Matriz completa roda no desktop");
    const { erros, controleApi } = await prepararPagina(page, "/tierlist.html");

    const filtros = ["todos", "warrior", "archer", "cleric", "ring"];
    const modos = ["utilidade", "fc"];

    for (const modo of modos) {
      await page.click(`[data-tl-modo="${modo}"]`);
      for (const filtro of filtros) {
        await page.click(`[data-tl-cat="${filtro}"]`);
        const cards = page.locator("#tierlist-tabela .tl-card");
        const qtd = await cards.count();
        expect(qtd).toBeGreaterThan(0);

        const ids = await cards.evaluateAll((els) => els.map((e) => e.dataset.tlCard));
        const rings = ids.filter((id) => id.startsWith("ring_"));
        const sets = ids.filter((id) => id.startsWith("set_"));

        if (filtro === "todos") {
          expect(sets.length).toBe(modo === "utilidade" ? 36 : 24);
          expect(rings.length).toBe(10);
        } else if (filtro === "ring") {
          expect(sets.length).toBe(0);
          expect(rings.length).toBe(10);
        } else {
          expect(sets.length).toBe(modo === "utilidade" ? 12 : 8);
          expect(rings.length).toBe(10);
        }
      }
    }

    // Confere a seleção dos cards na visão Todos.
    await page.click('[data-tl-modo="utilidade"]');
    await page.click('[data-tl-cat="todos"]');
    const todosIds = await page.locator("#tierlist-tabela .tl-card").evaluateAll((els) =>
      els.map((e) => e.dataset.tlCard)
    );
    expect(todosIds.length).toBe(66);

    for (const id of todosIds) {
      const card = page.locator(`[data-tl-card="${id}"]`);
      await card.click();
      await expect(page.locator("#tierlist-detalhe")).not.toBeEmpty();
    }

    await page.click('[data-tl-card="set_royalclock"]');
    await expect(page.locator("#tierlist-detalhe")).toContainText("revive um aliado com 45% de vida");
    await expect(page.locator("#tierlist-detalhe")).toContainText("Cidade Mecânica");
    await page.click('[data-tl-modo="fc"]');
    await expect(page.locator('[data-tl-card="set_royalclock"]')).toHaveCount(0);
    await expect(page.locator("#tierlist-detalhe .tl-ficha-fc")).toBeVisible();
    await page.click('[data-tl-modo="utilidade"]');

    // Avalia os 10 anéis nas 3 classes
    for (const cls of ["warrior", "archer", "cleric"]) {
      await page.click(`[data-tl-cat="${cls}"]`);
      const ringCards = await page.locator('#tierlist-tabela .tl-card[data-tl-card^="ring_"]').evaluateAll((els) =>
        els.map((e) => e.dataset.tlCard)
      );
      expect(ringCards.length).toBe(10);
      for (const rid of ringCards.slice(0, 3)) {
        await page.click(`[data-tl-card="${rid}"]`);
        await expect(page.locator("#tierlist-detalhe")).not.toBeEmpty();
      }
    }

    expect(controleApi.rotasInesperadas).toEqual([]);
    expect(erros).toEqual([]);
  });

  test("Relojoeiro acima da Árvore-Mundo e conjuntos Épicos e armas Lendárias", async ({ page }) => {
    const { erros } = await prepararPagina(page, "/tierlist.html");
    await page.click('[data-tl-cat="cleric"]');
    const ids = await page.locator(".tl-tier-splus .tl-card").evaluateAll((cards) => cards.map((card) => card.dataset.tlCard));
    expect(ids.indexOf("set_royalclock")).toBeLessThan(ids.indexOf("set_worldtree"));
    await page.click('[data-tl-card="set_royalclock"]');
    const detalhe = page.locator("#tierlist-detalhe");
    await expect(detalhe).toContainText("recarga restante das habilidades de classe");
    await expect(detalhe).toContainText("cerca de 59%");
    await expect(page.locator('[data-tl-card="set_lunar"]')).toHaveClass(/epico/);

    const filtroArmas = page.locator('[data-tl-cat="weapon"]');
    await page.click('[data-tl-cat="todos"]');
    await expect(page.locator(".tl-tier-s .tl-card").last()).toHaveAttribute("data-tl-card", "weapon_reaper");
    await expect(page.locator('.tl-tier-c [data-tl-card="weapon_greatsword"]')).toBeVisible();
    await expect(page.locator('.tl-tier-b [data-tl-card="weapon_chainblade"]')).toBeVisible();
    const tierA = await page.locator(".tl-tier-a .tl-card").evaluateAll((cards) => cards.map((card) => card.dataset.tlCard));
    expect(tierA.indexOf("weapon_dawnscepter")).toBeGreaterThan(tierA.indexOf("set_obsidian"));
    expect(tierA.indexOf("weapon_dawnscepter")).toBeGreaterThan(tierA.indexOf("set_etheralch"));
    await filtroArmas.click();
    await expect(page.locator(".tl-card")).toHaveCount(20);
    const foice = page.locator('[data-tl-card="weapon_reaper"]');
    await expect(foice).toHaveClass(/lendario/);
    await foice.click();
    await expect(detalhe).toContainText("40%");
    await expect(detalhe).toContainText("12%");
    await expect(detalhe).toContainText("até 20% de vida");
    await expect(detalhe).toContainText("Ceifador Espectral (Lendário)");
    await expect(detalhe).toContainText("Esse eco no mesmo alvo entra na conta da cura.");
    await expect(detalhe).toContainText("A execução não aciona o anel.");
    await expect(detalhe).toContainText("4 engastes");
    await expect(detalhe).toContainText("Bônus com 2 peças");
    await expect(detalhe).toContainText("Bônus adicional com 3 peças");

    await page.click('[data-tl-modo="fc"]');
    await expect(filtroArmas).toBeHidden();
    await expect(foice).toHaveCount(0);
    await expect(page.locator("#tierlist-detalhe .tl-ficha-fc")).toBeVisible();
    expect(erros).toEqual([]);
  });

  test("seleção por teclado, troca de filtro preservando/substituindo item e retorno entre modos", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "chromium-mobile", "Teste de seleção desktop");
    await prepararPagina(page, "/tierlist.html");

    await page.click('[data-tl-cat="warrior"]');
    const cardSingular = page.locator('[data-tl-card="set_singular"]');
    await cardSingular.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#tierlist-detalhe")).toContainText(/Singularidade/i);

    // Troca para Todos mantém o item elegível selecionado
    await page.click('[data-tl-cat="todos"]');
    await expect(page.locator("#tierlist-detalhe")).toContainText(/Singularidade/i);

    // Troca para Anéis substitui seleção porque set_singular não pertence ao filtro Anéis
    await page.click('[data-tl-cat="ring"]');
    await expect(page.locator("#tierlist-detalhe")).not.toContainText(/Singularidade/i);

    // Alterna Por FC e volta para Por Utilidade
    await page.click('[data-tl-modo="fc"]');
    await expect(page.locator("#tierlist-controles-fc")).toBeVisible();
    await page.click('[data-tl-modo="utilidade"]');
    await expect(page.locator("#tierlist-controles-fc")).toBeHidden();
  });

  test("modo Por FC: anel de referência recalcula ranking, anel simulado isolado e editor de gemas + Restaurar cenário", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "chromium-mobile", "Editor de FC completo no desktop");
    const { erros } = await prepararPagina(page, "/tierlist.html");

    await page.click('[data-tl-cat="todos"]');
    await page.click('[data-tl-modo="fc"]');
    await expect(page.locator("#tierlist-controles-fc")).toBeVisible();

    const fcSemAnel = await page.locator('[data-tl-card="set_singular"]').innerText();
    await page.selectOption("#tierlist-anel-referencia", "14");
    const fcComAnel = await page.locator('[data-tl-card="set_singular"]').innerText();
    expect(fcComAnel).not.toEqual(fcSemAnel);

    // Abre conjunto, verifica canvas e FC no detalhe
    await page.locator('[data-tl-card="set_singular"]').click();
    await expect(page.locator("#tierlist-detalhe .tl-ficha-fc")).toBeVisible();
    await verificarCanvasComSprite(page, "canvas[data-tl-heroi]");

    // Abre um anel (simulado sozinho, independente do anel de referência dos conjuntos)
    await page.locator('[data-tl-card="ring_15"]').click();
    await expect(page.locator("#tierlist-detalhe")).toContainText(/Vazio|Coração/i);

    // Volta ao conjunto, edita gema T6, propaga para outro conjunto e depois restaura cenário
    await page.locator('[data-tl-card="set_singular"]').click();
    await page.click('[data-tl-selecionar-peca="weapon"]');
    const btnT6 = page.getByRole("button", { name: "T6 Prismática" });
    await expect(btnT6).toBeEnabled();
    await btnT6.click();
    await page.locator('[data-tl-gem-btn$=":ruby"]').first().click();

    const btnRepetir = page.locator("[data-tl-gem-repetir-ativo]");
    await expect(btnRepetir).toBeVisible();
    await btnRepetir.click();

    // Limpar 1 gema ([data-tl-gem-limpar-unico]), re-rolar ([data-tl-gem-reroll]) e limpar peça ([data-tl-gem-limpar])
    const btnLimparUnico = page.locator("[data-tl-gem-limpar-unico]");
    await expect(btnLimparUnico).toBeVisible();
    await btnLimparUnico.click();
    await expect(page.locator('[data-tl-selecionar-engaste="0"]')).toContainText(/Vazio/i);

    const btnReroll = page.locator("[data-tl-gem-reroll]");
    await expect(btnReroll).toBeVisible();
    await btnReroll.click();

    const btnLimparPeca = page.locator("[data-tl-gem-limpar]");
    await expect(btnLimparPeca).toBeVisible();
    await btnLimparPeca.click();
    await expect(page.locator("#tierlist-detalhe")).toContainText("ENGASTES DE GEMAS (0/5)");

    // Coloca Safira T6 novamente para verificar propagação entre conjuntos
    await page.getByRole("button", { name: "T6 Prismática" }).click();
    await page.locator('[data-tl-gem-btn$=":sapphire"]').first().click();

    // Verifica propagação ao trocar para outro conjunto na mesma peça
    await page.locator('[data-tl-card="set_chrono"]').click();
    await page.click('[data-tl-selecionar-peca="weapon"]');
    await expect(page.locator("#tierlist-detalhe")).toContainText(/T6 Prismática/i);

    // Restaurar cenário recupera anel=0 e estado inicial
    await page.click("#tierlist-restaurar-fc");
    await expect(page.locator("#tierlist-anel-referencia")).toHaveValue("0");

    // Verifica que itens distintos exibem stats reais distintos na ficha Por FC
    await page.locator('[data-tl-card="set_trapeze"]').click();
    await expect(page.locator('#tierlist-detalhe [data-tl-slot="weapon"]')).toContainText("3026");
    await expect(page.locator('#tierlist-detalhe [data-tl-slot="weapon"]')).toContainText("+18%");
    await page.locator('[data-tl-card="set_auroraborealis"]').click();
    await expect(page.locator('#tierlist-detalhe [data-tl-slot="weapon"]')).toContainText("1007");
    await expect(page.locator('#tierlist-detalhe [data-tl-slot="weapon"]')).toContainText("+8%");

    expect(erros).toEqual([]);
  });
});

