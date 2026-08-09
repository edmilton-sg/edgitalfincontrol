
-- 1. Helper: can access a company (owner, member or admin)
CREATE OR REPLACE FUNCTION public.can_access_company(_company_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.companies c WHERE c.id = _company_id AND c.owner_id = _user_id)
      OR public.is_company_member(_company_id, _user_id)
      OR public.has_role(_user_id, 'admin'::app_role)
$$;

-- 2. Profiles: only self, co-members of a shared company, or admins
DROP POLICY IF EXISTS "Authenticated can view profiles" ON public.profiles;

CREATE OR REPLACE FUNCTION public.shares_company_with(_other_user_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members m1
    JOIN public.company_members m2 ON m1.company_id = m2.company_id
    WHERE m1.user_id = _user_id AND m2.user_id = _other_user_id
  ) OR EXISTS (
    SELECT 1 FROM public.companies c
    WHERE (c.owner_id = _user_id AND public.is_company_member(c.id, _other_user_id))
       OR (c.owner_id = _other_user_id AND public.is_company_member(c.id, _user_id))
  )
$$;

CREATE POLICY "Users can view own and related profiles"
ON public.profiles FOR SELECT TO authenticated
USING (
  id = auth.uid()
  OR public.shares_company_with(id, auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

-- 3. Companies: remove broad accountant read, replace with scoped RPCs
DROP POLICY IF EXISTS "Accountants can search companies by cnpj" ON public.companies;

CREATE OR REPLACE FUNCTION public.search_company_by_cnpj(_cnpj text)
RETURNS TABLE (id uuid, name text, legal_name text, cnpj text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.id, c.name, c.legal_name, c.cnpj
  FROM public.companies c
  WHERE regexp_replace(coalesce(c.cnpj,''), '\D', '', 'g') = regexp_replace(coalesce(_cnpj,''), '\D', '', 'g')
    AND length(regexp_replace(coalesce(_cnpj,''), '\D', '', 'g')) = 14
    AND (public.has_role(auth.uid(), 'accountant'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role))
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.get_requested_companies()
RETURNS TABLE (id uuid, name text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.id, c.name
  FROM public.companies c
  JOIN public.access_requests r ON r.company_id = c.id
  WHERE r.requester_id = auth.uid()
$$;

REVOKE ALL ON FUNCTION public.search_company_by_cnpj(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_requested_companies() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.search_company_by_cnpj(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_requested_companies() TO authenticated;

-- 4. Storage: enforce company ownership on the attachments bucket
DROP POLICY IF EXISTS "Members can view attachments" ON storage.objects;
DROP POLICY IF EXISTS "Members can upload attachments" ON storage.objects;
DROP POLICY IF EXISTS "Members can delete attachments" ON storage.objects;

CREATE POLICY "Company members can view attachment objects"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'attachments'
  AND (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
  AND public.can_access_company(((storage.foldername(name))[1])::uuid, auth.uid())
);

CREATE POLICY "Company members can upload attachment objects"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'attachments'
  AND (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
  AND public.can_access_company(((storage.foldername(name))[1])::uuid, auth.uid())
);

CREATE POLICY "Company members can update attachment objects"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'attachments'
  AND (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
  AND public.can_access_company(((storage.foldername(name))[1])::uuid, auth.uid())
);

CREATE POLICY "Company members can delete attachment objects"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'attachments'
  AND (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
  AND public.can_access_company(((storage.foldername(name))[1])::uuid, auth.uid())
);

-- 5. Lock down SECURITY DEFINER / trigger functions from direct API execution
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user_role() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.apply_stock_movement() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_company_member(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_access_company(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.shares_company_with(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_company_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_company(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.shares_company_with(uuid, uuid) TO authenticated;
