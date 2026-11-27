import {
  catalogoAneis,
  catalogoArmas,
  catalogoConjuntos,
  catalogoGemas,
  coresRaridade,
  nomesClasses,
  nomesRaridade,
} from "./dados.mjs";
import { calcularFc, calcularStatusSimulados } from "./combate.mjs";
import { aplicarAtributosPadraoNoItem, criarGemaPreset, limitarTierGema, sortearRolagemGema } from "./simulador/estado.mjs";
import { escaparHtml, formatarNumeroCompacto } from "./formato.mjs";
import { renderizarFichaFc } from "./tierlist-ficha.mjs";

const containerTabela = document.querySelector("#tierlist-tabela");
const containerDetalhe = document.querySelector("#tierlist-detalhe");
const descricaoModo = document.querySelector("#tierlist-descricao-modo");
const controlesFc = document.querySelector("#tierlist-controles-fc");
const filtroRaridade = document.querySelector("#tierlist-raridade");
const buscaItem = document.querySelector("#tierlist-busca");
const filtroArmas = document.querySelector('[data-tl-cat="weapon"]');
const selectAnelReferencia = document.querySelector("#tierlist-anel-referencia");

let modoAtual = "utilidade"; // "utilidade" | "fc"
let categoriaAtual = "todos"; // "todos" | "warrior" | "archer" | "cleric" | "ring" | "weapon"
let itemSelecionadoId = null;

const NIVEL_ITEM_REFERENCIA = 300;
const NIVEL_PERSONAGEM_REFERENCIA = 750;
const ATRIBUTOS_REFERENCIA = { str: 140, agi: 140, vit: 140, def: 140, luk: 140 };
const gemasPorSlot = new Map();
let pecaSelecionada = "weapon";
let engasteSelecionado = 0;
let anelReferencia = 0;

const UTILIDADE_CONJUNTOS = {
  royalclock: { novo: true, tier: "S+", prioridade: 29, tag: "Revive + recarga do grupo", motivo: "O pulso de 14s revive um aliado com 45% de vida e logo cura 14% da vida máxima de cada herói, inclusive do revivido, que fica com cerca de 59%. O pulso também deixa em no máximo 0,5s a recarga restante das habilidades de classe do grupo.", limite: "Levanta um aliado por pulso. As passivas periódicas de armas e anéis têm recarga própria." },
  steamknight: { novo: true, tier: "S", prioridade: 158, tag: "Escudo pessoal + três golpes", motivo: "Ataca o inimigo com mais vida atual e se protege com escudo de 6% da vida máxima por 6s a cada 12s.", limite: "A proteção é pessoal e os três golpes da passiva não acionam o eco do Eclipse Arcano." },
  tesladuel: { novo: true, tier: "S", prioridade: 146, tag: "Quatro golpes + atordoamento", motivo: "A cada 10s concentra quatro golpes no inimigo com mais vida atual. O último pulso atordoa os inimigos visíveis.", limite: "O atordoamento do chefe dura só 0,2s e a arma não oferece escudo nem cura." },
  etheralch: { novo: true, tier: "A", prioridade: 215, tag: "Dano em área + cura reativa", motivo: "A cada 13s acerta os inimigos visíveis e cura o aliado mais ferido em 4% da vida máxima por alvo, até cinco curas.", limite: "Contra um chefe isolado vem apenas uma cura de 4%. Sem escudo ou revive." },
  aeronaut: { novo: true, tier: "S", prioridade: 137, tag: "Cinco bombas (10s)", motivo: "As cinco bombas podem somar 7,5× ATK por ciclo contra um chefe isolado, além do dano em área quando há inimigos próximos.", limite: "As bombas escolhem alvos aleatórios e podem dispersar o dano. Não oferece sustentação." },
  madtinker: { novo: true, tier: "S", prioridade: 149, tag: "Seis disparos + controle", motivo: "A cada 9s dispara seis tiros de 0,9× ATK. Cada tiro pode atordoar, somando dano e pequenas interrupções.", limite: "Os tiros escolhem alvos aleatórios, o atordoamento dura 0,2s em chefes e não há proteção ao grupo." },
  singular: { tier: "S+", prioridade: 20, tag: "Dano %HP em chefes", motivo: "A implosão tira 4% da vida máxima do chefe a cada 13s ignorando defesa. Com Eclipse Arcano sobe para 4,8% em média, e com Sanguessuga recupera muita vida de uma vez.", limite: "Tem 1,4s de atraso no pulso e usa atributos base e 5 engastes de Imortal." },
  strongman: { tier: "S", prioridade: 105, tag: "Tanque + controle", motivo: "Maior vida e defesa do jogo na linha de frente (segura mais sangramento entre curas), somando alto ataque na marreta e atordoamento em área a cada 12s.", limite: "A onda só alcança 140 px (não pega assassinos na retaguarda), o stun dura 0,5s em chefes e só cai no Circo." },
  tamer: { tier: "S", prioridade: 115, tag: "DPS contínuo + sangramento", motivo: "Combina +34% VEL nas peças e boa vida, além de aplicar sangramento que ignora defesa em todos os inimigos a cada 11s.", limite: "Não traz atordoamento, escudo ou revive para segurar picos na Raid e só cai no Circo dos Horrores." },
  thunderlord: { tier: "S", prioridade: 148, tag: "Dano + stun em cadeia", motivo: "A cada 11s dispara raio em cadeia que causa alto dano e interrompe até cinco inimigos (1,1s em lacaios / 0,45s em chefe).", limite: "Tem metade da vida bruta do Homem-Forte (~87k HP no cenário padrão), ficando mais exposto a sangramento na frente." },
  chrono: { tier: "S", prioridade: 150, tag: "Controle da tela toda", motivo: "Maior atordoamento entre as armas: a cada 14s congela todos os inimigos visíveis por 1,7s (0,9s em chefes), parando inclusive assassinos na retaguarda.", limite: "A passiva não adiciona dano direto e o conjunto usa base Imortal." },
  ember: { tier: "S", prioridade: 155, tag: "Auto-revive cumulativo", motivo: "Maior vida entre os Imortais do Guerreiro e renasce com 60% HP + 30% escudo na Raid (onde não há revive por tempo), acumulando com Fênix Rubra ou Coração do Vazio.", limite: "O revive funciona uma vez por jornada ou Raid e entrega o menor DPS entre os conjuntos da lista." },
  obsidian: { tier: "A", prioridade: 220, tag: "Escudo individual", motivo: "Muita vida e defesa para aguentar dano contínuo, com onda de magma e escudo próprio de 10% do HP máximo a cada 12s.", limite: "O escudo protege só o portador (sem ajudar o grupo, atordoar inimigos ou reviver na Raid) e tem baixo ataque bruto." },
  gore: { tier: "B", prioridade: 330, tag: "Janela de roubo de vida", motivo: "A Ceifa-Reis dá +60% de ataque e 25% de roubo de vida em dano direto por 4s a cada 12s.", limite: "Passa 8s do ciclo sem sustentação e tem a menor vida do Guerreiro, ficando vulnerável a sangramentos." },

  auroraborealis: { tier: "S+", prioridade: 66, tag: "Escudo em grupo (12s)", motivo: "Maior vida do Arqueiro, ótimo DPS contínuo e escudo de 10% do HP máximo para cada aliado a cada 12s — passa de 100% da barra e evita mortes por 2 hits ou sangramento.", limite: "Entrega menos DPS puro que o Trapezista por usar a curva base padrão (~3,35 ATK/nv no arco)." },
  trapeze: { tier: "S+", prioridade: 74, tag: "DPS sustentado (9s)", motivo: "É uma das armas de maior DPS sustentado do Arqueiro entre as peças com curva medida. Encurtar a luta evita chegar a estágios altos de Fúria.", limite: "Vida base mais baixa e sem escudo ou autocura própria; só cai no Circo dos Horrores." },
  abysshunter: { tier: "S", prioridade: 125, tag: "Alvo certo + autocura", motivo: "A cada 11s foca garantidamente o inimigo de maior vida atual (3,2× sem desperdiçar em lacaio) e cura 8% do próprio HP, aliviando o trabalho do Clérigo.", limite: "Com a curva base de ~3,35 ATK/nv e +8% VEL, tem DPS bem menor que o Trapezista e só protege o próprio portador." },
  firework: { tier: "S", prioridade: 140, tag: "Explosão de ataque", motivo: "Maior ataque bruto nas peças do Arqueiro com +90% ATK de conjunto e foguete de 2,4× a cada 10s.", limite: "Sorteia o alvo principal entre os inimigos visíveis (podendo acertar lacaio), tem a menor vida Arcana e zero proteção." },
  tempest: { tier: "A", prioridade: 260, tag: "Cadência dobrada", motivo: "Dobra a cadência dos ataques básicos por 4s a cada 12s, mantendo ótimo DPS Imortal mesmo contra chefe isolado.", limite: "Janela temporária sem proteção própria e sem reduzir a recarga da Rajada de Flechas." },
  predator: { tier: "A", prioridade: 270, tag: "100% crítico (ciclo 9s)", motivo: "Ciclo curto que garante 100% de crítico por 3,5s a cada 9s.", limite: "Menor vida entre todos os conjuntos da lista, exigindo proteção do grupo contra sangramento." },
  luna: { tier: "B", prioridade: 315, tag: "VEL + ricochete (10s)", motivo: "Soma +34% VEL nas peças (superando o Dragão Ancestral até em alvo único via SpeedBonus) e ricocheteia 55% do dano em +2 inimigos por 4s a cada 10s.", limite: "O ganho do ricochete depende de lacaios próximos e não oferece sustentação." },
  dragon: { tier: "C", prioridade: 350, tag: "Baforada em área", motivo: "Bônus percentual de ataque e baforada de 2,4× nos inimigos visíveis a cada 12s.", limite: "Baixa velocidade nas peças (+8% VEL), menor DPS sustentado e nenhuma utilidade defensiva." },

  worldtree: { tier: "S+", prioridade: 30, tag: "Revive ou cura em grupo", motivo: "Em um pulso de 15s, revive um aliado com 50% de vida e aplica a cura de 8% a todo o grupo, inclusive ao revivido. Se todos já estiverem vivos, cura 16% da vida máxima de cada um.", limite: "Levanta um aliado por pulso. Seu destaque é a cura recorrente em grupos que permanecem de pé." },
  fortune: { tier: "S+", prioridade: 40, tag: "Escudo 25% (ciclo 12s)", motivo: "A cada 12s dá escudo de 25% HP por 7s (evita combo de 2 hits no teto de 60% e absorve sangramento sem desperdiçar em sobrecura) + 10% cura, com a maior vida do Clérigo.", limite: "Luz Divina direta menor (o que raramente faz falta, já que curas gigantes costumam sobrar em sobrecura); só cai no Circo." },
  seraphgold: { tier: "S+", prioridade: 50, tag: "Salva <50% HP + escudo", motivo: "A cada 14s cura cada aliado em 20% HP — subindo para 30% em quem ficou abaixo de metade da vida após uma pancada — e aplica 8% de escudo no grupo.", limite: "Menos vida e defesa próprias nas peças que a Madame Cartomante e não levanta aliados já caídos." },
  communion: { tier: "S", prioridade: 110, tag: "Cura 25% + 30% ATK (12s)", motivo: "Ciclo rápido de 12s que cura 25% do HP máximo dos aliados vivos e dá +30% de ataque ao grupo inteiro por 5s, encurtando a luta contra o chefe.", limite: "Não aplica escudo acima de 100% da vida para segurar dois golpes pesados seguidos." },
  constel: { tier: "S", prioridade: 145, tag: "Escudo 20% em grupo", motivo: "Concede escudo garantido de 20% do HP máximo de cada aliado por 6s a cada 16s — amplia a barra efetiva acima de 100%, valendo mais na prática que sobrecura.", limite: "Ciclo de 16s mais lento que o da Cartomante e sem cura embutida no pulso." },
  illusion: { tier: "A", prioridade: 205, tag: "Ciclo 10s (aleatório)", motivo: "Boa vida própria e maior Luz Divina direta do Clérigo, além de puxar uma carta a cada 10s (cura 40%, escudo 12% ou dano 1,6×).", limite: "Boa parte da Luz Divina gigante vira sobrecura em aliados leves, e em 1/3 das cartas sai ataque quando o grupo precisava de proteção." },
  eclipsepriest: { tier: "A", prioridade: 255, tag: "Dano + mini-stun (15s)", motivo: "Alto ataque e passiva em área a cada 15s que interrompe inimigos por 1,3s (0,5s em chefes).", limite: "Zero escudo ou cura na passiva, vida baixa para o suporte (~83k HP) e ataque extra desperdiçado em sobrecura na Luz Divina." },
  echo: { tier: "C", prioridade: 340, tag: "Reset da Luz Divina", motivo: "A cada 18s prepara reset para lançar duas Luzes Divinas seguidas.", limite: "Duas curas diretas seguidas costumam desperdiçar muito em sobrecura sem proteger contra o próximo pico; menor vida do Clérigo e sem escudo ou revive." },
  berserker: { tier: "C", prioridade: 400, tag: "Ataque e crítico", motivo: "Bom conjunto de entrada para o Guerreiro que quer combinar ataque, vida e crítico.", limite: "O Machado Sanguinário usa o Golpe Giratório padrão. O conjunto oferece apenas atributos." },
  cosmicvan: { tier: "C", prioridade: 410, tag: "Ataque, vida e defesa", motivo: "Combina ataque com vida e defesa para a linha de frente.", limite: "O Sabre de Plasma mantém o Golpe Giratório padrão." },
  lunar: { tier: "C", prioridade: 405, tag: "Vida e defesa", motivo: "Vida e defesa ajudam o Clérigo a se manter vivo enquanto cura com a Luz Divina.", limite: "O Cajado Lunar usa a Luz Divina padrão." },
  oracle: { tier: "C", prioridade: 415, tag: "Vida e ataque", motivo: "Dá vida ao Clérigo e melhora o poder de cura graças ao ataque e à velocidade.", limite: "O Cajado Orbital usa a Luz Divina padrão." },
  wind: { tier: "C", prioridade: 420, tag: "Velocidade e crítico", motivo: "Combina ataque, velocidade e crítico para o Arqueiro.", limite: "A Rajada de Flechas do Yumi é a padrão da classe." },
  etehunter: { tier: "C", prioridade: 425, tag: "Foco em crítico", motivo: "O bônus bruto de crítico ajuda o Arqueiro a subir o dano, inclusive acima do teto da chance de crítico.", limite: "O Arco de Plasma mantém a Rajada de Flechas padrão." },
};

const UTILIDADE_ARMAS = {
  reaper: {
    tier: "S",
    prioridade: 199,
    tag: "Execução + cura em grupo",
    motivo: "A Ceifa de Almas executa lacaios com até 20% de vida, ignorando a DEF. A vida que tira dos alvos cura o Guerreiro em 40% e cada aliado vivo em 12%. Nas ondas altas e nas Raids com lacaios resistentes, uma execução pode recuperar boa parte da vida do grupo.",
    limite: "Contra um chefe isolado, a cura depende do dano da Ceifa. A Foice tem 4 engastes, contra 5 nas Imortais e 6 nas Arcanas. Trocar só a arma de um conjunto completo também custa o bônus de 3 peças.",
    detalhes: [
      "Com Eclipse Arcano, o golpe da Ceifa ricocheteia 60% do dano em até dois alvos próximos e tem 20% de chance de repetir o dano no alvo principal. Esse eco no mesmo alvo entra na conta da cura.",
      "A execução não aciona o anel. O dano do ricochete em outros inimigos fica fora da cura daquele golpe, mas pode deixá-los na faixa de execução para a próxima Ceifa ou para um golpe posterior da mesma Ceifa.",
    ],
  },
  magmablade: { tier: "B", prioridade: 310, tag: "Onda de choque frontal", motivo: "O Terremoto percorre a frente do Guerreiro, atinge os inimigos no caminho e interrompe chefes por 0,25s.", limite: "A recarga é 20% maior que a do Golpe Giratório e a onda segue para a frente." },
  chainblade: { tier: "B", prioridade: 303, tag: "Agrupa e interrompe", motivo: "Puxa até seis inimigos à frente e aplica atordoamento de 0,7s. É útil para juntar alvos alcançáveis perto do Guerreiro.", limite: "Chefes recebem o golpe sem serem puxados. A recarga da habilidade aumenta 10%." },
  shockblade: { tier: "C", prioridade: 380, tag: "Descarga na tela", motivo: "A Descarga Elétrica atinge os inimigos na tela e aplica uma lentidão breve.", limite: "A lentidão dura só 0,15s e a recarga da habilidade aumenta 15%." },
  axe: { nome: "Machado Berserker", tier: "C", prioridade: 384, tag: "Giro mais frequente", motivo: "O Golpe Giratório ganha alcance e 20% de dano, com recarga 25% menor.", limite: "O efeito depende de estar perto do alvo e só oferece dano." },
  hammer: { nome: "Martelo de Guerra", tier: "C", prioridade: 386, tag: "Dano em alvos juntos", motivo: "Ataques básicos acertam inimigos colados no alvo com metade do dano. O Golpe Giratório também ganha alcance e 10% de dano.", limite: "O dano colateral depende de inimigos próximos do alvo principal." },
  greatsword: { nome: "Montante", tier: "C", prioridade: 388, tag: "Golpe amplo e empurrão", motivo: "O Golpe Devastador acerta os inimigos à frente com 80% a mais de dano que a habilidade padrão e empurra lacaios.", limite: "A recarga é 20% maior e chefes recebem dano sem o empurrão." },
  dawnscepter: { tier: "A", prioridade: 230, tag: "Escudo para o grupo", motivo: "A Égide da Aurora protege cada aliado por 6s com um escudo de 120% do poder de cura do Clérigo e cura imediatamente em 30% desse mesmo poder.", limite: "A recarga aumenta 20%. O escudo depende dos atributos do Clérigo e vale conferir o tamanho dele ao trocar uma arma de raridade maior." },
  ankh: { tier: "A", prioridade: 212, tag: "Revive com a Luz Divina", motivo: "Ao usar a habilidade, revive um aliado com 55% da vida máxima e aplica a cura em grupo, inclusive no aliado revivido.", limite: "A habilidade tem recarga 30% maior e usa 75% da potência da Luz Divina padrão." },
  tome: { tier: "B", prioridade: 300, tag: "Luz Divina mais frequente", motivo: "Aumenta em 15% a cura direta e em grupo e reduz em 30% a recarga da Luz Divina.", limite: "Pode produzir sobrecura e não oferece escudo nem revive." },
  lantern: { tier: "B", prioridade: 306, tag: "Cura persistente em área", motivo: "Cria uma zona sagrada por 4s que cura aliados e fere inimigos que estiverem dentro dela.", limite: "O alcance depende de onde o grupo está. A habilidade tem recarga 25% maior." },
  froststaff: { tier: "B", prioridade: 313, tag: "Congela até três inimigos", motivo: "A Prisão de Gelo causa dano e congela até três inimigos por meio segundo.", limite: "O congelamento ocupa o lugar da cura em grupo. As curas individuais continuam disponíveis." },
  sunstaff: { tier: "C", prioridade: 377, tag: "Cura e dano na tela", motivo: "A Luz Divina cura 30% a mais e a mesma habilidade causa dano aos inimigos visíveis.", limite: "A força da cura depende dos atributos e o efeito não dá escudo." },
  voidstaff: { tier: "C", prioridade: 382, tag: "Vórtice e dano em área", motivo: "Agrupa inimigos comuns num vórtice que causa dano e termina em uma implosão.", limite: "Chefes não são puxados. A habilidade substitui a cura em grupo e demora 30% a mais para recarregar." },
  starbow: { tier: "C", prioridade: 361, tag: "Meteoro de alto impacto", motivo: "O meteoro causa cerca de 3,52× ATK no centro e metade disso nos arredores. Os atingidos ficam lentos.", limite: "O impacto chega após 0,8s e a habilidade tem recarga 25% maior." },
  piercebow: { tier: "C", prioridade: 367, tag: "Atravessa a fileira", motivo: "A Flecha Perfurante atravessa os inimigos na fileira do alvo e causa 2,2× ATK em cada um.", limite: "O alcance lateral é limitado à fileira. A habilidade tem recarga 10% maior." },
  prismbow: { tier: "C", prioridade: 372, tag: "Ricochete em até seis alvos", motivo: "A Flecha Prisma começa com cerca de 1,40× ATK e perde 8% do dano a cada salto.", limite: "Precisa de outros inimigos próximos para aproveitar os ricochetes. A recarga aumenta 10%." },
  crossbow: { tier: "C", prioridade: 374, tag: "Tiros mais pesados", motivo: "Ataques básicos causam 50% a mais de dano e a Rajada recebe 25% a mais de dano.", limite: "O intervalo dos ataques básicos é 35% maior." },
  stormbow: { tier: "C", prioridade: 381, tag: "Rajada mais frequente", motivo: "A Rajada atinge até cinco inimigos e recarrega 15% mais rápido.", limite: "Em alvo único, o número maior de alvos não gera disparos extras." },
  rainbow: { tier: "C", prioridade: 385, tag: "Chuva de flechas em área", motivo: "Espalha 22 flechas pela região do alvo. Pode atingir mais de uma vez quem ficar dentro da área.", limite: "As flechas se espalham por posições diferentes. A habilidade tem recarga 20% maior." },
};

const UTILIDADE_ANEIS = {
  17: { tier: "S+", prioridade: 10, tag: "Purifica + escudo (10s)", motivo: "Melhor utilidade de grupo: a cada 10s limpa sangramento, silêncio e stun de todos, dá 3s de imunidade, escudo em grupo (12% do HP do portador) e cura 8% no mais ferido.", limite: "O escudo dura 4s e fica bem mais forte se o portador tiver muita vida (Guerreiro ou Clérigo tanque)." },
  15: { tier: "S+", prioridade: 55, tag: "Auto-revive 70% + escudo", motivo: "Segunda vida essencial na Raid: renasce na hora com 70% HP + 40% de escudo por 5s (evitando cair de novo no mesmo instante), somando alta vida e defesa.", limite: "A ressurreição funciona uma vez por jornada ou Raid." },
  14: { tier: "S+", prioridade: 60, tag: "Eco sem recarga", motivo: "Atua em todos os golpes e skills elegíveis sem tempo de espera: ricocheteia 60% em 2 alvos e tem 20% de chance de repetir 100% do dano (inclusive Singularidade).", limite: "O eco de 20% é probabilístico e não oferece defesa nem ressurreição." },
  11: { tier: "S", prioridade: 160, tag: "Roubo de vida contínuo", motivo: "Recupera 8% de todo dano direto em cada acerto sem depender da recarga do Clérigo, curando muito em conjunto com Singularidade ou alta cadência.", limite: "Exige continuar batendo vivo e não impede morte caso falte vida/escudo entre dois golpes." },
  13: { tier: "S", prioridade: 168, tag: "Auto-revive na Raid", motivo: "Garante uma ressurreição imediata (40% HP + 20% escudo) na Raid onde não há revive por tempo, podendo somar com a Brasa Eterna.", limite: "Atributos base de Imortal e volta com menos vida/escudo que o Coração do Vazio." },
  19: { tier: "S", prioridade: 175, tag: "Escudo pessoal + lentidão", motivo: "Após 3s em combate e depois a cada 8s, ganha escudo de 15% da vida por 4s e desacelera os inimigos visíveis por 3s.", limite: "O escudo é pessoal. Curva medida em 1 amostra real (Nv. 225); pode variar ligeiramente com mais amostras." },
  18: { tier: "S", prioridade: 182, tag: "Veneno + dano condicional", motivo: "Críticos envenenam por 4s (50% do ATK por segundo). Seus golpes causam 20% a mais de dano contra alvos que já sofrem veneno ou sangramento.", limite: "Compartilha o efeito de sangramento e não oferece escudo nem revive." },
  16: { tier: "A", prioridade: 230, tag: "Depende de abates", motivo: "Acumula até +40% ATK e dispara ceifa em área a cada 10 inimigos abatidos na live.", limite: "Contra chefes isolados ou sem lacaios constantes, a passiva quase não roda." },
  10: { tier: "A", prioridade: 295, tag: "Sangramento (2,5s)", motivo: "Aplica sangramento contínuo (25% ATK/s por 2,5s) que ignora defesa em chefes muito resistentes.", limite: "Precisa bater sem parar para renovar os 2,5s e tem atributos baixos de Imortal." },
  12: { tier: "B", prioridade: 310, tag: "Só nos 30% finais", motivo: "Aumenta em +60% o dano direto (incluindo Singularidade) quando o chefe já está com 30% de vida ou menos.", limite: "Passa os primeiros 70% da luta desligado e sem ajudar a sobreviver." },
};

function calcularFcReferencia(classe, pecas) {
  const itens = pecas.map((peca) => {
    const item = { ...peca };
    item.itemLevel = NIVEL_ITEM_REFERENCIA;
    item.sockets = ({ 3: 3, 4: 4, 6: 5, 7: 6 })[item.rarity];
    const engastes = Array.from({ length: item.sockets }, (_, index) => gemasPorSlot.get(`${item.slot}:${index}`) || {});
    item.tiersEngastes = engastes.map(({ tier }) => limitarTierGema(tier, item.rarity));
    aplicarAtributosPadraoNoItem(item);
    item.gems = engastes.map(({ tipo = "topaz", rolagem = 1 }, index) =>
      criarGemaPreset(tipo, item.slot, item.tiersEngastes[index], item.itemLevel, rolagem));
    return item;
  });
  const status = calcularStatusSimulados(classe, NIVEL_PERSONAGEM_REFERENCIA, ATRIBUTOS_REFERENCIA, itens);
  const statusBase = calcularStatusSimulados(classe, NIVEL_PERSONAGEM_REFERENCIA, ATRIBUTOS_REFERENCIA, []);
  return { classe, itens, status, fc: calcularFc(classe, status), fcBase: calcularFc(classe, statusBase) };
}

const UTILIDADE_ANEIS_POR_CLASSE = {
  warrior: {
    14: { tier: "S+", prioridade: 25, tag: "Dano em chefes", motivo: "Primeira escolha ofensiva com Singularidade: a implosão de 4% sobe para 4,8% da vida máxima do chefe em média por ciclo (8% quando ecoa), além de limpar lacaios no ricochete." },
    17: { tier: "S+", prioridade: 35, tag: "Escudo gigante p/ grupo", motivo: "Como o escudo de 12% escala com o HP do portador, a vida alta do Guerreiro gera um escudo forte para todo o grupo a cada 10s, além de limpar sangramentos e stuns." },
    15: { tier: "S+", prioridade: 55, tag: "Auto-revive na frente", motivo: "Volta imediatamente à linha de frente na Raid com 70% HP + 40% escudo por 5s, evitando que os monstros avancem sobre os suportes." },
    11: { tier: "S+", prioridade: 65, tag: "Sustentação contínua", motivo: "Recupera vida a cada golpe sem esperar o Clérigo, e uma única implosão da Singularidade em chefe pode encher a barra inteira." },
    13: { tier: "S", prioridade: 162, tag: "Revive Imortal", motivo: "Garante segunda vida na linha de frente durante a Raid e acumula com o revive da Brasa Eterna." },
    19: { tier: "S", prioridade: 170, motivo: "O escudo pessoal de 15% da vida máxima ganha força na linha de frente. A lentidão dura 3s e atinge os inimigos visíveis." },
    18: { tier: "S", prioridade: 180, motivo: "O sangramento do Domador já habilita os 20% de dano extra. Com outras armas, um crítico da Presa pode ativar o bônus ao envenenar o alvo." },
    16: { tier: "A", prioridade: 250, motivo: "Só rende bem quando a luta tem lacaios constantes para renovar as 10 almas." },
    12: { tier: "A", prioridade: 270, motivo: "Acelera apenas os 30% finais da vida do chefe (incluindo Singularidade)." },
    10: { tier: "A", prioridade: 295, motivo: "Sangramento contínuo ignorando defesa, mas com atributos baixos de Imortal." },
  },
  archer: {
    14: { tier: "S+", prioridade: 62, tag: "Eco em cada disparo", motivo: "Ativo sem recarga em todas as flechas, rajadas e procs elegíveis, somando dano constante no chefe e limpeza de lacaios." },
    15: { tier: "S+", prioridade: 78, tag: "Segunda vida na Raid", motivo: "Salva a classe de menor vida base quando um sangramento ou golpe atravessa a defesa na Raid, voltando com 70% HP + 40% escudo." },
    11: { tier: "S+", prioridade: 90, tag: "Cura a cada flecha", motivo: "Com alta cadência à distância, recupera 8% do dano continuamente e se mantém cheio entre uma Luz Divina e outra." },
    17: { tier: "S", prioridade: 105, motivo: "Limpa sangramentos e controles do grupo a cada 10s, embora o escudo de 12% fique menor por usar o HP do Arqueiro." },
    18: { tier: "S", prioridade: 115, motivo: "Flechas e rajadas críticas ajudam a manter o veneno no chefe e aproveitar os 20% de dano extra. O efeito não oferece escudo ou revive." },
    13: { tier: "S", prioridade: 150, motivo: "Alternativa Imortal essencial na Raid para não ficar fora da luta caso caia." },
    19: { tier: "A", prioridade: 210, motivo: "Escudo pessoal periódico ajuda a sobreviver ao sangramento, apesar de a vida base menor reduzir o valor do escudo. A lentidão atinge os inimigos visíveis." },
    16: { tier: "A", prioridade: 225, motivo: "Rende bem em ondas cheias de lacaios, mas perde força contra chefe isolado." },
    10: { tier: "A", prioridade: 295, motivo: "A alta cadência mantém o sangramento de 2,5s ativo contra chefes de defesa alta." },
    12: { tier: "B", prioridade: 310, motivo: "Atua apenas quando o alvo já está com 30% de vida ou menos." },
  },
  cleric: {
    17: { tier: "S+", prioridade: 10, tag: "Purifica + escudo (10s)", motivo: "Prioridade máxima do suporte: a cada 10s remove silêncio (que trava a Luz Divina!), sangramento e stun do grupo todo, aplicando escudo com a vida alta do Clérigo." },
    15: { tier: "S+", prioridade: 55, tag: "Mantém o suporte vivo", motivo: "Se o Clérigo cair na Raid, o grupo fica sem cura; renascer com 70% HP + 40% escudo salva a tentativa inteira." },
    13: { tier: "S", prioridade: 120, tag: "Revive Imortal", motivo: "Alternativa acessível ao Coração do Vazio: garantir uma vida extra ao curandeiro na Raid vale mais na prática que atributos puros." },
    19: { tier: "S", prioridade: 135, motivo: "Escudo pessoal de 15% da vida máxima ajuda a manter o suporte vivo. Acima de 4,6/s, a VEL extra melhora o poder da cura via bônus de velocidade e mantém a recarga da Luz Divina." },
    18: { tier: "A", prioridade: 240, tag: "Veneno para build ofensiva", motivo: "Vale para o Clérigo ofensivo que aproveita o veneno e o bônus de 20% nos golpes. O crítico e o veneno não entram no cálculo da Luz Divina." },
    14: { tier: "A", prioridade: 265, motivo: "Útil apenas em builds ofensivas (como Cajado do Eclipse); não aumenta nem repete curas." },
    16: { tier: "B", prioridade: 315, motivo: "Depende de abates de lacaios e pouco agrega à função de manter o grupo vivo." },
    11: { tier: "B", prioridade: 325, motivo: "Roubo de vida baixo devido ao menor dano direto do Clérigo, sem ajudar aliados." },
    10: { tier: "B", prioridade: 335, motivo: "Adiciona apenas sangramento leve no alvo, sem ganho de suporte." },
    12: { tier: "C", prioridade: 345, motivo: "Bônus restrito a dano em alvos abaixo de 30% HP, sem utilidade para suporte." },
  },
};

function formatarBonusCurto(b) {
  if (!b) return "—";
  const nomes = { atk: "ATK", hp: "HP", def: "DEF", spd: "VEL", crit: "CRÍT" };
  return Object.entries(b)
    .map(([k, v]) => k === "crit" ? `+${v} p.p. de crítico bruto`
      : `+${(v * 100).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}% ${nomes[k] || k}`)
    .join(", ");
}

function construirCatalogoItens() {
  const lista = [];
  const catalogoSprites = window.RiftSprites?.catalogoKindsOficial;
  const anel = catalogoAneis[anelReferencia];
  const anelDoConjunto = anel ? [{
    slot: "ring", kind: "ring", name: anel.nome, rarity: anel.raridadeMin, look: anelReferencia,
  }] : [];
  for (const [key, setInfo] of Object.entries(catalogoConjuntos)) {
    const util = UTILIDADE_CONJUNTOS[key];
    const arma = catalogoArmas[setInfo.armaKind];
    const rarity = setInfo.raridadePadrao;
    const conjuntoReferencia = catalogoConjuntos[setInfo.curvaReferencia]?.nome;
    const visualGenerico = Boolean(catalogoSprites) &&
      [setInfo.armaKind, setInfo.elmoKind, setInfo.armaduraKind].some((kind) =>
        !Object.hasOwn(catalogoSprites, kind));
    const referenciaFc = calcularFcReferencia(setInfo.classe, [
      { slot: "weapon", kind: setInfo.armaKind, name: setInfo.armaNome, rarity, set: key },
      { slot: "helmet", kind: setInfo.elmoKind, name: setInfo.elmoNome, rarity, set: key },
      { slot: "armor", kind: setInfo.armaduraKind, name: setInfo.armaduraNome, rarity, set: key },
      ...anelDoConjunto,
    ]);
    const bonusConjunto = [
      `Bônus 2/3: ${formatarBonusCurto(setInfo.b2)}`,
      `Bônus adicional 3/3: ${formatarBonusCurto(setInfo.b3)}`,
    ];
    lista.push({
      id: `set_${key}`,
      categoria: setInfo.classe,
      categoriaLabel: nomesClasses[setInfo.classe] || setInfo.classe,
      nome: setInfo.nome,
      novo: util?.novo,
      subnome: setInfo.armaNome,
      nomesPecas: [setInfo.armaNome, setInfo.elmoNome, setInfo.armaduraNome],
      raridade: setInfo.raridadePadrao,
      raridadeNome: nomesRaridade[rarity],
      slotSprite: "weapon",
      kindSprite: setInfo.armaKind,
      lookSprite: 0,
      classeSprite: setInfo.classe,
      tierUtilidade: util?.tier,
      prioridadeUtilidade: util?.prioridade,
      tagUtilidade: util?.tag,
      motivoUtilidade: util?.motivo,
      limiteUtilidade: util?.limite,
      referenciaFc,
      bonusConjunto,
      conjuntoReferencia,
      visualGenerico,
      curvaEstimada: anel?.estimado,
      detalhes: [
        ...bonusConjunto,
        ...(conjuntoReferencia ? [
          "Onde conseguir: drop raríssimo dos chefes da Cidade Mecânica. A partir da zona 18 no ciclo normal, cai uma peça da classe do jogador que recebeu o drop.",
          `No ranking Por FC, as peças sem amostra usam estimativas a partir do conjunto ${conjuntoReferencia}.`,
        ] : []),
        `Arma (${setInfo.armaNome}): ${arma?.efeito?.texto || arma?.notaSkill || "Habilidade padrão da classe."}`,
      ],
    });
  }

  for (const [kind, util] of Object.entries(UTILIDADE_ARMAS)) {
    const arma = catalogoArmas[kind];
    const conjunto = Object.values(catalogoConjuntos).find((info) => info.armaKind === kind);
    const raridade = conjunto?.raridadePadrao;
    lista.push({
      id: `weapon_${kind}`,
      categoria: arma.classe,
      categoriaLabel: nomesClasses[arma.classe],
      nome: util.nome || arma.nome,
      raridade,
      raridadeNome: nomesRaridade[raridade],
      slotSprite: "weapon",
      kindSprite: kind,
      lookSprite: 0,
      classeSprite: arma.classe,
      tierUtilidade: util.tier,
      prioridadeUtilidade: util.prioridade,
      tagUtilidade: util.tag,
      motivoUtilidade: util.motivo,
      limiteUtilidade: util.limite,
      detalhes: [
        ...(util.detalhes ?? []),
        ...(conjunto ? [
          `Peça do conjunto ${conjunto.nome} (${nomesRaridade[raridade]}).`,
          `Bônus com 2 peças: ${formatarBonusCurto(conjunto.b2)}`,
          `Bônus adicional com 3 peças: ${formatarBonusCurto(conjunto.b3)}`,
        ] : []),
      ],
    });
  }

  for (let look = 10; look <= 19; look++) {
    const anel = catalogoAneis[look];
    if (!anel) continue;
    const rar = anel.raridadeMin;
    const util = UTILIDADE_ANEIS[look] || { tier: "B", tag: "Anel", motivo: "" };
    const peca = { slot: "ring", kind: "ring", name: anel.nome, rarity: rar, look };
    const referenciaPorClasse = Object.fromEntries(
      Object.keys(nomesClasses).map((classe) => [classe, calcularFcReferencia(classe, [peca])])
    );
    lista.push({
      id: `ring_${look}`,
      categoria: "ring",
      categoriaLabel: "Anel",
      nome: anel.nome,
      subnome: anel.foco || "",
      raridade: rar,
      raridadeNome: rar === 7 ? "Arcano" : "Imortal",
      slotSprite: "ring",
      kindSprite: "ring",
      lookSprite: look,
      classeSprite: "warrior",
      tierUtilidade: util.tier,
      prioridadeUtilidade: util.prioridade ?? Number.MAX_SAFE_INTEGER,
      tagUtilidade: util.tag,
      motivoUtilidade: util.motivo,
      limiteUtilidade: util.limite,
      referenciaFc: referenciaPorClasse.warrior,
      referenciaPorClasse,
      curvaEstimada: anel.estimado,
      utilPorClasse: {
        warrior: UTILIDADE_ANEIS_POR_CLASSE.warrior[look] || util,
        archer: UTILIDADE_ANEIS_POR_CLASSE.archer[look] || util,
        cleric: UTILIDADE_ANEIS_POR_CLASSE.cleric[look] || util,
      },
      detalhes: [
        `Foco: ${anel.foco || "Equilibrado"}`,
        `Onde conseguir: ${anel.obtencao || "Chefes / Forja"}`,
        `Efeito: ${anel.efeito || "Atributos brutos por nível."}`,
      ],
    });
  }

  return lista;
}

let catalogoTierList = construirCatalogoItens();

function atribuirTiersPorFc(itensFiltrados) {
  const ordenados = [...itensFiltrados].sort((a, b) => b.referenciaFc.fc - a.referenciaFc.fc);
  if (ordenados.length === 0) return {};
  const maxFc = ordenados[0].referenciaFc.fc;
  const minFc = ordenados[ordenados.length - 1].referenciaFc.fc;
  const span = Math.max(1, maxFc - minFc);

  const grupos = { "S+": [], S: [], A: [], B: [], C: [] };
  ordenados.forEach((item, idx) => {
    const pct = (item.referenciaFc.fc - minFc) / span;
    let tier = "C";
    if (ordenados.length <= 5) {
      tier = ["S+", "S", "A", "B", "C"][idx] || "C";
    } else if (pct >= 0.85) tier = "S+";
    else if (pct >= 0.65) tier = "S";
    else if (pct >= 0.35) tier = "A";
    else if (pct >= 0.15) tier = "B";
    else tier = "C";
    grupos[tier].push(item);
  });
  return grupos;
}

function atribuirTiersPorUtilidade(itensFiltrados) {
  const grupos = { "S+": [], S: [], A: [], B: [], C: [] };
  itensFiltrados.forEach((item) => {
    const t = grupos[item.tierUtilidade] ? item.tierUtilidade : "B";
    grupos[t].push(item);
  });
  Object.values(grupos).forEach((arr) => {
    arr.sort((a, b) => a.prioridadeUtilidade - b.prioridadeUtilidade);
  });
  return grupos;
}

function desenharTodosSprites() {
  if (!window.RiftSprites) return;
  document.querySelectorAll("canvas[data-tl-sprite]").forEach((canvas) => {
    const item = catalogoTierList.find((x) => x.id === canvas.dataset.tlSprite);
    if (!item) return;
    const escala = Number(canvas.dataset.tlEscala || 3);
    if (canvas.hasAttribute("data-tl-heroi") || canvas.dataset.tlPeca !== undefined) {
      const { classe, itens } = obterItemContextualizado(item).referenciaFc;
      if (canvas.hasAttribute("data-tl-heroi")) {
        try {
          window.RiftSprites.iniciarPalcoHeroi(canvas, classe, itens);
        } catch (erro) {
          if (!(erro instanceof ReferenceError)) throw erro;
          window.RiftSprites.iniciarPalcoHeroi(canvas, classe, []);
        }
      } else {
        window.RiftSprites.desenharIconeItem(canvas, itens[Number(canvas.dataset.tlPeca)], classe, escala);
      }
      return;
    }
    window.RiftSprites.desenharIconeItem(
      canvas,
      { slot: item.slotSprite, kind: item.kindSprite, rarity: item.raridade, look: item.lookSprite },
      item.classeSprite,
      escala
    );
  });
  containerDetalhe?.querySelectorAll("canvas[data-tl-canvas-gema]").forEach((canvas) => {
    const [tipo, tier, escala] = canvas.dataset.tlCanvasGema.split(":");
    window.RiftSprites.desenharIconeGema(canvas, tipo, Number(tier), Number(escala));
  });
}

function obterItemContextualizado(item) {
  if (item.categoria === "ring" && ["warrior", "archer", "cleric"].includes(categoriaAtual)) {
    const u = item.utilPorClasse?.[categoriaAtual];
    return {
      ...item,
      tierUtilidade: u?.tier || item.tierUtilidade,
      tagUtilidade: u?.tag || item.tagUtilidade,
      motivoUtilidade: u?.motivo || item.motivoUtilidade,
      prioridadeUtilidade: u?.prioridade ?? item.prioridadeUtilidade,
      referenciaFc: item.referenciaPorClasse[categoriaAtual],
    };
  }
  return item;
}

function renderizarDetalhe() {
  if (!containerDetalhe) return;
  const raw = catalogoTierList.find((x) => x.id === itemSelecionadoId);
  const item = raw ? obterItemContextualizado(raw) : null;
  containerDetalhe.hidden = !item;
  if (!item) {
    containerDetalhe.replaceChildren();
    return;
  }
  if (modoAtual === "fc") {
    const itens = item.referenciaFc.itens;
    const peca = itens.find((peca) => peca.slot === pecaSelecionada) || itens[0];
    if (peca.slot !== pecaSelecionada) engasteSelecionado = 0;
    pecaSelecionada = peca.slot;
    engasteSelecionado = Math.min(engasteSelecionado, peca.sockets - 1);
    containerDetalhe.innerHTML = renderizarFichaFc(item, NIVEL_PERSONAGEM_REFERENCIA, ATRIBUTOS_REFERENCIA, pecaSelecionada, engasteSelecionado);
    return;
  }

  const corRar = coresRaridade[item.raridade] || "var(--text)";
  const tierAtual = `Tier de utilidade ${item.tierUtilidade} · ${item.tagUtilidade}`;
  containerDetalhe.innerHTML = `
    <div class="tl-detalhe-icone">
      <canvas data-tl-sprite="${escaparHtml(item.id)}" data-tl-escala="3"></canvas>
    </div>
    <div>
      <div class="tl-detalhe-topo">
        <h3 class="tl-detalhe-titulo" style="color:${corRar};" aria-label="${escaparHtml([item.nome, item.raridadeNome].filter(Boolean).join(" · "))}">${escaparHtml(item.nome)}</h3>
        <span class="tl-card-tag">${escaparHtml(item.categoriaLabel)}</span>
        <span class="tl-card-tag">${escaparHtml(tierAtual)}</span>
      </div>
      ${item.visualGenerico ? '<p class="note small">O ícone é genérico. O visual deste conjunto ainda não está disponível no RiftInfos.</p>' : ""}
      <p class="small"><strong>Ponto forte.</strong> ${escaparHtml(item.motivoUtilidade)}</p>
      ${item.limiteUtilidade ? `<p class="small"><strong>Limitação.</strong> ${escaparHtml(item.limiteUtilidade)}</p>` : ""}
      ${item.detalhes.length ? `<ul class="tl-detalhe-lista">
        ${item.detalhes.map((linha) => `<li>${escaparHtml(linha)}</li>`).join("")}
      </ul>` : ""}
    </div>
  `;
}

function normalizarBusca(texto) {
  return texto.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();
}

function renderizarTabela() {
  if (!containerTabela) return;
  const raridade = filtroRaridade?.value || "";
  const filtrados = catalogoTierList
    .filter((item) => {
      if (raridade && String(item.raridade ?? "variavel") !== raridade) return false;
      if (categoriaAtual === "todos") return true;
      if (categoriaAtual === "weapon") return item.id.startsWith("weapon_");
      if (["warrior", "archer", "cleric"].includes(categoriaAtual)) {
        return item.categoria === categoriaAtual || item.categoria === "ring";
      }
      return item.categoria === categoriaAtual;
    })
    .map(obterItemContextualizado)
    .filter((item) => modoAtual === "fc" ? item.referenciaFc : item.tierUtilidade);

  const grupos = modoAtual === "fc"
    ? atribuirTiersPorFc(filtrados)
    : atribuirTiersPorUtilidade(filtrados);

  const termo = normalizarBusca(buscaItem?.value || "");
  if (termo) {
    for (const tier of Object.keys(grupos)) {
      grupos[tier] = grupos[tier].filter((item) =>
        [item.nome, ...(item.nomesPecas ?? [])].some((nome) => normalizarBusca(nome).includes(termo)));
    }
  }
  const visiveis = Object.values(grupos).flat();
  if (!visiveis.some((x) => x.id === itemSelecionadoId)) {
    itemSelecionadoId = visiveis[0]?.id ?? null;
  }

  if (descricaoModo) {
    descricaoModo.textContent = modoAtual === "fc"
      ? "FC simulado com uma base fixa de personagem. Os tiers são relativos ao filtro. O símbolo ≈ indica peças com atributos estimados. Clique para ver a ficha e a referência usada."
      : "Tier List opinativa com foco em chefes e Raids. A ordem considera proteção, revive, controle e dano. No filtro Armas avulsas, a nota considera a habilidade da arma equipada.";
  }
  if (controlesFc) controlesFc.hidden = modoAtual !== "fc";
  if (filtroArmas) filtroArmas.hidden = modoAtual === "fc";

  if (!visiveis.length) {
    containerTabela.innerHTML = `<p class="note" role="status">Nenhum item para esta combinação de filtros.</p>`;
    renderizarDetalhe();
    return;
  }

  const linhasMeta = [
    { key: "S+", classe: "tl-tier-splus", sub: modoAtual === "fc" ? "Topo FC" : "Meta" },
    { key: "S", classe: "tl-tier-s", sub: "Excelente" },
    { key: "A", classe: "tl-tier-a", sub: "Forte" },
    { key: "B", classe: "tl-tier-b", sub: "Situacional" },
    { key: "C", classe: "tl-tier-c", sub: "Entrada" },
  ];

  containerTabela.innerHTML = linhasMeta
    .map((meta) => {
      const itens = grupos[meta.key] || [];
      if (termo && !itens.length) return "";
      const cardsHtml = itens.length
        ? itens
            .map((item) => {
              const clsRar = ({ 3: "epico", 4: "lendario", 6: "imortal", 7: "arcano" })[item.raridade] || "";
              const clsSel = item.id === itemSelecionadoId ? "selecionado" : "";
              const badgeTag = modoAtual === "fc"
                ? `${item.conjuntoReferencia || item.curvaEstimada ? "≈ " : ""}${formatarNumeroCompacto(item.referenciaFc.fc)} FC`
                : item.tagUtilidade;
              const seloNovo = item.novo ? "Novo" : "";
              const pecaEncontrada = termo && item.nomesPecas?.find((nome) => normalizarBusca(nome).includes(termo));
              const rotulo = [item.nome, pecaEncontrada, item.categoriaLabel, item.raridadeNome, seloNovo, badgeTag].filter(Boolean).join(" · ");
              return `
                <button type="button" class="tl-card ${clsRar} ${clsSel}" data-tl-card="${escaparHtml(item.id)}" aria-pressed="${item.id === itemSelecionadoId}" aria-label="${escaparHtml(rotulo)}">
                  ${seloNovo ? `<span class="tl-card-novo" aria-hidden="true">${seloNovo}</span>` : ""}
                  <canvas data-tl-sprite="${escaparHtml(item.id)}" data-tl-escala="3"></canvas>
                  <span class="tl-card-nome">${escaparHtml(item.nome)}</span>
                  ${pecaEncontrada ? `<span class="tl-card-classe">${escaparHtml(pecaEncontrada)}</span>` : ""}
                  <span class="tl-card-classe">${escaparHtml(item.categoriaLabel)}</span>
                  <span class="tl-card-tag">${escaparHtml(badgeTag)}</span>
                </button>
              `;
            })
            .join("")
        : `<div class="tl-linha-vazia">Nenhum item neste tier para o filtro atual.</div>`;

      return `
        <div class="tl-linha ${meta.classe}">
          <div class="tl-tier-badge">
            <span>${meta.key}</span>
            <small>${meta.sub}</small>
          </div>
          <div class="tl-itens-linha">${cardsHtml}</div>
        </div>
      `;
    })
    .join("");

  renderizarDetalhe();
  desenharTodosSprites();

  containerTabela.querySelectorAll("[data-tl-card]").forEach((btn) => {
    btn.addEventListener("click", () => {
      itemSelecionadoId = btn.dataset.tlCard;
      renderizarTabela();
      containerDetalhe?.focus({ preventScroll: true });
      const reduzirMovimento = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      containerDetalhe?.scrollIntoView?.({ behavior: reduzirMovimento ? "auto" : "smooth", block: "start" });
    });
  });
}

filtroRaridade?.addEventListener("change", renderizarTabela);
buscaItem?.addEventListener("input", renderizarTabela);

document.querySelectorAll("[data-tl-modo]").forEach((btn) => {
  btn.addEventListener("click", () => {
    modoAtual = btn.dataset.tlModo;
    if (modoAtual === "fc" && categoriaAtual === "weapon") {
      categoriaAtual = "todos";
      document.querySelectorAll("[data-tl-cat]").forEach((b) => b.classList.toggle("ativa", b.dataset.tlCat === categoriaAtual));
    }
    document.querySelectorAll("[data-tl-modo]").forEach((b) => b.classList.toggle("ativa", b === btn));
    renderizarTabela();
  });
});

document.querySelectorAll("[data-tl-cat]").forEach((btn) => {
  btn.addEventListener("click", () => {
    categoriaAtual = btn.dataset.tlCat;
    document.querySelectorAll("[data-tl-cat]").forEach((b) => b.classList.toggle("ativa", b === btn));
    renderizarTabela();
  });
});

function atualizarCenarioFc() {
  catalogoTierList = construirCatalogoItens();
  renderizarTabela();
}

if (selectAnelReferencia) {
  for (const look of Object.keys(UTILIDADE_ANEIS)) {
    selectAnelReferencia.add(new window.Option(catalogoAneis[look].nome, look));
  }
  selectAnelReferencia.value = String(anelReferencia);
  selectAnelReferencia.addEventListener("change", () => {
    anelReferencia = Number(selectAnelReferencia.value);
    atualizarCenarioFc();
  });
}

document.querySelector("#tierlist-restaurar-fc")?.addEventListener("click", () => {
  gemasPorSlot.clear();
  anelReferencia = 0;
  if (selectAnelReferencia) selectAnelReferencia.value = "0";
  atualizarCenarioFc();
});

containerDetalhe?.addEventListener("click", (event) => {
  const botao = event.target.closest("button");
  if (!botao || modoAtual !== "fc") return;
  const acao = botao.getAttributeNames().find((nome) => nome.startsWith("data-tl-"));
  if (!acao) return;
  const valor = botao.getAttribute(acao);
  const item = obterItemContextualizado(catalogoTierList.find((item) => item.id === itemSelecionadoId));
  const peca = item.referenciaFc.itens.find((peca) => peca.slot === pecaSelecionada);
  if (acao === "data-tl-selecionar-peca" || acao === "data-tl-selecionar-engaste") {
    if (acao === "data-tl-selecionar-peca") {
      pecaSelecionada = valor;
      engasteSelecionado = 0;
    } else {
      engasteSelecionado = Number(valor);
    }
    renderizarDetalhe();
    desenharTodosSprites();
  } else {
    const chaveEngaste = `${peca.slot}:${engasteSelecionado}`;
    const gemaAtiva = peca.gems[engasteSelecionado];
    if (acao === "data-tl-slot-tier") {
      const tier = Number(valor.split(":")[2]);
      gemasPorSlot.set(chaveEngaste, { ...gemasPorSlot.get(chaveEngaste), tier: limitarTierGema(tier, peca.rarity) });
    } else if (acao === "data-tl-gem-btn") {
      const tipo = valor.split(":")[2];
      if (!Object.hasOwn(catalogoGemas, tipo)) return;
      gemasPorSlot.set(chaveEngaste, { tier: peca.tiersEngastes[engasteSelecionado], tipo: gemaAtiva?.type === tipo ? "none" : tipo });
    } else if (acao === "data-tl-gem-limpar-unico") {
      gemasPorSlot.set(chaveEngaste, { tier: peca.tiersEngastes[engasteSelecionado], tipo: "none" });
    } else {
      peca.gems.forEach((gema, index) => {
        const chave = `${peca.slot}:${index}`;
        if (acao === "data-tl-gem-limpar") gemasPorSlot.set(chave, { ...gemasPorSlot.get(chave), tipo: "none" });
        if (acao === "data-tl-gem-repetir-ativo" && gemaAtiva && index !== engasteSelecionado) {
          gemasPorSlot.set(chave, { tipo: gemaAtiva.type, tier: gemaAtiva.tier });
        }
        if (acao === "data-tl-gem-reroll" && gema) {
          gemasPorSlot.set(chave, { ...gemasPorSlot.get(chave), tipo: gema.type, rolagem: [sortearRolagemGema(), sortearRolagemGema()] });
        }
      });
    }
    atualizarCenarioFc();
  }
  const proximoFoco = containerDetalhe.querySelector(`[${acao}="${valor}"]`)
    || containerDetalhe.querySelector(`[data-tl-selecionar-engaste="${engasteSelecionado}"]`);
  proximoFoco?.focus({ preventScroll: true });
});

renderizarTabela();
window.addEventListener("load", desenharTodosSprites);

