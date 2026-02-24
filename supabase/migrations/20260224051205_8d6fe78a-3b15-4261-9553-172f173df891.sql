
CREATE TABLE public.company_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  content_type TEXT NOT NULL,
  expires_at DATE,
  alert_days_before INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.company_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view documents" ON public.company_documents
  FOR SELECT USING (is_company_member(company_id, auth.uid()));

CREATE POLICY "Members can insert documents" ON public.company_documents
  FOR INSERT WITH CHECK (is_company_member(company_id, auth.uid()));

CREATE POLICY "Members can update documents" ON public.company_documents
  FOR UPDATE USING (is_company_member(company_id, auth.uid()));

CREATE POLICY "Members can delete documents" ON public.company_documents
  FOR DELETE USING (is_company_member(company_id, auth.uid()));

CREATE TRIGGER update_company_documents_updated_at
  BEFORE UPDATE ON public.company_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
