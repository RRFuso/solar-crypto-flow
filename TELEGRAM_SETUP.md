# Telegram Alerts — Setup

O SolCry entrega alertas de smart money via Telegram através de um bot. Este guia cobre a configuração ponta-a-ponta.

## 1. Criar o bot no @BotFather

1. Abra [@BotFather](https://t.me/BotFather) no Telegram e envie `/newbot`.
2. Escolha um nome (ex.: `SolCry Alerts`) e um **username** terminado em `bot` (ex.: `solcry_alerts_bot`).
3. O BotFather responde com um token no formato `123456789:ABCdef...`. **Guarde esse token** — é o `TELEGRAM_BOT_TOKEN`.

Recomendado:
- `/setdescription` — descrição do bot
- `/setuserpic` — avatar
- `/setcommands` — sugerido:
  ```
  start - Vincular sua conta enviando o código do app
  ```

## 2. Salvar o token como secret no Supabase

O secret `TELEGRAM_BOT_TOKEN` já foi criado no projeto via Lovable. Se precisar rotacionar:

- Dashboard → Project Settings → Edge Functions → Secrets → atualizar `TELEGRAM_BOT_TOKEN`.

## 3. Configurar o username do bot no frontend

Para habilitar o deep-link `https://t.me/SEU_BOT?start=CODIGO` (que preenche e envia o `/start` automaticamente), adicione no `.env` do projeto:

```
VITE_TELEGRAM_BOT_USERNAME=solcry_alerts_bot
```

Sem essa var, o usuário ainda consegue vincular — o painel mostra o código de 6 dígitos para envio manual.

## 4. Registrar o webhook do Telegram

O bot precisa saber pra onde entregar os updates. Aponte para a edge function `telegram-link`:

```bash
BOT_TOKEN="COLE_O_TOKEN_AQUI"
WEBHOOK_URL="https://bahshstcztvqmxiubslx.supabase.co/functions/v1/telegram-link"

curl -sS "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"${WEBHOOK_URL}\", \"allowed_updates\": [\"message\"]}"
```

Verificar:

```bash
curl -sS "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo"
```

Deve retornar `"url": "https://.../telegram-link"` e `"pending_update_count": 0`.

## 5. Fluxo de vinculação (usuário final)

1. Usuário abre o painel de alertas → seção **Telegram** → **Gerar código de vinculação**.
2. Frontend chama `telegram-link` (`action=generate`) e recebe um código de 6 dígitos válido por 10 minutos.
3. Usuário clica **Abrir bot no Telegram** — o deep-link envia `/start CODIGO` automaticamente pro bot.
4. O bot recebe o update via webhook, valida o código, salva `telegram_chat_id` em `user_alert_preferences` e responde "✅ Telegram vinculado!".
5. A partir daí, todo alerta gerado pelo `smart-money-alerts` que passe no filtro de severidade do usuário é enviado como mensagem no Telegram, em paralelo (`Promise.allSettled`) — falhas de envio não bloqueiam a criação do alerta no banco.

## 6. Desvincular

O painel oferece **Desvincular**, que zera `telegram_chat_id` e `telegram_linked_at`. Novo código pode ser gerado a qualquer momento.

## Troubleshooting

- **Bot não responde**: cheque `getWebhookInfo`; se `last_error_message` estiver preenchido, ajuste a URL ou reenvie `setWebhook`.
- **"Código inválido"**: código expirado (10 min) ou já usado — gere outro no app.
- **Alertas não chegam**: confirme que a severidade mínima do usuário não está filtrando os eventos e que `TELEGRAM_BOT_TOKEN` está presente nos secrets da edge function.
