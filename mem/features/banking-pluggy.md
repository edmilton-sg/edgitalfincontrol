---
name: Integração bancária Pluggy
description: Conexões bancárias via Pluggy, sincronização e conciliação para Receitas/Despesas
type: feature
---
- Credenciais em secrets: `PLUGGY_CLIENT_ID`, `PLUGGY_CLIENT_SECRET`. Nunca no frontend.
- Edge functions: `pluggy-connect-token` (gera accessToken do widget), `pluggy-sync` (itens/contas/transações), `pluggy-webhook` (verify_jwt=false).
- Tabelas: `bank_connections`, `bank_accounts`, `bank_transactions` (dedupe por `pluggy_transaction_id`).
- Conciliação: crédito → Receita (`status: paid`); débito → Despesa com `source_type = 'bank_transaction'`. Status da transação: pending/imported/ignored.
- Widget: `react-pluggy-connect` com `includeSandbox`; reconexão usa `updateItem={pluggy_item_id}`.
- Webhook URL: `https://<project>.supabase.co/functions/v1/pluggy-webhook`.
