## Integração bancária com Pluggy (Open Finance)

Substituir a página placeholder `/integrations/banking` por uma integração real com a Pluggy, usando suas credenciais guardadas com segurança no backend.

### Segurança das credenciais
O Client ID e o Client Secret que você colou no chat vão para os secrets do backend (`PLUGGY_CLIENT_ID`, `PLUGGY_CLIENT_SECRET`). Nunca ficam no código nem no navegador. Recomendo rotacionar o secret no painel da Pluggy depois, já que ele foi exposto em texto no chat.

### O que será construído

**1. Backend (edge functions)**
- `pluggy-connect-token`: autentica na Pluggy (API Key de 2h) e devolve um `connectToken` de curta duração para abrir o widget.
- `pluggy-sync`: lista contas e transações de cada `itemId` conectado e grava no banco.
- `pluggy-webhook`: recebe eventos da Pluggy (`item/updated`, `transactions/updated`) e dispara sincronização automática.

**2. Banco de dados**
- `bank_connections` — company_id, pluggy_item_id, institution_name, institution_logo, status, last_synced_at.
- `bank_accounts` — connection_id, pluggy_account_id, type (checking/credit), number, balance, currency.
- `bank_transactions` — company_id, account_id, pluggy_transaction_id (único), date, description, amount, type (credit/debit), category, status (pendente/importado/ignorado), linked_record_type/linked_record_id.
- RLS por `company_id` no padrão do projeto + GRANTs.

**3. Tela "Bancos" (`/integrations/banking`)**
- Lista de conexões com logo do banco, status, saldo e data da última sincronização.
- Botão "Conectar banco" abre o widget Pluggy Connect (`react-pluggy-connect`) — repetível para os 6 bancos.
- Ações por conexão: Sincronizar agora, Reconectar (quando as credenciais expirarem no banco), Remover (apaga item na Pluggy + registros locais, com o diálogo de exclusão detalhada padrão do sistema).

**4. Conciliação → Receitas e Despesas**
- Aba "Transações" com filtros por conta, período e status.
- Cada transação pode ser importada com um clique: crédito vira Receita, débito vira Despesa, com categoria sugerida pela Pluggy mapeada para as categorias da empresa.
- Importação em lote com seleção múltipla.
- Deduplicação por `pluggy_transaction_id`; transações já importadas ficam travadas com link para o registro de origem, seguindo o padrão read-only dos módulos derivados.
- Opção "Ignorar" para transferências internas e lançamentos irrelevantes.

**5. Dashboard**
- Card de saldo consolidado das contas conectadas e aviso quando houver transações pendentes de conciliação.

### Detalhes técnicos
- Fluxo Pluggy: `POST /auth` (client_id + secret → apiKey) → `POST /connect_token` → widget no frontend → `itemId` salvo → `GET /accounts?itemId=` e `GET /transactions?accountId=` na sincronização.
- Todas as chamadas à Pluggy acontecem em edge functions; o frontend só recebe o `connectToken`.
- Paginação de transações tratada no backend; primeira carga traz 12 meses.
- Datas formatadas via `src/lib/formatDate.ts`.
- Sincronização incremental por `from=<last_synced_at>`.
- Custo: o Conector 200 / sandbox atende testes; conexões reais de produção dependem do seu plano na Pluggy — a integração funciona igual nos dois casos.
