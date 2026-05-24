CREATE TABLE public.iho_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NULL,
  session_id text NOT NULL,
  component text NOT NULL,
  rating text NOT NULL,
  note text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT iho_feedback_rating_check CHECK (rating IN ('helpful','not_quite','confusing')),
  CONSTRAINT iho_feedback_component_check CHECK (component IN ('read','followup','resource','overall'))
);

CREATE INDEX iho_feedback_submission_id_idx ON public.iho_feedback(submission_id);
CREATE INDEX iho_feedback_created_at_idx ON public.iho_feedback(created_at DESC);

ALTER TABLE public.iho_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert bounded feedback"
ON public.iho_feedback
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(session_id) > 0
  AND length(session_id) <= 128
  AND length(component) <= 32
  AND length(rating) <= 32
  AND (note IS NULL OR length(note) <= 1000)
);