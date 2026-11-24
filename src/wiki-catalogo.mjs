import { PECAS_ALQUIMIA, RARIDADES_ALQUIMIA } from "./alquimia.mjs";
import { catalogoAneis, catalogoArmas, catalogoConjuntos, catalogoGemas, nomesRaridade } from "./dados.mjs";

export const estagiosAparencia = [
  { tier: 0, nome: "Comum", niveis: "Até o Nv. 9" },
  { tier: 1, nome: "Forjado", niveis: "Nv. 10 a 24" },
  { tier: 2, nome: "Rúnico", niveis: "Nv. 25 a 39" },
  { tier: 3, nome: "Mítico", niveis: "Nv. 40 em diante" },
];

export const nivelMinimoEquipamento = { 6: 100, 7: 130 };

const armasAvulsas = {
  bombbow: "archer",
};
const elmos = {
  warrior: ["horns", "wingedhelm", "crest", "skullhelm", "reindeerhelm", "goldhelm", "pumpkinhelm"],
  cleric: ["halo", "hood", "crown", "wizhat", "santahat", "goldcrown", "witchhat"],
  archer: ["hat", "wolfmask", "bandit", "circlet", "elfcap", "goldvisor", "batmask"],
};
const armaduras = {
  warrior: ["spikeplate", "dragonmail", "paladin", "santaplate", "goldplate", "pumpkinplate"],
  cleric: ["wings", "starrobe", "battlerobe", "elfrobe", "goldrobe", "witchrobe"],
  archer: ["leafcloak", "ranger", "shadowsuit", "snowcloak", "goldvest", "vampcloak"],
};
const equipamentosDeEvento = {
  bomberhead: "helmet",
  zombievest: "armor",
};
const consumiveis = [
  { id: "luckscroll", nome: "Pergaminho de Sorte", kind: "luckscroll", look: 0, detalhe: "Aumenta a chance de sucesso de uma forja." },
  { id: "bigscroll", nome: "Grande Pergaminho de Sorte", kind: "luckscroll", look: 1, rarity: 6, detalhe: "Versão Imortal do Pergaminho de Sorte." },
  { id: "arcanescroll", nome: "Pergaminho Supremo de Sorte", kind: "luckscroll", look: 2, rarity: 7, detalhe: "Versão Arcana do Pergaminho de Sorte." },
  { id: "raidcall", nome: "Casulo de Vexxaris", kind: "raidcall", imagem: "/exports/itens/casulo-de-vexxaris.png", detalhe: "Abre o lobby da Raid do Covil de Vexxaris." },
];
const tiersGema = ["Lasca", "Comum", "Lapidada", "Perfeita", "Suprema", "Prismática"];

export function montarCatalogoWiki(kinds = {}) {
  const equipamentos = new Map();
  const adicionar = (kind, slot, nome, classe, rarity, conjunto, detalhe) => {
    equipamentos.set(kind, { id: kind, kind, slot, nome, classe, rarity, conjunto, detalhe, temEstagios: Boolean(kinds[kind]) });
  };

  for (const conjunto of Object.values(catalogoConjuntos)) {
    for (const [slot, chave] of [["weapon", "arma"], ["helmet", "elmo"], ["armor", "armadura"]]) {
      const kind = conjunto[chave + "Kind"];
      const arma = slot === "weapon" ? catalogoArmas[kind] : null;
      adicionar(kind, slot, kinds[kind]?.label || conjunto[chave + "Nome"], conjunto.classe, conjunto.raridadePadrao,
        conjunto.nome, arma?.efeito?.texto || arma?.notaSkill);
    }
  }
  for (const [kind, arma] of Object.entries(catalogoArmas)) {
    if (!equipamentos.has(kind)) {
      adicionar(kind, "weapon", kinds[kind]?.label || arma.nome, arma.classe, arma.raridade, null, arma.efeito?.texto || arma.notaSkill);
    }
  }
  for (const [kind, classe] of Object.entries(armasAvulsas)) {
    if (!equipamentos.has(kind) && kinds[kind]) adicionar(kind, "weapon", kinds[kind].label, classe);
  }
  for (const [slot, grupos] of [["helmet", elmos], ["armor", armaduras]]) {
    for (const [classe, lista] of Object.entries(grupos)) {
      for (const kind of lista) {
        const info = kinds[kind];
        if (info && !equipamentos.has(kind)) {
          const rarity = /^Item de Evento/i.test(info.effect ?? "") ? 5 : undefined;
          adicionar(kind, slot, info.label, classe, rarity);
        }
      }
    }
  }
  for (const [kind, slot] of Object.entries(equipamentosDeEvento)) {
    if (kinds[kind]) adicionar(kind, slot, kinds[kind].label, undefined, 5);
  }

  const aneis = Object.entries(catalogoAneis).map(([look, anel]) => ({
    id: "anel-" + look,
    slot: "ring",
    nome: anel.nome,
    look: Number(look),
    rarity: anel.raridadeMin,
    detalhe: anel.efeito,
    obtencao: anel.obtencao,
    notaVisual: "A ficha do anel mostra a raridade. Quando há uma seção de efeito, ela descreve a habilidade do anel. O ícone segue o modelo do anel e a ficha não exibe os rótulos de estágio de aparência.",
  }));
  const notaBasicos = "A ficha do item básico mostra a raridade mesmo em níveis altos. O jogo não exibe um rótulo de estágio para esse modelo.";
  const basicos = [
    ...[["warrior", "Espada"], ["cleric", "Cajado"], ["archer", "Arco"]].map(([classe, nome]) => ({
      id: "basico-" + classe, slot: "weapon", nome: nome + " básico", classe, notaVisual: notaBasicos,
      buscaExtra: classe === "cleric" ? "Cajado Gasto" : undefined,
    })),
    { id: "basico-elmo", slot: "helmet", nome: "Elmo básico", notaVisual: notaBasicos },
    { id: "basico-armadura", slot: "armor", nome: "Armadura básica", notaVisual: notaBasicos },
    { id: "basico-anel", slot: "ring", nome: "Anel básico", notaVisual: notaBasicos },
  ];
  const gemas = Object.entries(catalogoGemas).flatMap(([tipo, gema]) => tiersGema.map((rotulo, indice) => ({
    id: tipo + "-" + (indice + 1),
    slot: "gem",
    tipo,
    gemTier: indice + 1,
    nome: gema.nome + " " + rotulo,
    detalhe: indice >= 4 ? "Concede dois atributos. Os bônus dependem do engaste e da rolagem." : "Concede um atributo. O bônus depende do engaste e da rolagem.",
  })));
  const fragmentos = PECAS_ALQUIMIA.flatMap((peca) => RARIDADES_ALQUIMIA.map((raridade) => ({
    id: `fragmento-${peca.chave}-${raridade.id}`,
    slot: "fragment",
    peca: peca.chave,
    rarity: raridade.id,
    nome: `Fragmento de ${raridade.metal} · ${peca.rotulo}`,
    detalhe: "Material de Alquimia separado por tipo de equipamento e raridade.",
  })));
  const kindsConsumiveis = new Set(consumiveis.map(({ kind }) => kind));
  const cosmeticos = Object.entries(kinds)
    .filter(([kind]) => !equipamentos.has(kind) && !kindsConsumiveis.has(kind))
    .map(([kind, info]) => {
      const nomeRaridade = info.effect?.split(",")[0]?.trim().toLowerCase();
      const rarity = nomesRaridade.findIndex((nome) =>
        nome.toLowerCase() === (nomeRaridade === "arcana" ? "arcano" : nomeRaridade)
      );
      return {
        id: kind, slot: "cosmetic", kind, nome: info.label,
        rarity: rarity >= 0 ? rarity : undefined,
        detalhe: "Altera a aparência do personagem.",
      };
    });

  return [
    ...equipamentos.values(), ...aneis, ...basicos, ...cosmeticos,
    ...gemas, ...fragmentos, ...consumiveis.map((item) => ({ ...item, slot: "consumable" })),
  ].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}
