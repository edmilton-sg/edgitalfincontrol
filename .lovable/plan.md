

# Modulo de Receitas e Despesas -- Plano de Implementacao

## Resumo

Criar os modulos funcionais de **Receitas** e **Despesas** com formulario de cadastro (dialog/modal), listagem em tabela com filtros, e dados mockados gerenciados via React state. Tudo bilingue (pt-BR / en) seguindo a arquitetura existente e o spec do documento `finc-2.md`.

---

## Estrutura de Arquivos

```text
src/
  data/mockData.ts              (atualizar - adicionar mock de receitas e despesas)
  i18n/translations.ts          (atualizar - novas chaves para os modulos)
  pages/
    RevenuesPage.tsx             (novo)
    ExpensesPage.tsx             (novo)
  components/
    revenues/
      RevenueForm.tsx            (novo - dialog com formulario)
      RevenueFilters.tsx         (novo - filtros por periodo, status, cliente)
      RevenueTable.tsx           (novo - tabela de listagem)
    expenses/
      ExpenseForm.tsx            (novo - dialog com formulario)
      ExpenseFilters.tsx         (novo - filtros por periodo, categoria, tipo)
      ExpenseTable.tsx           (novo - tabela de listagem)
  App.tsx                        (atualizar rotas)
```

---

## Dados Mock

### Receitas (conforme spec Module 3)
Campos: `id`, `date`, `description`, `client`, `gross_amount`, `fee_amount`, `net_amount`, `payment_method`, `status` (paid/pending/overdue)

Exemplo: ~8 registros variados com clientes, metodos de pagamento (PIX, boleto, cartao, transferencia), status mistos.

### Despesas (conforme spec Module 4)
Campos: `id`, `date`, `description`, `category`, `cost_center`, `amount`, `payment_method`, `installments`, `installment_number`, `installment_total`, `is_fixed`, `is_personal`

Categorias: Aluguel, Energia, Internet, Material de Escritorio, Marketing, Transporte, Alimentacao, Software/SaaS.

---

## Pagina de Receitas (`RevenuesPage.tsx`)

1. **Header**: Titulo "Receitas" + botao "Nova Receita" (abre dialog)
2. **Filtros** (`RevenueFilters.tsx`):
   - Periodo (mes/ano via select)
   - Status (todos / pago / pendente / atrasado)
   - Busca por descricao/cliente
3. **Tabela** (`RevenueTable.tsx`):
   - Colunas: Data, Descricao, Cliente, Valor Bruto, Taxa, Valor Liquido, Metodo, Status
   - Badge colorido no status (verde=pago, amarelo=pendente, vermelho=atrasado)
   - Totalizador no rodape (soma do valor liquido filtrado)
4. **Formulario** (`RevenueForm.tsx`):
   - Dialog modal com campos: data (datepicker), descricao, cliente, valor bruto, taxa, metodo de pagamento (select), status (select)
   - Valor liquido calculado automaticamente (bruto - taxa)
   - Validacao com zod
   - Ao salvar, adiciona ao state local e fecha o dialog

---

## Pagina de Despesas (`ExpensesPage.tsx`)

1. **Header**: Titulo "Despesas" + botao "Nova Despesa" (abre dialog)
2. **Filtros** (`ExpenseFilters.tsx`):
   - Periodo (mes/ano via select)
   - Categoria (select com as categorias)
   - Tipo: Todas / Fixa / Variavel
   - Busca por descricao
3. **Tabela** (`ExpenseTable.tsx`):
   - Colunas: Data, Descricao, Categoria, Centro de Custo, Valor, Metodo, Parcela, Fixa, Pessoal
   - Icones/badges para is_fixed e is_personal
   - Totalizador no rodape
4. **Formulario** (`ExpenseForm.tsx`):
   - Dialog modal com campos: data, descricao, categoria (select), centro de custo, valor, metodo de pagamento, parcelas (numero), fixa (switch), pessoal (switch)
   - Validacao com zod
   - Ao salvar, adiciona ao state local

---

## Traducoes (i18n)

Novas chaves para ambos os idiomas:
- Titulos e labels dos formularios (newRevenue, newExpense, description, client, grossAmount, feeAmount, netAmount, paymentMethod, category, costCenter, installments, fixed, personal, etc.)
- Filtros (allStatuses, allCategories, filterByPeriod, searchPlaceholder)
- Botoes (save, cancel, add)
- Metodos de pagamento (pix, bankSlip, creditCard, transfer, cash)
- Categorias de despesa
- Totais (total, totalFiltered)

---

## Rotas

Atualizar `App.tsx`:
- `/revenues` -> `<RevenuesPage />`
- `/expenses` -> `<ExpensesPage />`

(Substituir os PlaceholderPage atuais dessas rotas)

---

## Secao Tecnica

- **State management**: `useState` local em cada pagina (sem backend por enquanto). Os dados mock sao carregados como estado inicial.
- **Formularios**: `react-hook-form` + `zod` para validacao. Dialog do shadcn/ui para o modal.
- **Datepicker**: Componente shadcn Calendar dentro de Popover com `pointer-events-auto`.
- **Filtros**: Controlados via state, aplicados com `.filter()` sobre o array de dados antes de renderizar a tabela.
- **Formatacao**: Valores monetarios formatados como BRL (`R$ 1.234,56`) ou USD conforme idioma ativo.
- **Responsividade**: Tabela com scroll horizontal em mobile. Filtros empilham em coluna. Dialog ocupa largura total em telas pequenas.

