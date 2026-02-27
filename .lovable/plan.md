

## Módulo Pró-labore — Plano de Implementação

### O que é
Módulo para registrar retiradas de pró-labore dos sócios da empresa, com integração automática nos módulos de Despesas e DRE.

### 1. Banco de dados

Criar tabela `pro_labore`:

| Coluna | Tipo | Notas |
|--------|------|-------|
| id | uuid PK | gen_random_uuid() |
| company_id | uuid NOT NULL | |
| member_name | text NOT NULL | Nome do sócio |
| cpf | text | CPF do sócio (opcional) |
| amount | numeric NOT NULL | Valor bruto |
| inss_amount | numeric DEFAULT 0 | INSS retido |
| irrf_amount | numeric DEFAULT 0 | IRRF retido |
| net_amount | numeric NOT NULL | Valor líquido |
| reference_month | date NOT NULL | Mês de competência |
| payment_date | date | Data do pagamento efetivo |
| status | text DEFAULT 'pending' | pending / paid |
| notes | text | Observações |
| created_at | timestamptz DEFAULT now() | |

- RLS: `is_company_member(company_id, auth.uid())` para SELECT, INSERT, UPDATE, DELETE.
- Ao criar/atualizar pró-labore com status `paid`, criar/atualizar despesa vinculada via `source_type = 'pro_labore'` e `source_id = pro_labore.id`.
- Ao deletar, remover despesa vinculada.

### 2. Integração com módulos existentes

**Despesas (ExpenseTable):**
- Adicionar `pro_labore` aos mapas `sourceLabels` e `sourceTooltips` para exibir badge "Pró-labore" em despesas geradas automaticamente.

**DRE (DrePage):**
- Adicionar linha separada para Pró-labore entre Resultado Operacional e Resultado Líquido (já que é retirada de sócio, não despesa operacional). Buscar da tabela `pro_labore` diretamente.

**Dashboard:**
- Despesas de pró-labore já serão incluídas automaticamente via tabela `expenses` (source_type = 'pro_labore').

### 3. Componentes a criar

```text
src/pages/ProLaborePage.tsx           — Página principal (CRUD)
src/components/prolabore/
  ProLaboreTable.tsx                  — Tabela de registros
  ProLaboreForm.tsx                   — Dialog de criação/edição
  ProLaboreDetailDialog.tsx           — Dialog de visualização
```

### 4. Funcionalidades da página

- Listagem com filtros por período e status (pendente/pago)
- Criar novo pró-labore: nome do sócio, CPF, valor bruto, INSS, IRRF (cálculo automático do líquido)
- Marcar como pago (com data de pagamento) → gera despesa vinculada automaticamente
- Editar e excluir (com exclusão da despesa vinculada)
- Detalhes com breakdown: bruto, INSS, IRRF, líquido

### 5. Traduções

Adicionar ~20 chaves em pt-BR e en: `proLaboreTitle`, `newProLabore`, `memberName`, `cpf`, `grossAmount`, `inssAmount`, `irrfAmount`, `netAmount`, `referenceMonth`, `paymentDate`, `proLaboreExpense`, `managedByProLaboreModule`, etc.

### 6. Rota e sidebar

- Substituir `PlaceholderPage` por `ProLaborePage` na rota `/pro-labore` em `App.tsx`.
- Sidebar já está configurado.

### 7. Sequência de execução

1. Migration: criar tabela `pro_labore` com RLS
2. Criar componentes (Table, Form, DetailDialog, Page)
3. Adicionar traduções
4. Integrar na rota
5. Atualizar ExpenseTable (sourceLabels/sourceTooltips)
6. Atualizar DRE para incluir linha de pró-labore

