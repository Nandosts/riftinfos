const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM } = require('../../extensao-riftstream/node_modules/jsdom');
const sharing = require('../compartilhamento.js');
function build() {
  return { cls: 'cleric', level: 700, atributos: { str: 130, vit: 136, def: 131, agi: 140, luk: 131 }, itens: ['weapon','helmet','armor','ring'].map(slot => ({id:slot,slot,name:'Peça',kind:'staff',set:'',rarity:7,itemLevel:336,atk:1120,def:937,hp:4603,crit:159,spd:8,sockets:6,gems:Array.from({length:6},()=>({kind:'sapphire',tier:5,stat:'spd',value:43,pct:false,stat2:'def',value2:48,pct2:true}))})) };
}
test('shared build preserves class, attributes, equipment stats and all six Supreme gems', () => {
  const original = build();
  const decoded = sharing.decodificarBuildDeHash(sharing.serializarBuildParaHash(original));
  assert.equal(decoded.buildA.cls, 'cleric');
  assert.deepEqual(decoded.buildA.atributos, original.atributos);
  assert.equal(decoded.buildA.itens[0].atk,1120);
  assert.deepEqual(decoded.buildA.itens[0].gems, original.itens[0].gems);
  assert.throws(()=>sharing.clonarBuildSeguro({itens:[]}));
  original.atributos.str=Infinity;
  assert.throws(()=>sharing.serializarBuildParaHash(original));
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
test('shared link initializes the actual simulator and renders finite calculations', () => {
  const hash=sharing.serializarBuildParaHash(build());
  const w=new JSDOM(fs.readFileSync('index.html','utf8'),{url:'https://example.test/?aba=simulador#'+hash,runScripts:'outside-only'}).window;
  w.TextEncoder = TextEncoder;
  const requested = [];
  w.fetch=async(url)=>{ requested.push(String(url)); throw new Error('offline fixture'); };
  for(const file of ['explicacoes.js','analise.js','historico.js','compartilhamento.js','app.js']) w.eval(fs.readFileSync(file,'utf8') + (file === 'app.js' ? '; window.reviewTop = () => { top1GeralDinamico = { nick: "regression_nick", plataforma: "kick", cls: "cleric" }; }; window.reviewPlanner = () => renderizarPlanejadorForjas(null); window.reviewState = () => estadoSimulador; window.reviewFC = () => calcularFc(estadoSimulador.cls, calcularStatusSimulados(estadoSimulador.cls, estadoSimulador.level, estadoSimulador.atributos, estadoSimulador.itens));' : ''));
  assert.equal(w.reviewState().cls,'cleric');
  assert.equal(w.reviewState().itens[0].gems.length,6);
  assert.ok(Number.isFinite(w.reviewFC()));
  w.reviewPlanner();
  const slots = [...w.document.querySelectorAll('#select-planejador-slot option')].map(node => node.textContent);
  assert.deepEqual(slots, ['Arma', 'Elmo', 'Armadura', 'Anel']);
  assert.doesNotMatch(w.document.querySelector('#select-planejador-slot').parentElement.parentElement.parentElement.textContent, /Minérios|500\.000/);
  w.reviewTop();
  w.document.querySelector('[data-panorama-acao="consultar-top1"]').click();
  assert.equal(w.document.querySelector('#input-nick').value, 'regression_nick');
  assert.equal(w.document.querySelector('#select-plataforma').value, 'kick');
  assert.ok(requested.some(url => url.includes('kick%3Aregression_nick')));
  assert.ok(!requested.some(url => url.includes('/profile/undefined')));
  w.close();
});
