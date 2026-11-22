# RiftInfos · Rift Forjas

Aplicativo web para consultar personagens do RiftStream, analisar forjas e equipamentos, simular builds, comparar jogadores e acompanhar lives.

## Requisitos

- Python 3.10 ou superior.
- Um navegador atualizado.
- Conexão com a internet para consultar as APIs públicas do jogo e carregar a fonte visual.

O servidor usa apenas a biblioteca padrão do Python. Não é necessário instalar pacotes com `pip`, Node.js ou executar um build para usar o aplicativo.

## Rodar localmente

Abra um terminal na pasta do repositório, onde está o arquivo `servidor.py`.

### macOS e Linux

```sh
python3 servidor.py
```

### Windows

```powershell
py -3 servidor.py
```

Se o comando `py` não estiver disponível e o Python estiver no PATH, use:

```powershell
python servidor.py
```

Com o servidor rodando, abra no navegador:

**[http://127.0.0.1:4173/](http://127.0.0.1:4173/)**

Mantenha o terminal aberto durante o uso. Para encerrar o servidor, pressione **Ctrl+C** nesse terminal.

## Usar o aplicativo

1. Informe o nick ou link do perfil e selecione Twitch ou Kick.
2. Clique em **Consultar Jogador**.
3. Selecione a classe do personagem e navegue pelas abas de análise.

O simulador também pode ser usado sem consultar um perfil. As builds e o histórico salvos ficam no navegador utilizado; não são sincronizados entre dispositivos.

Ao editar os arquivos HTML, CSS ou JavaScript, atualize a página para carregar as mudanças. Não é preciso reiniciar o servidor. Se mudar `servidor.py`, encerre e inicie o servidor novamente.

## API pública do RiftStream

Veja as rotas, os parâmetros e exemplos em [API.md](API.md). Para as rotas que usam a sessão do jogador, veja [API private.md](API%20private.md).

## Onde editar

| Tarefa | Arquivos |
| --- | --- |
| Estrutura da página e carregamento | `index.html`, `app.mjs` e `src/abas.mjs` |
| Consulta de perfil e tratamento de falhas | `src/perfil.mjs`, `src/api.mjs` e `src/identidade.mjs` |
| Cálculos de FC e combate | `src/combate.mjs` e `src/dados.mjs` |
| Resumo, histórico e glossário | `src/resumo.mjs`, `historico.js` e `explicacoes.js` |
| Forjas, equipamentos e comparação | `src/forjas.mjs`, `src/equipamentos.mjs` e `src/comparacao.mjs` |
| Panorama, radar e chefes | `src/panorama.mjs`, `src/radar.mjs` e `src/chefes.mjs` |
| Ficha, escolha de peças e engastes | `src/simulador/ficha.mjs`, `src/simulador/controles.mjs` e `estilos/ficha.css` |
| Regras, modo lista e builds salvas | `src/simulador/estado.mjs`, `src/simulador/tela.mjs`, `src/simulador/builds.mjs` e `compartilhamento.js` |
| Aparência e fonte | `style.css` para a base, `estilos/` por área e `aparencia.js`/`aparencia.css` para a preferência |

O navegador carrega os módulos diretamente. Cada módulo declara suas dependências com `import` e expõe com `export` o que outras áreas usam. Coloque eventos e seletores DOM no módulo dono da tela, e chame a função de configuração em `app.mjs` ao adicionar uma área. Mantenha a ordem das folhas de estilo no HTML, porque algumas regras dependem da cascata.

Para dividir uma mudança entre agentes, combine quem altera cada área e quem coordena os arquivos compartilhados. Por exemplo, dá para trabalhar na bancada do simulador e no radar em paralelo. Mudanças no cálculo de FC ou no catálogo podem afetar várias telas e precisam ser combinadas entre as áreas.

## Scripts de manutenção e análise

Todos os scripts exigem Node.js 18+ e aceitam `--ajuda` para ver todas as opções.

| Comando | Para que serve |
| --- | --- |
| `npm run diagnostico` | Roda todos os scripts abaixo em sequência (baixando o bundle uma única vez) e salva o resumo completo em `relatorio-diagnostico.md` (ignorado pelo Git). Aceita `-- --aplicar` e `-- --com-e2e`. |
| `npm run verificar:patch` | Baixa o bundle vivo do RiftStream, compara com a referência salva (`--salvar-referencia`) e aponta novos conjuntos, armas, anéis, zonas ou mudanças de combate em relação a `src/dados.mjs`. |
| `npm run atualizar:sprites` | Atualiza `sprites.js` direto do bundle vivo (validando em memória antes de salvar), atualiza o `?v=...` dos HTMLs e exporta os PNGs em `exports/` preservando arquivos manuais como `exports/itens/casulo-de-vexxaris.png`. |
| `npm run calibrar:curvas` | Varre perfis públicos do ranking via API, separa as amostras por peça e raridade, calcula a curva por nível (`atk`, `def`, `hp`, `crit`, `spd`) e marca curvas com menos de 3 amostras como provisórias. |
| `npm run auditar:monstros` | Confere as fórmulas de onda, chefes e lacaios de `src/dados.mjs` contra o cliente oficial, separando erro de parser (código `1`) de divergência de regra (código `2`). |
| `npm run verificar:release` | Confere se todas as referências locais em HTML/JS existem no disco, valida imports e exports nomeados em todos os módulos `.mjs`, alerta sobre `?v=...` pendentes (`--atualizar-cache-bust`) e roda `npm test` (`--com-e2e` para Playwright). |
| `npm run otimizar:build` | Simula combinações de conjuntos, anéis, gemas e distribuição exata de atributos via CLI (`--classe=cleric\|warrior\|archer`, `--objetivo=fc\|dps\|cura\|escudo-aurora\|resistencia-fisica`, `--nivel=750`, `--ilvl=300`). |

### Fluxo rápido após um patch do RiftStream

```sh
npm run verificar:patch                                      # 1. ver o que mudou no bundle do jogo
npm run atualizar:sprites                                    # 2. atualizar sprites.js e PNGs em exports/
npm run auditar:monstros                                     # 3. conferir fórmulas de ondas, chefes e lacaios
npm run calibrar:curvas                                      # 4. coletar curvas reais de peças novas equipadas
npm run verificar:release -- --atualizar-cache-bust          # 5. atualizar ?v=... e rodar testes
```

Opções úteis de `atualizar_sprites.mjs`:

```sh
npm run atualizar:sprites:validar                            # testa extração e validação sem gravar arquivos
node scripts/atualizar_sprites.mjs --somente-sprites         # atualiza só sprites.js e o cache-bust dos HTMLs
node scripts/atualizar_sprites.mjs --somente-pngs            # exporta só os PNGs em exports/
node scripts/atualizar_sprites.mjs --com-gifs                # também gera GIFs animados (requer ImageMagick "magick")
```

Exemplos de `otimizar_build.mjs`:

```sh
node scripts/otimizar_build.mjs --classe=cleric --objetivo=escudo-aurora --nivel=750 --ilvl=300
node scripts/otimizar_build.mjs --classe=warrior --objetivo=fc --nivel=750 --ilvl=300
node scripts/otimizar_build.mjs --classe=archer --objetivo=dps --nivel=750 --ilvl=300 --vit-min=15
```

Se novos ícones mudarem intencionalmente as capturas de referência, rode `npm run test:e2e:update` e confira visualmente o resultado.

## Problemas comuns

- **A página não abre:** confira se o terminal continua executando o servidor e se o endereço usa a porta `4173`.
- **“Address already in use” ou porta em uso:** pode haver outro servidor aberto nessa porta. Use o que já está rodando ou encerre a execução anterior antes de iniciar outra.
- **Falha ao consultar o jogo:** confira a conexão, o nick e a plataforma. O aplicativo depende da disponibilidade das APIs do RiftStream.
- **Arquivos antigos após uma alteração:** faça uma atualização forçada da página com `Cmd+Shift+R` no macOS ou `Ctrl+Shift+R` no Windows/Linux.

Use `servidor.py` em vez de abrir `index.html` diretamente ou iniciar um servidor estático genérico: ele também encaminha as consultas `/api/` ao jogo.
