# API autenticada do RiftStream

**URL base** `https://z6ywq6r3ub.execute-api.us-east-1.amazonaws.com`

Sessão do jogador via `Authorization: Bearer <token>`.

## Consultas e prévias do jogador

- `GET /api/me`
- `GET /api/me/character`
- `GET /api/me/items/{id}/compare`
- `GET /api/me/items/{id}/gem-preview`
- `GET /api/me/items/fuse-streaks`
- `POST /api/me/items/enhance/preview`
- `GET /api/me/gems/combine-all`
- `GET /api/me/alchemy`
- `GET /api/me/chest-purchase`

## Ações do jogador

- `POST /api/me/character`
- `POST /api/me/character/switch`
- `POST /api/me/character/stats/{atributo}`
- `POST /api/me/items/{id}/equip`
- `POST /api/me/items/{id}/unequip`
- `POST /api/me/items/{id}/favorite`
- `POST /api/me/items/{id}/move`
- `POST /api/me/items/organize`
- `POST /api/me/items/{id}/sell`
- `POST /api/me/items/sell-selected`
- `POST /api/me/items/sell-all`
- `POST /api/me/items/fuse`
- `POST /api/me/items/fuse-all`
- `POST /api/me/items/enhance`
- `POST /api/me/items/transmog`
- `POST /api/me/items/{id}/socket`
- `POST /api/me/items/{id}/unsocket`
- `POST /api/me/gems/combine`
- `POST /api/me/gems/supreme`
- `POST /api/me/gems/combine-all`
- `POST /api/me/alchemy/destroy`
- `POST /api/me/alchemy/craft`
- `POST /api/me/alchemy/upgrade`
- `POST /api/me/chest-purchase`
- `POST /api/me/items/{id}/raid`
- `POST /api/me/redeem`

## Loja e mercado

- `GET /api/shop`
- `GET /api/auction`
- `GET /api/auction/mine`
- `POST /api/auction/list`
- `POST /api/auction/{id}/buy`
- `POST /api/auction/{id}/cancel`
- `POST /api/shop/buy-aura`
- `POST /api/shop/vip`
- `PUT /api/shop/autosell`
- `POST /api/shop/pix`
- `GET /api/shop/pix/{id}`

## Canal e integrações

- `GET /api/channel`
- `POST /api/channel`
- `PUT /api/channel`
- `GET /api/channel/players`
- `GET /api/channel/players/{id}`
- `POST /api/channel/rotate-key`
- `POST /api/channel/twitch-link`
- `POST /api/channel/kick-link`
- `DELETE /api/channel/kick-link`
- `POST /api/channel/kick-sync`
- `POST /api/bot/callback`
- `POST /api/bot/kick/callback`
- `DELETE /api/channel/bot-auth`

## Login

- `POST /api/auth/twitch/callback`
- `POST /api/auth/kick/callback`
