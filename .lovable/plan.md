
# Implementar Modulo DRE (Demonstracao do Resultado do Exercicio)

## Resumo

O DRE e um relatorio financeiro que mostra as receitas, despesas e o resultado (lucro ou prejuizo) de um periodo. Ele sera construido a partir dos dados ja existentes nas tabelas `revenues` e `expenses`, sem necessidade de novas tabelas no banco.

## Estrutura do DRE

```text
(+) Receita Bruta
(-) Deducoes (taxas/fees)
(=) Receita Liquida
(-) Despesas Operacionais (agrupadas por categoria)
(=) Resultado Operacional (EBITDA)
(-) Despesas Pessoais
(=) Resultado Liquido
```

## Funcionalidades

- Filtro por periodo (mes/ano) com seletor de mes
- Visualizacao em formato de tabela hierarquica com linhas de totais
- Grafico de barras comparando meses (ultimos 6 ou 12 meses)
- Indicadores de variacao percentual vs mes anterior
- Exportar/imprimir (botao futuro, placeholder)

## Arquivos a criar/modificar

### 1. Nova pagina `src/pages/DrePage.tsx`
- Componente principal com filtro de periodo (mes/ano)
- Busca dados de `revenues` e `expenses` do periodo selecionado via useQuery
- Calcula as linhas do DRE a partir dos dados brutos
- Renderiza o componente DreTable e DreChart

### 2. Novo componente `src/components/dre/DreTable.tsx`
- Tabela hierarquica com as linhas do DRE
- Linhas de grupo (Receita Bruta, Deducoes, Despesas por categoria, etc.)
- Linhas de resultado com destaque visual (negrito, cor verde/vermelha)
- Coluna de valor e coluna de percentual sobre receita bruta (analise vertical)

### 3. Novo componente `src/components/dre/DreChart.tsx`
- Grafico de barras com Recharts mostrando Receita Liquida vs Despesas vs Resultado nos ultimos meses
- Reutiliza padroes do RevenueExpenseChart existente

### 4. Novo componente `src/components/dre/DrePeriodFilter.tsx`
- Seletor de mes/ano para navegar entre periodos
- Botoes de anterior/proximo mes

### 5. Modificar `src/App.tsx`
- Substituir o PlaceholderPage da rota `/dre` pelo novo DrePage

### 6. Modificar `src/i18n/translations.ts`
- Adicionar traducoes para os labels do DRE:
  - grossRevenue, deductions, netRevenue, operatingExpenses, operatingResult, personalExpenses, netResult, percentOfRevenue, period, previousMonth, nextMonth, incomeStatement, noDataForPeriod

## Detalhes tecnicos

### Calculo do DRE (dentro do DrePage)
- **Receita Bruta**: soma de `gross_amount` de todas as revenues do periodo
- **Deducoes**: soma de `fee_amount` de todas as revenues
- **Receita Liquida**: soma de `net_amount` (ou Bruta - Deducoes)
- **Despesas Operacionais**: soma de `amount` de expenses onde `is_personal = false`, agrupadas por categoria
- **Despesas Pessoais**: soma de `amount` de expenses onde `is_personal = true`
- **Resultado Operacional**: Receita Liquida - Despesas Operacionais
- **Resultado Liquido**: Resultado Operacional - Despesas Pessoais

### Queries
- Revenues: `supabase.from("revenues").select("*").eq("company_id", id).gte("date", startOfMonth).lte("date", endOfMonth)`
- Expenses: `supabase.from("expenses").select("*").eq("company_id", id).gte("date", startOfMonth).lte("date", endOfMonth)`
- Para o grafico mensal: buscar os ultimos 6 meses de dados

### Componentes UI reutilizados
- Card, Table (shadcn/ui)
- Recharts (BarChart) - mesmo padrao do dashboard
- Select para periodo
- formatCurrency do `src/lib/formatCurrency.ts`
