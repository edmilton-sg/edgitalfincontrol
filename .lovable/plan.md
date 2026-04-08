

## Limpar anexos ao deletar pagamento da folha

### Problema
Ao deletar um registro de payroll, apenas a despesa vinculada e o registro da folha são removidos. Os anexos (tabela `attachments` e arquivos no bucket `attachments`) permanecem no sistema, acumulando lixo.

### Solução
Atualizar o `deletePayrollMutation` em `src/pages/EmployeesPage.tsx` para:

1. Buscar todos os anexos com `record_type: 'payroll'` e `record_id: payroll.id`
2. Remover os arquivos físicos do Storage (`supabase.storage.from('attachments').remove([...paths])`)
3. Deletar os registros da tabela `attachments`
4. Depois deletar a despesa vinculada e o registro de payroll (como já faz)

### Alteração

**`src/pages/EmployeesPage.tsx`** — `deletePayrollMutation.mutationFn`:

```typescript
mutationFn: async (p: PayrollRow) => {
  // 1. Fetch attachments linked to this payroll
  const { data: atts } = await supabase
    .from("attachments")
    .select("id, file_path")
    .eq("record_type", "payroll")
    .eq("record_id", p.id);

  // 2. Remove files from storage
  if (atts?.length) {
    await supabase.storage
      .from("attachments")
      .remove(atts.map(a => a.file_path));
    // 3. Delete attachment records
    await supabase.from("attachments")
      .delete()
      .eq("record_type", "payroll")
      .eq("record_id", p.id);
  }

  // 4. Delete linked expense
  await supabase.from("expenses").delete()
    .eq("source_type", "payroll").eq("source_id", p.id);

  // 5. Delete payroll record
  const { error } = await supabase.from("payroll")
    .delete().eq("id", p.id);
  if (error) throw error;
}
```

Apenas um arquivo alterado, sem mudanças no banco de dados.

