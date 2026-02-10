
-- Drop the restrictive policy and recreate as permissive
DROP POLICY "Authenticated can create companies" ON public.companies;
CREATE POLICY "Authenticated can create companies"
  ON public.companies FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());
