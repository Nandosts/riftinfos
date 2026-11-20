import {
  catalogoAneis,
  catalogoArmas,
  catalogoConjuntos,
  catalogoEscalasPecas,
  catalogoGemas,
  coresRaridade,
  nomesClasses,
  nomesRaridade,
  nomesSlots,
} from "../dados.mjs";
import {
  escaparHtml,
  formatadorDecimal1,
  formatadorInteiro,
  formatarNumeroCompacto,
} from "../formato.mjs";
import {
  formatarBonusConjuntoCurto,
  obterNomeOficialPecaConjunto,
  obterOrigemBuildSimulador,
  obterResumoPassivasBuildSimulador,
  simulacao,
} from "./estado.mjs";
import { containerSimulador } from "./tela.mjs";
import { construirEditorEngastes } from "./engastes.mjs";

function construirOpcoesAvancadasSimuladorHtml(conjuntosDaClasse = [], setAtivo3Pecas = "") {
  const modRollTexto = {
    max: "Cenário de teto (115%)",
    media: "Média Neutra (100%)",
    sorteio: "Sorteio simulado (85%–115%)",
  }[simulacao.modoRolagemGemaSimulador] || "";

  const pillsSetsHtml = conjuntosDaClasse.length > 0
    ? `
      <div class="sim-barra-grupo" style="width:100%;">
        <span class="sim-barra-rotulo">Equipar Conjunto 3/3 (${nomesClasses[simulacao.estadoSimulador.cls]}):</span>
        <div class="rs-top-sets-bar">
          ${conjuntosDaClasse.map(([k, v]) => {
            const corRar = coresRaridade[v.raridadePadrao ?? 4] || "#c9c5d8";
            return `
              <button type="button" class="btn-mini ${setAtivo3Pecas === k ? "ativo" : ""}" style="border-left:3px solid ${corRar};" data-sim-set-rapido="${k}">
                ${escaparHtml(v.nome)}
              </button>
            `;
          }).join("")}
        </div>
      </div>
    `
    : "";

  return `
    <details class="rs-opcoes-avancadas" id="sim-details-avancadas" ${simulacao.opcoesAvancadasAbertasSimulador ? "open" : ""}>
      <summary class="sumario-expansivel">⚙️ Opções avançadas (rolagem de pedras, presets e conjuntos rápidos)</summary>
      <div class="rs-opcoes-avancadas-body">
        <div class="sim-barra-grupo">
          <span class="sim-barra-rotulo">Rolagem das Pedras (${modRollTexto}):</span>
          <div class="sim-seg-controle" role="group" aria-label="Modo de rolagem das gemas">
            <button type="button" class="btn-seg ${simulacao.modoRolagemGemaSimulador === "max" ? "ativo" : ""}" data-sim-modo-roll="max" title="Todas as novas pedras vêm com rolagem máxima de 115%">
              🔥 Teto 115%
            </button>
            <button type="button" class="btn-seg ${simulacao.modoRolagemGemaSimulador === "media" ? "ativo" : ""}" data-sim-modo-roll="media" title="Todas as novas pedras vêm na média exata de 100%">
              ⚖️ Média 100%
            </button>
            <button type="button" class="btn-seg ${simulacao.modoRolagemGemaSimulador === "sorteio" ? "ativo" : ""}" data-sim-modo-roll="sorteio" title="Simula uma rolagem entre 85% e 115%">
              🎲 Sorteio
            </button>
          </div>
          <button type="button" class="btn-mini" data-sim-aplicar-roll-todas="1" title="Recalcula todas as pedras já engastadas nas 4 peças usando o modo acima">
            🔄 Aplicar às gemas engastadas
          </button>
        </div>

        <div class="sim-barra-grupo sim-barra-presets">
          <label class="sim-check-auto" title="Quando ativo, trocar a peça, raridade ou itemLevel calcula os atributos base estimados automaticamente">
            <input type="checkbox" data-sim-toggle-autostats="1" ${simulacao.autoCalcularStatsItemSimulador ? "checked" : ""}>
            <span>Estimar atributos por nível</span>
          </label>
          <button type="button" class="btn-mini" data-sim-preset-criativo="max330" title="Coloca as 4 peças em Arcano Nível 330 e recalcula os atributos base e gemas">
            ⚡ Tudo Arcano Nv.330
          </button>
          <button type="button" class="btn-mini" data-sim-preset-criativo="gemas_safira" title="Preenche os engastes disponíveis com Safiras">
            💎 Preencher com Safiras
          </button>
          <button type="button" class="btn-mini" data-sim-preset-criativo="gemas_rubi" title="Preenche os engastes disponíveis com Rubis">
            ❤️ Preencher com Rubis
          </button>
        </div>

        ${pillsSetsHtml}
      </div>
    </details>
  `;
}

function construirBarraModoCriativoHtml(conjuntosDaClasse = [], setAtivo3Pecas = "") {
  return `
    <div class="sim-barra-modo">
      <div class="sim-barra-grupo">
        <span class="sim-barra-rotulo">Visualização:</span>
        <div class="sim-seg-controle" role="group" aria-label="Modo de visualização do simulador">
          <button type="button" class="btn-seg ${simulacao.modoVisualizacaoSimulador === "ficha" ? "ativo" : ""}" data-sim-modo-vis="ficha">
            🎮 Ficha visual
          </button>
          <button type="button" class="btn-seg ${simulacao.modoVisualizacaoSimulador === "lista" ? "ativo" : ""}" data-sim-modo-vis="lista">
            📋 Grade completa
          </button>
        </div>
      </div>
      ${construirOpcoesAvancadasSimuladorHtml(conjuntosDaClasse, setAtivo3Pecas)}
    </div>
  `;
}

function descreverProjecaoAnel(metricas) {
  const { presaIxtharra, escudoTeiaEscarlate } = metricas;
  if (presaIxtharra) {
    return `Presa de Ixtharra: ${formatarNumeroCompacto(presaIxtharra.dpsDiretoContraAlvoAfetado)}/s de dano direto antes da DEF contra alvo já sangrando ou envenenado. Veneno ativo: ${formatarNumeroCompacto(presaIxtharra.danoVenenoPorSegundo)}/s, sem somar ao sangramento.`;
  }
  if (escudoTeiaEscarlate) {
    return `Teia Escarlate: escudo pessoal de ${formatadorInteiro.format(escudoTeiaEscarlate)} de vida por ativação. A primeira vem aos 3s de combate, com novas ativações a cada 8s.`;
  }
  return "";
}

function construirPainelResumoSimuladorHtml(stSim, fcSim, metSim, fcOrig, metOrig) {
  const deltaFc = fcOrig !== null ? fcSim - fcOrig : 0;
  const classeBanner = deltaFc > 0 ? "up" : deltaFc < 0 ? "down" : "eq";
  const textoDelta = fcOrig !== null
    ? `${deltaFc >= 0 ? "+" : ""}${formatadorInteiro.format(deltaFc)} FC (${((deltaFc / Math.max(1, fcOrig)) * 100).toFixed(1)}%)`
    : "Sem referência de FC para esta classe";

  const passivas = obterResumoPassivasBuildSimulador();

  const setsHtml = passivas.setsDetectados.length > 0
    ? passivas.setsDetectados.map(({ qtd, info }) => {
        const b2Ativo = qtd >= 2;
        const b3Ativo = qtd >= 3;
        return `
          <div class="sim-bonus-item">
            <div class="sim-bonus-titulo">
              <span>${b3Ativo ? "🟢" : b2Ativo ? "🟡" : "⚪"} ${escaparHtml(info.nome)}</span>
              <strong>${qtd}/3 peças</strong>
            </div>
            <div class="sim-bonus-detalhe ${b2Ativo ? "ativo" : "inativo"}">2p: ${escaparHtml(formatarBonusConjuntoCurto(info.b2))}</div>
            <div class="sim-bonus-detalhe ${b3Ativo ? "ativo" : "inativo"}">3p: ${escaparHtml(formatarBonusConjuntoCurto(info.b3))}</div>
          </div>
        `;
      }).join("")
    : `<div class="small muted">Nenhum item de conjunto equipado.</div>`;

  const ehClerigo = simulacao.estadoSimulador.cls === "cleric";
  const temCuraEmGrupo = ehClerigo && passivas.armaInfo?.skillTipo !== "dano";
  const textoArmaPassiva = passivas.armaInfo?.efeito?.texto || passivas.armaInfo?.notaSkill || "Ataque básico e habilidade padrão da classe.";
  const projecaoAnel = descreverProjecaoAnel(metSim);
  const textoAnelPassiva = passivas.anelInfo?.efeito || "Sem efeito especial de anel.";
  const resumoGemasHtml = passivas.totalGemas > 0
    ? Object.entries(passivas.contagemGemas)
        .map(([tipo, qtd]) => {
          const g = catalogoGemas[tipo];
          return `<span class="sim-chip-gema-resumo"><i style="background:${g?.cor || "#ccc"};"></i>${qtd}× ${escaparHtml(g?.nome || tipo)}</span>`;
        })
        .join("")
    : `<span class="small muted">Nenhuma pedra engastada (0/24).</span>`;

  return `
    <div class="sim-bloco sim-painel-resultado">
      <h4>Resumo do Personagem</h4>
      <div class="sim-fc-comparativo">
        <div>
          <span class="small muted">${fcOrig !== null ? "ORIGINAL" : "REFERÊNCIA"}</span>
          <strong>${fcOrig !== null ? formatadorInteiro.format(fcOrig) : "—"}</strong>
        </div>
        <span aria-hidden="true">→</span>
        <div>
          <span class="small muted">SIMULADO</span>
          <strong>${formatadorInteiro.format(fcSim)}</strong>
        </div>
      </div>
      <div class="sim-delta-banner ${classeBanner}">${textoDelta}</div>

      <div class="card-info">
        <h4>Status Finais &amp; Combate</h4>
        <div class="card-info-linha"><span>ATK / DEF</span><strong>${formatadorDecimal1.format(stSim.atk)} / ${formatadorDecimal1.format(stSim.def)}</strong></div>
        <div class="card-info-linha"><span>Vida Máxima / EHP</span><strong>${formatarNumeroCompacto(stSim.maxHp)} / ${formatarNumeroCompacto(metSim.ehp)}</strong></div>
        <div class="card-info-linha"><span>ASPD (Cadência Real)</span><strong>${stSim.aspd.toFixed(2)} (${metSim.cadenciaReal.toFixed(2)}/s)</strong></div>
        <div class="card-info-linha"><span>Crítico / Dano Crít.</span><strong>${stSim.crit.toFixed(1)}% / ${(metSim.multCrit * 100).toFixed(0)}%</strong></div>
        <div class="card-info-linha"><span>Golpe Normal → Crítico</span><strong>${formatarNumeroCompacto(metSim.golpeNormalBruto)} → ${formatarNumeroCompacto(metSim.golpeCritBruto)}</strong></div>
        <div class="card-info-linha"><span>DPS Real em Combate</span><strong style="color:var(--gold);">${formatarNumeroCompacto(metSim.dpsCombateMedio)}/s ${metOrig ? `(${metSim.dpsCombateMedio >= metOrig.dpsCombateMedio ? "+" : ""}${formatarNumeroCompacto(metSim.dpsCombateMedio - metOrig.dpsCombateMedio)})` : ""}</strong></div>
        ${temCuraEmGrupo ? `<div class="card-info-linha"><span>Cura em grupo</span><strong style="color:var(--green);">${formatarNumeroCompacto(metSim.curaSkillLuzDivina)}</strong></div>` : ""}
        ${ehClerigo ? `<div class="card-info-linha"><span>Poder de cura base</span><strong>${formatarNumeroCompacto(metSim.healPower)}</strong></div>` : ""}
        <div class="card-info-linha"><span>Mitigação de Defesa</span><strong>${(metSim.reducaoDefesa * 100).toFixed(1)}%</strong></div>
      </div>

      <div class="sim-resumo-bonus-ativos">
        <h4>Bônus &amp; Efeitos Ativos</h4>
        ${setsHtml}
        <div class="sim-passiva-linha">
          <strong>🗡️ Arma:</strong> <span>${escaparHtml(passivas.armaInfo?.nome || simulacao.estadoSimulador.itens[0]?.name || "Padrão")}</span>
          <small>${escaparHtml(textoArmaPassiva)}</small>
        </div>
        <div class="sim-passiva-linha">
          <strong>💍 Anel:</strong> <span>${escaparHtml(passivas.anelInfo?.nome || "Anel Comum")}</span>
          <small>${escaparHtml(textoAnelPassiva)}</small>
          ${projecaoAnel ? `<small>${escaparHtml(projecaoAnel)}</small>` : ""}
        </div>
        <div class="sim-passiva-linha">
          <strong>💎 Pedras (${passivas.totalGemas}/24):</strong>
          <div class="sim-chips-gemas-resumo">${resumoGemasHtml}</div>
        </div>
      </div>

      <button type="button" class="btn-fantasma" id="btn-sim-ir-boss" style="width:100%;">🐉 Testar Build Simulada contra Boss</button>
    </div>
  `;
}

function construirModoFichaVisualHtml(
  linhasAttrsHtml,
  melhorAttr,
  melhorGanho,
  conjuntosDaClasse,
  setAtivo3Pecas,
  resumoPainelDireitoHtml,
  stSim,
  fcSim,
  metSim,
  fcOrig,
  metOrig
) {
  const idxAtivo = Math.min(3, Math.max(0, Number(simulacao.slotSelecionadoSimulador) || 0));
  const itemAtivo = simulacao.estadoSimulador.itens[idxAtivo] || simulacao.estadoSimulador.itens[0];
  const maxGemasAtivo = itemAtivo.sockets;
  const qtdGemasAtivas = itemAtivo.gems.filter(Boolean).length;
  const ehArma = itemAtivo.slot === "weapon";
  const ehAnel = itemAtivo.slot === "ring";

  const coresOficiaisClasse = {
    warrior: "#ff7456",
    cleric: "#ffe27a",
    archer: "#5fe6a0",
  };
  const corClasseHeroi = coresOficiaisClasse[simulacao.estadoSimulador.cls] || "#ffe27a";
  const nomeClasseHeroi = (nomesClasses[simulacao.estadoSimulador.cls] || "Clérigo").toUpperCase();

  // Abas de classe estilo /character
  const abasClasseOficialHtml = Object.entries(nomesClasses).map(([k, n]) => {
    const ativa = simulacao.estadoSimulador.cls === k;
    return `
      <button
        type="button"
        class="rs-tab-cls ${ativa ? "active" : ""}"
        style="${ativa ? "" : `color:${coresOficiaisClasse[k] || "#eae6ff"};`}"
        data-sim-classe-btn="${k}"
      >
        ${n.toUpperCase()}
      </button>
    `;
  }).join("");

  // Conjuntos equipados (no painel esquerdo de /character)
  const projecaoAnel = descreverProjecaoAnel(metSim);
  const passivas = obterResumoPassivasBuildSimulador();
  const ehClerigo = simulacao.estadoSimulador.cls === "cleric";
  const temCuraEmGrupo = ehClerigo && passivas.armaInfo?.skillTipo !== "dano";
  const caixasSetsEquipadosHtml = passivas.setsDetectados.length > 0
    ? passivas.setsDetectados.map(({ chave, qtd, info }) => {
        const b2Texto = window.RiftSprites?.catalogoConjuntosOficial?.[chave]?.b2 || formatarBonusConjuntoCurto(info.b2);
        const b3Texto = window.RiftSprites?.catalogoConjuntosOficial?.[chave]?.b3 || formatarBonusConjuntoCurto(info.b3);
        return `
          <div class="rs-set-box">
            <div class="rs-set-head">
              <b>${escaparHtml(info.nome)}</b>
              <span class="muted">${qtd}/3</span>
            </div>
            <div class="small ${qtd >= 2 ? "on" : "muted"}">2 peças: ${escaparHtml(b2Texto)}</div>
            <div class="small ${qtd >= 3 ? "on" : "muted"}">3 peças: ${escaparHtml(b3Texto)}</div>
          </div>
        `;
      }).join("")
    : `
      <div class="rs-set-box">
        <div class="rs-set-head"><b>Sem conjunto</b> <span class="muted">0/3</span></div>
        <div class="small muted">Equipe peças de conjunto abaixo para ativar bônus 2/3 e 3/3.</div>
      </div>
    `;

  // Os 4 quadrados EQUIPADO (.slots4 > .ibox.rbg-X)
  const quadradosEquipadoHtml = simulacao.estadoSimulador.itens.map((item, idxSlot) => {
    const rarIdx = Math.max(0, Math.min(7, Number(item.rarity) || 0));
    const qtdGemas = item.gems.filter(Boolean).length;
    const selecionado = idxSlot === idxAtivo;
    return `
      <button
        type="button"
        class="rs-ibox rs-rbg-${rarIdx} ${selecionado ? "sel" : ""}"
        data-sim-selecionar-slot="${idxSlot}"
        data-sim-scroll-bancada="1"
        title="${escaparHtml(`${nomesSlots[item.slot]}: ${item.name || "Peça"} (${nomesRaridade[rarIdx]} · Nv.${item.itemLevel || 1}) — Clique para editar`)}"
      >
        <canvas class="rs-canvas-equipado" data-sim-canvas-equipado="${idxSlot}" width="48" height="48"></canvas>
        ${qtdGemas > 0 ? `<span class="rs-gem-mark">${qtdGemas}</span>` : ""}
        <span class="rs-lv">${item.itemLevel || 1}</span>
      </button>
    `;
  }).join("");

  // Linhas de GASTAR OURO: topo com Nome + Nível + Botões; descrição embaixo ocupando 100% da largura
  const descricoesAtributosOficiais = [
    { chave: "str", rotulo: "FORÇA", desc: "+1.5 de ataque e +1,5% do ataque total por nível" },
    { chave: "vit", rotulo: "VITALIDADE", desc: "+10 de vida e +1,5% da vida total por nível" },
    { chave: "def", rotulo: "DEFESA", desc: "+0.8 de defesa e +1,5% da defesa total por nível" },
    { chave: "agi", rotulo: "AGILIDADE", desc: "+2% de velocidade de ataque" },
    {
      chave: "luk",
      rotulo: "SORTE",
      desc: "+0,4% crítico e mais drops (drops até o nv 100). Acima de 60% de crítico, cada 1% vira +3% de dano crítico, sem limite",
    },
  ];

  const linhasGastarOuroHtml = descricoesAtributosOficiais.map(({ chave, rotulo, desc }) => {
    const ehMelhor = melhorAttr.chave === chave;
    return `
      <div class="rs-urow ${ehMelhor ? "melhor-fc" : ""}">
        <div class="rs-urow-top">
          <div class="rs-urow-title">
            <b>${rotulo}</b>
            ${ehMelhor ? `<span class="rs-badge-melhor-attr" title="Maior ganho de FC por ponto agora">★ +${formatadorInteiro.format(melhorGanho)} FC</span>` : ""}
          </div>
          <div class="rs-urow-controls">
            <label class="rs-lv-wrap" for="sim-attr-${chave}">
              <span>nv</span>
              <input id="sim-attr-${chave}" type="number" min="0" max="5000" value="${simulacao.estadoSimulador.atributos[chave]}" data-sim-attr="${chave}" class="rs-attr-input">
            </label>
            <div class="rs-urow-btns">
              <button type="button" class="rs-btn ghost sm" data-attr-btn="${chave}" data-delta="-10" title="-10 níveis">-10</button>
              <button type="button" class="rs-btn ghost sm" data-attr-btn="${chave}" data-delta="-1" title="-1 nível">-1</button>
              <button type="button" class="rs-btn gold sm" data-attr-btn="${chave}" data-delta="1" title="+1 nível">+1</button>
              <button type="button" class="rs-btn ghost sm" data-attr-btn="${chave}" data-delta="10" title="+10 níveis">+10</button>
              <button type="button" class="rs-btn ghost sm" data-attr-btn="${chave}" data-delta="100" title="+100 níveis">+100</button>
            </div>
          </div>
        </div>
        <div class="rs-urow-desc muted small">${desc}</div>
      </div>
    `;
  }).join("");

  // Seletor Compacto de Peças para o Slot Ativo (com busca textual + filtros; detalhes ficam apenas na peça selecionada à direita)
  const termoFiltro = (simulacao.termoBuscaSlotSimulador || "").trim().toLowerCase();
  let galeriaSlotHtml = "";

  if (ehAnel) {
    const anelComumAtivo = !Number(itemAtivo.look);
    const listaAneis = [
      { look: 0, nome: "Anel Comum", raridadeMin: 5, foco: "Base padrão", efeito: "Apenas atributos base, com engastes conforme a raridade." },
      ...Object.entries(catalogoAneis)
        .sort((a, b) => (b[1].raridadeMin || 6) - (a[1].raridadeMin || 6) || Number(b[0]) - Number(a[0]))
        .map(([k, v]) => ({ look: Number(k), nome: v.nome, raridadeMin: v.raridadeMin || 7, foco: v.foco || "", efeito: v.efeito })),
    ].filter((an) => {
      if (!termoFiltro) return true;
      const rarNome = nomesRaridade[an.raridadeMin || 6] || "";
      return `${an.nome} ${rarNome} ${an.foco} ${an.efeito}`.toLowerCase().includes(termoFiltro);
    });

    const cardsAneisHtml = listaAneis.length > 0
      ? listaAneis.map((an) => {
          const equipado = an.look === 0 ? anelComumAtivo : Number(itemAtivo.look) === an.look;
          const rarIdx = Math.max(0, Math.min(7, an.raridadeMin || 6));
          const corRar = coresRaridade[rarIdx] || "#eb34b1";
          return `
            <button
              type="button"
              class="rs-bag-item-compact ${equipado ? "sel" : ""}"
              data-sim-equipar-anel="${an.look}"
              title="${escaparHtml(an.efeito)}"
            >
              <div class="rs-ibox rs-rbg-${rarIdx} ${equipado ? "sel" : ""}">
                <canvas
                  class="rs-canvas-catalogo"
                  data-sim-canvas-catalogo="ring|${simulacao.estadoSimulador.cls}|${an.look}|${rarIdx}||0"
                  width="32"
                  height="32"
                ></canvas>
              </div>
              <div class="rs-bag-compact-info">
                <strong style="color:${corRar};">${escaparHtml(an.nome)}</strong>
                <span class="rs-bag-compact-sub">${nomesRaridade[rarIdx]}${an.foco ? ` · ${escaparHtml(an.foco)}` : ""}</span>
              </div>
              ${equipado ? `<span class="rs-bag-equip-tag">✓</span>` : ""}
            </button>
          `;
        }).join("")
      : `<div class="small muted" style="padding:12px;">Nenhum anel encontrado para "${escaparHtml(simulacao.termoBuscaSlotSimulador)}".</div>`;

    galeriaSlotHtml = `<div class="rs-bag-list compact sim-galeria-itens">${cardsAneisHtml}</div>`;
  } else {
    const setsFiltrados = Object.entries(catalogoConjuntos)
      .filter(([, v]) => simulacao.filtroConjuntoSlotSimulador === "todos" || v.classe === simulacao.estadoSimulador.cls)
      .sort((a, b) => (b[1].raridadePadrao || 4) - (a[1].raridadePadrao || 4))
      .filter(([k, v]) => {
        if (!termoFiltro) return true;
        const nomePeca = obterNomeOficialPecaConjunto(k, itemAtivo.slot);
        const rarNome = nomesRaridade[v.raridadePadrao ?? 4] || "";
        return `${nomePeca} ${v.nome} ${rarNome} ${nomesClasses[v.classe] || ""}`.toLowerCase().includes(termoFiltro);
      });

    const cardsSetsHtml = setsFiltrados.map(([k, v]) => {
      const nomePeca = obterNomeOficialPecaConjunto(k, itemAtivo.slot);
      const kindPeca =
        itemAtivo.slot === "weapon" ? v.armaKind : itemAtivo.slot === "helmet" ? v.elmoKind : v.armaduraKind;
      const equipado = itemAtivo.set === k;
      const rarIdx = Math.max(0, Math.min(7, v.raridadePadrao ?? 4));
      const corRar = coresRaridade[rarIdx] || "#ffb62e";

      return `
        <button
          type="button"
          class="rs-bag-item-compact ${equipado ? "sel" : ""}"
          data-sim-equipar-peca-set="${idxAtivo}:${k}"
          title="${escaparHtml(`${nomePeca} — Conjunto ${v.nome} (${nomesRaridade[rarIdx]})`)}"
        >
          <div class="rs-ibox rs-rbg-${rarIdx} ${equipado ? "sel" : ""}">
            <canvas
              class="rs-canvas-catalogo"
              data-sim-canvas-catalogo="${itemAtivo.slot}|${v.classe}|0|${rarIdx}|${kindPeca || ""}|0"
              width="32"
              height="32"
            ></canvas>
          </div>
          <div class="rs-bag-compact-info">
            <strong style="color:${corRar};">${escaparHtml(nomePeca)}</strong>
            <span class="rs-bag-compact-sub">${escaparHtml(v.nome)} · <span style="color:${corRar};">${nomesRaridade[rarIdx]}</span>${v.classe !== simulacao.estadoSimulador.cls ? ` · ${nomesClasses[v.classe]}` : ""}</span>
          </div>
          ${equipado ? `<span class="rs-bag-equip-tag">✓</span>` : ""}
        </button>
      `;
    });

    if (ehArma) {
      const kindsDeSet = new Set(Object.values(catalogoConjuntos).map((s) => s.armaKind));
      const avulsas = Object.entries(catalogoArmas)
        .filter(([k, v]) => !kindsDeSet.has(k) && (simulacao.filtroConjuntoSlotSimulador === "todos" || v.classe === simulacao.estadoSimulador.cls))
        .filter(([, v]) => {
          if (!termoFiltro) return true;
          return `${v.nome} avulsa ${nomesClasses[v.classe] || ""}`.toLowerCase().includes(termoFiltro);
        });

      for (const [k, v] of avulsas) {
        const ativa = itemAtivo.kind === k && !itemAtivo.set;
        cardsSetsHtml.push(`
          <button
            type="button"
            class="rs-bag-item-compact ${ativa ? "sel" : ""}"
            data-sim-equipar-arma-avulsa="${k}"
            title="${escaparHtml(v.notaSkill || v.nome)}"
          >
            <div class="rs-ibox rs-rbg-4 ${ativa ? "sel" : ""}">
              <canvas
                class="rs-canvas-catalogo"
                data-sim-canvas-catalogo="weapon|${v.classe}|0|4|${k}|0"
                width="32"
                height="32"
              ></canvas>
            </div>
            <div class="rs-bag-compact-info">
              <strong style="color:#ffb62e;">${escaparHtml(v.nome)}</strong>
              <span class="rs-bag-compact-sub">Arma Avulsa (sem conjunto)${v.classe !== simulacao.estadoSimulador.cls ? ` · ${nomesClasses[v.classe]}` : ""}</span>
            </div>
            ${ativa ? `<span class="rs-bag-equip-tag">✓</span>` : ""}
          </button>
        `);
      }
    }

    galeriaSlotHtml = `
      <div class="rs-bag-list compact sim-galeria-itens">
        ${cardsSetsHtml.length > 0 ? cardsSetsHtml.join("") : `<div class="small muted" style="padding:12px;">Nenhuma peça encontrada para "${escaparHtml(simulacao.termoBuscaSlotSimulador)}".</div>`}
      </div>
    `;
  }

  // Detalhes da Peça Selecionada (exibidos apenas no card da direita .rs-icard)
  const setChaveAtiva = itemAtivo.set && catalogoConjuntos[itemAtivo.set] ? itemAtivo.set : "";
  const infoSetAtivo = setChaveAtiva ? catalogoConjuntos[setChaveAtiva] : null;
  const qtdSetAtivo = setChaveAtiva
    ? simulacao.estadoSimulador.itens.filter((it) => it && it.set === setChaveAtiva).length
    : 0;
  const b2AtivoTexto = setChaveAtiva
    ? window.RiftSprites?.catalogoConjuntosOficial?.[setChaveAtiva]?.b2 || formatarBonusConjuntoCurto(infoSetAtivo.b2)
    : "";
  const b3AtivoTexto = setChaveAtiva
    ? window.RiftSprites?.catalogoConjuntosOficial?.[setChaveAtiva]?.b3 || formatarBonusConjuntoCurto(infoSetAtivo.b3)
    : "";

  const kindAtivo = itemAtivo.kind || (infoSetAtivo ? (ehArma ? infoSetAtivo.armaKind : itemAtivo.slot === "helmet" ? infoSetAtivo.elmoKind : infoSetAtivo.armaduraKind) : "");
  const infoArmaAtiva = ehArma && kindAtivo ? catalogoArmas[kindAtivo] : null;
  const infoKindOficialAtivo = kindAtivo ? window.RiftSprites?.catalogoKindsOficial?.[kindAtivo] : null;
  const infoAnelAtivo = ehAnel && Number(itemAtivo.look) ? catalogoAneis[Number(itemAtivo.look)] : null;
  const textoPassivaPecaAtiva = ehAnel
    ? (infoAnelAtivo?.efeito || "Sem efeito passivo especial.")
    : (infoArmaAtiva?.efeito?.texto || infoArmaAtiva?.notaSkill || infoKindOficialAtivo?.effect || "");
  const escPecaAtiva = ehAnel
    ? infoAnelAtivo?.escalaPorNivel
    : (kindAtivo ? catalogoEscalasPecas[kindAtivo] : null);
  const rotuloFonteCurva = ehAnel && infoAnelAtivo?.estimado
    ? "perfil estimado da Raid"
    : escPecaAtiva?.raridadeBase !== undefined
      ? `base ${nomesRaridade[escPecaAtiva.raridadeBase] || "medida"}`
      : "medida na API";
  const textoCurvaPecaAtiva = escPecaAtiva
    ? `Curva por nível (${rotuloFonteCurva}): ~${String(escPecaAtiva.atk).replace(".", ",")} ATK · ${String(escPecaAtiva.def).replace(".", ",")} DEF · ${String(escPecaAtiva.hp).replace(".", ",")} HP · ${String(escPecaAtiva.crit).replace(".", ",")} CRÍT (+${escPecaAtiva.spd}% VEL fixa)`
    : "";

  const blocoDetalhesPecaSelecionadaHtml = (infoSetAtivo || textoPassivaPecaAtiva || textoCurvaPecaAtiva)
    ? `
      <div class="rs-icard-lore">
        ${infoSetAtivo ? `
          <div class="rs-icard-lore-head">
            <span>Conjunto <strong style="color:var(--gold);">${escaparHtml(infoSetAtivo.nome)}</strong> (${qtdSetAtivo}/3 equipadas)</span>
            <button type="button" class="rs-btn ghost sm" data-sim-set-rapido="${setChaveAtiva}" title="Equipar Arma, Elmo e Armadura deste conjunto">
              ⚡ Equipar Set 3/3
            </button>
          </div>
          <div class="rs-icard-lore-bonus">
            <span class="${qtdSetAtivo >= 2 ? "on" : "muted"}">2p: ${escaparHtml(b2AtivoTexto)}</span>
            <span>·</span>
            <span class="${qtdSetAtivo >= 3 ? "on" : "muted"}">3p: ${escaparHtml(b3AtivoTexto)}</span>
          </div>
        ` : ""}
        ${textoPassivaPecaAtiva ? `<div class="rs-icard-lore-ef">★ ${escaparHtml(textoPassivaPecaAtiva)}</div>` : ""}
        ${infoAnelAtivo?.obtencao ? `<div class="small muted" style="margin-top:4px;">📍 <strong>Como conseguir:</strong> ${escaparHtml(infoAnelAtivo.obtencao)}</div>` : ""}
        ${textoCurvaPecaAtiva ? `<div class="small muted" style="margin-top:2px;">📊 ${escaparHtml(textoCurvaPecaAtiva)}</div>` : ""}
      </div>
    `
    : "";

  // Pills de raridade & nível rápido do slot
  const pillsRaridadeHtml = [0, 3, 4, 5, 6, 7].map((rIdx) => {
    const cor = coresRaridade[rIdx];
    const ativa = Number(itemAtivo.rarity) === rIdx;
    return `
      <button
        type="button"
        class="btn-mini ${ativa ? "ativo" : ""}"
        style="border-color:${ativa ? cor : "var(--line)"}; color:${cor};"
        data-sim-raridade-rapida="${idxAtivo}:${rIdx}"
      >
        ${nomesRaridade[rIdx]}
      </button>
    `;
  }).join("");

  const niveisRapidosPecaHtml = [150, 200, 250, 300, 330].map((nv) => `
    <button type="button" class="btn-mini ${Number(itemAtivo.itemLevel) === nv ? "ativo" : ""}" data-sim-nivel-peca-rapido="${idxAtivo}:${nv}">
      Nv.${nv}
    </button>
  `).join("");

  const rarAtivoIdx = Math.max(0, Math.min(7, Number(itemAtivo.rarity) || 0));
  const corRarAtivo = coresRaridade[rarAtivoIdx] || "#eb34b1";
  const danoCritTotalPct = Math.round((1.75 + (stSim.critDmg || 0)) * 100);
  const danoCritExtraPct = Math.round((stSim.critDmg || 0) * 100);
  const deltaFc = fcOrig !== null ? fcSim - fcOrig : null;

  return `
    <!-- Topo enxuto: Classe + Nível visíveis; Modo Ficha visual / Grade completa; Opções avançadas recolhidas -->
    <div class="rs-top-row">
      <div class="rs-top-main">
        <div class="rs-tabs" role="group" aria-label="Classe do personagem">
          ${abasClasseOficialHtml}
        </div>
        <label class="rs-top-lvl-badge" for="sim-nivel" title="Nível do personagem">
          <span>NÍVEL</span>
          <input id="sim-nivel" type="number" min="1" max="2000" value="${simulacao.estadoSimulador.level}" class="rs-lvl-input">
        </label>
        <!-- Select oculto para compatibilidade com scripts/atalhos -->
        <select id="sim-classe" hidden aria-hidden="true">
          ${Object.entries(nomesClasses).map(([k, n]) => `<option value="${k}" ${simulacao.estadoSimulador.cls === k ? "selected" : ""}>${n}</option>`).join("")}
        </select>
      </div>

      <div class="rs-top-actions">
        <div class="sim-seg-controle" role="group" aria-label="Modo de visualização do simulador">
          <button type="button" class="btn-seg ${simulacao.modoVisualizacaoSimulador === "ficha" ? "ativo" : ""}" data-sim-modo-vis="ficha">
            🎮 Ficha visual
          </button>
          <button type="button" class="btn-seg ${simulacao.modoVisualizacaoSimulador === "lista" ? "ativo" : ""}" data-sim-modo-vis="lista">
            📋 Grade completa
          </button>
        </div>
      </div>
    </div>

    ${construirOpcoesAvancadasSimuladorHtml(conjuntosDaClasse, setAtivo3Pecas)}

    <!-- Layout de 2 Colunas estilo /character -->
    <div class="rs-sheet">
      <!-- COLUNA ESQUERDA: section.panel.hero -->
      <section class="rs-panel rs-hero">
        <div class="rs-stage-box big">
          <canvas id="sim-canvas-heroi" width="192" height="192"></canvas>
        </div>

        <div class="rs-hero-head">
          <h2 style="color:${corClasseHeroi};">${nomeClasseHeroi}</h2>
          <span class="rs-lvl">NÍVEL <strong style="color:#eae6ff; font-family:var(--pix); font-size:15px;">${simulacao.estadoSimulador.level}</strong></span>
        </div>

        <div class="rs-bar tall" title="Modo Criativo de Build">
          <i style="width:94%;"></i>
          <span>FICHA VISUAL · NÍVEL ${simulacao.estadoSimulador.level}</span>
        </div>

        <div class="rs-hero-tiles">
          <div class="rs-htile fc">
            <span>FC SIMULADO</span>
            <b>${formatadorInteiro.format(fcSim)}</b>
            ${fcOrig !== null ? `<small class="muted">Perfil consultado: ${formatadorInteiro.format(fcOrig)} FC</small>` : ""}
            ${deltaFc !== null ? `<small class="rs-fc-delta ${deltaFc >= 0 ? "pos" : "neg"}">${deltaFc >= 0 ? "+" : ""}${formatadorInteiro.format(deltaFc)} vs atual</small>` : ""}
          </div>
          <div class="rs-htile">
            <span>${temCuraEmGrupo ? "CURA EM GRUPO" : "DPS EM COMBATE"}</span>
            <b style="color:var(--gold);">${formatadorInteiro.format(Math.round(temCuraEmGrupo ? metSim.curaSkillLuzDivina : metSim.dpsCombateMedio))}</b>
            ${ehClerigo ? `
              <small class="muted" title="Valor antes do multiplicador da habilidade">
                Poder de cura base<br><strong>${formatadorInteiro.format(Math.round(metSim.healPower))}</strong>
              </small>
            ` : ""}
          </div>
        </div>

        ${caixasSetsEquipadosHtml}

        <h3 class="rs-equipado-title">EQUIPADO</h3>
        <div class="rs-slots4">
          ${quadradosEquipadoHtml}
        </div>
        <p class="rs-equipado-hint">👆 Clique em um slot para escolher a peça, nível e gemas</p>
      </section>

      <!-- COLUNA DIREITA: section.panel.attrs -->
      <section class="rs-panel rs-attrs">
        <h2>ATRIBUTOS</h2>
        <div class="rs-tiles">
          <div class="rs-tile">
            <span>VIDA</span>
            <b>${Math.round(stSim.maxHp)}</b>
          </div>
          <div class="rs-tile">
            <span>ATAQUE</span>
            <b>${stSim.atk.toFixed(1)}</b>
          </div>
          <div class="rs-tile">
            <span>DEFESA</span>
            <b>${stSim.def.toFixed(1)}</b>
          </div>
          <div class="rs-tile">
            <span>VEL.</span>
            <b>${stSim.aspd.toFixed(2)}</b>
          </div>
          <div class="rs-tile">
            <span>CRÍT.</span>
            <b>${stSim.crit.toFixed(1)}%</b>
          </div>
          <div class="rs-tile">
            <span>DANO CRÍT.</span>
            <b>${danoCritTotalPct}%</b>
            ${danoCritExtraPct > 0 ? `<small>(+${danoCritExtraPct}%)</small>` : ""}
          </div>
          <div class="rs-tile">
            <span>DPS ESTIMADO</span>
            <b style="color:var(--gold);">${formatarNumeroCompacto(metSim.dpsCombateMedio)}/s</b>
            <small>Cadência ${metSim.cadenciaReal.toFixed(2)}/s</small>
          </div>
          <div class="rs-tile">
            <span>GOLPE CRÍT.</span>
            <b>${formatarNumeroCompacto(metSim.golpeCritBruto)}</b>
            <small>Normal ${formatarNumeroCompacto(metSim.golpeNormalBruto)}</small>
          </div>
          <div class="rs-tile">
            <span>EHP (TANQUE)</span>
            <b>${formatarNumeroCompacto(metSim.ehp)}</b>
            <small>Mitig. ${(metSim.reducaoDefesa * 100).toFixed(1)}%</small>
          </div>
          <div class="rs-tile">
            <span>${temCuraEmGrupo ? "CURA EM GRUPO" : "DANO DA SKILL"}</span>
            <b style="color:${temCuraEmGrupo ? "var(--green)" : "var(--cyan)"};">${formatarNumeroCompacto(temCuraEmGrupo ? metSim.curaSkillLuzDivina : metSim.skillDanoTotal)}</b>
            <small>Recarga ${metSim.cdSkillReal.toFixed(1)}s</small>
          </div>
        </div>

        ${projecaoAnel ? `<p class="note-compacto">${escaparHtml(projecaoAnel)}</p>` : ""}

        <div class="rs-attrs-head">
          <h3>GASTAR OURO</h3>
          <span class="rs-gold">💡 Melhor ganho de FC: +1 em ${melhorAttr.nome.toUpperCase()} (+${formatadorInteiro.format(melhorGanho)} FC)</span>
        </div>

        <div class="rs-upg">
          ${linhasGastarOuroHtml}
        </div>
      </section>
    </div>

    <!-- PAINEL INFERIOR: Fluxo direto "Clicar no slot -> escolher a peça -> editar nível e gemas -> ver diferença no resumo" -->
    <section class="rs-panel rs-full" id="sim-bancada-slot-oficial">
      <div class="rs-inv-head">
        <div class="rs-inv-title-group">
          <h2>SLOT: ${nomesSlots[itemAtivo.slot].toUpperCase()}</h2>
          <div class="rs-tabs">
            ${simulacao.estadoSimulador.itens.map((it, idx) => `
              <button type="button" class="rs-tab-cls sm ${idx === idxAtivo ? "active" : ""}" data-sim-selecionar-slot="${idx}">
                ${nomesSlots[it.slot].toUpperCase()}
              </button>
            `).join("")}
          </div>
        </div>

        <!-- Resumo instantâneo visível enquanto edita a peça e as gemas -->
        <div class="rs-live-summary-bar" aria-live="polite">
          <span>FC simulado: <strong style="color:var(--gold); font-family:var(--pix);">${formatadorInteiro.format(fcSim)}</strong></span>
          ${deltaFc !== null ? `<span class="rs-fc-delta ${deltaFc >= 0 ? "pos" : "neg"}">(${deltaFc >= 0 ? "+" : ""}${formatadorInteiro.format(deltaFc)})</span>` : ""}
          <span>·</span>
          <span>${temCuraEmGrupo ? "Cura em grupo" : "DPS"}: <strong style="color:var(--cyan);">${formatarNumeroCompacto(temCuraEmGrupo ? metSim.curaSkillLuzDivina : metSim.dpsCombateMedio)}${temCuraEmGrupo ? "" : "/s"}</strong></span>
          <span>·</span>
          <span>HP: <strong>${formatarNumeroCompacto(stSim.maxHp)}</strong></span>
        </div>
      </div>

      <p class="small muted">Ao trocar a peça, a simulação reaproveita as gemas. Com a estimativa automática desligada, também mantém os atributos do slot. Para prever seu FC, informe os valores da peça que você pretende equipar.</p>

      <div class="rs-inv-body">
        <!-- Esquerda: Seletor compacto de peças com busca e filtro -->
        <div class="rs-bag-col">
          <div class="rs-bag-toolbar">
            <input
              type="search"
              id="sim-busca-peca-slot"
              class="rs-bag-search"
              placeholder="Buscar peça ou conjunto…"
              aria-label="Buscar peça ou conjunto"
              maxlength="64"
              value="${escaparHtml(simulacao.termoBuscaSlotSimulador)}"
            >
            ${!ehAnel ? `
              <div class="rs-bag-filters">
                <button type="button" class="rs-btn ghost sm ${simulacao.filtroConjuntoSlotSimulador === "classe" ? "sel" : ""}" data-sim-filtro-galeria="classe">
                  ${nomesClasses[simulacao.estadoSimulador.cls]}
                </button>
                <button type="button" class="rs-btn ghost sm ${simulacao.filtroConjuntoSlotSimulador === "todos" ? "sel" : ""}" data-sim-filtro-galeria="todos">
                  Todos
                </button>
              </div>
            ` : ""}
          </div>
          ${galeriaSlotHtml}
        </div>

        <!-- Direita: Detalhes da peça selecionada + Nível/Raridade + 6 Engastes diretos -->
        <aside class="rs-detail">
          <div class="rs-icard rs-rbg-${rarAtivoIdx}">
            <div class="rs-icard-top">
              <div class="rs-icard-icon">
                <canvas class="rs-canvas-equipado" data-sim-canvas-equipado="${idxAtivo}" width="48" height="48"></canvas>
              </div>
              <div style="min-width:0; flex:1;">
                <b style="color:${corRarAtivo}; font-size:15px; display:block;">${escaparHtml(itemAtivo.name || "Peça")}</b>
                <div class="muted small">
                  <span style="color:${corRarAtivo};">${nomesRaridade[rarAtivoIdx]}</span>
                  · ${nomesSlots[itemAtivo.slot]} · Nv. ${itemAtivo.itemLevel || 1}
                </div>
              </div>
              <span class="rs-gem-badge-top">💎 ${qtdGemasAtivas}/${maxGemasAtivo}</span>
            </div>

            ${blocoDetalhesPecaSelecionadaHtml}

            <div class="sim-bancada-atributos-box">
              <div class="sim-rar-nivel-row">
                <div class="sim-pills-raridade">
                  <span class="small muted">Raridade:</span>
                  ${pillsRaridadeHtml}
                </div>
                <div class="sim-nivel-peca-box">
                  <label class="small muted" for="sim-input-nv-peca">Nv.:</label>
                  <input id="sim-input-nv-peca" type="number" min="1" max="999" value="${itemAtivo.itemLevel || 1}" data-sim-item-campo="${idxAtivo}:itemLevel">
                  ${niveisRapidosPecaHtml}
                  <button type="button" class="btn-mini btn-atalho-ativo" data-sim-recalc-peca="${idxAtivo}" title="Estima ATK, DEF, HP, CRÍT e VEL pelo nível e raridade. Você pode editar os valores.">
                    Estimar atributos
                  </button>
                </div>
              </div>

              <div class="sim-slot-stats">
                <label>ATK <input type="number" value="${itemAtivo.atk || 0}" data-sim-item-stat="${idxAtivo}:atk"></label>
                <label>DEF <input type="number" value="${itemAtivo.def || 0}" data-sim-item-stat="${idxAtivo}:def"></label>
                <label>HP <input type="number" value="${itemAtivo.hp || 0}" data-sim-item-stat="${idxAtivo}:hp"></label>
                <label>CRÍT% <input type="number" value="${itemAtivo.crit || 0}" data-sim-item-stat="${idxAtivo}:crit"></label>
                <label>VEL% <input type="number" value="${itemAtivo.spd || 0}" data-sim-item-stat="${idxAtivo}:spd"></label>
              </div>
            </div>

            ${construirEditorEngastes({
              item: itemAtivo, chavePeca: idxAtivo, engaste: simulacao.engasteSelecionadoSimulador,
            })}
          </div>
        </aside>
      </div>
    </section>
  `;
}

function normalizarItemParaSprite(item) {
  if (!item) return item;
  const copia = { ...item };
  if (!copia.kind && copia.set && catalogoConjuntos[copia.set]) {
    const infoSet = catalogoConjuntos[copia.set];
    if (copia.slot === "weapon") copia.kind = infoSet.armaKind || "";
    else if (copia.slot === "helmet") copia.kind = infoSet.elmoKind || "";
    else if (copia.slot === "armor") copia.kind = infoSet.armaduraKind || "";
  }
  return copia;
}

function renderizarCanvasesFichaSimulador() {
  if (!containerSimulador || !window.RiftSprites) return;

  // 1. Palco animado do herói (idêntico a /character)
  const canvasHeroi = containerSimulador.querySelector("#sim-canvas-heroi");
  if (canvasHeroi) {
    const itensSprite = (simulacao.estadoSimulador.itens || []).map(normalizarItemParaSprite);
    const cosmetico = obterOrigemBuildSimulador()?.cosmetico;
    if (cosmetico) itensSprite.push({ slot: "cosmetic", kind: cosmetico });
    window.RiftSprites.iniciarPalcoHeroi(canvasHeroi, simulacao.estadoSimulador.cls, itensSprite, 6);
  }

  // 2. Ícones dos itens equipados (nos 4 slots de EQUIPADO e no topo do card .rs-icard)
  containerSimulador.querySelectorAll("[data-sim-canvas-equipado]").forEach((cv) => {
    const idx = Number(cv.dataset.simCanvasEquipado);
    const item = normalizarItemParaSprite(simulacao.estadoSimulador.itens[idx]);
    if (item) {
      window.RiftSprites.desenharIconeItem(cv, item, simulacao.estadoSimulador.cls, 3);
    }
  });

  // 3. Ícones da galeria do slot (Mochila criativa)
  containerSimulador.querySelectorAll("[data-sim-canvas-catalogo]").forEach((cv) => {
    const [slot, cls, lookStr, rarStr, kind, tierStr] = (cv.dataset.simCanvasCatalogo || "").split("|");
    const escala = cv.width === 32 ? 2 : 3;
    window.RiftSprites.desenharIconeItem(
      cv,
      {
        slot: slot || "weapon",
        look: Number(lookStr) || 0,
        rarity: Number(rarStr) || 0,
        kind: kind || "",
        tier: Number(tierStr) || 0,
      },
      cls || simulacao.estadoSimulador.cls,
      escala
    );
  });

  // 4. Ícones das gemas
  containerSimulador.querySelectorAll("[data-sim-canvas-gema]").forEach((cv) => {
    const [tipo, tierStr, escalaStr] = (cv.dataset.simCanvasGema || "").split(":");
    if (tipo) {
      window.RiftSprites.desenharIconeGema(cv, tipo, Number(tierStr) || 5, Number(escalaStr) || 1);
    }
  });
}

export {
  construirBarraModoCriativoHtml,
  construirModoFichaVisualHtml,
  construirPainelResumoSimuladorHtml,
  renderizarCanvasesFichaSimulador,
};
