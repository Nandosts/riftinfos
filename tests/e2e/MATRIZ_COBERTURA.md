# Matriz de Cobertura — RiftInfos / Rift Forjas

Última atualização: 2026-11-15  
Comando de verificação estrita: `npx playwright test --update-snapshots=none`  
Comando de atualização controlada de baselines: `npx playwright test --update-snapshots`  
Comando de testes unitários / cálculo: `npm test`  
Revisão visual de regressões: em caso de falha visual, o Playwright gera `expected`, `actual` e `diff` em `test-results/` e no relatório HTML (`npx playwright show-report`).

---

## Entrega 1 — Estabilização, Responsividade, Panorama/Perfil e Tier List

| área | estado | fixture | teste | tipo de cobertura | resultado |
|---|---|---|---|---|---|
| 1. Preparação | Locale, fuso, relógio fixo, Silkscreen local e canvas estável com sprite | `DATA_FIXA_ISO`, `silkscreen-*.woff2`, `configurarAmbienteDeterministico` | `tests/e2e/helpers/ambiente.mjs`, `tests/e2e/visual-baselines.spec.mjs` | E2E + Baseline visual | Passou (`maxDiffPixels: 0`) |
| 1. Preparação | Mocks alinhados ao contrato (`counters.fuse_*`, `fz_f_*`, `playersNow`, `createdAt`, `vip`, `power`) | `PERFIS_MOCK`, `CANAIS_RUNS_PADRAO` | `tests/e2e/helpers/mock-api.mjs`, `visual-baselines.spec.mjs` | E2E + Contrato | Passou |
| 1. Preparação | Rotas inesperadas rastreadas (`rotasInesperadas`) + cenários explícitos (`empty`, `httpError`, `invalidJson`, `abort`, `custom`) | `instalarMocksApi` | `tests/e2e/helpers/mock-api.mjs` | E2E | Passou |
| 1. Preparação | Persistência real de `localStorage` sem `localStorage.clear()` em `addInitScript` | `prepararPagina` | `tests/e2e/navegacao-responsividade.spec.mjs` | E2E | Passou |
| 1. Preparação | Separação dos testes por aba para diagnóstico isolado | `PERFIS_MOCK.halscriolo` | `tests/e2e/visual-baselines.spec.mjs` | E2E + Baseline visual | Passou |
| 2. Navegação & Resp. | Breakpoints Home (320, 519/521, 639/641, 899/901, 1019/1021, 1280) e Tier List (320, 419/421, 639/641, 1280) sem overflow | `PERFIS_MOCK.sempoder` | `tests/e2e/navegacao-responsividade.spec.mjs` | E2E (layout) | Passou |
| 2. Navegação & Resp. | Tabelas com rolagem interna sem estourar largura do documento em 320px | `PERFIS_MOCK.halscriolo` | `tests/e2e/navegacao-responsividade.spec.mjs` | E2E (layout) | Passou |
| 2. Navegação & Resp. | Abas por mouse, teclado (`ArrowRight`, `Home`, `End`), `?aba=`, aba inválida e `popstate` (`goBack`/`goForward`) | Padrão | `tests/e2e/navegacao-responsividade.spec.mjs` | E2E funcional | Passou |
| 2. Navegação & Resp. | Fonte Pixelada (`Silkscreen`) e Limpa persistindo entre `reload`, `index.html <-> tierlist.html` e fallback com `localStorage` bloqueado | Padrão | `tests/e2e/navegacao-responsividade.spec.mjs`, `visual-baselines.spec.mjs` | E2E + Baseline visual | Passou |
| 2. Navegação & Resp. | Tooltips (hover, clique + `Esc`) e Glossário (abrir, busca normal, acentos e sem correspondência) | `PERFIS_MOCK.halscriolo` | `tests/e2e/navegacao-responsividade.spec.mjs` | E2E funcional | Passou |
| 2. Navegação & Resp. | Fluxos principais em Chromium Mobile (Home inicial, Simulador com editor, Tier List + detalhe) | `PERFIS_MOCK.halscriolo` | `tests/e2e/visual-baselines.spec.mjs` (`chromium-mobile`) | E2E + Baseline visual | Passou |
| 3. Panorama & Perfil | Panorama com 3 canais distintos (maior live `belky`, melhor zona `kick:nando`, mais nova `canalnovo`) | `CANAIS_RUNS_PADRAO` | `tests/e2e/panorama-perfil.spec.mjs` | E2E funcional | Passou |
| 3. Panorama & Perfil | Panorama degradado: lives vazias, erro em lives, erro em ranking e changelog ausente | `cenarios.{runs,characters,changelog}` | `tests/e2e/panorama-perfil.spec.mjs` | E2E funcional | Passou |
| 3. Panorama & Perfil | Rankings (Top 1, classes, maior nível) e clique atualizando plataforma, classe e URL | `PERFIS_MOCK.{halscriolo,nando}` | `tests/e2e/panorama-perfil.spec.mjs` | E2E funcional | Passou |
| 3. Panorama & Perfil | Modal Assistir: Twitch, Kick, ambas, fechar (botão/`Esc`) e resposta atrasada não sobrescreve atual | `cenarios.channel` | `tests/e2e/panorama-perfil.spec.mjs` | E2E concorrência | Passou |
| 3. Panorama & Perfil | Normalização de entrada (`@nick`, espaços, URL Twitch, `twitch:`, `kick:`, vazio) e `?cls=desconhecida` | `PERFIS_MOCK.{halscriolo,nando,kick:nando}` | `tests/e2e/panorama-perfil.spec.mjs` | E2E funcional | Passou |
| 3. Panorama & Perfil | Consulta sem `power` oficial e com apenas 1 classe | `PERFIS_MOCK.sempoder` | `tests/e2e/panorama-perfil.spec.mjs` | E2E funcional | Passou |
| 8. Tier List | Matriz completa 2×5 (`Por Utilidade` / `Por FC` × `Todos` / `Guerreiro` / `Arqueiro` / `Clérigo` / `Anéis`) | Dados reais `src/dados.mjs` | `tests/e2e/tierlist.spec.mjs` | E2E funcional | Passou |
| 8. Tier List | Catálogo completo: 24 conjuntos + 10 anéis e avaliação dos 10 anéis nas 3 classes | Dados reais `src/dados.mjs` | `tests/e2e/tierlist.spec.mjs` | E2E funcional | Passou |
| 8. Tier List | Seleção por teclado, troca de filtro preservando/substituindo seleção e retorno entre modos | Dados reais `src/dados.mjs` | `tests/e2e/tierlist.spec.mjs` | E2E funcional | Passou |
| 8. Tier List | Modo Por FC: anel de referência recalcula ranking, anel simulado isolado, editor T6/repetir/limpar/propagar e Restaurar cenário | Dados reais `src/dados.mjs` | `tests/e2e/tierlist.spec.mjs`, `visual-baselines.spec.mjs` | E2E + Baseline visual | Passou |
| 8. Tier List | Mecânicas e teto de VEL 4,6/s | `tests/review-regression.test.cjs` | `tests/review-regression.test.cjs` | Unitário / Regressão | Passou (6/6) |

---

## Entrega 2 — Interações das Abas

| área | estado | fixture | teste | tipo de cobertura | resultado |
|---|---|---|---|---|---|
| 4. Resumo & Histórico | Resumo sem perfil, 3 classes, FC oficial/ausente e pontos de atenção + atalhos | `PERFIS_MOCK.{halscriolo,nando,sempoder}` | `tests/e2e/resumo-historico.spec.mjs` | E2E funcional | Passou |
| 4. Resumo & Histórico | Histórico: salvar manual, duplicata, mudança de 1 gema/peça, autosave após reload e comparação | `PERFIS_MOCK.halscriolo` (versões 1 e 2) | `tests/e2e/resumo-historico.spec.mjs` | E2E persistência | Passou |
| 4. Resumo & Histórico | Isolamento por `plataforma+nick+classe`, cancelar/confirmar limpeza | `PERFIS_MOCK.{nando,kick:nando}` | `tests/e2e/resumo-historico.spec.mjs` | E2E funcional | Passou |
| 5. Forjas & Equipamentos | Histórico de forjas: normal, 0 tentativas, 0 sucessos e dados inconsistentes | `PERFIS_MOCK.sempoder` | `tests/e2e/forjas-equipamentos.spec.mjs` | E2E funcional | Passou |
| 5. Forjas & Equipamentos | Gelo/Fogo, atalho maior Gelo, planejador (bases, pergaminhos 0/10/20/25, evento, 10x, teto 100%) e VIP | `PERFIS_MOCK.{halscriolo,nando}` | `tests/e2e/forjas-equipamentos.spec.mjs` | E2E funcional | Passou |
| 5. Forjas & Equipamentos | Equipamentos: conjunto 3/3, análise "Se desequipar" e atalho para Simulador | `PERFIS_MOCK.halscriolo` | `tests/e2e/forjas-equipamentos.spec.mjs` | E2E funcional | Passou |
| 6. Simulador & Compartilhamento | Origem (exemplo/importar/restaurar), Ficha/Lista, 3 classes, auto-stats desligado e busca na galeria | `PERFIS_MOCK.halscriolo` | `tests/e2e/simulador-compartilhamento.spec.mjs` | E2E funcional | Passou |
| 6. Simulador & Compartilhamento | Gemas T1–T6, seleção de engaste sem sobrescrever anterior, mistura de tiers, raridade e rótulos DPS/s vs FC | `PERFIS_MOCK.halscriolo` | `tests/e2e/simulador-compartilhamento.spec.mjs` | E2E funcional | Passou |
| 6. Simulador & Compartilhamento | Builds salvas (nome longo + reload) e compartilhamento em contexto limpo | `PERFIS_MOCK.halscriolo` | `tests/e2e/simulador-compartilhamento.spec.mjs` | E2E persistência | Passou |
| 7. Chefes, Radar & Comparação | Chefes: origem, limites zona/onda/jogadores, escalas 70/100 e sync pela live | `PERFIS_MOCK.halscriolo`, `CANAIS_RUNS_PADRAO` | `tests/e2e/chefes-radar-comparacao.spec.mjs` | E2E funcional | Passou |
| 7. Chefes, Radar & Comparação | Radar: paginação, filtros locais sem reconsultar perfis e limpar filtros | `cenarios.board` | `tests/e2e/chefes-radar-comparacao.spec.mjs` | E2E funcional | Passou |
| 7. Chefes, Radar & Comparação | Comparação: P1 vs P2, Twitch vs Kick, atalho Clérigo (cura) e filtro Apenas diferenças | `PERFIS_MOCK.{halscriolo,nando}` | `tests/e2e/chefes-radar-comparacao.spec.mjs` | E2E funcional | Passou |

---

## Entrega 3 — Erros, Concorrência, Limites Numéricos e Regressões Intencionais (Planejada)

| área | estado | fixture | teste | tipo de cobertura | resultado |
|---|---|---|---|---|---|
| 3/7. Erros & Concorrência | 404, 503, timeout, JSON inválido, fallback AWS bem-sucedido, consulta A lenta vs B rápida | `cenarios.*` | `tests/e2e/erros-concorrencia.spec.mjs` (a criar) | E2E funcional | Pendente (Entrega 3) |
| 5/6/7/8. Limites Numéricos | Exemplos independentes calculados à mão (FC, DPS, cura, Gelo, chance acumulada, VEL 4,59/4,60/4,61) | Casos explícitos | `tests/calculos-independentes.test.cjs` (a criar) | Unitário independente | Pendente (Entrega 3) |
| 9. Critério de Aceite | Regressões intencionais em cópia temporária (esconder controle, overflow, alterar número) + 2 runs consecutivos | Cópia temporária | Validação final | Auditoria E2E | Pendente (Entrega 3) |

