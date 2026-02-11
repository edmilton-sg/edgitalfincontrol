
# Corrigir atribuicao de role no cadastro e manter confirmacao de email

## Problema

Quando o usuario se cadastra com confirmacao de email ativada, ele nao tem sessao ativa apos o `signUp`. O INSERT manual na tabela `user_roles` (linha 43 do `SignUpPage.tsx`) falha silenciosamente por causa das politicas RLS que exigem `auth.uid()` -- que e `null` nesse momento.

## Solucao (padrao correto)

1. **Passar a role nos metadados do usuario** durante o cadastro (`raw_user_meta_data`)
2. **Criar um trigger no banco** que atribui a role automaticamente quando o usuario e criado, usando `SECURITY DEFINER` (sem depender de RLS)
3. **Remover o INSERT manual** do `SignUpPage.tsx`
4. **Corrigir o usuario existente** `edmilton.sg.junior@outlook.com` atribuindo role `accountant`

## Alteracoes

### 1. Migration SQL

- Inserir role `accountant` para o usuario `e418818c-dab4-44f7-b454-aad5f44bee96`
- Criar funcao `handle_new_user_role()` com `SECURITY DEFINER` que le `raw_user_meta_data->>'role'` e insere na `user_roles`
- Criar trigger `on_auth_user_created_role` em `auth.users` AFTER INSERT

### 2. `src/pages/SignUpPage.tsx`

- Adicionar `role` nos metadados: `data: { full_name: fullName, role }`
- Remover o bloco `if (data.user) { await supabase.from("user_roles").insert(...) }` (linhas 41-44), pois o trigger cuidara disso automaticamente

## Secao Tecnica

### Migration SQL

```sql
-- 1. Corrigir usuario existente
INSERT INTO public.user_roles (user_id, role)
VALUES ('e418818c-dab4-44f7-b454-aad5f44bee96', 'accountant')
ON CONFLICT (user_id, role) DO NOTHING;

-- 2. Funcao para atribuir role automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.raw_user_meta_data->>'role' IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, (NEW.raw_user_meta_data->>'role')::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- 3. Trigger na criacao do usuario
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();
```

### `src/pages/SignUpPage.tsx`

Antes:
```tsx
options: {
  data: { full_name: fullName },
  emailRedirectTo: window.location.origin,
},
// ...
if (data.user) {
  await supabase.from("user_roles").insert({ user_id: data.user.id, role });
}
```

Depois:
```tsx
options: {
  data: { full_name: fullName, role },
  emailRedirectTo: window.location.origin,
},
// (sem INSERT manual -- o trigger cuida disso)
```
