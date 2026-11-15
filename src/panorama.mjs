import { alternarVisibilidadeAba } from "./abas.mjs";
import { buscarJsonApi } from "./api.mjs";
import {
  inputMonstroJogadores,
  inputMonstroOnda,
  inputMonstroZona,
  renderizarSimuladorMonstros,
  selectMonstroLiveSync,
} from "./chefes.mjs";
import { atualizarCardP1Comparacao } from "./comparacao.mjs";
import { nomesClasses } from "./dados.mjs";
import { escaparHtml, formatadorInteiro, formatarNumeroCompacto, formatarZonaOndaDeOndas } from "./formato.mjs";
import {
  consultarPerfil,
  inputNick,
  perfilCarregadoP1,
  plataformaCarregadaP1,
  selectPlataforma,
} from "./perfil.mjs";
import { escanearLiveSelecionada, inputRadarCanal, selectRadarLives } from "./radar.mjs";

const btnCarregarExemplo = document.querySelector("#btn-carregar-exemplo");

const gradeRecordesGlobais = document.querySelector("#grade-recordes-globais");
const panoramaAtualizacao = document.querySelector("#panorama-atualizacao");

const detalhesRankings = document.querySelector("#detalhes-rankings");

const topPillValTop1 = document.querySelector("#top-pill-val-top1");
const topPillValWarrior = document.querySelector("#top-pill-val-warrior");
const topPillValCleric = document.querySelector("#top-pill-val-cleric");
const topPillValArcher = document.querySelector("#top-pill-val-archer");
const topPillValLevel = document.querySelector("#top-pill-val-level");

const modalEscolhaLive = document.querySelector("#modal-escolha-live");
const modalLiveTitulo = document.querySelector("#modal-live-titulo");
const modalLiveSubtitulo = document.querySelector("#modal-live-subtitulo");
const modalLiveZonaOnda = document.querySelector("#modal-live-zona-onda");
const modalLiveJogadores = document.querySelector("#modal-live-jogadores");
const modalLiveChamada = document.querySelector("#modal-live-chamada");
const linkLiveTwitch = document.querySelector("#link-live-twitch");
const linkLiveKick = document.querySelector("#link-live-kick");
const subLiveTwitch = document.querySelector("#sub-live-twitch");
const subLiveKick = document.querySelector("#sub-live-kick");
const btnFecharModalLive = document.querySelector("#btn-fechar-modal-live");
const btnModalRadarLive = document.querySelector("#btn-modal-radar-live");
const btnModalSimularChefe = document.querySelector("#btn-modal-simular-chefe");

const cacheDetalhesCanais = new Map();

const rankingIndisponivel = { rotulo: "Indisponível", nick: "", power: null, level: null };
const top1DinamicoPorClasse = {
  cleric: rankingIndisponivel,
  warrior: rankingIndisponivel,
  archer: rankingIndisponivel,
};
let topLevelDinamico = rankingIndisponivel;
let top1GeralDinamico = rankingIndisponivel;
let rankingsCarregando = true;

let ultimosDadosPanorama = {
  melhorZonaLive: null,
  maiorLive: null,
  liveMaisNova: null,
  patch: null,
  estadoLives: "carregando",
  atualizadoEm: null,
};

function formatarTempoRelativoCriacao(isoString) {
  if (!isoString) return "Recente";
  try {
    const data = new Date(isoString);
    const agora = new Date();
    const diffMs = Math.max(0, agora - data);
    if (!Number.isFinite(diffMs)) return "Data indisponível";
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 60) return `Entrou há ${Math.max(1, diffMin)}min`;
    const diffHoras = Math.floor(diffMin / 60);
    if (diffHoras < 24) return `Criada hoje (${diffHoras}h atrás)`;
    const diffDias = Math.floor(diffHoras / 24);
    return `Criada há ${diffDias}d`;
  } catch {
    return "Recente";
  }
}

function abrirModalEscolhaLive(dadosLive, subtitulo = "Live ao Vivo") {
  if (!modalEscolhaLive || !dadosLive) return;

  const canalOriginal = String(dadosLive.canal || dadosLive.login || "").trim();
  const canalKey = canalOriginal.toLowerCase();
  const ehKick = /^kick:/i.test(canalOriginal);
  const nickLimpo = canalOriginal.replace(/^kick:/i, "");
  const nomeDisplay = dadosLive.nome || nickLimpo || "Canal ao Vivo";
  const zone = Number(dadosLive.zone) || 1;
  const wave = Number(dadosLive.wave) || 1;
  const players = Number(dadosLive.playersNow) || 0;

  modalEscolhaLive.dataset.canalAberto = canalKey;

  if (modalLiveTitulo) modalLiveTitulo.textContent = nomeDisplay;
  if (modalLiveSubtitulo) modalLiveSubtitulo.textContent = subtitulo;
  if (modalLiveZonaOnda) modalLiveZonaOnda.textContent = `📍 Z${zone} · Onda ${wave}`;
  if (modalLiveJogadores) modalLiveJogadores.textContent = `👥 ${formatadorInteiro.format(players)} jogando agora`;

  function aplicarBotoesPlataforma(twLogin, kcLogin) {
    const temTwitch = Boolean(twLogin && String(twLogin).trim() !== "" && String(twLogin).trim().toLowerCase() !== "null");
    const temKick = Boolean(kcLogin && String(kcLogin).trim() !== "" && String(kcLogin).trim().toLowerCase() !== "null");

    const exibirTwitch = temTwitch || (!temKick && !ehKick);
    const exibirKick = temKick || (!temTwitch && ehKick);

    if (linkLiveTwitch) {
      if (exibirTwitch) {
        linkLiveTwitch.style.display = "flex";
        const nickTw = temTwitch ? twLogin : nickLimpo;
        linkLiveTwitch.href = `https://www.twitch.tv/${encodeURIComponent(nickTw)}`;
        if (subLiveTwitch) subLiveTwitch.textContent = `twitch.tv/${nickTw}`;
      } else {
        linkLiveTwitch.style.display = "none";
      }
    }

    if (linkLiveKick) {
      if (exibirKick) {
        linkLiveKick.style.display = "flex";
        const nickKc = temKick ? kcLogin : nickLimpo;
        linkLiveKick.href = `https://kick.com/${encodeURIComponent(nickKc)}`;
        if (subLiveKick) subLiveKick.textContent = `kick.com/${nickKc}`;
      } else {
        linkLiveKick.style.display = "none";
      }
    }

    if (modalLiveChamada) {
      if (exibirTwitch && exibirKick) {
        modalLiveChamada.textContent = "Disponível na Twitch e na Kick. Escolha onde assistir:";
      } else if (exibirTwitch) {
        modalLiveChamada.textContent = "Canal transmitindo ao vivo na Twitch:";
      } else if (exibirKick) {
        modalLiveChamada.textContent = "Canal transmitindo ao vivo na Kick:";
      } else {
        modalLiveChamada.textContent = "Acesse a transmissão oficial do canal:";
      }
    }
  }

  // Prioriza dados explícitos passados ou em cache
  const emCache = cacheDetalhesCanais.get(canalKey);
  const twConhecido = dadosLive.twitchLogin !== undefined ? dadosLive.twitchLogin : emCache?.twitchLogin;
  const kcConhecido = dadosLive.kickLogin !== undefined ? dadosLive.kickLogin : emCache?.kickLogin;

  if (twConhecido !== undefined || kcConhecido !== undefined) {
    aplicarBotoesPlataforma(twConhecido, kcConhecido);
  } else {
    // Configuração inicial rápida pelo identificador
    aplicarBotoesPlataforma(ehKick ? null : nickLimpo, ehKick ? nickLimpo : null);

    // Consulta assíncrona para confirmar disponibilidade real das plataformas
    void buscarJsonApi(`/api/ranking/channel/${encodeURIComponent(canalOriginal)}`, undefined, 5000)
      .then((ch) => {
        if (!ch) return;
        const tw = ch.twitchLogin || (ehKick ? null : nickLimpo);
        const kc = ch.kickLogin || (ehKick ? nickLimpo : null);
        cacheDetalhesCanais.set(canalKey, {
          twitchLogin: tw,
          kickLogin: kc,
          displayName: ch.displayName || nomeDisplay,
        });
        if (modalEscolhaLive.dataset.canalAberto === canalKey) {
          aplicarBotoesPlataforma(tw, kc);
        }
      })
      .catch(() => {});
  }

  if (btnModalRadarLive) {
    btnModalRadarLive.onclick = () => {
      if (typeof modalEscolhaLive.close === "function") modalEscolhaLive.close();
      if (selectRadarLives) selectRadarLives.value = canalOriginal;
      if (inputRadarCanal) inputRadarCanal.value = canalOriginal;
      alternarVisibilidadeAba("radar-live");
      if (typeof escanearLiveSelecionada === "function") {
        void escanearLiveSelecionada();
      }
    };
  }

  if (btnModalSimularChefe) {
    btnModalSimularChefe.onclick = () => {
      if (typeof modalEscolhaLive.close === "function") modalEscolhaLive.close();
      if (selectMonstroLiveSync) selectMonstroLiveSync.value = canalOriginal;
      if (inputMonstroZona) inputMonstroZona.value = zone;
      if (inputMonstroOnda) inputMonstroOnda.value = wave;
      if (inputMonstroJogadores) inputMonstroJogadores.value = players || 1;
      renderizarSimuladorMonstros();
      alternarVisibilidadeAba("monstros");
    };
  }

  if (btnFecharModalLive && !btnFecharModalLive.dataset.ouvinteAtivo) {
    btnFecharModalLive.dataset.ouvinteAtivo = "true";
    btnFecharModalLive.addEventListener("click", () => {
      if (typeof modalEscolhaLive.close === "function") modalEscolhaLive.close();
    });
  }

  if (modalEscolhaLive && !modalEscolhaLive.dataset.ouvinteAtivo) {
    modalEscolhaLive.dataset.ouvinteAtivo = "true";
    modalEscolhaLive.addEventListener("click", (e) => {
      const rect = modalEscolhaLive.getBoundingClientRect();
      const fora = (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      );
      if (fora && typeof modalEscolhaLive.close === "function") {
        modalEscolhaLive.close();
      }
    });
  }

  if (typeof modalEscolhaLive.showModal === "function") {
    modalEscolhaLive.showModal();
  } else {
    modalEscolhaLive.setAttribute("open", "");
  }
}

function vincularEventosGradePanorama() {
  if (!gradeRecordesGlobais) return;
  gradeRecordesGlobais.querySelectorAll("[data-panorama-acao]").forEach((el) => {
    el.addEventListener("click", () => {
      const acao = el.dataset.panoramaAcao;
      if (acao === "live-melhor-zona") {
        const live = ultimosDadosPanorama.melhorZonaLive;
        if (live && live.canal) {
          abrirModalEscolhaLive(live, "🔥 Melhor Zona-Onda Agora");
        }
      } else if (acao === "live-maior") {
        const live = ultimosDadosPanorama.maiorLive;
        if (live && live.canal) {
          abrirModalEscolhaLive(live, "👥 Maior Live Agora");
        }
      } else if (acao === "live-mais-nova") {
        const live = ultimosDadosPanorama.liveMaisNova;
        if (live && live.canal) {
          abrirModalEscolhaLive(live, "✨ Live Mais Nova Online");
        }
      } else if (acao === "consultar-top1") {
        carregarAtalhoTop("top1");
      }
    });
  });
}

function renderizarGradePanorama() {
  if (!gradeRecordesGlobais) return;
  const { melhorZonaLive, maiorLive, liveMaisNova, patch, estadoLives, atualizadoEm } = ultimosDadosPanorama;
  const acaoEmFoco = gradeRecordesGlobais.contains(document.activeElement)
    ? document.activeElement.dataset.panoramaAcao
    : null;
  const labelVazio = {
    carregando: "Carregando…",
    erro: "Indisponível",
    vazio: "Nenhuma live online",
    pronto: "Sem dados",
  }[estadoLives];
  const tempoCriacao = formatarTempoRelativoCriacao(liveMaisNova?.createdAt);

  const potencialMelhorZona = melhorZonaLive?.potentialWaves > 0 ? ` · Pot. ${formatarZonaOndaDeOndas(melhorZonaLive.potentialWaves)}` : "";
  const labelZona = melhorZonaLive ? `Z${melhorZonaLive.zone ?? 1} · Onda ${melhorZonaLive.wave ?? 1}` : labelVazio;
  const descZona = melhorZonaLive ? `${escaparHtml(melhorZonaLive.nome)} (${formatadorInteiro.format(melhorZonaLive.playersNow || 0)} jogando agora${potencialMelhorZona})` : estadoLives === "carregando" ? "Sincronizando lives…" : "";

  const labelMaior = maiorLive ? `${formatadorInteiro.format(maiorLive.playersNow || 0)} jogadores` : labelVazio;
  const descMaior = maiorLive ? `${escaparHtml(maiorLive.nome)} · ${formatadorInteiro.format(maiorLive.totalLives || 0)} canais listados` : estadoLives === "carregando" ? "Sincronizando canais…" : "";

  const labelNova = liveMaisNova ? escaparHtml(liveMaisNova.nome) : labelVazio;
  const descNova = liveMaisNova ? `${tempoCriacao} · Z${liveMaisNova.zone ?? 1}-W${liveMaisNova.wave ?? 1}` : estadoLives === "carregando" ? "Sincronizando…" : "";

  const labelTop1 = top1GeralDinamico.nick ? `${formatarNumeroCompacto(top1GeralDinamico.power)} FC` : rankingsCarregando ? "Carregando…" : "Indisponível";
  const descTop1 = top1GeralDinamico.nick ? `${escaparHtml(top1GeralDinamico.rotulo)} (${nomesClasses[top1GeralDinamico.cls] || "Classe desconhecida"} Nv. ${formatadorInteiro.format(top1GeralDinamico.level || 0)})` : rankingsCarregando ? "Sincronizando rankings…" : "O ranking não respondeu.";

  gradeRecordesGlobais.innerHTML = `
    <button type="button" class="tile-panorama clicavel" data-panorama-acao="live-melhor-zona" ${melhorZonaLive ? "" : "disabled"} title="Clique para assistir à transmissão ou simular esta Zona (Twitch / Kick)">
      <span style="color:var(--cyan);">🔥 Maior zona entre lives consultadas</span>
      <strong>${labelZona}</strong>
      <small>${descZona}</small>
    </button>
    <button type="button" class="tile-panorama clicavel" data-panorama-acao="live-maior" ${maiorLive ? "" : "disabled"} title="Clique para assistir à transmissão ou inspecionar no Radar (Twitch / Kick)">
      <span>👥 Maior Live Agora</span>
      <strong>${labelMaior}</strong>
      <small>${descMaior}</small>
    </button>
    <button type="button" class="tile-panorama clicavel" data-panorama-acao="live-mais-nova" ${liveMaisNova ? "" : "disabled"} title="Clique para assistir à transmissão ou inspecionar no Radar (Twitch / Kick)">
      <span>✨ Canal mais novo entre os consultados</span>
      <strong>${labelNova}</strong>
      <small>${descNova}</small>
    </button>
    <button type="button" class="tile-panorama clicavel" data-panorama-acao="consultar-top1" style="border-color: rgba(240, 180, 41, 0.45);" title="Clique para consultar a build e forjas do Top 1 FC Geral">
      <span style="color:var(--gold);">⚡ Top 1 FC Geral</span>
      <strong style="color:var(--gold);">${labelTop1}</strong>
      <small>${descTop1}</small>
    </button>
  `;

  vincularEventosGradePanorama();

  if (acaoEmFoco) {
    [...gradeRecordesGlobais.querySelectorAll("[data-panorama-acao]")]
      .find((botao) => botao.dataset.panoramaAcao === acaoEmFoco)?.focus({ preventScroll: true });
  }

  if (panoramaAtualizacao) {
    const hora = atualizadoEm?.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    const maiorPot = ultimosDadosPanorama.maiorPotencialOnline;
    const partes = [
      patch?.id && `Último patch: ${patch.id}`,
      hora && `Lives consultadas às ${hora}`,
      maiorPot?.potential > 0 && `Maior potencial online: ${maiorPot.name} (${formatarZonaOndaDeOndas(maiorPot.potential)})`,
    ].filter(Boolean);
    if (estadoLives === "erro") partes.push("API de lives indisponível");
    panoramaAtualizacao.textContent = partes.join(" · ") || "Sincronizando lives…";
  }
}

async function refinarDetalhesLivesPanorama(livesOnline) {
  try {
    const alvosMap = new Map();
    [...livesOnline.slice(0, 5), ...livesOnline.slice(-6)].forEach((it) => {
      if (it && it.login) alvosMap.set(it.login, it);
    });
    const alvos = [...alvosMap.values()];

    const resultados = await Promise.allSettled(
      alvos.map(async (it) => {
        const ch = await buscarJsonApi(`/api/ranking/channel/${encodeURIComponent(it.login)}`, undefined, 5000);
        const playersEfetivos = Number.isFinite(ch?.playersNow) ? ch.playersNow : Number(it.playersNow) || 0;
        const ehKick = /^kick:/i.test(it.login);
        const tw = ch?.twitchLogin !== undefined ? ch.twitchLogin : (ehKick ? null : it.login);
        const kc = ch?.kickLogin !== undefined ? ch.kickLogin : (ehKick ? it.login.replace(/^kick:/i, "") : null);
        if (ch) {
          cacheDetalhesCanais.set(it.login.toLowerCase(), {
            twitchLogin: tw,
            kickLogin: kc,
            displayName: ch?.displayName || it.name,
          });
        }
        return {
          name: it.name,
          login: it.login,
          zone: Number(ch?.zone) || null,
          wave: Number(ch?.wave) || null,
          potentialWaves: Number(ch?.potentialWaves ?? it.potential) || 0,
          playersNow: playersEfetivos,
          createdAt: ch?.createdAt || "",
          twitchLogin: tw,
          kickLogin: kc,
        };
      })
    );

    const detalhes = resultados
      .filter((r) => r.status === "fulfilled" && r.value)
      .map((r) => r.value);

    if (detalhes.length > 0) {
      const comZonaAtual = detalhes.filter((item) => item.zone && item.wave);
      const melhorZona = comZonaAtual.reduce((melhor, item) => {
        if (!melhor) return item;
        const scoreItem = (item.zone || 1) * 100 + (item.wave || 1);
        const scoreMelhor = (melhor.zone || 1) * 100 + (melhor.wave || 1);
        return scoreItem > scoreMelhor ? item : melhor;
      }, null);

      if (melhorZona) {
        ultimosDadosPanorama.melhorZonaLive = {
          canal: melhorZona.login,
          nome: melhorZona.name,
          zone: melhorZona.zone,
          wave: melhorZona.wave,
          potentialWaves: melhorZona.potentialWaves || 0,
          playersNow: melhorZona.playersNow,
          twitchLogin: melhorZona.twitchLogin,
          kickLogin: melhorZona.kickLogin,
        };
      }

      const comCriacao = detalhes.filter((d) => d.zone && d.wave && Number.isFinite(Date.parse(d.createdAt)));
      if (comCriacao.length > 0) {
        comCriacao.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const maisNova = comCriacao[0];
        ultimosDadosPanorama.liveMaisNova = {
          canal: maisNova.login,
          nome: maisNova.name,
          createdAt: maisNova.createdAt,
          zone: maisNova.zone,
          wave: maisNova.wave,
          playersNow: maisNova.playersNow,
          twitchLogin: maisNova.twitchLogin,
          kickLogin: maisNova.kickLogin,
        };
      }

      if (ultimosDadosPanorama.maiorLive?.canal) {
        const chMaior = cacheDetalhesCanais.get(ultimosDadosPanorama.maiorLive.canal.toLowerCase());
        if (chMaior) {
          ultimosDadosPanorama.maiorLive.twitchLogin = chMaior.twitchLogin;
          ultimosDadosPanorama.maiorLive.kickLogin = chMaior.kickLogin;
        }
      }

      renderizarGradePanorama();
    }
  } catch {
    // Falha silenciosa mantendo dados prévios
  }
}

async function carregarPanoramaGlobal() {
  if (!gradeRecordesGlobais) return;
  if (panoramaAtualizacao) panoramaAtualizacao.textContent = "Sincronizando dados globais…";

  try {
    const [changelog, runs] = await Promise.all([
      buscarJsonApi("/api/changelog").catch(() => null),
      buscarJsonApi("/api/ranking/runs?page=1&size=50&online=true").catch(() => null),
    ]);

    const livesOnline = Array.isArray(runs?.items)
      ? runs.items.filter((live) => typeof live?.login === "string" && typeof live.name === "string")
      : [];
    ultimosDadosPanorama.estadoLives = !Array.isArray(runs?.items) ? "erro" : livesOnline.length ? "pronto" : "vazio";
    ultimosDadosPanorama.atualizadoEm = Array.isArray(runs?.items) ? new Date() : null;
    livesOnline.sort((a, b) => (b.playersNow || 0) - (a.playersNow || 0));
    preencherSelectsLivesOnline(livesOnline);

    if (changelog?.entries?.[0]) {
      ultimosDadosPanorama.patch = {
        id: changelog.entries[0].id || changelog.latest || "—",
        title: changelog.entries[0].title || "Atualizado",
      };
    }

    if (livesOnline.length > 0) {
      const topLive = livesOnline[0];
      ultimosDadosPanorama.maiorLive = {
        canal: topLive.login || topLive.name.toLowerCase(),
        nome: topLive.name,
        playersNow: topLive.playersNow || 0,
        totalLives: livesOnline.length,
      };
      const comPotencial = livesOnline.filter((l) => Number(l.potential) > 0);
      comPotencial.sort((a, b) => Number(b.potential) - Number(a.potential));
      ultimosDadosPanorama.maiorPotencialOnline = comPotencial[0]
        ? { name: comPotencial[0].name, login: comPotencial[0].login, potential: Number(comPotencial[0].potential) }
        : null;
    }

    renderizarGradePanorama();

    if (livesOnline.length > 0) {
      void refinarDetalhesLivesPanorama(livesOnline);
    }
  } catch {
    ultimosDadosPanorama.estadoLives = "erro";
    renderizarGradePanorama();
  }
}

function sincronizarTextosTopsUI() {
  const atalhos = [
    ["top1", top1GeralDinamico, topPillValTop1, btnCarregarExemplo, "👑 Top 1 Geral"],
    ["warrior", top1DinamicoPorClasse.warrior, topPillValWarrior, null, "🛡️ Top Guerreiro"],
    ["cleric", top1DinamicoPorClasse.cleric, topPillValCleric, null, "✨ Top Clérigo"],
    ["archer", top1DinamicoPorClasse.archer, topPillValArcher, null, "🏹 Top Arqueiro"],
    ["level", topLevelDinamico, topPillValLevel, null, "⭐ Maior Nível"],
  ];
  for (const [id, item, valor, botao, rotulo] of atalhos) {
    const disponivel = Boolean(item.nick);
    const estado = rankingsCarregando ? "Carregando…" : "Indisponível";
    const metrica = id === "level" ? `Nv. ${item.level}` : `${formatarNumeroCompacto(item.power)} FC`;
    if (valor) {
      valor.textContent = disponivel ? `${item.rotulo} (${metrica})` : estado;
      const botaoRanking = document.querySelector(`[data-top-alvo="${id}"]`);
      if (botaoRanking) botaoRanking.disabled = !disponivel;
    }
    const atalho = botao || document.querySelector(`[data-top-atalho="${id}"]`);
    if (atalho) {
      atalho.disabled = !disponivel;
      atalho.textContent = `${rotulo} · ${disponivel ? item.rotulo : estado}`;
    }
  }

  renderizarGradePanorama();
  if (perfilCarregadoP1) atualizarCardP1Comparacao(perfilCarregadoP1, plataformaCarregadaP1);
}

const CHAVE_CACHE_TOPS = "riftinfos:cache_tops_ranking:v1";
const TTL_CACHE_TOPS_MS = 30 * 60 * 1000;

function lerCacheTopsRanking() {
  try {
    const bruto = window.localStorage?.getItem(CHAVE_CACHE_TOPS);
    if (!bruto) return null;
    const parsed = JSON.parse(bruto);
    if (!parsed?.atualizadoEm || Date.now() - parsed.atualizadoEm > TTL_CACHE_TOPS_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function salvarCacheTopsRanking(dados) {
  try {
    window.localStorage?.setItem(CHAVE_CACHE_TOPS, JSON.stringify({ ...dados, atualizadoEm: Date.now() }));
  } catch {
    // Ignora falha de storage
  }
}

async function atualizarTop1Dinamicos() {
  const consultarTop = async (query, classe, porNivel = false) => {
    try {
      const dados = await buscarJsonApi(`/api/ranking/characters?page=1&size=5${query}`, undefined, 15000);
      const top = dados?.items?.[0];
      if (!/^(?:kick:)?[a-z0-9_.-]{1,40}$/i.test(top?.login || "") ||
          !Object.hasOwn(nomesClasses, top.cls) || (classe && top.cls !== classe) ||
          !Number.isFinite(porNivel ? top.level : top.power)) return rankingIndisponivel;
      return {
        nick: top.login.replace(/^kick:/i, ""),
        plataforma: /^kick:/i.test(top.login) ? "kick" : "twitch",
        rotulo: top.name || top.login,
        power: top.power,
        level: top.level,
        cls: top.cls,
      };
    } catch {
      return rankingIndisponivel;
    }
  };

  const classes = Object.keys(top1DinamicoPorClasse);
  const [geral, nivel, ...tops] = await Promise.all([
    consultarTop(""),
    consultarTop("&sort=level", undefined, true),
    ...classes.map((classe) => consultarTop(`&cls=${classe}`, classe)),
  ]);

  let nivelResolvido = nivel;
  if (!nivelResolvido.nick) {
    try {
      const records = await buscarJsonApi("/api/ranking/records", undefined, 7000);
      const tc = records?.topCharacter;
      if (tc?.name && Object.hasOwn(nomesClasses, tc.cls) && Number.isFinite(tc.level)) {
        nivelResolvido = {
          nick: tc.name.replace(/^kick:/i, "").toLowerCase(),
          plataforma: /^kick:/i.test(tc.name) ? "kick" : "twitch",
          rotulo: tc.name,
          power: null,
          level: tc.level,
          cls: tc.cls,
        };
      }
    } catch {
      // Sem fallback adicional
    }
  }

  const cache = lerCacheTopsRanking();
  top1GeralDinamico = geral.nick ? geral : cache?.geral?.nick ? cache.geral : geral;
  topLevelDinamico = nivelResolvido.nick ? nivelResolvido : cache?.nivel?.nick ? cache.nivel : nivelResolvido;
  classes.forEach((classe, idx) => {
    const novo = tops[idx];
    const salvo = cache?.porClasse?.[classe];
    top1DinamicoPorClasse[classe] = novo.nick ? novo : salvo?.nick ? salvo : novo;
  });

  if (geral.nick || nivelResolvido.nick || tops.some((t) => t.nick)) {
    salvarCacheTopsRanking({
      geral: top1GeralDinamico,
      nivel: topLevelDinamico,
      porClasse: { ...top1DinamicoPorClasse },
    });
  }

  rankingsCarregando = false;
  sincronizarTextosTopsUI();
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

export function configurarAtalhosRanking() {
  if (btnCarregarExemplo) {
    btnCarregarExemplo.addEventListener("click", () => carregarAtalhoTop("top1"));
  }

  document.querySelectorAll("[data-top-alvo]").forEach((btn) => {
    btn.addEventListener("click", () => carregarAtalhoTop(btn.dataset.topAlvo));
  });

  document.querySelectorAll("[data-top-atalho]").forEach((btn) => {
    btn.addEventListener("click", () => carregarAtalhoTop(btn.dataset.topAtalho));
  });
}

export {
  abrirModalEscolhaLive,
  atualizarTop1Dinamicos,
  cacheDetalhesCanais,
  carregarPanoramaGlobal,
  sincronizarTextosTopsUI,
  top1DinamicoPorClasse,
  top1GeralDinamico,
  vincularEventosGradePanorama,
};
