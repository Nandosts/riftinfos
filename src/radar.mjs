import { alternarVisibilidadeAba } from "./abas.mjs";
import { buscarJsonApi, validarPerfilApi } from "./api.mjs";
import { agregarItens, calcularMetricasCombate } from "./combate.mjs";
import { dispararComparacao, inputCompararNick, selectCompararPlataforma } from "./comparacao.mjs";
import {
  catalogoAneis,
  catalogoArmas,
  catalogoConjuntos,
  nomesClasses,
} from "./dados.mjs";
import { escaparHtml, formatadorInteiro, formatarNumeroCompacto, formatarZonaOndaDeOndas } from "./formato.mjs";
import { abrirModalEscolhaLive, cacheDetalhesCanais, carregarPanoramaGlobal } from "./panorama.mjs";
import {
  consultarPerfil,
  inputNick,
  perfilCarregadoP1,
  selectPlataforma,
} from "./perfil.mjs";

const btnRadarLimparFiltros = document.querySelector("#btn-radar-limpar-filtros");
const btnAtalhoRankingCompleto = document.querySelector("#btn-atalho-ranking-completo");

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

let requisicaoRadarAtiva;

let ultimosDadosRadar = null;
const cachePerfisApi = new Map();

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
      if (sinalAborto?.aborted) return;
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
  validarPerfilApi(dados, login, cls);
  if (cachePerfisApi.size >= 500) cachePerfisApi.delete(cachePerfisApi.keys().next().value);
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

    if (canalInfo) {
      const ehKick = /^kick:/i.test(canalAlvo);
      cacheDetalhesCanais.set(canalAlvo.toLowerCase(), {
        twitchLogin: canalInfo.twitchLogin !== undefined ? canalInfo.twitchLogin : (ehKick ? null : canalAlvo),
        kickLogin: canalInfo.kickLogin !== undefined ? canalInfo.kickLogin : (ehKick ? canalAlvo.replace(/^kick:/i, "") : null),
        displayName: canalInfo.displayName || canalInfo.login,
      });
    }

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
    const listaFalhas = [];
    perfis.forEach((p, idx) => {
      if (!p && listaUnica[idx]) {
        listaFalhas.push(listaUnica[idx]);
      }
    });

    const cobertura = {
      totalAnunciado: canalInfo?.playersNow || totalBoard || 0,
      paginasCarregadas: totalPaginas,
      limitePaginasAtingido: totalBoard > 600 || totalPaginas >= 12,
      jogadoresUnicos: listaUnica.length,
      perfisAnalisados: perfisValidos.length,
      perfisIndisponiveis: listaFalhas.length,
    };

    ultimosDadosRadar = {
      canalAlvo,
      canalInfo,
      totalBoard,
      perfis: perfisValidos,
      cobertura,
      listaFalhas,
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
    if (btnEscanearLive && requisicaoRadarAtiva === controlador) btnEscanearLive.disabled = false;
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
      ...itens.flatMap((i) => (i.gems || []).map((g) => g?.name)),
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
  const { canalAlvo, canalInfo, perfis } = ultimosDadosRadar;
  if (btnAtalhoRankingCompleto && canalAlvo) {
    btnAtalhoRankingCompleto.href = `ranking.html?canal=${encodeURIComponent(canalAlvo)}`;
  }

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

  const cobertura = ultimosDadosRadar.cobertura || {
    totalAnunciado: canalInfo.playersNow || totalEscaneados,
    paginasCarregadas: 1,
    limitePaginasAtingido: false,
    jogadoresUnicos: totalEscaneados,
    perfisAnalisados: totalEscaneados,
    perfisIndisponiveis: 0,
  };

  const topItens = [...contagemItensSala.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([chave, qtd]) => {
      const nome = chave.startsWith("kind:")
        ? (catalogoArmas[chave.slice(5)]?.nome || chave)
        : (catalogoAneis[chave.slice(5)]?.nome || chave);
      const pct = ((qtd / baseDivisorChips) * 100).toFixed(0);
      const rotuloRecorte = filtroClasse ? nomesClasses[filtroClasse].toLowerCase() : "jogadores da live";
      const textoTooltip = `${qtd} de ${baseDivisorChips} ${rotuloRecorte} usam este item (${pct}%)`;
      const ativo = filtroItem === chave ? "ativo" : "";
      return `<button type="button" class="btn-mini ${ativo}" data-radar-quick-item="${escaparHtml(chave)}" title="${escaparHtml(textoTooltip)}">${escaparHtml(nome)}: ${qtd}/${baseDivisorChips} (${pct}%)</button>`;
    })
    .join("");

  const topSets = [...contagemSetsSala.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([setK, qtd]) => {
      const nome = catalogoConjuntos[setK]?.nome || setK;
      const pct = ((qtd / baseDivisorChips) * 100).toFixed(0);
      const chaveSet = `set:${setK}`;
      const rotuloRecorte = filtroClasse ? nomesClasses[filtroClasse].toLowerCase() : "jogadores da live";
      const textoTooltip = `${qtd} de ${baseDivisorChips} ${rotuloRecorte} usam este conjunto (${pct}%)`;
      const ativo = filtroItem === chaveSet ? "ativo" : "";
      return `<button type="button" class="btn-mini ${ativo}" data-radar-quick-item="${escaparHtml(chaveSet)}" title="${escaparHtml(textoTooltip)}">${escaparHtml(nome)}: ${qtd}/${baseDivisorChips} (${pct}%)</button>`;
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

    const dpsTxt = `${formatarNumeroCompacto(met.dpsCombateMedio)} DPS est.`;
    const curaTxt = p.cls === "cleric" && met.infoArma?.skillTipo !== "dano"
      ? `<div class="small muted">${formatarNumeroCompacto(met.curaSkillLuzDivina)} cura em grupo</div>`
      : "";

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
        <td class="num">${dpsTxt}${curaTxt}</td>
        <td class="num">
          ${perfilCarregadoP1 ? `<button type="button" class="btn-mini" data-radar-comparar="${escaparHtml(nickLimpo)}" data-radar-plat="${plat}" data-radar-cls="${escaparHtml(p.cls)}">VS</button>` : ""}
        </td>
      </tr>
    `;
  }).join("");

  const potencialOndas = Number(canalInfo.potentialWaves ?? canalInfo.potential) || 0;
  const textoPotencial = potencialOndas > 0
    ? `${formatarZonaOndaDeOndas(potencialOndas)} (${formatadorInteiro.format(potencialOndas)} ondas)`
    : "Aguardando 1ª run";
  const ultimasRuns = Array.isArray(canalInfo.runs) ? canalInfo.runs.slice(0, 5) : [];
  const resumoRuns = ultimasRuns.length > 0
    ? ultimasRuns.map((run) => `Z${run.zone || "?"}-W${run.wave || "?"}`).join(" · ")
    : "";

  const temFiltroAtivo = Boolean(filtroItem || filtroClasse || buscaTexto);

  containerResultadoRadar.innerHTML = `
    <div class="banner-cobertura-radar" style="background:#1e1a38; border-left:3px solid var(--accent); padding:10px 14px; margin-bottom:12px; font-size:0.85rem;">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
        <div>
          <strong>Situação da cobertura:</strong>
          Sala com ${cobertura.totalAnunciado} jogadores anunciados; ${cobertura.paginasCarregadas} páginas consultadas; ${cobertura.jogadoresUnicos} perfis únicos identificados; <strong>${cobertura.perfisAnalisados} analisados com sucesso</strong>${cobertura.perfisIndisponiveis > 0 ? `; ${cobertura.perfisIndisponiveis} temporariamente indisponíveis na API` : ""}.
          ${cobertura.limitePaginasAtingido ? `<span style="color:var(--gold); display:block; margin-top:2px;">⚠️ Varredura parcial: limite de 12 páginas atingido na API pública.</span>` : ""}
        </div>
        ${
          cobertura.perfisIndisponiveis > 0
            ? `<button type="button" class="btn-mini btn-secundario" id="btn-radar-tentar-indisponiveis">🔄 Tentar perfis indisponíveis (${cobertura.perfisIndisponiveis})</button>`
            : ""
        }
      </div>
    </div>

    <div class="radar-destaque-filtro">
      <div>
        <span class="eyebrow">RESULTADO DO RADAR · ${escaparHtml(canalInfo.displayName || canalInfo.login)}</span>
        <div class="small muted">Filtro: ${escaparHtml(descFiltro)}</div>
      </div>
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
        <button type="button" class="btn-mini btn-secundario" id="btn-radar-assistir-live" title="Abrir transmissão do canal na Twitch ou Kick">📺 Assistir Transmissão ↗</button>
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
        <div class="card-info-linha"><span title="Estimativa de até onde a live deve ir pela média das últimas 5 runs completas">Potencial (média 5 runs)</span><strong>${textoPotencial}</strong></div>
        ${resumoRuns ? `<div class="card-info-linha"><span>Últimas ${ultimasRuns.length} runs</span><strong>${escaparHtml(resumoRuns)}</strong></div>` : ""}
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

  const btnAssistirRadar = containerResultadoRadar.querySelector("#btn-radar-assistir-live");
  if (btnAssistirRadar) {
    btnAssistirRadar.addEventListener("click", () => {
      abrirModalEscolhaLive({
        canal: canalInfo.login,
        nome: canalInfo.displayName || canalInfo.login,
        zone: canalInfo.zone,
        wave: canalInfo.wave,
        playersNow: playersOnlineCanal,
        twitchLogin: canalInfo.twitchLogin !== undefined ? canalInfo.twitchLogin : (canalInfo.login?.startsWith("kick:") ? null : canalInfo.login),
        kickLogin: canalInfo.kickLogin !== undefined ? canalInfo.kickLogin : (canalInfo.login?.startsWith("kick:") ? canalInfo.login.replace(/^kick:/i, "") : null),
      }, "Radar de Lives");
    });
  }

  const btnTentarIndisponiveis = containerResultadoRadar.querySelector("#btn-radar-tentar-indisponiveis");
  if (btnTentarIndisponiveis && Array.isArray(ultimosDadosRadar?.listaFalhas) && ultimosDadosRadar.listaFalhas.length > 0) {
    btnTentarIndisponiveis.addEventListener("click", async () => {
      btnTentarIndisponiveis.disabled = true;
      btnTentarIndisponiveis.textContent = "Tentando novamente...";
      const novasFalhas = [];
      const recuperados = await mapearComConcorrencia(
        ultimosDadosRadar.listaFalhas,
        6,
        undefined,
        async (p) => obterPerfilEmCache(p.login, p.cls)
      );
      ultimosDadosRadar.listaFalhas.forEach((p, idx) => {
        if (recuperados[idx]) {
          ultimosDadosRadar.perfis.push(recuperados[idx]);
        } else {
          novasFalhas.push(p);
        }
      });
      ultimosDadosRadar.listaFalhas = novasFalhas;
      if (ultimosDadosRadar.cobertura) {
        ultimosDadosRadar.cobertura.perfisAnalisados = ultimosDadosRadar.perfis.length;
        ultimosDadosRadar.cobertura.perfisIndisponiveis = novasFalhas.length;
      }
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

export function configurarRadar() {
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
}

export {
  escanearLiveSelecionada,
  inputRadarCanal,
  popularSeletorItensRadar,
  renderizarResultadoRadar,
  selectRadarLives,
  ultimosDadosRadar,
};
