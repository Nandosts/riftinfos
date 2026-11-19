import { buscarJsonApi } from "./api.mjs";
import { nomesClasses } from "./dados.mjs";
import {
  escaparHtml,
  formatadorInteiro,
  formatarDuracaoSegundos,
  formatarNumeroCompacto,
  formatarZonaOndaDeOndas,
} from "./formato.mjs";

export function normalizarCanal(login) {
  return String(login || "")
    .trim()
    .toLowerCase()
    .replace(/^kick[:/]/i, "");
}

export function ehCanalKick(login) {
  return /^kick[:/]/i.test(String(login || "").trim());
}

export function calcularCanalPrincipal(perfil) {
  if (!perfil || !Array.isArray(perfil.channels) || perfil.channels.length === 0) {
    return null;
  }
  return perfil.channels.reduce((max, c) => {
    const sMax = Number(max?.seconds) || 0;
    const sAtual = Number(c?.seconds) || 0;
    return sAtual > sMax ? c : max;
  }, null);
}

export function jogadorPertenceALive(perfil, canalAlvo) {
  if (!canalAlvo) return false;
  const top = calcularCanalPrincipal(perfil);
  if (!top || !top.login) return false;
  return normalizarCanal(top.login) === normalizarCanal(canalAlvo);
}

export function filtrarEOrdenarJogadores(jogadores, filtros, cachePerfis = new Map(), canalAlvo = "") {
  if (!Array.isArray(jogadores)) return [];
  const {
    fiel = false,
    plataforma = "",
    classe = "",
    minFc = 0,
    busca = "",
    ordenarPor = "power",
    ordenarSentido = "desc",
  } = filtros || {};

  const termoBusca = (busca || "").trim().toLowerCase();
  const minFcNum = Number(minFc) || 0;
  const canalAlvoNorm = normalizarCanal(canalAlvo);

  const filtrados = jogadores.filter((j) => {
    // 1. Filtro de Classe
    if (classe && j.cls !== classe) return false;

    // 2. Filtro de Plataforma (Kick vs Twitch)
    const ehKick = ehCanalKick(j.login);
    if (plataforma === "kick" && !ehKick) return false;
    if (plataforma === "twitch" && ehKick) return false;

    // 3. Filtro de FC Mínimo
    const fcJogador = Number(j.power ?? j.fc) || 0;
    if (minFcNum > 0 && fcJogador < minFcNum) return false;

    // 4. Filtro de Busca livre (nick ou displayName)
    if (termoBusca) {
      const nick = (j.login || "").toLowerCase();
      const nome = (j.displayName || j.name || "").toLowerCase();
      if (!nick.includes(termoBusca) && !nome.includes(termoBusca)) return false;
    }

    // 5. Filtro de Fidelidade ("Apenas quem é daquela live")
    if (fiel && canalAlvoNorm) {
      const loginNorm = (j.login || "").toLowerCase();
      const prof = cachePerfis.get(loginNorm);
      // Se tiver perfil em cache, verifica se o canal principal é esta live
      if (prof) {
        if (!jogadorPertenceALive(prof, canalAlvo)) return false;
      }
    }

    return true;
  });

  // Ordenação flexível
  const multiplicador = ordenarSentido === "asc" ? 1 : -1;
  filtrados.sort((a, b) => {
    let valA = 0;
    let valB = 0;
    if (ordenarPor === "seconds" || ordenarPor === "time") {
      valA = Number(a.seconds) || 0;
      valB = Number(b.seconds) || 0;
    } else if (ordenarPor === "waves") {
      valA = Number(a.waves) || 0;
      valB = Number(b.waves) || 0;
    } else if (ordenarPor === "kills") {
      valA = Number(a.kills) || 0;
      valB = Number(b.kills) || 0;
    } else if (ordenarPor === "level") {
      valA = Number(a.level) || 0;
      valB = Number(b.level) || 0;
    } else {
      // Padrão: FC / Power
      valA = Number(a.power ?? a.fc) || 0;
      valB = Number(b.power ?? b.fc) || 0;
    }
    if (valA !== valB) return (valA - valB) * multiplicador;
    // Desempate estável por nível e login
    const diffNivel = (Number(b.level) || 0) - (Number(a.level) || 0);
    if (diffNivel !== 0) return diffNivel;
    return String(a.login || "").localeCompare(String(b.login || ""));
  });

  return filtrados;
}

export function paginarJogadores(jogadores, pagina = 1, itensPorPagina = 25) {
  const lista = Array.isArray(jogadores) ? jogadores : [];
  const tam = Math.max(1, Number(itensPorPagina) || 25);
  const total = lista.length;
  const totalPaginas = Math.max(1, Math.ceil(total / tam));
  const pag = Math.min(totalPaginas, Math.max(1, Number(pagina) || 1));
  const inicio = (pag - 1) * tam;
  const fim = Math.min(total, inicio + tam);

  return {
    pagina: pag,
    totalPaginas,
    itensPorPagina: tam,
    total,
    inicio: total > 0 ? inicio + 1 : 0,
    fim,
    itens: lista.slice(inicio, fim),
  };
}

export function obterResumoFidelidade(jogadores, canalAlvo, cachePerfis) {
  let totalComPerfil = 0;
  let totalFieis = 0;
  let totalTuristas = 0;

  for (const j of jogadores || []) {
    const p = cachePerfis.get((j.login || "").toLowerCase());
    if (p && Array.isArray(p.channels)) {
      totalComPerfil++;
      if (jogadorPertenceALive(p, canalAlvo)) {
        totalFieis++;
      } else {
        totalTuristas++;
      }
    }
  }

  return { totalComPerfil, totalFieis, totalTuristas };
}

// ----------------------------------------------------
// Gerenciamento de Interface e Requisições
// ----------------------------------------------------

const cachePerfisApi = new Map();
let canalCarregado = "";
let dadosCanalAtivo = null;
let boardItensCompletos = [];
let controladorRequisicaoAtiva = null;

// Referências DOM
const doc = typeof document !== "undefined" ? document : null;
const selectCanalLive = doc?.querySelector("#select-ranking-canal");
const inputCanalTexto = doc?.querySelector("#input-ranking-canal");
const formBuscarCanal = doc?.querySelector("#form-ranking-canal");
const btnCopiarLink = doc?.querySelector("#btn-copiar-link-ranking");
const containerInfoCanal = doc?.querySelector("#card-info-canal");
const containerBotoesBoard = doc?.querySelector("#ranking-botoes-board");
const checkApenasFiel = doc?.querySelector("#check-ranking-fiel");
const selectPlataforma = doc?.querySelector("#select-ranking-plat");
const selectClasse = doc?.querySelector("#select-ranking-classe");
const inputMinFc = doc?.querySelector("#input-ranking-min-fc");
const inputBuscaTexto = doc?.querySelector("#input-ranking-busca");
const selectOrdenarPor = doc?.querySelector("#select-ranking-ordenar");
const btnSentidoOrdem = doc?.querySelector("#btn-ranking-sentido-ordem");
const btnLimparFiltros = doc?.querySelector("#btn-ranking-limpar-filtros");
const statusRanking = doc?.querySelector("#status-ranking");
const barraProgresso = doc?.querySelector("#progresso-ranking-barra");
const containerProgresso = doc?.querySelector("#progresso-ranking");
const textoProgresso = doc?.querySelector("#progresso-ranking-texto");
const tabelaCorpo = doc?.querySelector("#corpo-tabela-ranking");
const contadorResultados = doc?.querySelector("#ranking-contador-resultados");
const containerPaginacao = doc?.querySelector("#ranking-paginacao");
const selectItensPorPagina = doc?.querySelector("#select-ranking-itens-pag");

const estado = {
  boardTipo: "strongest",
  pagina: 1,
  itensPorPagina: 25,
  sentidoOrdem: "desc",
};

async function buscarPerfilCache(login, sinal) {
  const chave = String(login || "").toLowerCase();
  const emCache = cachePerfisApi.get(chave);
  if (emCache && Date.now() - emCache.ts < 300000) {
    return emCache.dados;
  }
  try {
    const dados = await buscarJsonApi(`/api/profile/${encodeURIComponent(login)}`, sinal, 8000);
    if (dados) {
      if (cachePerfisApi.size >= 600) cachePerfisApi.delete(cachePerfisApi.keys().next().value);
      cachePerfisApi.set(chave, { ts: Date.now(), dados });
    }
    return dados;
  } catch {
    return null;
  }
}

async function preencherPerfisEmBackground(listaJogadores, sinal, aoAtualizar) {
  const lista = Array.isArray(listaJogadores) ? listaJogadores : [];
  const faltantes = lista.filter((j) => j?.login && !cachePerfisApi.has((j.login || "").toLowerCase()));
  if (faltantes.length === 0) {
    if (aoAtualizar) aoAtualizar();
    return;
  }

  let concluidos = 0;
  const limiteConcorrencia = 8;
  let proximo = 0;

  async function worker() {
    while (proximo < faltantes.length) {
      if (sinal?.aborted) return;
      const idx = proximo++;
      const jog = faltantes[idx];
      await buscarPerfilCache(jog.login, sinal);
      concluidos++;
      if (textoProgresso && containerProgresso && !containerProgresso.hidden) {
        const pct = Math.round((concluidos / faltantes.length) * 100);
        if (barraProgresso) barraProgresso.style.width = `${pct}%`;
        textoProgresso.textContent = `Identificando fidelidade das contas: ${concluidos}/${faltantes.length} (${pct}%)…`;
      }
    }
  }

  const workers = Array.from({ length: Math.min(limiteConcorrencia, faltantes.length) }, () => worker());
  await Promise.all(workers);

  if (!sinal?.aborted && aoAtualizar) {
    aoAtualizar();
  }
}

export async function carregarRanking(canalDigitado, tipoBoard = estado.boardTipo, forcarResetPagina = true) {
  const canalLimpo = (canalDigitado || "").trim();
  if (!canalLimpo) {
    if (statusRanking) {
      statusRanking.dataset.error = "true";
      statusRanking.textContent = "Escolha uma live online ou digite o nome do streamer.";
    }
    return;
  }

  controladorRequisicaoAtiva?.abort();
  const controlador = new AbortController();
  controladorRequisicaoAtiva = controlador;

  canalCarregado = canalLimpo;
  estado.boardTipo = tipoBoard;
  if (forcarResetPagina) estado.pagina = 1;

  sincronizarUrlComEstado();

  if (statusRanking) {
    delete statusRanking.dataset.error;
    statusRanking.textContent = `Carregando dados e ranking de ${canalLimpo}…`;
  }
  if (containerProgresso) containerProgresso.hidden = false;
  if (barraProgresso) barraProgresso.style.width = "15%";
  if (textoProgresso) textoProgresso.textContent = "Obtendo dados do canal e primeira página do ranking…";

  try {
    const canalAlvoUri = encodeURIComponent(canalLimpo);
    const [canalInfo, primeiraPagina] = await Promise.all([
      buscarJsonApi(`/api/ranking/channel/${canalAlvoUri}`, controlador.signal, 9000).catch(() => null),
      buscarJsonApi(`/api/ranking/channel/${canalAlvoUri}/board?board=${tipoBoard}&page=1&size=50`, controlador.signal, 9000),
    ]);

    if (controlador.signal.aborted) return;

    dadosCanalAtivo = canalInfo;
    renderizarCardCanal(canalInfo, canalLimpo);

    const totalBoard = primeiraPagina?.total || (primeiraPagina?.items || []).length;
    const totalPaginas = Math.min(12, Math.max(1, Math.ceil(totalBoard / 50)));
    const todosItens = [...(primeiraPagina?.items || [])];

    if (totalPaginas > 1) {
      if (textoProgresso) textoProgresso.textContent = `Carregando páginas da sala (${todosItens.length}/${totalBoard})…`;
      const paginasRestantes = Array.from({ length: totalPaginas - 1 }, (_, i) => i + 2);
      const respostas = await Promise.all(
        paginasRestantes.map((pg) =>
          buscarJsonApi(`/api/ranking/channel/${canalAlvoUri}/board?board=${tipoBoard}&page=${pg}&size=50`, controlador.signal, 9000).catch(() => null)
        )
      );
      for (const r of respostas) {
        if (Array.isArray(r?.items)) {
          todosItens.push(...r.items);
        }
      }
    }

    // Remove duplicados de forma estável
    const vistos = new Set();
    boardItensCompletos = todosItens.filter((p) => {
      const k = `${p.login}:${p.cls}`;
      if (!p.login || vistos.has(k)) return false;
      vistos.add(k);
      return true;
    });

    if (statusRanking) {
      statusRanking.textContent = `Sala de ${canalInfo?.displayName || canalLimpo} carregada: ${boardItensCompletos.length} jogadores no ranking.`;
    }

    renderizarTabela();

    // Se o filtro de fidelidade estiver ligado, puxa perfis prioritariamente
    const deveCarregarPerfis = checkApenasFiel?.checked || boardItensCompletos.length <= 150;
    if (deveCarregarPerfis) {
      void preencherPerfisEmBackground(boardItensCompletos, controlador.signal, () => {
        if (!controlador.signal.aborted) {
          if (containerProgresso) containerProgresso.hidden = true;
          renderizarTabela();
        }
      });
    } else {
      // Carrega perfis da página atual
      const { paginacao } = obterDadosFiltradosEPaginados();
      void preencherPerfisEmBackground(paginacao.itens, controlador.signal, () => {
        if (!controlador.signal.aborted) {
          if (containerProgresso) containerProgresso.hidden = true;
          renderizarTabela();
        }
      });
    }
  } catch (erro) {
    if (controlador.signal.aborted) return;
    if (containerProgresso) containerProgresso.hidden = true;
    if (statusRanking) {
      statusRanking.dataset.error = "true";
      statusRanking.textContent = erro.message || "Não foi possível carregar o ranking deste canal.";
    }
  }
}

function renderizarCardCanal(canalInfo, canalNome) {
  if (!containerInfoCanal) return;
  if (!canalInfo) {
    containerInfoCanal.innerHTML = `
      <div class="card-canal-simples">
        <h2>${escaparHtml(canalNome)}</h2>
        <p class="muted small">Dados de resumo não informados pela API pública.</p>
      </div>
    `;
    return;
  }

  const ehKick = ehCanalKick(canalInfo.login || canalNome);
  const platNome = ehKick ? "Kick" : "Twitch";
  const urlTransmissao = ehKick
    ? `https://kick.com/${encodeURIComponent((canalInfo.kickLogin || canalInfo.login || canalNome).replace(/^kick:/i, ""))}`
    : `https://twitch.tv/${encodeURIComponent(canalInfo.twitchLogin || canalInfo.login || canalNome)}`;

  const online = Boolean(canalInfo.online || canalInfo.live);
  const badgeStatus = online
    ? `<span class="badge-online">🔴 AO VIVO AGORA</span>`
    : `<span class="badge-offline">⚪ OFFLINE</span>`;

  const recordeOndas = canalInfo.bestZone ? `Z${canalInfo.bestZone}-W${canalInfo.bestWave}` : "—";
  const zonaAtual = canalInfo.zone ? `Z${canalInfo.zone}-W${canalInfo.wave}` : "—";
  const potencial = Number(canalInfo.potentialWaves ?? canalInfo.potential) || 0;
  const textoPotencial = potencial > 0 ? formatarZonaOndaDeOndas(potencial) : "—";

  containerInfoCanal.innerHTML = `
    <article class="card-canal-detalhado">
      <div class="card-canal-topo">
        ${canalInfo.avatar ? `<img class="card-canal-avatar" src="${escaparHtml(canalInfo.avatar)}" alt="${escaparHtml(canalInfo.displayName || canalNome)}" loading="lazy">` : `<div class="card-canal-avatar placeholder">📺</div>`}
        <div class="card-canal-titulos">
          <div class="card-canal-linha-titulo">
            <h2>${escaparHtml(canalInfo.displayName || canalInfo.login || canalNome)}</h2>
            ${badgeStatus}
            <span class="badge-plat ${ehKick ? "kick" : "twitch"}">${platNome}</span>
          </div>
          <a class="link-externo" href="${escaparHtml(urlTransmissao)}" target="_blank" rel="noopener noreferrer">Assistir na ${platNome} ↗</a>
        </div>
      </div>
      <div class="card-canal-stats">
        <div class="stat-bloco"><span>Zona Atual</span><strong>${zonaAtual}</strong></div>
        <div class="stat-bloco"><span>Recorde da Live</span><strong>${recordeOndas}</strong></div>
        <div class="stat-bloco"><span>Jogadores Online</span><strong>${formatadorInteiro.format(canalInfo.playersNow || 0)}</strong></div>
        <div class="stat-bloco"><span>Total Registrados</span><strong>${formatadorInteiro.format(canalInfo.playersTotal || 0)}</strong></div>
        <div class="stat-bloco"><span>Potencial Médio</span><strong>${textoPotencial}</strong></div>
      </div>
    </article>
  `;
}

function obterConfigFiltros() {
  return {
    fiel: Boolean(checkApenasFiel?.checked),
    plataforma: selectPlataforma?.value || "",
    classe: selectClasse?.value || "",
    minFc: Number(inputMinFc?.value) || 0,
    busca: (inputBuscaTexto?.value || "").trim(),
    ordenarPor: selectOrdenarPor?.value || "power",
    ordenarSentido: estado.sentidoOrdem || "desc",
  };
}

function obterDadosFiltradosEPaginados() {
  const filtros = obterConfigFiltros();
  const cacheFormatado = new Map();
  for (const [k, v] of cachePerfisApi.entries()) {
    cacheFormatado.set(k, v.dados);
  }
  const filtrados = filtrarEOrdenarJogadores(boardItensCompletos, filtros, cacheFormatado, canalCarregado);
  const paginacao = paginarJogadores(filtrados, estado.pagina, estado.itensPorPagina);
  return { filtrados, paginacao, filtros, cacheFormatado };
}

function renderizarTabela() {
  if (!tabelaCorpo) return;

  const { filtrados, paginacao, filtros, cacheFormatado } = obterDadosFiltradosEPaginados();

  // Atualiza contador
  if (contadorResultados) {
    const totalSala = boardItensCompletos.length;
    const totalFiltrados = filtrados.length;
    const resumoFidelidade = obterResumoFidelidade(filtrados, canalCarregado, cacheFormatado);
    let extraFidelidade = "";
    if (resumoFidelidade.totalComPerfil > 0) {
      extraFidelidade = ` · ${resumoFidelidade.totalFieis} fiéis comprovados`;
    }
    contadorResultados.textContent = `Exibindo ${paginacao.inicio}–${paginacao.fim} de ${totalFiltrados} jogadores (Total na sala: ${totalSala}${extraFidelidade})`;
  }

  // Renderiza linhas
  if (paginacao.itens.length === 0) {
    tabelaCorpo.innerHTML = `
      <tr>
        <td colspan="9" class="tabela-vazia">
          Nenhum personagem corresponde aos filtros selecionados na sala de <strong>${escaparHtml(canalCarregado)}</strong>.
        </td>
      </tr>
    `;
    renderizarPaginacao(paginacao);
    return;
  }

  const linhasHtml = paginacao.itens.map((j, idx) => {
    const posicao = paginacao.inicio + idx;
    const loginLimpo = (j.login || "").replace(/^kick:/i, "");
    const ehKick = ehCanalKick(j.login);
    const plat = ehKick ? "kick" : "twitch";
    const fcValor = Number(j.power ?? j.fc) || 0;
    const tempoSeg = Number(j.seconds) || 0;
    const ondas = Number(j.waves) || 0;
    const abates = Number(j.kills) || 0;

    // Fidelidade / Canal Principal
    const prof = cacheFormatado.get((j.login || "").toLowerCase());
    let badgeFidelidade = `<span class="badge-fiel-aguardando" title="Verificando canal principal…">…</span>`;
    if (prof) {
      const topCh = calcularCanalPrincipal(prof);
      const ehFiel = jogadorPertenceALive(prof, canalCarregado);
      if (ehFiel) {
        badgeFidelidade = `<span class="badge-fiel" title="Este canal é o top 1 onde o jogador mais passou tempo!">⭐ Fiel</span>`;
      } else if (topCh) {
        const nomeTop = topCh.displayName || topCh.login;
        badgeFidelidade = `<span class="badge-turista" title="Canal principal deste jogador: ${escaparHtml(nomeTop)} (${formatarDuracaoSegundos(topCh.seconds)})">🔄 ${escaparHtml(nomeTop)}</span>`;
      } else {
        badgeFidelidade = `<span class="badge-fiel-indefinido">—</span>`;
      }
    }

    const badgeStatus = j.now
      ? `<span class="badge-status-online" title="Jogando nesta live agora">Online</span>`
      : `<span class="badge-status-offline" title="Fora da live no momento">Offline</span>`;

    const corClasse = {
      warrior: "var(--gold)",
      archer: "var(--green)",
      cleric: "var(--cyan)",
    }[j.cls] || "var(--text)";

    return `
      <tr>
        <td class="col-pos"><strong>#${posicao}</strong></td>
        <td class="col-jogador">
          <div class="jogador-celula">
            ${j.avatar ? `<img class="jogador-avatar" src="${escaparHtml(j.avatar)}" alt="" loading="lazy">` : `<div class="jogador-avatar placeholder">⚔️</div>`}
            <div>
              <a class="link-nick-ranking" href="index.html?nick=${encodeURIComponent(loginLimpo)}&plat=${plat}&cls=${encodeURIComponent(j.cls || "")}" title="Abrir análise e ficha completa deste jogador">
                ${escaparHtml(j.displayName || j.name || loginLimpo)}
              </a>
              <div class="jogador-subinfo">
                <span style="color:${corClasse}; font-weight:600;">${nomesClasses[j.cls] || j.cls}</span> · Nv. ${j.level || 1}
                ${ehKick ? `<span class="badge-mini-kick">KICK</span>` : ""}
              </div>
            </div>
          </div>
        </td>
        <td class="col-fidelidade">${badgeFidelidade}</td>
        <td class="col-fc num" title="${formatadorInteiro.format(fcValor)} FC">
          <strong>${formatarNumeroCompacto(fcValor)}</strong>
        </td>
        <td class="col-tempo num" title="${formatadorInteiro.format(tempoSeg)} segundos">
          ${formatarDuracaoSegundos(tempoSeg)}
        </td>
        <td class="col-ondas num">${formatadorInteiro.format(ondas)}</td>
        <td class="col-abates num">${formatadorInteiro.format(abates)}</td>
        <td class="col-status">${badgeStatus}</td>
        <td class="col-acao">
          <a class="btn-mini btn-secundario" href="index.html?nick=${encodeURIComponent(loginLimpo)}&plat=${plat}&cls=${encodeURIComponent(j.cls || "")}" title="Ver equipamentos, gemas e FC no RiftInfos">
            Ver Ficha ↗
          </a>
        </td>
      </tr>
    `;
  }).join("");

  tabelaCorpo.innerHTML = linhasHtml;
  renderizarPaginacao(paginacao);
}

function renderizarPaginacao(paginacao) {
  if (!containerPaginacao) return;
  const { pagina, totalPaginas } = paginacao;

  if (totalPaginas <= 1) {
    containerPaginacao.innerHTML = `<span class="small muted">Página 1 de 1</span>`;
    return;
  }

  containerPaginacao.innerHTML = `
    <div class="paginacao-controles">
      <button type="button" class="btn-pag" data-pag-acao="primeira" ${pagina <= 1 ? "disabled" : ""} title="Primeira página">«</button>
      <button type="button" class="btn-pag" data-pag-acao="anterior" ${pagina <= 1 ? "disabled" : ""} title="Página anterior">‹ Anterior</button>
      <span class="paginacao-rotulo">Página <strong>${pagina}</strong> de <strong>${totalPaginas}</strong></span>
      <button type="button" class="btn-pag" data-pag-acao="proxima" ${pagina >= totalPaginas ? "disabled" : ""} title="Próxima página">Próxima ›</button>
      <button type="button" class="btn-pag" data-pag-acao="ultima" ${pagina >= totalPaginas ? "disabled" : ""} title="Última página">»</button>
    </div>
  `;

  containerPaginacao.querySelectorAll("[data-pag-acao]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const acao = btn.dataset.pagAcao;
      if (acao === "primeira") estado.pagina = 1;
      else if (acao === "anterior") estado.pagina = Math.max(1, estado.pagina - 1);
      else if (acao === "proxima") estado.pagina = Math.min(totalPaginas, estado.pagina + 1);
      else if (acao === "ultima") estado.pagina = totalPaginas;
      renderizarTabela();
      const { paginacao: pagAtual } = obterDadosFiltradosEPaginados();
      void preencherPerfisEmBackground(pagAtual.itens, controladorRequisicaoAtiva?.signal, () => {
        if (!controladorRequisicaoAtiva?.signal?.aborted) renderizarTabela();
      });
      window.scrollTo({ top: containerInfoCanal?.offsetTop || 200, behavior: "smooth" });
    });
  });
}

function sincronizarUrlComEstado() {
  if (typeof window === "undefined" || window.location.protocol === "file:") return;
  try {
    const url = new URL(window.location.href);
    if (canalCarregado) url.searchParams.set("canal", canalCarregado);
    if (estado.boardTipo && estado.boardTipo !== "strongest") url.searchParams.set("board", estado.boardTipo);
    else url.searchParams.delete("board");

    const filtros = obterConfigFiltros();
    if (filtros.fiel) url.searchParams.set("fiel", "1");
    else url.searchParams.delete("fiel");

    if (filtros.plataforma) url.searchParams.set("plat", filtros.plataforma);
    else url.searchParams.delete("plat");

    if (filtros.classe) url.searchParams.set("cls", filtros.classe);
    else url.searchParams.delete("cls");

    if (filtros.minFc > 0) url.searchParams.set("minFc", String(filtros.minFc));
    else url.searchParams.delete("minFc");

    if (filtros.ordenarPor && filtros.ordenarPor !== "power") url.searchParams.set("ordem", filtros.ordenarPor);
    else url.searchParams.delete("ordem");

    if (filtros.ordenarSentido && filtros.ordenarSentido !== "desc") url.searchParams.set("dir", filtros.ordenarSentido);
    else url.searchParams.delete("dir");

    window.history.replaceState(null, "", url);
  } catch {}
}

async function preencherSeletorLives() {
  if (!selectCanalLive) return;
  try {
    const dados = await buscarJsonApi("/api/ranking/runs?page=1&size=50&online=true", undefined, 7000);
    const lives = Array.isArray(dados?.items) ? dados.items : [];
    const opts = [new Option(lives.length > 0 ? `Escolha uma live online (${lives.length} ativas)…` : "Nenhuma live online no momento", "")];
    for (const l of lives) {
      const nome = l.name || l.login;
      const rec = l.bestZone ? `Z${l.bestZone}-W${l.bestWave}` : "sem rec";
      opts.push(new Option(`${nome} (${l.playersNow || 0} jogs · Rec. ${rec})`, l.login));
    }
    selectCanalLive.replaceChildren(...opts);
    if (canalCarregado && lives.some((l) => normalizarCanal(l.login) === normalizarCanal(canalCarregado))) {
      selectCanalLive.value = canalCarregado;
    }
  } catch {
    selectCanalLive.replaceChildren(new Option("Não foi possível carregar as lives online", ""));
  }
}

export function inicializarPaginaRanking() {
  if (typeof window === "undefined" || !formBuscarCanal) return;

  // Lê parâmetros da URL
  const params = new URLSearchParams(window.location.search);
  const canalParam = params.get("canal") || params.get("c") || "xxmarciano";
  const boardParam = params.get("board") || "strongest";
  const fielParam = params.get("fiel") === "1" || params.get("fiel") === "true";
  const platParam = params.get("plat") || "";
  const clsParam = params.get("cls") || "";
  const minFcParam = Number(params.get("minFc")) || 0;
  const ordemParam = params.get("ordem") || "power";
  const dirParam = params.get("dir") === "asc" ? "asc" : "desc";

  if (inputCanalTexto) inputCanalTexto.value = canalParam;
  if (checkApenasFiel) checkApenasFiel.checked = fielParam;
  if (selectPlataforma) selectPlataforma.value = platParam;
  if (selectClasse) selectClasse.value = clsParam;
  if (inputMinFc) inputMinFc.value = minFcParam > 0 ? String(minFcParam) : "";
  if (selectOrdenarPor) selectOrdenarPor.value = ordemParam;
  estado.sentidoOrdem = dirParam;
  if (btnSentidoOrdem) {
    btnSentidoOrdem.textContent = dirParam === "asc" ? "▲ Crescente" : "▼ Decrescente";
    btnSentidoOrdem.setAttribute("aria-label", `Direção da ordenação: ${dirParam === "asc" ? "Crescente" : "Decrescente"}`);
  }

  // Preenche select de lives online
  void preencherSeletorLives();

  // Eventos do formulário de canal
  formBuscarCanal.addEventListener("submit", (e) => {
    e.preventDefault();
    const canalEscolhido = (inputCanalTexto?.value || selectCanalLive?.value || "").trim();
    if (canalEscolhido) {
      void carregarRanking(canalEscolhido, estado.boardTipo, true);
    }
  });

  if (selectCanalLive) {
    selectCanalLive.addEventListener("change", (e) => {
      const val = e.target.value;
      if (val) {
        if (inputCanalTexto) inputCanalTexto.value = val;
        void carregarRanking(val, estado.boardTipo, true);
      }
    });
  }

  // Alternar abas do board (strongest, time, waves, kills, now)
  if (containerBotoesBoard) {
    containerBotoesBoard.querySelectorAll("[data-board-tipo]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const tipo = btn.dataset.boardTipo;
        if (!tipo || tipo === estado.boardTipo) return;
        containerBotoesBoard.querySelectorAll("[data-board-tipo]").forEach((b) => b.classList.remove("ativa"));
        btn.classList.add("ativa");
        void carregarRanking(canalCarregado, tipo, true);
      });
    });
  }

  // Eventos de filtros reativos
  if (checkApenasFiel) {
    checkApenasFiel.addEventListener("change", () => {
      estado.pagina = 1;
      sincronizarUrlComEstado();
      // Ao ligar o filtro de fidelidade, busca perfis de todos se ainda não tiver
      if (checkApenasFiel.checked) {
        if (containerProgresso) containerProgresso.hidden = false;
        void preencherPerfisEmBackground(boardItensCompletos, controladorRequisicaoAtiva?.signal, () => {
          if (containerProgresso) containerProgresso.hidden = true;
          renderizarTabela();
        });
      } else {
        renderizarTabela();
      }
    });
  }

  const inputsReativos = [selectPlataforma, selectClasse, inputMinFc, inputBuscaTexto, selectOrdenarPor].filter(Boolean);
  for (const input of inputsReativos) {
    input.addEventListener("input", () => {
      estado.pagina = 1;
      sincronizarUrlComEstado();
      renderizarTabela();
    });
  }

  // Botões rápidos de FC mínimo
  document.querySelectorAll("[data-quick-min-fc]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const val = Number(btn.dataset.quickMinFc) || 0;
      if (inputMinFc) {
        inputMinFc.value = val > 0 ? String(val) : "";
        inputMinFc.dispatchEvent(new Event("input"));
      }
    });
  });

  // Alternar direção da ordem
  if (btnSentidoOrdem) {
    btnSentidoOrdem.addEventListener("click", () => {
      estado.sentidoOrdem = estado.sentidoOrdem === "desc" ? "asc" : "desc";
      btnSentidoOrdem.textContent = estado.sentidoOrdem === "asc" ? "▲ Crescente" : "▼ Decrescente";
      btnSentidoOrdem.setAttribute("aria-label", `Direção da ordenação: ${estado.sentidoOrdem === "asc" ? "Crescente" : "Decrescente"}`);
      sincronizarUrlComEstado();
      renderizarTabela();
    });
  }

  // Limpar filtros
  if (btnLimparFiltros) {
    btnLimparFiltros.addEventListener("click", () => {
      if (checkApenasFiel) checkApenasFiel.checked = false;
      if (selectPlataforma) selectPlataforma.value = "";
      if (selectClasse) selectClasse.value = "";
      if (inputMinFc) inputMinFc.value = "";
      if (inputBuscaTexto) inputBuscaTexto.value = "";
      if (selectOrdenarPor) selectOrdenarPor.value = "power";
      estado.sentidoOrdem = "desc";
      if (btnSentidoOrdem) btnSentidoOrdem.textContent = "▼ Decrescente";
      estado.pagina = 1;
      sincronizarUrlComEstado();
      renderizarTabela();
    });
  }

  // Seletor de itens por página
  if (selectItensPorPagina) {
    selectItensPorPagina.addEventListener("change", (e) => {
      estado.itensPorPagina = Number(e.target.value) || 25;
      estado.pagina = 1;
      renderizarTabela();
    });
  }

  // Copiar link do ranking
  if (btnCopiarLink) {
    btnCopiarLink.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(window.location.href);
        const textoOriginal = btnCopiarLink.textContent;
        btnCopiarLink.textContent = "✓ Link Copiado!";
        setTimeout(() => {
          btnCopiarLink.textContent = textoOriginal;
        }, 2200);
      } catch {
        prompt("Copie o link deste ranking abaixo:", window.location.href);
      }
    });
  }

  // Carrega canal inicial
  void carregarRanking(canalParam, boardParam, true);
}

// Inicialização automática no browser
if (typeof window !== "undefined") {
  window.addEventListener("DOMContentLoaded", () => {
    inicializarPaginaRanking();
  });
}
