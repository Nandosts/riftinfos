/**
 * compartilhamento.js — Builds locais salvas, comparação A/B e compartilhamento reproduzível via hash
 * RiftInfos · RiftStream
 */

(function (raiz, fabrica) {
  if (typeof module !== "undefined" && module.exports) {
    module.exports = fabrica();
  } else {
    raiz.RiftCompartilhamento = fabrica();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const CHAVE_STORAGE_BUILDS = "riftinfos:builds:v1";
  const SCHEMA_VERSION = 1;
  const VERSAO_CALCULO = "2026.11.1";
  const LIMITE_TAMANHO_PAYLOAD_BYTES = 64 * 1024; // 64 KiB
  const LIMITE_URL_CARACTERES = 8000;

  /**
   * Lê todas as builds locais salvas.
   */
  function listarBuildsSalvas() {
    if (typeof localStorage === "undefined") return [];
    try {
      const bruto = localStorage.getItem(CHAVE_STORAGE_BUILDS);
      if (!bruto) return [];
      const lista = JSON.parse(bruto);
      return Array.isArray(lista) ? lista : [];
    } catch {
      return [];
    }
  }

  /**
   * Salva uma lista de builds no localStorage.
   */
  function persistirBuilds(lista) {
    if (typeof localStorage === "undefined") return false;
    try {
      localStorage.setItem(CHAVE_STORAGE_BUILDS, JSON.stringify(lista));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Salva um cenário de simulação como build local nomeada.
   */
  function salvarBuildLocal(nome, buildData, perfilOrigem = null) {
    if (!nome || !buildData) return null;
    const lista = listarBuildsSalvas();
    const id = "build_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 6);

    const novaBuild = {
      id,
      nome: sanitizarTexto(nome, 60) || "Nova Build",
      schemaVersion: SCHEMA_VERSION,
      calculationVersion: VERSAO_CALCULO,
      criadaEm: new Date().toISOString(),
      atualizadaEm: new Date().toISOString(),
      origem: perfilOrigem ? { nick: perfilOrigem.nick, plataforma: perfilOrigem.plataforma } : null,
      dados: clonarBuildSeguro(buildData)
    };

    lista.push(novaBuild);
    persistirBuilds(lista);
    return novaBuild;
  }

  /**
   * Duplica uma build existente.
   */
  function duplicarBuild(id) {
    const lista = listarBuildsSalvas();
    const original = lista.find((b) => b.id === id);
    if (!original) return null;

    const copia = {
      ...original,
      id: "build_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 6),
      nome: sanitizarTexto(original.nome + " (Cópia)", 60),
      criadaEm: new Date().toISOString(),
      atualizadaEm: new Date().toISOString(),
      dados: clonarBuildSeguro(original.dados)
    };

    lista.push(copia);
    persistirBuilds(lista);
    return copia;
  }

  /**
   * Renomeia uma build existente.
   */
  function renomearBuild(id, novoNome) {
    const lista = listarBuildsSalvas();
    const item = lista.find((b) => b.id === id);
    if (!item) return false;
    item.nome = sanitizarTexto(novoNome, 60) || item.nome;
    item.atualizadaEm = new Date().toISOString();
    return persistirBuilds(lista);
  }

  /**
   * Exclui uma build retornando a build excluída para permitir ação de desfazer.
   */
  function excluirBuild(id) {
    const lista = listarBuildsSalvas();
    const idx = lista.findIndex((b) => b.id === id);
    if (idx === -1) return null;
    const [removida] = lista.splice(idx, 1);
    persistirBuilds(lista);
    return removida;
  }

  /**
   * Restaura uma build excluída (desfazer).
   */
  function restaurarBuild(buildObj) {
    if (!buildObj || !buildObj.id) return false;
    const lista = listarBuildsSalvas();
    lista.push(buildObj);
    return persistirBuilds(lista);
  }

  /**
   * Clona e valida profundamente o objeto da build para evitar referências cruzadas ou injeção.
   */
  function clonarBuildSeguro(b) {
    if (!b) return null;
    return {
      classe: ["warrior", "cleric", "archer"].includes(b.classe) ? b.classe : "warrior",
      nivel: Math.max(1, Math.min(1000, Number(b.nivel) || 1)),
      goldStats: {
        atk: Math.max(0, Math.min(500, Number(b.goldStats?.atk) || 0)),
        hp: Math.max(0, Math.min(500, Number(b.goldStats?.hp) || 0)),
        def: Math.max(0, Math.min(500, Number(b.goldStats?.def) || 0)),
        spd: Math.max(0, Math.min(500, Number(b.goldStats?.spd) || 0)),
        crit: Math.max(0, Math.min(500, Number(b.goldStats?.crit) || 0))
      },
      atributosBase: {
        for: Math.max(0, Number(b.atributosBase?.for) || 0),
        agi: Math.max(0, Number(b.atributosBase?.agi) || 0),
        int: Math.max(0, Number(b.atributosBase?.int) || 0),
        vit: Math.max(0, Number(b.atributosBase?.vit) || 0),
        sor: Math.max(0, Number(b.atributosBase?.sor) || 0)
      },
      itens: Array.isArray(b.itens)
        ? b.itens.slice(0, 10).map((it) => ({
            slot: sanitizarTexto(it?.slot, 16),
            kind: sanitizarTexto(it?.kind, 32),
            rarity: ["epic", "immortal", "arcane"].includes(it?.rarity) ? it.rarity : "arcane",
            tier: Math.max(1, Math.min(10, Number(it?.tier) || 1)),
            level: Math.max(1, Math.min(500, Number(it?.level) || 300)),
            set: sanitizarTexto(it?.set, 32) || null,
            gems: Array.isArray(it?.gems)
              ? it.gems.slice(0, 3).map((g) => ({
                  tipo: sanitizarTexto(g?.tipo, 32),
                  tier: Math.max(1, Math.min(10, Number(g?.tier) || 5)),
                  itemLevel: Math.max(1, Math.min(500, Number(g?.itemLevel) || 300)),
                  roll: Math.max(0.7, Math.min(1.3, Number(g?.roll) || 1.0)),
                  rollSecundario: g?.rollSecundario != null ? Math.max(0.7, Math.min(1.3, Number(g.rollSecundario))) : null,
                  valorCalculado: Number(g?.valorCalculado) || 0
                }))
              : []
          }))
        : [],
      politicaRolagem: ["media", "minima", "maxima", "manual"].includes(b.politicaRolagem) ? b.politicaRolagem : "media"
    };
  }

  /**
   * Serializa um cenário de simulação (ou par A/B) para URL hash #build=...
   */
  function serializarBuildParaHash(buildA, buildB = null, nome = "") {
    const payload = {
      v: SCHEMA_VERSION,
      cv: VERSAO_CALCULO,
      n: sanitizarTexto(nome, 60) || null,
      a: clonarBuildSeguro(buildA),
      b: buildB ? clonarBuildSeguro(buildB) : null
    };

    const jsonStr = JSON.stringify(payload);
    if (jsonStr.length > LIMITE_TAMANHO_PAYLOAD_BYTES) {
      throw new Error("Payload da build excede o limite seguro de 64 KiB.");
    }

    const codificado = encodeURIComponent(btoa(unescape(encodeURIComponent(jsonStr))));
    return `build=${codificado}`;
  }

  /**
   * Decodifica um payload de hash #build=... de forma estrita e segura.
   */
  function decodificarBuildDeHash(hashString) {
    if (!hashString) return null;
    let hash = hashString.startsWith("#") ? hashString.slice(1) : hashString;
    const match = hash.match(/(?:^|&)build=([^&]+)/);
    if (!match) return null;

    try {
      const decB64 = atob(decodeURIComponent(match[1]));
      const jsonStr = decodeURIComponent(escape(decB64));

      if (jsonStr.length > LIMITE_TAMANHO_PAYLOAD_BYTES) {
        throw new Error("Payload da build excedeu 64 KiB.");
      }

      const obj = JSON.parse(jsonStr);
      if (!obj || typeof obj !== "object") return null;
      if (obj.v !== SCHEMA_VERSION) {
        console.warn(`Versão do esquema da build compartilhada (${obj.v}) diferente da atual (${SCHEMA_VERSION}).`);
      }

      return {
        schemaVersion: obj.v,
        calculationVersion: obj.cv,
        nome: sanitizarTexto(obj.n, 60),
        buildA: clonarBuildSeguro(obj.a),
        buildB: obj.b ? clonarBuildSeguro(obj.b) : null
      };
    } catch (e) {
      console.error("Falha ao decodificar build do hash:", e);
      return null;
    }
  }

  /**
   * Exporta a build para um arquivo JSON baixável pelo usuário.
   */
  function exportarBuildParaArquivo(buildObj, nomeArquivo = "build-riftinfos.json") {
    try {
      const jsonStr = JSON.stringify(buildObj, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = nomeArquivo;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Sanitiza strings para prevenir injeção.
   */
  function sanitizarTexto(str, maxLen = 64) {
    if (str == null) return "";
    return String(str)
      .slice(0, maxLen)
      .replace(/[<>'"&]/g, "")
      .trim();
  }

  /**
   * Copia texto para a área de transferência com suporte a fallback manual.
   */
  async function copiarTextoComFallback(texto) {
    if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(texto);
        return { sucesso: true, manual: false };
      } catch {}
    }
    return { sucesso: false, manual: true, texto };
  }

  return {
    listarBuildsSalvas,
    salvarBuildLocal,
    duplicarBuild,
    renomearBuild,
    excluirBuild,
    restaurarBuild,
    serializarBuildParaHash,
    decodificarBuildDeHash,
    exportarBuildParaArquivo,
    copiarTextoComFallback,
    LIMITE_URL_CARACTERES
  };
});

