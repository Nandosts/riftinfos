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

