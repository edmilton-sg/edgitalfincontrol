

## Corrigir visualização de anexos e adicionar detalhes de pagamento

### Problema
Os anexos da folha são salvos com `record_type: 'payroll'`, mas ao visualizar a despesa vinculada, o sistema busca `record_type: 'expense'` — não encontra nada. Além disso, não existe dialog de detalhes da folha de pagamento.

### Alterações

**1. FileAttachments — adicionar suporte a `payroll`**
- `src/components/shared/FileAttachments.tsx`: Adicionar `"payroll"` ao union type de `recordType`

**2. ExpensesPage — buscar anexos do payroll para despesas vinculadas**
- `src/pages/ExpensesPage.tsx`: Na função `loadAttachments`, quando a despesa tiver `source_type === 'payroll'`, buscar anexos com `record_id: source_id` e `record_type: 'payroll'` em vez de `record_type: 'expense'`

**3. Novo componente `PayrollDetailDialog`**
- Criar `src/components/employees/PayrollDetailDialog.tsx`
- Exibir dados da folha: mês referência, bruto, INSS, IRRF, FGTS, líquido, status, data pagamento
- Exibir nome do funcionário
- Incluir `FileAttachments` com `recordType: 'payroll'` e `readOnly` para mostrar os comprovantes anexados

**4. PayrollTable — adicionar botão de visualizar detalhes**
- Adicionar ícone `Eye` nas ações de cada linha
- Adicionar prop `onView` ao componente

**5. EmployeesPage — integrar o dialog de detalhes**
- Adicionar state para `viewPayroll`
- Buscar anexos ao abrir o detalhe
- Renderizar `PayrollDetailDialog`

**6. Traduções**
- Adicionar chaves: `payrollDetails`, `noAttachments` (se não existir), `paymentDate`

### Fluxo corrigido
- **Folha de pagamento**: clica no ícone de olho → abre `PayrollDetailDialog` com dados + anexos (`record_type: 'payroll'`)
- **Despesas**: ao ver detalhe de despesa vinculada a payroll → busca anexos via `source_id` com `record_type: 'payroll'`

