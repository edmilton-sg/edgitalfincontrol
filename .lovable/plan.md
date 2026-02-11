
# Receitas e Despesas -- Recorrencia, Edicao, Exclusao, Detalhes e Anexos

## Resumo

Adicionar funcionalidades completas de CRUD para receitas e despesas: visualizar detalhes, editar, excluir (com modal de confirmacao), ativar recorrencia e anexar ate 5 comprovantes (PDF/imagem, max 20MB cada) por registro.

---

## 1. Migration SQL -- Novos campos e storage

### 1.1 Campos de recorrencia nas tabelas

```sql
ALTER TABLE public.revenues
  ADD COLUMN is_recurring boolean NOT NULL DEFAULT false,
  ADD COLUMN recurrence_interval text,
  ADD COLUMN recurrence_group_id uuid;

ALTER TABLE public.expenses
  ADD COLUMN is_recurring boolean NOT NULL DEFAULT false,
  ADD COLUMN recurrence_interval text,
  ADD COLUMN recurrence_group_id uuid;
```

### 1.2 Tabela de anexos

```sql
CREATE TABLE public.attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_type text NOT NULL,        -- 'revenue' ou 'expense'
  record_id uuid NOT NULL,
  company_id uuid NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size integer NOT NULL,
  content_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view attachments"
  ON public.attachments FOR SELECT
  USING (is_company_member(company_id, auth.uid()));

CREATE POLICY "Members can insert attachments"
  ON public.attachments FOR INSERT
  WITH CHECK (is_company_member(company_id, auth.uid()));

CREATE POLICY "Members can delete attachments"
  ON public.attachments FOR DELETE
  USING (is_company_member(company_id, auth.uid()));
```

### 1.3 Bucket de storage para comprovantes

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', false);

CREATE POLICY "Members can upload attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'attachments' AND auth.role() = 'authenticated');

CREATE POLICY "Members can view attachments"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'attachments' AND auth.role() = 'authenticated');

CREATE POLICY "Members can delete attachments"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'attachments' AND auth.role() = 'authenticated');
```

---

## 2. Tipos (`src/data/mockData.ts`)

Adicionar aos tipos `Revenue` e `Expense`:

- `is_recurring: boolean`
- `recurrence_interval?: string`
- `recurrence_group_id?: string`

Novo tipo `Attachment`:

```text
id, record_type, record_id, company_id, file_name, file_path, file_size, content_type
```

---

## 3. Coluna de Acoes nas Tabelas

### `RevenueTable.tsx` e `ExpenseTable.tsx`

Adicionar coluna "Acoes" com 3 botoes (icones):

- **Visualizar** (Eye) -- abre modal de detalhes somente leitura
- **Editar** (Pencil) -- abre formulario preenchido
- **Excluir** (Trash) -- abre modal de confirmacao

Indicador visual de recorrencia (icone Repeat) ao lado da descricao quando `is_recurring = true`.

Callbacks adicionados: `onView(item)`, `onEdit(item)`, `onDelete(item)`.

---

## 4. Modal de Detalhes

Novo componente `RevenueDetailDialog.tsx` e `ExpenseDetailDialog.tsx`:

- Exibe todos os campos em modo somente leitura
- Lista os anexos com opcao de download
- Botao para editar a partir do detalhe

---

## 5. Modal de Confirmacao de Exclusao

Novo componente reutilizavel `DeleteConfirmDialog.tsx`:

- Usa `AlertDialog` do Shadcn
- Texto: "Tem certeza que deseja excluir este registro? Esta acao nao pode ser desfeita."
- Botoes: Cancelar / Excluir

---

## 6. Formularios -- Modo criar/editar + recorrencia + anexos

### `RevenueForm.tsx`

- Aceitar prop opcional `revenue?: Revenue` para modo edicao
- Preencher campos com dados existentes quando editando
- Titulo dinamico: "Nova Receita" / "Editar Receita"
- Adicionar switch "Recorrente" e select de intervalo (Mensal, Semanal, Anual) que aparece condicionalmente
- Secao de anexos: area de upload para ate 5 arquivos (PDF ou imagem), com lista dos ja anexados e botao de remover

### `ExpenseForm.tsx`

- Mesma logica: prop `expense?`, switch recorrente, select intervalo, secao de anexos

---

## 7. Paginas -- Mutations de update, delete e upload

### `RevenuesPage.tsx`

- Estado `editingRevenue` e `viewingRevenue` para controlar modais
- Estado `deletingRevenue` para o AlertDialog de exclusao
- Mutation `updateRevenue` com `supabase.from("revenues").update(...)`
- Mutation `deleteRevenue` com `supabase.from("revenues").delete()`
- Funcoes de upload/delete de anexos via storage + tabela `attachments`
- `handleSave` decide entre criar ou atualizar baseado na presenca de ID existente

### `ExpensesPage.tsx`

- Mesma logica: estados de edicao/visualizacao/exclusao, mutations de update/delete, gestao de anexos

---

## 8. Traducoes (`src/i18n/translations.ts`)

Novas chaves:

| Chave | pt-BR | en |
|---|---|---|
| recurring | Recorrente | Recurring |
| recurrenceInterval | Intervalo | Interval |
| monthly | Mensal | Monthly |
| weekly | Semanal | Weekly |
| yearly | Anual | Yearly |
| actions | Acoes | Actions |
| edit | Editar | Edit |
| delete | Excluir | Delete |
| view | Visualizar | View |
| confirmDelete | Confirmar Exclusao | Confirm Delete |
| confirmDeleteMessage | Tem certeza que deseja excluir? | Are you sure you want to delete? |
| cannotBeUndone | Esta acao nao pode ser desfeita. | This action cannot be undone. |
| attachments | Comprovantes | Attachments |
| addAttachment | Anexar Arquivo | Attach File |
| maxAttachments | Maximo de 5 arquivos | Maximum 5 files |
| fileTooBig | Arquivo muito grande (max 20MB) | File too big (max 20MB) |
| details | Detalhes | Details |
| deleted | Excluido com sucesso | Deleted successfully |
| updated | Atualizado com sucesso | Updated successfully |

---

## Fluxo do usuario

1. Na tabela de receitas/despesas, cada linha tem 3 icones de acao: visualizar, editar, excluir
2. **Visualizar**: abre modal com todos os dados e lista de comprovantes anexados (com download)
3. **Editar**: abre o formulario preenchido com os dados atuais, permitindo alterar tudo inclusive recorrencia e anexos
4. **Excluir**: abre AlertDialog de confirmacao; ao confirmar, exclui o registro e seus anexos do storage
5. **Criar novo**: o formulario inclui switch de recorrencia e area de upload de comprovantes
6. Recorrencia: ao ativar, aparece select com Mensal/Semanal/Anual

---

## Arquivos modificados

- Nova migration SQL (ALTER revenues/expenses, CREATE attachments, storage bucket + RLS)
- `src/data/mockData.ts` -- tipos atualizados com campos de recorrencia
- `src/components/revenues/RevenueForm.tsx` -- modo edicao, recorrencia, anexos
- `src/components/revenues/RevenueTable.tsx` -- coluna acoes, indicador recorrencia
- `src/components/expenses/ExpenseForm.tsx` -- modo edicao, recorrencia, anexos
- `src/components/expenses/ExpenseTable.tsx` -- coluna acoes, indicador recorrencia
- `src/pages/RevenuesPage.tsx` -- mutations update/delete, estados de modal, upload de anexos
- `src/pages/ExpensesPage.tsx` -- mutations update/delete, estados de modal, upload de anexos
- `src/i18n/translations.ts` -- novas chaves de traducao
- Novos componentes:
  - `src/components/shared/DeleteConfirmDialog.tsx`
  - `src/components/revenues/RevenueDetailDialog.tsx`
  - `src/components/expenses/ExpenseDetailDialog.tsx`
  - `src/components/shared/FileAttachments.tsx` (componente reutilizavel de upload/listagem)
