
-- Employees table
CREATE TABLE public.employees (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  cpf text,
  position text,
  department text,
  salary numeric NOT NULL DEFAULT 0,
  hire_date date NOT NULL,
  termination_date date,
  status text NOT NULL DEFAULT 'active',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view employees" ON public.employees FOR SELECT USING (is_company_member(company_id, auth.uid()));
CREATE POLICY "Members can insert employees" ON public.employees FOR INSERT WITH CHECK (is_company_member(company_id, auth.uid()));
CREATE POLICY "Members can update employees" ON public.employees FOR UPDATE USING (is_company_member(company_id, auth.uid()));
CREATE POLICY "Members can delete employees" ON public.employees FOR DELETE USING (is_company_member(company_id, auth.uid()));

-- Payroll table
CREATE TABLE public.payroll (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  reference_month date NOT NULL,
  gross_salary numeric NOT NULL,
  inss_amount numeric NOT NULL DEFAULT 0,
  irrf_amount numeric NOT NULL DEFAULT 0,
  fgts_amount numeric NOT NULL DEFAULT 0,
  other_deductions numeric NOT NULL DEFAULT 0,
  other_additions numeric NOT NULL DEFAULT 0,
  net_salary numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  payment_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(employee_id, reference_month)
);

ALTER TABLE public.payroll ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view payroll" ON public.payroll FOR SELECT USING (is_company_member(company_id, auth.uid()));
CREATE POLICY "Members can insert payroll" ON public.payroll FOR INSERT WITH CHECK (is_company_member(company_id, auth.uid()));
CREATE POLICY "Members can update payroll" ON public.payroll FOR UPDATE USING (is_company_member(company_id, auth.uid()));
CREATE POLICY "Members can delete payroll" ON public.payroll FOR DELETE USING (is_company_member(company_id, auth.uid()));
