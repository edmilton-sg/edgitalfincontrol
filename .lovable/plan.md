
## Reorganização + novos módulos (Compras, Estoque, Precificação, NF-e)

Executarei todas as fases em sequência sem parar, com testes de UX e backend ao final.

---

### Nova estrutura da Sidebar (com subitens colapsáveis)

```text
DASHBOARD                (rota /)
COMPRAS
  ├─ Fornecedores        /suppliers
  ├─ Cotações            /quotations
  └─ Entrada de Notas    /purchase-invoices
ESTOQUE
  ├─ Produtos            /products
  ├─ Movimentações       /stock-movements
  └─ Precificação        /pricing
FINANCEIRO
  ├─ Fluxo de Caixa      /cash-flow
  ├─ Receitas            /revenues
  ├─ Despesas            /expenses
  ├─ Cartões             /cards
  ├─ Pró-labore          /pro-labore
  ├─ Funcionários        /employees
  ├─ Impostos            /taxes
  └─ DRE                 /dre
EMISSÃO DE NOTAS
  ├─ NF-e (Produto)      /invoices/nfe        [esqueleto]
  └─ NFS-e (Serviço)     /invoices/nfse       [esqueleto]
INTEGRAÇÕES
  ├─ Mercado Livre       /integrations/mercadolivre  [esqueleto]
  ├─ Shopee              /integrations/shopee        [esqueleto]
  └─ Bancos (Pluggy)     /integrations/banking       [esqueleto]
RELATÓRIOS               /reports
DOCUMENTOS               /documents
CONFIGURAÇÕES            /settings
```

Componente: migrar `AppSidebar` para o shadcn `Sidebar` com `SidebarGroup` + `Collapsible`, mantendo o botão de colapsar atual e a lógica mobile. Grupo que contém a rota ativa abre automaticamente.

---

### Fase A — Sidebar reorganizada
- Reescreve `AppSidebar.tsx` com grupos colapsáveis (chevron ao lado do nome do grupo, ícone principal do grupo, subitens indentados).
- Adiciona chaves de i18n: `purchases`, `suppliers`, `quotations`, `purchaseInvoices`, `stock`, `products`, `stockMovements`, `pricing`, `financial`, `invoicing`, `nfe`, `nfse`, `integrations`, `mercadoLivre`, `shopee`, `banking`.
- Rotas placeholder para tudo que ainda não existe, para não quebrar navegação.

### Fase B — Compras: Fornecedores
- Tabela `suppliers` (company_id, name, document [CNPJ/CPF], email, phone, address, notes, is_active).
- CRUD completo, busca, filtros ativo/inativo.

### Fase C — Estoque: Produtos e Movimentações
- Tabela `products` (company_id, sku, name, description, unit, category, cost_price, current_stock, min_stock, is_active).
- Tabela `stock_movements` (company_id, product_id, type [in/out/adjustment], quantity, unit_cost, reference_type [purchase_invoice/sale/manual/pricing], reference_id, notes, date).
- Trigger que atualiza `products.current_stock` a cada movimentação (evita drift).
- CRUD de produtos + tela de movimentações com filtros por produto/período/tipo.
- Alerta visual quando `current_stock <= min_stock` no Dashboard.

### Fase D — Compras: Cotações
- Tabela `quotations` (company_id, code, status [draft/sent/received/approved/rejected], date, valid_until, notes).
- Tabela `quotation_items` (quotation_id, product_id, quantity, target_price).
- Tabela `quotation_suppliers` (quotation_id, supplier_id, total_amount, delivery_days, payment_terms, notes, is_selected).
- Tabela `quotation_supplier_items` (quotation_supplier_id, quotation_item_id, unit_price, total).
- UX: criar cotação → adicionar itens → adicionar fornecedores → registrar propostas → comparar (tabela lado a lado destacando o menor preço por item e melhor total) → aprovar fornecedor vencedor.

### Fase E — Compras: Entrada de Nota (integração-chave)
- Tabela `purchase_invoices` (company_id, supplier_id, quotation_id [nullable], invoice_number, issue_date, due_date, total_amount, taxes_amount, freight_amount, other_costs, status [pending/paid], payment_date).
- Tabela `purchase_invoice_items` (invoice_id, product_id, quantity, unit_cost, total_cost).
- Ao **confirmar** a entrada:
  1. Gera `stock_movement` tipo `in` para cada item com o custo unitário (freight/impostos rateados proporcionalmente).
  2. Atualiza `products.cost_price` para o novo custo médio ponderado.
  3. Cria despesa vinculada (`source_type = 'purchase_invoice'`, `source_id = invoice.id`) — reaproveita o padrão já usado por folha/pró-labore/cartão.
  4. Aceita anexos (XML/PDF/boleto) via `FileAttachments` padrão.
- Exclusão faz o caminho reverso completo (estorna estoque, remove despesa, remove anexos do Storage) com diálogo detalhado no padrão atual.

### Fase F — Precificação modular
- Tabela `pricing_configs` (company_id, product_id, name, is_active, updated_at).
- Tabela `pricing_components` (config_id, kind [cost/tax/fee/margin/freight/other], label, value_type [percent/fixed], value, order_index) — permite empilhar quantos itens o usuário quiser.
- Tela do produto abre um "simulador" que:
  - Parte do `cost_price` atual.
  - Aplica cada componente na ordem (percent sobre subtotal ou valor fixo).
  - Mostra em tempo real: **Custo Total**, **Custo Unitário**, **Preço de Venda Sugerido**, **Lucro Bruto (R$/%)**, **Lucro Líquido (R$/%) após impostos/taxas**, **Markup**, **Margem**, **ROI**, **Lucro Unitário**, **Lucro Total (para N unidades)**.
- Ao salvar, grava `products.sale_price` (nova coluna) e mantém histórico via `updated_at` na config.
- Presets rápidos: "Simples Nacional 6%", "Cartão 3,5%", "Frete fixo", editáveis pelo usuário.

### Fase G — Esqueletos
- **Emissão de Notas**: páginas `/invoices/nfe` e `/invoices/nfse` com tabelas `issued_invoices` (company_id, type, number, series, status, recipient_document, recipient_name, amount, issue_date, xml_url, pdf_url, provider_id). UI de listagem + botão "Emitir" desabilitado com aviso "Aguardando integração com provedor (Focus NFe / PlugNotas)".
- **Integrações Mercado Livre / Shopee / Bancos**: páginas de status (não conectado) e placeholder para OAuth futuro. Nenhuma chamada externa nesta fase.

### Fase H — Integrações transversais
- **DRE**: incluir "Custo de Mercadorias Vendidas" (CMV) calculado a partir de `stock_movements` tipo `out` × custo unitário do movimento, entre Receita Bruta e Resultado Operacional.
- **Dashboard**: card de estoque baixo + card de cotações pendentes.
- **Despesas**: entradas oriundas de `purchase_invoice` ficam read-only (padrão do sistema), com botão "Ver Nota de Entrada".
- **Relatórios**: novos filtros por produto/fornecedor (só o esqueleto; conteúdo detalhado em iteração futura).

### Fase I — Testes
- Playwright headless para: navegação da sidebar (grupos abrem/fecham, rota ativa destaca), CRUD de fornecedores, criação de produto, entrada de nota gerando movimento + despesa, simulação de precificação, exclusão em cascata limpando Storage.
- Verificação backend: consultas de sanidade nas novas tabelas, RLS ativo, GRANTs presentes, trigger de estoque somando/subtraindo corretamente.

---

### Detalhes técnicos

- Todas as tabelas seguem o padrão do projeto: `company_id`, RLS permissiva por membership, GRANT para `authenticated` + `service_role`, timestamps + trigger `update_updated_at`.
- Datas exibidas via `src/lib/formatDate.ts` (evita bug de fuso).
- Exclusões seguem `mem://ux/gestao-de-registros-e-exclusao` (contagem exata + limpeza física no Storage).
- Nenhum módulo novo é editável dentro de Despesas — sempre pela origem, mantendo `mem://architecture/module-interconnectivity`.
- Sidebar usa `Collapsible` do Radix (já disponível via shadcn) para os grupos; estado persistido em `localStorage` para lembrar quais grupos ficam abertos.
- Custo médio ponderado na entrada de nota:
  `novo_custo = (estoque_atual × custo_atual + qtd_entrada × custo_entrada) / (estoque_atual + qtd_entrada)`.
- Rateio de frete/impostos: proporcional ao subtotal do item na nota.

### Arquivos principais criados/alterados
- `supabase/migrations/*` — 6 migrations (suppliers, products+movements+trigger, quotations+relacionadas, purchase_invoices+items, pricing_configs+components, issued_invoices + campos extras em products).
- `src/App.tsx` — novas rotas.
- `src/components/layout/AppSidebar.tsx` — reescrito com grupos.
- `src/pages/` — `SuppliersPage`, `QuotationsPage`, `QuotationDetailPage`, `PurchaseInvoicesPage`, `PurchaseInvoiceFormPage`, `ProductsPage`, `StockMovementsPage`, `PricingPage`, `NFePage`, `NFSePage`, `MercadoLivrePage`, `ShopeePage`, `BankingPage`.
- `src/components/purchases/*`, `src/components/stock/*`, `src/components/pricing/*` — formulários, tabelas, dialogs.
- `src/i18n/translations.ts` — novas chaves pt-BR e en.
- `src/components/dre/DreTable.tsx` — linha de CMV.
- `src/components/dashboard/*` — cards de estoque baixo/cotações.
