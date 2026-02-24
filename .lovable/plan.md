
# Comprovante Obrigatorio + Conferencia IA + Vencimento Customizavel

## Resumo

Tres melhorias no modulo de Impostos:

1. **Comprovante obrigatorio**: Exigir upload de comprovante (PDF/imagem) ao registrar pagamento de guia DAS
2. **Conferencia com IA**: Enviar o comprovante para a IA extrair o valor pago e comparar com o valor informado, alertando divergencias
3. **Data de vencimento customizavel**: Permitir alterar o dia padrao de vencimento (atualmente fixo no dia 20) nas configuracoes de impostos

---

## Parte 1: Banco de Dados

### Alterar tabela `tax_settings`
Adicionar coluna `due_day` (integer, default 20) para armazenar o dia de vencimento customizado por empresa.

```sql
ALTER TABLE tax_settings ADD COLUMN due_day integer NOT NULL DEFAULT 20;
```

---

## Parte 2: Edge Function - Verificacao de Comprovante

### Criar `supabase/functions/verify-tax-receipt/index.ts`

- Recebe o texto extraido do comprovante (PDF) ou a imagem em base64
- Usa Lovable AI (google/gemini-2.5-flash) para extrair o valor pago do comprovante
- Retorna o valor encontrado pela IA para comparacao no frontend
- Trata erros 429/402

Prompt da IA: extrair valor pago, data do pagamento e identificacao (codigo de barras/linha digitavel) de um comprovante de pagamento DAS brasileiro.

---

## Parte 3: Componentes Modificados

### 3.1 `TaxPaymentDialog.tsx` - Reformulacao completa

**Novo fluxo:**
1. Usuario seleciona arquivo de comprovante (obrigatorio, PDF ou imagem)
2. Se PDF: extrai texto com pdf.js; se imagem: converte para base64
3. Envia para edge function `verify-tax-receipt`
4. IA retorna o valor extraido do comprovante
5. Compara com o valor informado pelo usuario:
   - Se divergencia > 1%: exibe alerta amarelo com os dois valores
   - Se ok: exibe confirmacao verde
6. Usuario pode prosseguir mesmo com divergencia (apenas aviso)
7. Ao salvar: faz upload do comprovante no bucket `attachments` e insere registro em `attachments` com record_type = "tax_payment"

**Campos do dialog:**
- Valor pago (input numerico, pre-preenchido com estimado)
- Data do pagamento (date input)
- Comprovante (file input, obrigatorio - PDF ou imagem)
- Area de resultado da IA (valor encontrado + status de conferencia)
- Botao "Verificar" para acionar a IA
- Botao "Salvar" (desabilitado se nao houver comprovante)

### 3.2 `TaxSettingsDialog.tsx` - Adicionar campo de vencimento

- Novo campo numerico "Dia de Vencimento" (1-28, default 20)
- Salva na coluna `due_day` da tabela `tax_settings`

### 3.3 `TaxesPage.tsx` - Usar due_day customizado

- Buscar `due_day` do `tax_settings` (default 20)
- Usar esse valor no calculo da data de vencimento em vez do 20 fixo

---

## Parte 4: Traducoes

Adicionar ao `translations.ts`:
- `receiptRequired` / `Receipt required`
- `attachReceipt` / `Attach receipt`
- `verifyReceipt` / `Verify receipt`
- `verifying` / `Verifying...`
- `receiptValueMatch` / `Value matches`
- `receiptValueDivergence` / `Value divergence detected`
- `aiExtractedValue` / `AI extracted value`
- `proceedWithDivergence` / `Proceed anyway`
- `dueDayLabel` / `Due day`
- `dueDayHint` / `Day of month for tax due date (1-28)`
- `receiptRequiredError` / `Please attach a payment receipt`

---

## Parte 5: Sequencia de Implementacao

1. Migration: adicionar coluna `due_day` em `tax_settings`
2. Criar edge function `verify-tax-receipt`
3. Adicionar traducoes
4. Modificar `TaxSettingsDialog` (campo due_day)
5. Modificar `TaxPaymentDialog` (comprovante + IA)
6. Modificar `TaxesPage` (usar due_day customizado)

---

## Detalhes Tecnicos

### Extracao de texto do PDF (reutiliza pdfjs-dist ja instalado)
O projeto ja usa `pdfjs-dist` para extrair texto de PDFs na funcionalidade de importacao de faturas. O mesmo padrao sera reutilizado no dialog de pagamento.

### Verificacao de imagens
Para comprovantes em formato de imagem (JPG/PNG), a imagem sera enviada como base64 para a IA com capacidade multimodal (Gemini suporta imagens nativamente).

### Edge Function `verify-tax-receipt`
```text
Input:  { content: string, type: "text" | "image", image_base64?: string }
Output: { extracted_value: number | null, extracted_date: string | null, confidence: string }
```

### Fluxo de upload do comprovante
1. Primeiro salva/atualiza o `tax_payment` para obter o ID
2. Faz upload do arquivo no bucket `attachments` com path: `{company_id}/tax_payment/{payment_id}/{timestamp}_{filename}`
3. Insere registro na tabela `attachments` com `record_type = "tax_payment"` e `record_id = payment_id`
