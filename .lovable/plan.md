
# Modulo de Documentos - Gaveta Digital da Empresa

## Resumo

Criar um modulo completo de Documentos onde a empresa armazena documentos importantes (Cartao CNPJ, Certificado do Bombeiro, Alvara, etc.) em formato de cards visuais com legenda, arquivo anexado e controle de validade. Documentos com vencimento geram alertas no Dashboard a partir de X dias antes configurados pelo usuario.

## Nova Tabela: `company_documents`

| Coluna | Tipo | Obrigatorio | Default | Descricao |
|--------|------|-------------|---------|-----------|
| id | uuid | Sim | gen_random_uuid() | PK |
| company_id | uuid | Sim | - | FK empresa |
| title | text | Sim | - | Nome do documento (ex: "Cartao CNPJ") |
| description | text | Nao | null | Legenda/observacoes |
| file_name | text | Sim | - | Nome do arquivo |
| file_path | text | Sim | - | Caminho no storage |
| file_size | integer | Sim | - | Tamanho em bytes |
| content_type | text | Sim | - | MIME type |
| expires_at | date | Nao | null | Data de vencimento (null = sem validade) |
| alert_days_before | integer | Nao | 30 | Dias antes do vencimento para comecar a alertar |
| created_at | timestamptz | Sim | now() | Data de criacao |
| updated_at | timestamptz | Sim | now() | Data de atualizacao |

**RLS**: Mesmas politicas de company member (SELECT, INSERT, UPDATE, DELETE).

## Logica de Alertas

Um documento gera alerta quando:
- `expires_at` esta preenchido
- A data atual >= `expires_at - alert_days_before` dias
- Inclui documentos ja vencidos (continuam alertando ate ser renovado)

O alerta so desaparece quando o usuario faz upload de um novo arquivo e define uma nova data de vencimento futura (ou remove a validade).

## Arquivos a Criar

### `src/pages/DocumentsPage.tsx`
- Pagina principal com grid de cards de documentos
- Botao "Novo Documento" abre dialog de cadastro
- Cada card exibe: titulo, legenda, icone do tipo de arquivo, data de vencimento (com badge de status: verde/amarelo/vermelho)
- Acoes: visualizar/baixar, editar, excluir

### `src/components/documents/DocumentCard.tsx`
- Card visual do documento
- Exibe titulo, descricao, tipo do arquivo, data de vencimento
- Badge colorido: verde (OK), amarelo (proximo do vencimento), vermelho (vencido), cinza (sem validade)
- Botoes de acao: download, editar, excluir

### `src/components/documents/DocumentFormDialog.tsx`
- Dialog para criar/editar documento
- Campos: titulo, descricao, arquivo (upload), data de vencimento (opcional), dias para alerta (default 30)
- Ao editar, permite trocar o arquivo

### `src/components/documents/DocumentDetailDialog.tsx`
- Dialog para visualizar detalhes completos do documento
- Exibe todas as informacoes + preview do arquivo (se imagem) ou botao de download

### `src/components/dashboard/DocumentAlerts.tsx`
- Componente para o Dashboard que exibe documentos proximos do vencimento ou vencidos
- Card com lista de alertas, cada um com titulo, dias restantes e badge de status
- Query filtra documentos onde `expires_at IS NOT NULL AND current_date >= expires_at - alert_days_before`

## Arquivos a Modificar

### `src/pages/Index.tsx`
- Adicionar componente `DocumentAlerts` na grid do dashboard

### `src/App.tsx`
- Substituir a rota `/documents` de PlaceholderPage para DocumentsPage

### `src/i18n/translations.ts`
- Adicionar traducoes para: `newDocument`, `documentTitle`, `documentDescription`, `expiresAt`, `alertDaysBefore`, `noExpiry`, `expired`, `expiringSoon`, `valid`, `daysRemaining`, `daysOverdue`, `documentAlerts`, `uploadFile`, `replaceFile`, `noDocuments`, `downloadDocument`, `deleteDocument`, `editDocument`

### `src/data/mockData.ts`
- Adicionar interface `CompanyDocument` como referencia de tipo

## Detalhes Tecnicos

### Upload de arquivos

Utilizar o bucket `attachments` ja existente no storage. O path sera: `{company_id}/documents/{document_id}/{filename}`.

### Query de alertas no Dashboard

```sql
SELECT * FROM company_documents
WHERE company_id = :companyId
  AND expires_at IS NOT NULL
  AND current_date >= (expires_at - (alert_days_before || ' days')::interval)
ORDER BY expires_at ASC
```

No codigo, isso sera feito via query no Supabase client filtrando no lado do app (pois o Supabase JS client nao suporta operacoes de intervalo diretamente).

### Calculo de status do documento

```text
Se expires_at == null -> "sem validade" (badge cinza)
Se expires_at < hoje -> "vencido" (badge vermelho)
Se expires_at - alert_days_before <= hoje -> "proximo do vencimento" (badge amarelo)
Senao -> "valido" (badge verde)
```

### Renovacao de documento

Ao editar um documento e enviar novo arquivo + nova data de vencimento, o antigo arquivo e removido do storage e o novo e enviado. O alerta desaparece automaticamente pois a nova data de vencimento sera futura.

## Sequencia de Implementacao

1. Migration: criar tabela `company_documents` com RLS
2. Adicionar traducoes em `translations.ts`
3. Adicionar tipo `CompanyDocument` em `mockData.ts`
4. Criar `DocumentFormDialog.tsx` (formulario de cadastro/edicao)
5. Criar `DocumentCard.tsx` (card visual)
6. Criar `DocumentDetailDialog.tsx` (visualizacao)
7. Criar `DocumentsPage.tsx` (pagina principal com grid)
8. Criar `DocumentAlerts.tsx` (alertas no dashboard)
9. Atualizar `Index.tsx` para incluir alertas
10. Atualizar `App.tsx` para usar DocumentsPage na rota /documents
