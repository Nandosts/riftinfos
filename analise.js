/**
 * analise.js — Análise de perfil, envelopes de consulta e regras determinísticas
 * RiftInfos · RiftStream
 */

(function (raiz, fabrica) {
  if (typeof module !== "undefined" && module.exports) {
    module.exports = fabrica();
  } else {
    raiz.RiftAnalise = fabrica();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSAO_CALCULO = "2026.11.18";

  /**
   * Cria um envelope padrão de estado de consulta de dados.
   */
  function criarEnvelopeConsulta(dadosIniciais = null) {
    return {
      data: dadosIniciais,
      status: "idle", // 'idle' | 'loading' | 'success' | 'partial' | 'stale' | 'error'
      receivedAt: null,
      sourceUpdatedAt: null,
      fromCache: false,
      error: null,
      completeness: null
    };
  }

  /**
   * Normaliza números de forma estrita, rejeitando NaN, Infinity e valores fora do domínio.
   */
  function normalizarNumero(valor, padrao = null, min = -Infinity, max = Infinity) {
    if (valor == null || valor === "" || typeof valor === "boolean") return padrao;
    const num = Number(valor);
    if (!Number.isFinite(num)) return padrao;
    if (num < min || num > max) return padrao;
    return num;
  }

  /**
   * Analisa os dados de um perfil e gera um objeto estruturado de análise determinística.
   * Não renderiza HTML: retorna o modelo conceitual pronto para consumo por Resumo, Simulador ou Comparar.
   */
  function analisarPerfilParaResumo(perfil, statusCalculados, metricasCombate, classe, catalogoConjuntos) {
    if (!perfil) return null;

    const fcInformadoBruto = normalizarNumero(perfil.power, null, 0);
    const fcReconstruido = normalizarNumero(
      statusCalculados?.fc ?? (typeof calcularFc === "function" ? calcularFc(classe || perfil.cls, statusCalculados) : null),
      null,
      0
    );

    // Comparação entre FC informado e reconstruído
    let comparacaoFc = {
      informado: fcInformadoBruto,
      reconstruido: fcReconstruido,
      diferencaAbsoluta: null,
      diferencaPercentual: null,
      concordanciaPerfeita: false,
      explicacao: "FC oficial informado pelo jogo."
    };

    if (fcInformadoBruto != null && fcReconstruido != null) {
      const diffAbs = Math.round(fcReconstruido - fcInformadoBruto);
      const diffPct = fcInformadoBruto > 0 ? (diffAbs / fcInformadoBruto) * 100 : null;
      const concordancia = Math.abs(diffAbs) <= 200 || (diffPct != null && Math.abs(diffPct) < 0.05);

      let textoExplicacao = "";
      if (concordancia) {
        textoExplicacao = "Os valores estão próximos. A diferença, por si só, não identifica sua causa.";
      } else {
        textoExplicacao = "Há diferença entre o FC informado e o reconstruído. Atributos inferidos, arredondamentos ou regras não modeladas podem contribuir; a causa não foi determinada.";
      }

      comparacaoFc = {
        informado: fcInformadoBruto,
        reconstruido: fcReconstruido,
        diferencaAbsoluta: diffAbs,
        diferencaPercentual: diffPct,
        concordanciaPerfeita: concordancia,
        explicacao: textoExplicacao
      };
    }

    // Indicadores principais (máx 4)
    const indicadores = [];

    // 1. FC principal
    indicadores.push({
      id: "fc",
      titulo: "Força de Combate (FC)",
      pergunta: "Qual é o nível de poder geral?",
      valor: fcInformadoBruto != null ? fcInformadoBruto : fcReconstruido,
      unidade: "FC",
      origem: fcInformadoBruto != null ? "jogo" : "calculado",
      resumo: "Poder de combate global consolidado do personagem.",
      detalhes: comparacaoFc.explicacao
    });

    // 2. DPS estimado
    const dpsValor = normalizarNumero(metricasCombate?.dpsCombateMedio ?? metricasCombate?.dpsTotal, null, 0);
    const aspdReal = normalizarNumero(metricasCombate?.cadenciaReal ?? metricasCombate?.aspdReal, 1, 0);
    const critChance = normalizarNumero(statusCalculados?.crit ?? statusCalculados?.critChance, 0, 0, 100);
    const danoSkill = normalizarNumero(metricasCombate?.skillDanoPorAlvo ?? metricasCombate?.danoPorSkill, 0, 0);
    const cdSkill = normalizarNumero(metricasCombate?.cdSkillReal ?? metricasCombate?.cdRealSkill, 10, 0);

    indicadores.push({
      id: "dps",
      titulo: "DPS Estimado",
      pergunta: "Quanto dano causa por segundo?",
      valor: dpsValor,
      unidade: "/s",
      origem: "estimado",
      resumo: "Dano médio por segundo contra alvo de teste (0 DEF, sem redução).",
      detalhes: `Considera cadência real de ${aspdReal.toFixed(2)} golpes/s, crítico de ${critChance.toFixed(1)}% e dano de skill de ${Math.round(danoSkill).toLocaleString("pt-BR")} a cada ${cdSkill.toFixed(1)}s.`
    });

    // 3. Vida e Sobrevivência
    const hpMax = normalizarNumero(statusCalculados?.maxHp ?? statusCalculados?.hp, null, 0);
    const ehp = normalizarNumero(metricasCombate?.ehp ?? metricasCombate?.ehpFisico, hpMax, 0);
    const redDefPct = normalizarNumero(
      typeof metricasCombate?.reducaoDefesa === "number"
        ? metricasCombate.reducaoDefesa * 100
        : metricasCombate?.reducaoDefPct,
      0,
      0,
      100
    );

    indicadores.push({
      id: "sobrevivencia",
      titulo: "Vida Máxima & Defesa",
      pergunta: "Qual é a capacidade de sobrevivência física?",
      valor: hpMax,
      unidade: "HP",
      origem: "calculado",
      resumo: `Vida total com ${redDefPct.toFixed(1)}% de redução física pela defesa.`,
      detalhes: `Vida Efetiva Física (EHP): ~${Math.round(ehp || 0).toLocaleString("pt-BR")} de dano físico bruto suportado. Importante: dano que ignora defesa não recebe essa redução e atinge a vida (${Math.round(hpMax || 0).toLocaleString("pt-BR")}).`
    });

    // 4. Indicador de classe
    if (classe === "cleric") {
      const curaSkill = normalizarNumero(metricasCombate?.curaSkillLuzDivina ?? metricasCombate?.curaPorSkill, null, 0);
      const cd = normalizarNumero(metricasCombate?.cdSkillReal ?? metricasCombate?.cdRealSkill, 10, 0.1);
      const hps = curaSkill && cd ? curaSkill / cd : normalizarNumero(metricasCombate?.hpsTotal, 0, 0);
      indicadores.push({
        id: "cura",
        titulo: "Poder de Cura",
        pergunta: "Qual é o suporte prestado à equipe?",
        valor: curaSkill,
        unidade: "por skill",
        origem: "estimado",
        resumo: `Cura estimada da Luz Divina (${Math.round(hps || 0).toLocaleString("pt-BR")} por segundo em média, considerando o intervalo da habilidade).`,
        detalhes: "Neste modelo: (ATK × 2,4 + nível × 1,5 + 6) × bônus de velocidade × multiplicador de cura da arma."
      });
    } else if (classe === "archer") {
      indicadores.push({
        id: "cadencia",
        titulo: "Cadência & Crítico",
        pergunta: "Qual é a velocidade de disparo?",
        valor: aspdReal ? aspdReal.toFixed(2) : "—",
        unidade: "tiros/s",
        origem: "calculado",
        resumo: `Ataques contínuos com ${critChance.toFixed(1)}% de chance de crítico.`,
        detalhes: `Cadência máxima limitada pelo cap do jogo a 4,60 ataques por segundo. Chance de crítico: ${critChance.toFixed(1)}%.`
      });
    } else {
      // Guerreiro
      const defTotal = normalizarNumero(statusCalculados?.def, 0, 0);
      indicadores.push({
        id: "armadura",
        titulo: "Redução de Dano",
        pergunta: "Quanto dano físico sua armadura bloqueia?",
        valor: `${redDefPct.toFixed(1)}%`,
        unidade: "mitigação",
        origem: "calculado",
        resumo: `Defesa total de ${Math.round(defTotal).toLocaleString("pt-BR")} pontos.`,
        detalhes: "Neste modelo, redução física = (DEF × 4) ÷ (100 + DEF × 4). Não se aplica a dano que ignora defesa."
      });
    }

    // Pontos de atenção determinísticos (até 3)
    const pontosAtencao = [];

    // Regra 1: Espaços de gemas vazios
    let slotsVazios = 0;
    if (Array.isArray(perfil.equipped)) {
      for (const rawItem of perfil.equipped) {
        if (!rawItem) continue;
        const it = rawItem.item || rawItem;
        const maxGemas = Math.max(0, Math.min(6, Number(it.sockets ?? (it.rarity === 7 ? 6 : it.rarity >= 5 ? 4 : 2))));
        const gemasQtd = Array.isArray(it.gems) ? it.gems.filter(Boolean).length : 0;
        if (maxGemas > gemasQtd) {
          slotsVazios += maxGemas - gemasQtd;
        }
      }
    }
    if (slotsVazios > 0) {
      pontosAtencao.push({
        id: "gemas_vazias",
        tipo: "alerta",
        icone: "💎",
        titulo: `${slotsVazios} espaço${slotsVazios > 1 ? "s" : ""} de gema vazio${slotsVazios > 1 ? "s" : ""}`,
        texto: `Você tem ${slotsVazios} espaço${slotsVazios > 1 ? "s" : ""} de gema disponível${slotsVazios > 1 ? "s" : ""} para equipar em suas peças.`,
        valores: { slotsVazios },
        acaoTexto: "Ver Equipamentos",
        acaoAba: "equipamentos",
        explicacao: "Gemas fornecem ATK, HP, DEF ou Crítico diretos que são amplificados pelos multiplicadores dos seus equipamentos e pelo bônus de classe."
      });
    }

    // Regra 2: Conjuntos quase completos (ex: 2 de 3 peças)
    if (catalogoConjuntos && Array.isArray(perfil.equipped)) {
      const contagemSets = {};
      for (const rawItem of perfil.equipped) {
        if (!rawItem) continue;
        const it = rawItem.item || rawItem;
        const setName = it?.set;
        if (setName) {
          contagemSets[setName] = (contagemSets[setName] || 0) + 1;
        }
      }
      for (const [setName, qtd] of Object.entries(contagemSets)) {
        if (qtd === 2 && catalogoConjuntos[setName]) {
          const cfg = catalogoConjuntos[setName];
          pontosAtencao.push({
            id: `set_incompleto_${setName}`,
            tipo: "oportunidade",
            icone: "🛡️",
            titulo: `Conjunto ${cfg.nome} em 2/3 peças`,
            texto: `Equipar a 3ª peça ativa o bônus principal do conjunto (ex: ${formatarBonusSetCurto(cfg.b3)}).`,
            valores: { setName, qtdAtual: 2, qtdDestino: 3 },
            acaoTexto: "Simular no Simulador",
            acaoAba: "simulador",
            explicacao: "Bônus de 3 peças de conjuntos arcanos e imortais concedem amplificações percentuais substanciais no dano, velocidade ou sobrevivência."
          });
          if (pontosAtencao.length >= 3) break;
        }
      }
    }

    // Regra 3: Alerta de dano verdadeiro / sangramento em chefes
    if (pontosAtencao.length < 3) {
      pontosAtencao.push({
        id: "dano_verdadeiro_chefes",
        tipo: "info",
        icone: "⚠️",
        titulo: "Defesa física não reduz sangramento",
        texto: `Sua defesa física reduz ${redDefPct.toFixed(1)}% do dano normal, mas chefes de zona alta possuem sangramentos e habilidades que ignoram defesa.`,
        valores: { reducaoDefesa: redDefPct, vidaPura: hpMax },
        acaoTexto: "Simular em Chefes",
        acaoAba: "monstros",
        explicacao: "Em ondas avançadas de chefes com mecânicas de Fúria ou Singularidade, a Vida Pura e bônus de escudo têm valor de sobrevivência superior ao de armadura pura."
      });
    }

    return {
      versaoCalculo: VERSAO_CALCULO,
      comparacaoFc,
      indicadores,
      pontosAtencao: pontosAtencao.slice(0, 3)
    };
  }

  function formatarBonusSetCurto(bonus) {
    if (!bonus) return "bônus especial";
    const partes = [];
    if (bonus.atk) partes.push(`+${Math.round(bonus.atk * 100)}% ATK`);
    if (bonus.hp) partes.push(`+${Math.round(bonus.hp * 100)}% HP`);
    if (bonus.def) partes.push(`+${Math.round(bonus.def * 100)}% DEF`);
    if (bonus.spd) partes.push(`+${Math.round(bonus.spd * 100)}% Vel.`);
    if (bonus.crit) partes.push(`+${bonus.crit}% Crítico`);
    return partes.join(", ") || "bônus especial";
  }

  return {
    VERSAO_CALCULO,
    criarEnvelopeConsulta,
    normalizarNumero,
    analisarPerfilParaResumo
  };
});

