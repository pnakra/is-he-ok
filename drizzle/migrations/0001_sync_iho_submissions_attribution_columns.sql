ALTER TABLE public.iho_submissions ADD COLUMN IF NOT EXISTS utm_source text;
ALTER TABLE public.iho_submissions ADD COLUMN IF NOT EXISTS utm_medium text;
ALTER TABLE public.iho_submissions ADD COLUMN IF NOT EXISTS utm_campaign text;
ALTER TABLE public.iho_submissions ADD COLUMN IF NOT EXISTS utm_content text;
ALTER TABLE public.iho_submissions ADD COLUMN IF NOT EXISTS referrer_host text;
ALTER TABLE public.iho_submissions ADD COLUMN IF NOT EXISTS entry_method text;