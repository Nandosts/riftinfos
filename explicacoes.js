/**
 * explicacoes.js — Catálogo de termos, explicações e componentes de ajuda acessíveis
 * RiftInfos · RiftStream
 */

(function (raiz, fabrica) {
  if (typeof module !== "undefined" && module.exports) {
    module.exports = fabrica();
  } else {
    raiz.RiftExplicacoes = fabrica();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const CATALOGO_TERMOS = {
    fc: {
      termo: "FC (Força de Combate)",
      curto: "Força de Combate: indicador geral do personagem. Um FC maior não garante mais dano ou sobrevivência em todo cenário.",
      detalhes: "O FC agrega vida, ataque, defesa, crítico, velocidade e coeficientes de classe. Diferenças entre o FC informado e o reconstruído podem envolver inferência, arredondamento ou regras não modeladas; a causa não é determinada apenas pela diferença.",
      categoria: "combate"
    },
    fc_informado: {
      termo: "FC informado pelo jogo",
      curto: "Valor exato de Força de Combate retornado pela API oficial do RiftStream.",
      detalhes: "Representa o total gravado pelo servidor do jogo na última sincronização do personagem.",
      categoria: "origem"
    },
    fc_reconstruido: {
      termo: "FC reconstruído",
      curto: "Força de Combate recalculada matematicamente a partir dos equipamentos, gemas e atributos.",
      detalhes: "Neste modelo: FC = coeficiente de classe × raiz quadrada de (DPS para FC × vida efetiva física). Permite simular mudanças de build sob o mesmo padrão.",
      categoria: "origem"
    },
    dps: {
      termo: "DPS Estimado",
      curto: "Dano médio por segundo contra alvo de teste (0 DEF, sem redução). Considera cadência real com cap, chance de crítico e skills.",
      detalhes: "Calcula cadência de ataque com cap de 4,60 golpes/s, chance e dano crítico, bônus de armas arcanas/imortais e dano por segundo das habilidades.",
      categoria: "combate"
    },
    dps_estimado: {
      termo: "DPS estimado",
      curto: "Dano médio por segundo no cenário selecionado. Depende do alvo e das condições consideradas.",
      detalhes: "Calcula a cadência de ataque (com cap de 4,6 golpes/s), chance de crítico, dano crítico, bônus de armas arcanas/imortais e dano da habilidade especial contra um alvo de teste (por padrão 0 DEF).",
      categoria: "combate"
    },
    sobrevivencia: {
      termo: "Vida Máxima & Defesa",
      curto: "Capacidade de suportar dano físico com base na sua vida e redução da armadura. Habilidades como Singularidade ignoram defesa.",
      detalhes: "A Vida Efetiva Física (EHP) projeta o dano físico total suportado após mitigação de defesa. Importante: sangramento, veneno e chefes com dano puro ignoram defesa e afetam diretamente a Vida Máxima pura.",
      categoria: "combate"
    },
    cura: {
      termo: "Poder de Cura",
      curto: "Cura estimada da habilidade Luz Divina. Escala com ATK, nível e os multiplicadores considerados no cenário.",
      detalhes: "A fórmula de cura do clérigo utiliza (ATK × 2,4 + Nível × 1,5 + 6) multiplicado pelo bônus de velocidade da arma e pelo multiplicador de cura do cajado equipado.",
      categoria: "combate"
    },
    cadencia: {
      termo: "Cadência & Crítico",
      curto: "Velocidade de disparos contínuos e chance de acertos críticos. Sujeito ao cap de 4,60 ataques por segundo.",
      detalhes: "Calcula a cadência real da classe com cap de 4,60/s e a probabilidade de golpes críticos com bônus de conjuntos e equipamentos.",
      categoria: "combate"
    },
    armadura: {
      termo: "Redução de Dano Físico",
      curto: "Percentual de mitigação física derivado da defesa total do personagem. Não protege contra sangramento ou dano puro.",
      detalhes: "Calculado pela fórmula de mitigação usada pelo simulador: (Defesa × 4) / (100 + Defesa × 4). Mitiga exclusivamente golpes físicos convencionais.",
      categoria: "combate"
    },
    crit_chance: {
      termo: "Chance de crítico",
      curto: "Probabilidade de um golpe causar dano crítico. É diferente do dano causado quando o crítico acontece.",
      detalhes: "Neste modelo, a chance de crítico é limitada a 60%. O excesso contribui para o dano crítico.",
      categoria: "combate"
    },
    crit_dano: {
      termo: "Dano crítico",
      curto: "Multiplicador de dano aplicado quando ocorre um golpe crítico.",
      detalhes: "O crítico base causa 175% (1,75×) do dano. Cada ponto percentual de chance acima do limite de 60% contribui com 3 pontos percentuais de dano crítico.",
      categoria: "combate"
    },
    vida_efetiva: {
      termo: "Vida efetiva física (EHP)",
      curto: "Estimativa de quanto dano físico bruto sua vida suporta após a redução de defesa. Não representa proteção contra dano que ignora defesa.",
      detalhes: "Calculada como Vida / (1 - Redução de Dano Físico). Se um ataque inimigo ignorar defesa (ex: sangramento, true damage da Singularidade ou dano puro de chefe), a proteção efetiva é apenas a Vida Máxima pura.",
      categoria: "combate"
    },
    cura_estimada: {
      termo: "Poder de cura estimado",
      curto: "Capacidade de restauração de vida em habilidades sagradas (exclusivo para Clérigo).",
      detalhes: "Neste modelo, usa ATK, nível, bônus de velocidade e multiplicador de cura da arma. Cura por habilidade e cura por pulso são medidas diferentes.",
      categoria: "combate"
    },
    sucesso_historico: {
      termo: "Sucesso no histórico",
      curto: "Sucessos divididos pelas tentativas registradas. Não é a chance da próxima forja.",
      detalhes: "Mostra apenas o percentual retrospectivo de tentativas bem-sucedidas registradas na conta. Como cada tentativa passada pode ter usado pergaminhos, eventos ou bônus de Gelo diferentes, a taxa histórica não reflete a probabilidade de uma forja futura.",
      categoria: "forjas"
    },
    chance_proxima: {
      termo: "Chance da próxima tentativa",
      curto: "Probabilidade calculada para a peça, raridade e bônus selecionados no planejador.",
      detalhes: "Composição transparente: Chance Base + Gelo acumulado (p.p.) + Pergaminho de Sorte (p.p.) + Evento oficial (p.p.).",
      categoria: "forjas"
    },
    pontos_percentuais: {
      termo: "Pontos percentuais (p.p.)",
      curto: "Diferença aritmética absoluta entre duas porcentagens. Somar 10 pontos percentuais a 25% resulta em 35%.",
      detalhes: "Diferente de aumento relativo (+10% relativo sobre 25% resultaria em 27,5%). Todos os bônus de pergaminho e Gelo no Rift somam pontos percentuais diretamente na chance base.",
      categoria: "forjas"
    },
    gelo: {
      termo: "Gelo (Pity)",
      curto: "Sequência de falhas usada pelo jogo para determinar o bônus desta peça e raridade. O planejador mostra a regra aplicada.",
      detalhes: "Ao falhar na forja de uma peça, o contador de Gelo correspondente aumenta, concedendo bônus cumulativo de chance na próxima tentativa da mesma peça/raridade até obter sucesso (quando é resetado).",
      categoria: "forjas"
    },
    fogo: {
      termo: "Fogo",
      curto: "Sequência de sucessos consecutivos. Só altera a previsão se houver uma regra confirmada do jogo que use esse contador.",
      detalhes: "Registrado no perfil como contador de sequências vitoriosas. Até a versão atual do patch oficial, o Fogo não adiciona bônus mecânico confirmado na forja.",
      categoria: "forjas"
    },
    parcela_fc: {
      termo: "Parcela atribuída de FC",
      curto: "Distribuição do ganho de FC entre peças e gemas segundo o método de cálculo. Não é o ganho isolado de cada item.",
      detalhes: "Distribui 100% do FC proveniente do inventário entre as peças equipadas proporcionalmente ao seu valor individual ponderado.",
      categoria: "equipamentos"
    },
    ao_remover: {
      termo: "Ao remover (Impacto marginal)",
      curto: "Diferença estimada entre a build atual e a mesma build sem essa peça ou gema, incluindo mudanças de conjunto.",
      detalhes: "Como atributos multiplicam entre si (ataque multiplica crítico e velocidade, vida multiplica defesa no FC), remover uma peça forte causa uma queda maior do que o atributo nominal dela sugere.",
      categoria: "equipamentos"
    },
    dado_cache: {
      termo: "Dado em cache",
      curto: "Resultado de uma consulta anterior, reutilizado temporariamente. Veja quando foi obtido.",
      detalhes: "Para evitar sobrecarga na API pública do servidor e acelerar a navegação, consultas recentes são guardadas em memória. O horário original é preservado.",
      categoria: "origem"
    },
    varredura_parcial: {
      termo: "Varredura parcial",
      curto: "Parte dos personagens não pôde ser analisada. Os totais e percentuais representam apenas os perfis disponíveis.",
      detalhes: "Ocorre quando a sala de transmissão tem muitos espectadores ou quando algumas requisições individuais sofrem rate-limit ou timeout.",
      categoria: "radar"
    },
    origem_jogo: {
      termo: "Informado pelo jogo",
      curto: "Dado oficial recebido diretamente dos servidores da API do RiftStream.",
      detalhes: "Não sofreu nenhuma transformação ou suposição além de formatação visual.",
      categoria: "origem"
    },
    origem_calculado: {
      termo: "Calculado",
      curto: "Transformação matemática direta de dados conhecidos (ex: sucessos ÷ tentativas).",
      detalhes: "Resultado derivado dos dados recebidos. Quando depende de atributos inferidos ou condições hipotéticas, deve ser identificado como estimativa.",
      categoria: "origem"
    },
    origem_estimado: {
      termo: "Estimado",
      curto: "Resultado dependente de premissas, inferência de atributos ou cenário simulado de combate.",
      detalhes: "Qualquer cálculo baseado em atributos não confirmados diretamente ou em condições de alvo (ex: alvo com 0 DEF) é classificado como estimativa.",
      categoria: "origem"
    },
    dot: {
      termo: "DoT (Damage over Time / Dano Contínuo)",
      curto: "Dano contínuo aplicado a cada segundo (ex: Sangramento, Veneno ou Poça Ácida). O sangramento observado no frontend ignora defesa. Não se deve generalizar esse comportamento a todo efeito periódico.",
      detalhes: "Sigla para 'Damage over Time'. Em vez de um impacto único, causa dano cumulativo a cada segundo (ex: Sangramento por 4s). O sangramento é processado sem a redução física, mas ainda passa por verificações de invulnerabilidade e absorção de escudo. Outros efeitos periódicos podem seguir regras diferentes.",
      categoria: "combate"
    },
    true_damage: {
      termo: "Dano Verdadeiro (True Damage)",
      curto: "Tipo de dano que ignora totalmente a armadura e redução de defesa do alvo, subtraindo vida diretamente.",
      detalhes: "Enquanto golpes físicos convencionais são mitigados pela sua defesa em até 99%+, dano que ignora defesa ainda pode ser absorvido por escudos e interagir com outras proteções. Exemplos no Rift: Sangramento de Chefes e lacaios, proc percentual da Singularidade e o efeito do Anel da Sede Escarlate.",
      categoria: "combate"
    },
    ehp: {
      termo: "EHP (Vida Efetiva Física)",
      curto: "Total de dano físico bruto que o personagem aguenta antes de zerar a vida, levando em conta a mitigação da armadura.",
      detalhes: "Sigla para 'Effective Health Points'. Calculada como Vida / (1 - Mitigação de Defesa). Se você tem 100k HP e sua armadura reduz 90% do dano físico, seu EHP físico é de 1 milhão. Importante: Essa vida efetiva física não representa proteção contra dano que ignora defesa; escudos e outras mecânicas são avaliados separadamente.",
      categoria: "combate"
    },
    hps: {
      termo: "HPS (Cura por Segundo)",
      curto: "Média de pontos de vida regenerados por segundo pelo personagem ou equipe.",
      detalhes: "Sigla para 'Heal per Second'. Calculada somando a cura da habilidade sagrada (Luz Divina do Clérigo) dividida pelo seu tempo de recarga real, mais pulsos periódicos de regeneração de armas e anéis.",
      categoria: "combate"
    },
    aspd: {
      termo: "ASPD (Velocidade de Ataque / Cadência)",
      curto: "ASPD é a velocidade de ataque antes dos ajustes da arma. A cadência efetiva também depende do intervalo específico do ataque.",
      detalhes: "Sigla para 'Attack Speed'. Quando a cadência ultrapassa 4,60/s, o motor do jogo converte o excesso de velocidade em um multiplicador direto de dano (SpeedBonus = ASPD / 4,60), fazendo cada golpe bater mais pesado sem quebrar a animação visual.",
      categoria: "combate"
    },
    speed_bonus: {
      termo: "SpeedBonus (Bônus de Excesso de Velocidade)",
      curto: "Multiplicador de dano gerado quando a cadência (ASPD) ultrapassa o teto de 4,60 ataques por segundo.",
      detalhes: "Fórmula oficial: se ASPD > 4,60, SpeedBonus = ASPD / 4,60. Esse multiplicador amplifica golpes normais, dano de habilidades e o poder de cura do Clérigo.",
      categoria: "combate"
    },
    ttk: {
      termo: "TTK (Time to Kill / Tempo para Matar)",
      curto: "Tempo estimado em segundos necessário para derrotar um monstro ou chefe em combate solo.",
      detalhes: "Estimativa estática: vida do inimigo dividida pelo DPS estimado contra sua defesa. Não simula integralmente cura do chefe, movimento, interrupções, aliados nem mudanças ao longo da luta.",
      categoria: "chefes"
    },
    furia: {
      termo: "Fúria do Chefe (Rage)",
      curto: "Mecânica que fortalece o chefe a cada 15s de luta: ganha +10% ATK, +8% ASPD e reduz o tempo de recarga de skills em 8%.",
      detalhes: "A cada 15 segundos sem que o chefe seja derrotado, ele ganha um estágio de Fúria (+10% ATK, +8% ASPD, -7% DEF, -5% HP máx e -8% CD de skill). Em combates prolongados, o DoT de sangramento e as skills tornam-se rapidamente letais.",
      categoria: "chefes"
    },
    proc: {
      termo: "Proc (Ativação Especial)",
      curto: "Disparo automático de um efeito especial de arma ou anel programado por ciclo de tempo ou condição.",
      detalhes: "Ativação de um efeito especial por tempo ou condição. Nem toda ativação é aleatória: a Singularidade, por exemplo, tem um ciclo de 13s.",
      categoria: "equipamentos"
    },
    singularidade: {
      termo: "Singularidade (True Damage em % HP)",
      curto: "Passiva da Lâmina da Singularidade que remove uma porcentagem fixa da vida total do chefe a cada 13s, ignorando defesa.",
      detalhes: "No frontend consultado, causa 25% da vida máxima de monstros comuns e 4% de chefes, após um atraso de 1,4s na ativação do ciclo de 13s. A compensação aplicada ao dano anula a redução por defesa; outros efeitos do alvo ainda podem interferir.",
      categoria: "equipamentos"
    },
    luz_divina: {
      termo: "Luz Divina (Cura do Clérigo)",
      curto: "Habilidade suprema do Clérigo que cura o personagem e o grupo a cada ciclo de recarga.",
      detalhes: "Fórmula oficial: Cura = (ATK × 2,4 + Nível × 1,5 + 6) × SpeedBonus × Multiplicador do Cajado. Principal sustentáculo da equipe contra sangramento e dano contínuo (DoT).",
      categoria: "combate"
    },
    cap: {
      termo: "Cap (Teto ou Limite Máximo)",
      curto: "Valor máximo que um atributo pode atingir no motor do jogo (ex: cap de 4,60 ataques por segundo).",
      detalhes: "Mecanismo para evitar que estatísticas quebrem física ou visual do jogo. Quando a velocidade atinge o Cap, o excesso é convertido em SpeedBonus de dano.",
      categoria: "combate"
    },
    rolagem_gema: {
      termo: "Rolagem de Gemas (Roll 85% a 115%)",
      curto: "Variação de sorte nos atributos das gemas ao serem forjadas, oscilando entre 85% e 115% do valor base.",
      detalhes: "Duas gemas do mesmo nível podem conceder atributos diferentes devido ao sorteio aleatório entre 0,85 e 1,15 na criação. As rolagens já presentes no perfil devem ser preservadas na reconstrução. Uma diferença de FC, isoladamente, não permite atribuir sua causa à sorte.",
      categoria: "equipamentos"
    },
    k_classe: {
      termo: "Coeficiente de Classe (k)",
      curto: "Coeficiente de FC observado no patch de 14/11/2026: Clérigo e Arqueiro (0,56), Guerreiro (0,40).",
      detalhes: "Determina o peso relativo dos atributos brutos no FC. O ganho de FC por ponto de atributo também depende das demais estatísticas; o coeficiente isolado não determina esse ganho.",
      categoria: "combate"
    },
    mitigacao_defesa: {
      termo: "Mitigação de Defesa (Armadura)",
      curto: "Percentual do dano de ataques normais bloqueado pela sua armadura: (DEF × 4) / (100 + DEF × 4).",
      detalhes: "Fórmula de mitigação física do jogo. Com alta defesa, o personagem reduz até 99%+ do dano físico direto, mas essa armadura não oferece nenhuma proteção contra DoT (sangramento) ou dano verdadeiro.",
      categoria: "combate"
    },
    build: {
      termo: "Build (Configuração de Itens)",
      curto: "Combinação de equipamentos, bônus de conjunto, gemas e distribuição de atributos escolhida para o personagem.",
      detalhes: "Conjunto de decisões estratégicas para maximizar dano (DPS), sustentação e cura (HPS) ou sobrevivência física (EHP).",
      categoria: "equipamentos"
    },
    raid_vexxaris: {
      termo: "Raid: Covil de Vexxaris (Como abrir, entrar e funcionar)",
      curto: "Raid cooperativa de 4 ondas contra a Rainha Ixtharra (1 zona abaixo do recorde da live). Exige 1 Casulo de Vexxaris para abrir e confirmação via $raid CÓDIGO no chat.",
      detalhes: "1) Abrir: apenas 1 jogador usa o Casulo de Vexxaris na mochila ('Meu personagem' -> 'Usar: romper o Casulo') estando em uma live online com overlay ativo. 2) Lobby: a marcha normal pausa, surge uma fogueira e um código na tela. Todos (inclusive quem já estava na live ou veio de outra) precisam digitar $raid CÓDIGO no chat antes do tempo acabar; se não atingir o mínimo de jogadores, a Raid é cancelada e o Casulo volta para quem usou. 3) Quem não digita o código fica fora da tela durante as 4 ondas (por isso parece que 'todo mundo caiu'), mas não perde a vaga na live: ao fim da Raid, o canal retoma a mesma Zona e Onda e todos voltam. 4) Na Raid não há revive por tempo (2/3 min): quem morre só volta com auto-revive (Brasa Eterna, Fênix Rubra, Coração do Vazio) ou revive de Clérigo (Cetro da Vida, Árvore-Mundo).",
      categoria: "chefes"
    },
    casulo_vexxaris: {
      termo: "Casulo de Vexxaris (Chave da Raid)",
      curto: "Consumível Lendário raríssimo que abre o lobby da Raid Covil de Vexxaris no canal em que você está jogando.",
      detalhes: "Como conseguir: drop raríssimo de chefes de zona nas lives (o atributo Sorte aumenta a chance de drops até 100 pontos). Não pode ser vendido/comprado no Mercado nem fabricado na Forja ou Alquimia. Ao usá-lo na mochila ('Meu personagem' -> 'Usar: romper o Casulo'), você já entra automaticamente na Raid e abre o código na tela da live para os demais jogadores digitarem $raid CÓDIGO.",
      categoria: "chefes"
    },
    aneis_raid: {
      termo: "Anéis da Raid: Presa de Ixtharra (18) e Teia Escarlate (19)",
      curto: "Anéis Arcanos exclusivos do Covil de Vexxaris. Não possuem proc periódico, concentrando o orçamento em atributos brutos altíssimos.",
      detalhes: "Diferente dos anéis Arcanos 14 a 17 (que têm efeitos periódicos/condicionais no motor de combate e saem na Forja Arcana), os anéis 18 e 19 só caem na Raid e focam 100% em atributos base que escalam direto o FC, ataques, skills e EHP: • Anel da Presa de Ixtharra (look 18): focado em muito Ataque e Crítico brutos (com Vida e Defesa de brinde, ~4,05 ATK/nv e ~0,64 CRÍT/nv estimados). • Anel da Teia Escarlate (look 19): focado em muita Vida, Defesa e Velocidade (com Ataque de brinde, ~16,20 HP/nv, ~2,95 DEF/nv e +18% VEL estimados).",
      categoria: "equipamentos"
    },
    comparativo_aneis: {
      termo: "Comparativo de Anéis Arcanos e Imortais (Atributos por Nível)",
      curto: "Cada anel possui sua própria distribuição de ATK, DEF, HP, CRÍT por nível do item e VEL fixa.",
      detalhes: "Curvas medidas na API por nível do item (Nv): • Eclipse Arcano (14): 3,68 ATK/nv, 0,57 CRÍT/nv, 1,22 DEF/nv, 5,93 HP/nv, 16% VEL + Eco 60%/duplo 20%. • Ceifador Cósmico (16): 3,42 ATK/nv, 0,43 CRÍT/nv, 1,46 DEF/nv, 6,85 HP/nv, 18% VEL + até +40% ATK por almas. • Coração do Vazio (15): 2,46 ATK/nv, 0,28 CRÍT/nv, 2,71 DEF/nv, 14,87 HP/nv, 12% VEL + Revive 70% HP. • Prisma Estelar (17): 2,21 ATK/nv, 0,22 CRÍT/nv, 2,21 DEF/nv, 12,87 HP/nv, 14% VEL + Purificação/Escudo/Cura a cada 10s. • Imortais (10 a 13): Sede Escarlate (1,65 ATK/nv, sangramento puro), Carrasco (1,83 ATK/nv, +60% dano <=30% HP), Sanguessuga (5,75 HP/nv, 8% lifesteal) e Fênix Rubra (6,95 HP/nv, revive 40% HP).",
      categoria: "equipamentos"
    },
    alquimia: {
      termo: "Alquimia (Reciclar 5 Fragmentos -> Criar Item Garantido)",
      curto: "Transforma equipamentos não usados em fragmentos (1 por item) e junta 5 fragmentos iguais para criar 1 item novo garantido (sem risco de falha).",
      detalhes: "1) Reciclar: cada equipamento destruído (exceto equipados, favoritos ou com gemas) vira 1 fragmento daquele slot e raridade + EXP de Alquimia. 2) Criar: com 5 fragmentos do mesmo slot e raridade, você cria 1 peça nova 100% garantida (sem roleta). 3) Faixas por nível de Alquimia: Nv. 1 cria itens nível 0–24; Nv. 2 cria nível 25–49; Nv. 3 cria nível 50–79; Nv. 4 cria nível 80–110 (liberado até raridade Lendária).",
      categoria: "forjas"
    },
    aprimorar: {
      termo: "Aprimorar Item (Sacrificar Itens por EXP)",
      curto: "Transforma até 30 itens extras do mesmo slot em experiência para subir o nível (itemLevel) e os atributos de um equipamento principal.",
      detalhes: "Escolha o equipamento que deseja evoluir e selecione até 30 peças do mesmo tipo (arma, elmo, armadura ou anel) para destruir como 'pó de EXP'. O custo em ouro escala com a raridade e a experiência das peças sacrificadas, e o jogo exibe o ganho exato de nível e FC antes de confirmar.",
      categoria: "forjas"
    },
    transmog_auras: {
      termo: "Transmog e Auras Cosméticas",
      curto: "A Transmog copia o visual de outro item (consumindo a origem), e as auras agora são itens cosméticos independentes.",
      detalhes: "No patch de 14/11/2026, o brilho que antes vinha embutido nos anéis e conjuntos Arcanos virou um item cosmético separado (slot: 'cosmetic') que você escolhe equipar ou forjar. Já a Transmog permite transferir a aparência de um item para outro do mesmo slot, consumindo o item usado como modelo visual.",
      categoria: "equipamentos"
    }
  };

  const ALIASES_TERMOS = {
    dot: "dot",
    bleed: "dot",
    sangramento: "dot",
    dano_continuo: "dot",
    true_damage: "true_damage",
    dano_verdadeiro: "true_damage",
    ehp: "ehp",
    vida_efetiva: "ehp",
    hps: "hps",
    dps: "dps",
    dps_estimado: "dps",
    aspd: "aspd",
    cadencia: "aspd",
    speed_bonus: "speed_bonus",
    speedbonus: "speed_bonus",
    ttk: "ttk",
    furia: "furia",
    rage: "furia",
    proc: "proc",
    singularidade: "singularidade",
    luz_divina: "luz_divina",
    cap: "cap",
    rolagem: "rolagem_gema",
    roll: "rolagem_gema",
    rolagem_gema: "rolagem_gema",
    k: "k_classe",
    k_classe: "k_classe",
    mitigacao: "mitigacao_defesa",
    mitigacao_defesa: "mitigacao_defesa",
    armadura: "armadura",
    sobrevivencia: "sobrevivencia",
    cura: "cura",
    cura_estimada: "cura",
    build: "build",
    fc: "fc",
    fc_total: "fc",
    raid: "raid_vexxaris",
    vexxaris: "raid_vexxaris",
    ixtharra: "raid_vexxaris",
    covil: "raid_vexxaris",
    casulo: "casulo_vexxaris",
    raidcall: "casulo_vexxaris",
    aneis: "comparativo_aneis",
    anel: "comparativo_aneis",
    presa_ixtharra: "aneis_raid",
    teia_escarlate: "aneis_raid",
    alquimia: "alquimia",
    aprimorar: "aprimorar",
    transmog: "transmog_auras",
    aura: "transmog_auras",
    auras: "transmog_auras"
  };

  /**
   * Retorna os dados de um termo do catálogo ou um objeto padrão seguro.
   */
  function obterTermo(chave) {
    const chaveNormal = String(chave || "").trim().toLowerCase();
    const chaveDestino = ALIASES_TERMOS[chaveNormal] || chaveNormal;
    if (Object.hasOwn(CATALOGO_TERMOS, chaveDestino)) {
      return CATALOGO_TERMOS[chaveDestino];
    }
    if (Object.hasOwn(CATALOGO_TERMOS, chave)) {
      return CATALOGO_TERMOS[chave];
    }
    return {
      termo: chave,
      curto: "Definição não cadastrada no glossário.",
      detalhes: "",
      categoria: "geral"
    };
  }

  /**
   * Cria HTML de um botão acessível para abrir tooltip/explicação de um termo.
   */
  function criarBotaoAjudaHtml(chave, rotuloCustomizado = "") {
    const info = obterTermo(chave);
    const label = rotuloCustomizado || `O que significa ${info.termo}?`;
    const textoCurto = escaparHtmlTexto(info.curto);
    return `<button type="button" class="btn-ajuda-termo" data-termo-chave="${escaparHtmlTexto(chave)}" aria-label="${escaparHtmlTexto(label)}">?<span class="tooltip-conteudo" role="tooltip">${textoCurto}</span></button>`;
  }

  /**
   * Cria HTML para um badge de origem (Informado pelo jogo / Calculado / Estimado).
   */
  function criarBadgeOrigemHtml(tipo, textoContexto = "") {
    const tipos = {
      jogo: { classe: "badge-origem-jogo", rotulo: "Informado pelo jogo", icone: "✓", chave: "origem_jogo" },
      calculado: { classe: "badge-origem-calc", rotulo: "Calculado", icone: "🧮", chave: "origem_calculado" },
      estimado: { classe: "badge-origem-est", rotulo: "Estimado", icone: "≈", chave: "origem_estimado" }
    };
    const cfg = tipos[tipo] || tipos.estimado;
    const tooltip = cfg.rotulo + (textoContexto ? ` (${textoContexto})` : "");
    return `<span class="badge-origem ${cfg.classe}" title="${escaparHtmlTexto(tooltip)}"><span class="badge-origem-icone" aria-hidden="true">${cfg.icone}</span> <span class="badge-origem-texto">${cfg.rotulo}</span></span>`;
  }

  /**
   * Renderiza a listagem do glossário completo para a seção "Entenda os termos".
   */
  function renderizarGlossarioHtml(filtro = "") {
    const termoFiltro = (filtro || "").trim().toLowerCase();
    const lista = Object.entries(CATALOGO_TERMOS).filter(([_, item]) => {
      if (!termoFiltro) return true;
      return (
        item.termo.toLowerCase().includes(termoFiltro) ||
        item.curto.toLowerCase().includes(termoFiltro) ||
        (item.detalhes && item.detalhes.toLowerCase().includes(termoFiltro))
      );
    });

    if (lista.length === 0) {
      return `<p class="glossario-vazio">Nenhum termo encontrado para "<strong>${escaparHtmlTexto(filtro)}</strong>".</p>`;
    }

    return `
      <div class="grade-glossario">
        ${lista
          .map(([chave, item]) => `
            <article class="card-glossario" data-chave="${escaparHtmlTexto(chave)}">
              <header class="card-glossario-topo">
                <span class="card-glossario-titulo">${escaparHtmlTexto(item.termo)}</span>
                <span class="card-glossario-cat">${escaparHtmlTexto(item.categoria)}</span>
              </header>
              <p class="card-glossario-curto">${escaparHtmlTexto(item.curto)}</p>
              ${item.detalhes ? `<p class="card-glossario-detalhes">${escaparHtmlTexto(item.detalhes)}</p>` : ""}
            </article>
          `)
          .join("")}
      </div>
    `;
  }

  function escaparHtmlTexto(str) {
    if (str == null) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /**
   * Inicializa ouvintes acessíveis de tooltip para suportar toque, hover, foco e tecla Escape.
   */
  function inicializarComportamentoTooltips(container = document) {
    if (!container || !container.querySelectorAll) return;

    function fecharTodosTooltips() {
      const ativos = document.querySelectorAll(".btn-ajuda-termo.ativo");
      ativos.forEach((btn) => btn.classList.remove("ativo"));
    }

    container.addEventListener("click", (e) => {
      const btn = e.target.closest(".btn-ajuda-termo");
      if (btn) {
        e.preventDefault();
        e.stopPropagation();
        const jaAtivo = btn.classList.contains("ativo");
        fecharTodosTooltips();
        if (!jaAtivo) {
          btn.classList.add("ativo");
        }
        return;
      }
      fecharTodosTooltips();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        fecharTodosTooltips();
      }
    });
  }

  return {
    CATALOGO_TERMOS,
    obterTermo,
    criarBotaoAjudaHtml,
    criarBadgeOrigemHtml,
    renderizarGlossarioHtml,
    inicializarComportamentoTooltips
  };
});

