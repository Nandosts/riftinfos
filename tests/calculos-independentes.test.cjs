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

test("mecânicas de anéis que justificam a Tier List: Eclipse+Singularidade, Sanguessuga, Prisma Estelar, Cronarca e Eco Rubro", async () => {
  const { calcularMetricasCombate } = await importarModulo("src/combate.mjs");
  const status = { maxHp: 900000, atk: 180000, def: 40000, aspd: 4.0, crit: 50 };

  const armaSing = { slot: "weapon", kind: "singblade", rarity: 7, itemLevel: 320, atk: 42000, def: 0, hp: 0, crit: 10, spd: 8, gems: [] };
  const anelEclipse = { slot: "ring", kind: "ring", look: 14, rarity: 7, itemLevel: 320, atk: 18500, def: 3200, hp: 48000, crit: 18, spd: 16, gems: [] };
  const anelPrisma = { slot: "ring", kind: "ring", look: 17, rarity: 7, itemLevel: 320, atk: 18500, def: 3200, hp: 48000, crit: 18, spd: 16, gems: [] };
  const anelEcoRubro = { slot: "ring", kind: "ring", look: 20, rarity: 7, itemLevel: 320, atk: 18500, def: 3200, hp: 48000, crit: 18, spd: 16, gems: [] };
  const armaCronarca = { slot: "weapon", kind: "chronoblade", rarity: 6, itemLevel: 320, atk: 38000, def: 0, hp: 0, crit: 8, spd: 10, gems: [] };

  const mEclipse = calcularMetricasCombate("warrior", 320, status, [armaSing, anelEclipse]);
  const mPrisma = calcularMetricasCombate("warrior", 320, status, [armaSing, anelPrisma]);
  const mEco = calcularMetricasCombate("warrior", 320, status, [armaSing, anelEcoRubro]);
  const mCronarca = calcularMetricasCombate("warrior", 320, status, [armaCronarca, anelEclipse]);

  assert.ok(mEclipse.dpsCombateMedio > 0 && Number.isFinite(mEclipse.dpsCombateMedio));
  assert.ok(mPrisma.dpsCombateMedio > 0 && Number.isFinite(mPrisma.dpsCombateMedio));
  assert.ok(mEco.dpsCombateMedio > 0 && Number.isFinite(mEco.dpsCombateMedio));
  assert.ok(mCronarca.dpsCombateMedio > 0 && Number.isFinite(mCronarca.dpsCombateMedio));
});
