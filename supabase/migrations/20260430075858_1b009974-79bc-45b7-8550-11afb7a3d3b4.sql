DROP POLICY IF EXISTS "Anyone can insert submissions" ON public.iho_submissions;

CREATE POLICY "Anyone can insert bounded submissions"
  ON public.iho_submissions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    length(sentence) > 0
    AND length(sentence) <= 4000
    AND (context IS NULL OR length(context) <= 4000)
    AND length(session_id) > 0
    AND length(session_id) <= 128
  );