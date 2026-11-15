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
