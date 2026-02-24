
# Implementar Modulo de Impostos com Aliquota Customizavel e Valor Fixo MEI

## Resumo

Criar o modulo completo de Impostos permitindo que o usuario configure a porcentagem do imposto (aliquota) por empresa e tambem defina um valor fixo mensal para clientes MEI (Microempreendedor Individual), em vez de usar o percentual hardcoded de 6%.

## Nova tabela: `tax_settings`

Armazena as configuracoes de impostos por empresa:

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid | PK |
| company_id | uuid | FK para companies (unique) |
| tax_mode | text | "percentage" ou "fixed" |
| tax_percentage | numeric | Aliquota em % (ex: 6.0) |
| fixed_amount | numeric | Valor fixo mensal para MEI |
| created_at | timestamptz | Default now() |
| updated_at | timestamptz | Default now() |

- RLS: membros da empresa podem SELECT, INSERT, UPDATE
- Constraint UNIQUE em company_id (uma config por empresa)

## Nova tabela: `tax_payments`

Registra o status de pagamento de cada guia mensal:

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid | PK |
| company_id | uuid | FK para companies |
| reference_month | date | Primeiro dia do mes de competencia |
| tax_type | text | "DAS" |
| estimated_amount | numeric | Valor estimado |
| paid_amount | numeric | Valor pago (nullable) |
| due_date | date | Vencimento (dia 20 do mes seguinte) |
| paid_date | date | Data pagamento (nullable) |
| status | text | "pending", "paid", "overdue" |
| created_at | timestamptz | Default now() |

- RLS: membros da empresa podem SELECT, INSERT, UPDATE, DELETE
- Constraint UNIQUE em (company_id, reference_month, tax_type)

## Logica de calculo

- **Modo Percentual**: `Receita Bruta do mes * (tax_percentage / 100)`
- **Modo Fixo (MEI)**: usa o `fixed_amount` independente da receita
- Se nao houver configuracao, usa 6% como padrao

## Arquivos a criar

### 1. `src/pages/TaxesPage.tsx`
- Busca `tax_settings` da empresa (ou usa padrao 6%)
- Busca receitas mensais dos ultimos 12 meses
- Busca `tax_payments` para saber o que ja foi pago
- Calcula estimativas com base no modo configurado
- Renderiza cards de resumo, tabela de guias e grafico
- Botao para abrir configuracoes de impostos

### 2. `src/components/taxes/TaxSettingsDialog.tsx`
- Dialog para configurar o modo de imposto da empresa
- Radio group: "Percentual" ou "Valor Fixo (MEI)"
- Se percentual: campo para informar a aliquota (%)
- Se fixo: campo para informar o valor mensal (R$)
- Salva/atualiza na tabela `tax_settings`

### 3. `src/components/taxes/TaxSummaryCards.tsx`
- Card com DAS do mes atual (estimado ou fixo)
- Card com total pago no ano
- Card com guias vencidas

### 4. `src/components/taxes/TaxTable.tsx`
- Tabela com colunas: Competencia, Receita Bruta, Aliquota/Modo, Valor Estimado, Vencimento, Status, Acoes
- Badge colorido para status (Pendente=amarelo, Pago=verde, Vencido=vermelho)
- Botao para registrar pagamento

### 5. `src/components/taxes/TaxPaymentDialog.tsx`
- Dialog para registrar pagamento de uma guia
- Campos: valor pago, data do pagamento
- Insere/atualiza registro em `tax_payments`

### 6. `src/components/taxes/TaxChart.tsx`
- Grafico de barras: Estimado vs Pago nos ultimos 12 meses

## Arquivos a modificar

### 7. `src/App.tsx`
- Substituir PlaceholderPage na rota `/taxes` pelo TaxesPage

### 8. `src/i18n/translations.ts`
- Adicionar traducoes: taxManagement, taxSettings, taxMode, percentageMode, fixedMode, taxPercentage, fixedAmount, meiFixedValue, estimatedTax, paidAmount, referenceMonth, taxStatus, markAsPaid, totalPaidYear, overdueGuides, paymentDate, paymentRegistered, noTaxData, taxHistory, estimatedVsPaid, settingsSaved, taxRate, allYear, configuredRate, configuredFixedValue

### 9. `src/components/dashboard/TaxCard.tsx`
- Atualizar para buscar `tax_settings` e usar a aliquota/valor fixo configurado em vez do 6% hardcoded

## Detalhes tecnicos

### Fluxo do usuario

```text
1. Acessa /taxes
2. Clica em "Configurar Impostos" (engrenagem)
3. Escolhe modo: Percentual (ex: 6%) ou Fixo MEI (ex: R$ 75,60)
4. Salva
5. A tabela recalcula automaticamente os valores estimados
6. Para cada mes, pode clicar em "Registrar Pagamento"
7. Informa valor pago e data -> status muda para "Pago"
```

### Queries principais

- `tax_settings`: SELECT por company_id (unique, no maximo 1 registro)
- `revenues`: agrupados por mes para calcular receita bruta mensal
- `tax_payments`: SELECT por company_id + ano para historico

### Determinacao de status

- Se existe registro em `tax_payments` com status "paid" -> Pago
- Se data atual > vencimento e nao pago -> Vencido
- Caso contrario -> Pendente
