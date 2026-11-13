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
      detalhes: "O FC agrega vida, ataque, defesa, crítico, velocidade e coeficientes de classe. A variação entre o FC oficial e o reconstruído deve-se principalmente à sorte nas rolagens das gemas (85% a 115%) e arredondamentos de conjuntos.",
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
      detalhes: "Calculado pela fórmula oficial: FC = (HP×k_hp + ATK×k_atk + DEF×k_def) × multiplicadores de classe e conjuntos. Permite simular mudanças de build sob o mesmo padrão.",
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
      curto: "Cura estimada da habilidade Luz Divina e pulsos por segundo. Escala com ATK, nível e cajado equipado.",
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
      detalhes: "Calculado pela fórmula de mitigação oficial: Defesa / (Defesa + K_defesa). Mitiga exclusivamente golpes físicos convencionais.",
      categoria: "combate"
    },
    crit_chance: {
      termo: "Chance de crítico",
      curto: "Probabilidade de um golpe causar dano crítico. É diferente do dano causado quando o crítico acontece.",
      detalhes: "Valores acima de 100% garantem acerto crítico em todos os ataques normais, mas não geram acertos adicionais a menos que habilidades específicas determinem.",
      categoria: "combate"
    },
    crit_dano: {
      termo: "Dano crítico",
      curto: "Multiplicador de dano aplicado quando ocorre um golpe crítico.",
      detalhes: "O valor base é 150% (1,5×). Gemas de crítico e atributos aumentam esse multiplicador percentualmente.",
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
      detalhes: "Calculado a partir de INT, ATK e bônus específicos de cetros/cajados. Dividido entre cura por habilidade (Luz Divina) e pulsos contínuos.",
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
      detalhes: "Usa fórmulas exatas sem necessidade de inferir atributos ou criar cenários hipotéticos.",
      categoria: "origem"
    },
    origem_estimado: {
      termo: "Estimado",
      curto: "Resultado dependente de premissas, inferência de atributos ou cenário simulado de combate.",
      detalhes: "Qualquer cálculo baseado em atributos não confirmados diretamente ou em condições de alvo (ex: alvo com 0 DEF) é classificado como estimativa.",
      categoria: "origem"
    }
  };

  /**
   * Retorna os dados de um termo do catálogo ou um objeto padrão seguro.
   */
  function obterTermo(chave) {
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

