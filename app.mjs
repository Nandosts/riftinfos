import { alternarVisibilidadeAba, configurarAbas } from "./src/abas.mjs";
import { Compartilhamento } from "./src/bibliotecas.mjs";
import { configurarChefes, renderizarSimuladorMonstros } from "./src/chefes.mjs";
import { configurarComparacao } from "./src/comparacao.mjs";
import { nomesClasses } from "./src/dados.mjs";
import { normalizarEntradaNick } from "./src/identidade.mjs";
import {
  atualizarTop1Dinamicos,
  carregarPanoramaGlobal,
  configurarAtalhosRanking,
  sincronizarTextosTopsUI,
  vincularEventosGradePanorama,
} from "./src/panorama.mjs";
import {
  atualizarEstadoVazioOuPerfil,
  configurarConsultaPerfil,
  consultarPerfil,
  inputNick,
  selectPlataforma,
} from "./src/perfil.mjs";
import { configurarRadar, popularSeletorItensRadar } from "./src/radar.mjs";
import { renderizarSecaoGlossario } from "./src/resumo.mjs";
import { configurarSimulador } from "./src/simulador/controles.mjs";
import { simulacao } from "./src/simulador/estado.mjs";
import { renderizarSimulador } from "./src/simulador/tela.mjs";

// Inicialização imediata da interface
const parametrosIniciais = new URLSearchParams(window.location.search);
configurarAbas();
configurarConsultaPerfil();
configurarAtalhosRanking();
configurarSimulador();
configurarChefes(parametrosIniciais);
configurarRadar();
configurarComparacao();
alternarVisibilidadeAba(parametrosIniciais.get("aba"), false);
atualizarEstadoVazioOuPerfil(false);
popularSeletorItensRadar();
renderizarSimulador();
renderizarSimuladorMonstros();
renderizarSecaoGlossario();
vincularEventosGradePanorama();
sincronizarTextosTopsUI();
void carregarPanoramaGlobal();
void atualizarTop1Dinamicos();

// Decodifica build compartilhada via URL (#build=...)
if (typeof window !== "undefined" && window.location?.hash && Compartilhamento?.decodificarBuildDeHash) {
  try {
    const buildDecodificada = await Compartilhamento.decodificarBuildDeHash(window.location.hash);
    if (buildDecodificada?.buildA) {
      simulacao.estadoSimulador = buildDecodificada.buildA;
      simulacao.simuladorEditadoManual = true;
      renderizarSimulador();
      if (parametrosIniciais.get("aba") === "monstros") {
        renderizarSimuladorMonstros();
      } else {
        alternarVisibilidadeAba("simulador");
      }
    }
  } catch {}
}

const nickInicial = parametrosIniciais.get("nick");
if (nickInicial) {
  const { nick, plataforma } = normalizarEntradaNick(
    nickInicial,
    parametrosIniciais.get("plataforma")
  );
  const classeInicial = parametrosIniciais.get("cls");
  if (/^[a-z0-9_.\-]{1,40}$/i.test(nick)) {
    inputNick.value = nick;
    selectPlataforma.value = plataforma;
    void consultarPerfil(
      { nick, plataforma },
      Object.hasOwn(nomesClasses, classeInicial) ? classeInicial : undefined
    );
  }
}
