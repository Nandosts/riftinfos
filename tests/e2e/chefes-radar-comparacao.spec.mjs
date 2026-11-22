import { test, expect } from "@playwright/test";
import { prepararPagina, verificarSemOverflowHorizontal } from "./helpers/ambiente.mjs";

test.describe("Chefes, Radar e Comparação", () => {
  test("mostra quantos ataques derrotam o alvo e aplica os ajustes da live", async ({ page }) => {
    await prepararPagina(page, "/index.html");
    await page.click("#aba-monstros");
    await page.fill("#input-monstro-zona", "1");
    await page.fill("#input-monstro-onda", "1");
    await page.fill("#input-monstro-jogadores", "1");
    const lacaio = page.locator(".grade-monstros .card-monstro").first();
    const indicadores = page.locator(".grade-tres-indicadores-boss");
    const teto = page.locator("#input-teto-dano-inimigos");
    await expect(teto).toHaveValue("66");
    await teto.fill("100");
    await expect(lacaio).toContainText("Placar (alvo com vida cheia)");
    await expect(indicadores.locator(".valor-indicador").first()).toContainText("/s");
    await expect(lacaio).toContainText("Normais: 1 · Críticos: 1");
    await teto.fill("20");
    await expect(lacaio.locator(".card-info-linha").filter({ hasText: "Teto de dano por acerto" })).toContainText("7");
    await expect(lacaio).toContainText("Normal: 7 · Crítico: 7");
    await expect(lacaio).toContainText("Normais: 5 · Críticos: 5");
    await page.fill("#input-monstro-hp", "200");
    await expect(lacaio).toContainText("Normal: 13 · Crítico: 13");
    await expect(indicadores.locator(".valor-indicador").first()).toHaveText("—");
    await verificarSemOverflowHorizontal(page, "monstros-teto-de-dano");
    await teto.fill("100");
    await expect(lacaio).not.toContainText("Teto de dano por acerto");
    await expect(indicadores.locator(".valor-indicador").first()).toContainText("/s");
    const ataque = lacaio.locator(".card-info-linha").filter({ hasText: "Seu ataque básico" });
    const ataquePadrao = await ataque.innerText();
    await page.fill("#input-monstro-dano-heroi", "50");
    await expect(ataque).not.toHaveText(ataquePadrao);
    await expect(indicadores.locator(".valor-indicador").first()).toHaveText("—");
  });

  test("compartilha a onda e a build dos chefes, com cópia manual se o navegador bloquear", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          async writeText(texto) {
            if (window.bloquearCopia) throw new Error("Cópia bloqueada");
            window.linkCopiado = texto;
          },
        },
      });
    });
    await prepararPagina(page, "/index.html?aba=monstros");
    await page.fill("#input-monstro-zona", "5");
    await page.fill("#input-monstro-onda", "9");
    await page.fill("#input-monstro-jogadores", "1");
    await page.selectOption("#select-monstro-origem", "simulador");
    const botao = page.locator("#btn-copiar-cenario-monstros");
    const status = page.locator("#status-copiar-cenario-monstros");
    await botao.click();
    await expect(status).toHaveText("Link copiado.");
    const link = await page.evaluate(() => window.linkCopiado);
    expect(new URL(link).hash).toMatch(/^#build=/);

    await page.evaluate(() => { window.bloquearCopia = true; });
    await botao.click();
    await expect(page.locator("#link-cenario-monstros")).toBeVisible();
    await expect(page.locator("#link-cenario-monstros")).toBeFocused();
    await page.goto(await page.locator("#link-cenario-monstros").inputValue());
    await expect(page.locator("#secao-monstros")).toBeVisible();
    await expect(page.locator("#input-monstro-zona")).toHaveValue("5");
    await expect(page.locator("#input-monstro-onda")).toHaveValue("9");
    await expect(page.locator("#input-monstro-jogadores")).toHaveValue("1");
    await expect(page.locator("#input-teto-dano-inimigos")).toHaveValue("66");
    await expect(page.locator("#select-monstro-origem")).toHaveValue("simulador");
  });

  test("mostra auras dos chefes e a redução da Singularidade na Têmpera", async ({ page }) => {
    const { erros } = await prepararPagina(page, "/index.html?aba=monstros&zona=4&onda=10&herois=1&origem=simulador");
    const chefe = page.locator(".card-monstro.boss");
    await expect(chefe).toContainText("Aura Escaldante (ao se aproximar)");
    await page.selectOption("#select-variante-chefe", "alternativo");
    await expect(chefe).toContainText("2.175 antes da redução");
    await expect(chefe).toContainText("261 de dano · conta 870 para quebrar");
    await expect(chefe).not.toContainText("Aura Escaldante");
    await page.fill("#input-teto-dano-inimigos", "100");
    await expect(page.locator(".grade-tres-indicadores-boss")).toContainText("O tempo estimado deixa de fora a redução durante a Têmpera.");

    await page.fill("#input-monstro-zona", "3");
    await page.fill("#input-monstro-onda", "1");
    await page.selectOption("#select-variante-chefe", "principal");
    await expect(chefe).toContainText("Presença Gélida (ao se aproximar)");
    await expect(chefe).toContainText("O chefe aparece na onda 10.");
    await page.selectOption("#select-variante-chefe", "alternativo");
    await expect(chefe).not.toContainText("Presença Gélida");
    await verificarSemOverflowHorizontal(page, "defesas e auras dos chefes");
    expect(erros).toEqual([]);
  });

  test("Gruk e Mímico na zona 20, frenesi e seleção em telas pequenas", async ({ page }, testInfo) => {
    const { erros } = await prepararPagina(page, "/index.html");
    await page.fill("#input-nick", "halscriolo");
    await page.click('#formulario-busca button[type="submit"]');
    await page.click("#aba-monstros");
    await page.fill("#input-monstro-zona", "20");
    await page.fill("#input-monstro-onda", "10");
    const chefe = page.locator(".card-monstro.boss");
    const ataque = () => chefe.locator(".card-info-linha").filter({ hasText: "ATK / DEF" }).innerText();
    await expect(chefe).toContainText("SENHOR DA GUERRA GRUK");
    await expect(page.locator("#resultado-monstros")).toContainText("+25% ATK");
    const seletor = await page.locator("#select-variante-chefe").boundingBox();
    expect(seletor.x).toBeGreaterThanOrEqual(0);
    expect(seletor.x + seletor.width).toBeLessThanOrEqual(page.viewportSize().width);
    await page.locator(".controles-variante-chefe").screenshot({ path: `/tmp/riftinfos-gruk-${testInfo.project.name}.png` });
    const ataqueBase = await ataque();
    await page.check("#input-frenesi-gruk");
    expect(await ataque()).not.toBe(ataqueBase);
    await page.uncheck("#input-frenesi-gruk");
    expect(await ataque()).toBe(ataqueBase);
    const hpBase = await chefe.locator(".card-info-linha").filter({ hasText: "HP Total" }).innerText();
    await page.selectOption("#select-variante-chefe", "alternativo");
    await expect(chefe).toContainText("MÍMICO VORAZ");
    await expect(page.locator("#resultado-monstros")).toContainText("CD Base: 8s");
    expect(await chefe.locator(".card-info-linha").filter({ hasText: "HP Total" }).innerText()).not.toBe(hpBase);
    await expect(page.locator("#input-frenesi-gruk")).toHaveCount(0);
    await page.selectOption("#select-variante-chefe", "principal");
    expect(await ataque()).toBe(ataqueBase);
    await page.fill("#input-monstro-zona", "16");
    await expect(page.locator("#select-variante-chefe")).toHaveCount(0);
    expect(erros).toEqual([]);
  });

  test("Zona 17-10 exibe Anel de Fogo no Mestre de Cerimônias e zonas com 2 chefes alternam sem frenesi do Gruk", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "chromium-mobile", "Testa variantes revisadas no desktop");
    const { erros } = await prepararPagina(page, "/index.html");
    await page.fill("#input-nick", "halscriolo");
    await page.click('#formulario-busca button[type="submit"]');
    await page.click("#aba-monstros");

    // Zona 17-10: Circo dos Horrores (Mestre de Cerimônias com ANEL DE FOGO e os 6 efeitos da Roleta)
    await page.fill("#input-monstro-zona", "17");
    await page.fill("#input-monstro-onda", "10");
    await expect(page.locator(".card-monstro.boss")).toContainText("MESTRE DE CERIMÔNIAS");
    await expect(page.locator("#resultado-monstros")).toContainText("ANEL DE FOGO");
    await expect(page.locator("#resultado-monstros")).toContainText("HOLOFOTE");
    await expect(page.locator("#resultado-monstros")).toContainText("ESTRONDO");
    const risco = page.locator(".resumo-sobrevivencia-chefe");
    await expect(risco).toContainText("Começando com vida cheia");
    await expect(risco).toContainText("Pode cair no primeiro dano contínuo (em cerca de 0,5 s)");
    await expect(page.locator(".card-monstro.boss")).toContainText("Facas:");
    await expect(risco.getByText("Impacto:", { exact: false })).toBeHidden();
    await risco.getByText("Ver detalhes do dano").click();
    await expect(risco.getByText("Impacto:", { exact: false })).toBeVisible();
    await expect(page.locator("#resultado-monstros")).toContainText("Atributos base");
    await expect(page.locator("#select-variante-chefe")).toHaveCount(0);

    // Zona 22-10: Fornalha Infernal (Senhor Demônio / Forjador de Almas, sem checkbox de frenesi do Gruk)
    await page.fill("#input-monstro-zona", "22");
    await expect(page.locator(".card-monstro.boss")).toContainText("SENHOR DEMÔNIO");
    await expect(page.locator("#input-frenesi-gruk")).toHaveCount(0);
    await page.selectOption("#select-variante-chefe", "alternativo");
    await expect(page.locator(".card-monstro.boss")).toContainText("FORJADOR DE ALMAS");
    await expect(page.locator("#resultado-monstros")).toContainText("CD Base: 8s");

    // Zona 14-10: Pântano Sombrio (Rei Lagarto / Bruxa do Brejo)
    await page.fill("#input-monstro-zona", "14");
    await page.selectOption("#select-variante-chefe", "principal");
    await expect(page.locator(".card-monstro.boss")).toContainText("REI LAGARTO");
    await expect(page.locator("#resultado-monstros")).toContainText("Poça Ácida do Sapo-Boi");
    await page.selectOption("#select-variante-chefe", "alternativo");
    await expect(page.locator(".card-monstro.boss")).toContainText("BRUXA DO BREJO");

    expect(erros).toEqual([]);
  });

  test("Cidade Mecânica e Cripta Gélida exibem as variantes e os efeitos de posição", async ({ page }) => {
    const { erros } = await prepararPagina(page, "/index.html");
    await page.click("#aba-monstros");
    const chefe = page.locator(".card-monstro.boss");
    const zona = page.locator("#input-monstro-zona");
    for (const numero of [9, 18, 27]) {
      await zona.fill(String(numero));
      await expect(chefe).toContainText("MAQUINISTA TITÃ");
      await expect(chefe).toContainText("Marcha Alta");
    }
    await zona.fill("18");
    await page.fill("#input-monstro-onda", "1");
    await page.fill("#input-monstro-jogadores", "67");
    const variantes = page.getByRole("region", { name: "Vida dos lacaios nesta onda" });
    const linhas = variantes.locator(".card-info-linha");
    await expect(linhas).toHaveCount(4);
    await expect(linhas.first()).toContainText("Zepelim Bombardeiro");
    await expect(linhas.first()).toContainText("944.065.896 HP");
    await expect(linhas.first()).toContainText("236.016.474 por implosão da Singularidade");
    await expect(linhas.first()).toContainText("472.032.948 com eco");
    await expect(variantes).not.toContainText("Lunetista");
    await verificarSemOverflowHorizontal(page, "vida-e-singularidade-por-lacaio");

    await page.fill("#input-monstro-onda", "2");
    await expect(linhas.first()).toContainText("Metade do Autômato Bipartido");
    await expect(variantes).not.toContainText("Lunetista");
    await page.fill("#input-monstro-onda", "10");
    await zona.fill("18.5");
    await expect(chefe).toContainText("MAQUINISTA TITÃ (Z18)");
    await expect(variantes).toContainText("Autômato do Apito");
    await expect(chefe).toContainText("O dano extra dos ataques básicos e do vapor fica fora da conta");
    await page.selectOption("#select-variante-chefe", "alternativo");
    await expect(chefe).toContainText("REGENTE TICKTACK");
    await expect(variantes).not.toContainText("Autômato do Apito");
    await expect(chefe).toContainText("Rebobinar");
    await expect(chefe).not.toContainText("As nuvens da Marcha Alta");
    await zona.fill("12");
    await page.selectOption("#select-variante-chefe", "principal");
    await expect(chefe).toContainText("REI GÉLIDO");
    await expect(chefe).toContainText("Presença Gélida");
    await page.selectOption("#select-variante-chefe", "alternativo");
    await expect(chefe).toContainText("MAMUTE SEPULCRAL");
    await expect(page.locator("#resultado-monstros")).toContainText("Estalactites");
    expect(erros).toEqual([]);
  });

  test("lista os lacaios de cada tema e destaca por que o Clérigo pode parar de curar", async ({ page }) => {
    const { erros } = await prepararPagina(page, "/index.html");
    await page.click("#aba-monstros");
    const catalogo = page.getByRole("region", { name: "Monstros da zona" });
    const detalhes = catalogo.locator(".catalogo-lacaios-detalhes");
    await expect(detalhes).not.toHaveAttribute("open", "");
    await detalhes.locator("summary").click();
    await expect(detalhes).toHaveAttribute("open", "");
    const zona = page.locator("#input-monstro-zona");
    const onda = page.locator("#input-monstro-onda");
    const variantes = page.getByRole("region", { name: "Vida dos lacaios nesta onda" });
    const exemplos = [
      [1, 4, 4, "Espectro das Ruínas"],
      [2, 4, 2, "Goblin Ladino"],
      [3, 4, 3, "Lobo Sombrio"],
      [4, 4, 2, "Inquisidora das Cinzas"],
      [5, 4, 2, "Bruxa do Pântano"],
      [6, 4, 4, "Água-viva Elétrica"],
      [7, 8, 4, "Drone Escudeiro"],
      [9, 8, 4, "Caldeireiro"],
      [17, 8, 2, "Leão do Domador"],
    ];
    for (const [numero, quantidade, quantidadeOnda1, nome] of exemplos) {
      await zona.fill(String(numero));
      await onda.fill("10");
      await expect(catalogo.locator("dt")).toHaveCount(quantidade);
      await expect(catalogo.locator("dt").filter({ hasText: nome })).toBeVisible();
      await expect(variantes.locator(".card-info-linha")).toHaveCount(numero === 9 ? quantidade + 2 : quantidade);
      await expect(variantes).toContainText(nome);
      await onda.fill("1");
      await expect(variantes.locator(".card-info-linha")).toHaveCount(quantidadeOnda1);
    }
    await zona.fill("1");
    await page.fill("#input-monstro-jogadores", "1");
    await expect(variantes.locator(".card-info-linha").filter({ hasText: "Gárgula de Pedra" })).toContainText("43 HP · 1,8 DEF");
    await zona.fill("17");
    await expect(catalogo).toContainText("Facas: até 3 marcas estouram após 0,8 s");
    await zona.fill("22");
    await expect(catalogo).toContainText("bloqueando a cura individual e a habilidade de classe");
    await expect(catalogo).toContainText("Pode impedir a cura");
    await expect(catalogo).not.toContainText("Leão do Domador");
    await zona.fill("7");
    await expect(catalogo).toContainText("trava compartilhada de 6 s");
    await zona.fill("18");
    await expect(catalogo).toContainText("cada herói dentro das marcas toma 1× ATK uma vez");
    const engenheiro = catalogo.locator(".card-lacaio").filter({ has: page.getByText("Engenheiro Sucateiro", { exact: true }) });
    await expect(engenheiro.getByText("Chefes e invocações, como as Metades do Autômato e os reforços do Apito, ficam fora do conserto.")).toBeVisible();
    await zona.fill("5");
    await expect(catalogo).toContainText("A poça aparece 0,7 s depois mesmo se o Sapo-Boi morrer");
    const cardDistancia = page.locator(".grade-monstros .card-monstro").nth(1);
    await expect(cardDistancia).not.toContainText("Poça Ácida do Sapo-Boi");
    await onda.fill("2");
    await expect(cardDistancia).toContainText("Poça Ácida do Sapo-Boi");
    await verificarSemOverflowHorizontal(page, "catalogo dos lacaios");
    expect(erros).toEqual([]);
  });

  test("Chefes: origem, limites zona/onda/jogadores, escalas 70/100, Fúria, sangramento e sync pela live", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "chromium-mobile", "Testa simulador de chefes no desktop");
    const { erros } = await prepararPagina(page, "/index.html");

    await page.fill("#input-nick", "halscriolo");
    await page.click('#formulario-busca button[type="submit"]');
    await page.click("#aba-monstros");

    // Transições de zona 1 (TTK rápido), 69 -> 70 -> 100 (Fúria / sangramento / escala de grupo) e onda 10
    await page.fill("#input-monstro-zona", "1");
    await page.fill("#input-monstro-onda", "10");
    await page.fill("#input-monstro-jogadores", "1");
    await expect(page.locator("#resultado-monstros")).toContainText("0s (Fúria 0)");
    await expect(page.locator("#resultado-monstros")).toContainText("75s (Fúria 5)");

    for (const [zona, onda, jogadores] of [
      ["69", "10", "5"],
      ["70", "10", "25"],
      ["100", "10", "500"],
    ]) {
      await page.fill("#input-monstro-zona", zona);
      await page.fill("#input-monstro-onda", onda);
      await page.fill("#input-monstro-jogadores", jogadores);
      await expect(page.locator("#resultado-monstros")).toBeVisible();
    }

    // Trocar origem para Build do Simulador
    await page.selectOption("#select-monstro-origem", "simulador");
    await expect(page.locator("#resultado-monstros")).toContainText("Build do Simulador");

    // Sincronizar pela live (exigindo opção disponível)
    const selectSync = page.locator("#select-monstro-live-sync");
    await expect(selectSync).toBeVisible();
    await selectSync.selectOption("belky");
    await expect(page.locator("#input-monstro-zona")).toHaveValue("24");
    await expect(page.locator("#input-monstro-onda")).toHaveValue("5");
    await expect(page.locator("#input-monstro-jogadores")).toHaveValue("45");

    await selectSync.selectOption("kick:nando");
    await expect(page.locator("#input-monstro-zona")).toHaveValue("31");
    await expect(page.locator("#input-monstro-onda")).toHaveValue("10");
    await expect(page.locator("#aviso-monstro-live-sync")).toContainText("Z29-W5");
    await expect(page.locator("#aviso-monstro-live-sync")).toContainText("285 ondas");
    await expect(page.locator("#aviso-monstro-live-sync")).toContainText("Recorde: Z31-W10");

    expect(erros).toEqual([]);
  });

  test("Radar de Lives: paginação, limite de 12 páginas, retry de indisponíveis, filtros locais e ação VS", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "chromium-mobile", "Testa radar completo no desktop");
    let falharSempoder = true;
    const { erros, controleApi } = await prepararPagina(page, "/index.html", {
      api: {
        cenarios: {
          board: async (route) => {
            const url = new URL(route.request().url());
            const pagina = Number(url.searchParams.get("page") || "1");
            return route.fulfill({
              status: 200,
              contentType: "application/json",
              body: JSON.stringify({
                page: pagina,
                total: 650,
                totalPages: 13,
                items:
                  pagina === 1
                    ? [
                        { login: "halscriolo", displayName: "Halscriolo", cls: "warrior", level: 320, fc: 195000000 },
                        { login: "nando", displayName: "Nando", cls: "archer", level: 310, fc: 182000000 },
                        { login: "sempoder", displayName: "Sempoder", cls: "warrior", level: 280, fc: 0 },
                      ]
                    : [],
              }),
            });
          },
          profile: async (route) => {
            const { PERFIS_MOCK } = await import("./helpers/mock-api.mjs");
            const url = new URL(route.request().url());
            const login = decodeURIComponent(url.pathname.replace("/api/profile/", "")).toLowerCase();
            if (login === "sempoder" && falharSempoder) {
              return route.fulfill({ status: 503, contentType: "application/json", body: "{}" });
            }
            const dados = PERFIS_MOCK[login]?.warrior || PERFIS_MOCK[login]?.archer || PERFIS_MOCK.halscriolo.warrior;
            return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(dados) });
          },
        },
      },
      permitirErrosConsole: true,
    });

    // Sem P1 carregado: escaneia Belky, verifica aviso de limite de 12 páginas e 1 perfil indisponível
    await page.click("#aba-radar-live");
    await page.fill("#input-radar-canal", "belky");
    await page.click("#btn-escanear-live");
    await expect(page.locator("#status-radar")).toContainText(/Varredura concluída/i, { timeout: 5000 });
    await expect(page.locator("#resultado-radar-live")).toContainText("limite de 12 páginas atingido");
    await expect(page.locator("#resultado-radar-live")).toContainText("1 temporariamente indisponíveis");
    await expect(page.locator("#resultado-radar-live")).toContainText("Potencial (média 5 runs)");
    await expect(page.locator("#resultado-radar-live")).toContainText("Aguardando 1ª run");
    await expect(page.locator("#resultado-radar-live [data-radar-comparar]")).toHaveCount(0);

    // Retry recupera o perfil indisponível
    falharSempoder = false;
    const btnRetry = page.locator("#btn-radar-tentar-indisponiveis");
    await expect(btnRetry).toBeVisible();
    await btnRetry.click();
    await expect(page.locator("#resultado-radar-live")).toContainText("3 analisados com sucesso");

    const chamadasPerfilAntesFiltro = controleApi.chamadasApi.filter((u) => (u.pathname || String(u)).includes("/api/profile/")).length;

    // Filtros de texto, classe e sem correspondência NÃO devem reconsultar /api/profile/
    await page.selectOption("#select-radar-classe", "archer");
    await expect(page.locator("#resultado-radar-live")).toContainText("Nando");
    await page.fill("#input-radar-busca", "TermoInexistenteRadarXYZ");
    await expect(page.locator("#resultado-radar-live")).not.toContainText("Nando");
    await page.locator('#resultado-radar-live button:has-text("Limpar Filtros")').click();
    await expect(page.locator("#resultado-radar-live")).toContainText("Halscriolo");

    const chamadasPerfilDepoisFiltro = controleApi.chamadasApi.filter((u) => (u.pathname || String(u)).includes("/api/profile/")).length;
    expect(chamadasPerfilDepoisFiltro).toBe(chamadasPerfilAntesFiltro);

    // Carrega P1 clicando em um jogador do Radar e depois usa o botão VS
    await page.locator('#resultado-radar-live [data-radar-abrir="halscriolo"]').first().click();
    await expect(page.locator("#nome-jogador")).toContainText("Halscriolo");
    await page.click("#aba-radar-live");
    await page.click("#btn-escanear-live");
    await expect(page.locator('#resultado-radar-live [data-radar-comparar="nando"]')).toBeVisible();
    await page.locator('#resultado-radar-live [data-radar-comparar="nando"]').click();
    await expect(page.locator("#aba-comparacao")).toHaveAttribute("aria-selected", "true");
    await expect(page.locator("#resultado-comparacao")).toContainText("Nando");

    expect(erros).toEqual([]);
  });

  test("Comparação: P1 vs P2, Twitch vs Kick, Top 1, cura de Clérigo, troca de classe P2 e filtro Apenas diferenças", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "chromium-mobile", "Testa comparação completa no desktop");
    const { erros } = await prepararPagina(page, "/index.html");

    await page.fill("#input-nick", "halscriolo");
    await page.click('#formulario-busca button[type="submit"]');
    await page.click("#aba-comparacao");

    // Quando P1 já é o Top 1 Geral / Guerreiro, o botão indica "(Você)" e fica desabilitado
    await expect(page.locator("#btn-comparar-warrior")).toBeDisabled();

    // Comparar com Kick:Nando
    await page.fill("#input-comparar-nick", "nando");
    await page.selectOption("#select-comparar-plataforma", "kick");
    await page.click("#btn-comparar");
    await expect(page.locator("#resultado-comparacao")).toContainText("Nando");

    // Atalho vs Top Clérigo (exibe linha de cura e seletor de múltiplas classes para P2)
    await page.click("#btn-comparar-cleric");
    await expect(page.locator("#resultado-comparacao")).toContainText(/Cura da Luz Divina/i);

    // Filtro Apenas diferenças (exigindo visibilidade)
    const chkDif = page.locator("#check-apenas-diferencas");
    await expect(chkDif).toBeVisible();
    await chkDif.check();
    await expect(page.locator("#resultado-comparacao")).toHaveClass(/ocultar-sem-diferenca/);
    await chkDif.uncheck();
    await expect(page.locator("#resultado-comparacao")).not.toHaveClass(/ocultar-sem-diferenca/);

    expect(erros).toEqual([]);
  });
});

