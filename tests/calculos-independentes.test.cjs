const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

async function importarModulo(relativo) {
  return import(pathToFileURL(path.resolve(__dirname, "..", relativo)).href);
}

test("teto de VEL em 4,6/s: abaixo (4.5), no teto (4.6) e acima (4.61 e 6.0) não altera cadência nem recarga", async () => {
  const { calcularMetricasCombate } = await importarModulo("src/combate.mjs");

  const baseStatus = { maxHp: 500000, atk: 100000, def: 10000, crit: 50 };
  const equip = [{ slot: "weapon", kind: "singblade", rarity: 7, itemLevel: 300, atk: 30000, def: 0, hp: 0, crit: 0, spd: 0, gems: [] }];

  const m45 = calcularMetricasCombate("warrior", 300, { ...baseStatus, aspd: 4.5 }, equip);
  const m46 = calcularMetricasCombate("warrior", 300, { ...baseStatus, aspd: 4.6 }, equip);
  const m461 = calcularMetricasCombate("warrior", 300, { ...baseStatus, aspd: 4.61 }, equip);
  const m60 = calcularMetricasCombate("warrior", 300, { ...baseStatus, aspd: 6.0 }, equip);

  assert.ok(m46.cadenciaReal > m45.cadenciaReal, "4.6/s deve ter cadência maior que 4.5/s");
  assert.equal(m461.cadenciaReal, m46.cadenciaReal, "4.61/s não pode aumentar a cadência além do teto 4.6/s");
  assert.equal(m60.cadenciaReal, m46.cadenciaReal, "6.0/s não pode aumentar a cadência além do teto 4.6/s");
  assert.equal(m45.speedBonus, 1.0, "abaixo de 4.6/s não há bônus de excesso de velocidade");
  assert.equal(m46.speedBonus, 1.0, "exatamente em 4.6/s o speedBonus ainda é 1.0");
  assert.ok(Math.abs(m60.speedBonus - 6.0 / 4.6) < 1e-12, "acima de 4.6/s, o excesso de VEL converte em speedBonus = aspd / 4.6");
  assert.ok(
    Math.abs(m60.dpsCombateMedio - m46.dpsCombateMedio * (6.0 / 4.6)) < 1e-6,
    "acima de 4.6/s, o DPS escala apenas pelo speedBonus mantendo cadência e recarga fixas",
  );
  assert.equal(m60.cdSkillReal, m46.cdSkillReal, "recarga da skill não muda com excesso de VEL");
});

test("redução física independente: DEF=100 resulta em 80% ((100*4)/(100+100*4))", async () => {
  const { calcularMetricasCombate } = await importarModulo("src/combate.mjs");
  const m = calcularMetricasCombate("warrior", 100, { maxHp: 10000, atk: 1000, def: 100, aspd: 2.0, crit: 0 }, []);
  // Fórmula independente: (100 * 4) / (100 + 100 * 4) = 400 / 500 = 0.80 (80%)
  assert.ok(Math.abs(m.reducaoDefesa - 0.8) < 1e-9, `Esperado 0.80, obtido ${m.reducaoDefesa}`);
});

test("chance acumulada de forja com Gelo calculada de forma independente", () => {
  // Exemplo independente calculado à mão:
  // Arcano base = 25%, Gelo inicial = 0 (+0 p.p.), Pergaminho = +10 p.p., Evento = 0
  // Tentativa 1: p1 = 0.35 (35%)
  // Falha -> Gelo = 1 (+2 p.p.) -> Tentativa 2: p2 = 0.37 (37%)
  // Chance acumulada em 2 tentativas = 1 - (1 - 0.35) * (1 - 0.37) = 1 - 0.65 * 0.63 = 0.5905 (59.05%)
  function calcularChanceAcumuladaIndependente(basePP, geloInicial, extrasPP, tentativas) {
    let probFalharTudo = 1;
    let gelo = geloInicial;
    for (let i = 0; i < tentativas; i++) {
      const bonusGeloPP = Math.min(5, Math.max(0, gelo)) * 2;
      const p = Math.min(100, Math.max(0, basePP + extrasPP + bonusGeloPP)) / 100;
      probFalharTudo *= 1 - p;
      gelo += 1;
    }
    return 1 - probFalharTudo;
  }

  const acum2 = calcularChanceAcumuladaIndependente(25, 0, 10, 2);
  assert.ok(Math.abs(acum2 - 0.5905) < 1e-9, `Esperado 0.5905, obtido ${acum2}`);

  // Teto de Gelo: 8 falhas não passam de +10 p.p. (25 + 10 = 35%)
  const acumTetoGelo = calcularChanceAcumuladaIndependente(25, 8, 0, 1);
  assert.ok(Math.abs(acumTetoGelo - 0.35) < 1e-9);

  // Teto de 100% por tentativa
  const acum100 = calcularChanceAcumuladaIndependente(50, 5, 50, 1);
  assert.equal(acum100, 1);
});

test("FC, DPS e Cura calculados à mão de forma independente", async () => {
  const { calcularFc, calcularMetricasCombate } = await importarModulo("src/combate.mjs");

  // 1. FC independente:
  // stats: atk=1000, aspd=2.0, crit=50, critDmg=0.30, maxHp=10000, def=25
  // dps_fc = 1000 * 2.0 * (1 + 0.50 * (0.5 + 0.30)) = 2000 * 1.40 = 2800
  // ehp = 10000 * (1 + 25 * 0.04) = 20000
  // sqrt(2800 * 20000) = sqrt(56000000) = 7483.314773547883
  // Guerreiro (k=0.40): round(0.40 * 7483.314773547883) = 2993
  // Clérigo / Arqueiro (k=0.56): round(0.56 * 7483.314773547883) = 4191
  const statsFc = { atk: 1000, aspd: 2.0, crit: 50, critDmg: 0.3, maxHp: 10000, def: 25 };
  assert.equal(calcularFc("warrior", statsFc), 2993, "FC independente de Guerreiro deve ser 2993");
  assert.equal(calcularFc("cleric", statsFc), 4191, "FC independente de Clérigo deve ser 4191");
  assert.equal(calcularFc("archer", statsFc), 4191, "FC independente de Arqueiro deve ser 4191");

  // 2. DPS básico e de skill independente (Guerreiro Nv.100 sem arma especial):
  // atk=1000, aspd=2.0, crit=40, critDmg=0 -> fatorCritEsperado = 0.60 + 0.40 * 1.75 = 1.30
  // golpeNormalBruto = 1000, golpeCritBruto = 1750, golpeMedioBruto = 1300
  // cadenciaReal = 2.0 -> dpsBasico = 2600
  // cdSkillReal = 7 * 1.5 = 10.5s, skillDanoPorAlvo = 1000 * 1.5 * 1.30 = 1950
  // dpsSkillPorAlvo = 1950 / 10.5 = 185.71428571428572 -> dpsCombateMedio = 2785.714285714286
  const metW = calcularMetricasCombate("warrior", 100, { maxHp: 10000, atk: 1000, def: 100, aspd: 2.0, crit: 40, critDmg: 0 }, []);
  assert.equal(metW.golpeNormalBruto, 1000);
  assert.equal(metW.golpeCritBruto, 1750);
  assert.equal(metW.golpeMedioBruto, 1300);
  assert.equal(metW.dpsBasico, 2600);
  assert.equal(metW.cdSkillReal, 10.5);
  assert.equal(metW.skillDanoPorAlvo, 1950);
  assert.ok(Math.abs(metW.dpsCombateMedio - (2600 + 1950 / 10.5)) < 1e-9);

  // 3. Cura independente (Clérigo Nv.100, atk=1000):
  // aspd=2.3 (speedBonus=1.0) -> healPower = (1000 * 2.4 + 100 * 1.5 + 6) * 1.0 = 2556
  // curaSkillLuzDivina = 2556 * 0.85 = 2172.6 (e não muda com crítico)
  const metC0 = calcularMetricasCombate("cleric", 100, { maxHp: 10000, atk: 1000, def: 50, aspd: 2.3, crit: 0 }, []);
  const metC60 = calcularMetricasCombate("cleric", 100, { maxHp: 10000, atk: 1000, def: 50, aspd: 2.3, crit: 60 }, []);
  assert.equal(metC0.healPower, 2556);
  assert.ok(Math.abs(metC0.curaSkillLuzDivina - 2172.6) < 1e-9);
  assert.equal(metC60.curaSkillLuzDivina, metC0.curaSkillLuzDivina, "Cura do Clérigo não critica");

  // Com excesso de velocidade (aspd=6.9 -> speedBonus = 6.9 / 4.6 = 1.5): healPower = 2556 * 1.5 = 3834
  const metCExcesso = calcularMetricasCombate("cleric", 100, { maxHp: 10000, atk: 1000, def: 50, aspd: 6.9, crit: 0 }, []);
  assert.ok(Math.abs(metCExcesso.healPower - 3834) < 1e-9);
});

test("mecânicas de anéis que justificam a Tier List: Eclipse+Singularidade, Sanguessuga, Prisma Estelar, Cronarca e Eco Rubro", async () => {
  const { calcularMetricasCombate } = await importarModulo("src/combate.mjs");
  const status = { maxHp: 900000, atk: 180000, def: 40000, aspd: 4.0, crit: 50 };

  const armaSing = { slot: "weapon", kind: "singblade", rarity: 7, itemLevel: 320, atk: 42000, def: 0, hp: 0, crit: 10, spd: 8, gems: [] };
  const anelEclipse = { slot: "ring", kind: "ring", look: 14, rarity: 7, itemLevel: 320, atk: 18500, def: 3200, hp: 48000, crit: 18, spd: 16, gems: [] };
  const anelSanguessuga = { slot: "ring", kind: "ring", look: 12, rarity: 6, itemLevel: 320, atk: 15000, def: 2800, hp: 40000, crit: 12, spd: 12, gems: [] };
  const anelPrisma = { slot: "ring", kind: "ring", look: 17, rarity: 7, itemLevel: 320, atk: 18500, def: 3200, hp: 48000, crit: 18, spd: 16, gems: [] };
  const anelEcoRubro = { slot: "ring", kind: "ring", look: 20, rarity: 7, itemLevel: 320, atk: 18500, def: 3200, hp: 48000, crit: 18, spd: 16, gems: [] };
  const armaCronarca = { slot: "weapon", kind: "chronoblade", rarity: 6, itemLevel: 320, atk: 38000, def: 0, hp: 0, crit: 8, spd: 10, gems: [] };

  const mSemAnel = calcularMetricasCombate("warrior", 320, status, [armaSing]);
  const mEclipse = calcularMetricasCombate("warrior", 320, status, [armaSing, anelEclipse]);
  const mSanguessuga = calcularMetricasCombate("warrior", 320, status, [armaSing, anelSanguessuga]);
  const mPrisma = calcularMetricasCombate("warrior", 320, status, [armaSing, anelPrisma]);
  const mEco = calcularMetricasCombate("warrior", 320, status, [armaSing, anelEcoRubro]);
  const mCronarca = calcularMetricasCombate("warrior", 320, status, [armaCronarca, anelEclipse]);

  // Eclipse multiplica o dano esperado da skill e o %HP de boss da Singularidade por 1.2 (20% de eco)
  assert.ok(Math.abs(mEclipse.dpsCombateMedio - mSemAnel.dpsCombateMedio * 1.2) < 1e-6);
  assert.ok(Math.abs(mEclipse.analiseEfeitoArma.pctBossEfetivo - mSemAnel.analiseEfeitoArma.pctBossBase * 1.2) < 1e-9);
  assert.ok(mSanguessuga.anelAtivo && mSanguessuga.dpsCombateMedio > 0);
  assert.ok(mPrisma.dpsCombateMedio > 0 && Number.isFinite(mPrisma.dpsCombateMedio));
  assert.ok(mEco.dpsCombateMedio > 0 && Number.isFinite(mEco.dpsCombateMedio));
  assert.ok(mCronarca.dpsCombateMedio > 0 && Number.isFinite(mCronarca.dpsCombateMedio));
});

test("formatarZonaOndaDeOndas converte total de ondas em Z{zona}-W{onda} conforme fórmula oficial", async () => {
  const { formatarZonaOndaDeOndas } = await importarModulo("src/formato.mjs");

  assert.equal(formatarZonaOndaDeOndas(125), "Z13-W5");
  assert.equal(formatarZonaOndaDeOndas(285), "Z29-W5");
  assert.equal(formatarZonaOndaDeOndas(10), "Z1-W10");
  assert.equal(formatarZonaOndaDeOndas(11), "Z2-W1");
  assert.equal(formatarZonaOndaDeOndas(0), "—");
  assert.equal(formatarZonaOndaDeOndas(null), "—");
});

test("curvas reais por peça diferenciam Trapézio vs Aurora Boreal e preservam restauração de peça importada no Simulador", async () => {
  const {
    aplicarAtributosPadraoNoItem,
    equiparPecaConjuntoSimulador,
    importarPerfilParaSimulador,
    simulacao,
  } = await importarModulo("src/simulador/estado.mjs");

  const arcoTrapezio = { slot: "weapon", kind: "trapezebow", set: "trapeze", rarity: 7, itemLevel: 279, gems: [] };
  const arcoAurora = { slot: "weapon", kind: "aurorabow", set: "auroraborealis", rarity: 7, itemLevel: 274, gems: [] };
  aplicarAtributosPadraoNoItem(arcoTrapezio, false);
  aplicarAtributosPadraoNoItem(arcoAurora, false);

  assert.ok(arcoTrapezio.atk > arcoAurora.atk * 2.8, "Arco do Trapézio deve ter muito mais ATK bruto que Arco da Aurora Boreal");
  assert.equal(arcoTrapezio.spd, 18);
  assert.equal(arcoAurora.spd, 8);
  assert.ok(arcoAurora.hp > arcoTrapezio.hp, "Arco da Aurora Boreal tem mais HP bruto no Nv. 274 que Trapézio no Nv. 279");
  assert.ok(arcoAurora.crit > arcoTrapezio.crit, "Arco da Aurora Boreal tem mais CRÍT bruto que Trapézio");

  // Simulador: importa Aurora Boreal com stats exatos da API, troca para Trapézio (recalcula) e volta para Aurora (restaura exato)
  importarPerfilParaSimulador({
    login: "teste_archer",
    displayName: "TesteArcher",
    cls: "archer",
    level: 400,
    stats: { maxHp: 90000, atk: 20000, def: 6000, aspd: 12, crit: 55 },
    attributes: { str: 120, agi: 180, vit: 120, def: 100, luk: 140 },
    equipped: [
      { slot: "weapon", kind: "aurorabow", set: "auroraborealis", name: "Arco da Aurora Boreal", rarity: 7, itemLevel: 274, atk: 918, def: 767, hp: 3764, crit: 131, spd: 8, sockets: 6, gems: [] },
    ],
  });

  const armaSim = simulacao.estadoSimulador.itens[0];
  assert.equal(armaSim.atk, 918);
  assert.equal(armaSim.spd, 8);

  equiparPecaConjuntoSimulador(armaSim, "trapeze");
  assert.equal(armaSim.kind, "trapezebow");
  assert.ok(armaSim.atk > 2700, "Ao trocar para Trapézio na galeria, o Simulador deve calcular os stats reais do novo item");
  assert.equal(armaSim.spd, 18);

  equiparPecaConjuntoSimulador(armaSim, "auroraborealis");
  assert.equal(armaSim.atk, 918, "Ao voltar para a peça originalmente importada no mesmo nível, restaura o valor exato da API");
  assert.equal(armaSim.hp, 3764);
  assert.equal(armaSim.crit, 131);
  assert.equal(armaSim.spd, 8);
});

test("recalibração contra o motor oficial: HitCap 60% HP, sangramentos, decaimento multi-alvo, sets Épicos e previsão de Forja", async () => {
  const { aplicarTetoGolpeHeroi, calcularMetricasCombate } = await importarModulo("src/combate.mjs");
  const { calcularPrevisaoForja } = await importarModulo("src/forjas.mjs");
  const { catalogoConjuntos } = await importarModulo("src/dados.mjs");

  // 1. HitCap oficial de 60% HP em heróis (não se aplica a bleed/DoT)
  assert.equal(aplicarTetoGolpeHeroi(500000, 10000, false), 6000);
  assert.equal(aplicarTetoGolpeHeroi(4500, 10000, false), 4500);
  assert.equal(aplicarTetoGolpeHeroi(500000, 10000, true), 500000);

  // 2. Sangramento verdadeiro (Sede Escarlate 25% ATK/s, Chicote do Domador 275% ATK / 11s = 25% ATK/s, e sobreposição por Math.max)
  const st = { maxHp: 100000, atk: 10000, def: 1000, aspd: 2.0, crit: 0, critDmg: 0 };
  const anelSede = { slot: "ring", kind: "ring", look: 10, rarity: 6, itemLevel: 200, gems: [] };
  const chicote = { slot: "weapon", kind: "tamerwhip", rarity: 7, itemLevel: 200, gems: [] };

  const mSede = calcularMetricasCombate("warrior", 200, st, [anelSede]);
  const mDomador = calcularMetricasCombate("warrior", 200, st, [chicote]);
  const mAmbos = calcularMetricasCombate("warrior", 200, st, [chicote, anelSede]);
  assert.equal(mSede.dpsBleedVerdadeiro, 2500, "Sede Escarlate mantém 25% ATK/s com cadência >= 0.4/s");
  assert.equal(mDomador.dpsBleedVerdadeiro, 2500, "Chicote do Domador: 50% ATK/s por 5,5s a cada 11s = 25% ATK/s");
  assert.equal(mAmbos.dpsBleedVerdadeiro, 3750, "Ambos: 5,5s a 50% ATK/s + 5,5s a 25% ATK/s = 37,5% ATK/s sem duplicar stack");

  // 3. Decaimento multi-alvo em starbow (1 + 2*0.5 = 2x) e prismbow (soma geométrica de 0.92^i em 6 alvos)
  const mStar = calcularMetricasCombate("archer", 200, st, [{ slot: "weapon", kind: "starbow", rarity: 4, itemLevel: 200, gems: [] }]);
  const mPrism = calcularMetricasCombate("archer", 200, st, [{ slot: "weapon", kind: "prismbow", rarity: 4, itemLevel: 200, gems: [] }]);
  assert.ok(Math.abs(mStar.skillDanoTotal - mStar.skillDanoPorAlvo * 2) < 1e-9);
  const somaGeomPrism = (1 - Math.pow(0.92, 6)) / (1 - 0.92);
  assert.ok(Math.abs(mPrism.skillDanoTotal - mPrism.skillDanoPorAlvo * somaGeomPrism) < 1e-9);

  // 4. Raridade padrão Épica (3) nos 6 conjuntos Épicos
  for (const chave of ["berserker", "lunar", "wind", "cosmicvan", "oracle", "etehunter"]) {
    assert.equal(catalogoConjuntos[chave].raridadePadrao, 3, `${chave} deve ter raridadePadrao 3 (Épico)`);
  }

  // 5. Previsão oficial de Forja (EI + TI): nível resultante (+15%..+30%, pisos 100/130) e ouro
  // Nota: no JS do cliente oficial, Math.floor(200 * 1.15) === 229 e Math.floor((229 + 260) / 2) === 244
  const prevArc200 = calcularPrevisaoForja(7, 200, false, 400);
  assert.equal(prevArc200.nivelMin, 229);
  assert.equal(prevArc200.nivelMax, 260);
  assert.equal(prevArc200.ouroPorTentativa, 10846); // (5 + 244*2) * 11 * 2

  const prevImm60 = calcularPrevisaoForja(6, 60, false, 150);
  assert.equal(prevImm60.nivelMin, 100, "Piso de Imortal é Nv. 100");
  assert.equal(prevImm60.nivelMax, 100);
  assert.equal(prevImm60.ouroPorTentativa, 2870); // (5 + 100*2) * 7 * 2

  const prevAuraImm = calcularPrevisaoForja(6, 200, true, 300);
  assert.equal(prevAuraImm.nivelMin, null);
  assert.equal(prevAuraImm.ouroPorTentativa, 8470); // (5 + 300*2) * 7 * 2
});

test("ranking de lives: fidelidade de comunidade, filtros múltiplos e paginação", async () => {
  const {
    normalizarCanal,
    ehCanalKick,
    calcularCanalPrincipal,
    jogadorPertenceALive,
    filtrarEOrdenarJogadores,
    paginarJogadores,
    obterResumoFidelidade,
  } = await importarModulo("src/ranking.mjs");

  // 1. Normalização de canal e detecção de Kick
  assert.equal(normalizarCanal("xxmarciano"), "xxmarciano");
  assert.equal(normalizarCanal("kick:xxmarciano"), "xxmarciano");
  assert.equal(normalizarCanal("KICK/Streamer"), "streamer");
  assert.equal(ehCanalKick("kick:canal"), true);
  assert.equal(ehCanalKick("canal_twitch"), false);

  // 2. Fidelidade e detecção do Canal Principal
  const perfilFiel = {
    login: "membro_fiel",
    channels: [
      { login: "xxmarciano", displayName: "XXMARCIANO", seconds: 150000 },
      { login: "belky", displayName: "Belky", seconds: 20000 },
    ],
  };
  const perfilTurista = {
    login: "turista_belky",
    channels: [
      { login: "xxmarciano", displayName: "XXMARCIANO", seconds: 5000 },
      { login: "belky", displayName: "Belky", seconds: 400000 },
    ],
  };
  const perfilSemCanais = { login: "novo_jogador", channels: [] };

  assert.equal(calcularCanalPrincipal(perfilFiel).login, "xxmarciano");
  assert.equal(calcularCanalPrincipal(perfilTurista).login, "belky");
  assert.equal(calcularCanalPrincipal(perfilSemCanais), null);

  assert.equal(jogadorPertenceALive(perfilFiel, "xxmarciano"), true, "membro_fiel pertence a xxmarciano");
  assert.equal(jogadorPertenceALive(perfilTurista, "xxmarciano"), false, "turista_belky NÃO pertence a xxmarciano");
  assert.equal(jogadorPertenceALive(perfilTurista, "kick:belky"), true, "normalização ignora prefixo kick:");

  // 3. Filtros do Ranking
  const jogadores = [
    { login: "membro_fiel", displayName: "Fiel 1", cls: "warrior", level: 500, power: 80000000, seconds: 150000, waves: 5000, kills: 6000 },
    { login: "turista_belky", displayName: "Turista", cls: "archer", level: 800, power: 120000000, seconds: 5000, waves: 200, kills: 300 },
    { login: "kick:membro_kick", displayName: "Kick Guy", cls: "cleric", level: 450, power: 30000000, seconds: 80000, waves: 2500, kills: 1000 },
    { login: "fraco", displayName: "Iniciante", cls: "warrior", level: 50, power: 500000, seconds: 1000, waves: 10, kills: 5 },
  ];

  const cachePerfis = new Map([
    ["membro_fiel", perfilFiel],
    ["turista_belky", perfilTurista],
    ["kick:membro_kick", { login: "kick:membro_kick", channels: [{ login: "kick:xxmarciano", seconds: 80000 }] }],
  ]);

  // Filtro de fidelidade: só quem tem xxmarciano como topChannel
  const soFieis = filtrarEOrdenarJogadores(jogadores, { fiel: true }, cachePerfis, "xxmarciano");
  assert.deepEqual(soFieis.map((j) => j.login), ["membro_fiel", "kick:membro_kick", "fraco"]); // fraco sem perfil carregado não é excluído sumariamente se não tem cache

  // Filtro de classe
  const soArqueiros = filtrarEOrdenarJogadores(jogadores, { classe: "archer" }, cachePerfis);
  assert.equal(soArqueiros.length, 1);
  assert.equal(soArqueiros[0].login, "turista_belky");

  // Filtro de plataforma Kick
  const soKick = filtrarEOrdenarJogadores(jogadores, { plataforma: "kick" }, cachePerfis);
  assert.equal(soKick.length, 1);
  assert.equal(soKick[0].login, "kick:membro_kick");

  // Filtro de FC Mínimo (ex: 50M)
  const acima50M = filtrarEOrdenarJogadores(jogadores, { minFc: 50000000 }, cachePerfis);
  assert.equal(acima50M.length, 2);
  assert.equal(acima50M[0].login, "turista_belky"); // 120M
  assert.equal(acima50M[1].login, "membro_fiel"); // 80M

  // Ordenação crescente por FC
  const ordemCrescente = filtrarEOrdenarJogadores(jogadores, { ordenarPor: "power", ordenarSentido: "asc" }, cachePerfis);
  assert.equal(ordemCrescente[0].login, "fraco");
  assert.equal(ordemCrescente[ordemCrescente.length - 1].login, "turista_belky");

  // Ordenação por tempo jogado
  const ordemTempo = filtrarEOrdenarJogadores(jogadores, { ordenarPor: "seconds", ordenarSentido: "desc" }, cachePerfis);
  assert.equal(ordemTempo[0].login, "membro_fiel"); // 150000s

  // 4. Paginação
  const pag1 = paginarJogadores(jogadores, 1, 2);
  assert.equal(pag1.pagina, 1);
  assert.equal(pag1.totalPaginas, 2);
  assert.equal(pag1.itens.length, 2);
  assert.equal(pag1.inicio, 1);
  assert.equal(pag1.fim, 2);

  const pag2 = paginarJogadores(jogadores, 2, 2);
  assert.equal(pag2.pagina, 2);
  assert.equal(pag2.itens.length, 2);
  assert.equal(pag2.inicio, 3);
  assert.equal(pag2.fim, 4);

  // 5. Resumo de Fidelidade
  const resumo = obterResumoFidelidade(jogadores, "xxmarciano", cachePerfis);
  assert.equal(resumo.totalComPerfil, 3);
  assert.equal(resumo.totalFieis, 2);
  assert.equal(resumo.totalTuristas, 1);
});

test("alquimia: fragmentos guardando vs reciclando, distinção liberado/wiki e comparação com Forja e Aprimorar", async () => {
  const {
    CONFIG_ALQUIMIA_SERVIDOR,
    calcularAlquimiaFragmentos,
    calcularComparacaoDestinos,
    calcularEstimativaExpCriacao,
    compararNivelEntradaSaida,
    gerarSvgFragmento,
    interpretarNumeroDecimal,
    obterFaixaNivelAlquimia,
    validarNivelMedioReferencia,
  } = await import("../src/alquimia.mjs");

  // 1. Distinção clara e datada entre níveis liberados no patch de 14/11 (1..4) e documentado na wiki (5)
  assert.equal(obterFaixaNivelAlquimia(1).ilvlLo, 0);
  assert.equal(obterFaixaNivelAlquimia(1).ilvlHi, 24);
  assert.equal(obterFaixaNivelAlquimia(1).liberado, true);
  assert.equal(obterFaixaNivelAlquimia(4).ilvlLo, 80);
  assert.equal(obterFaixaNivelAlquimia(4).ilvlHi, 110);
  assert.equal(obterFaixaNivelAlquimia(4).liberado, true);
  assert.equal(obterFaixaNivelAlquimia(4).rotuloStatus, "Liberado no patch de 14/11");
  assert.equal(obterFaixaNivelAlquimia(5).ilvlLo, 111);
  assert.equal(obterFaixaNivelAlquimia(5).ilvlHi, 150);
  assert.equal(obterFaixaNivelAlquimia(5).liberado, false);
  assert.equal(obterFaixaNivelAlquimia(5).rotuloStatus, "Documentado na wiki");

  // 2. Caso prático de 9 fragmentos (guardar 1 + 4 frags vs reciclar a 1ª peça para tentar a 2ª)
  const r9 = calcularAlquimiaFragmentos({ peca: "weapon", raridade: 4, nivelAlquimia: 4, quantidadeItens: 9 });
  assert.equal(r9.guardandoResultados.criacoes, 1);
  assert.equal(r9.guardandoResultados.sobraFragmentos, 4);
  assert.equal(r9.reciclandoResultados.criacoes, 2);
  assert.equal(r9.reciclandoResultados.criacoesExtras, 1);
  assert.equal(r9.reciclandoResultados.sobraSeGuardarUltimo, 0);
  assert.equal(r9.reciclandoResultados.sobraSeReciclarTodos, 1);

  // Com 20 fragmentos e custo 5:
  // - Guardando: 20 / 5 = 4 criações, 0 sobra
  // - Reciclando: 20->16->12->8->4 = 4 criações, 4 frags de sobra (se guardar o último = 3 de sobra)
  const r20 = calcularAlquimiaFragmentos({ peca: "weapon", raridade: 4, nivelAlquimia: 4, quantidadeItens: 20 });
  assert.equal(r20.guardandoResultados.criacoes, 4);
  assert.equal(r20.guardandoResultados.sobraFragmentos, 0);
  assert.equal(r20.reciclandoResultados.criacoes, 4);
  assert.equal(r20.reciclandoResultados.sobraSeReciclarTodos, 4);
  assert.equal(r20.reciclandoResultados.sobraSeGuardarUltimo, 3);

  // Com 21 fragmentos (20 itens + 1 guardado):
  // - Guardando: 4 criações, 1 sobra
  // - Reciclando: 21->17->13->9->5->1 = 5 criações (+1 extra), 1 de sobra (0 se guardar o último)
  const r21 = calcularAlquimiaFragmentos({
    peca: "ring",
    raridade: 3,
    nivelAlquimia: 3,
    quantidadeItens: 20,
    fragmentosGuardados: 1,
  });
  assert.equal(r21.fragmentosTotais, 21);
  assert.equal(r21.guardandoResultados.criacoes, 4);
  assert.equal(r21.guardandoResultados.sobraFragmentos, 1);
  assert.equal(r21.reciclandoResultados.criacoes, 5);
  assert.equal(r21.reciclandoResultados.criacoesExtras, 1);
  assert.equal(r21.reciclandoResultados.sobraSeReciclarTodos, 1);
  assert.equal(r21.reciclandoResultados.sobraSeGuardarUltimo, 0);

  // Com 4 itens (abaixo de 5): 0 criações em ambos os modos, sobra 4
  const r4 = calcularAlquimiaFragmentos({ quantidadeItens: 4 });
  assert.equal(r4.guardandoResultados.criacoes, 0);
  assert.equal(r4.reciclandoResultados.criacoes, 0);
  assert.equal(r4.reciclandoResultados.sobraSeReciclarTodos, 4);

  // 3. Comparação de nível de entrada x faixa de saída + suporte a média decimal e validação
  assert.equal(interpretarNumeroDecimal("81,75"), 81.75);
  assert.equal(interpretarNumeroDecimal("81.75"), 81.75);
  assert.equal(interpretarNumeroDecimal(""), null);

  assert.equal(validarNivelMedioReferencia("").estado, "vazio");
  assert.equal(validarNivelMedioReferencia("81,75").estado, "valido");
  assert.equal(validarNivelMedioReferencia("81,75").valor, 81.75);
  assert.equal(validarNivelMedioReferencia("81,", { aoSair: false }).estado, "incompleto");
  assert.equal(validarNivelMedioReferencia("81,", { aoSair: false }).valor, null);
  assert.equal(validarNivelMedioReferencia("81,", { aoSair: true }).estado, "invalido");
  assert.ok(validarNivelMedioReferencia("abc").erro.length > 0);
  assert.equal(validarNivelMedioReferencia("1500").estado, "invalido");
  assert.equal(validarNivelMedioReferencia("0").estado, "invalido");

  const faixa4 = obterFaixaNivelAlquimia(4); // 80..110
  assert.equal(compararNivelEntradaSaida(null, faixa4), null);
  assert.equal(compararNivelEntradaSaida(150, faixa4).relacao, "abaixo");
  assert.equal(compararNivelEntradaSaida(40, faixa4).relacao, "acima");
  assert.equal(compararNivelEntradaSaida(95, faixa4).relacao, "dentro");

  // 4. Estimativa de EXP de criação: null quando servidor não foi calibrado; fórmula exata do cliente quando fornecido
  assert.equal(calcularEstimativaExpCriacao(4, 4, CONFIG_ALQUIMIA_SERVIDOR), null);
  const expSimulado = calcularEstimativaExpCriacao(4, 4, {
    ...CONFIG_ALQUIMIA_SERVIDOR,
    destroyXp: [10, 20, 40, 80, 160],
    xpIlvlDiv: 100,
    craftXpMult: 1.5,
  });
  // mediaFaixa = (80 + 110) / 2 = 95; round(160 * (1 + 95/100)) = round(312) = 312; round(312 * 1.5) = 468
  assert.equal(expSimulado.ehEstimativa, true);
  assert.equal(expSimulado.xpEstimado, 468);

  // 5. Comparação com Forja e Aprimorar:
  // Sem nível médio informado -> não assume 60 como dado do jogador
  const compSemNivel = calcularComparacaoDestinos({
    peca: "weapon",
    raridade: 3,
    nivelAlquimia: 4,
    quantidadeItens: 0,
    fragmentosGuardados: 10,
    nivelMedioItens: null,
  });
  assert.equal(compSemNivel.temNivelReferencia, false);
  assert.equal(compSemNivel.forja.nivelMin, null);
  assert.equal(compSemNivel.forja.ouroPorTentativa, null);
  // Com 0 equipamentos e 10 fragmentos guardados: Alquimia cria 2, Forja e Aprimorar usam 0 equipamentos
  assert.equal(compSemNivel.alquimia.guardandoResultados.criacoes, 2);
  assert.equal(compSemNivel.forja.tentativasPossiveis, 0);
  assert.equal(compSemNivel.aprimorar.itensDisponiveis, 0);

  // Média decimal na Forja (como YI do jogo): 81,75 -> floor(81.75 * 1.15)=94, floor(81.75 * 1.3)=106 (não 105!)
  const compDecimal = calcularComparacaoDestinos({
    peca: "weapon",
    raridade: 3,
    nivelAlquimia: 4,
    quantidadeItens: 12,
    nivelMedioItens: "81,75",
  });
  assert.equal(compDecimal.temNivelReferencia, true);
  assert.equal(compDecimal.nivelMedioItens, 81.75);
  assert.equal(compDecimal.forja.nivelMin, 94);
  assert.equal(compDecimal.forja.nivelMax, 106);

  // Lendário (4) -> Imortal (6): 4 itens por tentativa, piso Nv. 100, fator ouro 7
  const compLendario = calcularComparacaoDestinos({
    peca: "weapon",
    raridade: 4,
    nivelAlquimia: 4,
    quantidadeItens: 20,
    nivelMedioItens: 60,
  });
  assert.equal(compLendario.forja.destinoRaridade.id, 6);
  assert.equal(compLendario.forja.itensPorTentativa, 4);
  assert.equal(compLendario.forja.tentativasPossiveis, 5);
  assert.equal(compLendario.forja.nivelMin, 100); // piso Imortal 100 > floor(60 * 1.15)=69
  assert.equal(compLendario.forja.nivelMax, 100);
  assert.equal(compLendario.forja.pisoAplicado, true);
  // ouroPorTentativa = round((5 + 100*2) * 7 * 2) = 205 * 14 = 2870
  assert.equal(compLendario.forja.ouroPorTentativa, 2870);
  assert.equal(compLendario.aprimorar.lotesNecessarios, 1);

  // Incomum (1) -> Raro (2): 3 itens por tentativa, sem roleta
  const compIncomum = calcularComparacaoDestinos({
    peca: "helmet",
    raridade: 1,
    nivelAlquimia: 2,
    quantidadeItens: 35,
    nivelMedioItens: 40,
  });
  assert.equal(compIncomum.forja.destinoRaridade.id, 2);
  assert.equal(compIncomum.forja.itensPorTentativa, 3);
  assert.equal(compIncomum.forja.tentativasPossiveis, 11);
  assert.equal(compIncomum.forja.sobraItens, 2);
  assert.equal(compIncomum.forja.temRoleta, false);
  assert.equal(compIncomum.forja.nivelMin, 46); // floor(40 * 1.15)
  assert.equal(compIncomum.forja.nivelMax, 52); // floor(40 * 1.30)
  assert.equal(compIncomum.aprimorar.lotesNecessarios, 2); // ceil(35 / 30)

  // 6. Geração SVG pixel-art fiel dos fragmentos
  const svg = gerarSvgFragmento("ring", 4, { tamanho: 48, decorativo: false });
  assert.ok(svg.includes('viewBox="0 0 16 16"'));
  assert.ok(svg.includes('shape-rendering="crispEdges"'));
  assert.ok(svg.includes('role="img"'));
  assert.ok(svg.includes("Ouro Rúnico"));
});

test("catálogo de zonas: Mestre de Cerimônias (Anel de Fogo), chefes alternativos 50/50 e lacaios oficiais", async () => {
  const { catalogoTemasZona } = await importarModulo("src/dados.mjs");
  assert.equal(catalogoTemasZona.length, 8);

  const [ruinas, cavernas, cripta, fornalha, pantano, recife, galaxia, circo] = catalogoTemasZona;

  // Circo dos Horrores (Z8, Z16, Z24...) — Mestre de Cerimônias com os 6 efeitos da Roleta incluindo ANEL DE FOGO
  assert.equal(circo.boss, "Mestre de Cerimônias");
  assert.equal(circo.temBleedBoss, true);
  assert.equal(circo.fatorDotVerdadeiroPorSeg, 0.3);
  for (const termo of ["FACAS", "RISADA", "ANEL DE FOGO", "HOLOFOTE", "MÁGICA", "ESTRONDO"]) {
    assert.ok(circo.resumoSkillBoss.includes(termo), `Mestre de Cerimônias deve listar ${termo}`);
  }
  assert.ok(circo.lacaios.some(({ nome, descricao }) => nome.includes("Balão-Bomba") || descricao.includes("Balão-Bomba")));
  assert.ok(circo.lacaios.some(({ nome, descricao }) => nome.includes("invulnerável enquanto o Domador vive") || descricao.includes("invulnerável enquanto o Domador vive")));

  // Os 4 temas com chefe alternativo 50/50 e seus multiplicadores reais
  assert.equal(ruinas.boss, "Rei Esqueleto");
  assert.equal(ruinas.varianteAlternativa.boss, "Colosso Rúnico");
  assert.equal(ruinas.varianteAlternativa.multHp, 1.3);
  assert.equal(ruinas.varianteAlternativa.multDef, 1.4);
  assert.equal(ruinas.varianteAlternativa.multAtk, 0.95);
  assert.equal(ruinas.varianteAlternativa.cdSkillBoss, 8);

  assert.equal(cavernas.boss, "Senhor da Guerra Gruk");
  assert.equal(cavernas.temFrenesiGruk, true);
  assert.equal(cavernas.varianteAlternativa.boss, "Mímico Voraz");
  assert.ok(cavernas.lacaios.some(({ nome, descricao }) => nome.includes("Goblin Pesadelo") || descricao.includes("Goblin Pesadelo")));

  assert.equal(fornalha.boss, "Senhor Demônio");
  assert.equal(fornalha.varianteAlternativa.boss, "Forjador de Almas");
  assert.equal(fornalha.varianteAlternativa.multHp, 1.2);
  assert.equal(fornalha.varianteAlternativa.multDef, 1.15);
  assert.equal(fornalha.varianteAlternativa.cdSkillBoss, 8);
  assert.ok(fornalha.lacaios.some(({ nome, descricao }) => nome.includes("Carcereiro Acorrentado") || descricao.includes("Carcereiro Acorrentado")));
  assert.ok(fornalha.lacaios.some(({ nome, descricao }) => nome.includes("Inquisidora das Cinzas") || descricao.includes("Inquisidora das Cinzas")));

  assert.equal(pantano.boss, "Rei Lagarto");
  assert.equal(pantano.multHp, 1.1);
  assert.equal(pantano.varianteAlternativa.boss, "Bruxa do Brejo");
  assert.equal(pantano.varianteAlternativa.multHp, 1.1);
  assert.equal(pantano.varianteAlternativa.multDef, 1.1);
  assert.equal(pantano.varianteAlternativa.multAtk, 0.95);
  assert.equal(pantano.varianteAlternativa.cdSkillBoss, 6.5);
  assert.equal(pantano.varianteAlternativa.fatorDotVerdadeiroPorSeg, 0.8);

  // Somente Gruk ativa checkbox de frenesi
  const comFrenesi = catalogoTemasZona.filter((t) => t.temFrenesiGruk);
  assert.deepEqual(comFrenesi.map((t) => t.boss), ["Senhor da Guerra Gruk"]);

  // Demais zonas sem lacaios faltantes
  assert.ok(cripta.lacaios.some(({ nome, descricao }) => nome.includes("Lobo Gélido") || descricao.includes("Lobo Gélido")));
  assert.ok(recife.lacaios.some(({ nome, descricao }) => nome.includes("Homem-Peixe Arpoador") || descricao.includes("Homem-Peixe Arpoador")));
  assert.ok(recife.lacaios.some(({ nome, descricao }) => nome.includes("Água-viva Elétrica") || descricao.includes("Água-viva Elétrica")));
  assert.ok(galaxia.lacaios.some(({ nome, descricao }) => nome.includes("Alienígena Eletro") || descricao.includes("Alienígena Eletro")));
  assert.ok(galaxia.lacaios.some(({ nome, descricao }) => nome.includes("Drone Escudeiro") || descricao.includes("Drone Escudeiro")));
});

test("combo Hit + DoT em ticks de 0,5s (ex.: Anel de Fogo no 16-10) modela queda quase instantânea e letalidade real", async () => {
  const { calcularImpactoComboSkillDot } = await importarModulo("src/combate.mjs");

  // Z16-10 Mestre de Cerimônias: bossAtk ~146.909 -> bleed = 44.073/s (22.036 por tick de 0,5s, 8 ticks = 176.288)
  // Caso 1: Herói com 35.000 HP que leva 15.000 no hit inicial do Anel de Fogo (0,7×)
  // Sobra 20.000 HP -> 1º tick de 0,5s (22.036) já derruba -> 0,5s (quase instantâneo!)
  const quedaInstantanea = calcularImpactoComboSkillDot({
    maxHp: 35000,
    danoFisicoCombo: 15000,
    dotPorSeg: 44073,
    duracaoSeg: 4,
  });
  assert.equal(quedaInstantanea.letalNoCombo, true);
  assert.equal(quedaInstantanea.ticksParaMorrer, 1);
  assert.equal(quedaInstantanea.tempoParaMorrerSeg, 0.5);

  // Caso 2: Herói com 180.000 HP (DoT sozinho = 176.288 NÃO matava, mas hit inicial de 45.000 + DoT mata em 3,5s!)
  const mataComHitInicial = calcularImpactoComboSkillDot({
    maxHp: 180000,
    danoFisicoCombo: 45000,
    dotPorSeg: 44073,
    duracaoSeg: 4,
  });
  assert.equal(mataComHitInicial.letalNoCombo, true);
  assert.equal(mataComHitInicial.ticksParaMorrer, 7);
  assert.equal(mataComHitInicial.tempoParaMorrerSeg, 3.5);

  // Caso 3: Herói com 400.000 HP sobrevive ao combo completo (15.000 + 176.296)
  const sobrevive = calcularImpactoComboSkillDot({
    maxHp: 400000,
    danoFisicoCombo: 15000,
    dotPorSeg: 44073,
    duracaoSeg: 4,
  });
  assert.equal(sobrevive.letalNoCombo, false);
  assert.equal(sobrevive.tempoParaMorrerSeg, null);
  assert.ok(sobrevive.hpAposCombo > 200000);

  // Caso 4: Faixa de limiar no impacto e 1º tick (ex.: 158,6k HP, impacto ~105, tick 22.037 -> ~14% HP cai no 1º tick; vida cheia cai em 4s)
  const limiares = calcularImpactoComboSkillDot({
    maxHp: 158600,
    danoFisicoCombo: 105,
    danoFisicoComboMin: 95,
    danoFisicoComboMax: 202,
    dotPorSeg: 44073,
    duracaoSeg: 4,
  });
  assert.equal(limiares.letalNoCombo, true);
  assert.equal(limiares.tempoParaMorrerSeg, 4);
  assert.equal(limiares.limiarImpactoMin, 95);
  assert.equal(limiares.limiarImpactoMax, 202);
  assert.equal(limiares.limiarPrimeiroTickMin, 95 + 22037);
  assert.equal(limiares.limiarPrimeiroTickMax, 202 + 22037);
  assert.equal(Math.round(limiares.pctHpPrimeiroTickMedio), 14);

  // Caso 5: Forjador de Almas (pisão + marca 0,8s depois + queimadura de 4s)
  const forjador = calcularImpactoComboSkillDot({
    maxHp: 100000,
    danoFisicoCombo: 30000,
    dotPorSeg: 30000, // 15.000 por tick de 0,5s
    duracaoSeg: 4,
    golpeExtraAntesDot: 30000,
    atrasoAntesDotSeg: 0.8,
  });
  // Sobra 40.000 após os 2 golpes -> precisa de 3 ticks (45.000) -> 0,8 + 1,5 = 2,3s
  assert.equal(forjador.letalNoCombo, true);
  assert.equal(forjador.causaQueda, "dot");
  assert.equal(forjador.ticksParaMorrer, 3);
  assert.equal(forjador.tempoParaMorrerSeg, 2.3);

  // Caso 6: Mímico Voraz (mordida + 12 ticks de 0,5s + expulsão 1,4× aos 6s)
  const mimico = calcularImpactoComboSkillDot({
    maxHp: 100000,
    danoFisicoCombo: 10000,
    dotPorSeg: 14000, // 7.000 por tick x 12 = 84.000 (total pré-expulsão = 94.000 < 100.000)
    duracaoSeg: 6,
    golpeExtraFimDot: 15000, // expulsão derruba aos 6s!
    primeiroTickImediato: true,
  });
  assert.equal(mimico.letalNoCombo, true);
  assert.equal(mimico.causaQueda, "golpe_final");
  assert.equal(mimico.tempoParaMorrerSeg, 6);
  assert.equal(mimico.tempoPrimeiroTickSeg, 0.017);
});

test("Mímico: primeiro tick sai em ~0,017s (1 frame a 60fps), não em 0,5s, pelo floor(swallowT*2)", async () => {
  const { calcularImpactoComboSkillDot } = await importarModulo("src/combate.mjs");

  // Cliente oficial: Math.floor(r*2) !== Math.floor(swallowT*2) a cada frame
  // Frame 1: floor(6.0*2) !== floor(6.0*2) → 12 !== 12? NÃO
  // Frame 2: floor(6.0*2) !== floor(5.983*2) → 12 !== 11? SIM → TICK!
  const mimico = calcularImpactoComboSkillDot({
    maxHp: 100000,
    danoFisicoCombo: 15000,
    dotPorSeg: 28000, // 14.000 por tick de 0,5s
    duracaoSeg: 6,
    primeiroTickImediato: true,
  });

  assert.equal(mimico.tempoPrimeiroTickSeg, 0.017);
  assert.equal(mimico.limiarPrimeiroTickMedio, 15000 + 14000); // mordida + 1º tick imediato

  // Herói com 29.000 HP cai no 1º tick (quase instantâneo):
  const quedaInstantanea = calcularImpactoComboSkillDot({
    maxHp: 29000,
    danoFisicoCombo: 15000,
    dotPorSeg: 28000,
    duracaoSeg: 6,
    primeiroTickImediato: true,
  });
  assert.equal(quedaInstantanea.letalNoCombo, true);
  assert.equal(quedaInstantanea.ticksParaMorrer, 1);
  assert.equal(quedaInstantanea.tempoParaMorrerSeg, 0.02);

  // Herói com 55.000 HP (sobra 40.000 após mordida de 15.000) cai no 3º tick:
  // 1º tick (~0s) + 2º tick (0,5s) + 3º tick (1,0s) → 1,0s (não 1,5s!)
  const quedaTerceiroTick = calcularImpactoComboSkillDot({
    maxHp: 55000,
    danoFisicoCombo: 15000,
    dotPorSeg: 28000,
    duracaoSeg: 6,
    primeiroTickImediato: true,
  });
  assert.equal(quedaTerceiroTick.letalNoCombo, true);
  assert.equal(quedaTerceiroTick.ticksParaMorrer, 3);
  assert.equal(quedaTerceiroTick.tempoParaMorrerSeg, 1);
});

test("Forjador de Almas: limiar do 1º tick inclui pisão (1,0×) + marca (1,0× aos 0,8s) + tick (aos 1,3s)", async () => {
  const { calcularImpactoComboSkillDot } = await importarModulo("src/combate.mjs");

  // Cliente oficial: pisão 1,0× → marca 0,8s depois 1,0× → queimadura 30% ATK/s por 4s
  // ATK 150.000, herói 100k HP, DEF 150 → dano físico por golpe: 21.429
  const forjador = calcularImpactoComboSkillDot({
    maxHp: 100000,
    danoFisicoCombo: 21429, // pisão
    dotPorSeg: 45000, // 22.500 por tick de 0,5s
    duracaoSeg: 4,
    golpeExtraAntesDot: 21429, // marca em 0,8s
    atrasoAntesDotSeg: 0.8,
  });

  // Limiar correto do 1º tick: pisão + marca + 1º tick aos 1,3s
  assert.equal(forjador.limiarPrimeiroTickMedio, 21429 + 21429 + 22500); // 65.358 HP
  assert.equal(forjador.tempoPrimeiroTickSeg, 1.3); // 0.8s (marca) + 0.5s (tick)

  // Herói com 100k HP cai no 3º tick aos 2,3s (não sobrevive):
  assert.equal(forjador.letalNoCombo, true);
  assert.equal(forjador.causaQueda, "dot");
  assert.equal(forjador.ticksParaMorrer, 3);
  assert.equal(forjador.tempoParaMorrerSeg, 2.3); // 0.8s (marca) + 1.5s (3 ticks)

  // HP restante após cada etapa:
  // Após pisão: 100.000 - 21.429 = 78.571
  // Após marca (0,8s): 78.571 - 21.429 = 57.142
  // Após 1º tick (1,3s): 57.142 - 22.500 = 34.642
  // Após 2º tick (1,8s): 34.642 - 22.500 = 12.142
  // Após 3º tick (2,3s): 12.142 - 22.500 = -10.358 → MORTO
  assert.equal(forjador.hpAposCombo, 0); // Math.max(0, negativo)
  assert.ok(forjador.letalNoCombo);
});

