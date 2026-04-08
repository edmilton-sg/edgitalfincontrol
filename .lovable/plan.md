

## Suporte a Funcionários PJ no Módulo de Funcionários

### Resumo
Adicionar campo de regime de contratação (CLT ou PJ) ao cadastro de funcionários. Funcionários PJ não terão descontos (INSS, IRRF, FGTS) na folha e poderão informar CNPJ além do CPF.

### Alterações no Banco de Dados

**Migration** — Adicionar 2 colunas à tabela `employees`:
- `employment_type` (text, default `'clt'`) — regime: `'clt'` ou `'pj'`
- `cnpj` (text, nullable) — CNPJ da empresa do prestador PJ

### Alterações nos Componentes

**1. EmployeeForm** (`src/components/employees/EmployeeForm.tsx`)
- Adicionar campo de seleção "Regime" com opções CLT e PJ
- Adicionar campo CNPJ (visível apenas quando regime = PJ)
- Passar `employment_type` e `cnpj` no submit

**2. EmployeeTable** (`src/components/employees/EmployeeTable.tsx`)
- Adicionar coluna "Regime" exibindo badge CLT ou PJ
- Exibir CNPJ na coluna de documentos quando PJ (ou manter CPF quando CLT)

**3. EmployeeDetailDialog** (`src/components/employees/EmployeeDetailDialog.tsx`)
- Exibir regime e CNPJ nos detalhes

**4. PayrollDialog** (`src/components/employees/PayrollDialog.tsx`)
- Quando funcionário for PJ: pular `calcPayroll`, zerar INSS/IRRF/FGTS
- Salário líquido = bruto + adições - deduções (sem encargos)
- Ocultar seção de encargos calculados ou exibir todos como R$ 0,00

**5. PayrollTable** (`src/components/employees/PayrollTable.tsx`)
- Sem alteração estrutural; os valores já virão zerados para PJ

**6. EmployeesPage** (`src/pages/EmployeesPage.tsx`)
- Ao marcar folha como paga para PJ: despesa = `gross_salary` (sem FGTS)

**7. Traduções** (`src/i18n/translations.ts`)
- Adicionar chaves: `employmentType`, `clt`, `pj`, `cnpj` (CNPJ já pode existir), `employeeCnpj`

### Detalhes Técnicos

A lógica principal está no `PayrollDialog`: verificar o `employment_type` do employee e, se for `'pj'`, retornar `{ inss: 0, irrf: 0, fgts: 0, net: gross + additions - deductions }` em vez de chamar `calcPayroll`.

Na `EmployeesPage`, o `markPaidMutation` atualmente calcula a despesa como `gross_salary + fgts_amount`. Para PJ, `fgts_amount` já será 0, então não precisa de ajuste adicional.

