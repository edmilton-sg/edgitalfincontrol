
# Importacao de Fatura com IA (Gemini Flash) + CSV Local

## Resumo

Criar funcionalidade para importar faturas de cartao via PDF (usando Lovable AI / Gemini Flash para extracao) ou CSV (parsing local no frontend). O usuario faz upload do arquivo, revisa as transacoes extraidas em tabela editavel, renomeia descricoes, seleciona categorias, e confirma a importacao. O arquivo original fica armazenado para consulta.

---

## 1. Edge Function -- `parse-invoice`

### `supabase/functions/parse-invoice/index.ts`

- Recebe `{ content: string }` (texto extraido do PDF via pdfjs-dist no frontend)
- Envia para Lovable AI Gateway (`https://ai.gateway.lovable.dev/v1/chat/completions`) com model `google/gemini-2.5-flash`
- Usa **tool calling** para retornar dados estruturados
- Tool definition: `extract_transactions` com schema de array contendo `date`, `description`, `amount`, `installment_info`
- Prompt especifico para faturas de cartao de credito brasileiras
- Trata erros 429 (rate limit) e 402 (creditos insuficientes)
- Retorna `{ transactions: [...] }`

### `supabase/config.toml`

Registrar a funcao:

```text
[functions.parse-invoice]
verify_jwt = false
```

---

## 2. Parser CSV no Frontend

### Novo: `src/lib/parseInvoiceCSV.ts`

- Detecta delimitador (`;` ou `,`)
- Mapeia colunas por cabecalho com aliases flexiveis (data/date, descricao/description, valor/amount/value)
- Normaliza datas (dd/MM/yyyy, yyyy-MM-dd)
- Normaliza valores (virgula decimal, remove "R$")
- Detecta parcelas no texto (ex: "PARCELA 3/10", "3 DE 10")
- Retorna `ParsedTransaction[]`

Tipo:

```text
ParsedTransaction {
  date: string        // YYYY-MM-DD
  description: string
  amount: number
  installment_number?: number
  installment_total?: number
  category: string    // vazio por padrao
  selected: boolean   // true por padrao
}
```

---

## 3. Componente de Importacao

### Novo: `src/components/cards/InvoiceImportDialog.tsx`

Dialog com 2 etapas:

**Etapa 1 -- Upload:**
- Area de drag-and-drop ou botao para selecionar arquivo
- Aceita `.pdf` e `.csv`, limite 20MB
- Loading spinner durante processamento
- Para PDF: usa `pdfjs-dist` para extrair texto no browser, envia texto para edge function `parse-invoice`
- Para CSV: processa localmente via `parseInvoiceCSV`

**Etapa 2 -- Revisao:**
- Tabela editavel com colunas: Checkbox, Data, Descricao (Input), Categoria (Input), Valor, Parcela
- Checkbox individual + "Selecionar Todos" / "Desselecionar Todos"
- Resumo: X transacoes selecionadas, valor total
- Botoes: "Cancelar" e "Importar Selecionados"

Ao confirmar:
- Insert batch em `card_transactions`
- Salva arquivo original no bucket `attachments` com `record_type = 'card_invoice'`
- Registra na tabela `attachments`
- Invalida query de transacoes

---

## 4. Integracao

### Modificado: `src/components/cards/CardTransactions.tsx`

- Adicionar botao "Importar Fatura" (icone Upload) ao lado de "Nova Transacao"
- Renderizar `InvoiceImportDialog`

### Modificado: `src/components/shared/FileAttachments.tsx`

- Adicionar `"card_invoice"` ao tipo `recordType`

---

## 5. Dependencia

- Instalar `pdfjs-dist` para extracao de texto do PDF no browser (necessario mesmo com IA, pois o texto e extraido localmente antes de enviar)

---

## 6. Traducoes

Novas chaves em `src/i18n/translations.ts`:

| Chave | pt-BR | en |
|---|---|---|
| importInvoice | Importar Fatura | Import Invoice |
| selectFile | Selecionar Arquivo | Select File |
| dragDropFile | Arraste aqui ou clique para selecionar | Drag here or click to select |
| supportedFormats | Formatos: PDF, CSV | Formats: PDF, CSV |
| processing | Processando... | Processing... |
| extractedTransactions | Transacoes Extraidas | Extracted Transactions |
| selectAll | Selecionar Todos | Select All |
| deselectAll | Desselecionar Todos | Deselect All |
| importSelected | Importar Selecionados | Import Selected |
| transactionsImported | Transacoes importadas! | Transactions imported! |
| noTransactionsFound | Nenhuma transacao encontrada | No transactions found |
| parsingError | Erro ao processar arquivo | Error parsing file |
| reviewTransactions | Revisar Transacoes | Review Transactions |
| totalSelected | selecionadas | selected |

---

## Arquivos criados/modificados

- **Novo:** `supabase/functions/parse-invoice/index.ts`
- **Novo:** `src/lib/parseInvoiceCSV.ts`
- **Novo:** `src/components/cards/InvoiceImportDialog.tsx`
- **Modificado:** `supabase/config.toml`
- **Modificado:** `src/components/cards/CardTransactions.tsx`
- **Modificado:** `src/components/shared/FileAttachments.tsx`
- **Modificado:** `src/i18n/translations.ts`

---

## Fluxo do usuario

1. Na area de transacoes do cartao, clica em "Importar Fatura"
2. Seleciona arquivo PDF ou CSV
3. Sistema extrai transacoes (PDF via IA, CSV localmente)
4. Tabela de revisao aparece com transacoes encontradas
5. Usuario renomeia descricoes, digita categorias, desmarca itens
6. Clica em "Importar Selecionados"
7. Transacoes salvas e arquivo original armazenado
