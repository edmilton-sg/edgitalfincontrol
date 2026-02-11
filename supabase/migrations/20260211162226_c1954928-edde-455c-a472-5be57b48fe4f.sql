-- Allow accountants to search companies by CNPJ for access requests
CREATE POLICY "Accountants can search companies by cnpj"
ON public.companies
FOR SELECT
USING (
  has_role(auth.uid(), 'accountant'::app_role)
);