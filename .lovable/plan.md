

# Backend Multi-Tenant + Autenticacao + Modulo de Cartoes

## Resumo

Ativar Lovable Cloud (Supabase), criar toda a estrutura de banco multi-tenant com autenticacao, roles e RLS, migrar as paginas de Receitas/Despesas para usar Supabase, implementar o modulo de Cartoes e adicionar login + seletor de empresa para contadores. Sem dados seed - tudo sera cadastrado do zero pelo usuario.

---

## Etapa 1: Ativar Lovable Cloud

Conectar o Supabase via Lovable Cloud para obter autenticacao e banco de dados.

---

## Etapa 2: Migrations SQL (Schema + RLS)

### Migration 1 - Tabelas base e roles

```text
1. Enum app_role: admin, accountant, company_owner
2. Tabela profiles: id (PK, FK auth.users), full_name, created_at
3. Tabela user_roles: id, user_id (FK auth.users), role (app_role)
4. Trigger auto-create profile on signup
5. Tabela companies: id, name, cnpj, owner_id (FK auth.users), created_at
6. Tabela company_members: id, company_id (FK), user_id (FK), role (text: owner/accountant), created_at
```

### Migration 2 - Tabelas de dados

```text
7. Tabela revenues: id, company_id (FK, NOT NULL), date, description, client,
   gross_amount, fee_amount, net_amount, payment_method, status, created_at
8. Tabela expenses: id, company_id (FK, NOT NULL), date, description, category,
   cost_center, amount, payment_method, installments, installment_number,
   installment_total, is_fixed, is_personal, created_at
9. Tabela credit_cards: id, company_id (FK, NOT NULL), name, brand, last_digits,
   card_limit, closing_day, due_day, current_balance, created_at
10. Tabela card_transactions: id, card_id (FK), company_id (FK, NOT NULL), date,
    description, amount, installment_number, installment_total, category, created_at
```

### Migration 3 - Helper functions + RLS

```text
11. Funcao is_company_member(company_id, user_id) - SECURITY DEFINER
12. Funcao has_role(user_id, role) - SECURITY DEFINER
13. RLS em profiles: SELECT own only
14. RLS em companies: SELECT via membership, INSERT authenticated, UPDATE/DELETE owner only
15. RLS em company_members: SELECT via membership, INSERT/UPDATE/DELETE owner or self-join
16. RLS em revenues, expenses, credit_cards, card_transactions:
    SELECT/INSERT/UPDATE/DELETE via is_company_member(company_id, auth.uid())
```

---

## Etapa 3: Frontend - Autenticacao

### Novos arquivos:
- `src/contexts/AuthContext.tsx` - Provider com onAuthStateChange, sessao, perfil, role, loading
- `src/pages/LoginPage.tsx` - Login com email/senha (formulario simples e limpo)
- `src/pages/SignUpPage.tsx` - Cadastro com nome, email, senha e selecao de role (Empresa ou Contador)

### Alteracoes:
- `src/App.tsx` - Rotas protegidas: redireciona para /login se nao autenticado. Login/signup ficam fora do AppLayout.

---

## Etapa 4: Frontend - Contexto de Empresa

### Novos arquivos:
- `src/contexts/CompanyContext.tsx` - Carrega empresas vinculadas ao usuario, gerencia `selectedCompanyId`
- `src/components/layout/CompanySelector.tsx` - Dropdown no header para contadores alternarem entre empresas
- `src/pages/CompanySetupPage.tsx` - Pagina para empresa criar sua primeira company (nome + CNPJ) ao fazer primeiro login

### Alteracoes:
- `src/components/layout/AppHeader.tsx` - Adicionar CompanySelector ao lado do avatar
- `src/App.tsx` - Envolver rotas com CompanyProvider, redirecionar para setup se usuario nao tem empresa vinculada

---

## Etapa 5: Migrar Receitas e Despesas para Supabase

### Alteracoes:
- `src/pages/RevenuesPage.tsx` - Substituir `useState(mockData)` por queries Supabase filtradas por `selectedCompanyId`. INSERT com company_id. Usar `@tanstack/react-query` para fetch e mutations.
- `src/pages/ExpensesPage.tsx` - Idem.
- `src/components/revenues/RevenueForm.tsx` - onSave faz INSERT no Supabase
- `src/components/expenses/ExpenseForm.tsx` - onSave faz INSERT no Supabase
- `src/data/mockData.ts` - Manter apenas os tipos/interfaces como referencia. Remover arrays de dados mock.

---

## Etapa 6: Modulo de Cartoes (novo)

### Novos arquivos:
- `src/pages/CardsPage.tsx` - Grid visual de cartoes + tabela de transacoes do cartao selecionado
- `src/components/cards/CardForm.tsx` - Dialog para cadastrar cartao (nome, bandeira, ultimos digitos, limite, dia fechamento, dia vencimento)
- `src/components/cards/CardList.tsx` - Grid responsivo com cards visuais estilo cartao de credito, barra de progresso do limite
- `src/components/cards/CardTransactions.tsx` - Tabela de transacoes do cartao selecionado com totalizador

### Alteracoes:
- `src/App.tsx` - Rota `/cards` aponta para CardsPage (substituir PlaceholderPage)

---

## Etapa 7: Traducoes (i18n)

Novas chaves em pt-BR e en:
- Autenticacao: login, signUp, email, password, fullName, logout, selectRole, companyOwner, accountant
- Empresa: companyName, cnpj, createCompany, selectCompany, noCompanyYet, setupCompany
- Cartoes: newCard, cardName, cardBrand, lastDigits, cardLimit, closingDay, dueDay, currentBalance, usedLimit, visa, mastercard, elo, amex, cardTransactions, noCardSelected, addTransaction, newTransaction

---

## Fluxo do Usuario

```text
1. Cadastro -> Escolhe role (Empresa ou Contador)
2. Se Empresa:
   -> Redireciona para CompanySetup (cria empresa + CNPJ)
   -> Auto-vincula como owner em company_members
   -> Entra no Dashboard com dados vazios
   -> Pode cadastrar receitas, despesas, cartoes
3. Se Contador:
   -> Entra no Dashboard sem empresa selecionada
   -> Precisa ser vinculado a empresas (pelo owner ou admin)
   -> Seletor de empresa aparece no header
   -> Ao selecionar, ve os dados daquela empresa
```

---

## Secao Tecnica

- **Supabase Client**: Gerado automaticamente pelo Lovable Cloud em `src/integrations/supabase/`
- **State**: `@tanstack/react-query` para todas as queries e mutations Supabase
- **Auth**: `onAuthStateChange` listener configurado ANTES de `getSession()` no AuthContext
- **RLS**: Funcao `is_company_member` com SECURITY DEFINER evita recursao infinita
- **Roles**: Tabela separada `user_roles` - nunca no profiles (previne escalacao de privilegios)
- **Company switching**: `selectedCompanyId` em CompanyContext, passado como filtro em todas as queries
- **Formularios**: Mantidos com react-hook-form + zod, agora fazem INSERT via Supabase
- **Cartoes**: Mesmo padrao de arquitetura (form dialog, tabela, filtros)
- **Sem dados seed**: Banco comeca vazio. Usuario cria empresa e dados do zero para testar.

