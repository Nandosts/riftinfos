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

## Problemas comuns

### Calculadora do mercado

Abra `http://127.0.0.1:4173/mercado.html`. A calculadora lê a última consulta compartilhada em `dados/mercado.json`, publicada pelo mantenedor. A atualização é por commit no GitHub. A extensão de coleta é de uso particular e não faz parte deste repositório nem da distribuição do site.

Os anúncios publicados não incluem nomes dos vendedores, autenticação, marcadores da conta ou receitas pessoais. `src/mercado/publicacao.mjs` aplica a lista de campos permitidos antes da publicação. Preços e atributos são os exibidos no mercado; não há histórico de vendas concluídas. Os nomes de vendedores são substituídos por grupos anônimos dentro de cada consulta. Ainda é possível reconhecer um anúncio pelas características públicas da peça.

O modelo fica em `src/mercado/modelo.mjs`. `npm test` cobre o cálculo e a remoção de campos privados; `npx playwright test tests/e2e/mercado.spec.mjs` verifica a tela no desktop e no celular com dados de teste. Quando não existe consulta publicada, a tela informa a ausência e não inventa preços. Chance e custo pessoal de forja não são publicados como regra global.

### Execução e consultas

- **A página não abre:** confira se o terminal continua executando o servidor e se o endereço usa a porta `4173`.
- **“Address already in use” ou porta em uso:** pode haver outro servidor aberto nessa porta. Use o que já está rodando ou encerre a execução anterior antes de iniciar outra.
- **Falha ao consultar o jogo:** confira a conexão, o nick e a plataforma. O aplicativo depende da disponibilidade das APIs do RiftStream.
- **Arquivos antigos após uma alteração:** faça uma atualização forçada da página com `Cmd+Shift+R` no macOS ou `Ctrl+Shift+R` no Windows/Linux.

Use `servidor.py` em vez de abrir `index.html` diretamente ou iniciar um servidor estático genérico: ele também encaminha as consultas `/api/` ao jogo.
