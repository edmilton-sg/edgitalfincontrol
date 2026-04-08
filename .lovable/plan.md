

## Limpeza de Storage + Notificações detalhadas + Arquivamento de Cartões

### Resumo
Três melhorias transversais:
1. **Notificações detalhadas nas exclusões** — antes de confirmar, informar ao usuário exatamente o que será deletado (anexos, despesas vinculadas, transações, etc.)
2. **Limpeza completa de Storage** em todos os módulos que ainda não fazem (Cartões, Transações de Cartão, Pró-labore)
3. **Opção de arquivar cartão** em vez de deletar, mantendo o cartão e seus registros como histórico

---

### Migration — Adicionar coluna `status` à tabela `credit_cards`

```sql
ALTER TABLE public.credit_cards
  ADD COLUMN status text NOT NULL DEFAULT 'active';
```

Valores possíveis: `'active'` e `'archived'`.

---

### Alterações

**1. `DeleteConfirmDialog` — aceitar descrição customizada**

Adicionar prop opcional `details: string` para exibir a lista do que será deletado abaixo da mensagem padrão. Cada chamador passará uma descrição contextual.

**2. `CardsPage.tsx` — Dialog de exclusão com 3 opções**

Substituir o `DeleteConfirmDialog` por um dialog customizado para cartões com 3 ações:
- **Arquivar**: atualiza `status` para `'archived'`, mantém tudo
- **Deletar tudo**: remove transações + anexos (storage + BD) + despesas vinculadas + cartão
- **Cancelar**

Antes de abrir o dialog, fazer uma contagem rápida (transações, anexos) para exibir na mensagem:
> "Este cartão possui X transações, Y anexos e Z despesas vinculadas. Deseja arquivar (manter como registro) ou deletar permanentemente?"

Na exclusão completa, adicionar limpeza de Storage:
```typescript
// Buscar anexos do cartão e de suas transações
const txIds = transactions.map(t => t.id);
const { data: atts } = await supabase.from("attachments").select("file_path")
  .or(`record_id.eq.${cardId},record_id.in.(${txIds.join(",")})`);
if (atts?.length) {
  await supabase.storage.from("attachments").remove(atts.map(a => a.file_path));
}
// Deletar registros de attachments, transações, despesas, cartão
```

**3. `CardList.tsx` — separar cartões ativos de arquivados**

- Filtrar e exibir cartões `active` normalmente
- Exibir cartões `archived` em seção separada "Arquivados" com visual esmaecido (opacity)
- Cartões arquivados: somente ações de visualizar e deletar (sem editar)
- Adicionar botão "Desarquivar" nos arquivados

**4. `CardTransactions.tsx` — limpeza de Storage ao deletar transação**

Antes de deletar transação e despesa vinculada:
```typescript
const { data: atts } = await supabase.from("attachments").select("file_path")
  .eq("record_id", id);
if (atts?.length) {
  await supabase.storage.from("attachments").remove(atts.map(a => a.file_path));
  await supabase.from("attachments").delete().eq("record_id", id);
}
```

Exibir na notificação: "Transação e X anexo(s) serão deletados."

**5. `ProLaborePage.tsx` — limpeza de Storage ao deletar**

Antes de deletar pró-labore e despesa vinculada:
```typescript
const { data: atts } = await supabase.from("attachments").select("file_path")
  .eq("record_type", "pro_labore").eq("record_id", row.id);
if (atts?.length) {
  await supabase.storage.from("attachments").remove(atts.map(a => a.file_path));
  await supabase.from("attachments").delete().eq("record_type", "pro_labore").eq("record_id", row.id);
}
```

**6. Notificações detalhadas em todos os módulos**

Cada módulo passará `details` ao `DeleteConfirmDialog`:

| Módulo | Mensagem |
|---|---|
| Receitas | "A receita e X anexo(s) serão removidos permanentemente." |
| Despesas | "A despesa e X anexo(s) serão removidos permanentemente." |
| Folha | "O pagamento, X anexo(s) e a despesa vinculada serão removidos." |
| Pró-labore | "O registro, X anexo(s) e a despesa vinculada serão removidos." |
| Transação cartão | "A transação, X anexo(s) e a despesa vinculada serão removidos." |
| Funcionário | "O funcionário e todos os registros de folha vinculados serão removidos." |

Para obter a contagem, buscar os anexos ao abrir o dialog (antes da confirmação).

**7. Traduções**

Novas chaves: `archiveCard`, `unarchiveCard`, `archivedCards`, `deleteCardDetails`, `deleteTransactionDetails`, `deletePayrollDetails`, `deleteProLaboreDetails`, `deleteRevenueDetails`, `deleteExpenseDetails`, `deleteEmployeeDetails`, `archiveOrDelete`, `archiveDescription`, `deleteAllDescription`, `cardArchived`, `cardUnarchived`

---

### Arquivos alterados
- `supabase/migrations/` — nova migration (coluna `status` em `credit_cards`)
- `src/components/shared/DeleteConfirmDialog.tsx` — prop `details`
- `src/pages/CardsPage.tsx` — dialog de arquivar/deletar, limpeza storage, contagem
- `src/components/cards/CardList.tsx` — seção arquivados, visual, desarquivar
- `src/components/cards/CardTransactions.tsx` — limpeza storage, notificação detalhada
- `src/pages/ProLaborePage.tsx` — limpeza storage, notificação detalhada
- `src/pages/ExpensesPage.tsx` — notificação detalhada
- `src/pages/RevenuesPage.tsx` — notificação detalhada
- `src/pages/EmployeesPage.tsx` — notificação detalhada
- `src/i18n/translations.ts` — novas chaves

