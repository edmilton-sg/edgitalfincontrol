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