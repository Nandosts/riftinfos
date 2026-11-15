# Histórico de Atualizações · RiftInfos (Rift Forjas)

Registro das atualizações de regras do jogo (RiftStream) incorporadas ao motor de cálculo do RiftInfos e das melhorias da própria ferramenta.

---

## v2026.11.14 — Patch "Covil de Vexxaris, nova Alquimia e auras cosméticas"
**Bundle de referência do jogo:** `index-XMmLTBXc.js` (e `index-CXlW0_-D.js`)

### Mudanças no motor do jogo refletidas nos cálculos
- **Novos coeficientes de Força de Combate (`k`) por classe:**
  - **Guerreiro:** `0,40` (anteriormente `0,60`).
  - **Clérigo:** `0,56` (anteriormente `0,84`).
  - **Arqueiro:** `0,56` (anteriormente `0,75`).
- **Correção das passivas de dano de armas Imortais e Arcanas (`imHit` / `rollDamage`):**
  - No motor oficial do jogo, os efeitos periódicos de dano das armas Imortais e Arcanas (*Varinha da Cartola*, *Machado do Trovão*, *Montante de Obsidiana*, *Chicote do Domador*, *Marreta do Homem-Forte*, *Cajado do Eclipse*, *Arco do Dragão Ancestral*, *Arco do Trapézio*, *Arco de Fogos de Artifício*, *Arco da Aurora Boreal* e *Arco Abissal*) passaram a usar `imHit` com `rollDamage`, recebendo **chance/dano crítico** e **bônus de velocidade de ataque acima do cap de 4,6/s**.
  - O cálculo de DPS médio no RiftInfos foi atualizado para refletir o dano real corrigido e o antigo alerta de bug foi removido.
- **Novos anéis Arcanos exclusivos da Raid (*Covil de Vexxaris*):**
  - Adicionados ao catálogo (`src/dados.mjs`), às curvas individuais do Simulador (`src/simulador/estado.mjs`) e ao gerador de sprites pixel-art (`sprites.js`):
    - **Anel da Presa de Ixtharra (`look: 18`):** exclusivo do Covil de Vexxaris. Sem proc periódico (`ir`), concentra o orçamento em **muito Ataque e Crítico brutos** (com Vida e Defesa de brinde, perfil `~4,05 ATK/nv`, `~0,64 CRÍT/nv`, `~1,35 DEF/nv`, `~6,50 HP/nv`, `+16% VEL`).
    - **Anel da Teia Escarlate (`look: 19`):** exclusivo do Covil de Vexxaris. Sem proc periódico (`ir`), concentra o orçamento em **muita Vida, Defesa e Velocidade** (com Ataque de brinde, perfil `~16,20 HP/nv`, `~2,95 DEF/nv`, `~2,65 ATK/nv`, `~0,25 CRÍT/nv`, `+18% VEL`).
  - Curvas reais medidas na API para todos os demais anéis (`#2` a `#17`) aplicadas automaticamente ao trocar de anel no Simulador:
    - *Eclipse Arcano (#14)*: `3,684 ATK/nv · 0,566 CRÍT/nv · 1,222 DEF/nv · 5,930 HP/nv · 16% VEL` + Eco 60% / duplo 20%.
    - *Ceifador Cósmico (#16)*: `3,415 ATK/nv · 0,433 CRÍT/nv · 1,461 DEF/nv · 6,854 HP/nv · 18% VEL` + até +40% ATK por almas.
    - *Coração do Vazio (#15)*: `2,458 ATK/nv · 0,279 CRÍT/nv · 2,714 DEF/nv · 14,873 HP/nv · 12% VEL` + Revive 70% HP + 40% escudo.
    - *Prisma Estelar (#17)*: `2,210 ATK/nv · 0,222 CRÍT/nv · 2,210 DEF/nv · 12,871 HP/nv · 14% VEL` + Pulso a cada 10s (limpa controles + 12% escudo + 8% cura).
- **Documentação completa da Raid *Covil de Vexxaris*, *Casulo de Vexxaris* e *Alquimia*:**
  - Adicionados guias detalhados na aba **Equipamentos**, na aba **Chefes**, no **Glossário Global** (`explicacoes.js`) e no rodapé explicando:
    - Como dropar o **Casulo de Vexxaris** (chefes de zona e drop da própria Raid; bloqueado no Mercado e na Alquimia).
    - Como abrir a Raid (`Meu personagem -> Usar: romper o Casulo`) e entrar pelo chat (`$raid CÓDIGO`).
    - Por que a marcha normal da live pausa e quem não digitou `$raid CÓDIGO` fica oculto durante as 4 ondas (voltando automaticamente ao final na mesma Zona e Onda).
    - Regra de morte sem revive por tempo dentro da Raid (exigindo auto-revive ou revive de Clérigo).
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

