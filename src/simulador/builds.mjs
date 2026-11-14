import { Compartilhamento } from "../bibliotecas.mjs";
import { calcularFc, calcularMetricasCombate, calcularStatusSimulados } from "../combate.mjs";
import { nomesClasses, nomesSlots } from "../dados.mjs";
import { escaparHtml, formatadorInteiro } from "../formato.mjs";
import { perfilCarregadoP1, plataformaCarregadaP1 } from "../perfil.mjs";
import { criarGemaPreset, simulacao } from "./estado.mjs";
import { renderizarSimulador } from "./tela.mjs";

const painelGerenciadorBuilds = document.querySelector("#painel-gerenciador-builds");
const blocoCompararMelhorias = document.querySelector("#bloco-comparar-melhorias");

let criterioOrdenacaoMelhorias = "fc";

function renderizarPainelGerenciadorBuilds() {
  if (!painelGerenciadorBuilds || !Compartilhamento.listarBuildsSalvas) return;

  const buildsSalvas = Compartilhamento.listarBuildsSalvas();
  const estavaAberto = painelGerenciadorBuilds.querySelector(".detalhes-gerenciador-builds")?.open || false;

  painelGerenciadorBuilds.innerHTML = `
    <details class="detalhes-builds-salvas detalhes-gerenciador-builds" ${estavaAberto ? "open" : ""}>
      <summary class="sumario-expansivel">💾 Salvar, compartilhar ou importar build${buildsSalvas.length > 0 ? ` (${buildsSalvas.length} salvas)` : ""}</summary>
      <div class="builds-acoes-barra" style="margin-top:8px;">
        <div class="campo" style="flex:1; min-width:180px;">
          <input id="input-nome-nova-build" maxlength="50" placeholder="Nome da build (ex. DPS Máximo ou Raide)" style="min-height:38px;">
        </div>
        <button type="button" id="btn-salvar-build-local" class="btn-secundario btn-compacto">💾 Salvar Build</button>
        <button type="button" id="btn-copiar-link-build" class="btn-secundario btn-compacto">🔗 Copiar Link da Simulação</button>
        <button type="button" id="btn-exportar-json-build" class="btn-secundario btn-compacto">📥 Exportar JSON</button>
        <label class="btn-secundario btn-compacto" style="cursor:pointer; display:inline-flex; align-items:center;">
          📤 Importar JSON
          <input type="file" id="input-importar-json-build" accept=".json" style="display:none;">
        </label>
      </div>
      ${
        buildsSalvas.length > 0
          ? `
        <div class="grade-builds-salvas" style="margin-top:8px;">
          ${buildsSalvas
            .map(
              (b) => `
            <div class="card-build-salva" data-build-id="${b.id}">
              <div>
                <strong>${escaparHtml(b.nome)}</strong>
                <div class="small muted">${nomesClasses[b.dados?.classe] || b.dados?.classe || "Build"} · Nv.${b.dados?.nivel || 1}</div>
              </div>
              <div class="acoes-inline">
                <button type="button" class="btn-mini btn-carregar-build" data-build-id="${b.id}" title="Carregar esta build no simulador">Carregar</button>
                <button type="button" class="btn-mini btn-duplicar-build" data-build-id="${b.id}" title="Duplicar build">Duplicar</button>
                <button type="button" class="btn-mini btn-excluir-build" data-build-id="${b.id}" title="Excluir build" style="color:#ff6b5a;">✕</button>
              </div>
            </div>
          `
            )
            .join("")}
        </div>
      `
          : ""
      }
    </details>
  `;

  const btnSalvar = document.querySelector("#btn-salvar-build-local");
  const inputNome = document.querySelector("#input-nome-nova-build");
  if (btnSalvar && inputNome) {
    btnSalvar.addEventListener("click", () => {
      const nome = inputNome.value.trim() || `Build ${nomesClasses[simulacao.estadoSimulador.cls]} Nv.${simulacao.estadoSimulador.level}`;
      const perfilOrig = perfilCarregadoP1 ? { nick: perfilCarregadoP1.login, plataforma: plataformaCarregadaP1 } : null;
      if (!Compartilhamento.salvarBuildLocal(nome, simulacao.estadoSimulador, perfilOrig)) {
        alert("Não foi possível salvar a build neste navegador.");
        return;
      }
      inputNome.value = "";
      renderizarPainelGerenciadorBuilds();
    });
  }

  const btnCopiarLink = document.querySelector("#btn-copiar-link-build");
  if (btnCopiarLink) {
    btnCopiarLink.addEventListener("click", async () => {
      try {
        const hash = await Compartilhamento.serializarBuildParaHash(simulacao.estadoSimulador, null, "Build Compartilhada");
        const urlCompleta = `${window.location.origin}${window.location.pathname}?aba=simulador#${hash}`;
        const res = await Compartilhamento.copiarTextoComFallback(urlCompleta);
        if (res.sucesso) {
          btnCopiarLink.textContent = "✓ Link copiado!";
        } else {
          prompt("Copie o link abaixo para compartilhar esta simulação:", res.texto);
        }
      } catch (err) {
        alert("Não foi possível gerar o link: " + err.message);
      }
      setTimeout(() => {
        if (btnCopiarLink) btnCopiarLink.textContent = "🔗 Copiar Link da Simulação";
      }, 2500);
    });
  }

  const btnExportar = document.querySelector("#btn-exportar-json-build");
  if (btnExportar) {
    btnExportar.addEventListener("click", () => {
      Compartilhamento.exportarBuildParaArquivo(simulacao.estadoSimulador, `build-${simulacao.estadoSimulador.cls}.json`);
    });
  }

  const inputImportar = document.querySelector("#input-importar-json-build");
  if (inputImportar) {
    inputImportar.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 65536) { alert("O arquivo excede 64 KiB."); return; }
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const dados = JSON.parse(evt.target?.result);
          if (dados && dados.itens) {
            simulacao.estadoSimulador = Compartilhamento.clonarBuildSeguro(dados);
            simulacao.simuladorEditadoManual = true;
            renderizarSimulador();
          } else {
            alert("Formato de build JSON inválido.");
          }
        } catch {
          alert("Arquivo JSON corrompido.");
        }
      };
      reader.readAsText(file);
    });
  }

  painelGerenciadorBuilds.querySelectorAll(".btn-carregar-build").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.buildId;
      const builds = Compartilhamento.listarBuildsSalvas();
      const b = builds.find((it) => it.id === id);
      if (b && b.dados) {
        if (simulacao.simuladorEditadoManual && !confirm("Deseja substituir a simulação atual pela build selecionada?")) return;
        try { simulacao.estadoSimulador = Compartilhamento.clonarBuildSeguro(b.dados); }
        catch (error) { alert(error.message); return; }
        simulacao.simuladorEditadoManual = true;
        renderizarSimulador();
      }
    });
  });

  painelGerenciadorBuilds.querySelectorAll(".btn-duplicar-build").forEach((btn) => {
    btn.addEventListener("click", () => {
      Compartilhamento.duplicarBuild(btn.dataset.buildId);
      renderizarPainelGerenciadorBuilds();
    });
  });

  painelGerenciadorBuilds.querySelectorAll(".btn-excluir-build").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.buildId;
      Compartilhamento.excluirBuild(id);
      renderizarPainelGerenciadorBuilds();
    });
  });
}

function renderizarCompararMelhorias() {
  if (!blocoCompararMelhorias) return;

  const stSim = calcularStatusSimulados(simulacao.estadoSimulador.cls, simulacao.estadoSimulador.level, simulacao.estadoSimulador.atributos, simulacao.estadoSimulador.itens);
  const fcSim = calcularFc(simulacao.estadoSimulador.cls, stSim);
  const metSim = calcularMetricasCombate(simulacao.estadoSimulador.cls, simulacao.estadoSimulador.level, stSim, simulacao.estadoSimulador.itens);

  const mapaNomesAttrs = [
    { chave: "str", nome: "Força (FOR)" },
    { chave: "vit", nome: "Vitalidade (VIT)" },
    { chave: "def", nome: "Defesa (DEF)" },
    { chave: "agi", nome: "Agilidade (AGI)" },
    { chave: "luk", nome: "Sorte (SOR)" },
  ];

  const cenarios = [];

  for (const attr of mapaNomesAttrs) {
    for (const incremento of [1, 10]) {
      const novosAttrs = { ...simulacao.estadoSimulador.atributos, [attr.chave]: (simulacao.estadoSimulador.atributos[attr.chave] || 0) + incremento };
      const stTeste = calcularStatusSimulados(simulacao.estadoSimulador.cls, simulacao.estadoSimulador.level, novosAttrs, simulacao.estadoSimulador.itens);
      const fcTeste = calcularFc(simulacao.estadoSimulador.cls, stTeste);
      const metTeste = calcularMetricasCombate(simulacao.estadoSimulador.cls, simulacao.estadoSimulador.level, stTeste, simulacao.estadoSimulador.itens);

      cenarios.push({
        id: `attr_${attr.chave}_${incremento}`,
        tipo: "atributo",
        descricao: `+${incremento} em ${attr.nome}`,
        deltaFc: fcTeste - fcSim,
        deltaDps: (metTeste?.dpsCombateMedio ?? metTeste?.dpsTotal ?? 0) - (metSim?.dpsCombateMedio ?? metSim?.dpsTotal ?? 0),
        deltaHp: (stTeste?.maxHp ?? stTeste?.hp ?? 0) - (stSim?.maxHp ?? stSim?.hp ?? 0),
        deltaCura: (metTeste?.curaSkillLuzDivina ?? metTeste?.curaPorSkill ?? 0) - (metSim?.curaSkillLuzDivina ?? metSim?.curaPorSkill ?? 0),
        aplicar: () => {
          simulacao.estadoSimulador.atributos[attr.chave] = (simulacao.estadoSimulador.atributos[attr.chave] || 0) + incremento;
        }
      });
    }
  }

  simulacao.estadoSimulador.itens.forEach((item, idxSlot) => {
    const slotsMax = Math.max(0, Math.min(6, Number(item.sockets ?? 6)));
    const gemasAtuais = Array.isArray(item.gems) ? item.gems : [];
    const primeiroVazio = gemasAtuais.findIndex((g, i) => i < slotsMax && (!g || !g.type));
    if (primeiroVazio !== -1) {
      const itensClone = JSON.parse(JSON.stringify(simulacao.estadoSimulador.itens));
      const gemaT5Atk = criarGemaPreset("ruby", item.slot, 5, item.itemLevel || 300, 1.0);
      itensClone[idxSlot].gems[primeiroVazio] = gemaT5Atk;

      const stTeste = calcularStatusSimulados(simulacao.estadoSimulador.cls, simulacao.estadoSimulador.level, simulacao.estadoSimulador.atributos, itensClone);
      const fcTeste = calcularFc(simulacao.estadoSimulador.cls, stTeste);
      const metTeste = calcularMetricasCombate(simulacao.estadoSimulador.cls, simulacao.estadoSimulador.level, stTeste, itensClone);

      cenarios.push({
        id: `gema_${idxSlot}_${primeiroVazio}`,
        tipo: "gema",
        descricao: `Engastar Gema Rubi T5 em ${nomesSlots[item.slot] || item.slot}`,
        deltaFc: fcTeste - fcSim,
        deltaDps: (metTeste?.dpsCombateMedio ?? metTeste?.dpsTotal ?? 0) - (metSim?.dpsCombateMedio ?? metSim?.dpsTotal ?? 0),
        deltaHp: (stTeste?.maxHp ?? stTeste?.hp ?? 0) - (stSim?.maxHp ?? stSim?.hp ?? 0),
        deltaCura: (metTeste?.curaSkillLuzDivina ?? metTeste?.curaPorSkill ?? 0) - (metSim?.curaSkillLuzDivina ?? metSim?.curaPorSkill ?? 0),
        aplicar: () => {
          if (!simulacao.estadoSimulador.itens[idxSlot].gems) simulacao.estadoSimulador.itens[idxSlot].gems = [];
          simulacao.estadoSimulador.itens[idxSlot].gems[primeiroVazio] = gemaT5Atk;
        }
      });
    }
  });

  const crit = criterioOrdenacaoMelhorias;

  cenarios.sort((a, b) => {
    if (crit === "dps") return b.deltaDps - a.deltaDps;
    if (crit === "hp") return b.deltaHp - a.deltaHp;
    if (crit === "cura") return b.deltaCura - a.deltaCura;
    return b.deltaFc - a.deltaFc;
  });

  const temDesfazer = simulacao.historicoDesfazerSimulador.length > 0;

  const linhasHtml = cenarios.slice(0, 8).map((c) => {
    const fcSinal = c.deltaFc >= 0 ? "+" : "";
    const fcCls = c.deltaFc >= 0 ? "ganho-positivo" : "ganho-negativo";
    const dpsSinal = c.deltaDps >= 0 ? "+" : "";
    const dpsCls = c.deltaDps >= 0 ? "ganho-positivo" : "ganho-negativo";
    const hpSinal = c.deltaHp >= 0 ? "+" : "";
    const curaSinal = c.deltaCura >= 0 ? "+" : "";

    return `
      <tr>
        <th scope="row" style="text-align:left;">${escaparHtml(c.descricao)}</th>
        <td class="${fcCls}">${fcSinal}${formatadorInteiro.format(Math.round(c.deltaFc))} FC</td>
        <td class="${dpsCls}">${dpsSinal}${formatadorInteiro.format(Math.round(c.deltaDps))}/s</td>
        <td>${hpSinal}${formatadorInteiro.format(Math.round(c.deltaHp))} HP</td>
        <td>${simulacao.estadoSimulador.cls === "cleric" ? `${curaSinal}${formatadorInteiro.format(Math.round(c.deltaCura))}` : "—"}</td>
        <td>
          <button type="button" class="btn-secundario btn-compacto btn-aplicar-melhoria" data-melhoria-id="${c.id}">Aplicar ↗</button>
        </td>
      </tr>
    `;
  }).join("");

  blocoCompararMelhorias.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:8px;">
      <div>
        <h3 class="titulo-secao-comp" style="margin:0;">Comparar Melhorias Hipotéticas (+1 alteração por vez)</h3>
        <p class="note-compacto" style="margin:2px 0 0;">Avalia o impacto marginal isolado de cada hipótese sob as mesmas premissas de cálculo.</p>
      </div>
      <div class="acoes-inline">
        <label style="font-size:0.78rem; color:var(--muted); display:inline-flex; align-items:center; gap:4px;">
          Ordenar por:
          <select id="select-ordem-melhorias" style="min-height:32px; padding:2px 8px; font-size:0.78rem;">
            <option value="fc" ${crit === "fc" ? "selected" : ""}>Maior Ganho de FC</option>
            <option value="dps" ${crit === "dps" ? "selected" : ""}>Maior Ganho de DPS</option>
            <option value="hp" ${crit === "hp" ? "selected" : ""}>Maior Sobrevivência (HP)</option>
            <option value="cura" ${crit === "cura" ? "selected" : ""}>Maior Cura (Clérigo)</option>
          </select>
        </label>
        <button type="button" id="btn-desfazer-melhoria" class="btn-secundario btn-compacto" ${!temDesfazer ? "disabled" : ""}>↩ Desfazer</button>
      </div>
    </div>

    <div class="tabela-melhorias-wrap">
      <table class="tabela-melhorias">
        <thead>
          <tr>
            <th scope="col" style="text-align:left;">Hipótese Avaliada</th>
            <th scope="col">ΔFC Estimado</th>
            <th scope="col">ΔDPS (0 DEF)</th>
            <th scope="col">ΔVida Máxima</th>
            <th scope="col">ΔCura</th>
            <th scope="col">Ação</th>
          </tr>
        </thead>
        <tbody>${linhasHtml}</tbody>
      </table>
    </div>
  `;

  blocoCompararMelhorias.querySelectorAll(".btn-aplicar-melhoria").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.melhoriaId;
      const alvo = cenarios.find((c) => c.id === id);
      if (alvo) {
        simulacao.historicoDesfazerSimulador.push(JSON.parse(JSON.stringify(simulacao.estadoSimulador)));
        alvo.aplicar();
        simulacao.simuladorEditadoManual = true;
        renderizarSimulador();
      }
    });
  });

  const selOrdem = document.querySelector("#select-ordem-melhorias");
  if (selOrdem) {
    selOrdem.addEventListener("change", (e) => {
      criterioOrdenacaoMelhorias = e.target.value;
      renderizarCompararMelhorias();
    });
  }

  const btnDesfazer = document.querySelector("#btn-desfazer-melhoria");
  if (btnDesfazer && temDesfazer) {
    btnDesfazer.addEventListener("click", () => {
      const anterior = simulacao.historicoDesfazerSimulador.pop();
      if (anterior) {
        simulacao.estadoSimulador = anterior;
        renderizarSimulador();
      }
    });
  }
}

export {
  renderizarCompararMelhorias,
  renderizarPainelGerenciadorBuilds,
};
