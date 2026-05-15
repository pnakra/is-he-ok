ALTER TABLE public.iho_submissions
  ADD COLUMN IF NOT EXISTS followups jsonb,
  ADD COLUMN IF NOT EXISTS triage_status text;