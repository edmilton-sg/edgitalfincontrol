
-- 1.1 Add recurring columns to revenues
ALTER TABLE public.revenues
  ADD COLUMN is_recurring boolean NOT NULL DEFAULT false,
  ADD COLUMN recurrence_interval text,
  ADD COLUMN recurrence_group_id uuid;

-- 1.1 Add recurring columns to expenses
ALTER TABLE public.expenses
  ADD COLUMN is_recurring boolean NOT NULL DEFAULT false,
  ADD COLUMN recurrence_interval text,
  ADD COLUMN recurrence_group_id uuid;

-- 1.2 Attachments table
CREATE TABLE public.attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_type text NOT NULL,
  record_id uuid NOT NULL,
  company_id uuid NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size integer NOT NULL,
  content_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view attachments"
  ON public.attachments FOR SELECT
  USING (is_company_member(company_id, auth.uid()));

CREATE POLICY "Members can insert attachments"
  ON public.attachments FOR INSERT
  WITH CHECK (is_company_member(company_id, auth.uid()));

CREATE POLICY "Members can delete attachments"
  ON public.attachments FOR DELETE
  USING (is_company_member(company_id, auth.uid()));

-- 1.3 Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', false);

CREATE POLICY "Members can upload attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'attachments' AND auth.role() = 'authenticated');

CREATE POLICY "Members can view attachments"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'attachments' AND auth.role() = 'authenticated');

CREATE POLICY "Members can delete attachments"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'attachments' AND auth.role() = 'authenticated');
