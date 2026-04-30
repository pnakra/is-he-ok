CREATE TABLE public.iho_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  sentence text NOT NULL,
  context text,
  analysis text,
  safety_flagged boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.iho_submissions ENABLE ROW LEVEL SECURITY;

-- Allow anonymous (and authenticated) clients to insert. No SELECT/UPDATE/DELETE policies => denied by RLS.
CREATE POLICY "Anyone can insert submissions"
  ON public.iho_submissions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE INDEX iho_submissions_session_id_idx ON public.iho_submissions (session_id);
CREATE INDEX iho_submissions_created_at_idx ON public.iho_submissions (created_at DESC);