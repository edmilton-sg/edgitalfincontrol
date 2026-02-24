
-- Table: tax_settings (one config per company)
CREATE TABLE public.tax_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  tax_mode text NOT NULL DEFAULT 'percentage',
  tax_percentage numeric NOT NULL DEFAULT 6.0,
  fixed_amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tax_settings_company_unique UNIQUE (company_id)
);

ALTER TABLE public.tax_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view tax settings" ON public.tax_settings FOR SELECT USING (is_company_member(company_id, auth.uid()));
CREATE POLICY "Members can insert tax settings" ON public.tax_settings FOR INSERT WITH CHECK (is_company_member(company_id, auth.uid()));
CREATE POLICY "Members can update tax settings" ON public.tax_settings FOR UPDATE USING (is_company_member(company_id, auth.uid()));

CREATE TRIGGER update_tax_settings_updated_at BEFORE UPDATE ON public.tax_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Table: tax_payments
CREATE TABLE public.tax_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  reference_month date NOT NULL,
  tax_type text NOT NULL DEFAULT 'DAS',
  estimated_amount numeric NOT NULL DEFAULT 0,
  paid_amount numeric,
  due_date date NOT NULL,
  paid_date date,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tax_payments_unique UNIQUE (company_id, reference_month, tax_type)
);

ALTER TABLE public.tax_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view tax payments" ON public.tax_payments FOR SELECT USING (is_company_member(company_id, auth.uid()));
CREATE POLICY "Members can insert tax payments" ON public.tax_payments FOR INSERT WITH CHECK (is_company_member(company_id, auth.uid()));
CREATE POLICY "Members can update tax payments" ON public.tax_payments FOR UPDATE USING (is_company_member(company_id, auth.uid()));
CREATE POLICY "Members can delete tax payments" ON public.tax_payments FOR DELETE USING (is_company_member(company_id, auth.uid()));
