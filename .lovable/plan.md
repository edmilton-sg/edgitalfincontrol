

## Confirmação de Pagamento com Anexos Obrigatórios

### Situação Atual
O botão "Marcar como Pago" na tabela de folha executa a ação diretamente, sem pedir confirmação, data de pagamento ou anexos.

### Solução
Criar um dialog `PayrollPaymentDialog` que será aberto ao clicar em "Marcar como Pago", exigindo:

| Campo | Obrigatório |
|---|---|
| Data de pagamento | Sim |
| Nota Fiscal (arquivo) | Sim |
| Comprovante de pagamento (arquivo) | Sim |
| Boleto (arquivo) | Não |

### Alterações

**1. Novo componente `PayrollPaymentDialog.tsx`**
- Dialog com campos: data de pagamento, upload de nota fiscal, upload de comprovante, upload de boleto (opcional)
- Validação: botão "Confirmar" desabilitado até que data + nota fiscal + comprovante estejam preenchidos
- Ao confirmar, faz upload dos arquivos para o bucket `attachments` e cria registros na tabela `attachments` com `record_type: 'payroll'`

**2. Atualizar `EmployeesPage.tsx`**
- Substituir a chamada direta do `markPaidMutation` por abertura do novo dialog
- O dialog retorna os dados (data, arquivos) e então executa a mutation existente com a data informada pelo usuário (em vez de `today`)
- Após marcar como pago, salvar os anexos no Storage

**3. Atualizar `PayrollTable.tsx`**
- Sem mudança estrutural; o `onMarkPaid` continuará sendo chamado, mas agora abrirá o dialog no pai

**4. Traduções**
- Adicionar chaves: `paymentConfirmation`, `invoiceRequired`, `paymentProofRequired`, `boleto`, `selectFile`, `invoiceFile`, `paymentProofFile`

### Fluxo do Usuário
1. Clica no ícone ✓ na folha pendente
2. Dialog abre pedindo data de pagamento + anexos
3. Usuário seleciona data, anexa nota fiscal e comprovante (boleto opcional)
4. Botão "Confirmar" fica habilitado
5. Ao confirmar: arquivos são enviados ao Storage, registros de attachment criados, folha marcada como paga, despesa criada

