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