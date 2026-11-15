function criarPecaMock(slot, kind, name, rarity, itemLevel, look, gems) {
  return {
    id: `${slot}_${kind}`,
    slot,
    kind,
    name,
    rarity,
    itemLevel,
    look,
    sockets: rarity === 7 ? 6 : 5,
    atk: slot === "weapon" ? 42000 : slot === "ring" ? 18500 : 12000,
    def: slot === "armor" ? 6800 : slot === "helmet" ? 4100 : 3200,
    hp: slot === "armor" ? 165000 : slot === "helmet" ? 95000 : 48000,
    crit: slot === "ring" ? 18 : 10,
    spd: slot === "ring" ? 16 : 8,
    gems,
  };
}

function gemaMock(type, tier, stat, value, pct = false, stat2 = null, value2 = 0, pct2 = false) {
  return {
    type,
    tier,
    stat,
    value,
    pct,
    ...(stat2 ? { stat2, value2, pct2 } : {}),
  };
}

export const PERFIS_MOCK = {
  halscriolo: {
    warrior: {
      login: "halscriolo",
      displayName: "Halscriolo",
      cls: "warrior",
      level: 320,
      bestZone: 28,
      gold: 1250000,
      classes: [
        { cls: "warrior", level: 320 },
        { cls: "cleric", level: 295 },
      ],
      attributes: { str: 220, agi: 110, vit: 180, def: 130, luk: 120 },
      stats: { maxHp: 980000, atk: 185000, def: 42000, aspd: 14.5, crit: 60 },
      forges: {
        weapon: { count: 1420, mythic: 14, arcane: 3 },
        helmet: { count: 980, mythic: 11, arcane: 2 },
        armor: { count: 1010, mythic: 12, arcane: 2 },
        ring: { count: 640, mythic: 9, arcane: 2 },
      },
      equipped: [
        criarPecaMock("weapon", "singblade", "Lâmina da Singularidade", 7, 320, 0, [
          gemaMock("ruby", 6, "atk", 9200, false, "crit", 8, false),
          gemaMock("ruby", 6, "atk", 9100, false, "crit", 8, false),
          gemaMock("topaz", 5, "spd", 42, false, "atk", 5500, false),
          gemaMock("topaz", 5, "spd", 40, false, "atk", 5400, false),
          gemaMock("ruby", 5, "atk", 6000, false, "crit", 6, false),
          gemaMock("ruby", 5, "atk", 6000, false, "crit", 6, false),
        ]),
        criarPecaMock("helmet", "singhelm", "Elmo da Singularidade", 6, 315, 0, [
          gemaMock("emerald", 5, "hp", 50, true, "def", 35, true),
          gemaMock("emerald", 5, "hp", 48, true, "def", 32, true),
          gemaMock("sapphire", 5, "def", 45, true, "hp", 35, true),
          gemaMock("ruby", 5, "atk", 5200, false, "hp", 30, true),
          gemaMock("ruby", 5, "atk", 5100, false, "hp", 30, true),
        ]),
        criarPecaMock("armor", "singplate", "Couraça da Singularidade", 6, 318, 0, [
          gemaMock("emerald", 5, "hp", 50, true, "def", 35, true),
          gemaMock("sapphire", 5, "def", 48, true, "hp", 35, true),
          gemaMock("sapphire", 5, "def", 48, true, "hp", 35, true),
          gemaMock("emerald", 5, "hp", 49, true, "def", 34, true),
          gemaMock("topaz", 5, "spd", 38, false, "def", 32, true),
        ]),
        criarPecaMock("ring", "ring", "Anel do Eclipse Arcano", 7, 320, 14, [
          gemaMock("amethyst", 6, "crit", 12, false, "atk", 8800, false),
          gemaMock("amethyst", 5, "crit", 9, false, "atk", 5900, false),
          gemaMock("topaz", 5, "spd", 44, false, "crit", 7, false),
          gemaMock("ruby", 5, "atk", 6100, false, "crit", 6, false),
          gemaMock("ruby", 5, "atk", 6100, false, "crit", 6, false),
          gemaMock("emerald", 5, "hp", 50, true, "atk", 5500, false),
        ]),
      ],
    },
    cleric: {
      login: "halscriolo",
      displayName: "Halscriolo",
      cls: "cleric",
      level: 295,
      bestZone: 25,
      gold: 1250000,
      classes: [
        { cls: "warrior", level: 320 },
        { cls: "cleric", level: 295 },
      ],
      attributes: { str: 150, agi: 120, vit: 210, def: 150, luk: 110 },
      stats: { maxHp: 1120000, atk: 142000, def: 48000, aspd: 12.8, crit: 45 },
      forges: {
        weapon: { count: 780, mythic: 8, arcane: 1 },
        helmet: { count: 650, mythic: 6, arcane: 1 },
        armor: { count: 670, mythic: 7, arcane: 1 },
        ring: { count: 420, mythic: 5, arcane: 1 },
      },
      equipped: [
        criarPecaMock("weapon", "worldstaff", "Cajado da Árvore-Mundo", 7, 295, 0, [
          gemaMock("emerald", 6, "hp", 75, true, "def", 52, true),
          gemaMock("topaz", 5, "spd", 40, false, "hp", 35, true),
          gemaMock("ruby", 5, "atk", 5400, false, "hp", 35, true),
          gemaMock("ruby", 5, "atk", 5400, false, "hp", 35, true),
          gemaMock("emerald", 5, "hp", 48, true, "def", 32, true),
          gemaMock("sapphire", 5, "def", 46, true, "hp", 34, true),
        ]),
        criarPecaMock("helmet", "worldcrown", "Coroa da Árvore-Mundo", 6, 290, 0, [
          gemaMock("emerald", 5, "hp", 48, true, "def", 34, true),
          gemaMock("sapphire", 5, "def", 45, true, "hp", 34, true),
          gemaMock("emerald", 5, "hp", 48, true, "def", 34, true),
          gemaMock("sapphire", 5, "def", 45, true, "hp", 34, true),
          gemaMock("topaz", 5, "spd", 36, false, "hp", 30, true),
        ]),
        criarPecaMock("armor", "worldrobe", "Manto da Árvore-Mundo", 6, 292, 0, [
          gemaMock("emerald", 5, "hp", 49, true, "def", 34, true),
          gemaMock("sapphire", 5, "def", 47, true, "hp", 35, true),
          gemaMock("emerald", 5, "hp", 49, true, "def", 34, true),
          gemaMock("sapphire", 5, "def", 47, true, "hp", 35, true),
          gemaMock("topaz", 5, "spd", 37, false, "def", 31, true),
        ]),
        criarPecaMock("ring", "ring", "Anel Coração do Vazio", 7, 295, 15, [
          gemaMock("emerald", 6, "hp", 75, true, "def", 52, true),
          gemaMock("sapphire", 5, "def", 47, true, "hp", 35, true),
          gemaMock("emerald", 5, "hp", 49, true, "def", 34, true),
          gemaMock("topaz", 5, "spd", 41, false, "hp", 35, true),
          gemaMock("ruby", 5, "atk", 5500, false, "hp", 35, true),
          gemaMock("emerald", 5, "hp", 49, true, "def", 34, true),
        ]),
      ],
    },
  },
  nando: {
    archer: {
      login: "nando",
      displayName: "Nando",
      cls: "archer",
      level: 310,
      bestZone: 27,
      gold: 980000,
      classes: [{ cls: "archer", level: 310 }],
      attributes: { str: 130, agi: 240, vit: 150, def: 100, luk: 145 },
      stats: { maxHp: 760000, atk: 210000, def: 31000, aspd: 16.2, crit: 60 },
      forges: {
        weapon: { count: 1200, mythic: 10, arcane: 2 },
        helmet: { count: 900, mythic: 8, arcane: 1 },
        armor: { count: 880, mythic: 9, arcane: 1 },
        ring: { count: 550, mythic: 7, arcane: 2 },
      },
      equipped: [
        criarPecaMock("weapon", "abyssbow", "Arco Abissal", 7, 310, 0, [
          gemaMock("amethyst", 6, "crit", 12, false, "atk", 8500, false),
          gemaMock("ruby", 5, "atk", 5900, false, "crit", 6, false),
          gemaMock("topaz", 5, "spd", 41, false, "atk", 5400, false),
          gemaMock("ruby", 5, "atk", 5900, false, "crit", 6, false),
          gemaMock("amethyst", 5, "crit", 9, false, "atk", 5800, false),
          gemaMock("topaz", 5, "spd", 40, false, "crit", 6, false),
        ]),
        criarPecaMock("helmet", "abysshunterhood", "Capuz do Caçador Abissal", 6, 305, 0, [
          gemaMock("emerald", 5, "hp", 47, true, "def", 33, true),
          gemaMock("ruby", 5, "atk", 5600, false, "hp", 31, true),
          gemaMock("amethyst", 5, "crit", 8, false, "atk", 5200, false),
          gemaMock("topaz", 5, "spd", 38, false, "atk", 5000, false),
          gemaMock("sapphire", 5, "def", 43, true, "hp", 32, true),
        ]),
        criarPecaMock("armor", "abysshuntercoat", "Veste do Caçador Abissal", 6, 305, 0, [
          gemaMock("emerald", 5, "hp", 48, true, "def", 34, true),
          gemaMock("sapphire", 5, "def", 44, true, "hp", 33, true),
          gemaMock("ruby", 5, "atk", 5600, false, "hp", 31, true),
          gemaMock("topaz", 5, "spd", 38, false, "def", 30, true),
          gemaMock("emerald", 5, "hp", 48, true, "def", 34, true),
        ]),
        criarPecaMock("ring", "ring", "Anel da Presa de Ixtharra", 7, 310, 18, [
          gemaMock("amethyst", 6, "crit", 12, false, "atk", 8700, false),
          gemaMock("ruby", 6, "atk", 8900, false, "crit", 8, false),
          gemaMock("amethyst", 5, "crit", 9, false, "atk", 5800, false),
          gemaMock("ruby", 5, "atk", 5900, false, "crit", 6, false),
          gemaMock("topaz", 5, "spd", 42, false, "atk", 5400, false),
          gemaMock("emerald", 5, "hp", 48, true, "atk", 5200, false),
        ]),
      ],
    },
  },
};

export async function instalarMocksApi(page) {
  const cssFonteLocal = `
    @font-face {
      font-family: 'Silkscreen';
      font-style: normal;
      font-weight: 400;
      font-display: swap;
      src: url('/tests/e2e/fixtures/fonts/silkscreen-400-latin-ext.woff2') format('woff2');
      unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF;
    }
    @font-face {
      font-family: 'Silkscreen';
      font-style: normal;
      font-weight: 400;
      font-display: swap;
      src: url('/tests/e2e/fixtures/fonts/silkscreen-400-latin.woff2') format('woff2');
      unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
    }
    @font-face {
      font-family: 'Silkscreen';
      font-style: normal;
      font-weight: 700;
      font-display: swap;
      src: url('/tests/e2e/fixtures/fonts/silkscreen-700-latin-ext.woff2') format('woff2');
      unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF;
    }
    @font-face {
      font-family: 'Silkscreen';
      font-style: normal;
      font-weight: 700;
      font-display: swap;
      src: url('/tests/e2e/fixtures/fonts/silkscreen-700-latin.woff2') format('woff2');
      unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
    }
  `;

  await page.route("https://fonts.googleapis.com/**", (route) =>
    route.fulfill({ status: 200, contentType: "text/css", body: cssFonteLocal })
  );
  await page.route("https://fonts.gstatic.com/**", (route) =>
    route.fulfill({ status: 200, contentType: "font/woff2", body: "" })
  );

  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;

    if (path === "/api/changelog") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          latest: "v2.6",
          entries: [{ id: "v2.6", date: "2026-11-15", title: "Gemas Prismáticas T6" }],
        }),
      });
    }

    if (path === "/api/ranking/runs") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: [
            { login: "belky", name: "Belky", bestZone: 28, bestWave: 10, playersNow: 25, online: true },
            { login: "kick:nando", name: "Nando", bestZone: 24, bestWave: 6, playersNow: 18, online: true },
          ],
        }),
      });
    }

    if (path === "/api/ranking/characters") {
      const cls = url.searchParams.get("cls");
      const sort = url.searchParams.get("sort");
      const base = [
        { login: "halscriolo", name: "Halscriolo", cls: "warrior", level: 320, power: 195000000, bestZone: 28 },
        { login: "nando", name: "Nando", cls: "archer", level: 310, power: 182000000, bestZone: 27 },
        { login: "halscriolo", name: "Halscriolo", cls: "cleric", level: 295, power: 168000000, bestZone: 25 },
      ];
      let items = cls ? base.filter((x) => x.cls === cls) : base;
      if (sort === "level") items = [...items].sort((a, b) => b.level - a.level);
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ items }),
      });
    }

    if (path.startsWith("/api/ranking/channel/") && path.endsWith("/board")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          page: 1,
          totalPages: 1,
          items: [
            { login: "halscriolo", displayName: "Halscriolo", cls: "warrior", level: 320, fc: 195000000 },
            { login: "nando", displayName: "Nando", cls: "archer", level: 310, fc: 182000000 },
          ],
        }),
      });
    }

    if (path.startsWith("/api/ranking/channel/")) {
      const canal = decodeURIComponent(path.split("/").pop());
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          login: canal,
          displayName: canal === "belky" ? "Belky" : canal,
          twitchLogin: canal.startsWith("kick:") ? null : canal,
          kickLogin: canal.startsWith("kick:") ? canal.replace(/^kick:/, "") : null,
          zone: 28,
          wave: 10,
          players: 25,
          online: true,
        }),
      });
    }

    if (path.startsWith("/api/profile/")) {
      const login = decodeURIComponent(path.replace("/api/profile/", "")).toLowerCase();
      const clsParam = url.searchParams.get("cls");
      const entradas = PERFIS_MOCK[login];
      if (!entradas) {
        return route.fulfill({
          status: 404,
          contentType: "application/json",
          body: JSON.stringify({ error: "Jogador não encontrado." }),
        });
      }
      const clsEscolhida = clsParam && entradas[clsParam] ? clsParam : Object.keys(entradas)[0];
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(entradas[clsEscolhida]),
      });
    }

    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({}),
    });
  });
}

