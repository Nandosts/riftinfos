import { abaAtualAtiva, alternarVisibilidadeAba } from "../abas.mjs";
import { renderizarSimuladorMonstros, selectMonstroOrigem } from "../chefes.mjs";
import {
  catalogoAneis,
  catalogoArmas,
  catalogoConjuntos,
  catalogoEscalasPecas,
  catalogoGemas,
} from "../dados.mjs";
import { perfilCarregadoP1, statusConsulta } from "../perfil.mjs";
import {
  adequarTierGemas,
  aplicarAtributosPadraoNoItem,
  aplicarTrocaAnelSimulador,
  criarGemaPreset,
  criarModeloSimuladorPadrao,
  definirTierEngaste,
  equiparConjuntoCompletoSimulador,
  equiparPecaConjuntoSimulador,
  limparVisualImportado,
  importarPerfilParaSimulador,
  obterNomeOficialPecaConjunto,
  obterTierEngaste,
  recalcularGemasBuildComModo,
  recalcularGemasItem,
  restaurarOuCalcularAtributosPeca,
  simulacao,
  slotsAbertosSimulador,
} from "./estado.mjs";
import { containerSimulador, renderizarSimulador } from "./tela.mjs";

const btnSimImportar = document.querySelector("#btn-sim-importar");
const btnSimResetar = document.querySelector("#btn-sim-resetar");

function vincularEventosSimulador() {
  if (!containerSimulador) return;

  // Controles da Barra Superior do Modo Criativo
  containerSimulador.querySelectorAll("[data-sim-modo-vis]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      simulacao.modoVisualizacaoSimulador = e.currentTarget.dataset.simModoVis === "lista" ? "lista" : "ficha";
      renderizarSimulador();
    });
  });

  containerSimulador.querySelectorAll("[data-sim-modo-roll]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const modo = e.currentTarget.dataset.simModoRoll;
      if (modo === "max" || modo === "media" || modo === "sorteio") {
        simulacao.modoRolagemGemaSimulador = modo;
        renderizarSimulador();
      }
    });
  });

  containerSimulador.querySelectorAll("[data-sim-aplicar-roll-todas]").forEach((btn) => {
    btn.addEventListener("click", () => {
      simulacao.simuladorEditadoManual = true;
      recalcularGemasBuildComModo();
      renderizarSimulador();
    });
  });

  containerSimulador.querySelectorAll("[data-sim-toggle-autostats]").forEach((chk) => {
    chk.addEventListener("change", (e) => {
      simulacao.autoCalcularStatsItemSimulador = Boolean(e.target.checked);
      renderizarSimulador();
    });
  });

  containerSimulador.querySelectorAll("[data-sim-preset-criativo]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      simulacao.simuladorEditadoManual = true;
      const preset = e.currentTarget.dataset.simPresetCriativo;
      if (preset === "max330") {
        simulacao.estadoSimulador.itens.forEach((it) => {
          it.rarity = 7;
          it.itemLevel = 330;
          aplicarAtributosPadraoNoItem(it, true);
        });
      } else if (preset === "gemas_safira" || preset === "gemas_rubi") {
        const tipoGema = preset === "gemas_safira" ? "sapphire" : "ruby";
        simulacao.estadoSimulador.itens.forEach((it) => {
          const t = Number(it.gemTierPadrao || 5);
          it.gems = Array.from({ length: 6 }, () => criarGemaPreset(tipoGema, it.slot, t, it.itemLevel || 300));
        });
      }
      renderizarSimulador();
    });
  });

  const detailsAvancadas = containerSimulador.querySelector("#sim-details-avancadas");
  detailsAvancadas?.addEventListener("toggle", () => {
    simulacao.opcoesAvancadasAbertasSimulador = Boolean(detailsAvancadas.open);
  });

  const buscaPeca = containerSimulador.querySelector("#sim-busca-peca-slot");
  buscaPeca?.addEventListener("input", () => {
    simulacao.termoBuscaSlotSimulador = buscaPeca.value;
    renderizarSimulador();
  });

  containerSimulador.querySelectorAll("[data-sim-selecionar-engaste]").forEach((botao) => {
    botao.addEventListener("click", () => {
      simulacao.engasteSelecionadoSimulador = Number(botao.dataset.simSelecionarEngaste);
      renderizarSimulador();
    });
  });

  containerSimulador.querySelectorAll("[data-sim-gem-repetir-ativo], [data-sim-gem-limpar-unico]").forEach((botao) => {
    botao.addEventListener("click", () => {
      const repetir = botao.hasAttribute("data-sim-gem-repetir-ativo");
      const [idxSlot, idxGema] = (botao.dataset.simGemRepetirAtivo || botao.dataset.simGemLimparUnico).split(":").map(Number);
      const item = simulacao.estadoSimulador.itens[idxSlot];
      const gema = item?.gems[idxGema];
      if (!gema) return;
      simulacao.simuladorEditadoManual = true;
      if (repetir) {
        const tipo = gema.type || gema.kind;
        if (!Object.hasOwn(catalogoGemas, tipo)) return;
        const limite = Math.min(6, Number(item.sockets ?? 6));
        item.gems = Array.from({ length: 6 }, (_, i) =>
          i >= limite ? null : i === idxGema ? gema : criarGemaPreset(tipo, item.slot, gema.tier, item.itemLevel)
        );
      } else {
        item.gems[idxGema] = null;
      }
      renderizarSimulador();
    });
  });

  // Navegação dos slots no Paperdoll
  containerSimulador.querySelectorAll("[data-sim-selecionar-slot]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const idx = Number(e.currentTarget.dataset.simSelecionarSlot);
      if (!Number.isNaN(idx) && idx >= 0 && idx < simulacao.estadoSimulador.itens.length) {
        if (simulacao.slotSelecionadoSimulador !== idx) {
          simulacao.engasteSelecionadoSimulador = 0;
          simulacao.termoBuscaSlotSimulador = "";
        }
        simulacao.slotSelecionadoSimulador = idx;
        const abrirBancada = e.currentTarget.hasAttribute("data-sim-scroll-bancada");
        renderizarSimulador();
        if (abrirBancada) {
          const bancada = document.querySelector("#sim-bancada-slot-oficial");
          bancada?.querySelector("#sim-busca-peca-slot")?.focus({ preventScroll: true });
          requestAnimationFrame(() => bancada?.scrollIntoView({ block: "start" }));
        }
      }
    });
  });

  containerSimulador.querySelectorAll("[data-sim-classe-btn]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      simulacao.simuladorEditadoManual = true;
      simulacao.estadoSimulador.cls = e.currentTarget.dataset.simClasseBtn;
      renderizarSimulador();
      if (abaAtualAtiva === "monstros") renderizarSimuladorMonstros();
    });
  });

  containerSimulador.querySelectorAll("[data-sim-filtro-galeria]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      simulacao.filtroConjuntoSlotSimulador = e.currentTarget.dataset.simFiltroGaleria === "todos" ? "todos" : "classe";
      renderizarSimulador();
    });
  });

  // Troca de peça individual de conjunto no slot ativo (Paperdoll Bancada)
  containerSimulador.querySelectorAll("[data-sim-equipar-peca-set]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      simulacao.simuladorEditadoManual = true;
      const [idxStr, setKey] = e.currentTarget.dataset.simEquiparPecaSet.split(":");
      const item = simulacao.estadoSimulador.itens[Number(idxStr)];
      equiparPecaConjuntoSimulador(item, setKey);
      renderizarSimulador();
    });
  });

  // Troca para arma avulsa (sem conjunto)
  containerSimulador.querySelectorAll("[data-sim-equipar-arma-avulsa]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      simulacao.simuladorEditadoManual = true;
      const kind = e.currentTarget.dataset.simEquiparArmaAvulsa;
      const arma = simulacao.estadoSimulador.itens[0];
      if (!arma) return;
      if (arma.kind !== kind || arma.set) {
        limparVisualImportado(arma);
        arma.look = 0;
      }
      arma.set = "";
      arma.kind = kind;
      arma.name = catalogoArmas[kind]?.nome || "Arma";
      if (simulacao.autoCalcularStatsItemSimulador) {
        if (catalogoEscalasPecas[kind]?.raridadeBase) {
          arma.rarity = catalogoEscalasPecas[kind].raridadeBase;
        }
        restaurarOuCalcularAtributosPeca(arma, false);
      }
      renderizarSimulador();
    });
  });

  // Troca de anel na galeria visual
  containerSimulador.querySelectorAll("[data-sim-equipar-anel]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      simulacao.simuladorEditadoManual = true;
      const look = Number(e.currentTarget.dataset.simEquiparAnel) || 0;
      const anel = simulacao.estadoSimulador.itens[3];
      if (!anel) return;
      aplicarTrocaAnelSimulador(anel, look);
      renderizarSimulador();
    });
  });

  // Raridade rápida e nível rápido da peça selecionada
  containerSimulador.querySelectorAll("[data-sim-raridade-rapida]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      simulacao.simuladorEditadoManual = true;
      const [idxStr, rarStr] = e.currentTarget.dataset.simRaridadeRapida.split(":");
      const item = simulacao.estadoSimulador.itens[Number(idxStr)];
      if (!item) return;
      item.rarity = Number(rarStr) || 0;
      adequarTierGemas(item);
      if (simulacao.autoCalcularStatsItemSimulador) {
        restaurarOuCalcularAtributosPeca(item, false);
      }
      renderizarSimulador();
    });
  });

  containerSimulador.querySelectorAll("[data-sim-nivel-peca-rapido]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      simulacao.simuladorEditadoManual = true;
      const [idxStr, nvStr] = e.currentTarget.dataset.simNivelPecaRapido.split(":");
      const item = simulacao.estadoSimulador.itens[Number(idxStr)];
      if (!item) return;
      item.itemLevel = Math.max(1, Math.min(999, Number(nvStr) || 1));
      if (simulacao.autoCalcularStatsItemSimulador) {
        restaurarOuCalcularAtributosPeca(item, true);
      } else {
        recalcularGemasItem(item);
      }
      renderizarSimulador();
    });
  });

  containerSimulador.querySelectorAll("[data-sim-recalc-peca]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      simulacao.simuladorEditadoManual = true;
      const idx = Number(e.currentTarget.dataset.simRecalcPeca);
      const item = simulacao.estadoSimulador.itens[idx];
      if (!item) return;
      aplicarAtributosPadraoNoItem(item, true);
      renderizarSimulador();
    });
  });

  containerSimulador.querySelectorAll("[data-sim-preencher-gema-peca]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      simulacao.simuladorEditadoManual = true;
      const [idxStr, tipoGema] = e.currentTarget.dataset.simPreencherGemaPeca.split(":");
      const item = simulacao.estadoSimulador.itens[Number(idxStr)];
      if (!item) return;
      const tierSlot = Number(item.gemTierPadrao || 5);
      item.gems = Array.from({ length: 6 }, () => criarGemaPreset(tipoGema, item.slot, tierSlot, item.itemLevel || 300));
      renderizarSimulador();
    });
  });

  // Monitora abertura/fechamento dos slots para manter abertos durante qualquer simulação (Modo Lista)
  containerSimulador.querySelectorAll(".sim-slot-card").forEach((details) => {
    details.addEventListener("toggle", () => {
      const idx = Number(details.dataset.slotIndex);
      if (!Number.isNaN(idx)) {
        if (details.open) {
          slotsAbertosSimulador.add(idx);
        } else {
          slotsAbertosSimulador.delete(idx);
        }
      }
    });
  });

  const btnExpandirTodos = containerSimulador.querySelector("#btn-sim-expandir-todos");
  if (btnExpandirTodos) {
    btnExpandirTodos.addEventListener("click", () => {
      simulacao.estadoSimulador.itens.forEach((_, i) => slotsAbertosSimulador.add(i));
      renderizarSimulador();
    });
  }

  const btnRecolherTodos = containerSimulador.querySelector("#btn-sim-recolher-todos");
  if (btnRecolherTodos) {
    btnRecolherTodos.addEventListener("click", () => {
      slotsAbertosSimulador.clear();
      renderizarSimulador();
    });
  }

  const selClasse = containerSimulador.querySelector("#sim-classe");
  const inpNivel = containerSimulador.querySelector("#sim-nivel");
  const btnIrBoss = containerSimulador.querySelector("#btn-sim-ir-boss");

  if (btnIrBoss) {
    btnIrBoss.addEventListener("click", () => {
      if (selectMonstroOrigem) selectMonstroOrigem.value = "sim";
      renderizarSimuladorMonstros();
      alternarVisibilidadeAba("monstros");
    });
  }

  if (selClasse) {
    selClasse.addEventListener("change", (e) => {
      simulacao.simuladorEditadoManual = true;
      simulacao.estadoSimulador.cls = e.target.value;
      renderizarSimulador();
      if (abaAtualAtiva === "monstros") renderizarSimuladorMonstros();
    });
  }
  if (inpNivel) {
    inpNivel.addEventListener("change", (e) => {
      simulacao.simuladorEditadoManual = true;
      simulacao.estadoSimulador.level = Math.max(1, Math.min(2000, Number(e.target.value) || 1));
      renderizarSimulador();
    });
  }

  containerSimulador.querySelectorAll("[data-sim-attr]").forEach((inp) => {
    inp.addEventListener("change", (e) => {
      simulacao.simuladorEditadoManual = true;
      const chave = e.target.dataset.simAttr;
      simulacao.estadoSimulador.atributos[chave] = Math.max(0, Math.min(5000, Number(e.target.value) || 0));
      renderizarSimulador();
    });
  });

  containerSimulador.querySelectorAll("[data-attr-btn]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      simulacao.simuladorEditadoManual = true;
      const alvo = e.currentTarget;
      const chave = alvo.dataset.attrBtn;
      const delta = Number(alvo.dataset.delta || 0);
      simulacao.estadoSimulador.atributos[chave] = Math.max(0, Math.min(5000, simulacao.estadoSimulador.atributos[chave] + delta));
      renderizarSimulador();
    });
  });

  containerSimulador.querySelectorAll("[data-sim-set-rapido]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      simulacao.simuladorEditadoManual = true;
      equiparConjuntoCompletoSimulador(e.currentTarget.dataset.simSetRapido);
      renderizarSimulador();
    });
  });

  containerSimulador.querySelectorAll("[data-sim-item-campo]").forEach((el) => {
    el.addEventListener("change", (e) => {
      simulacao.simuladorEditadoManual = true;
      const [idxStr, campo] = e.target.dataset.simItemCampo.split(":");
      const item = simulacao.estadoSimulador.itens[Number(idxStr)];
      if (!item) return;
      if (campo === "look" || campo === "kind" || campo === "set") {
        limparVisualImportado(item);
        if (campo !== "look") item.look = 0;
      }
      if (campo === "rarity" || campo === "itemLevel" || campo === "look") {
        item[campo] = Number(e.target.value) || 0;
        if (campo === "rarity") adequarTierGemas(item);
        if (campo === "look") {
          aplicarTrocaAnelSimulador(item, item.look);
        }
        if (simulacao.autoCalcularStatsItemSimulador && (campo === "rarity" || campo === "itemLevel")) {
          restaurarOuCalcularAtributosPeca(item, campo === "itemLevel");
        }
      } else {
        item[campo] = e.target.value;
        if (campo === "kind") {
          item.name = catalogoArmas[item.kind]?.nome || "Arma";
          if (catalogoConjuntos[item.set]?.armaKind !== item.kind) item.set = "";
          if (simulacao.autoCalcularStatsItemSimulador) {
            if (catalogoEscalasPecas[item.kind]?.raridadeBase && !item.set) {
              item.rarity = catalogoEscalasPecas[item.kind].raridadeBase;
            }
            restaurarOuCalcularAtributosPeca(item, false);
          }
        } else if (campo === "set") {
          if (item.set && catalogoConjuntos[item.set]) {
            equiparPecaConjuntoSimulador(item, item.set);
          } else if (simulacao.autoCalcularStatsItemSimulador) {
            restaurarOuCalcularAtributosPeca(item, false);
          }
        }
      }
      renderizarSimulador();
    });
  });

  containerSimulador.querySelectorAll("[data-sim-item-stat]").forEach((el) => {
    el.addEventListener("change", (e) => {
      simulacao.simuladorEditadoManual = true;
      const [idxStr, stat] = e.target.dataset.simItemStat.split(":");
      const item = simulacao.estadoSimulador.itens[Number(idxStr)];
      if (!item) return;
      item[stat] = Math.max(0, Number(e.target.value) || 0);
      renderizarSimulador();
    });
  });

  // Clique linha a linha nos botões de gemas (seleciona com fundo amarelado ou desseleciona ao clicar de novo)
  containerSimulador.querySelectorAll("[data-sim-gem-btn]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      simulacao.simuladorEditadoManual = true;
      const [idxSlotStr, idxGemaStr, tipoClicado] = e.currentTarget.dataset.simGemBtn.split(":");
      const idxSlot = Number(idxSlotStr);
      const idxGema = Number(idxGemaStr);
      const item = simulacao.estadoSimulador.itens[idxSlot];
      if (!item || idxGema < 0 || idxGema >= Math.min(6, Number(item.sockets ?? 6))) return;
      if (!Array.isArray(item.gems) || item.gems.length < 6) {
        const antigas = Array.isArray(item.gems) ? item.gems : [];
        item.gems = Array.from({ length: 6 }, (_, i) => (antigas[i] ? { ...antigas[i] } : null));
      }
      const gemaAtual = item.gems[idxGema];
      const tier = obterTierEngaste(item, idxGema);

      if ((gemaAtual?.type || gemaAtual?.kind) === tipoClicado) {
        // Desseleciona se já estava selecionada (ao clicar novamente, o espaço fica vazio)
        item.gems[idxGema] = null;
      } else {
        // Engasta uma nova gema respeitando o modo de rolagem atual
        item.gems[idxGema] = criarGemaPreset(tipoClicado, item.slot, tier, item.itemLevel);
      }
      renderizarSimulador();
    });
  });

  // Botão "Re-rolar" todas as gemas engastadas na peça
  containerSimulador.querySelectorAll("[data-sim-gem-reroll]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      simulacao.simuladorEditadoManual = true;
      const idxSlot = Number(e.currentTarget.dataset.simGemReroll);
      const item = simulacao.estadoSimulador.itens[idxSlot];
      if (!item || !Array.isArray(item.gems)) return;
      recalcularGemasItem(item);
      renderizarSimulador();
    });
  });

  containerSimulador.querySelectorAll("[data-sim-slot-tier], [data-sim-engaste-tier]").forEach((controle) => {
    controle.addEventListener(controle.matches("select") ? "change" : "click", () => {
      const [slot, indice, tier = controle.value] = (controle.dataset.simSlotTier ?? controle.dataset.simEngasteTier).split(":");
      const item = simulacao.estadoSimulador.itens[Number(slot)];
      const engaste = Number(indice);
      if (!item || engaste < 0 || engaste >= (item.sockets ?? 6)) return;
      simulacao.simuladorEditadoManual = true;
      definirTierEngaste(item, engaste, tier);
      renderizarSimulador();
    });
  });

  // Botão "Repetir #1 nas 6"
  containerSimulador.querySelectorAll("[data-sim-gem-repetir]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      simulacao.simuladorEditadoManual = true;
      const idxSlot = Number(e.currentTarget.dataset.simGemRepetir);
      const item = simulacao.estadoSimulador.itens[idxSlot];
      if (!item) return;
      const tierSlot = Number(item.gemTierPadrao || 5);
      const primeira = item.gems?.find(Boolean) || criarGemaPreset("ruby", item.slot, tierSlot, item.itemLevel);
      item.gems = Array.from({ length: 6 }, () => criarGemaPreset(primeira.type, item.slot, primeira.tier || tierSlot, item.itemLevel));
      renderizarSimulador();
    });
  });

  // Botão "Limpar" todas as gemas da peça
  containerSimulador.querySelectorAll("[data-sim-gem-limpar]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      simulacao.simuladorEditadoManual = true;
      const idxSlot = Number(e.currentTarget.dataset.simGemLimpar);
      const item = simulacao.estadoSimulador.itens[idxSlot];
      if (!item) return;
      item.gems = Array(6).fill(null);
      renderizarSimulador();
    });
  });
}

export function configurarSimulador() {
  if (btnSimImportar) {
    btnSimImportar.addEventListener("click", () => {
      if (!perfilCarregadoP1) {
        statusConsulta.dataset.error = "true";
        statusConsulta.textContent = "Consulte um jogador primeiro para importar a build dele.";
        return;
      }
      if (simulacao.simuladorEditadoManual && typeof window !== "undefined" && typeof window.confirm === "function") {
        const confirmou = window.confirm("Você possui alterações manuais na simulação. Deseja sobrescrever com os equipamentos do jogador atual?");
        if (!confirmou) return;
      }
      importarPerfilParaSimulador(perfilCarregadoP1);
      simulacao.simuladorEditadoManual = false;
      renderizarSimulador();
    });
  }

  if (btnSimResetar) {
    btnSimResetar.addEventListener("click", () => {
      if (simulacao.simuladorEditadoManual && typeof window !== "undefined" && typeof window.confirm === "function") {
        const confirmou = window.confirm("Deseja realmente resetar todas as alterações manuais do simulador para a build padrão?");
        if (!confirmou) return;
      }
      simulacao.estadoSimulador = criarModeloSimuladorPadrao();
      simulacao.simuladorEditadoManual = false;
      renderizarSimulador();
    });
  }
}

export {
  btnSimImportar,
  vincularEventosSimulador,
};
