import { alternarVisibilidadeAba } from "./abas.mjs";
import { renderizarSimuladorMonstros, selectMonstroOrigem } from "./chefes.mjs";
import {
  agregarItens,
  calcularFc,
  calcularMetricasCombate,
  calcularStatusSimulados,
  inferirAtributosBase,
} from "./combate.mjs";
import {
  catalogoConjuntos,
  coresGemas,
  coresRaridade,
  dadosClasses,
  nomesClasses,
  nomesRaridade,
  nomesSlots,
  rotulosStats,
} from "./dados.mjs";
import {
  escaparHtml,
  formatadorInteiro,
  formatadorPercentual,
  formatarGemaTexto,
  formatarNumeroCompacto,
} from "./formato.mjs";
import { perfilCarregadoP1 } from "./perfil.mjs";
import { importarPerfilParaSimulador } from "./simulador/estado.mjs";
import { renderizarSimulador } from "./simulador/tela.mjs";

const containerResumoFc = document.querySelector("#resumo-fc");
const containerAnaliseCombate = document.querySelector("#analise-combate-jogador");
const containerConjuntos = document.querySelector("#conjuntos-ativos");
const containerAvisoSinergia = document.querySelector("#aviso-sinergia");
const containerListaEquipamentos = document.querySelector("#lista-equipamentos");

function renderizarAnaliseCombateJogador(perfil, status, metricas) {
  if (!containerAnaliseCombate) return;
  const classe = perfil.cls;
  const infoClasse = dadosClasses[classe] || dadosClasses.warrior;
  const nomeArma = metricas.arma?.name || metricas.infoArma?.nome || "Arma Básica";

  let cardArmaEspecial = "";
  if (metricas.analiseEfeitoArma?.bugado) {
    const b = metricas.analiseEfeitoArma;
    const razaoFormatada = b.razaoPerda.toFixed(1).replace(".", ",") + "× mais";
    const multFormatado = String(b.mult).replace(".", ",") + "× ATK";
    cardArmaEspecial = `
      <article class="card-combate destaque-arma">
        <div class="card-combate-titulo">Efeito da Arma (${escaparHtml(b.nome)})</div>
        <div class="metrica-principal">${formatarNumeroCompacto(b.danoAtualSemDefesa)} dano atual</div>
        <span class="badge-status-skill bug">⚠️ BUG NA FÓRMULA ATUAL (this.hit)</span>
        <div class="card-info-linha"><span>Com Crítico &amp; Veloc. (pós-correção)</span><strong style="color:var(--green);">${formatarNumeroCompacto(b.danoCorrigidoSemDefesa)} (${razaoFormatada})</strong></div>
        <div class="card-info-linha"><span>Ciclo / Multiplicador</span><strong>A cada ${b.cada}s · ${multFormatado}</strong></div>
        <p class="note-compacto">Hoje o jogo aplica apenas <code>atk × ${String(b.mult).replace(".", ",")}</code> sem crítico e sem bônus de velocidade &gt; 4,6. Os números desta análise refletem o comportamento atual em produção.</p>
      </article>
    `;
  } else if (metricas.analiseEfeitoArma && !metricas.analiseEfeitoArma.bugado) {
    const s = metricas.analiseEfeitoArma;
    cardArmaEspecial = `
      <article class="card-combate destaque-arma">
        <div class="card-combate-titulo">Efeito da Arma (${escaparHtml(s.nome)})</div>
        <div class="metrica-principal">${(s.pctBossEfetivo * 100).toFixed(1).replace(".", ",")}% HP do Chefe</div>
        <span class="badge-status-skill ok">✓ DANO VERDADEIRO (% HP)</span>
        <div class="card-info-linha"><span>Em Monstros Normais</span><strong>25% do HP máx. (ignora DEF)</strong></div>
        <div class="card-info-linha"><span>Ativação</span><strong>A cada ${s.cada}s (+1,4s atraso)</strong></div>
        <p class="note-compacto">${escaparHtml(s.texto)}</p>
      </article>
    `;
  } else if (metricas.infoArma?.efeito) {
    cardArmaEspecial = `
      <article class="card-combate destaque-arma">
        <div class="card-combate-titulo">Passiva da Arma (${escaparHtml(metricas.infoArma.nome)})</div>
        <div class="metrica-principal">Ativa em Combate</div>
        <span class="badge-status-skill ok">✓ EFEITO FUNCIONAL</span>
        <p class="note-compacto">${escaparHtml(metricas.infoArma.efeito.texto)}</p>
      </article>
    `;
  } else {
    cardArmaEspecial = `
      <article class="card-combate destaque-arma">
        <div class="card-combate-titulo">Skill da Classe (${escaparHtml(infoClasse.nomeSkill)})</div>
        <div class="metrica-principal">${classe === "cleric" ? `${formatarNumeroCompacto(metricas.curaSkillLuzDivina)} cura` : `${formatarNumeroCompacto(metricas.skillDanoPorAlvo)} / alvo`}</div>
        <div class="card-info-linha"><span>Recarga Efetiva</span><strong>${metricas.cdSkillReal.toFixed(1).replace(".", ",")}s</strong></div>
        <div class="card-info-linha"><span>Alvos / Multiplicador</span><strong>${metricas.skillAlvos} alvo(s) · ${metricas.skillMult.toFixed(2).replace(".", ",")}×</strong></div>
        <p class="note-compacto">${escaparHtml(metricas.infoArma?.notaSkill || "Equipar arma Imortal/Arcana adiciona passiva exclusiva.")}</p>
      </article>
    `;
  }

  const cardCuraOuSkill = classe === "cleric"
    ? `
      <article class="card-combate destaque-cura">
        <div class="card-combate-titulo">Cura &amp; Suporte (Clérigo)</div>
        <div class="metrica-principal">${formatarNumeroCompacto(metricas.healPower)} / pulso</div>
        <div class="card-info-linha"><span>Luz Divina (Skill)</span><strong>${formatarNumeroCompacto(metricas.curaSkillLuzDivina)}</strong></div>
        ${metricas.escudoAurora > 0 ? `<div class="card-info-linha"><span>Escudo Cetro da Aurora</span><strong>${formatarNumeroCompacto(metricas.escudoAurora)}</strong></div>` : ""}
        <div class="card-info-linha"><span>Fator Velocidade (&gt;4,6)</span><strong>${metricas.speedBonus.toFixed(2).replace(".", ",")}×</strong></div>
        <p class="note-compacto">Nota do motor: cura usa <code>(atk×2,4 + Nv×1,5 + 6) × VelExcesso</code> e <strong>não critica</strong>.</p>
      </article>
    `
    : `
      <article class="card-combate destaque-cura">
        <div class="card-combate-titulo">Skill (${escaparHtml(infoClasse.nomeSkill)})</div>
        <div class="metrica-principal">${formatarNumeroCompacto(metricas.skillDanoPorAlvo)} / alvo</div>
        <div class="card-info-linha"><span>Dano Total na Rajada/Área</span><strong>${formatarNumeroCompacto(metricas.skillDanoTotal)} (${metricas.skillAlvos} alvos)</strong></div>
        <div class="card-info-linha"><span>Recarga Real</span><strong>${metricas.cdSkillReal.toFixed(1).replace(".", ",")}s</strong></div>
        <div class="card-info-linha"><span>Anel Especial</span><strong>${metricas.anelAtivo ? escaparHtml(metricas.anelAtivo.nome) : "Nenhum ativo"}</strong></div>
        <p class="note-compacto">${escaparHtml(metricas.infoArma?.notaSkill || infoClasse.nomeSkill)}</p>
      </article>
    `;

  containerAnaliseCombate.innerHTML = `
    <div class="barra-atalhos">
      <span class="rotulo-atalho">⚡ Ações Rápidas com esta Build:</span>
      <button type="button" class="btn-mini btn-atalho-ativo" data-ir-aba="simulador">🛠️ Abrir Build no Simulador de FC</button>
      <button type="button" class="btn-mini" data-ir-aba="monstros">🐉 Testar Dano contra Boss / Ondas</button>
      <button type="button" class="btn-mini" data-ir-aba="comparar">⚔️ Comparar com Outro Jogador</button>
    </div>
    <h3 class="titulo-secao-comp">Desempenho Real em Combate (${escaparHtml(nomeArma)})</h3>
    <div class="grade-combate">
      <article class="card-combate destaque-dps">
        <div class="card-combate-titulo">Dano &amp; DPS Real (Alvo 0 DEF)</div>
        <div class="metrica-principal">${formatarNumeroCompacto(metricas.dpsCombateMedio)} DPS</div>
        <div class="card-info-linha"><span>Golpe Normal Médio</span><strong>${formatarNumeroCompacto(metricas.golpeNormalBruto)}</strong></div>
        <div class="card-info-linha"><span>Golpe Crítico (${(metricas.multCrit * 100).toFixed(0)}%)</span><strong style="color:var(--gold);">${formatarNumeroCompacto(metricas.golpeCritBruto)}</strong></div>
        <div class="card-info-linha"><span>Cadência Real (Cap 4,6/s)</span><strong>${metricas.cadenciaReal.toFixed(2).replace(".", ",")}/s (${metricas.speedBonus.toFixed(2).replace(".", ",")}× dano)</strong></div>
      </article>
      ${cardCuraOuSkill}
      ${cardArmaEspecial}
      <article class="card-combate destaque-defesa">
        <div class="card-combate-titulo">Sobrevivência &amp; Defesa</div>
        <div class="metrica-principal">${(metricas.reducaoDefesa * 100).toFixed(1).replace(".", ",")}% Redução</div>
        <div class="card-info-linha"><span>Vida Efetiva (EHP)</span><strong>${formatarNumeroCompacto(metricas.ehp)}</strong></div>
        <div class="card-info-linha"><span>HP Máximo / DEF</span><strong>${formatarNumeroCompacto(status.maxHp)} / ${formatadorInteiro.format(Math.round(status.def))}</strong></div>
        <div class="card-info-linha"><span>Revives na Build</span><strong>${metricas.revives.length > 0 ? metricas.revives.length : "0"} (${metricas.revives.length > 0 ? escaparHtml(metricas.revives[0]) : "Nenhum"})</strong></div>
      </article>
    </div>
  `;

  containerAnaliseCombate.querySelectorAll("[data-ir-aba]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const abaDestino = btn.dataset.irAba;
      if (abaDestino === "simulador" && perfilCarregadoP1) {
        importarPerfilParaSimulador(perfilCarregadoP1);
        renderizarSimulador();
      } else if (abaDestino === "monstros") {
        if (selectMonstroOrigem) selectMonstroOrigem.value = "p1";
        renderizarSimuladorMonstros();
      }
      alternarVisibilidadeAba(abaDestino);
    });
  });
}

function renderizarEquipamentosEGemas(perfil) {
  const classe = perfil.cls;
  const nivel = perfil.level;
  const itensEquipados = perfil.equipped || [];
  const atributos = inferirAtributosBase(perfil);

  const statusAtuais = calcularStatusSimulados(classe, nivel, atributos, itensEquipados);
  const fcTotal = calcularFc(classe, statusAtuais);

  const statusSemItens = calcularStatusSimulados(classe, nivel, atributos, []);
  const fcSemItens = calcularFc(classe, statusSemItens);
  const ganhoTotalEquips = Math.max(0, fcTotal - fcSemItens);
  const pctGanhoTotal = fcSemItens > 0 ? ganhoTotalEquips / fcSemItens : 0;

  containerResumoFc.innerHTML = `
    <div class="bloco-resumo">
      <span>FORÇA TOTAL (FC)</span>
      <strong>${formatadorInteiro.format(fcTotal)}</strong>
      <small>Nível ${formatadorInteiro.format(nivel)} · ${nomesClasses[classe]}</small>
    </div>
    <div class="bloco-resumo">
      <span>GANHO POR EQUIPAMENTOS</span>
      <strong>+${formatadorInteiro.format(ganhoTotalEquips)}</strong>
      <small>+${formatadorPercentual.format(pctGanhoTotal)} de aumento</small>
    </div>
    <div class="bloco-resumo">
      <span>FC BASE (SEM ITENS)</span>
      <strong>${formatadorInteiro.format(fcSemItens)}</strong>
      <small>Atributos: F${atributos.str} V${atributos.vit} D${atributos.def} A${atributos.agi} S${atributos.luk}</small>
    </div>
  `;

  // Análise real de combate + link direto para PvE e Simulador
  const metricas = calcularMetricasCombate(classe, nivel, statusAtuais, itensEquipados);
  renderizarAnaliseCombateJogador(perfil, statusAtuais, metricas);

  // Conjuntos ativos
  const { contagemConjuntos } = agregarItens(itensEquipados);
  const cartoesConjuntos = [];
  for (const [chaveSet, contagem] of Object.entries(contagemConjuntos)) {
    const config = catalogoConjuntos[chaveSet];
    if (!config || contagem < 2) continue;
    const bonusDesc = [];
    if (contagem >= 2) bonusDesc.push(`2 peças ativas`);
    if (contagem >= 3) bonusDesc.push(`3 peças ativas (completo)`);
    cartoesConjuntos.push(`
      <div class="cartao-conjunto">
        <div>
          <b>${escaparHtml(config.nome)}</b> (${contagem}/3 peças)
          <div class="bonus-lista">${bonusDesc.join(" · ")}</div>
        </div>
        <span class="tag-fc">Conjunto Ativo</span>
      </div>
    `);
  }
  containerConjuntos.innerHTML = cartoesConjuntos.join("");

  if (containerAvisoSinergia) {
    containerAvisoSinergia.innerHTML = `
      <strong>Por que a conta fecha exatamente agora?</strong>
      <p>
        Os valores principais em dourado (<strong>+X FC</strong>) distribuem os <strong>+${formatadorInteiro.format(ganhoTotalEquips)} FC</strong> ganhos com equipamentos (somando 100% da sua força de itens).
      </p>
      <p>
        Já a tag em vermelho <strong>"Se desequipar"</strong> mostra a perda marginal imediata: como o modelo de FC combina dano por segundo, vida efetiva e coeficiente de classe, incluindo os efeitos de atributos e conjuntos, remover uma única peça derruba a sinergia com o resto do set.
      </p>
    `;
  }

  const slotsOrdem = ["weapon", "helmet", "armor", "ring", "cosmetic"];
  const itensOrdenados = [...itensEquipados].sort((a, b) => {
    return slotsOrdem.indexOf(a.slot) - slotsOrdem.indexOf(b.slot);
  });

  const slotsDados = itensOrdenados.map((item) => {
    const itensSemEsteSlot = itensEquipados.filter((it) => it.id !== item.id);
    const fcSemEsteSlot = calcularFc(
      classe,
      calcularStatusSimulados(classe, nivel, atributos, itensSemEsteSlot)
    );
    const perdaMarginalSlot = Math.max(0, fcTotal - fcSemEsteSlot);

    const itensComItemLimpoDeGemas = itensEquipados.map((it) =>
      it.id === item.id ? { ...it, gems: [] } : it
    );
    const fcItemLimpo = calcularFc(
      classe,
      calcularStatusSimulados(classe, nivel, atributos, itensComItemLimpoDeGemas)
    );
    const perdaMarginalGemas = Math.max(0, fcTotal - fcItemLimpo);
    const perdaMarginalItemBase = Math.max(0, fcItemLimpo - fcSemEsteSlot);

    const gemas = item.gems || [];
    const gemasDados = gemas.map((gema, idx) => {
      const itensSemEstaGema = itensEquipados.map((it) => {
        if (it.id !== item.id) return it;
        return {
          ...it,
          gems: (it.gems || []).filter((_, iGema) => iGema !== idx),
        };
      });
      const fcSemEstaGema = calcularFc(
        classe,
        calcularStatusSimulados(classe, nivel, atributos, itensSemEstaGema)
      );
      const perdaMarginalGema = Math.max(0, fcTotal - fcSemEstaGema);
      return { gema, idx, perdaMarginalGema };
    });

    return {
      item,
      perdaMarginalSlot,
      perdaMarginalItemBase,
      perdaMarginalGemas,
      gemasDados,
    };
  });

  const somaPerdasMarginaisSlots = slotsDados.reduce((acc, s) => acc + s.perdaMarginalSlot, 0);
  let acumuladorFcSlots = 0;
  let idxMaiorSlot = 0;
  let maiorPerdaSlot = -1;

  slotsDados.forEach((s, idx) => {
    if (s.perdaMarginalSlot > maiorPerdaSlot) {
      maiorPerdaSlot = s.perdaMarginalSlot;
      idxMaiorSlot = idx;
    }
  });

  slotsDados.forEach((s) => {
    const proporcaoSlot = somaPerdasMarginaisSlots > 0 ? s.perdaMarginalSlot / somaPerdasMarginaisSlots : 0;
    const fcAtribuidoSlot = Math.round(ganhoTotalEquips * proporcaoSlot);
    s.proporcaoSlot = proporcaoSlot;
    s.fcAtribuidoSlot = fcAtribuidoSlot;
    acumuladorFcSlots += fcAtribuidoSlot;
  });

  if (slotsDados.length > 0 && acumuladorFcSlots !== ganhoTotalEquips) {
    slotsDados[idxMaiorSlot].fcAtribuidoSlot += (ganhoTotalEquips - acumuladorFcSlots);
  }

  slotsDados.forEach((s) => {
    const somaPartesInternas = s.perdaMarginalItemBase + s.perdaMarginalGemas;
    if (somaPartesInternas > 0) {
      s.fcAtribuidoItemBase = Math.round(s.fcAtribuidoSlot * (s.perdaMarginalItemBase / somaPartesInternas));
      s.fcAtribuidoGemasTotal = s.fcAtribuidoSlot - s.fcAtribuidoItemBase;
    } else {
      s.fcAtribuidoItemBase = s.fcAtribuidoSlot;
      s.fcAtribuidoGemasTotal = 0;
    }

    const somaPerdasGemas = s.gemasDados.reduce((acc, g) => acc + g.perdaMarginalGema, 0);
    let acumuladorGemas = 0;
    let idxMaiorGema = 0;
    let maiorPerdaGema = -1;

    s.gemasDados.forEach((g, idx) => {
      if (g.perdaMarginalGema > maiorPerdaGema) {
        maiorPerdaGema = g.perdaMarginalGema;
        idxMaiorGema = idx;
      }
      const propGema = somaPerdasGemas > 0 ? g.perdaMarginalGema / somaPerdasGemas : 0;
      const fcAtribuidoGema = Math.round(s.fcAtribuidoGemasTotal * propGema);
      g.fcAtribuidoGema = fcAtribuidoGema;
      g.proporcaoGemaNoItem = s.fcAtribuidoSlot > 0 ? fcAtribuidoGema / s.fcAtribuidoSlot : 0;
      acumuladorGemas += fcAtribuidoGema;
    });

    if (s.gemasDados.length > 0 && acumuladorGemas !== s.fcAtribuidoGemasTotal) {
      s.gemasDados[idxMaiorGema].fcAtribuidoGema += (s.fcAtribuidoGemasTotal - acumuladorGemas);
    }
  });

  const elementosEquipamentos = slotsDados.map((s) => {
    const item = s.item;
    const ehCosmetico = item.slot === "cosmetic";
    const nomeSlot = nomesSlots[item.slot] || item.slot;
    const nomeRaridade = nomesRaridade[item.rarity] || "Comum";
    const corRaridade = coresRaridade[item.rarity] || "#c9c5d8";

    const chipsAtributos = [];
    for (const [st, rotulo] of Object.entries(rotulosStats)) {
      if (item[st]) {
        const sufixo = st === "crit" || st === "spd" ? "%" : "";
        chipsAtributos.push(`<span class="chip-stat">+${item[st]}${sufixo} ${rotulo}</span>`);
      }
    }

    const maxSockets = item.sockets || s.gemasDados.length;
    const cardsGemas = [];

    s.gemasDados.forEach((g) => {
      const gema = g.gema;
      const corGema = coresGemas[gema.type] || "#8fd0ff";
      cardsGemas.push(`
        <div class="cartao-gema">
          <div class="gema-info">
            <span class="gema-icone" style="--cor-gema: ${corGema};"></span>
            <div class="gema-texto">
              <span class="gema-nome" style="color: ${corGema};">${escaparHtml(gema.name || "Gema")}</span>
              <span class="gema-stats">${escaparHtml(formatarGemaTexto(gema))}</span>
            </div>
          </div>
          <div class="gema-fc-bloco">
            <span class="gema-fc">+${formatadorInteiro.format(g.fcAtribuidoGema)} FC</span>
            <span class="gema-fc-perda">-${formatadorInteiro.format(g.perdaMarginalGema)} se remover</span>
          </div>
        </div>
      `);
    });

    for (let i = s.gemasDados.length; i < maxSockets; i++) {
      cardsGemas.push(`
        <div class="cartao-gema vazio">
          <div class="gema-info">
            <span class="gema-icone" style="--cor-gema: #443c68;"></span>
            <div class="gema-texto">
              <span class="gema-nome">Espaço vazio</span>
              <span class="gema-stats">Sem gema engastada</span>
            </div>
          </div>
          <span>—</span>
        </div>
      `);
    }

    return `
      <article class="cartao-equipamento">
        <div class="equip-topo">
          <div class="equip-titulo">
            <span class="equip-slot">${escaparHtml(nomeSlot)}</span>
            <div class="equip-nome" style="color: ${corRaridade};">${escaparHtml(item.name)}</div>
            <div class="equip-meta">
              ${nomeRaridade} · Nv. ${item.itemLevel || 1}
              ${item.set && catalogoConjuntos[item.set] ? ` · Conjunto ${escaparHtml(catalogoConjuntos[item.set].nome)}` : ""}
            </div>
          </div>
          <div class="equip-fc-box">
            <span class="tag-fc">+${formatadorInteiro.format(s.fcAtribuidoSlot)} FC (${formatadorPercentual.format(s.proporcaoSlot)} do ganho)</span>
            ${
              !ehCosmetico && s.gemasDados.length > 0
                ? `<span class="tag-fc secundaria">Item: +${formatadorInteiro.format(s.fcAtribuidoItemBase)} FC</span>
                   <span class="tag-fc secundaria">Gemas: +${formatadorInteiro.format(s.fcAtribuidoGemasTotal)} FC</span>`
                : ""
            }
            ${
              s.perdaMarginalSlot > 0
                ? `<span class="tag-fc remover" title="Perda de FC se você desequipar este item agora">Se desequipar: -${formatadorInteiro.format(s.perdaMarginalSlot)} FC</span>`
                : ""
            }
          </div>
        </div>
        ${chipsAtributos.length > 0 ? `<div class="atributos-item">${chipsAtributos.join("")}</div>` : ""}
        ${!ehCosmetico && maxSockets > 0 ? `<div class="grade-gemas">${cardsGemas.join("")}</div>` : ""}
      </article>
    `;
  });

  containerListaEquipamentos.innerHTML = elementosEquipamentos.join("");
}

export {
  renderizarEquipamentosEGemas,
};
