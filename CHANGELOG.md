# Histórico de Atualizações · RiftInfos (Rift Forjas)

Registro das atualizações de regras do jogo (RiftStream) incorporadas ao motor de cálculo do RiftInfos e das melhorias da própria ferramenta.

---

## v2026.11.14 — Patch "Covil de Vexxaris, nova Alquimia e auras cosméticas"
**Bundle de referência do jogo:** `index-CXlW0_-D.js`

### Mudanças no motor do jogo refletidas nos cálculos
- **Novos coeficientes de Força de Combate (`k`) por classe:**
  - **Guerreiro:** `0,40` (anteriormente `0,60`).
  - **Clérigo:** `0,56` (anteriormente `0,84`).
  - **Arqueiro:** `0,56` (anteriormente `0,75`).
- **Correção das passivas de dano de armas Imortais e Arcanas (`imHit` / `rollDamage`):**
  - No motor oficial do jogo, os efeitos periódicos de dano das armas Imortais e Arcanas (*Varinha da Cartola*, *Machado do Trovão*, *Montante de Obsidiana*, *Chicote do Domador*, *Marreta do Homem-Forte*, *Cajado do Eclipse*, *Arco do Dragão Ancestral*, *Arco do Trapézio*, *Arco de Fogos de Artifício*, *Arco da Aurora Boreal* e *Arco Abissal*) passaram a usar `imHit` com `rollDamage`, recebendo **chance/dano crítico** e **bônus de velocidade de ataque acima do cap de 4,6/s**.
  - O cálculo de DPS médio no RiftInfos foi atualizado para refletir o dano real corrigido e o antigo alerta de bug foi removido.
- **Novos anéis Arcanos exclusivos da Raid (*Covil de Vexxaris*):**
  - Adicionados ao catálogo e ao gerador de sprites pixel-art (`sprites.js`):
    - **Anel da Presa de Ixtharra (`look: 18`):** focado em ataque e crítico, com vida e defesa.
    - **Anel da Teia Escarlate (`look: 19`):** focado em vida e defesa, com ataque e velocidade.
- **Separação das Auras Cosméticas (`slot: "cosmetic"`):**
  - O brilho visual que antes vinha embutido nos anéis e conjuntos Arcanos agora é um item cosmético separado no jogo.
  - O palco animado do herói no Simulador preserva a aura cosmética do personagem importado e suporta os novos identificadores (`ringgold`..`ringweb` e `asetamer`..`aseabyss`).

### Melhorias no Simulador e na Interface
- **Ficha visual no modelo oficial (`/character`):**
  - Seletor compacto de peças com busca por nome/conjunto e filtro (`Da Classe` / `Todos`).
  - Detalhes do conjunto (`2 peças` / `3 peças`), botão `⚡ Equipar Set 3/3` e passivas exibidos diretamente no card da peça selecionada.
  - Edição direta dos **6 engastes de gema** lado a lado com seletor único das 5 pedras, `⚡ Repetir nos 6 engastes` e `✕ Esvaziar`.
  - Controles secundários (modo de rolagem de gemas, presets e conjuntos rápidos) agrupados em `⚙️ Opções avançadas`.
  - Cache de animação de sprites do herói para trocas instantâneas sem travar o navegador.

---

## v2026.11.1 — Patch "Novos conjuntos Arcanos, Aprimorar e sequência da Forja"
**Bundle de referência do jogo:** `index-Bw4Xm9JJ.js`

- **6 novos conjuntos Arcanos clássicos (2 por classe):**
  - **Guerreiro:** *Titã de Obsidiana* e *Senhor do Trovão*.
  - **Clérigo:** *Serafim Dourado* e *Sacerdote do Eclipse*.
  - **Arqueiro:** *Aurora Boreal* e *Caçador Abissal*.
- **Sistema de Gelo (Pity) na Forja:**
  - Cada falha consecutiva no mesmo slot e raridade adiciona **+2 p.p.** de chance na próxima tentativa (até **+10 p.p.** no Gelo Nv.5). Um sucesso zera a contagem daquela peça/raridade.
- **Links de lives (Twitch / Kick):**
  - Exibição condicional dos botões da Twitch e da Kick apenas quando o canal está efetivamente disponível/online na respectiva plataforma.

