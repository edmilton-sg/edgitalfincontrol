

# Integrar Modulos: Impostos e Cartoes Refletem em Despesas

## Resumo

Criar um sistema de integracao entre modulos para que dados de impostos pagos e transacoes de cartao de credito aparecam automaticamente como despesas. Isso garante consistencia nos dados e no DRE, que ja calcula tudo a partir da tabela `expenses`.

## Problema Atual

Cada modulo opera de forma isolada:
- **Impostos**: pagamentos registrados em `tax_payments` nao aparecem nas despesas nem no DRE
- **Cartoes**: transacoes em `card_transactions` nao aparecem nas despesas nem no DRE
- **Funcionarios / Pro-labore**: ainda sao placeholders, mas precisam estar preparados para o mesmo padrao

O DRE e os graficos do dashboard calculam tudo a partir da tabela `expenses`, entao se os impostos e cartoes nao geram registros la, os numeros ficam inconsistentes.

## Solucao: Coluna de Rastreabilidade + Sincronizacao Automatica

### 1. Nova migration: adicionar colunas de rastreabilidade na tabela `expenses`

Adicionar duas colunas para rastrear a origem de despesas geradas automaticamente:

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| source_type | text (nullable) | Tipo da origem: "tax_payment", "card_transaction", "employee", "pro_labore" |
| source_id | uuid (nullable) | ID do registro de origem |

Constraint UNIQUE em `(source_type, source_id)` para evitar duplicatas.

Despesas manuais terao ambas as colunas nulas. Despesas geradas automaticamente terao ambas preenchidas e serao exibidas como somente-leitura no modulo de Despesas.

### 2. Impostos -> Despesas

Quando o usuario registra um pagamento de imposto (no `TaxPaymentDialog`), alem de salvar em `tax_payments`, tambem inserir um registro em `expenses`:

- **date**: data do pagamento (`paid_date`)
- **description**: "DAS - [Mes/Ano da competencia]"
- **category**: "impostos" (ou criar automaticamente se nao existir)
- **amount**: valor pago (`paid_amount`)
- **payment_method**: "other"
- **source_type**: "tax_payment"
- **source_id**: ID do `tax_payment`
- **is_personal**: false

Se o imposto ja tinha uma despesa vinculada (re-edicao), atualizar em vez de criar duplicata.

### 3. Cartoes -> Despesas

Quando o usuario adiciona/importa uma transacao de cartao, tambem inserir em `expenses`:

- **date**: data da transacao
- **description**: descricao da transacao + " (Cartao [nome])"
- **category**: categoria da transacao (se houver)
- **amount**: valor da transacao
- **payment_method**: "creditCard"
- **installment_number / installment_total**: mesmos valores
- **source_type**: "card_transaction"
- **source_id**: ID da transacao
- **is_personal**: false

Ao editar ou deletar uma transacao de cartao, a despesa vinculada tambem deve ser atualizada ou removida.

### 4. Protecao de despesas vinculadas

No modulo de Despesas, despesas com `source_type` preenchido:
- Exibem um badge indicando a origem (ex: "Cartao", "Imposto")
- Nao podem ser editadas/deletadas diretamente (botoes desabilitados)
- Exibem uma dica de que devem ser gerenciadas no modulo de origem

### 5. DRE automaticamente correto

Como o DRE ja le tudo de `expenses`, nao precisa de alteracao. Os impostos e cartoes aparecerao automaticamente nas categorias corretas.

## Arquivos a Modificar

### Migration SQL
- Adicionar `source_type` e `source_id` na tabela `expenses`
- Criar indice UNIQUE em `(source_type, source_id)` onde ambos nao sao nulos

### `src/components/taxes/TaxPaymentDialog.tsx`
- Apos salvar o pagamento, inserir/atualizar despesa vinculada com `source_type = "tax_payment"`

### `src/components/cards/CardTransactions.tsx`
- Nos mutations `addTx`, `updateTx`, `deleteTx`: sincronizar com `expenses`
- Buscar o nome do cartao para compor a descricao da despesa

### `src/components/cards/InvoiceImportDialog.tsx`
- Ao importar transacoes em lote, tambem criar despesas vinculadas

### `src/components/expenses/ExpenseTable.tsx`
- Exibir badge de origem quando `source_type` existe
- Desabilitar botoes de editar/deletar para despesas vinculadas

### `src/components/expenses/ExpenseForm.tsx`
- Nenhuma alteracao necessaria (despesas vinculadas nao abrem o form)

### `src/pages/ExpensesPage.tsx`
- Ajustar handlers para nao permitir edicao/exclusao de despesas vinculadas
- Incluir `source_type` e `source_id` no mapeamento de dados

### `src/data/mockData.ts`
- Adicionar `source_type?` e `source_id?` ao type `Expense`

### `src/i18n/translations.ts`
- Adicionar traducoes: `linkedExpense`, `managedByTaxModule`, `managedByCardModule`, `taxExpense`, `cardExpense`, `linkedSource`

## Detalhes Tecnicos

### Sincronizacao de cartoes (fluxo)

```text
addTx.mutate() -> insere card_transaction -> pega ID retornado
                -> insere expense com source_type="card_transaction", source_id=ID

updateTx.mutate() -> atualiza card_transaction
                   -> atualiza expense WHERE source_type="card_transaction" AND source_id=ID

deleteTx.mutate() -> deleta expense WHERE source_type="card_transaction" AND source_id=ID
                   -> deleta card_transaction
```

### Sincronizacao de impostos (fluxo)

```text
handleSave() -> insere/atualiza tax_payment -> pega paymentId
             -> upsert expense: 
                WHERE source_type="tax_payment" AND source_id=paymentId
                INSERT ou UPDATE conforme existencia
```

### Importacao de faturas (fluxo)

```text
importar transacoes -> para cada transacao inserida com sucesso:
                    -> inserir expense vinculada com source_type="card_transaction"
```

### Query de despesas ajustada

A query de despesas em `ExpensesPage` precisa incluir `source_type` e `source_id` no SELECT para exibir corretamente o badge e controlar a editabilidade.

## Preparacao para Funcionarios e Pro-labore

A estrutura com `source_type` + `source_id` ja esta preparada. Quando esses modulos forem implementados, basta seguir o mesmo padrao:
- `source_type = "employee"` para folha de pagamento
- `source_type = "pro_labore"` para pro-labore
- Inserir em `expenses` ao registrar pagamentos nesses modulos

## Sequencia de Implementacao

1. Migration: adicionar colunas `source_type` e `source_id` em `expenses`
2. Atualizar types em `mockData.ts`
3. Atualizar `TaxPaymentDialog` para gerar despesa ao pagar
4. Atualizar `CardTransactions` para sincronizar CRUD com despesas
5. Atualizar `InvoiceImportDialog` para criar despesas ao importar
6. Atualizar `ExpenseTable` para exibir badges e proteger edicao
7. Atualizar `ExpensesPage` para incluir campos de rastreabilidade
8. Adicionar traducoes

