
# Corrigir Dashboard para Exibir Dados Reais + Inserir Dados de Teste

## Problema

Todos os componentes do dashboard (SummaryCards, RevenueExpenseChart, BalanceChart, CashFlowCard, TaxCard, RecentTransactions) utilizam dados estaticos do arquivo `mockData.ts`, que estao todos zerados ou vazios. Nenhum componente busca dados do banco de dados.

## Solucao

### Parte 1: Inserir dados de teste no banco

Inserir registros nas tabelas `revenues` e `expenses` para a empresa `c279ffa7-6028-4b8a-971f-fa67d4126c98` (EDGITAL THINKING SERVICE), cobrindo os ultimos 6 meses com dados variados:

- **Revenues**: ~3-5 registros por mes (set/2025 a fev/2026), com valores entre R$2.000 e R$30.000, diferentes metodos de pagamento e status
- **Expenses**: ~3-5 registros por mes, com categorias variadas (Aluguel, Marketing, Software, Salarios, etc.), valores entre R$500 e R$8.000, mix de operacionais e pessoais

### Parte 2: Reescrever componentes do dashboard

Todos os componentes serao alterados para buscar dados reais via `useQuery` + Supabase, usando o `selectedCompanyId` do `CompanyContext`.

#### 2.1 `SummaryCards.tsx`
- Buscar revenues e expenses do mes atual e do mes anterior
- Calcular: Receita Bruta mensal, Despesa mensal, Saldo (receita - despesa), Lucro Operacional
- Calcular variacao percentual vs mes anterior

#### 2.2 `RevenueExpenseChart.tsx`
- Buscar revenues e expenses dos ultimos 6 meses
- Agrupar por mes e calcular totais de receita liquida e despesas
- Renderizar o grafico de barras com dados reais

#### 2.3 `BalanceChart.tsx`
- Buscar revenues e expenses dos ultimos 6 meses
- Calcular saldo acumulado mes a mes (receita liquida - despesas)
- Renderizar o grafico de area com dados reais

#### 2.4 `CashFlowCard.tsx`
- Buscar revenues do mes atual
- Calcular "Realizado" (status = paid) vs "Projetado" (total do mes)
- Mostrar percentual de realizacao

#### 2.5 `TaxCard.tsx`
- Calcular uma estimativa de DAS baseada na receita bruta do mes (aliquota simplificada de 6%)
- Exibir vencimento no dia 20 do mes seguinte

#### 2.6 `RecentTransactions.tsx`
- Buscar as 10 transacoes mais recentes (revenues + expenses combinadas)
- Exibir com valores positivos (receitas) e negativos (despesas)

### Parte 3: Limpar mockData.ts
- Remover as constantes de dashboard (summaryData, monthlyData, etc.) que nao serao mais utilizadas
- Manter apenas os tipos (Revenue, Expense, etc.)

## Arquivos modificados

- `src/components/dashboard/SummaryCards.tsx` - buscar dados reais
- `src/components/dashboard/RevenueExpenseChart.tsx` - buscar dados reais
- `src/components/dashboard/BalanceChart.tsx` - buscar dados reais
- `src/components/dashboard/CashFlowCard.tsx` - buscar dados reais
- `src/components/dashboard/TaxCard.tsx` - buscar dados reais
- `src/components/dashboard/RecentTransactions.tsx` - buscar dados reais
- `src/data/mockData.ts` - remover constantes de dashboard nao usadas

## Detalhes tecnicos

Cada componente seguira o padrao:
```text
1. import useCompany, useQuery, supabase
2. Obter selectedCompanyId do CompanyContext
3. useQuery com queryKey incluindo companyId e periodo
4. Buscar revenues/expenses com filtros de data e company_id
5. Calcular metricas a partir dos dados retornados
6. Renderizar com loading state (Skeleton) quando carregando
```

Os dados de teste serao inseridos via ferramenta de insert SQL diretamente nas tabelas revenues e expenses.
