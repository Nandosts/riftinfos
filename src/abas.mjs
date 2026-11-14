import { renderizarSimuladorMonstros } from "./chefes.mjs";
import { consultarPerfil, jogadorAtual } from "./perfil.mjs";
import { renderizarSimulador } from "./simulador/tela.mjs";

const botoesAbas = {
  resumo: document.querySelector("#aba-resumo"),
  forjas: document.querySelector("#aba-forjas"),
  equipamentos: document.querySelector("#aba-equipamentos"),
  simulador: document.querySelector("#aba-simulador"),
  monstros: document.querySelector("#aba-monstros"),
  "radar-live": document.querySelector("#aba-radar-live"),
  comparacao: document.querySelector("#aba-comparacao"),
};

const secoesAbas = {
  resumo: document.querySelector("#secao-resumo"),
  forjas: document.querySelector("#secao-forjas"),
  equipamentos: document.querySelector("#secao-equipamentos"),
  simulador: document.querySelector("#secao-simulador"),
  monstros: document.querySelector("#secao-monstros"),
  "radar-live": document.querySelector("#secao-radar-live"),
  comparacao: document.querySelector("#secao-comparacao"),
};

let abaAtualAtiva = "resumo";

function alternarVisibilidadeAba(abaAlvo, atualizarUrl = true) {
  abaAtualAtiva = Object.hasOwn(secoesAbas, abaAlvo) ? abaAlvo : "resumo";
  for (const [id, sec] of Object.entries(secoesAbas)) {
    const btn = botoesAbas[id];
    if (!sec || !btn) continue;
    const ativa = id === abaAtualAtiva;
    btn.setAttribute("aria-selected", ativa ? "true" : "false");
    btn.tabIndex = ativa ? 0 : -1;
    if (ativa) {
      sec.removeAttribute("hidden");
      sec.hidden = false;
    } else {
      sec.setAttribute("hidden", "until-found");
      if (!("onbeforematch" in HTMLElement.prototype)) {
        sec.hidden = true;
      }
    }
  }

  if (atualizarUrl && typeof window !== "undefined" && window.location.protocol !== "file:") {
    try {
      const urlPagina = new URL(window.location.href);
      urlPagina.searchParams.set("aba", abaAtualAtiva);
      window.history.replaceState(null, "", urlPagina);
    } catch {}
  }
}

function configurarAbas() {
  const listaChaves = Object.keys(botoesAbas);
  for (let i = 0; i < listaChaves.length; i++) {
    const id = listaChaves[i];
    const btn = botoesAbas[id];
    if (!btn) continue;

    btn.addEventListener("click", () => {
      alternarVisibilidadeAba(id);
      if (id === "monstros") {
        renderizarSimuladorMonstros();
      } else if (id === "simulador") {
        renderizarSimulador();
      }
    });

    btn.addEventListener("keydown", (e) => {
      let novoIdx = -1;
      if (e.key === "ArrowRight") {
        novoIdx = (i + 1) % listaChaves.length;
      } else if (e.key === "ArrowLeft") {
        novoIdx = (i - 1 + listaChaves.length) % listaChaves.length;
      } else if (e.key === "Home") {
        novoIdx = 0;
      } else if (e.key === "End") {
        novoIdx = listaChaves.length - 1;
      }
      if (novoIdx !== -1) {
        e.preventDefault();
        const proxId = listaChaves[novoIdx];
        const proxBtn = botoesAbas[proxId];
        if (proxBtn) {
          proxBtn.focus();
          alternarVisibilidadeAba(proxId);
          if (proxId === "monstros") renderizarSimuladorMonstros();
          else if (proxId === "simulador") renderizarSimulador();
        }
      }
    });
  }

  document.addEventListener("beforematch", (evento) => {
    for (const [id, sec] of Object.entries(secoesAbas)) {
      if (sec && sec.contains(evento.target)) {
        alternarVisibilidadeAba(id);
        break;
      }
    }
  });

  if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
    window.addEventListener("popstate", () => {
      if (window.location.protocol === "file:") return;
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const abaUrl = urlParams.get("aba");
        if (abaUrl && Object.hasOwn(secoesAbas, abaUrl)) {
          alternarVisibilidadeAba(abaUrl, false);
        }
        const nickUrl = urlParams.get("nick");
        const platUrl = urlParams.get("plataforma") || "twitch";
        const clsUrl = urlParams.get("cls");
        if (nickUrl && (!jogadorAtual || jogadorAtual.nick !== nickUrl || jogadorAtual.plataforma !== platUrl)) {
          void consultarPerfil({ nick: nickUrl, plataforma: platUrl }, clsUrl);
        }
      } catch {}
    });
  }
}

function atualizarParametrosUrl(jogador, classeSelecionada) {
  if (window.location.protocol === "file:") return;
  try {
    const urlPagina = new URL(window.location.href);
    urlPagina.searchParams.set("nick", jogador.nick);
    urlPagina.searchParams.set("plataforma", jogador.plataforma);
    if (classeSelecionada) {
      urlPagina.searchParams.set("cls", classeSelecionada);
    } else {
      urlPagina.searchParams.delete("cls");
    }
    if (abaAtualAtiva) {
      urlPagina.searchParams.set("aba", abaAtualAtiva);
    }
    window.history.replaceState(null, "", urlPagina);
  } catch {
    // Ambiente restringiu replaceState
  }
}

export {
  abaAtualAtiva,
  alternarVisibilidadeAba,
  atualizarParametrosUrl,
  configurarAbas,
};
