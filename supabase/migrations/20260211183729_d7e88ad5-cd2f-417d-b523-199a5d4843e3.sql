
-- Create categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, name)
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Members can view categories"
ON public.categories FOR SELECT
USING (is_company_member(company_id, auth.uid()));

CREATE POLICY "Members can insert categories"
ON public.categories FOR INSERT
WITH CHECK (is_company_member(company_id, auth.uid()));

CREATE POLICY "Members can update categories"
ON public.categories FOR UPDATE
USING (is_company_member(company_id, auth.uid()));

CREATE POLICY "Members can delete categories"
ON public.categories FOR DELETE
USING (is_company_member(company_id, auth.uid()));
