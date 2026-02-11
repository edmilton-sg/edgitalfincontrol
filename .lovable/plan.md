

# Correcao do Erro 403 no Cadastro de Empresa

## Causa raiz

O problema NAO esta na politica de INSERT. O INSERT em si seria bem-sucedido, mas o codigo usa `.select("id")` encadeado apos o INSERT:

```typescript
await supabase.from("companies").insert({...}).select("id").single();
```

Isso faz o PostgREST executar um SELECT logo apos o INSERT, na mesma transacao. A politica de SELECT exige `is_company_member(id, auth.uid())`, mas nesse momento a linha em `company_members` ainda nao foi criada -- ela so e inserida depois, no codigo. Resultado: o SELECT falha com 403.

## Solucao

Adicionar `owner_id = auth.uid()` como condicao alternativa na politica de SELECT da tabela `companies`. Isso permite que o dono da empresa recém-criada consiga ler o registro imediatamente, sem depender da tabela `company_members`.

## Detalhes tecnicos

### 1. Migration SQL

Substituir a politica de SELECT atual:

```sql
DROP POLICY IF EXISTS "Members can view companies" ON public.companies;

CREATE POLICY "Members can view companies"
  ON public.companies
  FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid()
    OR is_company_member(id, auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
  );
```

### 2. Nenhuma alteracao de codigo necessaria

O codigo atual em `CompanySetupPage.tsx` ja esta correto com o fluxo INSERT + UPDATE separados. A unica correcao e na politica de seguranca do banco.

