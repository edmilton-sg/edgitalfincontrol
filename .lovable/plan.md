
# Modulo de Cartoes -- CRUD Completo + Anexos

## Resumo

Completar o modulo de cartoes seguindo o mesmo padrao ja implementado em receitas e despesas: visualizar detalhes, editar, excluir (com confirmacao), e anexar comprovantes. Isso se aplica tanto aos **cartoes** quanto as **transacoes do cartao**.

---

## 1. Cartoes (credit_cards)

### 1.1 Editar Cartao

- Modificar `CardForm.tsx` para aceitar prop opcional `card?` para modo edicao
- Preencher campos com dados existentes quando editando
- Titulo dinamico: "Novo Cartao" / "Editar Cartao"

### 1.2 Excluir Cartao

- Reutilizar `DeleteConfirmDialog` existente
- Ao excluir um cartao, excluir tambem suas transacoes e anexos associados
- Mutation `deleteCard` na `CardsPage`

### 1.3 Detalhes do Cartao

- Novo componente `CardDetailDialog.tsx` com dados em somente leitura (nome, bandeira, ultimos digitos, limite, saldo, dias de fechamento/vencimento)
- Lista de anexos com download
- Botao para editar a partir do detalhe

### 1.4 Acoes no CardList

- Adicionar 3 botoes de acao em cada card visual: Visualizar (Eye), Editar (Pencil), Excluir (Trash)
- Posicionar no canto superior direito do card com icones brancos semi-transparentes
- Callbacks: `onView`, `onEdit`, `onDelete`

### 1.5 Anexos no Cartao

- Reutilizar `FileAttachments` existente
- Atualizar `recordType` para aceitar `"credit_card"` alem de `"revenue"` e `"expense"`
- Secao de anexos no `CardForm` e no `CardDetailDialog`

---

## 2. Transacoes do Cartao (card_transactions)

### 2.1 Editar Transacao

- Modificar `CardTransactions.tsx` para suportar edicao inline no dialog existente
- Estado `editingTransaction` para preencher o formulario com dados existentes
- Mutation `updateTransaction`

### 2.2 Excluir Transacao

- Reutilizar `DeleteConfirmDialog`
- Mutation `deleteTransaction`

### 2.3 Coluna de Acoes na Tabela

- Adicionar coluna "Acoes" com botoes Editar (Pencil) e Excluir (Trash) em cada linha

---

## 3. CardsPage -- Mutations completas

Adicionar na `CardsPage.tsx`:

- Estado `editingCard`, `viewingCard`, `deletingCard`
- Mutation `updateCard` com `supabase.from("credit_cards").update(...)`
- Mutation `deleteCard` com `supabase.from("credit_cards").delete()`
- Funcoes de upload/delete de anexos via storage + tabela `attachments`
- `handleSave` decide entre criar ou atualizar baseado na presenca de ID

---

## 4. Tipo FileAttachments -- Ampliar recordType

Atualizar `FileAttachments.tsx`:

- Mudar tipo `recordType` de `"revenue" | "expense"` para `"revenue" | "expense" | "credit_card" | "card_transaction"`

---

## 5. Traducoes

Novas chaves:

| Chave | pt-BR | en |
|---|---|---|
| editCard | Editar Cartao | Edit Card |
| deleteCard | Excluir Cartao | Delete Card |
| cardDetails | Detalhes do Cartao | Card Details |
| cardUpdated | Cartao atualizado! | Card updated! |
| cardDeleted | Cartao excluido! | Card deleted! |
| transactionUpdated | Transacao atualizada! | Transaction updated! |
| transactionDeleted | Transacao excluida! | Transaction deleted! |
| editTransaction | Editar Transacao | Edit Transaction |

---

## Arquivos modificados

- `src/components/cards/CardForm.tsx` -- modo edicao + anexos
- `src/components/cards/CardList.tsx` -- botoes de acao (view, edit, delete)
- `src/components/cards/CardTransactions.tsx` -- coluna acoes, edit/delete de transacoes
- `src/pages/CardsPage.tsx` -- mutations update/delete, estados de modal, upload de anexos
- `src/components/shared/FileAttachments.tsx` -- ampliar `recordType`
- `src/i18n/translations.ts` -- novas chaves
- Novo: `src/components/cards/CardDetailDialog.tsx` -- modal de detalhes do cartao

## Fluxo do usuario

1. Na lista de cartoes, cada card tem 3 icones de acao: visualizar, editar, excluir
2. **Visualizar**: abre modal com todos os dados do cartao, comprovantes e botao para editar
3. **Editar**: abre formulario preenchido com os dados atuais, incluindo gerenciamento de anexos
4. **Excluir**: abre AlertDialog de confirmacao; ao confirmar, exclui cartao + transacoes + anexos
5. Na tabela de transacoes, cada linha tem botoes de editar e excluir
6. **Editar transacao**: abre dialog preenchido para alterar dados
7. **Excluir transacao**: abre AlertDialog de confirmacao
