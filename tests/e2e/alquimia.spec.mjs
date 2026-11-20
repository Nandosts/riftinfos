import { test, expect } from "@playwright/test";
import { prepararPagina, verificarSemOverflowHorizontal } from "./helpers/ambiente.mjs";

test.describe("Página de Alquimia (alquimia.html)", () => {
  test("carrega atalho Simular meus itens no topo, guia, 5 fragmentos e faixas datadas no patch de 20/11", async ({ page }) => {
    const { erros, controleApi } = await prepararPagina(page, "/alquimia.html");

    await expect(page.locator("h1")).toContainText("Alquimia");

    // Atalho "Simular meus itens" logo no topo apontando para a calculadora
    const atalhoSimular = page.locator("#btn-atalho-simular-itens");
    await expect(atalhoSimular).toBeVisible();
    await expect(atalhoSimular).toContainText("Simular meus itens");
    await expect(atalhoSimular).toHaveAttribute("href", "#secao-calculadora-alquimia");

    // 5 fragmentos em SVG pixel-art (Ferro, Cobre, Prata, Mithril, Ouro Rúnico)
    const cardsFragmentos = page.locator("#galeria-fragmentos .card-fragmento");
    await expect(cardsFragmentos).toHaveCount(5);
    await expect(page.locator("#galeria-fragmentos svg.svg-fragmento")).toHaveCount(5);
    await expect(page.locator("#galeria-fragmentos")).toContainText("Ferro");
    await expect(page.locator("#galeria-fragmentos")).toContainText("Mithril");
    await expect(page.locator("#galeria-fragmentos")).toContainText("Ouro Rúnico");

    // Alternar o emblema de peça na galeria
    await page.click('[data-galeria-peca="ring"]');
    await expect(page.locator('[data-galeria-peca="ring"]')).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("#galeria-fragmentos")).toContainText("Anel");

    // Proteções e itens fora da Alquimia
    await expect(page.locator(".bloco-regra-protecao")).toContainText("equipados");
    await expect(page.locator(".bloco-regra-protecao")).toContainText("favoritos");
    await expect(page.locator(".bloco-regra-protecao")).toContainText("gemas engastadas");
    await expect(page.locator(".bloco-regra-protecao")).toContainText("Evento");

    // As cinco faixas estão disponíveis.
    const linhasFaixas = page.locator("#corpo-tabela-faixas tr");
    await expect(linhasFaixas).toHaveCount(5);
    await expect(linhasFaixas.nth(0)).toContainText("Nv. 0–24");
    await expect(linhasFaixas.nth(0)).toContainText("Disponível no patch de 20/11");
    await expect(linhasFaixas.nth(3)).toContainText("Nv. 80–110");
    await expect(linhasFaixas.nth(3)).toContainText("Disponível no patch de 20/11");
    await expect(linhasFaixas.nth(4)).toContainText("Nv. 111–150");
    await expect(linhasFaixas.nth(4)).toContainText("Disponível no patch de 20/11");

    expect(controleApi.rotasInesperadas).toEqual([]);
    expect(erros).toEqual([]);
  });

  test("calculadora destaca caso de 9 fragmentos, pede nível de referência sem pré-preencher 60 e compara entrada x saída", async ({ page }) => {
    const { erros, controleApi } = await prepararPagina(page, "/alquimia.html");

    // Estado inicial: 9 equipamentos, nível médio vazio (sem 60 pré-preenchido)
    await expect(page.locator("#input-alquimia-nivel-medio")).toHaveValue("");
    await expect(page.locator(".comparativo-nivel-entrada")).toHaveAttribute("data-relacao-nivel", "pendente");
    await expect(page.locator(".comparativo-nivel-entrada")).toContainText("Informe o nível médio");

    // Caso de 9 fragmentos: guardando = 1 criação e 4 sobra; reciclando = 2 criações e 0 sobra se guardar o último
    await expect(page.locator('[data-valor="criacoes-guardando"]')).toContainText("1 criação");
    await expect(page.locator('[data-valor="sobra-guardando"]')).toHaveText("4");
    await expect(page.locator('[data-valor="criacoes-reciclando"]')).toContainText("2 criações");
    await expect(page.locator('[data-valor="sobra-guardando-ultimo"]')).toHaveText("0");
    await expect(page.locator('[data-valor="sobra-reciclando"]')).toHaveText("1");
    await expect(page.locator('[data-valor="faixa-gerada"]')).toHaveText("Nv. 80–110");

    // Informar nível médio 150 com Alquimia Nv. 4 (80–110) destaca que a saída fica abaixo da média
    await page.fill("#input-alquimia-nivel-medio", "150");
    await expect(page.locator(".comparativo-nivel-entrada")).toHaveAttribute("data-relacao-nivel", "abaixo");
    await expect(page.locator('[data-valor="nivel-entrada"]')).toContainText("Média Nv. 150");
    await expect(page.locator(".comparativo-nivel-entrada")).toContainText("abaixo da média informada");
    await expect(page.locator("#input-comparacao-nivel-medio")).toHaveValue("150");
    await expect(page.locator('[data-caminho="forja"]')).toContainText("Nv. 172–195");

    // Trocar média válida (150) por valor inválido (1500 e depois abc) esconde cálculo anterior e mostra mensagem junto ao campo
    await page.fill("#input-alquimia-nivel-medio", "1500");
    await expect(page.locator("#input-alquimia-nivel-medio")).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#erro-alquimia-nivel-medio")).toBeVisible();
    await expect(page.locator("#erro-alquimia-nivel-medio")).toContainText("1 e 999");
    await expect(page.locator(".comparativo-nivel-entrada")).toHaveAttribute("data-relacao-nivel", "invalido");
    await expect(page.locator(".comparativo-nivel-entrada")).not.toContainText("Média Nv. 150");
    await expect(page.locator('[data-caminho="forja"]')).not.toContainText("Nv. 172–195");
    await expect(page.locator('[data-caminho="forja"]')).toContainText("Corrija o nível médio");

    // Corrigir para valor válido limpa o erro e volta a calcular
    await page.fill("#input-alquimia-nivel-medio", "150");
    await expect(page.locator("#erro-alquimia-nivel-medio")).toBeHidden();
    await expect(page.locator("#input-alquimia-nivel-medio")).not.toHaveAttribute("aria-invalid", "true");
    await expect(page.locator('[data-valor="nivel-entrada"]')).toContainText("Média Nv. 150");

    // Selecionar Nv. 5 exibe a faixa 111–150.
    await page.click('label[for="radio-nivel-5"]');
    await expect(page.locator('[data-valor="faixa-gerada"]')).toHaveText("Nv. 111–150");
    await expect(page.locator(".aviso-inline-wiki")).toHaveCount(0);

    // EXP de criação marcado como estimativa
    await expect(page.locator(".faixa-gerada-bloco")).toContainText("EXP de criação (estimativa)");

    expect(controleApi.rotasInesperadas).toEqual([]);
    expect(erros).toEqual([]);
  });

  test("comparação aceita média decimal (81,75 -> teto 106), explica saldo guardado vs equipamentos e não recomenda automaticamente", async ({ page }) => {
    const { erros, controleApi } = await prepararPagina(page, "/alquimia.html");

    // 1. Teste de 0 equipamentos + 10 fragmentos guardados: explica saldo guardado na Alquimia vs só equipamentos em Forja/Aprimorar
    await page.fill("#input-alquimia-quantidade", "0");
    await page.fill("#input-alquimia-guardados", "10");

    const cardAlquimia = page.locator('[data-caminho="alquimia"]');
    const cardForja = page.locator('[data-caminho="forja"]');
    const cardAprimorar = page.locator('[data-caminho="aprimorar"]');

    await expect(cardAlquimia).toContainText("10 frag.");
    await expect(cardAlquimia).toContainText("Guardando: 2");
    await expect(cardForja).toContainText("só equipamentos");
    await expect(cardForja).toContainText("não entram na Forja");
    await expect(cardAprimorar).toContainText("só equipamentos");
    await expect(cardAprimorar).toContainText("não entram no Aprimorar");

    // 2. Média decimal 81,75 em Épico (Forja -> Lendário): floor(81.75*1.15)=94, floor(81.75*1.3)=106
    await page.click('label[for="radio-raridade-3"]');
    await page.fill("#input-alquimia-quantidade", "20");
    await page.fill("#input-alquimia-guardados", "0");
    await page.fill("#input-alquimia-nivel-medio", "81,75");

    await expect(cardForja).toContainText("5 tentativa(s) de 4 itens");
    await expect(cardForja).toContainText("Nv. 94–106");
    await expect(cardForja).toContainText("50%");
    await expect(cardAprimorar).toContainText("20 doador(es) em 1 lote(s) de até 30 peças");

    // Sem recomendação automática de "melhor opção"
    const textoComp = await page.locator("#conteudo-comparacao-destinos").innerText();
    expect(textoComp.toLowerCase()).not.toContain("melhor opção");
    expect(textoComp.toLowerCase()).not.toContain("recomendado");

    expect(controleApi.rotasInesperadas).toEqual([]);
    expect(erros).toEqual([]);
  });

  test("celular exibe resumo por caminho com tabela completa expansível abaixo e zero overflow em 320px", async ({ page }, testInfo) => {
    const { erros, controleApi } = await prepararPagina(page, "/alquimia.html");

    if (testInfo.project.name === "chromium-mobile") {
      await expect(page.locator(".grade-resumo-caminhos .card-caminho")).toHaveCount(3);
      const detalhes = page.locator("#detalhes-tabela-comparacao");
      await expect(detalhes).not.toHaveAttribute("open", "");
      await detalhes.locator("summary").click();
      await expect(detalhes).toHaveAttribute("open", "");
      await expect(detalhes.locator(".tabela-comparacao-destinos")).toBeVisible();
      await verificarSemOverflowHorizontal(page, "alquimia-mobile-390px");
    } else {
      for (const largura of [320, 420, 640, 1280]) {
        await page.setViewportSize({ width: largura, height: 800 });
        await verificarSemOverflowHorizontal(page, `alquimia-${largura}px`);
      }
    }

    expect(controleApi.rotasInesperadas).toEqual([]);
    expect(erros).toEqual([]);
  });

  test("atalho na aba Forjas de index.html abre alquimia.html corretamente", async ({ page }) => {
    const { erros } = await prepararPagina(page, "/index.html?aba=forjas");

    const atalho = page.locator("#btn-atalho-alquimia");
    await expect(atalho).toBeVisible();
    await atalho.click();
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL(/alquimia\.html/);
    await expect(page.locator("h1")).toContainText("Alquimia");
    expect(erros).toEqual([]);
  });
});
