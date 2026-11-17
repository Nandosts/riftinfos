import { atualizarParametrosUrl } from "./abas.mjs";
import { buscarRespostaPerfil, validarPerfilApi } from "./api.mjs";
import { Analise, CALCULATION_VERSION, Historico } from "./bibliotecas.mjs";
import { renderizarSimuladorMonstros } from "./chefes.mjs";
import {
  calcularFc,
  calcularMetricasCombate,
  calcularStatusSimulados,
  inferirAtributosBase,
} from "./combate.mjs";
import {
  atualizarCardP1Comparacao,
  limparComparacao,
} from "./comparacao.mjs";
import { nomesClasses } from "./dados.mjs";
import { renderizarEquipamentosEGemas } from "./equipamentos.mjs";
import { renderizarForjas } from "./forjas.mjs";
import { formatadorInteiro } from "./formato.mjs";
import { normalizarEntradaNick } from "./identidade.mjs";
import { renderizarResultadoRadar, ultimosDadosRadar } from "./radar.mjs";
import { renderizarResumoPersonagem } from "./resumo.mjs";
import { btnSimImportar } from "./simulador/controles.mjs";
import { importarPerfilParaSimulador, simulacao } from "./simulador/estado.mjs";
import { renderizarSimulador } from "./simulador/tela.mjs";

const formularioBusca = document.querySelector("#formulario-busca");
const inputNick = document.querySelector("#input-nick");
const selectPlataforma = document.querySelector("#select-plataforma");
const statusConsulta = document.querySelector("#status-consulta");
const cabecalhoPerfil = document.querySelector("#cabecalho-perfil");
const avisoSemPerfil = document.querySelector("#aviso-sem-perfil");

const imgAvatar = document.querySelector("#avatar-jogador");
const selectPersonagem = document.querySelector("#select-personagem");

const conteudoResumoVazio = document.querySelector("#conteudo-resumo-vazio");
const conteudoResumoPerfil = document.querySelector("#conteudo-resumo-perfil");

const conteudoForjasVazio = document.querySelector("#conteudo-forjas-vazio");
const conteudoForjasPerfil = document.querySelector("#conteudo-forjas-perfil");

const conteudoEquipamentosVazio = document.querySelector("#conteudo-equipamentos-vazio");
const conteudoEquipamentosPerfil = document.querySelector("#conteudo-equipamentos-perfil");

const conteudoComparacaoVazio = document.querySelector("#conteudo-comparacao-vazio");
const conteudoComparacaoPerfil = document.querySelector("#conteudo-comparacao-perfil");

// Estado da aplicação com envelopes de consulta
const estadoPerfil = Analise.criarEnvelopeConsulta
  ? Analise.criarEnvelopeConsulta()
  : {
      data: null,
      status: "idle",
      receivedAt: null,
      sourceUpdatedAt: null,
      fromCache: false,
      error: null,
      completeness: null,
    };

let jogadorAtual;
let perfilCarregadoP1;
let plataformaCarregadaP1;
let requisicaoAtiva;

function atualizarEstadoVazioOuPerfil(temPerfil) {
  if (cabecalhoPerfil) cabecalhoPerfil.hidden = !temPerfil;
  if (btnSimImportar) btnSimImportar.disabled = !temPerfil;
  if (avisoSemPerfil) avisoSemPerfil.hidden = temPerfil;

  if (conteudoResumoVazio) conteudoResumoVazio.hidden = temPerfil;
  if (conteudoResumoPerfil) conteudoResumoPerfil.hidden = !temPerfil;

  if (conteudoForjasVazio) conteudoForjasVazio.hidden = temPerfil;
  if (conteudoForjasPerfil) conteudoForjasPerfil.hidden = !temPerfil;
  if (conteudoEquipamentosVazio) conteudoEquipamentosVazio.hidden = temPerfil;
  if (conteudoEquipamentosPerfil) conteudoEquipamentosPerfil.hidden = !temPerfil;
  if (conteudoComparacaoVazio) conteudoComparacaoVazio.hidden = temPerfil;
  if (conteudoComparacaoPerfil) conteudoComparacaoPerfil.hidden = !temPerfil;
}

function renderizarPerfil(perfil, plataforma) {
  limparComparacao();
  const nomeExibicao = perfil.displayName || perfil.login;
  document.querySelector("#nome-jogador").textContent = nomeExibicao;
  document.querySelector("#plataforma-jogador").textContent =
    plataforma === "kick" ? "KICK" : "TWITCH";

  if (imgAvatar) {
    if (perfil.avatar) {
      imgAvatar.src = perfil.avatar;
      imgAvatar.alt = `Avatar de ${nomeExibicao}`;
      imgAvatar.onerror = () => {
        imgAvatar.hidden = true;
      };
      imgAvatar.hidden = false;
    } else {
      imgAvatar.hidden = true;
    }
  }

  const niveisPorClasse = new Map(
    (perfil.classes ?? []).map((item) => [item.cls, item.level])
  );
  if (perfil.cls && !niveisPorClasse.has(perfil.cls)) {
    niveisPorClasse.set(perfil.cls, perfil.level);
  }

  const opcoesPersonagem = Object.entries(nomesClasses)
    .filter(([chave]) => niveisPorClasse.has(chave))
    .map(([chave, nome]) => {
      const nivel = niveisPorClasse.get(chave);
      const sufixoNivel = nivel ? ` (Nv. ${formatadorInteiro.format(nivel)})` : "";
      return new Option(`${nome}${sufixoNivel}`, chave);
    });

  selectPersonagem.replaceChildren(...opcoesPersonagem);
  selectPersonagem.value = perfil.cls;

  const atBase = inferirAtributosBase(perfil);
  const itensEquipados = (perfil.equipped ?? []).filter((i) => i && i.slot !== "cosmetic");
  const statusCalculados = calcularStatusSimulados(perfil.cls, perfil.level, atBase, itensEquipados);
  statusCalculados.fc = calcularFc(perfil.cls, statusCalculados);
  const metricasCombate = calcularMetricasCombate(perfil.cls, perfil.level, statusCalculados, itensEquipados);

  // 1. Aba Resumo
  renderizarResumoPersonagem(perfil, statusCalculados, metricasCombate, perfil.cls, plataforma);

  // 2. Aba Forjas: Tabela + Gelo/Fogo + Planejador + Eventos/Canais
  renderizarForjas(perfil);

  // 3. Aba Equipamentos, Dano & FC
  renderizarEquipamentosEGemas(perfil);

  // 4. Estado da Comparação, Simulador e Monstros
  perfilCarregadoP1 = perfil;
  plataformaCarregadaP1 = plataforma;
  atualizarCardP1Comparacao(perfil, plataforma);
  atualizarEstadoVazioOuPerfil(true);

  if (!simulacao.simuladorEditadoManual) {
    importarPerfilParaSimulador(perfil);
  }
  renderizarSimulador();
  renderizarSimuladorMonstros();
  if (ultimosDadosRadar) {
    renderizarResultadoRadar();
  }
}

async function consultarPerfil(jogador, classeDesejada) {
  requisicaoAtiva?.abort();
  const controlador = new AbortController();
  requisicaoAtiva = controlador;

  const nomePlataforma = jogador.plataforma === "kick" ? "Kick" : "Twitch";
  const loginApi = jogador.plataforma === "kick" ? `kick:${jogador.nick}` : jogador.nick;

  delete statusConsulta.dataset.error;
  statusConsulta.textContent = `Consultando ${jogador.nick} na ${nomePlataforma}…`;
  estadoPerfil.status = "loading";

  try {
    const { resposta, dados, loginConsultado } = await buscarRespostaPerfil(
      loginApi,
      classeDesejada,
      controlador.signal
    );

    if (resposta.status === 404) {
      throw new Error(`Perfil não encontrado na ${nomePlataforma}. Confira o nick ou tente a outra plataforma.`);
    }
    if (!resposta.ok) {
      throw new Error("O RiftStream não respondeu à consulta. Tente novamente.");
    }

    if (requisicaoAtiva !== controlador) return;
    const perfil = validarPerfilApi(dados, loginConsultado, classeDesejada);
    const nickConfirmado = loginConsultado.replace(/^kick:/, "");
    const jogadorConfirmado = { ...jogador, nick: nickConfirmado };

    estadoPerfil.data = perfil;
    estadoPerfil.status = "success";
    estadoPerfil.receivedAt = new Date().toISOString();
    estadoPerfil.sourceUpdatedAt = perfil.updatedAt || null;
    estadoPerfil.fromCache = false;
    estadoPerfil.error = null;

    if (Historico.obterConfigAutoSave && Historico.obterConfigAutoSave()) {
      Historico.salvarSnapshotConsulta(jogador.plataforma, nickConfirmado, perfil.cls, perfil, estadoPerfil.sourceUpdatedAt, CALCULATION_VERSION);
    }

    renderizarPerfil(perfil, jogador.plataforma);

    if (inputNick.value === jogador.nick) inputNick.value = nickConfirmado;
    jogadorAtual = jogadorConfirmado;
    atualizarParametrosUrl(jogadorConfirmado, perfil.cls);

    const poderFormatado = Number.isFinite(perfil.power)
      ? ` · Poder ${formatadorInteiro.format(perfil.power)}`
      : "";
    statusConsulta.textContent = `${nomesClasses[perfil.cls]} · Nível ${formatadorInteiro.format(perfil.level)}${poderFormatado}`;
  } catch (erro) {
    if (requisicaoAtiva !== controlador) return;

    if (perfilCarregadoP1) selectPersonagem.value = perfilCarregadoP1.cls;
    const ehMesmaIdentidade =
      perfilCarregadoP1 &&
      plataformaCarregadaP1 === jogador.plataforma &&
      perfilCarregadoP1.login?.toLowerCase() === loginApi.toLowerCase();

    if (ehMesmaIdentidade && estadoPerfil.receivedAt) {
      estadoPerfil.status = "stale";
      estadoPerfil.error = erro.message;
      const dataRec = new Date(estadoPerfil.receivedAt);
      const horaFmt = dataRec.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      statusConsulta.dataset.error = "true";
      statusConsulta.textContent = `Não foi possível atualizar. Mostrando a consulta de ${horaFmt}. (${erro.message})`;
    } else {
      estadoPerfil.status = "error";
      estadoPerfil.error = erro.message;
      statusConsulta.dataset.error = "true";
      if (perfilCarregadoP1) {
        statusConsulta.textContent = `Não foi possível carregar ${jogador.nick} (${erro.message}). O personagem anterior (${perfilCarregadoP1.displayName || perfilCarregadoP1.login}) permanece visível.`;
      } else {
        if (erro instanceof TypeError || erro.name === "TimeoutError") {
          statusConsulta.textContent =
            window.location.protocol === "file:"
              ? "Falha de conexão em arquivo local. Abra http://127.0.0.1:4173/ no navegador."
              : "Falha de conexão com a API do RiftStream. Tente novamente em instantes.";
        } else {
          statusConsulta.textContent = erro.message;
        }
      }
    }
  }
}

export function configurarConsultaPerfil() {
  formularioBusca.addEventListener("submit", (evento) => {
    evento.preventDefault();
    const dados = new FormData(formularioBusca);
    const { nick, plataforma } = normalizarEntradaNick(dados.get("nick"), dados.get("plataforma"));

    if (!/^[a-z0-9_.\-]{1,40}$/i.test(nick)) {
      requisicaoAtiva?.abort();
      requisicaoAtiva = undefined;
      statusConsulta.dataset.error = "true";
      statusConsulta.textContent = `Informe um nick válido (ex. nando_sts).`;
      return;
    }

    inputNick.value = nick;
    selectPlataforma.value = plataforma;
    void consultarPerfil({ nick, plataforma });
  });

  selectPersonagem.addEventListener("change", () => {
    if (jogadorAtual) {
      void consultarPerfil(jogadorAtual, selectPersonagem.value);
    }
  });
}

export {
  atualizarEstadoVazioOuPerfil,
  consultarPerfil,
  estadoPerfil,
  inputNick,
  jogadorAtual,
  perfilCarregadoP1,
  plataformaCarregadaP1,
  selectPlataforma,
  statusConsulta,
};
