
# Corrigir Exclusao de Cartao

## Problema

Race condition: o `AlertDialogAction` fecha o dialog automaticamente ao ser clicado, o que dispara `onOpenChange(false)` e seta `deletingCard = null` antes da mutation executar. A mutation verifica `if (!deletingCard) return` e nao faz nada, mas o `onSuccess` dispara mesmo assim mostrando o toast de sucesso.

## Solucao

Modificar a mutation `deleteCard` em `src/pages/CardsPage.tsx` para receber o `cardId` como parametro direto, em vez de depender do estado `deletingCard`:

1. Alterar `mutationFn` para receber `(cardId: string)` como argumento
2. Usar esse `cardId` diretamente nas queries de delete (transactions, attachments, card)
3. No `onConfirm` do `DeleteConfirmDialog`, passar `deletingCard.id` diretamente: `deleteCard.mutate(deletingCard!.id)`
4. No `onSuccess`, limpar o estado normalmente

## Detalhes tecnicos

### Arquivo: `src/pages/CardsPage.tsx`

Antes:
```typescript
const deleteCard = useMutation({
  mutationFn: async () => {
    if (!deletingCard) return;
    await supabase.from("card_transactions").delete().eq("card_id", deletingCard.id);
    await supabase.from("attachments").delete().eq("record_id", deletingCard.id)...;
    const { error } = await supabase.from("credit_cards").delete().eq("id", deletingCard.id);
    if (error) throw error;
  },
  onSuccess: () => {
    ...
    setDeletingCard(null);
  },
});
```

Depois:
```typescript
const deleteCard = useMutation({
  mutationFn: async (cardId: string) => {
    await supabase.from("card_transactions").delete().eq("card_id", cardId);
    await supabase.from("attachments").delete().eq("record_id", cardId).eq("record_type", "credit_card");
    const { error } = await supabase.from("credit_cards").delete().eq("id", cardId);
    if (error) throw error;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["credit_cards"] });
    if (selectedCardId === deletingCard?.id) setSelectedCardId(null);
    setDeletingCard(null);
    toast({ title: t("cardDeleted") });
  },
});
```

E na chamada:
```typescript
onConfirm={() => deleteCard.mutate(deletingCard!.id)}
```

## Arquivos modificados

- `src/pages/CardsPage.tsx` (unica alteracao, ~5 linhas)
