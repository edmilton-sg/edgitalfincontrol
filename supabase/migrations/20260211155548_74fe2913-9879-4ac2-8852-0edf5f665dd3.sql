
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

CREATE POLICY "Requesters can view own requests"
  ON public.access_requests FOR SELECT TO authenticated
  USING (requester_id = auth.uid());

CREATE POLICY "Owners can view requests for their companies"
  ON public.access_requests FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.companies
      WHERE companies.id = access_requests.company_id
      AND companies.owner_id = auth.uid()
    )
  );

CREATE POLICY "Accountants can create requests"
  ON public.access_requests FOR INSERT TO authenticated
  WITH CHECK (
    requester_id = auth.uid()
    AND has_role(auth.uid(), 'accountant'::app_role)
  );

CREATE POLICY "Owners can resolve requests"
  ON public.access_requests FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.companies
      WHERE companies.id = access_requests.company_id
      AND companies.owner_id = auth.uid()
    )
  );
