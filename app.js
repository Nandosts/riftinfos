const apiRemota = "https://z6ywq6r3ub.execute-api.us-east-1.amazonaws.com";
const proxiesPublicos = [
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
];

const nomesClasses = {
  warrior: "Guerreiro",
  cleric: "Clérigo",
  archer: "Arqueiro",
};

const dadosClasses = {
  warrior: {
    k: 0.6,
    base: { hp: 120, atk: 9, def: 4, aspd: 0.95 },
    growth: { hp: 19, atk: 1.6, def: 1.1 },
    cor: "#ff6b5a",
    cdBaseSkill: 7,
    multBaseSkill: 1.5,
    nomeSkill: "Golpe Giratório",
  },
  cleric: {
    k: 0.84,
    base: { hp: 85, atk: 6, def: 2, aspd: 0.8 },
    growth: { hp: 9, atk: 1.1, def: 0.5 },
    cor: "#ffe27a",
    cdBaseSkill: 12,
    multBaseSkill: 0.85,
    nomeSkill: "Luz Divina",
  },
  archer: {
    k: 0.72,
    base: { hp: 70, atk: 11, def: 1.5, aspd: 1.1 },
    growth: { hp: 8, atk: 1.9, def: 0.4 },
    cor: "#7be07b",
    cdBaseSkill: 8,
    multBaseSkill: 1.1,
    nomeSkill: "Rajada de Flechas",
  },
};

const catalogoConjuntos = {
  berserker: { nome: "Fúria do Berserker", classe: "warrior", armaKind: "bloodaxe", b2: { atk: 0.12 }, b3: { hp: 0.15, crit: 6 } },
  lunar: { nome: "Ordem Lunar", classe: "cleric", armaKind: "moonstaff", b2: { hp: 0.12, def: 0.1 }, b3: { atk: 0.15, spd: 0.1 } },
  wind: { nome: "Arqueiro do Vento", classe: "archer", armaKind: "yumi", b2: { atk: 0.1, spd: 0.05 }, b3: { crit: 6, spd: 0.1 } },
  volcano: { nome: "Titã Vulcânico", classe: "warrior", armaKind: "magmablade", b2: { atk: 0.15, def: 0.1 }, b3: { hp: 0.2, atk: 0.12, crit: 5 } },
  reaperset: { nome: "Ceifador Espectral", classe: "warrior", armaKind: "reaper", b2: { atk: 0.1, crit: 6 }, b3: { atk: 0.2, spd: 0.1 } },
  dawn: { nome: "Serafim da Aurora", classe: "cleric", armaKind: "dawnscepter", b2: { hp: 0.18, def: 0.1 }, b3: { atk: 0.25, hp: 0.12 } },
  abyss: { nome: "Arconte do Vazio", classe: "cleric", armaKind: "voidstaff", b2: { atk: 0.15, crit: 5 }, b3: { atk: 0.2, spd: 0.12 } },
  stellar: { nome: "Caçador Estelar", classe: "archer", armaKind: "starbow", b2: { atk: 0.12, spd: 0.08 }, b3: { crit: 8, atk: 0.15 } },
  cosmicvan: { nome: "Vanguarda Cósmica", classe: "warrior", armaKind: "sword", b2: { atk: 0.1, def: 0.08 }, b3: { hp: 0.15, atk: 0.1 } },
  oracle: { nome: "Oráculo Interestelar", classe: "cleric", armaKind: "staff", b2: { hp: 0.12, atk: 0.08 }, b3: { atk: 0.15, spd: 0.1 } },
  etehunter: { nome: "Caçador de Etês", classe: "archer", armaKind: "piercebow", b2: { atk: 0.1, crit: 5 }, b3: { crit: 8, spd: 0.1 } },
  prism: { nome: "Mestre Prismático", classe: "archer", armaKind: "prismbow", b2: { atk: 0.12, crit: 6 }, b3: { hp: 0.1, atk: 0.2, spd: 0.1 } },
  ember: { nome: "Brasa Eterna", classe: "warrior", armaKind: "emberblade", b2: { hp: 0.2, def: 0.15 }, b3: { atk: 0.3, hp: 0.25 } },
  gore: { nome: "Carnificina", classe: "warrior", armaKind: "gorecleaver", b2: { atk: 0.25, crit: 8 }, b3: { atk: 0.4, spd: 0.15 } },
  echo: { nome: "Eco Rubro", classe: "cleric", armaKind: "echostaff", b2: { hp: 0.2, atk: 0.15 }, b3: { atk: 0.35, spd: 0.2 } },
  communion: { nome: "Comunhão Rubra", classe: "cleric", armaKind: "commscepter", b2: { hp: 0.25, def: 0.15 }, b3: { atk: 0.3, hp: 0.25 } },
  predator: { nome: "Predador Carmesim", classe: "archer", armaKind: "predbow", b2: { atk: 0.2, crit: 8 }, b3: { atk: 0.3, crit: 10, spd: 0.1 } },
  tempest: { nome: "Tempestade Escarlate", classe: "archer", armaKind: "tempbow", b2: { atk: 0.2, spd: 0.12 }, b3: { atk: 0.3, spd: 0.25 } },
  chrono: { nome: "Cronarca", classe: "warrior", armaKind: "chronoblade", b2: { def: 0.15, spd: 0.12 }, b3: { atk: 0.3, spd: 0.2, hp: 0.15 } },
  singular: { nome: "Singularidade", classe: "warrior", armaKind: "singblade", b2: { atk: 0.25, crit: 6 }, b3: { atk: 0.4, hp: 0.2, crit: 10 } },
  constel: { nome: "Constelação", classe: "cleric", armaKind: "conststaff", b2: { hp: 0.22, def: 0.15 }, b3: { atk: 0.3, hp: 0.25, spd: 0.1 } },
  worldtree: { nome: "Árvore-Mundo", classe: "cleric", armaKind: "worldstaff", b2: { hp: 0.3, atk: 0.1 }, b3: { atk: 0.4, atk: 0.25 } },
  luna: { nome: "Luar Prateado", classe: "archer", armaKind: "lunabow", b2: { atk: 0.22, spd: 0.1 }, b3: { atk: 0.35, crit: 8, spd: 0.1 } },
  dragon: { nome: "Dragão Ancestral", classe: "archer", armaKind: "dragonbow", b2: { atk: 0.2, crit: 8 }, b3: { atk: 0.4, hp: 0.15, crit: 10 } },
  tamer: { nome: "Domador de Feras", classe: "warrior", armaKind: "tamerwhip", b2: { atk: 0.3, hp: 0.2 }, b3: { atk: 0.55, hp: 0.25, spd: 0.15 } },
  strongman: { nome: "Homem-Forte", classe: "warrior", armaKind: "strongmallet", b2: { hp: 0.35, def: 0.25 }, b3: { atk: 0.5, hp: 0.4, crit: 10 } },
  illusion: { nome: "Ilusionista", classe: "cleric", armaKind: "magewand", b2: { hp: 0.3, atk: 0.25 }, b3: { atk: 0.5, hp: 0.3, spd: 0.2 } },
  fortune: { nome: "Madame Cartomante", classe: "cleric", armaKind: "crystalball", b2: { hp: 0.35, def: 0.2 }, b3: { atk: 0.35, hp: 0.55 } },
  trapeze: { nome: "Trapezista", classe: "archer", armaKind: "trapezebow", b2: { atk: 0.3, spd: 0.15 }, b3: { atk: 0.5, crit: 12, spd: 0.25 } },
  firework: { nome: "Pirotécnico", classe: "archer", armaKind: "fireworkbow", b2: { atk: 0.3, crit: 10 }, b3: { atk: 0.6, crit: 15, hp: 0.15 } },
  obsidian: { nome: "Titã de Obsidiana", classe: "warrior", armaKind: "obsidblade", b2: { hp: 0.3, def: 0.3 }, b3: { atk: 0.45, hp: 0.45, def: 0.15 } },
  thunderlord: { nome: "Senhor do Trovão", classe: "warrior", armaKind: "thunderaxe", b2: { atk: 0.35, crit: 10 }, b3: { atk: 0.6, crit: 15, spd: 0.15 } },
  seraphgold: { nome: "Serafim Dourado", classe: "cleric", armaKind: "serafscepter", b2: { hp: 0.35, atk: 0.25 }, b3: { hp: 0.55, atk: 0.4, spd: 0.1 } },
  eclipsepriest: { nome: "Sacerdote do Eclipse", classe: "cleric", armaKind: "eclipsestaff", b2: { atk: 0.3, def: 0.2 }, b3: { atk: 0.55, hp: 0.3, spd: 0.2 } },
  auroraborealis: { nome: "Aurora Boreal", classe: "archer", armaKind: "aurorabow", b2: { atk: 0.25, spd: 0.2 }, b3: { atk: 0.45, spd: 0.2, hp: 0.2 } },
  abysshunter: { nome: "Caçador Abissal", classe: "archer", armaKind: "abyssbow", b2: { atk: 0.35, crit: 12 }, b3: { atk: 0.6, crit: 18, hp: 0.1 } },
};

const catalogoArmas = {
  // Guerreiro
  sword: { nome: "Montante", classe: "warrior", cdMult: 1.0, skillMult: 1.5, skillAlvos: 1, notaSkill: "Golpe Giratório padrão (1,5× ATK)." },
  axe: { nome: "Machado", classe: "warrior", cdMult: 0.75, skillMult: 1.8, skillAlvos: 1, notaSkill: "Skill 25% mais rápida e 1,8× ATK." },
  hammer: { nome: "Martelo", classe: "warrior", cdMult: 1.0, skillMult: 1.65, skillAlvos: 3, notaSkill: "Ataca em área +0,5× e atordoa com a skill (1,65×)." },
  greatsword: { nome: "Espada Longa", classe: "warrior", cdMult: 1.2, skillMult: 2.7, skillAlvos: 1, notaSkill: "Golpe pesado de 2,7× ATK (recarga +20%)." },
  shockblade: { nome: "Espada de Choque", classe: "warrior", cdMult: 1.15, skillMult: 1.35, skillAlvos: 4, notaSkill: "Descarga elétrica em área (1,35×)." },
  chainblade: { nome: "Corrente Abissal", classe: "warrior", cdMult: 1.1, skillMult: 1.65, skillAlvos: 6, notaSkill: "Corrente em até 6 inimigos (1,65×)." },
  bloodaxe: { nome: "Machado Sanguinário", classe: "warrior", cdMult: 1.0, skillMult: 1.5, skillAlvos: 1, notaSkill: "Conjunto Fúria do Berserker." },
  magmablade: { nome: "Lâmina Vulcânica", classe: "warrior", cdMult: 1.2, skillMult: 1.5, skillAlvos: 5, notaSkill: "Onda de magma frontal (1,5×)." },
  reaper: { nome: "Foice do Ceifador", classe: "warrior", cdMult: 1.0, skillMult: 1.305, skillAlvos: 2, notaSkill: "1,305× + executa monstros com <20% de vida." },
  emberblade: {
    nome: "Lâmina da Brasa Eterna",
    classe: "warrior",
    cdMult: 1.0,
    skillMult: 1.5,
    skillAlvos: 1,
    revive: true,
    efeito: { tipo: "revive", cada: 0, mult: 0, bugHit: false, texto: "1x por jornada: renasce com 60% de HP + 30% de escudo." },
  },
  gorecleaver: {
    nome: "Ceifa-Reis",
    classe: "warrior",
    cdMult: 1.0,
    skillMult: 1.5,
    skillAlvos: 1,
    efeito: { tipo: "buff_atk", cada: 12, dur: 4, atkMult: 1.6, steal: 0.25, bugHit: false, texto: "A cada 12s por 4s: +60% ATK e 25% de roubo de vida." },
  },
  chronoblade: {
    nome: "Lâmina do Cronarca",
    classe: "warrior",
    cdMult: 1.0,
    skillMult: 1.5,
    skillAlvos: 1,
    efeito: { tipo: "stun", cada: 14, stunMob: 1.7, stunBoss: 0.9, bugHit: false, texto: "A cada 14s: congela todos os inimigos por 1,7s (Chefe 0,9s)." },
  },
  singblade: {
    nome: "Lâmina da Singularidade",
    classe: "warrior",
    cdMult: 1.0,
    skillMult: 1.5,
    skillAlvos: 1,
    efeito: { tipo: "singularity", cada: 13, pctMob: 0.25, pctBoss: 0.04, bugHit: false, texto: "A cada 13s (+1,4s): causa 25% da vida máx. (Chefe 4%) ignorando defesa." },
  },
  tamerwhip: {
    nome: "Chicote do Domador",
    classe: "warrior",
    cdMult: 1.0,
    skillMult: 1.5,
    skillAlvos: 1,
    efeito: { tipo: "dano", cada: 11, mult: 1.3, bugHit: true, texto: "A cada 11s: chicoteia todos os inimigos (1,3×) e aplica sangramento." },
  },
  strongmallet: {
    nome: "Marreta do Homem-Forte",
    classe: "warrior",
    cdMult: 1.0,
    skillMult: 1.5,
    skillAlvos: 1,
    efeito: { tipo: "dano", cada: 12, mult: 1.6, bugHit: true, texto: "A cada 12s: onda de choque em área (1,6×) + stun (1,3s / Chefe 0,5s)." },
  },
  obsidblade: {
    nome: "Montante de Obsidiana",
    classe: "warrior",
    cdMult: 1.0,
    skillMult: 1.5,
    skillAlvos: 1,
    efeito: { tipo: "dano", cada: 12, mult: 1.8, bugHit: true, texto: "A cada 12s: onda de magma até 200px (1,8×) + escudo de 10% do HP máx." },
  },
  thunderaxe: {
    nome: "Machado do Trovão",
    classe: "warrior",
    cdMult: 1.0,
    skillMult: 1.5,
    skillAlvos: 1,
    efeito: { tipo: "dano", cada: 11, mult: 2.4, alvos: 5, decaimento: 0.85, bugHit: true, texto: "A cada 11s: raio em cadeia em até 5 alvos (2,4× decaindo 0,85×) + stun." },
  },

  // Arqueiro
  bow: { nome: "Arco Curto", classe: "archer", cdMult: 1.0, skillMult: 1.1, skillAlvos: 3, notaSkill: "Rajada padrão: 3 flechas de 1,1× ATK." },
  crossbow: { nome: "Besta", classe: "archer", cdMult: 1.0, basicMult: 1.5, cdBasicMult: 1.35, skillMult: 1.375, skillAlvos: 3, notaSkill: "Ataque básico 1,5× (+35% tempo de tiro); skill 3× de 1,375×." },
  stormbow: { nome: "Arco da Tempestade", classe: "archer", cdMult: 0.85, skillMult: 1.1, skillAlvos: 5, notaSkill: "Skill 15% mais rápida disparando 5 flechas." },
  rainbow: { nome: "Arco da Chuva", classe: "archer", cdMult: 1.2, skillMult: 0.42, skillAlvos: 22, skillSemCrit: true, notaSkill: "22 flechas em área (0,42× cada); também usa hit direto sem crítico." },
  piercebow: { nome: "Arco Perfurante", classe: "archer", cdMult: 1.1, skillMult: 2.2, skillAlvos: 3, notaSkill: "Flecha perfurante na linha (2,2× ATK)." },
  yumi: { nome: "Yumi", classe: "archer", cdMult: 1.0, skillMult: 1.1, skillAlvos: 3, notaSkill: "Arco tradicional (Kyudogi)." },
  starbow: { nome: "Arco Estelar", classe: "archer", cdMult: 1.25, skillMult: 3.52, skillAlvos: 3, notaSkill: "Chuva meteórica: 3,52× centro e 1,76× em área." },
  prismbow: { nome: "Arco Prismático", classe: "archer", cdMult: 1.1, skillMult: 1.4, skillAlvos: 6, notaSkill: "Até 6 ricochetes luminosos (~1,40× × 0,92^i)." },
  predbow: {
    nome: "Arco do Predador Carmesim",
    classe: "archer",
    cdMult: 1.0,
    skillMult: 1.1,
    skillAlvos: 3,
    efeito: { tipo: "buff_crit", cada: 9, dur: 3.5, bugHit: false, texto: "A cada 9s por 3,5s: 100% de chance de Crítico garantido." },
  },
  tempbow: {
    nome: "Arco da Tempestade Escarlate",
    classe: "archer",
    cdMult: 1.0,
    skillMult: 1.1,
    skillAlvos: 3,
    efeito: { tipo: "buff_aspd", cada: 12, dur: 4, bugHit: false, texto: "A cada 12s por 4s: dobra a cadência dos ataques básicos." },
  },
  lunabow: {
    nome: "Arco do Luar Prateado",
    classe: "archer",
    cdMult: 1.0,
    skillMult: 1.1,
    skillAlvos: 3,
    efeito: { tipo: "splash", cada: 10, dur: 4, bugHit: false, texto: "A cada 10s por 4s: flechas ricocheteiam 55% do dano em +2 inimigos." },
  },
  dragonbow: {
    nome: "Arco do Dragão Ancestral",
    classe: "archer",
    cdMult: 1.0,
    skillMult: 1.1,
    skillAlvos: 3,
    efeito: { tipo: "dano", cada: 12, mult: 2.4, bugHit: true, texto: "A cada 12s: sopro de dragão em todos os inimigos (2,4×)." },
  },
  trapezebow: {
    nome: "Arco do Trapézio",
    classe: "archer",
    cdMult: 1.0,
    skillMult: 1.1,
    skillAlvos: 3,
    efeito: { tipo: "dano", cada: 9, mult: 1.8, alvos: 4, bugHit: true, texto: "A cada 9s: acerta até 4 inimigos frontais (1,8×)." },
  },
  fireworkbow: {
    nome: "Arco de Fogos de Artifício",
    classe: "archer",
    cdMult: 1.0,
    skillMult: 1.1,
    skillAlvos: 3,
    efeito: { tipo: "dano", cada: 10, mult: 2.4, bugHit: true, texto: "A cada 10s: foguete explosivo (2,4× principal / 1,2× demais)." },
  },
  aurorabow: {
    nome: "Arco da Aurora Boreal",
    classe: "archer",
    cdMult: 1.0,
    skillMult: 1.1,
    skillAlvos: 3,
    efeito: { tipo: "dano", cada: 12, mult: 1.4, bugHit: true, texto: "A cada 12s: chuva da aurora (1,4×) + escudo de 10% do HP no time." },
  },
  abyssbow: {
    nome: "Arco Abissal",
    classe: "archer",
    cdMult: 1.0,
    skillMult: 1.1,
    skillAlvos: 3,
    efeito: { tipo: "dano", cada: 11, mult: 3.2, bugHit: true, texto: "A cada 11s: maré abissal (3,2× no alvo de maior HP / 1,0× demais) + autocura 8%." },
  },

  // Clérigo
  staff: { nome: "Cajado", classe: "cleric", cdMult: 1.0, skillTipo: "cura", curaMult: 0.85, notaSkill: "Luz Divina padrão (0,85× Poder de Cura)." },
  tome: { nome: "Tomo Sagrado", classe: "cleric", cdMult: 0.7, skillTipo: "cura", curaMult: 0.85 * 1.15, notaSkill: "Recarga 30% menor e +15% na Luz Divina." },
  ankh: { nome: "Cetro da Vida", classe: "cleric", cdMult: 1.3, skillTipo: "cura", curaMult: 0.75 * 0.85, revive: true, notaSkill: "Revive aliado caído com 55% HP ou cura 75% da Luz Divina." },
  sunstaff: { nome: "Cajado Solar", classe: "cleric", cdMult: 1.0, skillTipo: "misto", skillMult: 0.9, skillAlvos: 3, curaMult: 0.85 * 1.3, notaSkill: "+30% na Luz Divina e causa 0,9× ATK em área com rollDamage." },
  froststaff: { nome: "Cajado Glacial", classe: "cleric", cdMult: 1.1, skillTipo: "dano", skillMult: 1.2, skillAlvos: 3, notaSkill: "Ataca até 3 inimigos (1,2× c/ crítico e velocidade) e congela 0,5s." },
  lantern: { nome: "Lanterna das Almas", classe: "cleric", cdMult: 1.25, skillTipo: "misto", skillMult: 0.3, curaMult: 0.14 * 8, skillAlvos: 3, notaSkill: "8 pulsos em área (0,14× cura + 0,3× dano holy)." },
  moonstaff: { nome: "Cajado Lunar", classe: "cleric", cdMult: 1.0, skillTipo: "cura", curaMult: 0.85, notaSkill: "Conjunto Ordem Lunar." },
  dawnscepter: { nome: "Cetro da Aurora", classe: "cleric", cdMult: 1.2, skillTipo: "cura", curaMult: 0.3, escudoMult: 1.2, notaSkill: "Cura 30% e aplica escudo de 120% do Poder de Cura no time." },
  voidstaff: { nome: "Cajado do Vazio", classe: "cleric", cdMult: 1.3, skillTipo: "dano", skillMult: 0.45 * 7 + 1.2, skillAlvos: 4, notaSkill: "Buraco negro: 7 ticks de 0,45× + implosão 1,2× (com crítico)." },
  echostaff: {
    nome: "Cajado do Eco Rubro",
    classe: "cleric",
    cdMult: 1.0,
    skillTipo: "cura",
    curaMult: 0.85,
    efeito: { tipo: "eco", cada: 18, bugHit: false, texto: "A cada 18s: zera a recarga da próxima skill (lançamento duplo)." },
  },
  commscepter: {
    nome: "Cetro da Comunhão Rubra",
    classe: "cleric",
    cdMult: 1.0,
    skillTipo: "cura",
    curaMult: 0.85,
    efeito: { tipo: "buff_time", cada: 12, dur: 5, bugHit: false, texto: "A cada 12s por 5s: cura 25% do HP máx. no time e dá +30% ATK." },
  },
  conststaff: {
    nome: "Cajado da Constelação",
    classe: "cleric",
    cdMult: 1.0,
    skillTipo: "cura",
    curaMult: 0.85,
    efeito: { tipo: "escudo", cada: 16, dur: 6, bugHit: false, texto: "A cada 16s: concede escudo de 20% do HP máx. no time por 6s." },
  },
  worldstaff: {
    nome: "Cajado da Árvore-Mundo",
    classe: "cleric",
    cdMult: 1.0,
    skillTipo: "cura",
    curaMult: 0.85,
    revive: true,
    efeito: { tipo: "revive", cada: 15, bugHit: false, texto: "A cada 15s: revive 1 aliado (50% HP) e cura 8% HP (16% se todos vivos)." },
  },
  magewand: {
    nome: "Varinha da Cartola",
    classe: "cleric",
    cdMult: 1.0,
    skillTipo: "cura",
    curaMult: 0.85,
    efeito: { tipo: "dano_carta", cada: 10, mult: 1.6, bugHit: true, texto: "A cada 10s sorteia 1 carta (33% cura 40% HP / 33% escudo 12% / 33% dano 1,6×)." },
  },
  crystalball: {
    nome: "Bola de Cristal da Madame",
    classe: "cleric",
    cdMult: 1.0,
    skillTipo: "cura",
    curaMult: 0.85,
    efeito: { tipo: "escudo_cura", cada: 12, bugHit: false, texto: "A cada 12s: escudo de 25% HP máx. (7s) + cura de 10% HP máx. no time." },
  },
  serafscepter: {
    nome: "Cetro do Serafim",
    classe: "cleric",
    cdMult: 1.0,
    skillTipo: "cura",
    curaMult: 0.85,
    efeito: { tipo: "escudo_cura", cada: 14, bugHit: false, texto: "A cada 14s: cura 20% HP (30% se <50% vida) + escudo de 8% no time." },
  },
  eclipsestaff: {
    nome: "Cajado do Eclipse",
    classe: "cleric",
    cdMult: 1.0,
    skillTipo: "cura",
    curaMult: 0.85,
    efeito: { tipo: "dano", cada: 15, mult: 1.4, bugHit: true, texto: "A cada 15s: eclipse total em todos os inimigos (1,4×) + stun." },
  },
};

const catalogoAneis = {
  10: { nome: "Anel da Sede Escarlate", raridadeMin: 6, efeito: "Aplica sangramento contínuo ignorando defesa." },
  11: { nome: "Anel do Sanguessuga", raridadeMin: 6, efeito: "Roubo de vida de 8% sobre todo o dano causado." },
  12: { nome: "Anel do Carrasco", raridadeMin: 6, efeito: "+60% de dano contra inimigos com <=30% HP (amplifica Singularidade até 8%)." },
  13: { nome: "Anel da Fênix Rubra", raridadeMin: 6, revive: true, efeito: "1x por jornada: renasce na hora com 40% HP e escudo de 20%." },
  14: { nome: "Anel do Eclipse Arcano", raridadeMin: 7, efeito: "Ricocheteia 60% do golpe em até 2 próximos e 20% de chance de ecoar 100% (amplifica Singularidade p/ 6,4%)." },
  15: { nome: "Anel do Coração do Vazio", raridadeMin: 7, revive: true, efeito: "1x por jornada: renasce com 70% HP + escudo 40% + explosão 2,0× ATK (c/ rollDamage)." },
  16: { nome: "Anel do Ceifador Cósmico", raridadeMin: 7, efeito: "Até 10 almas (+4% ATK por alma, máx. +40%) e Ceifa de 1,6× ATK na 10ª." },
  17: { nome: "Anel do Prisma Estelar", raridadeMin: 7, efeito: "A cada 10s purifica debuffs, aplica escudo 12% HP e cura 8% HP no time." },
};

const catalogoGemas = {
  ruby: {
    nome: "Rubi",
    cor: "#ff4d5e",
    porSlot: {
      weapon: { stat: "atk", pct: false, stat2: "hp", pct2: true },
      helmet: { stat: "hp", pct: true, stat2: "atk", pct2: false },
      armor: { stat: "hp", pct: true, stat2: "atk", pct2: false },
      ring: { stat: "atk", pct: false, stat2: "hp", pct2: true },
    },
  },
  sapphire: {
    nome: "Safira",
    cor: "#4da3ff",
    porSlot: {
      weapon: { stat: "spd", pct: false, stat2: "def", pct2: true },
      helmet: { stat: "def", pct: true, stat2: "spd", pct2: false },
      armor: { stat: "def", pct: true, stat2: "spd", pct2: false },
      ring: { stat: "hp", pct: true, stat2: "def", pct2: true },
    },
  },
  topaz: {
    nome: "Topázio",
    cor: "#ffc93c",
    porSlot: {
      weapon: { stat: "crit", pct: false, stat2: "atk", pct2: false },
      helmet: { stat: "atk", pct: false, stat2: "crit", pct2: false },
      armor: { stat: "atk", pct: false, stat2: "crit", pct2: false },
      ring: { stat: "crit", pct: false, stat2: "spd", pct2: false },
    },
  },
  emerald: {
    nome: "Esmeralda",
    cor: "#4de08a",
    porSlot: {
      weapon: { stat: "hp", pct: true, stat2: "spd", pct2: false },
      helmet: { stat: "spd", pct: false, stat2: "hp", pct2: true },
      armor: { stat: "spd", pct: false, stat2: "hp", pct2: true },
      ring: { stat: "def", pct: true, stat2: "hp", pct2: true },
    },
  },
  amethyst: {
    nome: "Ametista",
    cor: "#b36bff",
    porSlot: {
      weapon: { stat: "def", pct: true, stat2: "crit", pct2: false },
      helmet: { stat: "crit", pct: false, stat2: "def", pct2: true },
      armor: { stat: "crit", pct: false, stat2: "def", pct2: true },
      ring: { stat: "spd", pct: false, stat2: "atk", pct2: false },
    },
  },
};

const nomesRaridade = ["Comum", "Incomum", "Raro", "Épico", "Lendário", "Evento", "Imortal", "Arcano"];
const coresRaridade = ["#c9c5d8", "#6be08a", "#58a8ff", "#c77dff", "#ffb62e", "#ff7a1a", "#ff2d3d", "#eb34b1"];
const nomesSlots = {
  weapon: "Arma",
  helmet: "Elmo",
  armor: "Armadura",
  ring: "Anel",
  cosmetic: "Cosmético",
};
const coresGemas = {
  ruby: "#ff4d5e",
  sapphire: "#4da3ff",
  topaz: "#ffc93c",
  emerald: "#4de08a",
  amethyst: "#b36bff",
};
const rotulosStats = {
  atk: "ATK",
  def: "DEF",
  hp: "HP",
  crit: "CRÍT",
  spd: "VEL",
};

const tiposForja = [
  { chave: "epic", rotulo: "Épico", chanceBase: 0.5 },
  { chave: "imm", rotulo: "Imortal", chanceBase: 0.35 },
  { chave: "arc", rotulo: "Arcano", chanceBase: 0.25 },
];

const chavesRaridadePity = [
  { raridade: 4, rotulo: "Épico", chanceBase: 50 },
  { raridade: 6, rotulo: "Imortal", chanceBase: 35 },
  { raridade: 7, rotulo: "Arcano", chanceBase: 25 },
];

const indicesPecaPity = [
  { idx: 1, slot: "weapon", rotulo: "Arma" },
  { idx: 2, slot: "helmet", rotulo: "Elmo" },
  { idx: 3, slot: "armor", rotulo: "Armadura" },
  { idx: 0, slot: "ring", rotulo: "Anel" },
];

const catalogoTemasZona = [
  {
    nome: "Ruínas Esquecidas",
    melee: "Esqueleto / Golem das Ruínas",
    ranged: "Goblin Arqueiro / Espectro",
    boss: "Rei Esqueleto / Colosso das Ruínas",
    skillBossMult: 1.5,
    cdSkillBoss: 6.5,
    temBleedBoss: false,
    fatorDotVerdadeiroPorSeg: 0,
    resumoSkillBoss: "50% Rei Esqueleto: Pisão Sísmico (1,25× ATK em área a cada 6,5s) · 50% Colosso (+30% HP, +40% DEF, CD 8s): Desmoronamento em 3 heróis (1,5× ATK + Stun 0,5s).",
    resumoLacaios: "A cada 3 esqueletos nasce 1 Golem (+40% HP, +80% DEF); Espectros voam se houver arqueiro/clérigo vivo.",
  },
  {
    nome: "Cavernas Goblin",
    melee: "Orc Brutamontes / Assassino Furtivo",
    ranged: "Goblin Xamã",
    boss: "Chefe Orc",
    skillBossMult: 1.25,
    cdSkillBoss: 6.5,
    temBleedBoss: false,
    fatorDotVerdadeiroPorSeg: 0,
    resumoSkillBoss: "Arremesso Brutal (até 2x): 0,85× ATK em área + joga todos os heróis para trás (0,75s) com Stun de 0,52s; depois usa Pisão (1,25× ATK a cada 6,5s).",
    resumoLacaios: "⚠️ PERIGO REAL: Assassinos Furtivos nascem invisíveis ATRÁS dos Clérigos/Arqueiros dando 3,2× ATK + Sangramento Forte (50% ATK/s por 5,5s = 275% ATK em DANO VERDADEIRO que ignora 100% da DEF)!",
  },
  {
    nome: "Cripta Gélida",
    melee: "Cavaleiro Gélido / Lobo Sombrio",
    ranged: "Mago do Gelo",
    boss: "Rei Gélido",
    skillBossMult: 1.25,
    cdSkillBoss: 6.5,
    temBleedBoss: false,
    fatorDotVerdadeiroPorSeg: 0,
    resumoSkillBoss: "Pisão Glacial a cada 6,5s: 1,25× ATK em todos os heróis num raio de 80.",
    resumoLacaios: "⚠️ Lobos Sombrios nascem pelas costas focando Clérigos e Arqueiros (1,15× a 1,45× ATK, furtivos e muito rápidos).",
  },
  {
    nome: "Fornalha Infernal",
    melee: "Demônio / Puxador de Corrente",
    ranged: "Bruxo das Chamas (Silêncio)",
    boss: "Senhor Demônio / Ferreiro Demoníaco",
    skillBossMult: 1.3,
    cdSkillBoss: 6.5,
    temBleedBoss: true,
    fatorDotVerdadeiroPorSeg: 0.333, // Aura 20% ATK a cada 0.6s + Sangramento 30% ATK/s por 4s
    resumoSkillBoss: "50% Senhor Demônio: Aura Escaldante (33,3% ATK/s de DANO VERDADEIRO contínuo) + Chuva de Brasas (1,1× ATK + Sangramento de 30% ATK/s por 4s ignorando DEF) + Mergulho na Backline (1,3× ATK + Stun 0,6s no Clérigo/Arqueiro). 50% Ferreiro (+20% HP, +15% DEF): Bigorna (1,0× ATK + Sangramento Verdadeiro) e Têmpera (70% redução de dano por 5s; exige 10% do HP máx para quebrar ou explode na sala).",
    resumoLacaios: "⚠️ Bruxo das Chamas aplica SILÊNCIO DE 5s no Clérigo (impede curas); Demônio de Corrente puxa Arqueiro/Clérigo para a linha de frente (Stun 1,2s).",
  },
  {
    nome: "Pântano Sombrio",
    melee: "Homem-Lagarto",
    ranged: "Bruxa do Pântano (Poça Ácida)",
    boss: "Rei Lagarto / Bruxa Chefe",
    skillBossMult: 1.5,
    cdSkillBoss: 6.5,
    temBleedBoss: true,
    fatorDotVerdadeiroPorSeg: 0.8, // Poça de 40% ATK a cada 0.5s (80% ATK/s Dano Verdadeiro) + Caldeirão Bleed 30% ATK/s
    resumoSkillBoss: "50% Bruxa Chefe (+10% HP/DEF): Poções Ácidas (0,8× ATK + poças de 80% ATK/s em DANO VERDADEIRO por 6s ignorando DEF), Sapo (Stun 2,2s) e Caldeirão (cura 5% do HP do Boss + 0,5× ATK e Sangramento de 30% ATK/s na sala toda). 50% Rei Lagarto: Fica invisível 1,8s e puxa Clérigo/Arqueiro com a língua (1,5× ATK + Stun 1,3s) + Rabada (1,0× ATK + empurrão).",
    resumoLacaios: "⚠️ Goblins cospem poças de ácido (70% ATK/s de Dano Verdadeiro por 5s); Homens-Lagarto deixam nuvem de esporos (45% slow por 5s ao morrer).",
  },
  {
    nome: "Recife Abissal",
    melee: "Caranguejo Brutamonte",
    ranged: "Sereia das Profundezas",
    boss: "Kraken",
    skillBossMult: 1.25,
    cdSkillBoss: 6.5,
    temBleedBoss: false,
    fatorDotVerdadeiroPorSeg: 0,
    resumoSkillBoss: "Tentáculo Abissal (Stomp) a cada 6,5s: 1,25× ATK em área num raio de 80.",
    resumoLacaios: "Pressão constante de linha de frente e projéteis aquáticos.",
  },
  {
    nome: "Galáxia Hostil",
    melee: "Alienígena / Abdutor / Assassino",
    ranged: "Atirador Zorg (EMP)",
    boss: "Imperador Cósmico",
    skillBossMult: 0.9,
    cdSkillBoss: 6.5,
    temBleedBoss: false,
    fatorDotVerdadeiroPorSeg: 0,
    resumoSkillBoss: "Pulso Eletromagnético (EMP) a cada 6,5s: Atinge TODA A SALA com 0,9× ATK + Stun Global de 0,55s (interrompe animações de ataque e cura).",
    resumoLacaios: "⚠️ Drop garantido de Épico Espacial no Boss! Alienígenas Abdutores levantam heróis por 1,25s (+0,9× ATK na queda); Assassinos Espaciais nascem furtivos atrás da backline (1,7× ATK); Goblins Zorg também soltam EMP global (0,6× ATK + Stun 0,55s).",
  },
  {
    nome: "Circo dos Horrores",
    melee: "Acrobata / Caixa Explosiva / Leão",
    ranged: "Mágico Cartola / Pula-Pula",
    boss: "Mestre de Cerimônias",
    skillBossMult: 1.1,
    cdSkillBoss: 6.5,
    temBleedBoss: true,
    fatorDotVerdadeiroPorSeg: 0.3, // Sangramento de 30% ATK/s por 4s (120% ATK True Damage)
    resumoSkillBoss: "Roleta do Circo a cada 6,5s (6 efeitos): (1) Facas em 3 alvos: 1,1× ATK + Sangramento (30% ATK/s por 4s = 120% ATK de DANO VERDADEIRO ignorando DEF); (2) Medo (Fear 3s em 2 heróis); (3) Chuva de Facas na SALA TODA: 0,7× ATK + Sangramento Verdadeiro (120% ATK); (4) Cartola: Stun 1,4s + 0,5× ATK; (5) Cura: Boss recupera 7% do HP máximo; (6) Frenesi: Lacaios ganham +35% Move Speed e +25% ASPD.",
    resumoLacaios: "⚠️ Único Boss que dropa conjuntos Arcanos do Circo (Z16+)! Mágicos trocam a posição do Guerreiro com o Clérigo/Arqueiro; Caixas explodem ao morrer (0,9× ATK); Domadores invocam Leões (+90% HP) ao morrer.",
  },
];

const formatadorInteiro = new Intl.NumberFormat("pt-BR");
const formatadorPercentual = new Intl.NumberFormat("pt-BR", {
  style: "percent",
  maximumFractionDigits: 1,
});
const formatadorDecimal1 = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });
const formatadorDecimal2 = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });

// Elementos do DOM
const formularioBusca = document.querySelector("#formulario-busca");
const inputNick = document.querySelector("#input-nick");
const selectPlataforma = document.querySelector("#select-plataforma");
const statusConsulta = document.querySelector("#status-consulta");
const painelResultado = document.querySelector("#painel-resultado");
const cabecalhoPerfil = document.querySelector("#cabecalho-perfil");
const avisoSemPerfil = document.querySelector("#aviso-sem-perfil");
const btnCarregarExemplo = document.querySelector("#btn-carregar-exemplo");
const rodapePainel = document.querySelector("#rodape-painel");
const imgAvatar = document.querySelector("#avatar-jogador");
const selectPersonagem = document.querySelector("#select-personagem");
const corpoTabela = document.querySelector("#linhas-forjas");

const gradeRecordesGlobais = document.querySelector("#grade-recordes-globais");
const panoramaAtualizacao = document.querySelector("#panorama-atualizacao");

const botoesAbas = {
  forjas: document.querySelector("#aba-forjas"),
  equipamentos: document.querySelector("#aba-equipamentos"),
  simulador: document.querySelector("#aba-simulador"),
  monstros: document.querySelector("#aba-monstros"),
  "radar-live": document.querySelector("#aba-radar-live"),
  comparacao: document.querySelector("#aba-comparacao"),
};

const secoesAbas = {
  forjas: document.querySelector("#secao-forjas"),
  equipamentos: document.querySelector("#secao-equipamentos"),
  simulador: document.querySelector("#secao-simulador"),
  monstros: document.querySelector("#secao-monstros"),
  "radar-live": document.querySelector("#secao-radar-live"),
  comparacao: document.querySelector("#secao-comparacao"),
};

const conteudoForjasVazio = document.querySelector("#conteudo-forjas-vazio");
const conteudoForjasPerfil = document.querySelector("#conteudo-forjas-perfil");
const containerMatrizGeloFogo = document.querySelector("#matriz-gelo-fogo");
const containerEventosConquistas = document.querySelector("#resumo-eventos-conquistas");

const conteudoEquipamentosVazio = document.querySelector("#conteudo-equipamentos-vazio");
const conteudoEquipamentosPerfil = document.querySelector("#conteudo-equipamentos-perfil");
const containerResumoFc = document.querySelector("#resumo-fc");
const containerAnaliseCombate = document.querySelector("#analise-combate-jogador");
const containerConjuntos = document.querySelector("#conjuntos-ativos");
const containerAvisoSinergia = document.querySelector("#aviso-sinergia");
const containerListaEquipamentos = document.querySelector("#lista-equipamentos");

const btnSimImportar = document.querySelector("#btn-sim-importar");
const btnSimResetar = document.querySelector("#btn-sim-resetar");
const containerSimulador = document.querySelector("#simulador-container");

const formMonstros = document.querySelector("#form-monstros");
const inputMonstroZona = document.querySelector("#input-monstro-zona");
const inputMonstroOnda = document.querySelector("#input-monstro-onda");
const inputMonstroJogadores = document.querySelector("#input-monstro-jogadores");
const selectMonstroOrigem = document.querySelector("#select-monstro-origem");
const selectMonstroLiveSync = document.querySelector("#select-monstro-live-sync");
const containerResultadoMonstros = document.querySelector("#resultado-monstros");

const btnAtualizarLivesOnline = document.querySelector("#btn-atualizar-lives-online");
const formRadarLive = document.querySelector("#form-radar-live");
const selectRadarLives = document.querySelector("#select-radar-lives");
const inputRadarCanal = document.querySelector("#input-radar-canal");
const selectRadarItem = document.querySelector("#select-radar-item");
const selectRadarClasse = document.querySelector("#select-radar-classe");
const inputRadarBusca = document.querySelector("#input-radar-busca");
const btnEscanearLive = document.querySelector("#btn-escanear-live");
const containerProgressoRadar = document.querySelector("#progresso-radar");
const barraProgressoRadar = document.querySelector("#progresso-radar-barra");
const textoProgressoRadar = document.querySelector("#progresso-radar-texto");
const statusRadar = document.querySelector("#status-radar");
const containerResultadoRadar = document.querySelector("#resultado-radar-live");

const conteudoComparacaoVazio = document.querySelector("#conteudo-comparacao-vazio");
const conteudoComparacaoPerfil = document.querySelector("#conteudo-comparacao-perfil");
const formComparar = document.querySelector("#form-comparar");
const inputCompararNick = document.querySelector("#input-comparar-nick");
const selectCompararPlataforma = document.querySelector("#select-comparar-plataforma");
const btnCompararTop1 = document.querySelector("#btn-comparar-top1");
const btnCompararWarrior = document.querySelector("#btn-comparar-warrior");
const btnCompararCleric = document.querySelector("#btn-comparar-cleric");
const btnCompararArcher = document.querySelector("#btn-comparar-archer");
const statusComparacao = document.querySelector("#status-comparacao");
const resultadoComparacao = document.querySelector("#resultado-comparacao");
const compararP1Card = document.querySelector("#comparar-p1-card");

const topPillValTop1 = document.querySelector("#top-pill-val-top1");
const topPillValWarrior = document.querySelector("#top-pill-val-warrior");
const topPillValCleric = document.querySelector("#top-pill-val-cleric");
const topPillValArcher = document.querySelector("#top-pill-val-archer");
const topPillValLevel = document.querySelector("#top-pill-val-level");

// Estado da aplicação
let jogadorAtual;
let perfilCarregadoP1;
let plataformaCarregadaP1;
let requisicaoAtiva;
let requisicaoRadarAtiva;
let abaAtualAtiva = "forjas";
let simuladorEditadoManual = false;
let estadoSimulador = criarModeloSimuladorPadrao();
let ultimosDadosRadar = null;
const cachePerfisApi = new Map();
const top1DinamicoPorClasse = {
  cleric: { nick: "nando_sts", plataforma: "twitch", rotulo: "nando_sts", power: 31718512, cls: "cleric", level: 698 },
  warrior: { nick: "halscriolo", plataforma: "twitch", rotulo: "halscriolo", power: 49864097, cls: "warrior", level: 691 },
  archer: { nick: "philippato", plataforma: "twitch", rotulo: "philippato", power: 30357030, cls: "archer", level: 767 },
};
let topLevelDinamico = { nick: "boingzeraa", plataforma: "twitch", rotulo: "boingzeraa", level: 798, cls: "warrior" };
let top1GeralDinamico = { ...top1DinamicoPorClasse.warrior };

/* ==========================================================================
   Utilitários e Rede
   ========================================================================== */

function escaparHtml(valor) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function alternarVisibilidadeAba(abaAlvo) {
  abaAtualAtiva = Object.hasOwn(secoesAbas, abaAlvo) ? abaAlvo : "forjas";
  for (const [id, sec] of Object.entries(secoesAbas)) {
    const btn = botoesAbas[id];
    if (!sec || !btn) continue;
    const ativa = id === abaAtualAtiva;
    btn.setAttribute("aria-selected", ativa ? "true" : "false");
    if (ativa) {
      sec.removeAttribute("hidden");
      sec.hidden = false;
    } else {
      sec.setAttribute("hidden", "until-found");
      if (!("onbeforematch" in HTMLElement.prototype)) {
        sec.hidden = true;
      }
    }
  }
}

function configurarAbas() {
  for (const [id, btn] of Object.entries(botoesAbas)) {
    if (!btn) continue;
    btn.addEventListener("click", () => {
      alternarVisibilidadeAba(id);
      if (id === "monstros") {
        renderizarSimuladorMonstros();
      } else if (id === "simulador") {
        renderizarSimulador();
      }
    });
  }

  document.addEventListener("beforematch", (evento) => {
    for (const [id, sec] of Object.entries(secoesAbas)) {
      if (sec && sec.contains(evento.target)) {
        alternarVisibilidadeAba(id);
        break;
      }
    }
  });
}

function atualizarEstadoVazioOuPerfil(temPerfil) {
  if (cabecalhoPerfil) cabecalhoPerfil.hidden = !temPerfil;
  if (avisoSemPerfil) avisoSemPerfil.hidden = temPerfil;
  if (rodapePainel) rodapePainel.hidden = !temPerfil;
  if (conteudoForjasVazio) conteudoForjasVazio.hidden = temPerfil;
  if (conteudoForjasPerfil) conteudoForjasPerfil.hidden = !temPerfil;
  if (conteudoEquipamentosVazio) conteudoEquipamentosVazio.hidden = temPerfil;
  if (conteudoEquipamentosPerfil) conteudoEquipamentosPerfil.hidden = !temPerfil;
  if (conteudoComparacaoVazio) conteudoComparacaoVazio.hidden = temPerfil;
  if (conteudoComparacaoPerfil) conteudoComparacaoPerfil.hidden = !temPerfil;
}

function atualizarParametrosUrl(jogador, classeSelecionada) {
  if (window.location.protocol === "file:") return;
  try {
    const urlPagina = new URL(window.location.href);
    urlPagina.searchParams.set("nick", jogador.nick);
    urlPagina.searchParams.set("plataforma", jogador.plataforma);
    if (classeSelecionada) {
      urlPagina.searchParams.set("cls", classeSelecionada);
    } else {
      urlPagina.searchParams.delete("cls");
    }
    window.history.replaceState(null, "", urlPagina);
  } catch {
    // Ambiente restringiu replaceState
  }
}

function montarRotasTentativa(caminhoApi) {
  const caminhoLimpo = caminhoApi.startsWith("/") ? caminhoApi : `/${caminhoApi}`;
  const urlAws = `${apiRemota}${caminhoLimpo}`;
  const rotas = [];

  if (window.location.protocol !== "file:") {
    rotas.push(caminhoLimpo);
  } else {
    rotas.push(`http://127.0.0.1:4173${caminhoLimpo}`);
  }
  rotas.push(urlAws);
  for (const proxyFn of proxiesPublicos) {
    rotas.push(proxyFn(urlAws));
  }
  return { rotas, urlAws };
}

async function buscarRespostaApi(caminhoApi, sinalAborto, timeoutMs = 9500) {
  const { rotas, urlAws } = montarRotasTentativa(caminhoApi);
  let ultimoErro;
  let statusServidor;

  for (const rota of rotas) {
    if (sinalAborto?.aborted) break;
    try {
      const sinais = [AbortSignal.timeout(timeoutMs)];
      if (sinalAborto) sinais.push(sinalAborto);
      const resposta = await fetch(rota, {
        credentials: "omit",
        signal: AbortSignal.any(sinais),
      });

      if (resposta.status === 404) {
        return { resposta, urlPublica: new URL(urlAws) };
      }
      if (resposta.ok) {
        return { resposta, urlPublica: new URL(urlAws) };
      }
      if (resposta.status >= 500 && (rota === urlAws || rota === rotas[0])) {
        statusServidor = resposta.status;
      }
    } catch (erro) {
      ultimoErro = erro;
    }
  }

  if (statusServidor) {
    throw new Error(`A API do RiftStream está indisponível (HTTP ${statusServidor}). Tente novamente em instantes.`);
  }
  throw ultimoErro || new Error("Falha ao comunicar com os servidores do RiftStream.");
}

async function buscarJsonApi(caminhoApi, sinalAborto, timeoutMs = 9500) {
  const { resposta } = await buscarRespostaApi(caminhoApi, sinalAborto, timeoutMs);
  if (!resposta.ok) {
    throw new Error(`HTTP ${resposta.status} em ${caminhoApi}`);
  }
  return resposta.json();
}

async function buscarRespostaPerfil(loginApi, classeDesejada, sinalAborto) {
  const params = classeDesejada ? `?cls=${encodeURIComponent(classeDesejada)}` : "";
  const loginCodificado = encodeURIComponent(loginApi);
  return buscarRespostaApi(`/api/profile/${loginCodificado}${params}`, sinalAborto);
}

/* ==========================================================================
   Fórmulas de FC, Atributos e Combate (Fiel ao RiftStream)
   ========================================================================== */

function calcularFc(classe, stats) {
  const dados = dadosClasses[classe] || dadosClasses.cleric;
  const dps =
    stats.atk *
    stats.aspd *
    (1 + (stats.crit / 100) * (0.5 + (stats.critDmg || 0)));
  const ehp = stats.maxHp * (1 + stats.def * 0.04);
  return Math.round(dados.k * Math.sqrt(Math.max(0, dps * ehp)));
}

function agregarItens(listaItens) {
  const fixos = { atk: 0, def: 0, hp: 0, crit: 0, spd: 0 };
  const gemasFixas = { atk: 0, def: 0, hp: 0, crit: 0, spd: 0 };
  const gemasPercent = { atk: 0, def: 0, hp: 0, crit: 0, spd: 0 };
  const contagemConjuntos = {};

  for (const item of listaItens || []) {
    if (!item || item.slot === "cosmetic") continue;
    for (const k of ["atk", "def", "hp", "crit", "spd"]) {
      fixos[k] += item[k] || 0;
    }
    if (item.set) {
      contagemConjuntos[item.set] = (contagemConjuntos[item.set] || 0) + 1;
    }
    for (const gema of item.gems || []) {
      if (!gema) continue;
      for (const [chaveStat, chaveValor, chavePct] of [
        ["stat", "value", "pct"],
        ["stat2", "value2", "pct2"],
      ]) {
        const stat = gema[chaveStat];
        const val = gema[chaveValor] || 0;
        if (stat) {
          if (gema[chavePct]) {
            gemasPercent[stat] += val;
          } else {
            gemasFixas[stat] += val;
          }
        }
      }
    }
  }

  const multConjuntos = { atk: 1.0, def: 1.0, hp: 1.0, spd: 1.0 };
  let critConjunto = 0;

  for (const [chaveSet, contagem] of Object.entries(contagemConjuntos)) {
    const config = catalogoConjuntos[chaveSet];
    if (!config) continue;
    if (contagem >= 2) {
      for (const k of ["atk", "def", "hp", "spd"]) {
        multConjuntos[k] *= 1 + (config.b2[k] || 0);
      }
      critConjunto += config.b2.crit || 0;
    }
    if (contagem >= 3) {
      for (const k of ["atk", "def", "hp", "spd"]) {
        multConjuntos[k] *= 1 + (config.b3[k] || 0);
      }
      critConjunto += config.b3.crit || 0;
    }
  }

  return {
    fixos,
    gemasFixas,
    gemasPercent,
    multConjuntos,
    critConjunto,
    contagemConjuntos,
  };
}

function inferirAtributosBase(perfil) {
  const classe = perfil.cls;
  const dados = dadosClasses[classe] || dadosClasses.cleric;
  const nivel = perfil.level;
  const r = Math.max(0, nivel - 1);
  const st = perfil.stats;
  const { fixos, gemasFixas, gemasPercent, multConjuntos, critConjunto } =
    agregarItens(perfil.equipped);

  function resolverQuad(base, ganho, mult, alvo) {
    const a = 0.015 * ganho;
    const b = ganho + 0.015 * base;
    const c = base - alvo / Math.max(0.0001, mult);
    const disc = Math.max(0, b * b - 4 * a * c);
    const x = (-b + Math.sqrt(disc)) / (2 * a);
    return Math.max(0, Math.round(x));
  }

  const str = resolverQuad(
    dados.base.atk + dados.growth.atk * r + fixos.atk + gemasFixas.atk,
    1.5,
    multConjuntos.atk * (1 + gemasPercent.atk / 1000.0),
    st.atk
  );

  const vit = resolverQuad(
    dados.base.hp + dados.growth.hp * r + fixos.hp + gemasFixas.hp,
    10.0,
    multConjuntos.hp * (1 + gemasPercent.hp / 1000.0),
    st.maxHp
  );

  const def = resolverQuad(
    dados.base.def + dados.growth.def * r + fixos.def + gemasFixas.def,
    0.8,
    multConjuntos.def * (1 + gemasPercent.def / 1000.0),
    st.def
  );

  const spdMult =
    (1 + (fixos.spd + gemasFixas.spd) / 100.0) * multConjuntos.spd;
  const agi = Math.max(
    0,
    Math.round(((st.aspd / (dados.base.aspd * spdMult)) - 1.0) / 0.02)
  );

  const critTotal = st.crit + (st.critDmg || 0) / 0.03;
  const luk = Math.max(
    0,
    Math.round((critTotal - 5.0 - fixos.crit - gemasFixas.crit - critConjunto) / 0.4)
  );

  return { str, vit, def, agi, luk };
}

function calcularStatusSimulados(classe, nivel, atributos, listaItens) {
  const dados = dadosClasses[classe] || dadosClasses.cleric;
  const r = Math.max(0, nivel - 1);
  const { fixos, gemasFixas, gemasPercent, multConjuntos, critConjunto } =
    agregarItens(listaItens);

  const atk =
    Math.round(
      (dados.base.atk +
        dados.growth.atk * r +
        atributos.str * 1.5 +
        fixos.atk +
        gemasFixas.atk) *
        (1 + atributos.str * 0.015) *
        multConjuntos.atk *
        (1 + gemasPercent.atk / 1000.0) *
        10
    ) / 10;

  const maxHp = Math.round(
    (dados.base.hp +
      dados.growth.hp * r +
      atributos.vit * 10.0 +
      fixos.hp +
      gemasFixas.hp) *
      (1 + atributos.vit * 0.015) *
      multConjuntos.hp *
      (1 + gemasPercent.hp / 1000.0)
  );

  const def =
    Math.round(
      (dados.base.def +
        dados.growth.def * r +
        atributos.def * 0.8 +
        fixos.def +
        gemasFixas.def) *
        (1 + atributos.def * 0.015) *
        multConjuntos.def *
        (1 + gemasPercent.def / 1000.0) *
        10
    ) / 10;

  const aspd =
    Math.round(
      dados.base.aspd *
        (1 + atributos.agi * 0.02) *
        (1 + (fixos.spd + gemasFixas.spd) / 100.0) *
        multConjuntos.spd *
        100
    ) / 100;

  const critBruto =
    5.0 +
    atributos.luk * 0.4 +
    fixos.crit +
    gemasFixas.crit +
    critConjunto;
  const crit = Math.min(60.0, Math.round(critBruto * 10) / 10);
  const critDmg = Math.round(Math.max(0, critBruto - 60.0) * 0.03 * 1000) / 1000;

  return { atk, maxHp, def, aspd, crit, critDmg };
}

function calcularMetricasCombate(classe, nivel, status, listaItens) {
  const itens = listaItens || [];
  const arma = itens.find((i) => i.slot === "weapon");
  const anel = itens.find((i) => i.slot === "ring");
  const infoClasse = dadosClasses[classe] || dadosClasses.warrior;
  const infoArma = (arma?.kind && catalogoArmas[arma.kind]) || null;
  const anelAtivo = anel && (anel.rarity ?? 0) >= 6 ? catalogoAneis[anel.look] || null : null;

  const capAspd = 4.6;
  const speedBonus = status.aspd > capAspd ? status.aspd / capAspd : 1.0;
  const multBasico = infoArma?.basicMult || 1.0;
  const cdBasicoMult = infoArma?.cdBasicMult || 1.0;
  const cadenciaReal = Math.min(status.aspd, capAspd) / cdBasicoMult;

  const taxaCrit = Math.min(1, Math.max(0, (status.crit || 0) / 100));
  const multCrit = 1.75 + (status.critDmg || 0);
  const fatorCritEsperado = (1 - taxaCrit) + taxaCrit * multCrit;

  const golpeNormalBruto = status.atk * speedBonus * multBasico;
  const golpeCritBruto = golpeNormalBruto * multCrit;
  const golpeMedioBruto = golpeNormalBruto * fatorCritEsperado;

  const cdSkillReal = infoClasse.cdBaseSkill * 1.5 * (infoArma?.cdMult || 1.0);
  const skillAlvos = infoArma?.skillAlvos || (classe === "archer" ? 3 : 1);
  const skillMult = infoArma?.skillMult ?? infoClasse.multBaseSkill;
  const skillFatorCrit = infoArma?.skillSemCrit ? 1.0 : fatorCritEsperado;

  let skillDanoPorAlvo = 0;
  let skillDanoTotal = 0;
  if (classe !== "cleric" || infoArma?.skillTipo === "dano" || infoArma?.skillTipo === "misto") {
    skillDanoPorAlvo = status.atk * speedBonus * skillMult * skillFatorCrit;
    skillDanoTotal = skillDanoPorAlvo * skillAlvos;
  }

  const healPower = (status.atk * 2.4 + (nivel || 1) * 1.5 + 6) * speedBonus;
  const curaSkillLuzDivina = classe === "cleric"
    ? healPower * (infoArma?.curaMult ?? 0.85)
    : 0;
  const escudoAurora = infoArma?.escudoMult ? healPower * infoArma.escudoMult : 0;

  let dpsBasico = golpeMedioBruto * cadenciaReal;
  const dpsSkill = cdSkillReal > 0 ? skillDanoTotal / cdSkillReal : 0;

  // Bônus médios de uptime/anel no DPS
  let fatorAnelDps = 1.0;
  if (anelAtivo && anel.look === 14) {
    // Eclipse Arcano: +20% echo no alvo principal (e +60% em até 2 alvos extras em mob)
    fatorAnelDps = 1.2;
  }

  let analiseEfeitoArma = null;
  let dpsEfeitoBugado = 0;
  let dpsEfeitoCorrigido = 0;

  if (infoArma?.efeito) {
    const ef = infoArma.efeito;
    if (ef.tipo === "buff_atk") {
      // Ceifa-Reis: uptime 4/12 com +60% ATK
      dpsBasico *= 1 + (ef.dur / ef.cada) * (ef.atkMult - 1);
    } else if (ef.tipo === "buff_aspd") {
      // Tempestade Escarlate: dobra cadência por 4s a cada 12s
      dpsBasico *= 1 + ef.dur / ef.cada;
    } else if (ef.tipo === "buff_crit") {
      // Predador Carmesim: 100% crit por 3.5s a cada 9s
      const fatorUptime = ef.dur / ef.cada;
      const fatorCritMedioEfetivo = (1 - fatorUptime) * fatorCritEsperado + fatorUptime * multCrit;
      dpsBasico = golpeNormalBruto * fatorCritMedioEfetivo * cadenciaReal;
    } else if (ef.tipo === "dano" || ef.tipo === "dano_carta") {
      const pesoCarta = ef.tipo === "dano_carta" ? 1 / 3 : 1;
      const danoBugado = status.atk * ef.mult;
      const danoCorrigido = status.atk * speedBonus * ef.mult * fatorCritEsperado;
      dpsEfeitoBugado = (danoBugado / ef.cada) * pesoCarta;
      dpsEfeitoCorrigido = (danoCorrigido / ef.cada) * pesoCarta;
      analiseEfeitoArma = {
        bugado: true,
        nome: infoArma.nome,
        cada: ef.cada,
        mult: ef.mult,
        danoAtualSemDefesa: danoBugado,
        danoCorrigidoSemDefesa: danoCorrigido,
        razaoPerda: danoBugado > 0 ? danoCorrigido / danoBugado : 1,
        texto: ef.texto,
      };
    } else if (ef.tipo === "singularity") {
      const multAnelBoss = anelAtivo && anel.look === 14 ? 1.6 : (anelAtivo && anel.look === 12 ? 1.6 : 1.0);
      analiseEfeitoArma = {
        bugado: false,
        nome: infoArma.nome,
        cada: ef.cada,
        texto: ef.texto,
        pctBossEfetivo: ef.pctBoss * multAnelBoss,
      };
    }
  }

  const dpsCombateMedio = dpsBasico * fatorAnelDps + (skillDanoPorAlvo / cdSkillReal) + dpsEfeitoBugado;
  const reducaoDefesa = (status.def * 4) / (100 + status.def * 4);
  const ehp = status.maxHp * (1 + status.def * 0.04);

  const revives = [];
  if (arma?.kind === "emberblade") revives.push("Arma Brasa Eterna (60% HP + 30% escudo)");
  if (arma?.kind === "ankh") revives.push("Cetro da Vida (skill revive 55% HP)");
  if (arma?.kind === "worldstaff") revives.push("Árvore-Mundo (revive 50% a cada 15s)");
  if (anelAtivo && anel.look === 13) revives.push("Anel Fênix Rubra (40% HP + 20% escudo)");
  if (anelAtivo && anel.look === 15) revives.push("Anel Coração do Vazio (70% HP + 40% escudo)");

  return {
    arma,
    infoArma,
    anel,
    anelAtivo,
    speedBonus,
    cadenciaReal,
    fatorCritEsperado,
    multCrit,
    golpeNormalBruto,
    golpeCritBruto,
    golpeMedioBruto,
    dpsBasico: dpsBasico * fatorAnelDps,
    dpsSkill,
    dpsCombateMedio,
    dpsEfeitoBugado,
    dpsEfeitoCorrigido,
    cdSkillReal,
    skillMult,
    skillAlvos,
    skillDanoPorAlvo,
    skillDanoTotal,
    healPower,
    curaSkillLuzDivina,
    escudoAurora,
    reducaoDefesa,
    ehp,
    revives,
    analiseEfeitoArma,
  };
}

function formatarNumeroCompacto(valor) {
  const n = Number(valor) || 0;
  if (n >= 1e9) return `${(n / 1e9).toFixed(2).replace(".", ",")}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2).replace(".", ",")}M`;
  if (n >= 1e4) return `${(n / 1e3).toFixed(1).replace(".", ",")}K`;
  return formatadorInteiro.format(Math.round(n));
}

function formatarDuracaoSegundos(seg) {
  const s = Math.max(0, Math.round(Number(seg) || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h >= 24) {
    const d = Math.floor(h / 24);
    const rh = h % 24;
    return `${d}d ${rh}h`;
  }
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
}

function formatarGemaTexto(gema) {
  const partes = [];
  if (gema.stat && gema.value) {
    const sufixo = gema.pct ? "%" : "";
    const valor = gema.pct ? (gema.value / 10).toFixed(1) : gema.value;
    partes.push(`+${valor}${sufixo} ${rotulosStats[gema.stat] || gema.stat.toUpperCase()}`);
  }
  if (gema.stat2 && gema.value2) {
    const sufixo = gema.pct2 ? "%" : "";
    const valor = gema.pct2 ? (gema.value2 / 10).toFixed(1) : gema.value2;
    partes.push(`+${valor}${sufixo} ${rotulosStats[gema.stat2] || gema.stat2.toUpperCase()}`);
  }
  return partes.join(" · ") || "Atributo";
}

/* ==========================================================================
   Panorama Global + Lives Online (Topo e Dropdowns)
   ========================================================================== */

let ultimosDadosPanorama = null;

function renderizarGradePanorama() {
  if (!gradeRecordesGlobais || !ultimosDadosPanorama) return;
  const { records, changelog, livesOnline } = ultimosDadosPanorama;
  const melhorLive = livesOnline[0];
  const ultimoPatch = changelog?.entries?.[0];
  const dataPatch = ultimoPatch?.id || changelog?.latest || "—";

  gradeRecordesGlobais.innerHTML = `
    <div class="tile-panorama">
      <span>Jogadores Online</span>
      <strong>${formatadorInteiro.format(records.playersNow || 0)}</strong>
      <small>${formatadorInteiro.format(records.totalPlayers || 0)} registrados · ${livesOnline.length} lives</small>
    </div>
    <div class="tile-panorama">
      <span>Melhor Zona-Onda</span>
      <strong>Z${records.bestRun?.zone ?? "?"}-W${records.bestRun?.wave ?? "?"}</strong>
      <small>${escaparHtml(records.bestRun?.channel || "—")}</small>
    </div>
    <div class="tile-panorama">
      <span>Maior Live Agora</span>
      <strong>${melhorLive ? formatadorInteiro.format(melhorLive.playersNow || 0) : formatadorInteiro.format(records.peakPlayers?.players || 0)}</strong>
      <small>${melhorLive ? `${escaparHtml(melhorLive.name)} (Z${melhorLive.bestZone}-W${melhorLive.bestWave})` : `Pico: ${escaparHtml(records.peakPlayers?.channel || "—")}`}</small>
    </div>
    <div class="tile-panorama" style="border-color: rgba(240, 180, 41, 0.45);">
      <span style="color:var(--gold);">⚡ Top 1 FC Geral</span>
      <strong style="color:var(--gold);">${formatarNumeroCompacto(top1GeralDinamico.power)} FC</strong>
      <small>${escaparHtml(top1GeralDinamico.rotulo)} (${nomesClasses[top1GeralDinamico.cls] || top1GeralDinamico.cls} Nv. ${top1GeralDinamico.level || "—"})</small>
    </div>
    <div class="tile-panorama">
      <span>⭐ Maior Nível</span>
      <strong>Nv. ${formatadorInteiro.format(records.topCharacter?.level || topLevelDinamico.level)}</strong>
      <small>${escaparHtml(records.topCharacter?.name || topLevelDinamico.rotulo)} (${nomesClasses[records.topCharacter?.cls] || records.topCharacter?.cls || "—"})</small>
    </div>
    <div class="tile-panorama">
      <span>Ouro no Jogo</span>
      <strong>${formatarNumeroCompacto(records.totalGoldInGame || 0)}</strong>
      <small>${formatadorInteiro.format(records.totalChannels || 0)} canais totais</small>
    </div>
    <div class="tile-panorama">
      <span>Último Patch</span>
      <strong>${escaparHtml(dataPatch)}</strong>
      <small title="${escaparHtml(ultimoPatch?.title || "")}">${escaparHtml(ultimoPatch?.title || "Atualizado")}</small>
    </div>
  `;
}

async function carregarPanoramaGlobal() {
  if (!gradeRecordesGlobais) return;
  if (panoramaAtualizacao) panoramaAtualizacao.textContent = "Sincronizando dados globais…";

  try {
    const [records, changelog, runs] = await Promise.all([
      buscarJsonApi("/api/ranking/records").catch(() => null),
      buscarJsonApi("/api/changelog").catch(() => null),
      buscarJsonApi("/api/ranking/runs?page=1&size=50&online=true").catch(() => null),
    ]);

    const livesOnline = Array.isArray(runs?.items) ? [...runs.items] : [];
    livesOnline.sort((a, b) => (b.playersNow || 0) - (a.playersNow || 0));
    preencherSelectsLivesOnline(livesOnline);

    if (records) {
      ultimosDadosPanorama = { records, changelog, livesOnline };
      renderizarGradePanorama();

      if (panoramaAtualizacao) {
        const agora = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
        panoramaAtualizacao.textContent = `Atualizado às ${agora}`;
      }
    }

    // Buscar Top 1 atual de cada classe em paralelo (sem bloquear UI)
    void atualizarTop1Dinamicos();
  } catch {
    if (panoramaAtualizacao) panoramaAtualizacao.textContent = "Panorama parcial (API oscilando)";
  }
}

function sincronizarTextosTopsUI() {
  if (topPillValTop1) topPillValTop1.textContent = `${top1GeralDinamico.rotulo} (${formatarNumeroCompacto(top1GeralDinamico.power)} FC)`;
  if (topPillValWarrior) topPillValWarrior.textContent = `${top1DinamicoPorClasse.warrior.rotulo} (${formatarNumeroCompacto(top1DinamicoPorClasse.warrior.power)} FC)`;
  if (topPillValCleric) topPillValCleric.textContent = `${top1DinamicoPorClasse.cleric.rotulo} (${formatarNumeroCompacto(top1DinamicoPorClasse.cleric.power)} FC)`;
  if (topPillValArcher) topPillValArcher.textContent = `${top1DinamicoPorClasse.archer.rotulo} (${formatarNumeroCompacto(top1DinamicoPorClasse.archer.power)} FC)`;
  if (topPillValLevel) topPillValLevel.textContent = `${topLevelDinamico.rotulo} (Nv. ${topLevelDinamico.level})`;

  if (btnCarregarExemplo) {
    btnCarregarExemplo.textContent = `👑 Carregar Top 1 Geral (${top1GeralDinamico.rotulo})`;
  }
  const btnAtalhoWarrior = document.querySelector('[data-top-atalho="warrior"]');
  if (btnAtalhoWarrior) btnAtalhoWarrior.textContent = `🛡️ Top Guerreiro (${top1DinamicoPorClasse.warrior.rotulo})`;
  const btnAtalhoCleric = document.querySelector('[data-top-atalho="cleric"]');
  if (btnAtalhoCleric) btnAtalhoCleric.textContent = `✨ Top Clérigo (${top1DinamicoPorClasse.cleric.rotulo})`;
  const btnAtalhoArcher = document.querySelector('[data-top-atalho="archer"]');
  if (btnAtalhoArcher) btnAtalhoArcher.textContent = `🏹 Top Arqueiro (${top1DinamicoPorClasse.archer.rotulo})`;
  const btnAtalhoLevel = document.querySelector('[data-top-atalho="level"]');
  if (btnAtalhoLevel) btnAtalhoLevel.textContent = `⭐ Maior Nível (${topLevelDinamico.rotulo} · Nv. ${topLevelDinamico.level})`;

  if (inputNick && !inputNick.value) {
    inputNick.placeholder = `Ex. ${top1GeralDinamico.nick}`;
  }
  if (inputCompararNick && !inputCompararNick.value) {
    inputCompararNick.placeholder = `Ex. ${top1GeralDinamico.nick}`;
  }
}

async function atualizarTop1Dinamicos() {
  sincronizarTextosTopsUI();

  // Atualização progressiva: cada chamada atualiza a UI imediatamente assim que responde
  const promessas = [
    ...["warrior", "cleric", "archer"].map(async (cls) => {
      try {
        const res = await buscarJsonApi(`/api/ranking/characters?page=1&size=1&cls=${cls}`, undefined, 5000);
        const top = res?.items?.[0];
        if (top?.login) {
          const ehKick = /^kick:/i.test(top.login);
          top1DinamicoPorClasse[cls] = {
            nick: top.login.replace(/^kick:/i, ""),
            plataforma: ehKick ? "kick" : "twitch",
            rotulo: top.name || top.login,
            power: top.power || 0,
            level: top.level || 0,
            cls,
          };
          sincronizarTextosTopsUI();
          if (cls === top1GeralDinamico.cls && top.power > top1GeralDinamico.power) {
            top1GeralDinamico = { ...top1DinamicoPorClasse[cls] };
            sincronizarTextosTopsUI();
            renderizarGradePanorama();
          }
        }
      } catch {
        // Mantém fallback
      }
    }),
    (async () => {
      try {
        const res = await buscarJsonApi("/api/ranking/characters?page=1&size=1&sort=level", undefined, 5000);
        const top = res?.items?.[0];
        if (top?.login) {
          const ehKick = /^kick:/i.test(top.login);
          topLevelDinamico = {
            nick: top.login.replace(/^kick:/i, ""),
            plataforma: ehKick ? "kick" : "twitch",
            rotulo: top.name || top.login,
            level: top.level || 0,
            cls: top.cls || "warrior",
          };
          sincronizarTextosTopsUI();
          renderizarGradePanorama();
        }
      } catch {
        // Mantém fallback
      }
    })(),
    (async () => {
      try {
        const res = await buscarJsonApi("/api/ranking/characters?page=1&size=1", undefined, 5000);
        const top = res?.items?.[0];
        if (top?.login) {
          const ehKick = /^kick:/i.test(top.login);
          top1GeralDinamico = {
            nick: top.login.replace(/^kick:/i, ""),
            plataforma: ehKick ? "kick" : "twitch",
            rotulo: top.name || top.login,
            power: top.power || 0,
            level: top.level || 0,
            cls: top.cls || "warrior",
          };
          sincronizarTextosTopsUI();
          renderizarGradePanorama();
        }
      } catch {
        // Mantém fallback
      }
    })(),
  ];

  await Promise.all(promessas);

  // Garante que o de maior FC entre as classes seja o geral
  const listaTops = Object.values(top1DinamicoPorClasse);
  listaTops.sort((a, b) => (b.power || 0) - (a.power || 0));
  if (listaTops[0]?.power && listaTops[0].power > (top1GeralDinamico.power || 0)) {
    top1GeralDinamico = { ...listaTops[0] };
  }

  sincronizarTextosTopsUI();
  renderizarGradePanorama();

  if (perfilCarregadoP1) {
    atualizarCardP1Comparacao(perfilCarregadoP1, plataformaCarregadaP1);
  }
}

function preencherSelectsLivesOnline(lives) {
  const selects = [selectRadarLives, selectMonstroLiveSync].filter(Boolean);
  for (const sel of selects) {
    const valorAtual = sel.value;
    const textoPadrao = sel === selectMonstroLiveSync
      ? "Selecionar live online para sincronizar…"
      : lives.length > 0
        ? `Escolha uma live online (${lives.length} abertas)…`
        : "Nenhuma live online encontrada agora";
    const opts = [new Option(textoPadrao, "")];
    for (const live of lives) {
      const label = `${live.name} · ${live.playersNow || 0} jogs · Rec. Z${live.bestZone}-W${live.bestWave}`;
      opts.push(new Option(label, live.login));
    }
    sel.replaceChildren(...opts);
    if (valorAtual && lives.some((l) => l.login === valorAtual)) {
      sel.value = valorAtual;
    }
  }
}

/* ==========================================================================
   Aba 1: Matriz de Gelo (Pity) e Fogo + Eventos & Conquistas
   ========================================================================== */

function renderizarMatrizGeloEFogo(perfil) {
  if (!containerMatrizGeloFogo) return;
  const counters = perfil.counters || {};
  const oportunidadesGelo = [];

  const linhasHtml = chavesRaridadePity.map(({ raridade, rotulo, chanceBase }) => {
    const celulas = indicesPecaPity.map(({ idx, rotulo: rotuloPeca }) => {
      const geloBruto = Number(counters[`fz_f_${raridade}_${idx}`] || 0);
      const fogoBruto = Number(counters[`fz_w_${raridade}_${idx}`] || 0);
      const geloNivel = Math.min(5, geloBruto);
      const bonusGelo = geloNivel * 2;
      const chanceEfetiva = chanceBase + bonusGelo;

      if (geloBruto > 0) {
        oportunidadesGelo.push({
          rotuloRaridade: rotulo,
          rotuloPeca,
          geloNivel,
          geloBruto,
          chanceEfetiva,
        });
      }

      const pipsGelo = Array.from({ length: 5 }, (_, i) =>
        `<i class="${i < geloNivel ? "on-ice" : ""}"></i>`
      ).join("");

      let conteudo;
      if (geloBruto > 0) {
        conteudo = `
          <div class="celula-gelo">
            <span class="badge-gelo ${geloNivel >= 5 ? "alto" : ""}">❄️ Gelo Nv.${geloNivel} (${geloBruto}x)</span>
            <div class="pips-gelo" aria-hidden="true">${pipsGelo}</div>
            <span class="chance-efetiva">+${bonusGelo}% → ${chanceEfetiva}%</span>
          </div>
        `;
      } else if (fogoBruto > 0) {
        const pipsFogo = Array.from({ length: 5 }, (_, i) =>
          `<i class="${i < Math.min(5, fogoBruto) ? "on-fire" : ""}"></i>`
        ).join("");
        conteudo = `
          <div class="celula-gelo">
            <span class="badge-fogo">🔥 Fogo ${fogoBruto}x</span>
            <div class="pips-gelo" aria-hidden="true">${pipsFogo}</div>
            <span class="small muted">${chanceBase}% base</span>
          </div>
        `;
      } else {
        conteudo = `
          <div class="celula-gelo">
            <span class="muted small">Neutro (${chanceBase}%)</span>
            <div class="pips-gelo" aria-hidden="true">${pipsGelo}</div>
          </div>
        `;
      }
      return `<td>${conteudo}</td>`;
    }).join("");

    return `
      <tr>
        <th scope="row">${rotulo} (${chanceBase}%)</th>
        ${celulas}
      </tr>
    `;
  }).join("");

  oportunidadesGelo.sort((a, b) => b.geloNivel - a.geloNivel || b.geloBruto - a.geloBruto);
  const resumoOportunidadesHtml = oportunidadesGelo.length
    ? `
      <div class="barra-atalhos">
        <span class="rotulo-atalho">❄️ Melhores Chances Acumuladas:</span>
        ${oportunidadesGelo.map((op) => `
          <span class="badge-gelo ${op.geloNivel >= 5 ? "alto" : ""}">
            ${op.rotuloRaridade} · <strong>${op.rotuloPeca}</strong>: Nv.${op.geloNivel} (${op.chanceEfetiva}% chance)
          </span>
        `).join("")}
      </div>
    `
    : "";

  containerMatrizGeloFogo.innerHTML = `
    <h3 class="titulo-secao-comp">Matriz de Gelo (Pity) e Fogo Atual por Peça</h3>
    ${resumoOportunidadesHtml}
    <div class="table-wrap">
      <table class="tabela-gelo">
        <thead>
          <tr>
            <th scope="col">Raridade Alvo</th>
            ${indicesPecaPity.map((p) => `<th scope="col">${p.rotulo}</th>`).join("")}
          </tr>
        </thead>
        <tbody>${linhasHtml}</tbody>
      </table>
    </div>
    <p class="note-compacto">Cada falha seguida no mesmo tipo de peça e raridade soma <strong>+2% de chance</strong> (máximo de +10% no Gelo Nv.5). O Fogo apenas indica sequência de sucessos e não altera a chance.</p>
  `;
}

function renderizarEventosEConquistas(perfil) {
  if (!containerEventosConquistas) return;
  const c = perfil.counters || {};
  const canais = Array.isArray(perfil.channels) ? perfil.channels : [];
  const achPts = perfil.achievementPoints || 0;
  const achDone = perfil.achievementsUnlocked || 0;
  const achTot = perfil.achievementsTotal || 0;

  const canaisHtml = canais.slice(0, 6).map((ch) => `
    <div class="card-info-linha">
      <span>${escaparHtml(ch.displayName || ch.login)}</span>
      <strong>${formatadorInteiro.format(ch.waves || 0)} ondas · ${formatarDuracaoSegundos(ch.seconds || 0)}</strong>
    </div>
  `).join("");

  const avisoVip = perfil.vip === false
    ? `<div class="card-info-linha"><span>Baú & VIP</span><strong>Free (${perfil.vip ? "VIP" : "sem passe VIP"})</strong></div>`
    : `<div class="card-info-linha"><span>Status VIP</span><strong style="color:var(--gold);">Ativo (skip de forja liberado)</strong></div>`;

  containerEventosConquistas.innerHTML = `
    <h3 class="titulo-secao-comp">Jornada, Eventos & Canais Frequentados</h3>
    <div class="grade-cards-info">
      <article class="card-info">
        <h4>Progresso Geral</h4>
        <div class="card-info-linha"><span>Melhor Onda Pessoal</span><strong>Onda ${formatadorInteiro.format(c.best_wave || 0)}</strong></div>
        <div class="card-info-linha"><span>Chefes Abatidos</span><strong>${formatadorInteiro.format(c.boss_kills || 0)}</strong></div>
        <div class="card-info-linha"><span>Monstros Abatidos</span><strong>${formatadorInteiro.format(c.kills || 0)}</strong></div>
        <div class="card-info-linha"><span>Tempo em Live</span><strong>${formatarDuracaoSegundos(perfil.totalSeconds || 0)}</strong></div>
        ${avisoVip}
      </article>
      <article class="card-info">
        <h4>Eventos & Conquistas</h4>
        <div class="card-info-linha"><span>Conquistas</span><strong>${achDone}/${achTot} (${formatadorInteiro.format(achPts)} pts)</strong></div>
        <div class="card-info-linha"><span>Meteoro Dourado</span><strong>${c.ev_goldmeteor_cleared || 0} vitórias · ${c.ev_goldmeteor_items || 0} itens</strong></div>
        <div class="card-info-linha"><span>Evento Natal</span><strong>${c.ev_christmas_cleared || 0} vitórias · ${c.ev_christmas_items || 0} itens</strong></div>
        <div class="card-info-linha"><span>Halloween</span><strong>${c.ev_halloween_cleared || 0} vitórias · ${c.ev_halloween_items || 0} itens</strong></div>
        <div class="card-info-linha"><span>Itens Lendários / Épicos</span><strong>${formatadorInteiro.format(c.legendary || 0)} / ${formatadorInteiro.format(c.epic || 0)}</strong></div>
      </article>
      <article class="card-info">
        <h4>Canais Mais Jogados</h4>
        ${canaisHtml || '<span class="muted small">Nenhum histórico público de canais.</span>'}
      </article>
    </div>
  `;
}

/* ==========================================================================
   Aba 2: Análise Real de Dano, Cura & Sobrevivência + Equipamentos/FC
   ========================================================================== */

function renderizarAnaliseCombateJogador(perfil, status, metricas) {
  if (!containerAnaliseCombate) return;
  const classe = perfil.cls;
  const infoClasse = dadosClasses[classe] || dadosClasses.warrior;
  const nomeArma = metricas.arma?.name || metricas.infoArma?.nome || "Arma Básica";

  let cardArmaEspecial = "";
  if (metricas.analiseEfeitoArma?.bugado) {
    const b = metricas.analiseEfeitoArma;
    cardArmaEspecial = `
      <article class="card-combate destaque-arma">
        <div class="card-combate-titulo">Efeito da Arma (${escaparHtml(b.nome)})</div>
        <div class="metrica-principal">${formatarNumeroCompacto(b.danoAtualSemDefesa)} dano atual</div>
        <span class="badge-status-skill bug">⚠️ BUG NA FÓRMULA ATUAL (this.hit)</span>
        <div class="card-info-linha"><span>Com Crítico &amp; Veloc. (pós-correção)</span><strong style="color:var(--green);">${formatarNumeroCompacto(b.danoCorrigidoSemDefesa)} (${b.razaoPerda.toFixed(1)}× mais)</strong></div>
        <div class="card-info-linha"><span>Ciclo / Multiplicador</span><strong>A cada ${b.cada}s · ${b.mult}× ATK</strong></div>
        <p class="note-compacto">Hoje o jogo aplica apenas <code>atk × ${b.mult}</code> sem crítico e sem bônus de velocidade &gt;4,6. Os números desta análise refletem o comportamento atual em produção.</p>
      </article>
    `;
  } else if (metricas.analiseEfeitoArma && !metricas.analiseEfeitoArma.bugado) {
    const s = metricas.analiseEfeitoArma;
    cardArmaEspecial = `
      <article class="card-combate destaque-arma">
        <div class="card-combate-titulo">Efeito da Arma (${escaparHtml(s.nome)})</div>
        <div class="metrica-principal">${(s.pctBossEfetivo * 100).toFixed(1).replace(".", ",")}% HP do Chefe</div>
        <span class="badge-status-skill ok">✓ DANO VERDADEIRO (% HP)</span>
        <div class="card-info-linha"><span>Em Monstros Normais</span><strong>25% do HP máx. (ignora DEF)</strong></div>
        <div class="card-info-linha"><span>Ativação</span><strong>A cada ${s.cada}s (+1,4s atraso)</strong></div>
        <p class="note-compacto">${escaparHtml(s.texto)}</p>
      </article>
    `;
  } else if (metricas.infoArma?.efeito) {
    cardArmaEspecial = `
      <article class="card-combate destaque-arma">
        <div class="card-combate-titulo">Passiva da Arma (${escaparHtml(metricas.infoArma.nome)})</div>
        <div class="metrica-principal">Ativa em Combate</div>
        <span class="badge-status-skill ok">✓ EFEITO FUNCIONAL</span>
        <p class="note-compacto">${escaparHtml(metricas.infoArma.efeito.texto)}</p>
      </article>
    `;
  } else {
    cardArmaEspecial = `
      <article class="card-combate destaque-arma">
        <div class="card-combate-titulo">Skill da Classe (${escaparHtml(infoClasse.nomeSkill)})</div>
        <div class="metrica-principal">${classe === "cleric" ? `${formatarNumeroCompacto(metricas.curaSkillLuzDivina)} cura` : `${formatarNumeroCompacto(metricas.skillDanoPorAlvo)} / alvo`}</div>
        <div class="card-info-linha"><span>Recarga Efetiva</span><strong>${metricas.cdSkillReal.toFixed(1).replace(".", ",")}s</strong></div>
        <div class="card-info-linha"><span>Alvos / Multiplicador</span><strong>${metricas.skillAlvos} alvo(s) · ${metricas.skillMult.toFixed(2).replace(".", ",")}×</strong></div>
        <p class="note-compacto">${escaparHtml(metricas.infoArma?.notaSkill || "Equipar arma Imortal/Arcana adiciona passiva exclusiva.")}</p>
      </article>
    `;
  }

  const cardCuraOuSkill = classe === "cleric"
    ? `
      <article class="card-combate destaque-cura">
        <div class="card-combate-titulo">Cura &amp; Suporte (Clérigo)</div>
        <div class="metrica-principal">${formatarNumeroCompacto(metricas.healPower)} / pulso</div>
        <div class="card-info-linha"><span>Luz Divina (Skill)</span><strong>${formatarNumeroCompacto(metricas.curaSkillLuzDivina)}</strong></div>
        ${metricas.escudoAurora > 0 ? `<div class="card-info-linha"><span>Escudo Cetro da Aurora</span><strong>${formatarNumeroCompacto(metricas.escudoAurora)}</strong></div>` : ""}
        <div class="card-info-linha"><span>Fator Velocidade (&gt;4,6)</span><strong>${metricas.speedBonus.toFixed(2).replace(".", ",")}×</strong></div>
        <p class="note-compacto">Nota do motor: cura usa <code>(atk×2,4 + Nv×1,5 + 6) × VelExcesso</code> e <strong>não critica</strong>.</p>
      </article>
    `
    : `
      <article class="card-combate destaque-cura">
        <div class="card-combate-titulo">Skill (${escaparHtml(infoClasse.nomeSkill)})</div>
        <div class="metrica-principal">${formatarNumeroCompacto(metricas.skillDanoPorAlvo)} / alvo</div>
        <div class="card-info-linha"><span>Dano Total na Rajada/Área</span><strong>${formatarNumeroCompacto(metricas.skillDanoTotal)} (${metricas.skillAlvos} alvos)</strong></div>
        <div class="card-info-linha"><span>Recarga Real</span><strong>${metricas.cdSkillReal.toFixed(1).replace(".", ",")}s</strong></div>
        <div class="card-info-linha"><span>Anel Especial</span><strong>${metricas.anelAtivo ? escaparHtml(metricas.anelAtivo.nome) : "Nenhum ativo"}</strong></div>
        <p class="note-compacto">${escaparHtml(metricas.infoArma?.notaSkill || infoClasse.nomeSkill)}</p>
      </article>
    `;

  containerAnaliseCombate.innerHTML = `
    <div class="barra-atalhos">
      <span class="rotulo-atalho">⚡ Ações Rápidas com esta Build:</span>
      <button type="button" class="btn-mini btn-atalho-ativo" data-ir-aba="simulador">🛠️ Abrir Build no Simulador de FC</button>
      <button type="button" class="btn-mini" data-ir-aba="monstros">🐉 Testar Dano contra Boss / Ondas</button>
      <button type="button" class="btn-mini" data-ir-aba="comparar">⚔️ Comparar com Outro Jogador</button>
    </div>
    <h3 class="titulo-secao-comp">Desempenho Real em Combate (${escaparHtml(nomeArma)})</h3>
    <div class="grade-combate">
      <article class="card-combate destaque-dps">
        <div class="card-combate-titulo">Dano &amp; DPS Real (Alvo 0 DEF)</div>
        <div class="metrica-principal">${formatarNumeroCompacto(metricas.dpsCombateMedio)} DPS</div>
        <div class="card-info-linha"><span>Golpe Normal Médio</span><strong>${formatarNumeroCompacto(metricas.golpeNormalBruto)}</strong></div>
        <div class="card-info-linha"><span>Golpe Crítico (${(metricas.multCrit * 100).toFixed(0)}%)</span><strong style="color:var(--gold);">${formatarNumeroCompacto(metricas.golpeCritBruto)}</strong></div>
        <div class="card-info-linha"><span>Cadência Real (Cap 4,6/s)</span><strong>${metricas.cadenciaReal.toFixed(2).replace(".", ",")}/s (${metricas.speedBonus.toFixed(2).replace(".", ",")}× dano)</strong></div>
      </article>
      ${cardCuraOuSkill}
      ${cardArmaEspecial}
      <article class="card-combate destaque-defesa">
        <div class="card-combate-titulo">Sobrevivência &amp; Defesa</div>
        <div class="metrica-principal">${(metricas.reducaoDefesa * 100).toFixed(1).replace(".", ",")}% Redução</div>
        <div class="card-info-linha"><span>Vida Efetiva (EHP)</span><strong>${formatarNumeroCompacto(metricas.ehp)}</strong></div>
        <div class="card-info-linha"><span>HP Máximo / DEF</span><strong>${formatarNumeroCompacto(status.maxHp)} / ${formatadorInteiro.format(Math.round(status.def))}</strong></div>
        <div class="card-info-linha"><span>Revives na Build</span><strong>${metricas.revives.length > 0 ? metricas.revives.length : "0"} (${metricas.revives.length > 0 ? escaparHtml(metricas.revives[0]) : "Nenhum"})</strong></div>
      </article>
    </div>
  `;

  containerAnaliseCombate.querySelectorAll("[data-ir-aba]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const abaDestino = btn.dataset.irAba;
      if (abaDestino === "simulador" && perfilCarregadoP1) {
        importarPerfilParaSimulador(perfilCarregadoP1);
        renderizarSimulador();
      } else if (abaDestino === "monstros") {
        if (selectMonstroOrigem) selectMonstroOrigem.value = "p1";
        renderizarSimuladorMonstros();
      }
      alternarVisibilidadeAba(abaDestino);
    });
  });
}

function renderizarEquipamentosEGemas(perfil) {
  const classe = perfil.cls;
  const nivel = perfil.level;
  const itensEquipados = perfil.equipped || [];
  const atributos = inferirAtributosBase(perfil);

  const statusAtuais = calcularStatusSimulados(classe, nivel, atributos, itensEquipados);
  const fcTotal = calcularFc(classe, statusAtuais);

  const statusSemItens = calcularStatusSimulados(classe, nivel, atributos, []);
  const fcSemItens = calcularFc(classe, statusSemItens);
  const ganhoTotalEquips = Math.max(0, fcTotal - fcSemItens);
  const pctGanhoTotal = fcSemItens > 0 ? ganhoTotalEquips / fcSemItens : 0;

  containerResumoFc.innerHTML = `
    <div class="bloco-resumo">
      <span>FORÇA TOTAL (FC)</span>
      <strong>${formatadorInteiro.format(fcTotal)}</strong>
      <small>Nível ${formatadorInteiro.format(nivel)} · ${nomesClasses[classe]}</small>
    </div>
    <div class="bloco-resumo">
      <span>GANHO POR EQUIPAMENTOS</span>
      <strong>+${formatadorInteiro.format(ganhoTotalEquips)}</strong>
      <small>+${formatadorPercentual.format(pctGanhoTotal)} de aumento</small>
    </div>
    <div class="bloco-resumo">
      <span>FC BASE (SEM ITENS)</span>
      <strong>${formatadorInteiro.format(fcSemItens)}</strong>
      <small>Atributos: F${atributos.str} V${atributos.vit} D${atributos.def} A${atributos.agi} S${atributos.luk}</small>
    </div>
  `;

  // Análise real de combate + link direto para PvE e Simulador
  const metricas = calcularMetricasCombate(classe, nivel, statusAtuais, itensEquipados);
  renderizarAnaliseCombateJogador(perfil, statusAtuais, metricas);

  // Conjuntos ativos
  const { contagemConjuntos } = agregarItens(itensEquipados);
  const cartoesConjuntos = [];
  for (const [chaveSet, contagem] of Object.entries(contagemConjuntos)) {
    const config = catalogoConjuntos[chaveSet];
    if (!config || contagem < 2) continue;
    const bonusDesc = [];
    if (contagem >= 2) bonusDesc.push(`2 peças ativas`);
    if (contagem >= 3) bonusDesc.push(`3 peças ativas (completo)`);
    cartoesConjuntos.push(`
      <div class="cartao-conjunto">
        <div>
          <b>${escaparHtml(config.nome)}</b> (${contagem}/3 peças)
          <div class="bonus-lista">${bonusDesc.join(" · ")}</div>
        </div>
        <span class="tag-fc">Conjunto Ativo</span>
      </div>
    `);
  }
  containerConjuntos.innerHTML = cartoesConjuntos.join("");

  if (containerAvisoSinergia) {
    containerAvisoSinergia.innerHTML = `
      <strong>Por que a conta fecha exatamente agora?</strong>
      <p>
        Os valores principais em dourado (<strong>+X FC</strong>) dividem com precisão absoluta os <strong>+${formatadorInteiro.format(ganhoTotalEquips)} FC</strong> ganhos com equipamentos (somando 100% da sua força de itens).
      </p>
      <p>
        Já a tag em vermelho <strong>"Se desequipar"</strong> mostra a perda marginal imediata: como o jogo calcula FC multiplicando <em>Ataque × Velocidade × Crítico × Vida × Defesa</em> e bônus de conjunto, remover uma única peça derruba a sinergia com o resto do set.
      </p>
    `;
  }

  const slotsOrdem = ["weapon", "helmet", "armor", "ring", "cosmetic"];
  const itensOrdenados = [...itensEquipados].sort((a, b) => {
    return slotsOrdem.indexOf(a.slot) - slotsOrdem.indexOf(b.slot);
  });

  const slotsDados = itensOrdenados.map((item) => {
    const itensSemEsteSlot = itensEquipados.filter((it) => it.id !== item.id);
    const fcSemEsteSlot = calcularFc(
      classe,
      calcularStatusSimulados(classe, nivel, atributos, itensSemEsteSlot)
    );
    const perdaMarginalSlot = Math.max(0, fcTotal - fcSemEsteSlot);

    const itensComItemLimpoDeGemas = itensEquipados.map((it) =>
      it.id === item.id ? { ...it, gems: [] } : it
    );
    const fcItemLimpo = calcularFc(
      classe,
      calcularStatusSimulados(classe, nivel, atributos, itensComItemLimpoDeGemas)
    );
    const perdaMarginalGemas = Math.max(0, fcTotal - fcItemLimpo);
    const perdaMarginalItemBase = Math.max(0, fcItemLimpo - fcSemEsteSlot);

    const gemas = item.gems || [];
    const gemasDados = gemas.map((gema, idx) => {
      const itensSemEstaGema = itensEquipados.map((it) => {
        if (it.id !== item.id) return it;
        return {
          ...it,
          gems: (it.gems || []).filter((_, iGema) => iGema !== idx),
        };
      });
      const fcSemEstaGema = calcularFc(
        classe,
        calcularStatusSimulados(classe, nivel, atributos, itensSemEstaGema)
      );
      const perdaMarginalGema = Math.max(0, fcTotal - fcSemEstaGema);
      return { gema, idx, perdaMarginalGema };
    });

    return {
      item,
      perdaMarginalSlot,
      perdaMarginalItemBase,
      perdaMarginalGemas,
      gemasDados,
    };
  });

  const somaPerdasMarginaisSlots = slotsDados.reduce((acc, s) => acc + s.perdaMarginalSlot, 0);
  let acumuladorFcSlots = 0;
  let idxMaiorSlot = 0;
  let maiorPerdaSlot = -1;

  slotsDados.forEach((s, idx) => {
    if (s.perdaMarginalSlot > maiorPerdaSlot) {
      maiorPerdaSlot = s.perdaMarginalSlot;
      idxMaiorSlot = idx;
    }
  });

  slotsDados.forEach((s) => {
    const proporcaoSlot = somaPerdasMarginaisSlots > 0 ? s.perdaMarginalSlot / somaPerdasMarginaisSlots : 0;
    const fcAtribuidoSlot = Math.round(ganhoTotalEquips * proporcaoSlot);
    s.proporcaoSlot = proporcaoSlot;
    s.fcAtribuidoSlot = fcAtribuidoSlot;
    acumuladorFcSlots += fcAtribuidoSlot;
  });

  if (slotsDados.length > 0 && acumuladorFcSlots !== ganhoTotalEquips) {
    slotsDados[idxMaiorSlot].fcAtribuidoSlot += (ganhoTotalEquips - acumuladorFcSlots);
  }

  slotsDados.forEach((s) => {
    const somaPartesInternas = s.perdaMarginalItemBase + s.perdaMarginalGemas;
    if (somaPartesInternas > 0) {
      s.fcAtribuidoItemBase = Math.round(s.fcAtribuidoSlot * (s.perdaMarginalItemBase / somaPartesInternas));
      s.fcAtribuidoGemasTotal = s.fcAtribuidoSlot - s.fcAtribuidoItemBase;
    } else {
      s.fcAtribuidoItemBase = s.fcAtribuidoSlot;
      s.fcAtribuidoGemasTotal = 0;
    }

    const somaPerdasGemas = s.gemasDados.reduce((acc, g) => acc + g.perdaMarginalGema, 0);
    let acumuladorGemas = 0;
    let idxMaiorGema = 0;
    let maiorPerdaGema = -1;

    s.gemasDados.forEach((g, idx) => {
      if (g.perdaMarginalGema > maiorPerdaGema) {
        maiorPerdaGema = g.perdaMarginalGema;
        idxMaiorGema = idx;
      }
      const propGema = somaPerdasGemas > 0 ? g.perdaMarginalGema / somaPerdasGemas : 0;
      const fcAtribuidoGema = Math.round(s.fcAtribuidoGemasTotal * propGema);
      g.fcAtribuidoGema = fcAtribuidoGema;
      g.proporcaoGemaNoItem = s.fcAtribuidoSlot > 0 ? fcAtribuidoGema / s.fcAtribuidoSlot : 0;
      acumuladorGemas += fcAtribuidoGema;
    });

    if (s.gemasDados.length > 0 && acumuladorGemas !== s.fcAtribuidoGemasTotal) {
      s.gemasDados[idxMaiorGema].fcAtribuidoGema += (s.fcAtribuidoGemasTotal - acumuladorGemas);
    }
  });

  const elementosEquipamentos = slotsDados.map((s) => {
    const item = s.item;
    const ehCosmetico = item.slot === "cosmetic";
    const nomeSlot = nomesSlots[item.slot] || item.slot;
    const nomeRaridade = nomesRaridade[item.rarity] || "Comum";
    const corRaridade = coresRaridade[item.rarity] || "#c9c5d8";

    const chipsAtributos = [];
    for (const [st, rotulo] of Object.entries(rotulosStats)) {
      if (item[st]) {
        const sufixo = st === "crit" || st === "spd" ? "%" : "";
        chipsAtributos.push(`<span class="chip-stat">+${item[st]}${sufixo} ${rotulo}</span>`);
      }
    }

    const maxSockets = item.sockets || s.gemasDados.length;
    const cardsGemas = [];

    s.gemasDados.forEach((g) => {
      const gema = g.gema;
      const corGema = coresGemas[gema.type] || "#8fd0ff";
      cardsGemas.push(`
        <div class="cartao-gema">
          <div class="gema-info">
            <span class="gema-icone" style="--cor-gema: ${corGema};"></span>
            <div class="gema-texto">
              <span class="gema-nome" style="color: ${corGema};">${escaparHtml(gema.name || "Gema")}</span>
              <span class="gema-stats">${escaparHtml(formatarGemaTexto(gema))}</span>
            </div>
          </div>
          <div class="gema-fc-bloco">
            <span class="gema-fc">+${formatadorInteiro.format(g.fcAtribuidoGema)} FC</span>
            <span class="gema-fc-perda">-${formatadorInteiro.format(g.perdaMarginalGema)} se remover</span>
          </div>
        </div>
      `);
    });

    for (let i = s.gemasDados.length; i < maxSockets; i++) {
      cardsGemas.push(`
        <div class="cartao-gema vazio">
          <div class="gema-info">
            <span class="gema-icone" style="--cor-gema: #443c68;"></span>
            <div class="gema-texto">
              <span class="gema-nome">Espaço vazio</span>
              <span class="gema-stats">Sem gema engastada</span>
            </div>
          </div>
          <span>—</span>
        </div>
      `);
    }

    return `
      <article class="cartao-equipamento">
        <div class="equip-topo">
          <div class="equip-titulo">
            <span class="equip-slot">${escaparHtml(nomeSlot)}</span>
            <div class="equip-nome" style="color: ${corRaridade};">${escaparHtml(item.name)}</div>
            <div class="equip-meta">
              ${nomeRaridade} · Nv. ${item.itemLevel || 1}
              ${item.set && catalogoConjuntos[item.set] ? ` · Conjunto ${escaparHtml(catalogoConjuntos[item.set].nome)}` : ""}
            </div>
          </div>
          <div class="equip-fc-box">
            <span class="tag-fc">+${formatadorInteiro.format(s.fcAtribuidoSlot)} FC (${formatadorPercentual.format(s.proporcaoSlot)} do ganho)</span>
            ${
              !ehCosmetico && s.gemasDados.length > 0
                ? `<span class="tag-fc secundaria">Item: +${formatadorInteiro.format(s.fcAtribuidoItemBase)} FC</span>
                   <span class="tag-fc secundaria">Gemas: +${formatadorInteiro.format(s.fcAtribuidoGemasTotal)} FC</span>`
                : ""
            }
            ${
              s.perdaMarginalSlot > 0
                ? `<span class="tag-fc remover" title="Perda de FC se você desequipar este item agora">Se desequipar: -${formatadorInteiro.format(s.perdaMarginalSlot)} FC</span>`
                : ""
            }
          </div>
        </div>
        ${chipsAtributos.length > 0 ? `<div class="atributos-item">${chipsAtributos.join("")}</div>` : ""}
        ${!ehCosmetico && maxSockets > 0 ? `<div class="grade-gemas">${cardsGemas.join("")}</div>` : ""}
      </article>
    `;
  });

  containerListaEquipamentos.innerHTML = elementosEquipamentos.join("");
}

/* ==========================================================================
   Aba 3: Simulador Interativo de FC & Build
   ========================================================================== */

function criarGemaPreset(tipo, slot, tier) {
  if (!tipo || tipo === "none" || !catalogoGemas[tipo]) return null;
  const spec = catalogoGemas[tipo].porSlot[slot] || catalogoGemas[tipo].porSlot.weapon;
  const magnitudesPct = { 1: 15, 2: 24, 3: 33, 4: 42, 5: 48 }; // decimos de %
  const magnitudesAtkHp = { 1: 12, 2: 22, 3: 32, 4: 42, 5: 55 };
  const magnitudesCritSpd = { 1: 4, 2: 7, 3: 10, 4: 13, 5: 16 };

  function valorParaStat(st, pct) {
    if (pct) return magnitudesPct[tier] || 30;
    if (st === "crit" || st === "spd") return magnitudesCritSpd[tier] || 10;
    return magnitudesAtkHp[tier] || 30;
  }

  const gema = {
    type: tipo,
    tier,
    name: `${catalogoGemas[tipo].nome} T${tier}${tier === 5 ? " Suprema" : ""}`,
    stat: spec.stat,
    value: valorParaStat(spec.stat, spec.pct),
    pct: spec.pct,
  };

  if (tier >= 5) {
    gema.stat2 = spec.stat2;
    gema.value2 = valorParaStat(spec.stat2, spec.pct2);
    gema.pct2 = spec.pct2;
  }
  return gema;
}

function resumoCurtoGemaBotao(tipo, slot, tier) {
  const gema = criarGemaPreset(tipo, slot, tier);
  if (!gema) return "";
  const fmt = (st, val, pct) => {
    const rot = rotulosStats[st] || st.toUpperCase();
    if (pct) return `+${(val / 10).toFixed(1).replace(".", ",")}% ${rot}`;
    return `+${val} ${rot}`;
  };
  let txt = fmt(gema.stat, gema.value, gema.pct);
  if (gema.stat2 && gema.value2) {
    txt += ` · ${fmt(gema.stat2, gema.value2, gema.pct2)}`;
  }
  return txt;
}

function criarModeloSimuladorPadrao() {
  return {
    cls: "warrior",
    level: 400,
    atributos: { str: 200, vit: 180, def: 150, agi: 140, luk: 120 },
    itens: [
      { id: "sim-weapon", slot: "weapon", name: "Lâmina da Singularidade", kind: "singblade", set: "singular", rarity: 7, itemLevel: 200, atk: 900, def: 300, hp: 2000, crit: 90, spd: 12, sockets: 6, gemTierPadrao: 5, gems: Array(6).fill(null) },
      { id: "sim-helmet", slot: "helmet", name: "Elmo da Singularidade", kind: "singhelm", set: "singular", rarity: 7, itemLevel: 200, atk: 550, def: 500, hp: 3200, crit: 75, spd: 8, sockets: 6, gemTierPadrao: 5, gems: Array(6).fill(null) },
      { id: "sim-armor", slot: "armor", name: "Couraça da Singularidade", kind: "singplate", set: "singular", rarity: 7, itemLevel: 200, atk: 600, def: 750, hp: 5000, crit: 70, spd: 8, sockets: 6, gemTierPadrao: 5, gems: Array(6).fill(null) },
      { id: "sim-ring", slot: "ring", name: "Anel do Eclipse Arcano", kind: "", look: 14, set: "", rarity: 7, itemLevel: 180, atk: 550, def: 220, hp: 1000, crit: 95, spd: 14, sockets: 6, gemTierPadrao: 5, gems: Array(6).fill(null) },
    ],
  };
}

function importarPerfilParaSimulador(perfil) {
  if (!perfil) return;
  const attrs = inferirAtributosBase(perfil);
  const slots = ["weapon", "helmet", "armor", "ring"];
  const itensImportados = slots.map((slot) => {
    const orig = (perfil.equipped || []).find((i) => i.slot === slot);
    if (!orig) {
      return {
        id: `sim-${slot}`,
        slot,
        name: `Peça (${nomesSlots[slot]})`,
        kind: "",
        look: slot === "ring" ? 14 : 0,
        set: "",
        rarity: 6,
        itemLevel: 100,
        atk: 0,
        def: 0,
        hp: 0,
        crit: 0,
        spd: 0,
        sockets: 6,
        gemTierPadrao: 5,
        gems: Array(6).fill(null),
      };
    }
    const origGems = Array.isArray(orig.gems) ? orig.gems : [];
    const tierDetectado = origGems.find((g) => g?.tier)?.tier || 5;
    return {
      ...orig,
      gemTierPadrao: tierDetectado,
      gems: Array.from({ length: 6 }, (_, i) => (origGems[i] ? { ...origGems[i] } : null)),
    };
  });

  estadoSimulador = {
    cls: perfil.cls,
    level: perfil.level,
    atributos: { ...attrs },
    itens: itensImportados,
  };
  simuladorEditadoManual = false;
}

function renderizarSimulador() {
  if (!containerSimulador) return;

  const stSim = calcularStatusSimulados(estadoSimulador.cls, estadoSimulador.level, estadoSimulador.atributos, estadoSimulador.itens);
  const fcSim = calcularFc(estadoSimulador.cls, stSim);
  const metSim = calcularMetricasCombate(estadoSimulador.cls, estadoSimulador.level, stSim, estadoSimulador.itens);

  // Melhor atributo para +1 ponto em FC
  const mapaNomesAttrs = [
    { chave: "str", nome: "Força (FOR)" },
    { chave: "vit", nome: "Vitalidade (VIT)" },
    { chave: "def", nome: "Defesa (DEF)" },
    { chave: "agi", nome: "Agilidade (AGI)" },
    { chave: "luk", nome: "Sorte (SOR)" },
  ];
  let melhorAttr = mapaNomesAttrs[0];
  let melhorGanho = -1;
  for (const attr of mapaNomesAttrs) {
    const copiaAttrs = { ...estadoSimulador.atributos, [attr.chave]: estadoSimulador.atributos[attr.chave] + 1 };
    const fcTeste = calcularFc(estadoSimulador.cls, calcularStatusSimulados(estadoSimulador.cls, estadoSimulador.level, copiaAttrs, estadoSimulador.itens));
    const delta = fcTeste - fcSim;
    if (delta > melhorGanho) {
      melhorGanho = delta;
      melhorAttr = attr;
    }
  }

  let fcOrig = null;
  let metOrig = null;
  if (perfilCarregadoP1) {
    const atOrig = inferirAtributosBase(perfilCarregadoP1);
    const stOrig = calcularStatusSimulados(perfilCarregadoP1.cls, perfilCarregadoP1.level, atOrig, perfilCarregadoP1.equipped || []);
    fcOrig = calcularFc(perfilCarregadoP1.cls, stOrig);
    metOrig = calcularMetricasCombate(perfilCarregadoP1.cls, perfilCarregadoP1.level, stOrig, perfilCarregadoP1.equipped || []);
  }

  const deltaFc = fcOrig !== null ? fcSim - fcOrig : 0;
  const classeBanner = deltaFc > 0 ? "up" : deltaFc < 0 ? "down" : "eq";
  const textoDelta = fcOrig !== null
    ? `${deltaFc >= 0 ? "+" : ""}${formatadorInteiro.format(deltaFc)} FC (${((deltaFc / Math.max(1, fcOrig)) * 100).toFixed(1)}%)`
    : "Sem jogador base carregado (modo sandbox)";

  const linhasAttrsHtml = mapaNomesAttrs.map(({ chave, nome }) => `
    <div class="sim-atributo-linha">
      <label for="sim-attr-${chave}">${nome}</label>
      <input id="sim-attr-${chave}" type="number" min="0" max="5000" value="${estadoSimulador.atributos[chave]}" data-sim-attr="${chave}">
      <div class="sim-botoes-attr">
        <button type="button" class="btn-mini" data-attr-btn="${chave}" data-delta="-10">-10</button>
        <button type="button" class="btn-mini" data-attr-btn="${chave}" data-delta="-1">-1</button>
        <button type="button" class="btn-mini" data-attr-btn="${chave}" data-delta="1">+1</button>
        <button type="button" class="btn-mini" data-attr-btn="${chave}" data-delta="10">+10</button>
      </div>
    </div>
  `).join("");

  // Conjuntos da classe atual aparecem primeiro, mas permite todos (para testar forjas/builds híbridas)
  const conjuntosDaClasse = Object.entries(catalogoConjuntos).filter(([, v]) => v.classe === estadoSimulador.cls);
  const conjuntosOutrasClasses = Object.entries(catalogoConjuntos).filter(([, v]) => v.classe !== estadoSimulador.cls);

  const construirOptsConjunto = (valorAtual) => {
    const optVazio = `<option value="" ${!valorAtual ? "selected" : ""}>Sem conjunto</option>`;
    const grupoClasse = `<optgroup label="Conjuntos de ${nomesClasses[estadoSimulador.cls]}">${conjuntosDaClasse
      .map(([k, v]) => `<option value="${k}" ${valorAtual === k ? "selected" : ""}>${escaparHtml(v.nome)}</option>`)
      .join("")}</optgroup>`;
    const grupoOutras = `<optgroup label="Outras Classes">${conjuntosOutrasClasses
      .map(([k, v]) => `<option value="${k}" ${valorAtual === k ? "selected" : ""}>${escaparHtml(v.nome)} (${nomesClasses[v.classe]})</option>`)
      .join("")}</optgroup>`;
    return optVazio + grupoClasse + grupoOutras;
  };

  const armasDaClasse = Object.entries(catalogoArmas).filter(([, v]) => v.classe === estadoSimulador.cls);
  const armasOutras = Object.entries(catalogoArmas).filter(([, v]) => v.classe !== estadoSimulador.cls);

  const construirOptsArma = (valorAtual) => {
    const optGen = `<option value="" ${!valorAtual ? "selected" : ""}>Arma genérica</option>`;
    const grupoClasse = `<optgroup label="Armas de ${nomesClasses[estadoSimulador.cls]}">${armasDaClasse
      .map(([k, v]) => `<option value="${k}" ${valorAtual === k ? "selected" : ""}>${escaparHtml(v.nome)}</option>`)
      .join("")}</optgroup>`;
    const grupoOutras = `<optgroup label="Outras Classes">${armasOutras
      .map(([k, v]) => `<option value="${k}" ${valorAtual === k ? "selected" : ""}>${escaparHtml(v.nome)} (${nomesClasses[v.classe]})</option>`)
      .join("")}</optgroup>`;
    return optGen + grupoClasse + grupoOutras;
  };

  const construirOptsAnel = (valorAtual) => {
    return [`<option value="0" ${!Number(valorAtual) ? "selected" : ""}>Anel comum</option>`]
      .concat(
        Object.entries(catalogoAneis).map(
          ([k, v]) => `<option value="${k}" ${Number(valorAtual) === Number(k) ? "selected" : ""}>${escaparHtml(v.nome)}</option>`
        )
      )
      .join("");
  };

  const setAtivo3Pecas =
    estadoSimulador.itens[0]?.set &&
    estadoSimulador.itens[0]?.set === estadoSimulador.itens[1]?.set &&
    estadoSimulador.itens[0]?.set === estadoSimulador.itens[2]?.set
      ? estadoSimulador.itens[0].set
      : "";

  const barraConjuntoRapidoHtml = `
    <div class="barra-atalhos">
      <span class="rotulo-atalho">⚡ Equipar Set Completo (${nomesClasses[estadoSimulador.cls]}):</span>
      ${conjuntosDaClasse
        .map(
          ([k, v]) => `
        <button type="button" class="btn-mini ${setAtivo3Pecas === k ? "ativo" : ""}" data-sim-set-rapido="${k}">
          ${escaparHtml(v.nome)}
        </button>
      `
        )
        .join("")}
    </div>
  `;

  const slotsHtml = estadoSimulador.itens.map((item, idxSlot) => {
    const ehArma = item.slot === "weapon";
    const ehAnel = item.slot === "ring";
    const maxGemas = Math.max(0, Math.min(6, Number(item.sockets ?? 6)));
    if (!Array.isArray(item.gems) || item.gems.length < 6) {
      const antigas = Array.isArray(item.gems) ? item.gems : [];
      item.gems = Array.from({ length: 6 }, (_, i) => (antigas[i] ? { ...antigas[i] } : null));
    }
    const tierSlot = Number(item.gemTierPadrao || 5);
    const qtdGemasAtivas = item.gems.slice(0, maxGemas).filter(Boolean).length;

    const botoesTierHtml = [1, 2, 3, 4, 5]
      .map(
        (t) => `
        <button type="button" class="btn-tier-gema ${tierSlot === t ? "ativa" : ""}" data-sim-slot-tier="${idxSlot}:${t}">
          T${t}${t === 5 ? " Suprema" : ""}
        </button>
      `
      )
      .join("");

    const linhasGemasHtml = Array.from({ length: maxGemas }, (_, idxGema) => {
      const gemaAtual = item.gems[idxGema] || null;
      const tipoAtual = gemaAtual?.type || null;

      const botoesOpcoesHtml = Object.entries(catalogoGemas)
        .map(([tk, tv]) => {
          const estaSelecionada = tipoAtual === tk;
          const tierExibicao = estaSelecionada ? gemaAtual.tier || tierSlot : tierSlot;
          const subtexto = estaSelecionada
            ? formatarGemaTexto(gemaAtual).replace(/^[^:]+:\s*/, "")
            : resumoCurtoGemaBotao(tk, item.slot, tierExibicao);
          return `
            <button
              type="button"
              class="btn-gema-opcao ${estaSelecionada ? "ativa" : ""}"
              data-sim-gem-btn="${idxSlot}:${idxGema}:${tk}"
              aria-pressed="${estaSelecionada ? "true" : "false"}"
              title="${estaSelecionada ? "Clique para desselecionar esta gema" : `Selecionar ${tv.nome} T${tierSlot}`}"
            >
              <strong class="gema-titulo-btn"><span class="gema-ponto-cor" style="background:${tv.cor};"></span>${tv.nome}</strong>
              <small class="gema-sub-btn">${escaparHtml(subtexto)}</small>
            </button>
          `;
        })
        .join("");

      return `
        <div class="sim-gema-linha">
          <span class="sim-gema-indice">#${idxGema + 1}</span>
          ${botoesOpcoesHtml}
        </div>
      `;
    }).join("");

    return `
      <div class="sim-slot-card">
        <div class="sim-slot-head">
          <strong>${nomesSlots[item.slot]} · ${escaparHtml(item.name || "Peça")}</strong>
          <span class="small muted">${nomesRaridade[item.rarity] || "Comum"} · Nv.${item.itemLevel || 1}</span>
        </div>
        <div class="sim-slot-selects">
          <select data-sim-item-campo="${idxSlot}:set" title="Conjunto da Peça">
            ${construirOptsConjunto(item.set || "")}
          </select>
          <select data-sim-item-campo="${idxSlot}:rarity" title="Raridade">
            ${nomesRaridade.map((nr, rIdx) => `<option value="${rIdx}" ${Number(item.rarity) === rIdx ? "selected" : ""}>${nr}</option>`).join("")}
          </select>
          <input type="number" min="1" max="999" value="${item.itemLevel || 1}" title="Item Level" data-sim-item-campo="${idxSlot}:itemLevel">
        </div>
        ${
          ehArma
            ? `<select data-sim-item-campo="${idxSlot}:kind" title="Tipo de Arma">${construirOptsArma(item.kind || "")}</select>`
            : ehAnel
              ? `<select data-sim-item-campo="${idxSlot}:look" title="Anel Especial">${construirOptsAnel(item.look || 0)}</select>`
              : ""
        }
        <div class="sim-slot-stats">
          <label>ATK <input type="number" value="${item.atk || 0}" data-sim-item-stat="${idxSlot}:atk"></label>
          <label>DEF <input type="number" value="${item.def || 0}" data-sim-item-stat="${idxSlot}:def"></label>
          <label>HP <input type="number" value="${item.hp || 0}" data-sim-item-stat="${idxSlot}:hp"></label>
          <label>CRÍT% <input type="number" value="${item.crit || 0}" data-sim-item-stat="${idxSlot}:crit"></label>
          <label>VEL% <input type="number" value="${item.spd || 0}" data-sim-item-stat="${idxSlot}:spd"></label>
        </div>
        <div class="sim-gemas-bloco">
          <div class="sim-gemas-topo">
            <span>💎 Gemas (${qtdGemasAtivas}/${maxGemas}) — clique na gema para ativar/desativar</span>
            <div class="sim-tier-bar">
              ${botoesTierHtml}
              <button type="button" class="btn-mini" data-sim-gem-repetir="${idxSlot}" title="Copia a gema da linha #1 para todas as 6 linhas">Repetir #1 nas 6</button>
              <button type="button" class="btn-mini" data-sim-gem-limpar="${idxSlot}" title="Desseleciona todas as gemas desta peça">Limpar</button>
            </div>
          </div>
          ${linhasGemasHtml}
        </div>
      </div>
    `;
  }).join("");

  containerSimulador.innerHTML = `
    <div class="sim-layout">
      <div class="sim-bloco">
        <h4>Personagem &amp; Pontos de Ouro</h4>
        <div class="sim-campos-topo">
          <div class="campo">
            <label for="sim-classe">Classe</label>
            <select id="sim-classe">
              ${Object.entries(nomesClasses).map(([k, n]) => `<option value="${k}" ${estadoSimulador.cls === k ? "selected" : ""}>${n}</option>`).join("")}
            </select>
          </div>
          <div class="campo">
            <label for="sim-nivel">Nível</label>
            <input id="sim-nivel" type="number" min="1" max="2000" value="${estadoSimulador.level}">
          </div>
        </div>

        ${linhasAttrsHtml}
        <div class="sim-dica-melhor" style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;">
          <span>💡 Melhor atributo agora: <strong>+1 em ${melhorAttr.nome}</strong> (+${formatadorInteiro.format(melhorGanho)} FC)</span>
          <span style="display:inline-flex;gap:6px;">
            <button type="button" class="btn-mini btn-atalho-ativo" data-attr-btn="${melhorAttr.chave}" data-delta="1">+1 ${melhorAttr.chave.toUpperCase()}</button>
            <button type="button" class="btn-mini btn-atalho-ativo" data-attr-btn="${melhorAttr.chave}" data-delta="10">+10 ${melhorAttr.chave.toUpperCase()}</button>
          </span>
        </div>

        <h4>Equipamentos &amp; Gemas</h4>
        ${barraConjuntoRapidoHtml}
        ${slotsHtml}
      </div>

      <div class="sim-bloco sim-painel-resultado">
        <h4>Resultado Simulado em Tempo Real</h4>
        <div class="sim-fc-comparativo">
          <div>
            <span class="small muted">${fcOrig !== null ? "ORIGINAL" : "REFERÊNCIA"}</span>
            <strong>${fcOrig !== null ? formatadorInteiro.format(fcOrig) : "—"}</strong>
          </div>
          <span aria-hidden="true">→</span>
          <div>
            <span class="small muted">SIMULADO</span>
            <strong>${formatadorInteiro.format(fcSim)}</strong>
          </div>
        </div>
        <div class="sim-delta-banner ${classeBanner}">${textoDelta}</div>

        <div class="card-info">
          <h4>Status Finais &amp; Combate</h4>
          <div class="card-info-linha"><span>ATK / DEF</span><strong>${formatadorDecimal1.format(stSim.atk)} / ${formatadorDecimal1.format(stSim.def)}</strong></div>
          <div class="card-info-linha"><span>Vida Máxima / EHP</span><strong>${formatarNumeroCompacto(stSim.maxHp)} / ${formatarNumeroCompacto(metSim.ehp)}</strong></div>
          <div class="card-info-linha"><span>ASPD (Cadência Real)</span><strong>${stSim.aspd.toFixed(2)} (${metSim.cadenciaReal.toFixed(2)}/s)</strong></div>
          <div class="card-info-linha"><span>Crítico / Dano Crít.</span><strong>${stSim.crit.toFixed(1)}% / ${(metSim.multCrit * 100).toFixed(0)}%</strong></div>
          <div class="card-info-linha"><span>Golpe Normal → Crítico</span><strong>${formatarNumeroCompacto(metSim.golpeNormalBruto)} → ${formatarNumeroCompacto(metSim.golpeCritBruto)}</strong></div>
          <div class="card-info-linha"><span>DPS Real em Combate</span><strong style="color:var(--gold);">${formatarNumeroCompacto(metSim.dpsCombateMedio)}/s ${metOrig ? `(${metSim.dpsCombateMedio >= metOrig.dpsCombateMedio ? "+" : ""}${formatarNumeroCompacto(metSim.dpsCombateMedio - metOrig.dpsCombateMedio)})` : ""}</strong></div>
          ${estadoSimulador.cls === "cleric" ? `<div class="card-info-linha"><span>Poder de Cura (Luz Divina)</span><strong style="color:var(--green);">${formatarNumeroCompacto(metSim.curaSkillLuzDivina)}</strong></div>` : ""}
          <div class="card-info-linha"><span>Mitigação de Defesa</span><strong>${(metSim.reducaoDefesa * 100).toFixed(1)}%</strong></div>
        </div>
        <button type="button" class="btn-fantasma" id="btn-sim-ir-boss" style="width:100%;">🐉 Testar Build Simulada contra Boss</button>
      </div>
    </div>
  `;

  vincularEventosSimulador();
}

function vincularEventosSimulador() {
  if (!containerSimulador) return;

  const selClasse = containerSimulador.querySelector("#sim-classe");
  const inpNivel = containerSimulador.querySelector("#sim-nivel");
  const btnIrBoss = containerSimulador.querySelector("#btn-sim-ir-boss");

  if (btnIrBoss) {
    btnIrBoss.addEventListener("click", () => {
      if (selectMonstroOrigem) selectMonstroOrigem.value = "sim";
      renderizarSimuladorMonstros();
      alternarVisibilidadeAba("monstros");
    });
  }

  if (selClasse) {
    selClasse.addEventListener("change", (e) => {
      simuladorEditadoManual = true;
      estadoSimulador.cls = e.target.value;
      renderizarSimulador();
      if (abaAtualAtiva === "monstros") renderizarSimuladorMonstros();
    });
  }
  if (inpNivel) {
    inpNivel.addEventListener("change", (e) => {
      simuladorEditadoManual = true;
      estadoSimulador.level = Math.max(1, Math.min(2000, Number(e.target.value) || 1));
      renderizarSimulador();
    });
  }

  containerSimulador.querySelectorAll("[data-sim-attr]").forEach((inp) => {
    inp.addEventListener("change", (e) => {
      simuladorEditadoManual = true;
      const chave = e.target.dataset.simAttr;
      estadoSimulador.atributos[chave] = Math.max(0, Math.min(5000, Number(e.target.value) || 0));
      renderizarSimulador();
    });
  });

  containerSimulador.querySelectorAll("[data-attr-btn]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      simuladorEditadoManual = true;
      const alvo = e.currentTarget;
      const chave = alvo.dataset.attrBtn;
      const delta = Number(alvo.dataset.delta || 0);
      estadoSimulador.atributos[chave] = Math.max(0, Math.min(5000, estadoSimulador.atributos[chave] + delta));
      renderizarSimulador();
    });
  });

  containerSimulador.querySelectorAll("[data-sim-set-rapido]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      simuladorEditadoManual = true;
      const setKey = e.currentTarget.dataset.simSetRapido;
      const infoSet = catalogoConjuntos[setKey];
      if (!infoSet) return;
      [0, 1, 2].forEach((idx) => {
        const it = estadoSimulador.itens[idx];
        if (!it) return;
        it.set = setKey;
        if (idx === 0 && infoSet.armaKind) {
          it.kind = infoSet.armaKind;
          it.name = catalogoArmas[infoSet.armaKind]?.nome || it.name;
        } else if (idx === 1) {
          it.name = `Elmo (${infoSet.nome})`;
        } else if (idx === 2) {
          it.name = `Armadura (${infoSet.nome})`;
        }
      });
      renderizarSimulador();
    });
  });

  containerSimulador.querySelectorAll("[data-sim-item-campo]").forEach((el) => {
    el.addEventListener("change", (e) => {
      simuladorEditadoManual = true;
      const [idxStr, campo] = e.target.dataset.simItemCampo.split(":");
      const item = estadoSimulador.itens[Number(idxStr)];
      if (!item) return;
      if (campo === "rarity" || campo === "itemLevel" || campo === "look") {
        item[campo] = Number(e.target.value) || 0;
        if (campo === "look") {
          item.name = catalogoAneis[item.look]?.nome || "Anel Comum";
        }
      } else {
        item[campo] = e.target.value;
        if (campo === "kind") {
          item.name = catalogoArmas[item.kind]?.nome || "Arma";
        }
      }
      renderizarSimulador();
    });
  });

  containerSimulador.querySelectorAll("[data-sim-item-stat]").forEach((el) => {
    el.addEventListener("change", (e) => {
      simuladorEditadoManual = true;
      const [idxStr, stat] = e.target.dataset.simItemStat.split(":");
      const item = estadoSimulador.itens[Number(idxStr)];
      if (!item) return;
      item[stat] = Math.max(0, Number(e.target.value) || 0);
      renderizarSimulador();
    });
  });

  // Clique linha a linha nos botões de gemas (seleciona com fundo amarelado ou desseleciona ao clicar de novo)
  containerSimulador.querySelectorAll("[data-sim-gem-btn]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      simuladorEditadoManual = true;
      const [idxSlotStr, idxGemaStr, tipoClicado] = e.currentTarget.dataset.simGemBtn.split(":");
      const idxSlot = Number(idxSlotStr);
      const idxGema = Number(idxGemaStr);
      const item = estadoSimulador.itens[idxSlot];
      if (!item) return;
      if (!Array.isArray(item.gems) || item.gems.length < 6) {
        const antigas = Array.isArray(item.gems) ? item.gems : [];
        item.gems = Array.from({ length: 6 }, (_, i) => (antigas[i] ? { ...antigas[i] } : null));
      }
      const tierSlot = Number(item.gemTierPadrao || 5);
      const gemaAtual = item.gems[idxGema];

      if (gemaAtual && gemaAtual.type === tipoClicado) {
        // Desseleciona se já estava selecionada
        item.gems[idxGema] = null;
      } else {
        item.gems[idxGema] = criarGemaPreset(tipoClicado, item.slot, tierSlot);
      }
      renderizarSimulador();
    });
  });

  // Seletor de Tier da peça (atualiza o tier padrão e converte as gemas ativas da peça para o novo tier)
  containerSimulador.querySelectorAll("[data-sim-slot-tier]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      simuladorEditadoManual = true;
      const [idxSlotStr, tierStr] = e.currentTarget.dataset.simSlotTier.split(":");
      const idxSlot = Number(idxSlotStr);
      const novoTier = Number(tierStr) || 5;
      const item = estadoSimulador.itens[idxSlot];
      if (!item) return;
      item.gemTierPadrao = novoTier;
      if (Array.isArray(item.gems)) {
        item.gems = item.gems.map((g) => (g && g.type ? criarGemaPreset(g.type, item.slot, novoTier) : null));
      }
      renderizarSimulador();
    });
  });

  // Botão "Repetir #1 nas 6"
  containerSimulador.querySelectorAll("[data-sim-gem-repetir]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      simuladorEditadoManual = true;
      const idxSlot = Number(e.currentTarget.dataset.simGemRepetir);
      const item = estadoSimulador.itens[idxSlot];
      if (!item) return;
      const tierSlot = Number(item.gemTierPadrao || 5);
      const primeira = item.gems?.find(Boolean) || criarGemaPreset("ruby", item.slot, tierSlot);
      item.gems = Array.from({ length: 6 }, () => criarGemaPreset(primeira.type, item.slot, primeira.tier || tierSlot));
      renderizarSimulador();
    });
  });

  // Botão "Limpar" todas as gemas da peça
  containerSimulador.querySelectorAll("[data-sim-gem-limpar]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      simuladorEditadoManual = true;
      const idxSlot = Number(e.currentTarget.dataset.simGemLimpar);
      const item = estadoSimulador.itens[idxSlot];
      if (!item) return;
      item.gems = Array(6).fill(null);
      renderizarSimulador();
    });
  });
}

/* ==========================================================================
   Aba 4: Monstros, Chefes & Simulador PvE
   ========================================================================== */

function calcularEscalaOnda(zona, onda, numJogadores) {
  const z = Math.max(1, Math.min(100, Number(zona) || 1));
  const w = Math.max(1, Math.min(10, Number(onda) || 1));
  const party = Math.max(1, Math.min(500, Number(numJogadores) || 1));
  const n = (z - 1) * 10 + w;

  const tp = (x) => Math.pow(1.105, x - 1);
  const ap = (x) => Math.pow(1.075, x - 1);
  const iw = (x) => (x <= 70 ? tp(x) : tp(70) * Math.pow(1.085, x - 70)) * (x >= 100 ? 0.8 : 1);
  const bw = (x) => (x <= 70 ? ap(x) : ap(70) * Math.pow(1.055, x - 70)) * (x >= 100 ? 0.85 : 1);

  const multParty = 1 + 0.025 * party;
  const defMult = 1 + (n - 1) * 0.35;

  function statsInimigo(kind) {
    const o = (kind === "boss" ? iw(n) : tp(n)) * multParty;
    const l = kind === "boss" ? bw(n) : ap(n);
    const base = kind === "skeleton"
      ? { hp: 30, atk: 5, def: 1, aspd: 0.8 }
      : kind === "goblin"
        ? { hp: 20, atk: 4.5, def: 0.5, aspd: 0.7 }
        : { hp: 360, atk: 9.5, def: 3, aspd: 0.5 };

    const xpGoldMult = kind === "boss" ? 12 : kind === "goblin" ? 1.2 : 1;
    const exp = Math.round((6 + 2 * n) * xpGoldMult);
    const gold = Math.round((2 + n) * xpGoldMult * (1 + Math.min(Math.max(0, n - 1), 99) / 99));

    return {
      hp: Math.round(base.hp * o),
      atk: base.atk * l,
      def: base.def * defMult,
      aspd: base.aspd,
      exp,
      gold,
    };
  }

  const fatorHorda = 0.55 + 0.45 * Math.pow(party, 0.72);
  const qtdBase = Math.min(40, Math.max(2, Math.round((1.6 + n * 0.5) * fatorHorda)));
  const qtdMinions = w === 10 ? Math.max(2, Math.round(qtdBase * 0.5)) : qtdBase;
  const infoTema = catalogoTemasZona[(z - 1) % catalogoTemasZona.length];

  return {
    zona: z,
    onda: w,
    waveAbsoluta: n,
    party,
    multParty,
    temaNome: infoTema.nome,
    infoTema,
    temBoss: w === 10,
    qtdMinions,
    skeleton: statsInimigo("skeleton"),
    goblin: statsInimigo("goblin"),
    boss: statsInimigo("boss"),
  };
}

function obterHeroiBaseParaDuelo() {
  const origem = selectMonstroOrigem?.value || "perfil";
  if (origem === "simulador" || !perfilCarregadoP1) {
    const st = calcularStatusSimulados(estadoSimulador.cls, estadoSimulador.level, estadoSimulador.atributos, estadoSimulador.itens);
    const met = calcularMetricasCombate(estadoSimulador.cls, estadoSimulador.level, st, estadoSimulador.itens);
    return {
      origemLabel: origem === "simulador" ? "Build do Simulador" : "Build Padrão do Simulador (nenhum jogador pesquisado)",
      cls: estadoSimulador.cls,
      level: estadoSimulador.level,
      status: st,
      metricas: met,
    };
  }
  const st = perfilCarregadoP1.stats;
  const met = calcularMetricasCombate(perfilCarregadoP1.cls, perfilCarregadoP1.level, st, perfilCarregadoP1.equipped || []);
  return {
    origemLabel: `${perfilCarregadoP1.displayName || perfilCarregadoP1.login} (${nomesClasses[perfilCarregadoP1.cls]} Nv.${perfilCarregadoP1.level})`,
    cls: perfilCarregadoP1.cls,
    level: perfilCarregadoP1.level,
    status: st,
    metricas: met,
  };
}

function renderizarSimuladorMonstros() {
  if (!containerResultadoMonstros) return;
  const zona = inputMonstroZona?.value || 16;
  const onda = inputMonstroOnda?.value || 10;
  const jogadores = inputMonstroJogadores?.value || 25;

  const esc = calcularEscalaOnda(zona, onda, jogadores);
  const heroi = obterHeroiBaseParaDuelo();
  const tema = esc.infoTema;
  const fatorDefHeroi = 100 / (100 + heroi.status.def * 4);

  function calcularDueloInimigo(inimigo, multSkill = 1.25) {
    const fatorDefInimigo = 100 / (100 + inimigo.def * 4);
    const hitNormal = Math.max(1, Math.round(heroi.metricas.golpeNormalBruto * fatorDefInimigo));
    const hitCrit = Math.max(1, Math.round(heroi.metricas.golpeCritBruto * fatorDefInimigo));
    const dpsRealContraAlvo = Math.max(1, heroi.metricas.dpsCombateMedio * fatorDefInimigo);
    const ttk = inimigo.hp / dpsRealContraAlvo;

    const danoRecebido = Math.max(1, Math.round(inimigo.atk * fatorDefHeroi));
    const danoSkillFisica = Math.max(1, Math.round(inimigo.atk * multSkill * fatorDefHeroi));
    const golpesParaMorrer = Math.ceil(heroi.status.maxHp / danoRecebido);

    // No código oficial: hit(..., "bleed") IGNORA 100% da DEF (Math.max(1, Math.round(s)))!
    // applyBleed normal = 30% ATK/s por 4s (120% ATK total); forte (Assassino) = 50% ATK/s por 5.5s (275% ATK total)
    const bleedDpsNormal = Math.max(1, Math.round(inimigo.atk * 0.3));
    const bleedTotal4s = Math.max(1, Math.round(inimigo.atk * 1.2));

    return {
      hitNormal,
      hitCrit,
      dpsRealContraAlvo,
      ttk,
      danoRecebido,
      danoSkillFisica,
      golpesParaMorrer,
      fatorDefInimigo,
      bleedDpsNormal,
      bleedTotal4s,
    };
  }

  const dBoss = calcularDueloInimigo(esc.boss, tema.skillBossMult);
  const dSkel = calcularDueloInimigo(esc.skeleton, 3.2);
  const dGob = calcularDueloInimigo(esc.goblin, 1.25);

  const danoSingBoss = heroi.metricas.arma?.kind === "singblade"
    ? Math.round(esc.boss.hp * (heroi.metricas.analiseEfeitoArma?.pctBossEfetivo || 0.04))
    : 0;

  // Cálculo do Dano Verdadeiro real da Zona (Sangramento / Poça / Aura que IGNORA DEF no código do jogo)
  const dotBossPorSeg = tema.fatorDotVerdadeiroPorSeg > 0
    ? Math.round(esc.boss.atk * tema.fatorDotVerdadeiroPorSeg)
    : dBoss.bleedDpsNormal;
  const dotBoss4s = dotBossPorSeg * 4;
  const bleedAssassinoSkel5s = Math.round(esc.skeleton.atk * 0.5 * 5.5); // 275% ATK do Esqueleto ignorando DEF

  // Tabela de Fúria (Rage a cada 15s: +10% ATK, +8% ASPD, -7% DEF, -5% HP máx, -8% CD da Skill)
  const ticksRage = [0, 15, 30, 45, 60, 75].map((seg) => {
    const nivelRage = seg / 15;
    const bossAtk = esc.boss.atk * Math.pow(1.1, nivelRage);
    const bossAspd = esc.boss.aspd * Math.pow(1.08, nivelRage);
    const bossDef = esc.boss.def * Math.pow(0.93, nivelRage);
    const cdSkillRage = tema.cdSkillBoss * Math.pow(0.92, nivelRage);
    const danoHitBasico = Math.max(1, Math.round(bossAtk * fatorDefHeroi));
    const danoHitSkill = Math.max(1, Math.round(bossAtk * tema.skillBossMult * fatorDefHeroi));
    const danoBleed4sRage = Math.max(1, Math.round(bossAtk * 1.2)); // 30% ATK/s por 4s (Dano Verdadeiro sem DEF!)
    const pctHpBleed = (danoBleed4sRage / Math.max(1, heroi.status.maxHp)) * 100;

    let sobreviveTxt;
    if (danoHitSkill >= heroi.status.maxHp) {
      sobreviveTxt = "Hit-Kill Físico na Skill";
    } else if (tema.temBleedBoss && danoBleed4sRage >= heroi.status.maxHp) {
      const segsParaMorrerNoBleed = (heroi.status.maxHp / (bossAtk * 0.3)).toFixed(1);
      sobreviveTxt = `Letal no Sangramento (${segsParaMorrerNoBleed}s s/ cura)`;
    } else if (tema.temBleedBoss) {
      sobreviveTxt = `Bleed tira ${pctHpBleed.toFixed(0)}% HP (Físico: ${Math.floor(heroi.status.maxHp / danoHitBasico)} hits)`;
    } else {
      sobreviveTxt = `Aguenta ${Math.floor(heroi.status.maxHp / danoHitSkill)} skills (${Math.floor(heroi.status.maxHp / danoHitBasico)} hits)`;
    }

    const corSobrevive =
      danoHitSkill >= heroi.status.maxHp || (tema.temBleedBoss && danoBleed4sRage >= heroi.status.maxHp)
        ? "#ff8a9b"
        : tema.temBleedBoss && pctHpBleed >= 50
          ? "var(--gold)"
          : "var(--green)";

    return `
      <tr>
        <th scope="row">${seg}s (Fúria ${nivelRage})</th>
        <td>${formatarNumeroCompacto(bossAtk)}</td>
        <td>${bossAspd.toFixed(2)}/s · Skill ${cdSkillRage.toFixed(1)}s</td>
        <td>${formatadorDecimal1.format(bossDef)}</td>
        <td>${formatarNumeroCompacto(danoHitBasico)} (Skill: ${formatarNumeroCompacto(danoHitSkill)})</td>
        <td style="color:#ff9aa8;font-weight:700;">${tema.temBleedBoss ? `${formatarNumeroCompacto(danoBleed4sRage)} (${formatarNumeroCompacto(bossAtk * 0.3)}/s)` : "Sem Bleed no Boss"}</td>
        <td style="color:${corSobrevive};">${sobreviveTxt}</td>
      </tr>
    `;
  }).join("");

  const bleedLetalNoBoss = tema.temBleedBoss && dotBoss4s >= heroi.status.maxHp;
  const classeVeredito =
    dBoss.golpesParaMorrer <= 1 || bleedLetalNoBoss
      ? "perigo"
      : dBoss.golpesParaMorrer <= 5 || (tema.temBleedBoss && dotBoss4s >= heroi.status.maxHp * 0.5)
        ? "alerta"
        : "";

  let textoVeredito;
  if (dBoss.golpesParaMorrer <= 1) {
    textoVeredito = `⚠️ Perigo Físico: O Chefe da Zona ${esc.zona} (${tema.boss}) aplica Hit-Kill físico no segundo 0 (${formatarNumeroCompacto(dBoss.danoRecebido)} dano vs ${formatarNumeroCompacto(heroi.status.maxHp)} HP).`;
  } else if (tema.temBleedBoss) {
    textoVeredito = `⚠️ Atenção às Skills (${tema.boss}): Sua DEF reduz o golpe físico básico para ${formatarNumeroCompacto(dBoss.danoRecebido)} (skill física: ${formatarNumeroCompacto(dBoss.danoSkillFisica)}), MAS o Sangramento/DoT da skill do Chefe IGNORA 100% DA DEFESA e causa ${formatarNumeroCompacto(dotBossPorSeg)}/s de Dano Verdadeiro (${formatarNumeroCompacto(dotBoss4s)} em 4s vs seus ${formatarNumeroCompacto(heroi.status.maxHp)} HP)!`;
  } else {
    textoVeredito = `✅ Duelo na Zona ${esc.zona} (${tema.boss}): Golpe básico físico causa ${formatarNumeroCompacto(dBoss.danoRecebido)} e a Skill (${tema.skillBossMult}×) causa ${formatarNumeroCompacto(dBoss.danoSkillFisica)} a cada ${tema.cdSkillBoss}s. Seu TTK solo no Chefe é ~${dBoss.ttk < 1 ? "<1" : dBoss.ttk.toFixed(1)}s (${formatarNumeroCompacto(dBoss.dpsRealContraAlvo)} DPS líquido).`;
  }

  const zonasAtalho = [10, 13, 16, 18, 20, 22, 25];

  containerResultadoMonstros.innerHTML = `
    <div class="barra-atalhos">
      <span class="rotulo-atalho">🎯 Zonas Rápidas:</span>
      ${zonasAtalho
        .map(
          (z) => `
        <button type="button" class="btn-mini ${esc.zona === z ? "ativo" : ""}" data-atalho-zona="${z}">
          Zona ${z}
        </button>
      `
        )
        .join("")}
      <span class="rotulo-atalho" style="margin-left:8px;">🌊 Onda:</span>
      <button type="button" class="btn-mini ${esc.onda === 1 ? "ativo" : ""}" data-atalho-onda="1">Onda 1 (Mobs)</button>
      <button type="button" class="btn-mini ${esc.onda === 10 ? "ativo" : ""}" data-atalho-onda="10">Onda 10 (CHEFE)</button>
    </div>

    <div class="veredito-duelo ${classeVeredito}">
      <span>${textoVeredito}</span>
      <span class="small" style="color:var(--cyan);">Herói: <strong>${escaparHtml(heroi.origemLabel)}</strong></span>
    </div>

    <div class="card-info" style="border-color: rgba(240, 180, 41, 0.35);">
      <h4>🔥 Habilidades Reais do Chefe &amp; Mecânicas Letais — Zona ${esc.zona}: ${escaparHtml(tema.nome)}</h4>
      <div class="card-info-linha"><span>Chefe (${escaparHtml(tema.boss)})</span><strong>CD Base: ${tema.cdSkillBoss}s (-8% CD a cada 15s de Fúria)</strong></div>
      <p class="small" style="margin:2px 0 6px;color:var(--text);">${escaparHtml(tema.resumoSkillBoss)}</p>
      <div class="card-info-linha"><span>Por que morremos mesmo com DEF alta?</span><strong style="color:#ff8a9b;">Sangramento / Poça / Aura = DANO VERDADEIRO (Ignora 100% da DEF)</strong></div>
      <p class="small muted" style="margin:2px 0 0;">${escaparHtml(tema.resumoLacaios)}</p>
    </div>

    <div class="aviso-vazio-perfil" style="border-left-color: var(--gold);">
      <span>
        <strong>Zona ${esc.zona} · Onda ${esc.onda}</strong> (Onda global #${esc.waveAbsoluta} · ${escaparHtml(esc.temaNome)}) ·
        <strong>${esc.party} jogadores</strong> na live = <strong>+${((esc.multParty - 1) * 100).toFixed(1).replace(".", ",")}% HP</strong> nos monstros (${esc.temBoss ? `1 Chefe + ${esc.qtdMinions} lacaios` : `${esc.qtdMinions} inimigos`}).
      </span>
    </div>

    <div class="grade-monstros">
      <article class="card-monstro">
        <div class="card-monstro-topo">
          <h4>${escaparHtml(tema.melee)}</h4>
          <span class="small muted">${formatadorInteiro.format(esc.skeleton.gold)}g · ${formatadorInteiro.format(esc.skeleton.exp)} XP</span>
        </div>
        <div class="card-info-linha"><span>HP / DEF</span><strong>${formatarNumeroCompacto(esc.skeleton.hp)} / ${formatadorDecimal1.format(esc.skeleton.def)}</strong></div>
        <div class="card-info-linha"><span>ATK / ASPD</span><strong>${formatarNumeroCompacto(esc.skeleton.atk)} / ${esc.skeleton.aspd.toFixed(1)}/s</strong></div>
        <div class="card-info-linha"><span>Seu Golpe (Normal → Crít)</span><strong>${formatarNumeroCompacto(dSkel.hitNormal)} → ${formatarNumeroCompacto(dSkel.hitCrit)}</strong></div>
        <div class="card-info-linha"><span>Tempo para Matar (Solo)</span><strong style="color:var(--gold);">${dSkel.ttk < 1 ? "<1s" : `${dSkel.ttk.toFixed(1)}s`}</strong></div>
        <div class="card-info-linha"><span>Hit Físico em Você (c/ DEF)</span><strong>${formatarNumeroCompacto(dSkel.danoRecebido)} (${dSkel.golpesParaMorrer} hits)</strong></div>
        <div class="card-info-linha"><span>Se aplicar Bleed (Ignora DEF)</span><strong style="color:#ff8a9b;">${formatarNumeroCompacto(dSkel.bleedDpsNormal)}/s (Ladino: ${formatarNumeroCompacto(bleedAssassinoSkel5s)} em 5,5s)</strong></div>
      </article>

      <article class="card-monstro">
        <div class="card-monstro-topo">
          <h4>${escaparHtml(tema.ranged)}</h4>
          <span class="small muted">${formatadorInteiro.format(esc.goblin.gold)}g · ${formatadorInteiro.format(esc.goblin.exp)} XP</span>
        </div>
        <div class="card-info-linha"><span>HP / DEF</span><strong>${formatarNumeroCompacto(esc.goblin.hp)} / ${formatadorDecimal1.format(esc.goblin.def)}</strong></div>
        <div class="card-info-linha"><span>ATK / ASPD</span><strong>${formatarNumeroCompacto(esc.goblin.atk)} / ${esc.goblin.aspd.toFixed(1)}/s</strong></div>
        <div class="card-info-linha"><span>Seu Golpe (Normal → Crít)</span><strong>${formatarNumeroCompacto(dGob.hitNormal)} → ${formatarNumeroCompacto(dGob.hitCrit)}</strong></div>
        <div class="card-info-linha"><span>Tempo para Matar (Solo)</span><strong style="color:var(--gold);">${dGob.ttk < 1 ? "<1s" : `${dGob.ttk.toFixed(1)}s`}</strong></div>
        <div class="card-info-linha"><span>Hit Físico em Você (c/ DEF)</span><strong>${formatarNumeroCompacto(dGob.danoRecebido)} (${dGob.golpesParaMorrer} hits)</strong></div>
        <div class="card-info-linha"><span>Poça Ácida (Z5/Z13/Z21 s/ DEF)</span><strong style="color:#ff8a9b;">${formatarNumeroCompacto(esc.goblin.atk * 0.7)}/s (35% ATK a cada 0,5s)</strong></div>
      </article>

      <article class="card-monstro boss">
        <div class="card-monstro-topo">
          <h4>${escaparHtml(tema.boss.toUpperCase())} (Z${esc.zona})</h4>
          <span class="small" style="color:var(--gold);">${formatadorInteiro.format(esc.boss.gold)}g · ${formatadorInteiro.format(esc.boss.exp)} XP</span>
        </div>
        <div class="card-info-linha"><span>HP Total (+${((esc.multParty - 1) * 100).toFixed(0)}%)</span><strong>${formatarNumeroCompacto(esc.boss.hp)}</strong></div>
        <div class="card-info-linha"><span>ATK / DEF (Mitigação)</span><strong>${formatarNumeroCompacto(esc.boss.atk)} / ${formatadorDecimal1.format(esc.boss.def)} (-${((1 - dBoss.fatorDefInimigo) * 100).toFixed(1)}%)</strong></div>
        <div class="card-info-linha"><span>Seu Hit no Chefe</span><strong style="color:var(--gold);">${formatarNumeroCompacto(dBoss.hitNormal)} → ${formatarNumeroCompacto(dBoss.hitCrit)}</strong></div>
        <div class="card-info-linha"><span>DPS Real / TTK Solo</span><strong>${formatarNumeroCompacto(dBoss.dpsRealContraAlvo)}/s · ${dBoss.ttk.toFixed(1)}s</strong></div>
        ${danoSingBoss > 0 ? `<div class="card-info-linha"><span>Proc da Singularidade</span><strong style="color:var(--cyan);">-${formatarNumeroCompacto(danoSingBoss)} HP / 13s</strong></div>` : ""}
        <div class="card-info-linha"><span>Hit Básico → Skill (${tema.skillBossMult}× c/ DEF)</span><strong>${formatarNumeroCompacto(dBoss.danoRecebido)} → ${formatarNumeroCompacto(dBoss.danoSkillFisica)}</strong></div>
        <div class="card-info-linha"><span>Sangramento / DoT (Ignora DEF!)</span><strong style="color:${dotBoss4s >= heroi.status.maxHp ? "#ff7a90" : "var(--gold)"};">${tema.temBleedBoss ? `${formatarNumeroCompacto(dotBossPorSeg)}/s (${formatarNumeroCompacto(dotBoss4s)} em 4s)` : "N/A nesta zona"}</strong></div>
      </article>
    </div>

    <h4 class="titulo-secao-comp" style="margin-top:6px;">Escala de Fúria do Chefe (Rage a cada 15s: +10% ATK, +8% Vel, -8% CD Skill, -7% DEF)</h4>
    <div class="table-wrap">
      <table class="tabela-comp">
        <thead>
          <tr>
            <th scope="col">Tempo de Luta</th>
            <th scope="col">ATK (+10%)</th>
            <th scope="col">Vel. / CD Skill</th>
            <th scope="col">DEF (-7%)</th>
            <th scope="col">Hit Físico / Skill (c/ DEF)</th>
            <th scope="col">Sangramento 4s (Ignora DEF)</th>
            <th scope="col">Impacto Real em Você</th>
          </tr>
        </thead>
        <tbody>${ticksRage}</tbody>
      </table>
    </div>
  `;

  containerResultadoMonstros.querySelectorAll("[data-atalho-zona]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (inputMonstroZona) inputMonstroZona.value = btn.dataset.atalhoZona;
      renderizarSimuladorMonstros();
    });
  });

  containerResultadoMonstros.querySelectorAll("[data-atalho-onda]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (inputMonstroOnda) inputMonstroOnda.value = btn.dataset.atalhoOnda;
      renderizarSimuladorMonstros();
    });
  });
}

/* ==========================================================================
   Aba 5: Radar de Lives & Scanner de Itens Usados ao Vivo
   ========================================================================== */

function popularSeletorItensRadar(classeFiltro = selectRadarClasse?.value || "") {
  if (!selectRadarItem) return;
  const valorAnterior = selectRadarItem.value || "";
  const rotuloClasse = classeFiltro && nomesClasses[classeFiltro] ? ` (${nomesClasses[classeFiltro]})` : "";

  const optDefault = new Option(
    classeFiltro
      ? `Todos os itens de ${nomesClasses[classeFiltro]} (visão geral)`
      : "Todos os jogadores (visão geral + ranking da live)",
    ""
  );

  const grupoArmas = document.createElement("optgroup");
  grupoArmas.label = `Armas${rotuloClasse}`;
  for (const [kind, info] of Object.entries(catalogoArmas)) {
    if (classeFiltro && info.classe !== classeFiltro) continue;
    const sufixoClasse = classeFiltro ? "" : ` (${nomesClasses[info.classe]})`;
    const tagEfeito = info.efeito ? " ★" : "";
    grupoArmas.appendChild(new Option(`${info.nome}${tagEfeito}${sufixoClasse}`, `kind:${kind}`));
  }

  const grupoSets = document.createElement("optgroup");
  grupoSets.label = `Conjuntos / Sets${rotuloClasse}`;
  for (const [setKey, info] of Object.entries(catalogoConjuntos)) {
    if (classeFiltro && info.classe !== classeFiltro) continue;
    const sufixoClasse = classeFiltro ? "" : ` (${nomesClasses[info.classe]})`;
    grupoSets.appendChild(new Option(`Conjunto ${info.nome}${sufixoClasse}`, `set:${setKey}`));
  }

  const grupoAneis = document.createElement("optgroup");
  grupoAneis.label = "Anéis Imortais & Arcanos (Todas as Classes)";
  for (const [look, info] of Object.entries(catalogoAneis)) {
    grupoAneis.appendChild(new Option(info.nome, `ring:${look}`));
  }

  selectRadarItem.replaceChildren(optDefault, grupoArmas, grupoSets, grupoAneis);

  // Mantém o item selecionado apenas se continuar disponível na classe filtrada
  const aindaExiste = Array.from(selectRadarItem.options).some((opt) => opt.value === valorAnterior);
  selectRadarItem.value = aindaExiste ? valorAnterior : "";
}

async function mapearComConcorrencia(lista, limite, sinalAborto, trabalhadorFn, aoProgresso) {
  const resultados = new Array(lista.length);
  let proximoIndice = 0;
  let concluidos = 0;

  async function executarWorker() {
    while (proximoIndice < lista.length) {
      if (sinalAborto.aborted) return;
      const i = proximoIndice++;
      try {
        resultados[i] = await trabalhadorFn(lista[i], i);
      } catch {
        resultados[i] = null;
      }
      concluidos += 1;
      if (aoProgresso) aoProgresso(concluidos, lista.length);
    }
  }

  const workers = Array.from({ length: Math.min(limite, Math.max(1, lista.length)) }, () => executarWorker());
  await Promise.all(workers);
  return resultados;
}

async function obterPerfilEmCache(login, cls, sinalAborto) {
  const chave = `${login.toLowerCase()}::${cls || ""}`;
  const registro = cachePerfisApi.get(chave);
  const agora = Date.now();
  if (registro && agora - registro.ts < 180000) {
    return registro.dados;
  }
  const caminho = `/api/profile/${encodeURIComponent(login)}${cls ? `?cls=${encodeURIComponent(cls)}` : ""}`;
  const dados = await buscarJsonApi(caminho, sinalAborto, 8000);
  cachePerfisApi.set(chave, { ts: agora, dados });
  return dados;
}

async function escanearLiveSelecionada() {
  const canalDigitado = (inputRadarCanal?.value || "").trim().toLowerCase();
  const canalSelect = (selectRadarLives?.value || "").trim().toLowerCase();
  const canalAlvo = (canalDigitado || canalSelect).replace(/^kick[:/]/i, (m) => (m.toLowerCase().startsWith("kick") ? "kick:" : ""));

  if (!canalAlvo) {
    if (statusRadar) {
      statusRadar.dataset.error = "true";
      statusRadar.textContent = "Escolha uma live online ou digite o nome do canal para escanear.";
    }
    return;
  }

  requisicaoRadarAtiva?.abort();
  const controlador = new AbortController();
  requisicaoRadarAtiva = controlador;

  if (statusRadar) {
    delete statusRadar.dataset.error;
    statusRadar.textContent = `Carregando sala de ${canalAlvo} e paginando jogadores online…`;
  }
  if (btnEscanearLive) btnEscanearLive.disabled = true;
  if (containerProgressoRadar) containerProgressoRadar.hidden = false;
  if (barraProgressoRadar) barraProgressoRadar.style.width = "5%";
  if (textoProgressoRadar) textoProgressoRadar.textContent = "Obtendo lista da sala…";

  try {
    const [canalInfo, primeiraPagina] = await Promise.all([
      buscarJsonApi(`/api/ranking/channel/${encodeURIComponent(canalAlvo)}`, controlador.signal, 9000),
      buscarJsonApi(`/api/ranking/channel/${encodeURIComponent(canalAlvo)}/board?board=now&page=1&size=50`, controlador.signal, 9000),
    ]);

    if (requisicaoRadarAtiva !== controlador) return;

    const totalBoard = primeiraPagina?.total || (primeiraPagina?.items || []).length;
    const totalPaginas = Math.min(12, Math.max(1, Math.ceil(totalBoard / 50)));
    const jogadoresBoard = [...(primeiraPagina?.items || [])];

    if (totalPaginas > 1) {
      const paginasRestantes = Array.from({ length: totalPaginas - 1 }, (_, i) => i + 2);
      const respostasPaginas = await Promise.all(
        paginasRestantes.map((pg) =>
          buscarJsonApi(`/api/ranking/channel/${encodeURIComponent(canalAlvo)}/board?board=now&page=${pg}&size=50`, controlador.signal, 9000).catch(() => null)
        )
      );
      for (const resp of respostasPaginas) {
        if (Array.isArray(resp?.items)) {
          jogadoresBoard.push(...resp.items);
        }
      }
    }

    // Remove eventuais duplicados mantendo ordem
    const vistos = new Set();
    const listaUnica = jogadoresBoard.filter((p) => {
      const k = `${p.login}:${p.cls}`;
      if (!p.login || vistos.has(k)) return false;
      vistos.add(k);
      return true;
    });

    if (textoProgressoRadar) {
      textoProgressoRadar.textContent = `0/${listaUnica.length} perfis carregados…`;
    }

    const perfis = await mapearComConcorrencia(
      listaUnica,
      8,
      controlador.signal,
      async (p) => obterPerfilEmCache(p.login, p.cls, controlador.signal),
      (feitos, total) => {
        if (requisicaoRadarAtiva !== controlador) return;
        const pct = total > 0 ? Math.round((feitos / total) * 100) : 100;
        if (barraProgressoRadar) barraProgressoRadar.style.width = `${pct}%`;
        if (textoProgressoRadar) textoProgressoRadar.textContent = `Analisando equipamentos: ${feitos}/${total} jogadores (${pct}%)…`;
      }
    );

    if (requisicaoRadarAtiva !== controlador) return;

    const perfisValidos = perfis.filter(Boolean);
    ultimosDadosRadar = {
      canalAlvo,
      canalInfo,
      totalBoard,
      perfis: perfisValidos,
    };

    if (containerProgressoRadar) containerProgressoRadar.hidden = true;
    if (statusRadar) {
      statusRadar.textContent = `Varredura concluída em ${canalInfo.displayName || canalAlvo}: ${perfisValidos.length} perfis ativos analisados (alterar o filtro abaixo filtra sem precisar refazer requisições).`;
    }
    renderizarResultadoRadar();
  } catch (erro) {
    if (requisicaoRadarAtiva !== controlador) return;
    if (containerProgressoRadar) containerProgressoRadar.hidden = true;
    if (statusRadar) {
      statusRadar.dataset.error = "true";
      statusRadar.textContent = erro.message || "Não foi possível escanear esta live.";
    }
  } finally {
    if (btnEscanearLive) btnEscanearLive.disabled = false;
  }
}

function verificarFiltroRadarJogador(perfil, filtroItem, filtroClasse, buscaTexto) {
  if (filtroClasse && perfil.cls !== filtroClasse) return false;
  const itens = (perfil.equipped || []).filter((i) => i.slot !== "cosmetic");

  if (filtroItem) {
    if (filtroItem.startsWith("kind:")) {
      const k = filtroItem.slice(5);
      if (!itens.some((i) => i.kind === k)) return false;
    } else if (filtroItem.startsWith("ring:")) {
      const l = Number(filtroItem.slice(5));
      if (!itens.some((i) => i.slot === "ring" && Number(i.look) === l)) return false;
    } else if (filtroItem.startsWith("set:")) {
      const s = filtroItem.slice(4);
      if (!itens.some((i) => i.set === s)) return false;
    }
  }

  if (buscaTexto) {
    const termo = buscaTexto.toLowerCase();
    const textos = [
      perfil.displayName,
      perfil.login,
      ...itens.map((i) => i.name),
      ...itens.map((i) => catalogoArmas[i.kind]?.nome),
      ...itens.map((i) => catalogoConjuntos[i.set]?.nome),
      ...itens.map((i) => (i.slot === "ring" ? catalogoAneis[i.look]?.nome : "")),
      ...itens.flatMap((i) => (i.gems || []).map((g) => g.name)),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    if (!textos.includes(termo)) return false;
  }

  return true;
}

function renderizarResultadoRadar() {
  if (!containerResultadoRadar || !ultimosDadosRadar) return;
  const { canalInfo, perfis } = ultimosDadosRadar;

  const filtroItem = selectRadarItem?.value || "";
  const filtroClasse = selectRadarClasse?.value || "";
  const buscaTexto = (inputRadarBusca?.value || "").trim();

  const totalEscaneados = perfis.length;
  const filtrados = perfis.filter((p) => verificarFiltroRadarJogador(p, filtroItem, filtroClasse, buscaTexto));
  filtrados.sort((a, b) => (b.power || 0) - (a.power || 0));

  const rotuloFiltro = [];
  if (filtroItem) {
    if (filtroItem.startsWith("kind:")) rotuloFiltro.push(catalogoArmas[filtroItem.slice(5)]?.nome || filtroItem);
    else if (filtroItem.startsWith("ring:")) rotuloFiltro.push(catalogoAneis[filtroItem.slice(5)]?.nome || filtroItem);
    else if (filtroItem.startsWith("set:")) rotuloFiltro.push(`Conjunto ${catalogoConjuntos[filtroItem.slice(4)]?.nome || filtroItem}`);
  }
  if (filtroClasse) rotuloFiltro.push(nomesClasses[filtroClasse]);
  if (buscaTexto) rotuloFiltro.push(`"${buscaTexto}"`);
  const descFiltro = rotuloFiltro.length > 0 ? rotuloFiltro.join(" + ") : "todos os jogadores";

  const pctCorrespondencia = totalEscaneados > 0 ? (filtrados.length / totalEscaneados) * 100 : 0;

  // Estatísticas táticas da sala (e recortadas pela classe selecionada nos chips de itens/sets)
  let qtdSingularidade = 0;
  let qtdCronarca = 0;
  let qtdEclipse = 0;
  let qtdRevives = 0;
  const contagemItensSala = new Map();
  const contagemSetsSala = new Map();
  const perfisRecorteClasse = filtroClasse ? perfis.filter((p) => p.cls === filtroClasse) : perfis;
  const baseDivisorChips = Math.max(1, perfisRecorteClasse.length);

  for (const p of perfis) {
    const itens = p.equipped || [];
    const arma = itens.find((i) => i.slot === "weapon");
    const anel = itens.find((i) => i.slot === "ring");
    if (arma?.kind === "singblade") qtdSingularidade++;
    if (arma?.kind === "chronoblade") qtdCronarca++;
    if (anel && (anel.rarity ?? 0) >= 7 && Number(anel.look) === 14) qtdEclipse++;
    if (
      arma?.kind === "emberblade" ||
      arma?.kind === "ankh" ||
      arma?.kind === "worldstaff" ||
      (anel && (anel.rarity ?? 0) >= 6 && (Number(anel.look) === 13 || Number(anel.look) === 15))
    ) {
      qtdRevives++;
    }
  }

  for (const p of perfisRecorteClasse) {
    const itens = p.equipped || [];
    const arma = itens.find((i) => i.slot === "weapon");
    const anel = itens.find((i) => i.slot === "ring");

    if (arma?.kind && (!filtroClasse || catalogoArmas[arma.kind]?.classe === filtroClasse)) {
      const chave = `kind:${arma.kind}`;
      contagemItensSala.set(chave, (contagemItensSala.get(chave) || 0) + 1);
    }
    if (anel && (anel.rarity ?? 0) >= 6 && catalogoAneis[anel.look]) {
      const chave = `ring:${anel.look}`;
      contagemItensSala.set(chave, (contagemItensSala.get(chave) || 0) + 1);
    }
    const setsJogador = new Set(itens.map((i) => i.set).filter(Boolean));
    for (const s of setsJogador) {
      if (!filtroClasse || catalogoConjuntos[s]?.classe === filtroClasse) {
        contagemSetsSala.set(s, (contagemSetsSala.get(s) || 0) + 1);
      }
    }
  }

  const topItens = [...contagemItensSala.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([chave, qtd]) => {
      const nome = chave.startsWith("kind:")
        ? (catalogoArmas[chave.slice(5)]?.nome || chave)
        : (catalogoAneis[chave.slice(5)]?.nome || chave);
      const pct = ((qtd / baseDivisorChips) * 100).toFixed(0);
      const ativo = filtroItem === chave ? "ativo" : "";
      return `<button type="button" class="btn-mini ${ativo}" data-radar-quick-item="${escaparHtml(chave)}">${escaparHtml(nome)}: ${qtd} (${pct}%)</button>`;
    })
    .join("");

  const topSets = [...contagemSetsSala.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([setK, qtd]) => {
      const nome = catalogoConjuntos[setK]?.nome || setK;
      const pct = ((qtd / baseDivisorChips) * 100).toFixed(0);
      const chaveSet = `set:${setK}`;
      const ativo = filtroItem === chaveSet ? "ativo" : "";
      return `<button type="button" class="btn-mini ${ativo}" data-radar-quick-item="${escaparHtml(chaveSet)}">${escaparHtml(nome)}: ${qtd} (${pct}%)</button>`;
    })
    .join("");

  const playersOnlineCanal = canalInfo.playersNow || totalEscaneados;
  const penalidadeSala = 2.5 * playersOnlineCanal;
  const batalhas = Array.isArray(canalInfo.battles) ? canalInfo.battles.slice(0, 5) : [];

  const linhasTabela = filtrados.slice(0, 120).map((p) => {
    const itens = p.equipped || [];
    const arma = itens.find((i) => i.slot === "weapon");
    const anel = itens.find((i) => i.slot === "ring");
    const met = calcularMetricasCombate(p.cls, p.level, p.stats, itens);
    const ehKick = /^kick:/i.test(p.login);
    const nickLimpo = p.login.replace(/^kick:/i, "");
    const plat = ehKick ? "kick" : "twitch";

    const resumoSets = Object.entries(agregarItens(itens).contagemConjuntos)
      .filter(([, cnt]) => cnt >= 2)
      .map(([sk, cnt]) => `${catalogoConjuntos[sk]?.nome || sk} (${cnt})`)
      .join(", ") || "Misto";

    const desempenhoTxt = p.cls === "cleric"
      ? `${formatarNumeroCompacto(met.curaSkillLuzDivina)} cura`
      : `${formatarNumeroCompacto(met.dpsCombateMedio)} DPS`;

    return `
      <tr>
        <td>
          <button type="button" class="link-nick" data-radar-abrir="${escaparHtml(nickLimpo)}" data-radar-plat="${plat}" data-radar-cls="${escaparHtml(p.cls)}">${escaparHtml(p.displayName || nickLimpo)}</button>
          <div class="small muted">${nomesClasses[p.cls] || p.cls} · Nv.${p.level}${ehKick ? " · KICK" : ""}</div>
        </td>
        <td class="num">${formatarNumeroCompacto(p.power || 0)}</td>
        <td>${escaparHtml(arma?.name || "—")}</td>
        <td>${escaparHtml(anel?.name || "—")}</td>
        <td>${escaparHtml(resumoSets)}</td>
        <td class="num">${desempenhoTxt}</td>
        <td class="num">
          ${perfilCarregadoP1 ? `<button type="button" class="btn-mini" data-radar-comparar="${escaparHtml(nickLimpo)}" data-radar-plat="${plat}" data-radar-cls="${escaparHtml(p.cls)}">VS</button>` : ""}
        </td>
      </tr>
    `;
  }).join("");

  const temFiltroAtivo = Boolean(filtroItem || filtroClasse || buscaTexto);

  containerResultadoRadar.innerHTML = `
    <div class="radar-destaque-filtro">
      <div>
        <span class="eyebrow">RESULTADO DO RADAR · ${escaparHtml(canalInfo.displayName || canalInfo.login)}</span>
        <div class="small muted">Filtro: ${escaparHtml(descFiltro)}</div>
      </div>
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
        <strong>${filtrados.length} de ${totalEscaneados} jogadores (${pctCorrespondencia.toFixed(1).replace(".", ",")}%)</strong>
        ${temFiltroAtivo ? `<button type="button" class="btn-mini btn-atalho-ativo" id="btn-radar-limpar-filtros">✕ Limpar Filtros</button>` : ""}
      </div>
    </div>

    <div class="barra-atalhos">
      <span class="rotulo-atalho">🎭 Filtrar Classe (também filtra a lista de itens):</span>
      <button type="button" class="btn-mini ${!filtroClasse ? "ativo" : ""}" data-radar-quick-cls="">Todas (${totalEscaneados})</button>
      ${Object.entries(nomesClasses)
        .map(([ck, cn]) => {
          const qtdCls = perfis.filter((p) => p.cls === ck).length;
          return `<button type="button" class="btn-mini ${filtroClasse === ck ? "ativo" : ""}" data-radar-quick-cls="${ck}">${cn} (${qtdCls})</button>`;
        })
        .join("")}
    </div>

    <div class="grade-cards-info">
      <article class="card-info">
        <h4>Estado da Live Agora</h4>
        <div class="card-info-linha"><span>Onda Atual / Recorde</span><strong>Z${canalInfo.zone || "?"}-W${canalInfo.wave || "?"} · Z${canalInfo.bestZone || "?"}-W${canalInfo.bestWave || "?"}</strong></div>
        <div class="card-info-linha"><span>Jogadores Agora</span><strong>${playersOnlineCanal} (+${penalidadeSala.toFixed(0)}% HP nos monstros)</strong></div>
        <div class="card-info-linha"><span>Guerra de Lives</span><strong>${canalInfo.battleWins || 0}V / ${canalInfo.battleLosses || 0}D</strong></div>
      </article>
      <article class="card-info">
        <h4>Meta Tático na Sala</h4>
        <div class="card-info-linha"><span>Lâminas da Singularidade</span><strong>${qtdSingularidade} (${totalEscaneados ? ((qtdSingularidade / totalEscaneados) * 100).toFixed(0) : 0}%)</strong></div>
        <div class="card-info-linha"><span>Lâminas do Cronarca (Stun)</span><strong>${qtdCronarca}</strong></div>
        <div class="card-info-linha"><span>Anéis Eclipse Arcano</span><strong>${qtdEclipse}</strong></div>
        <div class="card-info-linha"><span>Fontes de Revive</span><strong>${qtdRevives} jogadores</strong></div>
      </article>
    </div>

    ${
      batalhas.length > 0
        ? `<div>
            <div class="small muted" style="margin-bottom:6px;">Últimas Batalhas de Lives:</div>
            <div class="lista-batalhas-live">
              ${batalhas.map((b) => `<span class="chip-batalha ${b.won ? "vitoria" : "derrota"}">${b.won ? "Vitória" : "Derrota"} vs ${escaparHtml(b.opponent || b.opponentLogin)} (${b.myScore}×${b.theirScore})</span>`).join("")}
            </div>
          </div>`
        : ""
    }

    <div>
      <div class="small muted" style="margin-bottom:6px;">Itens mais usados ${filtroClasse ? `por ${nomesClasses[filtroClasse]}` : "nesta live"} (clique para filtrar/desfiltrar):</div>
      <div class="acoes-inline">${topItens || '<span class="small muted">Nenhum dado</span>'}</div>
    </div>

    <div>
      <div class="small muted" style="margin-bottom:6px;">Conjuntos mais usados ${filtroClasse ? `por ${nomesClasses[filtroClasse]}` : "nesta live"} (clique para filtrar/desfiltrar):</div>
      <div class="acoes-inline">${topSets || '<span class="small muted">Nenhum dado</span>'}</div>
    </div>

    <div class="table-wrap">
      <table class="tabela-radar">
        <thead>
          <tr>
            <th scope="col">Jogador</th>
            <th scope="col" class="num">FC</th>
            <th scope="col">Arma</th>
            <th scope="col">Anel</th>
            <th scope="col">Conjunto</th>
            <th scope="col" class="num">Dano / Cura</th>
            <th scope="col" class="num">Ação</th>
          </tr>
        </thead>
        <tbody>
          ${linhasTabela || `<tr><td colspan="7" style="text-align:center;" class="muted">Nenhum jogador na live corresponde a este filtro.</td></tr>`}
        </tbody>
      </table>
    </div>
    ${filtrados.length > 120 ? `<p class="note-compacto">Exibindo os primeiros 120 de ${filtrados.length} jogadores correspondentes (ordenados por FC).</p>` : ""}
  `;

  // Eventos rápidos de filtro e abertura de perfil
  const btnLimparRadar = containerResultadoRadar.querySelector("#btn-radar-limpar-filtros");
  if (btnLimparRadar) {
    btnLimparRadar.addEventListener("click", () => {
      if (selectRadarClasse) selectRadarClasse.value = "";
      popularSeletorItensRadar("");
      if (selectRadarItem) selectRadarItem.value = "";
      if (inputRadarBusca) inputRadarBusca.value = "";
      renderizarResultadoRadar();
    });
  }

  containerResultadoRadar.querySelectorAll("[data-radar-quick-cls]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const novaCls = e.currentTarget.dataset.radarQuickCls || "";
      if (selectRadarClasse) selectRadarClasse.value = novaCls;
      popularSeletorItensRadar(novaCls);
      renderizarResultadoRadar();
    });
  });

  containerResultadoRadar.querySelectorAll("[data-radar-quick-item]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const val = e.currentTarget.dataset.radarQuickItem;
      if (selectRadarItem) {
        selectRadarItem.value = selectRadarItem.value === val ? "" : val;
      }
      renderizarResultadoRadar();
    });
  });

  containerResultadoRadar.querySelectorAll("[data-radar-abrir]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const el = e.currentTarget;
      const nick = el.dataset.radarAbrir;
      const plat = el.dataset.radarPlat;
      const cls = el.dataset.radarCls;
      inputNick.value = nick;
      selectPlataforma.value = plat;
      alternarVisibilidadeAba("equipamentos");
      void consultarPerfil({ nick, plataforma: plat }, cls);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  containerResultadoRadar.querySelectorAll("[data-radar-comparar]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const el = e.currentTarget;
      const nick = el.dataset.radarComparar;
      const plat = el.dataset.radarPlat;
      const cls = el.dataset.radarCls;
      if (inputCompararNick) inputCompararNick.value = nick;
      if (selectCompararPlataforma) selectCompararPlataforma.value = plat;
      alternarVisibilidadeAba("comparacao");
      void dispararComparacao(nick, plat, cls);
    });
  });
}

/* ==========================================================================
   Renderização Principal do Perfil & Comparação Lado a Lado
   ========================================================================== */

function renderizarPerfil(perfil, urlPublica, plataforma) {
  const nomeExibicao = perfil.displayName || perfil.login;
  document.querySelector("#nome-jogador").textContent = nomeExibicao;
  document.querySelector("#plataforma-jogador").textContent =
    plataforma === "kick" ? "KICK" : "TWITCH";
  document.querySelector("#link-json").href = urlPublica.href;

  if (imgAvatar) {
    if (perfil.avatar) {
      imgAvatar.src = perfil.avatar;
      imgAvatar.alt = `Avatar de ${nomeExibicao}`;
      imgAvatar.onerror = () => {
        imgAvatar.hidden = true;
      };
      imgAvatar.hidden = false;
    } else {
      imgAvatar.hidden = true;
    }
  }

  const niveisPorClasse = new Map(
    (perfil.classes ?? []).map((item) => [item.cls, item.level])
  );
  if (perfil.cls && !niveisPorClasse.has(perfil.cls)) {
    niveisPorClasse.set(perfil.cls, perfil.level);
  }

  const opcoesPersonagem = Object.entries(nomesClasses)
    .filter(([chave]) => niveisPorClasse.has(chave))
    .map(([chave, nome]) => {
      const nivel = niveisPorClasse.get(chave);
      const sufixoNivel = nivel ? ` (Nv. ${formatadorInteiro.format(nivel)})` : "";
      return new Option(`${nome}${sufixoNivel}`, chave);
    });

  selectPersonagem.replaceChildren(...opcoesPersonagem);
  selectPersonagem.value = perfil.cls;

  // 1. Aba Forjas: Tabela + Gelo/Fogo + Eventos/Canais
  const linhas = tiposForja.map(({ chave, rotulo, chanceBase }) => {
    const tentativas = perfil.counters?.[`fuse_${chave}_try`] ?? 0;
    const sucessos = perfil.counters?.[`fuse_${chave}_ok`] ?? 0;
    const linha = document.createElement("tr");
    linha.dataset.forge = chave;

    const cabecalho = document.createElement("th");
    cabecalho.scope = "row";
    cabecalho.textContent = rotulo;
    linha.append(cabecalho);

    const valores = [
      formatadorPercentual.format(chanceBase),
      formatadorInteiro.format(tentativas),
      formatadorInteiro.format(sucessos),
      tentativas > 0 && sucessos <= tentativas
        ? formatadorPercentual.format(sucessos / tentativas)
        : "—",
    ];

    for (const valor of valores) {
      const celula = document.createElement("td");
      celula.textContent = valor;
      linha.append(celula);
    }

    return linha;
  });
  corpoTabela.replaceChildren(...linhas);
  renderizarMatrizGeloEFogo(perfil);
  renderizarEventosEConquistas(perfil);

  // 2. Aba Equipamentos, Dano & FC
  renderizarEquipamentosEGemas(perfil);

  // 3. Estado da Comparação, Simulador e Monstros
  perfilCarregadoP1 = perfil;
  plataformaCarregadaP1 = plataforma;
  atualizarCardP1Comparacao(perfil, plataforma);
  atualizarEstadoVazioOuPerfil(true);

  if (!simuladorEditadoManual) {
    importarPerfilParaSimulador(perfil);
  }
  renderizarSimulador();
  renderizarSimuladorMonstros();
  if (ultimosDadosRadar) {
    renderizarResultadoRadar();
  }
}

function atualizarCardP1Comparacao(perfil, plataforma) {
  if (!compararP1Card) return;
  const nome = perfil.displayName || perfil.login;
  const avatarHtml = perfil.avatar
    ? `<img class="p1-card-avatar" src="${escaparHtml(perfil.avatar)}" alt="${escaparHtml(nome)}">`
    : `<div class="p1-card-avatar-placeholder"></div>`;
  compararP1Card.innerHTML = `
    ${avatarHtml}
    <div class="p1-card-info">
      <span class="card-versus-tag-plat">${plataforma.toUpperCase()}</span>
      <div class="p1-card-nome">${escaparHtml(nome)}</div>
      <div class="p1-card-meta">${nomesClasses[perfil.cls] || perfil.cls} · Nv. ${formatadorInteiro.format(perfil.level)}</div>
      <div class="p1-card-fc">${formatadorInteiro.format(perfil.power || 0)} FC</div>
    </div>
  `;

  const loginP1Limpo = String(perfil.login || "").replace(/^kick:/i, "").toLowerCase();
  const topClasseAtual = top1DinamicoPorClasse[perfil.cls] || top1DinamicoPorClasse.warrior;
  const ehMesmoTopClasse = loginP1Limpo === String(topClasseAtual.nick || "").toLowerCase();

  if (btnCompararTop1) {
    if (ehMesmoTopClasse) {
      const ehTopGeral = loginP1Limpo === String(top1GeralDinamico.nick || "").toLowerCase();
      btnCompararTop1.textContent = ehTopGeral ? `👑 Top 1 Geral (Você)` : `👑 vs Top 1 Geral (${top1GeralDinamico.rotulo})`;
      btnCompararTop1.disabled = ehTopGeral;
      btnCompararTop1.onclick = () => {
        inputCompararNick.value = top1GeralDinamico.nick;
        selectCompararPlataforma.value = top1GeralDinamico.plataforma;
        void dispararComparacao(top1GeralDinamico.nick, top1GeralDinamico.plataforma, top1GeralDinamico.cls);
      };
    } else {
      btnCompararTop1.textContent = `⚡ Top 1 ${nomesClasses[perfil.cls] || ""} (${topClasseAtual.rotulo})`;
      btnCompararTop1.disabled = false;
      btnCompararTop1.onclick = () => {
        inputCompararNick.value = topClasseAtual.nick;
        selectCompararPlataforma.value = topClasseAtual.plataforma;
        void dispararComparacao(topClasseAtual.nick, topClasseAtual.plataforma, perfil.cls);
      };
    }
  }

  if (btnCompararWarrior) {
    const topW = top1DinamicoPorClasse.warrior;
    const ehP1W = loginP1Limpo === String(topW.nick || "").toLowerCase();
    btnCompararWarrior.textContent = ehP1W ? `🛡️ Guerreiro (Você)` : `🛡️ vs Guerreiro (${topW.rotulo})`;
    btnCompararWarrior.disabled = ehP1W;
    btnCompararWarrior.onclick = () => {
      inputCompararNick.value = topW.nick;
      selectCompararPlataforma.value = topW.plataforma;
      void dispararComparacao(topW.nick, topW.plataforma, "warrior");
    };
  }

  if (btnCompararCleric) {
    const topC = top1DinamicoPorClasse.cleric;
    const ehP1C = loginP1Limpo === String(topC.nick || "").toLowerCase();
    btnCompararCleric.textContent = ehP1C ? `✨ Clérigo (Você)` : `✨ vs Clérigo (${topC.rotulo})`;
    btnCompararCleric.disabled = ehP1C;
    btnCompararCleric.onclick = () => {
      inputCompararNick.value = topC.nick;
      selectCompararPlataforma.value = topC.plataforma;
      void dispararComparacao(topC.nick, topC.plataforma, "cleric");
    };
  }

  if (btnCompararArcher) {
    const topA = top1DinamicoPorClasse.archer;
    const ehP1A = loginP1Limpo === String(topA.nick || "").toLowerCase();
    btnCompararArcher.textContent = ehP1A ? `🏹 Arqueiro (Você)` : `🏹 vs Arqueiro (${topA.rotulo})`;
    btnCompararArcher.disabled = ehP1A;
    btnCompararArcher.onclick = () => {
      inputCompararNick.value = topA.nick;
      selectCompararPlataforma.value = topA.plataforma;
      void dispararComparacao(topA.nick, topA.plataforma, "archer");
    };
  }
}

async function dispararComparacao(nick2, plataforma2, classeDesejadaP2) {
  if (!perfilCarregadoP1) return;
  if (!/^[a-z0-9_.\-]{1,40}$/i.test(nick2)) {
    statusComparacao.dataset.error = "true";
    statusComparacao.textContent = "Informe um nick válido para o Jogador 2.";
    return;
  }

  delete statusComparacao.dataset.error;
  statusComparacao.textContent = `Consultando ${nick2} na ${plataforma2 === "kick" ? "Kick" : "Twitch"}…`;
  resultadoComparacao.hidden = true;

  try {
    const loginApi2 = plataforma2 === "kick" ? `kick:${nick2}` : nick2;
    const { resposta } = await buscarRespostaPerfil(
      loginApi2,
      classeDesejadaP2 || undefined,
      AbortSignal.timeout(9000)
    );

    if (resposta.status === 404) {
      throw new Error(`Jogador 2 ("${nick2}") não foi encontrado na ${plataforma2.toUpperCase()}.`);
    }
    if (!resposta.ok) {
      throw new Error("Falha ao comunicar com os servidores para consultar o Jogador 2.");
    }

    const perfilP2 = await resposta.json();
    renderizarPainelComparacao(perfilCarregadoP1, plataformaCarregadaP1, perfilP2, plataforma2);
    statusComparacao.textContent = `Comparação atualizada entre ${perfilCarregadoP1.displayName || perfilCarregadoP1.login} (${nomesClasses[perfilCarregadoP1.cls] || perfilCarregadoP1.cls}) e ${perfilP2.displayName || perfilP2.login} (${nomesClasses[perfilP2.cls] || perfilP2.cls}).`;
    resultadoComparacao.hidden = false;
  } catch (erro) {
    statusComparacao.dataset.error = "true";
    statusComparacao.textContent = erro.message || "Erro ao comparar jogadores.";
  }
}

window.trocarClasseComparacaoP2 = function(nick2, plat2, cls2) {
  void dispararComparacao(nick2, plat2, cls2);
};

function renderizarPainelComparacao(p1, plat1, p2, plat2) {
  const at1 = inferirAtributosBase(p1);
  const st1 = calcularStatusSimulados(p1.cls, p1.level, at1, p1.equipped || []);
  const fc1 = calcularFc(p1.cls, st1);
  const stSemItens1 = calcularStatusSimulados(p1.cls, p1.level, at1, []);
  const fcSemItens1 = calcularFc(p1.cls, stSemItens1);
  const ganhoEquips1 = Math.max(0, fc1 - fcSemItens1);
  const agg1 = agregarItens(p1.equipped || []);
  const met1 = calcularMetricasCombate(p1.cls, p1.level, st1, p1.equipped || []);

  const at2 = inferirAtributosBase(p2);
  const st2 = calcularStatusSimulados(p2.cls, p2.level, at2, p2.equipped || []);
  const fc2 = calcularFc(p2.cls, st2);
  const stSemItens2 = calcularStatusSimulados(p2.cls, p2.level, at2, []);
  const fcSemItens2 = calcularFc(p2.cls, stSemItens2);
  const ganhoEquips2 = Math.max(0, fc2 - fcSemItens2);
  const agg2 = agregarItens(p2.equipped || []);
  const met2 = calcularMetricasCombate(p2.cls, p2.level, st2, p2.equipped || []);

  const nome1 = p1.displayName || p1.login;
  const nome2 = p2.displayName || p2.login;
  const p1VenceFc = fc1 >= fc2;
  const diffFc = Math.abs(fc1 - fc2);
  const menorFc = Math.min(fc1, fc2);
  const pctDiffFc = menorFc > 0 ? (diffFc / menorFc) * 100 : 0;
  const vencedorFc = p1VenceFc ? nome1 : nome2;

  const k1 = dadosClasses[p1.cls]?.k || 0.6;
  const k2 = dadosClasses[p2.cls]?.k || 0.6;

  const classesP2 = p2.classes || [];
  const seletorClassesP2 = (classesP2.length > 1)
    ? `<div class="p2-switch-classes" style="display:flex;gap:4px;flex-wrap:wrap;margin-top:6px;">
        ${classesP2.map((c) => `
          <button type="button" class="tag-fc ${c.cls === p2.cls ? "" : "secundaria"}" style="cursor:pointer;font-size:0.75rem;padding:2px 6px;" onclick="window.trocarClasseComparacaoP2('${escaparHtml(p2.login.replace(/^kick:/, ""))}', '${plat2}', '${c.cls}')">
            ${nomesClasses[c.cls] || c.cls}
          </button>
        `).join("")}
      </div>`
    : "";

  const htmlVersus = `
    <div class="bloco-versus-topo">
      <div class="card-versus-jogador ${p1VenceFc ? "vencedor" : ""}">
        ${p1.avatar ? `<img class="card-versus-avatar" src="${escaparHtml(p1.avatar)}" alt="${escaparHtml(nome1)}">` : '<div class="card-versus-avatar"></div>'}
        <div class="card-versus-detalhes">
          <span class="eyebrow">${plat1.toUpperCase()}</span>
          <div class="card-versus-nome">${escaparHtml(nome1)}</div>
          <div class="card-versus-meta">${nomesClasses[p1.cls] || p1.cls} · Nv. ${p1.level}</div>
          <div class="card-versus-fc">${formatadorInteiro.format(fc1)} FC</div>
        </div>
      </div>

      <div class="badge-diferenca-fc">
        <span class="eyebrow">VANTAGEM DE FORÇA</span>
        <strong>${escaparHtml(vencedorFc)}</strong>
        <span>+${formatadorInteiro.format(diffFc)} FC (+${pctDiffFc.toFixed(1)}%)</span>
      </div>

      <div class="card-versus-jogador ${!p1VenceFc ? "vencedor" : ""}">
        ${p2.avatar ? `<img class="card-versus-avatar" src="${escaparHtml(p2.avatar)}" alt="${escaparHtml(nome2)}">` : '<div class="card-versus-avatar"></div>'}
        <div class="card-versus-detalhes">
          <span class="eyebrow">${plat2.toUpperCase()}</span>
          <div class="card-versus-nome">${escaparHtml(nome2)}</div>
          <div class="card-versus-meta">${nomesClasses[p2.cls] || p2.cls} · Nv. ${p2.level}</div>
          <div class="card-versus-fc">${formatadorInteiro.format(fc2)} FC</div>
          ${seletorClassesP2}
        </div>
      </div>
    </div>
  `;

  function gerarLinhaStat(rotulo, v1, v2, formatadorFn) {
    const n1 = Number(v1);
    const n2 = Number(v2);
    const p1Ganhou = n1 > n2;
    const p2Ganhou = n2 > n1;
    const diff = Math.abs(n1 - n2);
    const menor = Math.min(n1, n2);
    const pct = menor > 0 ? (diff / menor) * 100 : 0;
    const tagDiff = diff > 0 ? `<span class="tag-diff pos">+${formatadorFn(diff)} (+${pct.toFixed(1)}%)</span>` : "";

    return `
      <tr>
        <th scope="row">${rotulo}</th>
        <td class="${p1Ganhou ? "vencedor" : ""}">${formatadorFn(n1)} ${p1Ganhou ? tagDiff : ""}</td>
        <td class="${p2Ganhou ? "vencedor" : ""}">${formatadorFn(n2)} ${p2Ganhou ? tagDiff : ""}</td>
      </tr>
    `;
  }

  const fmtInt = (val) => formatadorInteiro.format(Math.round(val));
  const fmtDec1 = (val) => Number(val).toFixed(1);
  const fmtDec2 = (val) => Number(val).toFixed(2);
  const fmtPct1 = (val) => `${Number(val).toFixed(1)}%`;

  const htmlTabelaStats = `
    <div class="secao-comparacao-bloco">
      <h3 class="titulo-secao-comp">Atributos, Dano Real e Cura</h3>
      <div class="table-wrap">
        <table class="tabela-comp">
          <thead>
            <tr>
              <th scope="col">Métrica</th>
              <th scope="col">${escaparHtml(nome1)}</th>
              <th scope="col">${escaparHtml(nome2)}</th>
            </tr>
          </thead>
          <tbody>
            ${gerarLinhaStat("Força de Combate (FC)", fc1, fc2, fmtInt)}
            ${gerarLinhaStat("DPS Real em Combate", met1.dpsCombateMedio, met2.dpsCombateMedio, fmtInt)}
            ${gerarLinhaStat("Golpe Normal Médio (Alvo 0 DEF)", met1.golpeNormalBruto, met2.golpeNormalBruto, fmtInt)}
            ${gerarLinhaStat("Golpe Crítico Médio (Alvo 0 DEF)", met1.golpeCritBruto, met2.golpeCritBruto, fmtInt)}
            ${p1.cls === "cleric" || p2.cls === "cleric" ? gerarLinhaStat("Cura da Luz Divina (Clérigo)", met1.curaSkillLuzDivina, met2.curaSkillLuzDivina, fmtInt) : ""}
            ${gerarLinhaStat("Mitigação de Defesa", met1.reducaoDefesa * 100, met2.reducaoDefesa * 100, fmtPct1)}
            ${gerarLinhaStat("Multiplicador da Classe (k)", k1, k2, fmtDec2)}
            ${gerarLinhaStat("Nível do Personagem", p1.level, p2.level, fmtInt)}
            ${gerarLinhaStat("Ataque (ATK)", st1.atk, st2.atk, fmtDec1)}
            ${gerarLinhaStat("Defesa (DEF)", st1.def, st2.def, fmtDec1)}
            ${gerarLinhaStat("Vida Máxima (HP)", st1.maxHp, st2.maxHp, fmtInt)}
            ${gerarLinhaStat("Velocidade da Ficha (ASPD)", st1.aspd, st2.aspd, fmtDec2)}
            ${gerarLinhaStat("Cadência Real no Combate (Cap 4,6/s)", met1.cadenciaReal, met2.cadenciaReal, (v) => `${Number(v).toFixed(2)}/s`)}
            ${gerarLinhaStat("Bônus Dano por Velocidade (>4,6)", met1.speedBonus, met2.speedBonus, (v) => `${Number(v).toFixed(2)}×`)}
            ${gerarLinhaStat("Taxa de Crítico", st1.crit, st2.crit, fmtPct1)}
            ${gerarLinhaStat("Bônus de Dano Crítico", st1.critDmg * 100, st2.critDmg * 100, fmtPct1)}
            ${gerarLinhaStat("Vida Efetiva (EHP)", met1.ehp, met2.ehp, fmtInt)}
            ${gerarLinhaStat("FC Base (sem itens)", fcSemItens1, fcSemItens2, fmtInt)}
            ${gerarLinhaStat("Ganho com Equipamentos", ganhoEquips1, ganhoEquips2, fmtInt)}
          </tbody>
        </table>
      </div>
    </div>
  `;

  const slotsComparar = ["weapon", "helmet", "armor", "ring"];
  const itensP1 = p1.equipped || [];
  const itensP2 = p2.equipped || [];
  const mediaIlvl1 = itensP1.filter((i) => i.slot !== "cosmetic").reduce((a, b) => a + (b.itemLevel || 0), 0) / Math.max(1, itensP1.filter((i) => i.slot !== "cosmetic").length);
  const mediaIlvl2 = itensP2.filter((i) => i.slot !== "cosmetic").reduce((a, b) => a + (b.itemLevel || 0), 0) / Math.max(1, itensP2.filter((i) => i.slot !== "cosmetic").length);

  function formatarResumoConjuntos(agg) {
    const sets = [];
    for (const [k, count] of Object.entries(agg.contagemConjuntos)) {
      if (count >= 2 && catalogoConjuntos[k]) {
        sets.push(`${catalogoConjuntos[k].nome} (${count}/3)`);
      }
    }
    return sets.length > 0 ? sets.join(" · ") : "Nenhum conjunto ativo";
  }

  const linhasEquipamentos = slotsComparar.map((s) => {
    const it1 = itensP1.find((i) => i.slot === s);
    const it2 = itensP2.find((i) => i.slot === s);
    const desc1 = it1
      ? `<span style="color: ${coresRaridade[it1.rarity] || "#fff"}; font-weight: 600;">${escaparHtml(it1.name)}</span> <small style="color: var(--muted);">(Nv. ${it1.itemLevel || 1})</small>`
      : '<span style="color: var(--muted);">—</span>';
    const desc2 = it2
      ? `<span style="color: ${coresRaridade[it2.rarity] || "#fff"}; font-weight: 600;">${escaparHtml(it2.name)}</span> <small style="color: var(--muted);">(Nv. ${it2.itemLevel || 1})</small>`
      : '<span style="color: var(--muted);">—</span>';
    return `<tr><th scope="row">${nomesSlots[s] || s}</th><td>${desc1}</td><td>${desc2}</td></tr>`;
  }).join("");

  const htmlEquipamentos = `
    <div class="secao-comparacao-bloco">
      <h3 class="titulo-secao-comp">Equipamentos e Conjuntos</h3>
      <div class="table-wrap">
        <table class="tabela-comp">
          <thead>
            <tr>
              <th scope="col">Peça / Métrica</th>
              <th scope="col">${escaparHtml(nome1)}</th>
              <th scope="col">${escaparHtml(nome2)}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Conjunto Ativo</th>
              <td style="color: var(--gold); font-weight: 600;">${escaparHtml(formatarResumoConjuntos(agg1))}</td>
              <td style="color: var(--gold); font-weight: 600;">${escaparHtml(formatarResumoConjuntos(agg2))}</td>
            </tr>
            ${gerarLinhaStat("Média de Item Level", mediaIlvl1, mediaIlvl2, fmtDec1)}
            ${linhasEquipamentos}
          </tbody>
        </table>
      </div>
    </div>
  `;

  const gemas1 = itensP1.flatMap((i) => i.gems || []);
  const gemas2 = itensP2.flatMap((i) => i.gems || []);
  const gemasSupremas1 = gemas1.filter((g) => g.tier === 5).length;
  const gemasSupremas2 = gemas2.filter((g) => g.tier === 5).length;

  const htmlGemas = `
    <div class="secao-comparacao-bloco">
      <h3 class="titulo-secao-comp">Gemas Engastadas</h3>
      <div class="table-wrap">
        <table class="tabela-comp">
          <thead>
            <tr>
              <th scope="col">Estatística de Gemas</th>
              <th scope="col">${escaparHtml(nome1)}</th>
              <th scope="col">${escaparHtml(nome2)}</th>
            </tr>
          </thead>
          <tbody>
            ${gerarLinhaStat("Total de Gemas", gemas1.length, gemas2.length, fmtInt)}
            ${gerarLinhaStat("Gemas Supremas (Tier 5)", gemasSupremas1, gemasSupremas2, fmtInt)}
            ${gerarLinhaStat("Bônus de % DEF nas Gemas", agg1.gemasPercent.def / 10, agg2.gemasPercent.def / 10, fmtPct1)}
            ${gerarLinhaStat("Bônus de % HP nas Gemas", agg1.gemasPercent.hp / 10, agg2.gemasPercent.hp / 10, fmtPct1)}
            ${gerarLinhaStat("Velocidade (SPD) nas Gemas", agg1.gemasFixas.spd, agg2.gemasFixas.spd, fmtInt)}
            ${gerarLinhaStat("Crítico (CRIT) nas Gemas", agg1.gemasFixas.crit, agg2.gemasFixas.crit, fmtInt)}
            ${gerarLinhaStat("Ataque (ATK) nas Gemas", agg1.gemasFixas.atk, agg2.gemasFixas.atk, fmtInt)}
          </tbody>
        </table>
      </div>
    </div>
  `;

  function celulaForja(p, chave) {
    const tryCnt = p.counters?.[`fuse_${chave}_try`] ?? 0;
    const okCnt = p.counters?.[`fuse_${chave}_ok`] ?? 0;
    const taxa = tryCnt > 0 ? ((okCnt / tryCnt) * 100).toFixed(1) + "%" : "—";
    return `${formatadorInteiro.format(okCnt)}/${formatadorInteiro.format(tryCnt)} (${taxa})`;
  }

  const htmlForjas = `
    <div class="secao-comparacao-bloco">
      <h3 class="titulo-secao-comp">Histórico de Forjas</h3>
      <div class="table-wrap">
        <table class="tabela-comp">
          <thead>
            <tr>
              <th scope="col">Raridade</th>
              <th scope="col">${escaparHtml(nome1)}</th>
              <th scope="col">${escaparHtml(nome2)}</th>
            </tr>
          </thead>
          <tbody>
            <tr><th scope="row" style="color: #c77dff;">Épico</th><td>${celulaForja(p1, "epic")}</td><td>${celulaForja(p2, "epic")}</td></tr>
            <tr><th scope="row" style="color: #ff8073;">Imortal</th><td>${celulaForja(p1, "imm")}</td><td>${celulaForja(p2, "imm")}</td></tr>
            <tr><th scope="row" style="color: #ff8de6;">Arcano</th><td>${celulaForja(p1, "arc")}</td><td>${celulaForja(p2, "arc")}</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  resultadoComparacao.innerHTML = `${htmlVersus}${htmlTabelaStats}${htmlEquipamentos}${htmlGemas}${htmlForjas}`;
}

/* ==========================================================================
   Fluxo de Busca Principal e Inicialização
   ========================================================================== */

async function consultarPerfil(jogador, classeDesejada) {
  requisicaoAtiva?.abort();
  const controlador = new AbortController();
  requisicaoAtiva = controlador;

  const nomePlataforma = jogador.plataforma === "kick" ? "Kick" : "Twitch";
  const loginApi = jogador.plataforma === "kick" ? `kick:${jogador.nick}` : jogador.nick;

  delete statusConsulta.dataset.error;
  statusConsulta.textContent = `Consultando ${jogador.nick} na ${nomePlataforma}…`;

  try {
    const { resposta, urlPublica } = await buscarRespostaPerfil(
      loginApi,
      classeDesejada,
      controlador.signal
    );

    if (resposta.status === 404) {
      throw new Error(`Perfil não encontrado na ${nomePlataforma}. Confira o nick ou tente a outra plataforma.`);
    }
    if (!resposta.ok) {
      throw new Error("O RiftStream não respondeu à consulta. Tente novamente.");
    }

    const perfil = await resposta.json();
    if (requisicaoAtiva !== controlador) return;

    if (
      perfil.login?.toLowerCase() !== loginApi.toLowerCase() ||
      !Object.hasOwn(nomesClasses, perfil.cls)
    ) {
      throw new Error("O RiftStream retornou um perfil diferente do solicitado.");
    }

    jogadorAtual = jogador;
    atualizarParametrosUrl(jogador, perfil.cls);
    renderizarPerfil(perfil, urlPublica, jogador.plataforma);

    const poderFormatado = Number.isFinite(perfil.power)
      ? ` · Poder ${formatadorInteiro.format(perfil.power)}`
      : "";
    statusConsulta.textContent = `${nomesClasses[perfil.cls]} · Nível ${formatadorInteiro.format(perfil.level)}${poderFormatado}`;
  } catch (erro) {
    if (requisicaoAtiva !== controlador) return;
    statusConsulta.dataset.error = "true";
    if (erro instanceof TypeError || erro.name === "TimeoutError") {
      statusConsulta.textContent =
        window.location.protocol === "file:"
          ? "Falha de conexão em arquivo local. Abra http://127.0.0.1:4173/ no navegador."
          : "Falha de conexão com a API do RiftStream. Tente novamente em instantes.";
      return;
    }
    statusConsulta.textContent = erro.message;
  }
}

function normalizarEntradaNick(valorBruto, plataformaSelecionada) {
  let texto = String(valorBruto ?? "").trim();
  let plataforma = plataformaSelecionada === "kick" ? "kick" : "twitch";

  const matchRift = texto.match(/riftstream\.com\.br\/perfil\/(?:(kick|twitch)\/)?([a-z0-9_.\-]+)/i);
  if (matchRift) {
    if (matchRift[1]) {
      plataforma = matchRift[1].toLowerCase();
    }
    texto = matchRift[2];
  } else {
    const matchKick = texto.match(/kick\.com\/([a-z0-9_.\-]+)/i);
    const matchTwitch = texto.match(/twitch\.tv\/([a-z0-9_.\-]+)/i);
    if (matchKick) {
      plataforma = "kick";
      texto = matchKick[1];
    } else if (matchTwitch) {
      plataforma = "twitch";
      texto = matchTwitch[1];
    }
  }

  if (/^kick[:/]/i.test(texto)) {
    plataforma = "kick";
    texto = texto.replace(/^kick[:/]/i, "");
  } else if (/^twitch[:/]/i.test(texto)) {
    plataforma = "twitch";
    texto = texto.replace(/^twitch[:/]/i, "");
  }

  const nickLimpo = texto.replace(/^@/, "").trim().toLowerCase();
  return { nick: nickLimpo, plataforma };
}

formularioBusca.addEventListener("submit", (evento) => {
  evento.preventDefault();
  const dados = new FormData(formularioBusca);
  const { nick, plataforma } = normalizarEntradaNick(dados.get("nick"), dados.get("plataforma"));

  if (!/^[a-z0-9_.\-]{1,40}$/i.test(nick)) {
    requisicaoAtiva?.abort();
    requisicaoAtiva = undefined;
    statusConsulta.dataset.error = "true";
    statusConsulta.textContent = `Informe um nick válido (ex. ${top1GeralDinamico.nick} ou nando_sts).`;
    return;
  }

  inputNick.value = nick;
  selectPlataforma.value = plataforma;
  void consultarPerfil({ nick, plataforma });
});

function carregarAtalhoTop(alvo) {
  let item = top1GeralDinamico;
  if (alvo === "warrior") item = top1DinamicoPorClasse.warrior;
  else if (alvo === "cleric") item = top1DinamicoPorClasse.cleric;
  else if (alvo === "archer") item = top1DinamicoPorClasse.archer;
  else if (alvo === "level") item = topLevelDinamico;

  if (!item?.nick) return;
  inputNick.value = item.nick;
  selectPlataforma.value = item.plataforma || "twitch";
  void consultarPerfil({ nick: item.nick, plataforma: item.plataforma || "twitch" }, item.cls);
}

if (btnCarregarExemplo) {
  btnCarregarExemplo.addEventListener("click", () => carregarAtalhoTop("top1"));
}

document.querySelectorAll("[data-top-alvo]").forEach((btn) => {
  btn.addEventListener("click", () => carregarAtalhoTop(btn.dataset.topAlvo));
});

document.querySelectorAll("[data-top-atalho]").forEach((btn) => {
  btn.addEventListener("click", () => carregarAtalhoTop(btn.dataset.topAtalho));
});

if (formComparar) {
  formComparar.addEventListener("submit", (evento) => {
    evento.preventDefault();
    const dados = new FormData(formComparar);
    const { nick, plataforma } = normalizarEntradaNick(dados.get("nick2"), dados.get("plataforma2"));
    void dispararComparacao(nick, plataforma);
  });
}

selectPersonagem.addEventListener("change", () => {
  if (jogadorAtual) {
    void consultarPerfil(jogadorAtual, selectPersonagem.value);
  }
});

if (btnSimImportar) {
  btnSimImportar.addEventListener("click", () => {
    if (!perfilCarregadoP1) {
      statusConsulta.dataset.error = "true";
      statusConsulta.textContent = "Consulte um jogador primeiro para importar a build dele.";
      return;
    }
    importarPerfilParaSimulador(perfilCarregadoP1);
    renderizarSimulador();
  });
}

if (btnSimResetar) {
  btnSimResetar.addEventListener("click", () => {
    estadoSimulador = criarModeloSimuladorPadrao();
    simuladorEditadoManual = false;
    renderizarSimulador();
  });
}

// Eventos da aba Monstros & Boss
[inputMonstroZona, inputMonstroOnda, inputMonstroJogadores, selectMonstroOrigem].forEach((el) => {
  el?.addEventListener("input", renderizarSimuladorMonstros);
  el?.addEventListener("change", renderizarSimuladorMonstros);
});

if (formMonstros) {
  formMonstros.addEventListener("submit", (e) => {
    e.preventDefault();
    renderizarSimuladorMonstros();
  });
}

if (selectMonstroLiveSync) {
  selectMonstroLiveSync.addEventListener("change", async (e) => {
    const canal = e.target.value;
    if (!canal) return;
    try {
      const info = await buscarJsonApi(`/api/ranking/channel/${encodeURIComponent(canal)}`, undefined, 7000);
      if (info.zone) inputMonstroZona.value = info.zone;
      if (info.wave) inputMonstroOnda.value = info.wave;
      if (info.playersNow) inputMonstroJogadores.value = info.playersNow;
      renderizarSimuladorMonstros();
    } catch {
      // Ignora erro pontual de sincronia
    }
  });
}

// Eventos da aba Radar de Live
if (btnAtualizarLivesOnline) {
  btnAtualizarLivesOnline.addEventListener("click", () => {
    void carregarPanoramaGlobal();
  });
}

if (selectRadarLives) {
  selectRadarLives.addEventListener("change", (e) => {
    if (e.target.value && inputRadarCanal) {
      inputRadarCanal.value = e.target.value;
    }
  });
}

if (formRadarLive) {
  formRadarLive.addEventListener("submit", (e) => {
    e.preventDefault();
    void escanearLiveSelecionada();
  });
}

selectRadarClasse?.addEventListener("change", () => {
  popularSeletorItensRadar(selectRadarClasse.value);
  if (ultimosDadosRadar) renderizarResultadoRadar();
});

selectRadarItem?.addEventListener("change", () => {
  if (ultimosDadosRadar) renderizarResultadoRadar();
});

inputRadarBusca?.addEventListener("input", () => {
  if (ultimosDadosRadar) renderizarResultadoRadar();
});

async function atualizarPlaceholderTop1() {
  try {
    const dados = await buscarJsonApi("/api/ranking/characters?page=1&size=1", undefined, 5000);
    const top1 = dados?.items?.[0];
    if (top1?.login) {
      const nickLimpo = top1.login.replace(/^kick:/i, "");
      if (!inputNick.value) {
        inputNick.placeholder = `Ex. ${nickLimpo}`;
      }
      if (inputCompararNick && !inputCompararNick.value) {
        inputCompararNick.placeholder = `Ex. ${nickLimpo}`;
      }
    }
  } catch {
    // Mantém placeholders padrão
  }
}

// Inicialização imediata da interface
configurarAbas();
alternarVisibilidadeAba("forjas");
atualizarEstadoVazioOuPerfil(false);
popularSeletorItensRadar();
renderizarSimulador();
renderizarSimuladorMonstros();
sincronizarTextosTopsUI();
void carregarPanoramaGlobal();

const parametrosIniciais = new URLSearchParams(window.location.search);
const nickInicial = parametrosIniciais.get("nick");
if (nickInicial) {
  const { nick, plataforma } = normalizarEntradaNick(
    nickInicial,
    parametrosIniciais.get("plataforma")
  );
  const classeInicial = parametrosIniciais.get("cls");
  const abaInicial = parametrosIniciais.get("aba");
  if (abaInicial && Object.hasOwn(secoesAbas, abaInicial)) {
    alternarVisibilidadeAba(abaInicial);
  }
  if (/^[a-z0-9_.\-]{1,40}$/i.test(nick)) {
    inputNick.value = nick;
    selectPlataforma.value = plataforma;
    void consultarPerfil(
      { nick, plataforma },
      Object.hasOwn(nomesClasses, classeInicial) ? classeInicial : undefined
    );
  }
}
