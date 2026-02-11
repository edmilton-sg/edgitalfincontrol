

# Solicitacao de Acesso do Contador a Empresas

## Resumo

O contador podera solicitar vinculacao a uma empresa informando o CNPJ. O dono da empresa recebera a solicitacao e podera aprovar ou rejeitar. Apos aprovacao, o contador e adicionado como membro da empresa e pode visualizar/editar todos os dados.

## Fluxo do usuario

```text
CONTADOR                              DONO DA EMPRESA
   |                                       |
   |-- Digita CNPJ no formulario           |
   |-- Clica "Solicitar Acesso"            |
   |                                       |
   |   [solicitacao pendente criada]        |
   |                                       |
   |                          Icone de notificacao (badge)
   |                          Abre pagina de solicitacoes
   |                          Ve: "Contador X quer acessar"
   |                          Clica "Aprovar" ou "Rejeitar"
   |                                       |
   |   [se aprovado: contador vira          |
   |    membro da empresa]                  |
   |                                       |
   |-- Empresa aparece no seletor           |
   |-- Acesso total aos dados               |
```

## O que sera construido

### 1. Tabela `access_requests` (nova)

Armazena solicitacoes de acesso pendentes, aprovadas e rejeitadas.

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid | PK |
| requester_id | uuid | Usuario que solicita (contador) |
| company_id | uuid | Empresa alvo |
| status | text | pending, approved, rejected |
| created_at | timestamp | Data da solicitacao |
| resolved_at | timestamp | Data da aprovacao/rejeicao |
| resolved_by | uuid | Quem aprovou/rejeitou |

RLS:
- SELECT: o solicitante pode ver suas proprias solicitacoes; o dono da empresa pode ver solicitacoes para suas empresas
- INSERT: usuarios autenticados com role "accountant" podem criar solicitacoes
- UPDATE: somente o dono da empresa pode aprovar/rejeitar

### 2. Pagina do Contador: Solicitar Acesso

Nova pagina `/request-access` acessivel pelo contador (quando nao tem empresas vinculadas ou via sidebar).

- Campo CNPJ com mascara (mesmo componente existente)
- Ao digitar 14 digitos: busca a empresa no banco pelo CNPJ
- Se encontrada: exibe nome da empresa e botao "Solicitar Acesso"
- Se nao encontrada: mensagem informativa
- Lista de solicitacoes pendentes do contador

### 3. Pagina do Dono: Solicitacoes de Acesso

Nova pagina `/access-requests` acessivel pelo dono da empresa.

- Lista de solicitacoes pendentes para suas empresas
- Cada item mostra: nome do contador, data da solicitacao
- Botoes "Aprovar" e "Rejeitar"
- Ao aprovar: insere registro em `company_members` com role "accountant"

### 4. Notificacao no Header

- Badge no icone de sino mostrando quantidade de solicitacoes pendentes (para donos de empresa)

### 5. Redirecionamento do Contador

- Contador sem empresas vinculadas: redirecionar para `/request-access` ao inves de `/company-setup`

---

## Secao Tecnica

### 1. Migration SQL

```sql
CREATE TABLE public.access_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid
);

ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;

-- Contadores podem ver suas proprias solicitacoes
CREATE POLICY "Requesters can view own requests"
  ON public.access_requests FOR SELECT TO authenticated
  USING (requester_id = auth.uid());

-- Donos podem ver solicitacoes para suas empresas
CREATE POLICY "Owners can view requests for their companies"
  ON public.access_requests FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.companies
      WHERE companies.id = access_requests.company_id
      AND companies.owner_id = auth.uid()
    )
  );

-- Contadores podem criar solicitacoes
CREATE POLICY "Accountants can create requests"
  ON public.access_requests FOR INSERT TO authenticated
  WITH CHECK (
    requester_id = auth.uid()
    AND has_role(auth.uid(), 'accountant'::app_role)
  );

-- Donos podem atualizar (aprovar/rejeitar)
CREATE POLICY "Owners can resolve requests"
  ON public.access_requests FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.companies
      WHERE companies.id = access_requests.company_id
      AND companies.owner_id = auth.uid()
    )
  );
```

### 2. Novos arquivos

- `src/pages/RequestAccessPage.tsx` - Formulario do contador para solicitar acesso via CNPJ
- `src/pages/AccessRequestsPage.tsx` - Pagina do dono para gerenciar solicitacoes

### 3. Arquivos modificados

- `src/App.tsx` - Novas rotas `/request-access` e `/access-requests`; redirecionar contador sem empresas para `/request-access`
- `src/components/layout/AppSidebar.tsx` - Adicionar item "Solicitacoes" no menu (condicional por role)
- `src/components/layout/AppHeader.tsx` - Badge de notificacao com contagem real de solicitacoes pendentes
- `src/i18n/translations.ts` - Novas chaves de traducao

### 4. Traducoes novas

pt-BR:
- `requestAccess`: "Solicitar Acesso"
- `requestAccessDesc`: "Informe o CNPJ da empresa para solicitar vinculacao"
- `accessRequests`: "Solicitacoes de Acesso"
- `pendingRequests`: "Solicitacoes Pendentes"
- `approve`: "Aprovar"
- `reject`: "Rejeitar"
- `requestSent`: "Solicitacao enviada!"
- `requestApproved`: "Solicitacao aprovada!"
- `requestRejected`: "Solicitacao rejeitada"
- `companyNotFound`: "Empresa nao encontrada com este CNPJ"
- `alreadyRequested`: "Voce ja solicitou acesso a esta empresa"
- `accountantName`: "Contador"

en:
- `requestAccess`: "Request Access"
- `requestAccessDesc`: "Enter the company tax ID to request access"
- `accessRequests`: "Access Requests"
- `pendingRequests`: "Pending Requests"
- `approve`: "Approve"
- `reject`: "Reject"
- `requestSent`: "Request sent!"
- `requestApproved`: "Request approved!"
- `requestRejected`: "Request rejected"
- `companyNotFound`: "No company found with this tax ID"
- `alreadyRequested`: "You already requested access to this company"
- `accountantName`: "Accountant"

