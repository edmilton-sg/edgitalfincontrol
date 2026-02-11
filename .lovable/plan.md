
# Scroll na Revisao de Transacoes + Cadastro de Categorias Globais

## Resumo

Corrigir o problema de scroll na tela de revisao de transacoes importadas e criar um sistema centralizado de categorias de gastos que pode ser usado em todos os modulos (importacao de fatura, despesas, etc.).

---

## 1. Corrigir Scroll na Tela de Revisao

### Problema
O `ScrollArea` no `InvoiceImportDialog.tsx` esta com `max-h-[400px]` mas pode nao estar funcionando corretamente com a tabela dentro do Dialog.

### Solucao
- Remover o `ScrollArea` wrapper e usar `overflow-y-auto` diretamente no container da tabela com altura calculada
- Ajustar o `DialogContent` para usar `max-h-[90vh]` e garantir que o conteudo interno use `flex-1 overflow-y-auto`
- A tabela ficara com scroll proprio dentro do dialog, permitindo ver todas as transacoes

### Arquivo modificado
- `src/components/cards/InvoiceImportDialog.tsx`

---

## 2. Criar Tabela de Categorias no Banco

### Nova tabela: `categories`

| Coluna | Tipo | Descricao |
|---|---|---|
| id | UUID (PK) | Identificador |
| company_id | UUID (FK -> companies) | Empresa dona |
| name | TEXT | Nome da categoria |
| created_at | TIMESTAMPTZ | Data de criacao |

- Constraint UNIQUE em `(company_id, name)` para evitar duplicatas
- RLS habilitado: usuarios so veem/editam categorias da sua empresa
- Seed com as categorias padrao existentes (rent, energy, internet, officeSupplies, marketing, transport, food, software) para cada empresa

---

## 3. Tela de Gerenciamento de Categorias

### Novo componente: `src/components/settings/CategoriesManager.tsx`

- Lista todas as categorias da empresa em uma tabela simples
- Botao para adicionar nova categoria (input inline ou modal pequeno)
- Botao para editar nome de categoria existente
- Botao para excluir categoria (com confirmacao)
- Busca/filtro rapido

### Integracao na pagina de Configuracoes

- Adicionar um card clicavel em `SettingsPage.tsx` que navega para `/settings/categories` ou abre o gerenciador inline
- Alternativa: abrir como dialog dentro da propria pagina de Configuracoes

---

## 4. Hook Compartilhado: `useCategories`

### Novo arquivo: `src/hooks/useCategories.ts`

- Hook React Query que busca categorias da empresa atual via `supabase.from("categories").select("*").eq("company_id", companyId)`
- Exporta tambem funcoes de mutacao: `addCategory`, `updateCategory`, `deleteCategory`
- Reutilizavel em qualquer modulo

---

## 5. Usar Categorias no InvoiceImportDialog

### Modificacao: `src/components/cards/InvoiceImportDialog.tsx`

- Substituir o `Input` de categoria por um `Select` (combobox) populado com as categorias do banco
- Permitir digitacao livre para criar categoria on-the-fly (ou selecionar existente)
- Usar o hook `useCategories`

---

## 6. Usar Categorias no Modulo de Despesas

### Modificacoes:
- `src/components/expenses/ExpenseForm.tsx` -- substituir o `Select` com categorias hardcoded pelo `Select` com categorias do banco via `useCategories`
- `src/components/expenses/ExpenseFilters.tsx` -- substituir o array `categories` hardcoded pelo hook `useCategories`
- `src/data/mockData.ts` -- o tipo `ExpenseCategory` deixa de ser enum fixo e passa a aceitar string (compatibilidade com categorias dinamicas)

---

## 7. Traducoes

Novas chaves em `src/i18n/translations.ts`:

| Chave | pt-BR | en |
|---|---|---|
| categories | Categorias | Categories |
| manageCategories | Gerenciar Categorias | Manage Categories |
| manageCategoriesDesc | Cadastre categorias de gasto para usar em todos os modulos | Register spending categories for all modules |
| newCategory | Nova Categoria | New Category |
| categoryName | Nome da Categoria | Category Name |
| categoryExists | Categoria ja existe | Category already exists |
| categoryDeleted | Categoria excluida | Category deleted |
| categorySaved | Categoria salva | Category saved |
| deleteCategory | Excluir Categoria | Delete Category |
| deleteCategoryConfirm | Tem certeza que deseja excluir esta categoria? | Are you sure you want to delete this category? |

---

## Arquivos criados/modificados

- **Novo:** Migracao SQL para tabela `categories`
- **Novo:** `src/hooks/useCategories.ts`
- **Novo:** `src/components/settings/CategoriesManager.tsx`
- **Modificado:** `src/components/cards/InvoiceImportDialog.tsx` (scroll + select de categorias)
- **Modificado:** `src/components/expenses/ExpenseForm.tsx` (categorias dinamicas)
- **Modificado:** `src/components/expenses/ExpenseFilters.tsx` (categorias dinamicas)
- **Modificado:** `src/pages/SettingsPage.tsx` (link para gerenciar categorias)
- **Modificado:** `src/i18n/translations.ts` (novas chaves)
- **Modificado:** `src/data/mockData.ts` (tipo ExpenseCategory mais flexivel)

---

## Fluxo do usuario

1. Em Configuracoes, acessa "Gerenciar Categorias"
2. Cadastra categorias como "Alimentacao", "Transporte", "Software", etc.
3. Ao importar fatura, seleciona categorias do dropdown (ou digita nova)
4. Ao criar/editar despesa, ve as mesmas categorias disponiveis
5. Categorias sao compartilhadas entre todos os modulos da empresa
