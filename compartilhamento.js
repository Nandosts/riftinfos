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
    return persistirBuilds(lista) ? novaBuild : null;
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
    return persistirBuilds(lista) ? copia : null;
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
    return persistirBuilds(lista) ? removida : null;
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
    if (!b || !["warrior", "cleric", "archer"].includes(b.cls) || !Array.isArray(b.itens))
      throw new Error("Build incompatível ou inválida. Exporte novamente pelo simulador.");
    const numero = (value, min, max) => {
      if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max)
        throw new Error("A build contém um valor numérico inválido.");
      return value;
    };
    const atributos = Object.fromEntries(["str", "vit", "def", "agi", "luk"].map((key) => [key, numero(b.atributos?.[key], 0, 5000)]));
    const slots = ["weapon", "helmet", "armor", "ring"];
    if (b.itens.length !== 4 || new Set(b.itens.map((it) => it?.slot)).size !== 4)
      throw new Error("A build precisa conter as quatro peças de equipamento.");
    const itens = b.itens.map((it) => {
      if (!slots.includes(it?.slot) || !Array.isArray(it.gems) || it.gems.length > 6)
        throw new Error("Equipamento inválido na build.");
      const item = Object.fromEntries(["id", "slot", "name", "kind", "set"].map((key) => [key, sanitizarTexto(it[key], 120)]));
      for (const key of ["atk", "def", "hp", "crit", "spd"]) item[key] = numero(it[key], 0, 1e9);
      item.rarity = numero(it.rarity, 0, 7);
      item.itemLevel = numero(it.itemLevel, 1, 10000);
      item.look = numero(it.look ?? 0, 0, 10000);
      item.sockets = numero(it.sockets ?? 6, 0, 6);
      item.gemTierPadrao = numero(it.gemTierPadrao ?? 5, 1, 5);
      item.gems = Array.from({ length: 6 }, (_, index) => {
        const g = it.gems[index];
        if (g == null) return null;
        const gem = {};
        for (const suffix of ["", "2"]) {
          if (!suffix || g.stat2 != null) {
            if (!["atk", "hp", "def", "spd", "crit"].includes(g["stat" + suffix]))
              throw new Error("Atributo de gema inválido.");
            gem["stat" + suffix] = g["stat" + suffix];
            gem["value" + suffix] = numero(g["value" + suffix], 0, 1e9);
            gem["pct" + suffix] = g["pct" + suffix] === true;
          }
        }
        for (const key of ["kind", "type", "tipo"]) if (g[key] != null) gem[key] = sanitizarTexto(g[key], 32);
        for (const key of ["tier", "roll", "roll2"]) if (g[key] != null) gem[key] = numero(g[key], 0, 1000);
        return gem;
      });
      return item;
    });
    return { cls: b.cls, level: numero(b.level, 1, 10000), atributos, itens,
      politicaRolagem: ["media", "minima", "maxima", "manual"].includes(b.politicaRolagem) ? b.politicaRolagem : "media" };
  }

  /**
   * Serializa um cenário de simulação (ou par A/B) para URL hash #build=...
   */
  async function serializarBuildParaHash(buildA, buildB = null, nome = "") {
    const payload = {
      v: SCHEMA_VERSION,
      cv: VERSAO_CALCULO,
      n: sanitizarTexto(nome, 60) || null,
      a: clonarBuildSeguro(buildA),
      b: buildB ? clonarBuildSeguro(buildB) : null
    };

    const bytes = new TextEncoder().encode(JSON.stringify(payload));
    if (bytes.length > LIMITE_TAMANHO_PAYLOAD_BYTES) {
      throw new Error("Payload da build excede o limite seguro de 64 KiB.");
    }

    if (typeof CompressionStream === "function" && typeof DecompressionStream === "function") {
      const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream("deflate"));
      const compacto = new Uint8Array(await new Response(stream).arrayBuffer());
      return `build=z.${codificarBase64(compacto).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")}`;
    }

    return `build=${encodeURIComponent(codificarBase64(bytes))}`;
  }

  function codificarBase64(bytes) {
    let binario = "";
    for (const byte of bytes) binario += String.fromCharCode(byte);
    return btoa(binario);
  }

  async function descompactarBuild(bytes) {
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate"));
    const leitor = stream.getReader();
    const decoder = new TextDecoder("utf-8", { fatal: true });
    let total = 0;
    let json = "";
    try {
      while (true) {
        const { value, done } = await leitor.read();
        if (done) return json + decoder.decode();
        total += value.byteLength;
        if (total > LIMITE_TAMANHO_PAYLOAD_BYTES) {
          throw new Error("Payload da build excedeu 64 KiB.");
        }
        json += decoder.decode(value, { stream: true });
      }
    } finally {
      await leitor.cancel();
    }
  }

  /**
   * Decodifica um payload de hash #build=... de forma estrita e segura.
   */
  async function decodificarBuildDeHash(hashString) {
    if (!hashString || hashString.length > 200000) return null;
    let hash = hashString.startsWith("#") ? hashString.slice(1) : hashString;
    const match = hash.match(/(?:^|&)build=([^&]+)/);
    if (!match) return null;

    try {
      const compacto = match[1].startsWith("z.");
      const base64 = compacto
        ? match[1].slice(2).replace(/-/g, "+").replace(/_/g, "/")
        : decodeURIComponent(match[1]);
      const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
      if (!compacto && bytes.length > LIMITE_TAMANHO_PAYLOAD_BYTES) {
        throw new Error("Payload da build excedeu 64 KiB.");
      }
      const jsonStr = compacto
        ? await descompactarBuild(bytes)
        : new TextDecoder("utf-8", { fatal: true }).decode(bytes);

      const obj = JSON.parse(jsonStr);
      if (!obj || typeof obj !== "object") return null;
      if (obj.v !== SCHEMA_VERSION) throw new Error("Versão de build incompatível.");

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
    if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(texto);
        return { sucesso: true, manual: false };
      } catch {}
    }
    return { sucesso: false, manual: true, texto };
  }

  return {
    clonarBuildSeguro,
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

