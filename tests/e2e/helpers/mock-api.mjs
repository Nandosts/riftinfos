function criarPecaMock(slot, kind, name, rarity, itemLevel, look, gems, set = null) {
  return {
    id: `${slot}_${kind}`,
    slot,
    kind,
    ...(set ? { set } : {}),
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
      power: 195000000,
      bestZone: 28,
      gold: 1250000,
      vip: true,
      totalSeconds: 86400,
      achievementPoints: 1450,
      achievementsUnlocked: 42,
      achievementsTotal: 55,
      channels: [
        { login: "belky", displayName: "Belky", waves: 1240, seconds: 54000 },
        { login: "kick:nando", displayName: "Nando", waves: 620, seconds: 32400 },
      ],
      classes: [
        { cls: "warrior", level: 320 },
        { cls: "cleric", level: 295 },
      ],
      attributes: { str: 220, agi: 110, vit: 180, def: 130, luk: 120 },
      stats: { maxHp: 980000, atk: 185000, def: 42000, aspd: 14.5, crit: 60 },
      counters: {
        fuse_epic_try: 400,
        fuse_epic_ok: 120,
        fuse_imm_try: 250,
        fuse_imm_ok: 20,
        fuse_arc_try: 50,
        fuse_arc_ok: 3,
        fz_f_7_0: 3,
        fz_f_7_1: 1,
        fz_f_7_2: 5,
        fz_f_7_3: 2,
        fz_f_6_0: 2,
        fz_w_7_0: 2,
        best_wave: 285,
        boss_kills: 412,
        kills: 98500,
        ev_goldmeteor_cleared: 14,
        ev_goldmeteor_items: 6,
        ev_christmas_cleared: 8,
        ev_christmas_items: 3,
        ev_halloween_cleared: 11,
        ev_halloween_items: 5,
        legendary: 320,
        epic: 1180,
      },
      equipped: [
        criarPecaMock("weapon", "singblade", "Lâmina da Singularidade", 7, 320, 0, [
          gemaMock("ruby", 6, "atk", 9200, false, "crit", 8, false),
          gemaMock("ruby", 6, "atk", 9100, false, "crit", 8, false),
          gemaMock("topaz", 5, "spd", 42, false, "atk", 5500, false),
          gemaMock("topaz", 5, "spd", 40, false, "atk", 5400, false),
          gemaMock("ruby", 5, "atk", 6000, false, "crit", 6, false),
          gemaMock("ruby", 5, "atk", 6000, false, "crit", 6, false),
        ], "singular"),
        criarPecaMock("helmet", "singhelm", "Elmo da Singularidade", 6, 315, 0, [
          gemaMock("emerald", 5, "hp", 50, true, "def", 35, true),
          gemaMock("emerald", 5, "hp", 48, true, "def", 32, true),
          gemaMock("sapphire", 5, "def", 45, true, "hp", 35, true),
          gemaMock("ruby", 5, "atk", 5200, false, "hp", 30, true),
          gemaMock("ruby", 5, "atk", 5100, false, "hp", 30, true),
        ], "singular"),
        criarPecaMock("armor", "singplate", "Couraça da Singularidade", 6, 318, 0, [
          gemaMock("emerald", 5, "hp", 50, true, "def", 35, true),
          gemaMock("sapphire", 5, "def", 48, true, "hp", 35, true),
          gemaMock("sapphire", 5, "def", 48, true, "hp", 35, true),
          gemaMock("emerald", 5, "hp", 49, true, "def", 34, true),
          gemaMock("topaz", 5, "spd", 38, false, "def", 32, true),
        ], "singular"),
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
      power: 168000000,
      bestZone: 25,
      gold: 1250000,
      vip: true,
      totalSeconds: 61200,
      achievementPoints: 1450,
      achievementsUnlocked: 42,
      achievementsTotal: 55,
      channels: [
        { login: "belky", displayName: "Belky", waves: 910, seconds: 42000 },
      ],
      classes: [
        { cls: "warrior", level: 320 },
        { cls: "cleric", level: 295 },
      ],
      attributes: { str: 150, agi: 120, vit: 210, def: 150, luk: 110 },
      stats: { maxHp: 1120000, atk: 142000, def: 48000, aspd: 12.8, crit: 45 },
      counters: {
        fuse_epic_try: 220,
        fuse_epic_ok: 70,
        fuse_imm_try: 140,
        fuse_imm_ok: 12,
        fuse_arc_try: 24,
        fuse_arc_ok: 1,
        fz_f_7_0: 1,
        fz_f_7_1: 2,
        fz_f_7_2: 0,
        fz_f_7_3: 4,
        best_wave: 250,
        boss_kills: 280,
        kills: 64000,
      },
      equipped: [
        criarPecaMock("weapon", "worldstaff", "Cajado da Árvore-Mundo", 7, 295, 0, [
          gemaMock("emerald", 6, "hp", 75, true, "def", 52, true),
          gemaMock("topaz", 5, "spd", 40, false, "hp", 35, true),
          gemaMock("ruby", 5, "atk", 5400, false, "hp", 35, true),
          gemaMock("ruby", 5, "atk", 5400, false, "hp", 35, true),
          gemaMock("emerald", 5, "hp", 48, true, "def", 32, true),
          gemaMock("sapphire", 5, "def", 46, true, "hp", 34, true),
        ], "worldtree"),
        criarPecaMock("helmet", "worldcrown", "Coroa da Árvore-Mundo", 6, 290, 0, [
          gemaMock("emerald", 5, "hp", 48, true, "def", 34, true),
          gemaMock("sapphire", 5, "def", 45, true, "hp", 34, true),
          gemaMock("emerald", 5, "hp", 48, true, "def", 34, true),
          gemaMock("sapphire", 5, "def", 45, true, "hp", 34, true),
          gemaMock("topaz", 5, "spd", 36, false, "hp", 30, true),
        ], "worldtree"),
        criarPecaMock("armor", "worldrobe", "Manto da Árvore-Mundo", 6, 292, 0, [
          gemaMock("emerald", 5, "hp", 49, true, "def", 34, true),
          gemaMock("sapphire", 5, "def", 47, true, "hp", 35, true),
          gemaMock("emerald", 5, "hp", 49, true, "def", 34, true),
          gemaMock("sapphire", 5, "def", 47, true, "hp", 35, true),
          gemaMock("topaz", 5, "spd", 37, false, "def", 31, true),
        ], "worldtree"),
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
      power: 182000000,
      bestZone: 27,
      gold: 980000,
      vip: false,
      totalSeconds: 43200,
      achievementPoints: 980,
      achievementsUnlocked: 30,
      achievementsTotal: 55,
      channels: [
        { login: "kick:nando", displayName: "Nando", waves: 780, seconds: 43200 },
      ],
      classes: [{ cls: "archer", level: 310 }],
      attributes: { str: 130, agi: 240, vit: 150, def: 100, luk: 145 },
      stats: { maxHp: 760000, atk: 210000, def: 31000, aspd: 16.2, crit: 60 },
      counters: {
        fuse_epic_try: 300,
        fuse_epic_ok: 95,
        fuse_imm_try: 180,
        fuse_imm_ok: 14,
        fuse_arc_try: 30,
        fuse_arc_ok: 2,
        fz_f_7_0: 2,
        fz_f_7_3: 6,
        fz_w_6_1: 3,
        best_wave: 270,
        boss_kills: 310,
        kills: 71000,
      },
      equipped: [
        criarPecaMock("weapon", "abyssbow", "Arco Abissal", 7, 310, 0, [
          gemaMock("amethyst", 6, "crit", 12, false, "atk", 8500, false),
          gemaMock("ruby", 5, "atk", 5900, false, "crit", 6, false),
          gemaMock("topaz", 5, "spd", 41, false, "atk", 5400, false),
          gemaMock("ruby", 5, "atk", 5900, false, "crit", 6, false),
          gemaMock("amethyst", 5, "crit", 9, false, "atk", 5800, false),
          gemaMock("topaz", 5, "spd", 40, false, "crit", 6, false),
        ], "abyss"),
        criarPecaMock("helmet", "abysshunterhood", "Capuz do Caçador Abissal", 6, 305, 0, [
          gemaMock("emerald", 5, "hp", 47, true, "def", 33, true),
          gemaMock("ruby", 5, "atk", 5600, false, "hp", 31, true),
          gemaMock("amethyst", 5, "crit", 8, false, "atk", 5200, false),
          gemaMock("topaz", 5, "spd", 38, false, "atk", 5000, false),
          gemaMock("sapphire", 5, "def", 43, true, "hp", 32, true),
        ], "abyss"),
        criarPecaMock("armor", "abysshuntercoat", "Veste do Caçador Abissal", 6, 305, 0, [
          gemaMock("emerald", 5, "hp", 48, true, "def", 34, true),
          gemaMock("sapphire", 5, "def", 44, true, "hp", 33, true),
          gemaMock("ruby", 5, "atk", 5600, false, "hp", 31, true),
          gemaMock("topaz", 5, "spd", 38, false, "def", 30, true),
          gemaMock("emerald", 5, "hp", 48, true, "def", 34, true),
        ], "abyss"),
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
  "kick:nando": {
    archer: {
      login: "kick:nando",
      displayName: "Nando",
      cls: "archer",
      level: 310,
      power: 182000000,
      bestZone: 27,
      gold: 980000,
      vip: false,
      totalSeconds: 43200,
      achievementPoints: 980,
      achievementsUnlocked: 30,
      achievementsTotal: 55,
      channels: [{ login: "kick:nando", displayName: "Nando", waves: 780, seconds: 43200 }],
      classes: [{ cls: "archer", level: 310 }],
      attributes: { str: 130, agi: 240, vit: 150, def: 100, luk: 145 },
      stats: { maxHp: 760000, atk: 210000, def: 31000, aspd: 16.2, crit: 60 },
      counters: {
        fuse_epic_try: 300,
        fuse_epic_ok: 95,
        fuse_imm_try: 180,
        fuse_imm_ok: 14,
        fuse_arc_try: 30,
        fuse_arc_ok: 2,
        fz_f_7_0: 2,
        fz_f_7_3: 6,
        fz_w_6_1: 3,
        best_wave: 270,
        boss_kills: 310,
        kills: 71000,
      },
      equipped: [
        criarPecaMock("weapon", "abyssbow", "Arco Abissal", 7, 310, 0, [
          gemaMock("amethyst", 6, "crit", 12, false, "atk", 8500, false),
        ], "abyss"),
      ],
    },
  },
  sempoder: {
    warrior: {
      login: "sempoder",
      displayName: "JogadorSemPoderOficialComNomeBemLongoParaTeste",
      cls: "warrior",
      level: 180,
      bestZone: 14,
      gold: 42000,
      classes: [{ cls: "warrior", level: 180 }],
      attributes: { str: 90, agi: 60, vit: 85, def: 70, luk: 40 },
      stats: { maxHp: 210000, atk: 48000, def: 12000, aspd: 6.4, crit: 22 },
      counters: {
        fuse_epic_try: 0,
        fuse_epic_ok: 0,
        fuse_imm_try: 10,
        fuse_imm_ok: 0,
        fuse_arc_try: 2,
        fuse_arc_ok: 5,
      },
      equipped: [
        criarPecaMock("weapon", "frostblade", "Espada Glacial", 6, 180, 0, [
          gemaMock("ruby", 4, "atk", 3100, false),
        ], "glacial"),
      ],
    },
  },
};

export const CANAIS_RUNS_PADRAO = [
  {
    login: "belky",
    name: "Belky",
    bestZone: 24,
    bestWave: 5,
    playersNow: 45,
    online: true,
    createdAt: "2026-11-15T10:00:00-03:00",
    twitchLogin: "belky",
    kickLogin: null,
  },
  {
    login: "kick:nando",
    name: "Nando",
    bestZone: 31,
    bestWave: 10,
    potential: 285,
    runs: [
      { zone: 29, wave: 4, waves: 284, at: "2026-11-15T15:00:00-03:00" },
      { zone: 28, wave: 6, waves: 286, at: "2026-11-15T14:20:00-03:00" },
    ],
    playersNow: 18,
    online: true,
    createdAt: "2026-11-15T13:00:00-03:00",
    twitchLogin: null,
    kickLogin: "nando",
  },
  {
    login: "canalnovo",
    name: "CanalNovo",
    bestZone: 20,
    bestWave: 4,
    playersNow: 12,
    online: true,
    createdAt: "2026-11-15T15:10:00-03:00",
    twitchLogin: "canalnovo",
    kickLogin: "canalnovo_kick",
  },
];

async function aplicarModoResposta(route, modo, respostaPadrao) {
  if (!modo) return respostaPadrao();
  if (typeof modo === "function") return modo(route);

  if (modo.delayMs) {
    await new Promise((r) => setTimeout(r, modo.delayMs));
  }
  if (modo.tipo === "empty") {
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(modo.body ?? { items: [] }),
    });
  }
  if (modo.tipo === "httpError") {
    return route.fulfill({
      status: modo.status ?? 503,
      contentType: "application/json",
      body: JSON.stringify({ error: modo.message ?? "Serviço temporariamente indisponível" }),
    });
  }
  if (modo.tipo === "invalidJson") {
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: "{json_invalido:",
    });
  }
  if (modo.tipo === "abort") {
    return route.abort(modo.reason ?? "failed");
  }
  if (modo.tipo === "custom") {
    return route.fulfill({
      status: modo.status ?? 200,
      contentType: "application/json",
      body: JSON.stringify(modo.body),
    });
  }
  return respostaPadrao();
}

export async function instalarMocksApi(page, opcoes = {}) {
  const { cenarios = {}, perfisExtras = {} } = opcoes;
  const rotasInesperadas = [];
  const chamadasApi = [];
  const bancoPerfis = { ...PERFIS_MOCK, ...perfisExtras };

  const cssFonteLocal = `
    @font-face {
      font-family: 'Silkscreen';
      font-style: normal;
      font-weight: 400;
      font-display: swap;
      src: url('http://127.0.0.1:4179/tests/e2e/fixtures/fonts/silkscreen-400-latin-ext.woff2') format('woff2');
      unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF;
    }
    @font-face {
      font-family: 'Silkscreen';
      font-style: normal;
      font-weight: 400;
      font-display: swap;
      src: url('http://127.0.0.1:4179/tests/e2e/fixtures/fonts/silkscreen-400-latin.woff2') format('woff2');
      unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
    }
    @font-face {
      font-family: 'Silkscreen';
      font-style: normal;
      font-weight: 700;
      font-display: swap;
      src: url('http://127.0.0.1:4179/tests/e2e/fixtures/fonts/silkscreen-700-latin-ext.woff2') format('woff2');
      unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF;
    }
    @font-face {
      font-family: 'Silkscreen';
      font-style: normal;
      font-weight: 700;
      font-display: swap;
      src: url('http://127.0.0.1:4179/tests/e2e/fixtures/fonts/silkscreen-700-latin.woff2') format('woff2');
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
    const ehFallbackAws = url.hostname.includes("amazonaws.com");
    chamadasApi.push({ url: url.toString(), path, ehFallbackAws });

    if (ehFallbackAws && cenarios.fallback) {
      return aplicarModoResposta(route, cenarios.fallback, () =>
        route.fulfill({ status: 500, contentType: "application/json", body: "{}" })
      );
    }

    if (path === "/api/changelog") {
      return aplicarModoResposta(route, cenarios.changelog, () =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            latest: "v2.6",
            entries: [{ id: "v2.6", date: "2026-11-15", title: "Gemas Prismáticas T6" }],
          }),
        })
      );
    }

    if (path === "/api/ranking/runs") {
      return aplicarModoResposta(route, cenarios.runs, () =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            items: CANAIS_RUNS_PADRAO.map(({ login, name, bestZone, bestWave, potential = 0, playersNow, online }) => ({
              login,
              name,
              bestZone,
              bestWave,
              potential,
              playersNow,
              online,
            })),
          }),
        })
      );
    }

    if (path === "/api/ranking/records") {
      return aplicarModoResposta(route, cenarios.records, () =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            totalPlayers: 12062,
            totalChannels: 1457,
            playersNow: 996,
            peakPlayers: { channel: "Belky", players: 426, at: "2026-11-08T23:26:31.828128" },
            bestRun: { channel: "Belky", zone: 23, wave: 1 },
            topCharacter: { name: "Halscriolo", cls: "warrior", level: 320 },
          }),
        })
      );
    }

    if (path === "/api/ranking/characters") {
      return aplicarModoResposta(route, cenarios.characters, () => {
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
      });
    }

    if (path.startsWith("/api/ranking/channel/") && path.endsWith("/board")) {
      return aplicarModoResposta(route, cenarios.board, () =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            page: 1,
            totalPages: 1,
            total: 3,
            items: [
              { login: "halscriolo", displayName: "Halscriolo", cls: "warrior", level: 320, fc: 195000000, power: 195000000, seconds: 120000, waves: 4200, kills: 5100, now: true },
              { login: "nando", displayName: "Nando", cls: "archer", level: 310, fc: 182000000, power: 182000000, seconds: 95000, waves: 3100, kills: 4000, now: false },
              { login: "kick:nando", displayName: "Nando Kick", cls: "cleric", level: 250, fc: 85000000, power: 85000000, seconds: 43200, waves: 780, kills: 900, now: true },
            ],
          }),
        })
      );
    }

    if (path.startsWith("/api/ranking/channel/")) {
      const canal = decodeURIComponent(path.split("/").pop());
      return aplicarModoResposta(route, cenarios.channel, () => {
        const encontrado = CANAIS_RUNS_PADRAO.find((c) => c.login.toLowerCase() === canal.toLowerCase());
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(
            encontrado
              ? {
                  login: encontrado.login,
                  displayName: encontrado.name,
                  twitchLogin: encontrado.twitchLogin,
                  kickLogin: encontrado.kickLogin,
                  zone: encontrado.bestZone,
                  wave: encontrado.bestWave,
                  bestZone: encontrado.bestZone,
                  bestWave: encontrado.bestWave,
                  potentialWaves: encontrado.potential || 0,
                  runs: encontrado.runs || [],
                  playersNow: encontrado.playersNow,
                  createdAt: encontrado.createdAt,
                  online: encontrado.online,
                }
              : {
                  login: canal,
                  displayName: canal,
                  twitchLogin: canal.startsWith("kick:") ? null : canal,
                  kickLogin: canal.startsWith("kick:") ? canal.replace(/^kick:/, "") : null,
                  zone: 28,
                  wave: 10,
                  playersNow: 25,
                  createdAt: "2026-11-15T14:00:00-03:00",
                  online: true,
                }
          ),
        });
      });
    }

    if (path.startsWith("/api/profile/")) {
      const login = decodeURIComponent(path.replace("/api/profile/", "")).toLowerCase();
      const clsParam = url.searchParams.get("cls");
      return aplicarModoResposta(route, cenarios.profile, () => {
        const entradas = bancoPerfis[login];
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
      });
    }

    rotasInesperadas.push(url.toString());
    return route.fulfill({
      status: 404,
      contentType: "application/json",
      body: JSON.stringify({ error: `Rota inesperada nos testes: ${path}` }),
    });
  });

  return { rotasInesperadas, chamadasApi };
}
