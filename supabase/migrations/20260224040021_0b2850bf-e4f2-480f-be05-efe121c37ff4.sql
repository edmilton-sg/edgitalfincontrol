
-- Add source tracking columns to expenses
ALTER TABLE public.expenses ADD COLUMN source_type text;
ALTER TABLE public.expenses ADD COLUMN source_id uuid;

-- Unique constraint to prevent duplicates (only when both are not null)
CREATE UNIQUE INDEX idx_expenses_source ON public.expenses (source_type, source_id) WHERE source_type IS NOT NULL AND source_id IS NOT NULL;
