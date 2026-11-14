# RiftInfos · Rift Forjas

Aplicativo web para consultar personagens do RiftStream, analisar forjas e equipamentos, simular builds, comparar jogadores e acompanhar lives.

## Requisitos

- Python 3.10 ou superior.
- Um navegador atualizado.
- Conexão com a internet para consultar as APIs públicas do jogo e carregar a fonte visual.

O servidor usa apenas a biblioteca padrão do Python. Não é necessário instalar pacotes com `pip`, Node.js ou executar um build para usar o aplicativo.

## Rodar localmente

Abra um terminal na pasta `rift-forjas`, onde está o arquivo `servidor.py`.

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

## Problemas comuns

- **A página não abre:** confira se o terminal continua executando o servidor e se o endereço usa a porta `4173`.
- **“Address already in use” ou porta em uso:** pode haver outro servidor aberto nessa porta. Use o que já está rodando ou encerre a execução anterior antes de iniciar outra.
- **Falha ao consultar o jogo:** confira a conexão, o nick e a plataforma. O aplicativo depende da disponibilidade das APIs do RiftStream.
- **Arquivos antigos após uma alteração:** faça uma atualização forçada da página com `Cmd+Shift+R` no macOS ou `Ctrl+Shift+R` no Windows/Linux.

Use `servidor.py` em vez de abrir `index.html` diretamente ou iniciar um servidor estático genérico: ele também encaminha as consultas `/api/` ao jogo.
