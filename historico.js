/**
 * historico.js — Armazenamento versionado de snapshots e evolução do personagem
 * RiftInfos · RiftStream
 */

(function (raiz, fabrica) {
  if (typeof module !== "undefined" && module.exports) {
    module.exports = fabrica();
  } else {
    raiz.RiftHistorico = fabrica();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const CHAVE_STORAGE = "riftinfos:history:v1";
  const CHAVE_CONFIG_AUTOSAVE = "riftinfos:autosave_history:v1";
  const SCHEMA_VERSION = 1;
  const LIMITE_REGISTROS_POR_PERSONAGEM = 100;
  const VERSAO_CALCULO_PADRAO = "2026.11.1";

  /**
   * Obtém chave canônica de identidade.
   */
  function gerarChaveIdentidade(plataforma, login, classe) {
    const plat = (plataforma || "twitch").trim().toLowerCase();
    const nick = (login || "").trim().toLowerCase();
    const cls = (classe || "warrior").trim().toLowerCase();
    return `${plat}:${nick}:${cls}`;
  }

  /**
   * Lê todos os dados do histórico de forma segura.
   */
  function lerTodosRegistros() {
    if (typeof localStorage === "undefined") return {};
    try {
      const bruto = localStorage.getItem(CHAVE_STORAGE);
      if (!bruto) return {};
      const obj = JSON.parse(bruto);
      return typeof obj === "object" && obj !== null ? obj : {};
    } catch {
      return {};
    }
  }

  /**
   * Salva todos os registros no localStorage com tratamento de cota (FIFO).
   */
  function salvarTodosRegistros(dados) {
    if (typeof localStorage === "undefined") return false;
    try {
      localStorage.setItem(CHAVE_STORAGE, JSON.stringify(dados));
      return true;
    } catch (e) {
      if (e && (e.name === "QuotaExceededError" || e.code === 22)) {
        podarRegistrosAntigos(dados);
        try {
          localStorage.setItem(CHAVE_STORAGE, JSON.stringify(dados));
          return true;
        } catch {
          return false;
        }
      }
      return false;
    }
  }

  /**
   * Remove registros mais antigos para liberar espaço.
   */
  function podarRegistrosAntigos(dados) {
    for (const idChave of Object.keys(dados)) {
      if (Array.isArray(dados[idChave]) && dados[idChave].length > 20) {
        // Reduz pela metade os mais antigos
        dados[idChave] = dados[idChave].slice(-20);
      }
    }
  }

  /**
   * Compacta o perfil para armazenar apenas o necessário para reconstrução analítica.
   */
  function compactarPerfil(perfil) {
    if (!perfil) return null;
    const equippedCompacto = Array.isArray(perfil.equipped)
      ? perfil.equipped.map((it) => ({
          slot: it?.slot || null,
          item: it?.item
            ? {
                kind: it.item.kind || null,
                rarity: it.item.rarity || null,
                tier: it.item.tier != null ? it.item.tier : null,
                level: it.item.level != null ? it.item.level : null,
                set: it.item.set || null,
                stats: it.item.stats || null
              }
            : null,
          gems: Array.isArray(it?.gems)
            ? it.gems.map((g) => ({
                kind: g?.kind || null,
                tier: g?.tier != null ? g.tier : null,
                roll: g?.roll != null ? g.roll : null,
                stats: g?.stats || null
              }))
            : []
        }))
      : [];

    return {
      level: perfil.level != null ? perfil.level : null,
      power: perfil.power != null ? perfil.power : null,
      counters: perfil.counters ? { ...perfil.counters } : {},
      equipped: equippedCompacto
    };
  }

  /**
   * Salva um snapshot da consulta atual.
   * Retorna { sucesso, duplicado, total }
   */
  function salvarSnapshotConsulta(plataforma, login, classe, perfil, sourceUpdatedAt = null, versaoCalculo = VERSAO_CALCULO_PADRAO) {
    if (!login || !perfil) return { sucesso: false, duplicado: false, erro: "Perfil ou login inválido." };

    const chave = gerarChaveIdentidade(plataforma, login, classe);
    const todos = lerTodosRegistros();
    const lista = Array.isArray(todos[chave]) ? todos[chave] : [];

    const perfilCompacto = compactarPerfil(perfil);
    const agoraIso = new Date().toISOString();

    // Verificação de duplicata recente
    if (lista.length > 0) {
      const ultimo = lista[lista.length - 1];
      const mesmoPower = ultimo?.profile?.power === perfilCompacto.power;
      const mesmoLevel = ultimo?.profile?.level === perfilCompacto.level;
      const mesmosCounters = JSON.stringify(ultimo?.profile?.counters) === JSON.stringify(perfilCompacto.counters);
      if (mesmoPower && mesmoLevel && mesmosCounters) {
        return { sucesso: true, duplicado: true, total: lista.length };
      }
    }

    const snapshot = {
      schemaVersion: SCHEMA_VERSION,
      calculationVersion: versaoCalculo,
      identity: {
        platform: (plataforma || "twitch").toLowerCase(),
        login: (login || "").toLowerCase(),
        cls: (classe || "warrior").toLowerCase()
      },
      capturedAt: agoraIso,
      sourceUpdatedAt: sourceUpdatedAt || null,
      profile: perfilCompacto
    };

    lista.push(snapshot);
    if (lista.length > LIMITE_REGISTROS_POR_PERSONAGEM) {
      lista.splice(0, lista.length - LIMITE_REGISTROS_POR_PERSONAGEM);
    }
    todos[chave] = lista;

    const salvo = salvarTodosRegistros(todos);
    return { sucesso: salvo, duplicado: false, total: lista.length };
  }

  /**
   * Obtém todos os snapshots salvos para a identidade informada.
   */
  function obterHistoricoPersonagem(plataforma, login, classe) {
    const chave = gerarChaveIdentidade(plataforma, login, classe);
    const todos = lerTodosRegistros();
    return Array.isArray(todos[chave]) ? todos[chave] : [];
  }

  /**
   * Limpa o histórico de um personagem.
   */
  function limparHistoricoPersonagem(plataforma, login, classe) {
    const chave = gerarChaveIdentidade(plataforma, login, classe);
    const todos = lerTodosRegistros();
    delete todos[chave];
    return salvarTodosRegistros(todos);
  }

  /**
   * Configuração de autosave.
   */
  function obterConfigAutoSave() {
    if (typeof localStorage === "undefined") return false;
    try {
      return localStorage.getItem(CHAVE_CONFIG_AUTOSAVE) === "true";
    } catch {
      return false;
    }
  }

  function definirConfigAutoSave(ativo) {
    if (typeof localStorage === "undefined") return;
    try {
      localStorage.setItem(CHAVE_CONFIG_AUTOSAVE, ativo ? "true" : "false");
    } catch {}
  }

  /**
   * Compara dois snapshots do histórico e retorna as diferenças detalhadas.
   */
  function compararSnapshots(snapA, snapB) {
    if (!snapA || !snapB) return null;

    // Garante ordem cronológica
    const dataA = new Date(snapA.capturedAt);
    const dataB = new Date(snapB.capturedAt);
    const anterior = dataA <= dataB ? snapA : snapB;
    const posterior = dataA <= dataB ? snapB : snapA;

    const fcAntigo = anterior?.profile?.power || 0;
    const fcNovo = posterior?.profile?.power || 0;
    const deltaFc = fcNovo - fcAntigo;
    const deltaFcPct = fcAntigo > 0 ? (deltaFc / fcAntigo) * 100 : null;

    const lvlAntigo = anterior?.profile?.level || 0;
    const lvlNovo = posterior?.profile?.level || 0;
    const deltaLvl = lvlNovo - lvlAntigo;

    // Análise de equipamentos trocados
    const pecasAntigas = anterior?.profile?.equipped || [];
    const pecasNovas = posterior?.profile?.equipped || [];
    const alteracoesItens = [];

    const mapaAntigo = new Map();
    pecasAntigas.forEach((p, idx) => {
      const slot = p?.slot || idx;
      mapaAntigo.set(slot, p);
    });

    pecasNovas.forEach((pNova, idx) => {
      const slot = pNova?.slot || idx;
      const pAntiga = mapaAntigo.get(slot);
      if (!pAntiga) {
        alteracoesItens.push({
          slot,
          tipo: "novo",
          descricao: `Nova peça equipada: ${pNova?.item?.kind || "Item"} (${pNova?.item?.rarity || "—"})`
        });
      } else {
        const mudouKind = pAntiga?.item?.kind !== pNova?.item?.kind;
        const mudouRarity = pAntiga?.item?.rarity !== pNova?.item?.rarity;
        const mudouTier = pAntiga?.item?.tier !== pNova?.item?.tier;
        const mudouLevel = pAntiga?.item?.level !== pNova?.item?.level;
        if (mudouKind || mudouRarity || mudouTier || mudouLevel) {
          alteracoesItens.push({
            slot,
            tipo: "substituicao",
            antigo: `${pAntiga?.item?.kind || "—"} (${pAntiga?.item?.rarity || "—"})`,
            novo: `${pNova?.item?.kind || "—"} (${pNova?.item?.rarity || "—"})`,
            descricao: `Troca no slot ${slot}: ${pAntiga?.item?.kind || "Item"} → ${pNova?.item?.kind || "Item"}`
          });
        }
      }
    });

    // Comparação de contadores de forja
    const countersAntigo = anterior?.profile?.counters || {};
    const countersNovo = posterior?.profile?.counters || {};
    const evolucaoForjas = [];

    const todasChaves = Array.from(new Set([...Object.keys(countersAntigo), ...Object.keys(countersNovo)]));
    for (const c of todasChaves) {
      const vAntigo = Number(countersAntigo[c]) || 0;
      const vNovo = Number(countersNovo[c]) || 0;
      const delta = vNovo - vAntigo;
      if (delta !== 0) {
        evolucaoForjas.push({
          contador: c,
          antigo: vAntigo,
          novo: vNovo,
          delta,
          possivelReset: delta < 0
        });
      }
    }

    return {
      periodo: {
        inicio: anterior.capturedAt,
        fim: posterior.capturedAt,
        textoJanela: formatarIntervaloDatas(anterior.capturedAt, posterior.capturedAt)
      },
      fc: { anterior: fcAntigo, posterior: fcNovo, delta: deltaFc, deltaPct: deltaFcPct },
      nivel: { anterior: lvlAntigo, posterior: lvlNovo, delta: deltaLvl },
      alteracoesItens,
      evolucaoForjas,
      compatibilidadeVersao: anterior.calculationVersion === posterior.calculationVersion
    };
  }

  function formatarIntervaloDatas(isoA, isoB) {
    try {
      const dA = new Date(isoA);
      const dB = new Date(isoB);
      const fmt = (d) =>
        `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")} às ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
      return `Entre ${fmt(dA)} e ${fmt(dB)}`;
    } catch {
      return "Período registrado";
    }
  }

  return {
    gerarChaveIdentidade,
    salvarSnapshotConsulta,
    obterHistoricoPersonagem,
    limparHistoricoPersonagem,
    compararSnapshots,
    obterConfigAutoSave,
    definirConfigAutoSave,
    formatarIntervaloDatas
  };
});

