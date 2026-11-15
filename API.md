# API pública do RiftStream

Referência comunitária das rotas de leitura encontradas no cliente oficial e verificadas sem login em 15/11/2026. O RiftInfos usa parte dessas rotas. A API é mantida pelo RiftStream e pode mudar com atualizações do jogo.

## Acesso

- **URL base** `https://z6ywq6r3ub.execute-api.us-east-1.amazonaws.com`
- As rotas abaixo usam `GET` e retornam JSON. Para as consultas sem login, dispense tokens e cookies.
- No RiftInfos, o servidor local e a configuração do Netlify encaminham `/api/*` para a mesma API.

## Perfis

| Rota | Retorno | Parâmetros |
| --- | --- | --- |
| `/api/profile/{login}` | Perfil público, classes, nível, FC, atributos, equipamentos, gemas, contadores de forja e canais frequentados | `cls=warrior\|cleric\|archer` seleciona a classe. Use o nick na Twitch e `kick:nick` na Kick. Codifique o prefixo no caminho como `kick%3A`. |

## Rankings e lives

| Rota | Retorno | Parâmetros |
| --- | --- | --- |
| `/api/ranking/records` | Recordes e totais do servidor, incluindo melhor run, pico de jogadores e personagem de maior nível | — |
| `/api/ranking/characters` | Ranking de personagens, com posição, nome, classe, nível e FC | `page`, `size`, `q`, `sort`, `cls`, `platform` e `secondary` |
| `/api/ranking/runs` | Lives ordenadas pelo recorde de zona e onda | `page`, `size`, `q`, `online=true` |
| `/api/ranking/potential` | Lives ordenadas pelo potencial das últimas runs concluídas | `page`, `size`, `q`, `online=true` |
| `/api/ranking/crowds` | Lives ordenadas pelo pico de jogadores simultâneos | `page`, `size`, `q`, `online=true` |
| `/api/ranking/battles` | Lives ordenadas pelo desempenho no ranking de batalhas | `page`, `size`, `q`, `online=true` |
| `/api/ranking/channel/{canal}` | Zona e onda atuais, recorde, jogadores ativos, plataformas vinculadas, potencial, histórico de runs e batalhas | Use o login do canal, incluindo `kick%3A` quando o identificador tiver esse prefixo. |
| `/api/ranking/channel/{canal}/board` | Ranking dos jogadores de um canal | `board=strongest\|kills\|time\|waves\|now`, `page`, `size` |

Listas paginadas retornam `items`, `page`, `size` e `total`. No ranking de personagens, `sort=level` ordena por nível e `sort=ach` por conquistas. `cls` filtra a classe e `platform` aceita `twitch` ou `kick`. O cliente oficial também envia `secondary=true` quando inclui classes secundárias.

O potencial vem no campo `potential` dos rankings e em `potentialWaves` no detalhe do canal. É a média reportada pelo jogo das últimas cinco runs concluídas, ou das que já estiverem registradas. Uma run termina quando o grupo inteiro cai. O valor está em ondas acumuladas, como 176 ondas para **Z18–W6**. A lista `runs` do canal traz a zona, a onda, o total de ondas e a data de cada run registrada.

## Informações do jogo

| Rota | Retorno |
| --- | --- |
| `/api/wiki` | Eventos, conquistas, chances de forja e bônus de pergaminho |
| `/api/changelog` | Identificador da versão mais recente e lista de atualizações |
| `/api/notices` | Lista de avisos públicos |

## Configuração pública de integrações

| Rota | Retorno |
| --- | --- |
| `/api/auth/twitch/config` | ID público do cliente OAuth e URI de redirecionamento |
| `/api/auth/kick/config` | Disponibilidade da integração, ID público, URI de redirecionamento e escopos |
| `/api/bot/status` | Estado público da integração do bot da Twitch |
| `/api/bot/kick/status` | Estado público da integração do bot da Kick |

Rotas de conta, administração, compra e overlay com chave ficam fora desta referência. O escopo é a leitura pública oferecida pelo cliente web.

## Exemplos

```sh
BASE_URL=https://z6ywq6r3ub.execute-api.us-east-1.amazonaws.com

# Perfil de Clérigo na Twitch
curl -fsS "$BASE_URL/api/profile/nando_sts?cls=cleric"

# Perfil na Kick
curl -fsS "$BASE_URL/api/profile/kick%3Axxmarciano"

# Cinco lives online com maior potencial
curl -fsS "$BASE_URL/api/ranking/potential?page=1&size=5&online=true"

# Jogadores ativos de um canal
curl -fsS "$BASE_URL/api/ranking/channel/belky/board?board=now&page=1&size=20"
```

Links de referência do jogo. [Wiki do RiftStream](https://riftstream.com.br/wiki) · [Ranking oficial](https://riftstream.com.br/ranking)
