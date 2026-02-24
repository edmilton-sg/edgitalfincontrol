
# Corrigir Inconsistencia entre Cartoes e Despesas

## Problema Identificado

- O cartao "INTER PJ" (`a54a7768-...`) existe mas tem **0 transacoes** na tabela `card_transactions`
- A tabela `expenses` tem registros manuais mas **nenhum** vinculado a cartao (todos `source_type = null`)
- O usuario quer que despesas reflitam dados reais dos cartoes

## Acoes

### 1. Criar 10 transacoes no cartao INTER PJ

Inserir 10 registros em `card_transactions` com valores entre R$10 e R$100, datas variadas em janeiro/fevereiro 2026:

| Descricao | Valor | Data |
|-----------|-------|------|
| Uber | R$ 23,50 | 2026-01-15 |
| iFood | R$ 45,90 | 2026-01-18 |
| Netflix | R$ 39,90 | 2026-01-20 |
| Farmacia | R$ 67,80 | 2026-01-25 |
| Cafe | R$ 12,00 | 2026-01-28 |
| Posto Shell | R$ 89,00 | 2026-02-01 |
| Padaria | R$ 18,50 | 2026-02-05 |
| Mercado | R$ 95,40 | 2026-02-10 |
| Estacionamento | R$ 15,00 | 2026-02-15 |
| Livraria | R$ 52,00 | 2026-02-20 |

### 2. Criar despesas vinculadas para cada transacao

Para cada transacao inserida, criar o registro correspondente em `expenses` com:
- `source_type = "card_transaction"`
- `source_id = ID da transacao`
- `description = "[descricao] (INTER PJ)"`
- `payment_method = "creditCard"`

Isso garante que as despesas exibam o badge "Cartao" e sejam somente-leitura na pagina de despesas.

### 3. Nenhuma alteracao de codigo necessaria

O codigo ja esta correto:
- `CardTransactions.tsx` ja cria despesas vinculadas ao adicionar transacoes
- `ExpenseTable.tsx` ja exibe badges e protege edicao de despesas vinculadas
- `ExpensesPage.tsx` ja inclui `source_type` e `source_id` no mapeamento

A unica acao e inserir os dados corretos no banco.

## Resumo Tecnico

- **INSERT** 10 registros em `card_transactions` (company_id + card_id do INTER PJ)
- **INSERT** 10 registros correspondentes em `expenses` com rastreabilidade
- Sem alteracoes de codigo - apenas dados
