const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM } = require('../../extensao-riftstream/node_modules/jsdom');
const sharing = require('../compartilhamento.js');
function build() {
  return { cls: 'cleric', level: 700, atributos: { str: 130, vit: 136, def: 131, agi: 140, luk: 131 }, itens: ['weapon','helmet','armor','ring'].map(slot => ({id:slot,slot,name:'Peça',kind:'staff',set:'',rarity:7,itemLevel:336,atk:1120,def:937,hp:4603,crit:159,spd:8,sockets:6,gems:Array.from({length:6},()=>({kind:'sapphire',tier:5,stat:'spd',value:43,pct:false,stat2:'def',value2:48,pct2:true}))})) };
}
test('profile lookup retries only the alternate Kick spelling after a 404', async (t) => {
  let encontrado;
  const chamadas = [];
  t.mock.method(globalThis, 'fetch', async (rota) => {
    const url = new URL(rota, 'https://example.test');
    const login = decodeURIComponent(url.pathname.split('/').pop());
    chamadas.push(login);
    assert.equal(url.searchParams.get('cls'), 'cleric');
    return login === encontrado
      ? Response.json({ login })
      : Response.json({ error: 'Jogador não encontrado.' }, { status: 404 });
  });
  globalThis.window = { location: { protocol: 'https:' } };
  t.after(() => { delete globalThis.window; });
  const { buscarRespostaPerfil } = await import('../src/api.mjs');

  for (const [digitado, loginEncontrado, status, tentativas] of [
    ['kick:emy_consulin', 'kick:emy-consulin', 200, ['kick:emy_consulin', 'kick:emy-consulin']],
    ['kick:foo-bar', 'kick:foo_bar', 200, ['kick:foo-bar', 'kick:foo_bar']],
    ['kick:emy-consulin', 'kick:emy-consulin', 200, ['kick:emy-consulin']],
    ['emy_consulin', null, 404, ['emy_consulin']],
    ['kick:sem_perfil', null, 404, ['kick:sem_perfil', 'kick:sem-perfil']],
  ]) {
    chamadas.length = 0;
    encontrado = loginEncontrado;
    const resultado = await buscarRespostaPerfil(digitado, 'cleric');
    assert.deepEqual(chamadas, tentativas);
    assert.equal(resultado.resposta.status, status);
    assert.equal(resultado.loginConsultado, tentativas.at(-1));
  }
});

test('shared build preserves class, attributes, equipment stats and all six Supreme gems', async () => {
  const original = build();
  const decoded = await sharing.decodificarBuildDeHash(await sharing.serializarBuildParaHash(original));
  assert.equal(decoded.buildA.cls, 'cleric');
  assert.deepEqual(decoded.buildA.atributos, original.atributos);
  assert.equal(decoded.buildA.itens[0].atk,1120);
  assert.deepEqual(decoded.buildA.itens[0].gems, original.itens[0].gems);
  assert.throws(()=>sharing.clonarBuildSeguro({itens:[]}));
  original.atributos.str=Infinity;
  await assert.rejects(()=>sharing.serializarBuildParaHash(original));
});
test('history records equipment and gem changes even when FC and counters do not change', () => {
  const store = new Map();
  global.localStorage = { getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v) };
  const h = require('../historico.js');
  const profile={power:100,level:700,equipped:build().itens,counters:{}};
  h.salvarSnapshotConsulta('twitch','nick','cleric',profile);
  profile.equipped[0].gems[0].value=55;
  h.salvarSnapshotConsulta('twitch','nick','cleric',profile);
  const history=h.obterHistoricoPersonagem('twitch','nick','cleric');
  assert.equal(history.length,2);
  assert.equal(history[0].profile.equipped[0].item.kind,'staff');
  assert.equal(h.compararSnapshots(...history).alteracoesItens.length,1);
  delete global.localStorage;
});
test('shared link initializes the actual simulator and renders finite calculations', async (t) => {
  const hash = await sharing.serializarBuildParaHash(build());
  const w = new JSDOM(fs.readFileSync('index.html', 'utf8'), {
    url: 'https://example.test/?aba=simulador#' + hash,
    runScripts: 'outside-only',
  }).window;
  const requested = [];
  const globals = {
    window: w,
    document: w.document,
    HTMLElement: w.HTMLElement,
    Option: w.Option,
    fetch: async (url) => {
      requested.push(String(url));
      const items = String(url).includes('/ranking/characters?')
        ? [{ login: 'kick:regression_nick', cls: 'cleric', level: 700, power: 12345 }]
        : [];
      return { ok: true, status: 200, json: async () => ({ items }) };
    },
  };
  for (const [key, value] of Object.entries(globals)) {
    const anterior = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, { configurable: true, value, writable: true });
    t.after(() => {
      if (anterior) Object.defineProperty(globalThis, key, anterior);
      else delete globalThis[key];
    });
  }
  w.TextEncoder = TextEncoder;
  w.TextDecoder = TextDecoder;
  w.Blob = Blob;
  w.DecompressionStream = DecompressionStream;
  w.scrollTo = () => {};
  t.after(() => w.close());
  for (const file of ['explicacoes.js', 'analise.js', 'historico.js', 'compartilhamento.js']) {
    w.eval(fs.readFileSync(file, 'utf8'));
  }

  await import('../app.mjs');
  const { simulacao } = await import('../src/simulador/estado.mjs');
  const { calcularFc, calcularStatusSimulados } = await import('../src/combate.mjs');
  const { renderizarPlanejadorForjas } = await import('../src/forjas.mjs');
  const { atualizarTop1Dinamicos } = await import('../src/panorama.mjs');
  const { cls, level, atributos, itens } = simulacao.estadoSimulador;
  assert.equal(cls, 'cleric');
  assert.equal(itens[0].gems.length, 6);
  assert.ok(Number.isFinite(calcularFc(cls, calcularStatusSimulados(cls, level, atributos, itens))));
  renderizarPlanejadorForjas(null);
  const slots = [...w.document.querySelectorAll('#select-planejador-slot option')].map(node => node.textContent);
  assert.deepEqual(slots, ['Arma', 'Elmo', 'Armadura', 'Anel']);
  assert.doesNotMatch(w.document.querySelector('#select-planejador-slot').parentElement.parentElement.parentElement.textContent, /Minérios|500\.000/);
  await atualizarTop1Dinamicos();
  w.document.querySelector('[data-panorama-acao="consultar-top1"]').click();
  assert.equal(w.document.querySelector('#input-nick').value, 'regression_nick');
  assert.equal(w.document.querySelector('#select-plataforma').value, 'kick');
  assert.ok(requested.some(url => url.includes('kick%3Aregression_nick')));
  assert.ok(!requested.some(url => url.includes('/profile/undefined')));
});

test('Tier List keeps the Eclipse interaction visible and uses class-specific FC at average gem rolls', async (t) => {
  const { window } = new JSDOM(fs.readFileSync('tierlist.html', 'utf8'));
  globalThis.window = window;
  globalThis.document = window.document;
  t.after(() => {
    window.close();
    delete globalThis.document;
    delete globalThis.window;
  });
  await import('../src/tierlist.mjs');
  const click = (selector) => window.document.querySelector(selector).click();
  const detalhe = () => window.document.querySelector('#tierlist-detalhe').textContent;
  const primeirosSPlus = () => [...window.document.querySelectorAll('.tl-tier-splus [data-tl-card]')]
    .slice(0, 3)
    .map(card => card.dataset.tlCard);
  assert.deepEqual(primeirosSPlus(), ['ring_17', 'set_singular', 'set_worldtree']);
  const painel = window.document.querySelector('#tierlist-detalhe');
  const rolagens = [];
  painel.scrollIntoView = ({ behavior }) => rolagens.push(behavior);
  click('[data-tl-cat="ring"]');
  assert.deepEqual(rolagens, []);
  const prisma = window.document.querySelector('[data-tl-card="ring_17"]');
  assert.match(prisma.getAttribute('aria-label'), /Arcano/);
  assert.doesNotMatch(prisma.textContent, /Arcano/);
  prisma.click();
  assert.equal(window.document.activeElement, painel);
  assert.deepEqual(rolagens, ['smooth']);
  window.matchMedia = () => ({ matches: true });
  click('[data-tl-card="ring_14"]');
  assert.deepEqual(rolagens, ['smooth', 'auto']);
  for (const categoria of ['todos', 'ring', 'warrior', 'archer', 'cleric']) {
    click(`[data-tl-cat="${categoria}"]`);
    click('[data-tl-card="ring_14"]');
    assert.match(detalhe(), /Eco do Eclipse/);
    assert.match(detalhe(), /20% de chance/);
  }
  click('[data-tl-card="set_echo"]');
  assert.match(detalhe(), /Tier de utilidade C/);
  click('[data-tl-cat="warrior"]');
  assert.deepEqual(primeirosSPlus(), ['set_singular', 'ring_14', 'ring_17']);
  click('[data-tl-modo="fc"]');
  click('[data-tl-card="set_obsidian"]');
  const slots = () => [...painel.querySelectorAll('[data-tl-slot]')].map(peca => peca.dataset.tlSlot);
  assert.deepEqual(slots(), ['weapon', 'helmet', 'armor']);
  assert.match(detalhe(), /10\.101\.979 FC/);
  assert.doesNotMatch(detalhe(), /Ponto forte|Anel do Eclipse Arcano/);
  click('[data-tl-cat="archer"]');
  click('[data-tl-card="set_auroraborealis"]');
  assert.deepEqual(slots(), ['weapon', 'helmet', 'armor']);
  assert.match(detalhe(), /10\.904\.444 FC/);
  click('[data-tl-cat="ring"]');
  click('[data-tl-card="ring_19"]');
  assert.deepEqual(slots(), ['ring']);
  assert.match(detalhe(), /Guerreiro\s+NÍVEL 750\s+Apenas o anel equipado/);
  assert.match(detalhe(), /1\.257\.470 FC/);
  click('[data-tl-cat="cleric"]');
  assert.deepEqual(slots(), ['ring']);
  assert.match(detalhe(), /Clérigo\s+NÍVEL 750\s+Apenas o anel equipado/);
  assert.match(detalhe(), /1\.017\.893 FC/);
  const alterar = (selector, value) => {
    const select = window.document.querySelector(selector);
    select.value = value;
    select.dispatchEvent(new window.Event('change', { bubbles: true }));
  };
  const fcDoCard = (id) => window.document.querySelector(`[data-tl-card="${id}"] .tl-card-tag`).textContent;
  const conferirMudanca = (id, alterarCenario) => {
    const anterior = fcDoCard(id);
    alterarCenario();
    assert.notEqual(fcDoCard(id), anterior);
  };
  click('[data-tl-cat="archer"]');
  click('[data-tl-card="set_auroraborealis"]');
  assert.ok(painel.querySelector('.rs-stage-box [data-tl-heroi]'));
  const fcAurora = fcDoCard('set_auroraborealis');
  const fcTeia = fcDoCard('ring_19');
  conferirMudanca('set_abysshunter', () => click('[data-tl-gem-btn="weapon:0:sapphire"]'));
  assert.notEqual(fcDoCard('set_auroraborealis'), fcAurora);
  assert.equal(fcDoCard('ring_19'), fcTeia);
  click('[data-tl-card="set_abysshunter"]');
  assert.equal(painel.querySelector('[data-tl-gem-btn="weapon:0:sapphire"]').getAttribute('aria-pressed'), 'true');
  conferirMudanca('set_auroraborealis', () => click('[data-tl-slot-tier="weapon:0:6"]'));
  assert.match(detalhe(), /T6 Prismática/);
  assert.match(painel.querySelector('[data-tl-gem-btn="weapon:0:sapphire"]').textContent, /\+67 VEL/);
  const rotuloEngaste = (indice) => painel.querySelector(`[data-tl-selecionar-engaste="${indice}"] .rs-socket-num`).textContent;
  assert.match(rotuloEngaste(0), /T6/);
  assert.match(rotuloEngaste(1), /T5/);
  click('[data-tl-selecionar-engaste="1"]');
  click('[data-tl-slot-tier="weapon:1:3"]');
  assert.match(rotuloEngaste(0), /T6/);
  assert.match(rotuloEngaste(1), /T3/);
  assert.match(rotuloEngaste(2), /T5/);
  conferirMudanca('set_auroraborealis', () => alterar('#tierlist-anel-referencia', '14'));
  assert.deepEqual(slots(), ['weapon', 'helmet', 'armor', 'ring']);
  assert.match(detalhe(), /Anel do Eclipse Arcano/);
  assert.equal(fcDoCard('ring_19'), fcTeia);
  click('[data-tl-card="ring_19"]');
  assert.deepEqual(slots(), ['ring']);
  conferirMudanca('ring_14', () => click('[data-tl-gem-limpar-unico="ring:0"]'));
  assert.notEqual(fcDoCard('ring_19'), fcTeia);
  click('#tierlist-restaurar-fc');
  assert.equal(fcDoCard('set_auroraborealis'), fcAurora);
  assert.equal(fcDoCard('ring_19'), fcTeia);
  click('[data-tl-modo="utilidade"]');
  assert.match(detalhe(), /Ponto forte/);
  assert.deepEqual(slots(), []);
});

test('Mixed gem tiers preserve the game scales and survive shared builds', async () => {
  const { criarGemaPreset, adequarTierGemas, definirTierEngaste, obterTierEngaste, recalcularGemasItem } = await import('../src/simulador/estado.mjs');
  const gema = criarGemaPreset('sapphire', 'weapon', 6, 300, 1);
  assert.deepEqual([gema.tier, gema.stat, gema.value, gema.stat2, gema.value2, gema.pct2], [6, 'spd', 67, 'def', 75, true]);
  const original = build();
  const arma = original.itens[0];
  arma.itemLevel = 300;
  arma.gemTierPadrao = 6;
  arma.gems[0] = gema;
  arma.gems[2] = null;
  definirTierEngaste(arma, 2, 3);
  assert.equal(obterTierEngaste(arma, 2), 3);
  arma.gems[2] = criarGemaPreset('ruby', 'weapon', obterTierEngaste(arma, 2), 300, 1);
  recalcularGemasItem(arma, 1);
  const decoded = await sharing.decodificarBuildDeHash(await sharing.serializarBuildParaHash(original));
  assert.equal(decoded.buildA.itens[0].gemTierPadrao, 6);
  assert.equal(decoded.buildA.itens[0].gems[0].value2, 75);
  assert.deepEqual(decoded.buildA.itens[0].gems.slice(0, 3).map(gema => gema.tier), [6, 5, 3]);
  arma.rarity = 4;
  adequarTierGemas(arma);
  assert.equal(arma.gems[0].tier, 5);
  assert.equal(arma.gemTierPadrao, 5);
});

test('Eclipse echoes damaging skills without changing the base hit or cooldown', async () => {
  const { calcularMetricasCombate } = await import('../src/combate.mjs');
  const status = { atk: 1000, maxHp: 8000, def: 120, aspd: 10, crit: 60, critDmg: 2 };
  const arma = { slot: 'weapon', kind: 'singblade' };
  const semEco = calcularMetricasCombate('warrior', 750, status, [arma]);
  const comEco = calcularMetricasCombate('warrior', 750, status, [arma, { slot: 'ring', rarity: 7, look: 14 }]);
  assert.equal(semEco.analiseEfeitoArma.pctBossEfetivo, 0.04);
  assert.equal(comEco.analiseEfeitoArma.pctBossBase, 0.04);
  assert.equal(comEco.analiseEfeitoArma.pctBossEfetivo, 0.048);
  assert.equal(comEco.dpsSkill, semEco.dpsSkill * 1.2);
  assert.equal(comEco.skillDanoPorAlvo, semEco.skillDanoPorAlvo);
  assert.equal(comEco.cdSkillReal, semEco.cdSkillReal);
});
