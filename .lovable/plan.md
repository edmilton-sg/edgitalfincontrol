

# Remover Campo "Fixa" de Despesas (Redundancia com Recorrente)

## Resumo

O campo "Fixa" (is_fixed) e o campo "Recorrente" (is_recurring) representam conceitos sobrepostos. A proposta e remover o campo "Fixa" de toda a interface, mantendo apenas "Recorrente" com seus intervalos (semanal, mensal, anual).

## Alteracoes

### 1. Formulario de Despesas (`ExpenseForm.tsx`)
- Remover `is_fixed` do schema Zod e dos defaultValues
- Remover o Switch "Fixa" do formulario (linhas 207-212)
- No onSubmit, setar `is_fixed: false` fixo no objeto Expense para compatibilidade com o banco

### 2. Tabela de Despesas (`ExpenseTable.tsx`)
- Remover a coluna "Fixa" do header
- Remover a celula com icone Check/X de is_fixed
- Ajustar o colSpan do footer

### 3. Dialog de Detalhes (`ExpenseDetailDialog.tsx`)
- Remover a linha que exibe "Fixa" com Check/X

### 4. Filtros de Despesas (`ExpenseFilters.tsx`)
- Remover o filtro de tipo (fixo/variavel) completamente
- Remover as props `typeFilter` e `onTypeChange`

### 5. Pagina de Despesas (`ExpensesPage.tsx`)
- Remover o estado `typeFilter` e `setTypeFilter`
- Remover a logica de filtro `matchType` no useMemo
- Remover as props de tipo do componente `ExpenseFilters`

### 6. Tipo Expense (`mockData.ts`)
- Manter `is_fixed` no tipo por compatibilidade com o banco, mas ele nao sera mais exibido/editado na interface

## Arquivos modificados

- `src/components/expenses/ExpenseForm.tsx`
- `src/components/expenses/ExpenseTable.tsx`
- `src/components/expenses/ExpenseDetailDialog.tsx`
- `src/components/expenses/ExpenseFilters.tsx`
- `src/pages/ExpensesPage.tsx`

