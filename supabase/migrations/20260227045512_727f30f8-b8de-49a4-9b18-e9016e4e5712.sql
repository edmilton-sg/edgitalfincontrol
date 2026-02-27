
CREATE TABLE public.pro_labore (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  member_name text NOT NULL,
  cpf text,
  amount numeric NOT NULL,
  inss_amount numeric NOT NULL DEFAULT 0,
  irrf_amount numeric NOT NULL DEFAULT 0,
  net_amount numeric NOT NULL,
  reference_month date NOT NULL,
  payment_date date,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.pro_labore ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view pro_labore"
ON public.pro_labore FOR SELECT
USING (is_company_member(company_id, auth.uid()));

CREATE POLICY "Members can insert pro_labore"
ON public.pro_labore FOR INSERT
WITH CHECK (is_company_member(company_id, auth.uid()));

CREATE POLICY "Members can update pro_labore"
ON public.pro_labore FOR UPDATE
USING (is_company_member(company_id, auth.uid()));

CREATE POLICY "Members can delete pro_labore"
ON public.pro_labore FOR DELETE
USING (is_company_member(company_id, auth.uid()));

CREATE INDEX idx_pro_labore_company_month ON public.pro_labore (company_id, reference_month);
