ALTER TABLE public.iho_feedback DROP CONSTRAINT iho_feedback_rating_check;
ALTER TABLE public.iho_feedback ADD CONSTRAINT iho_feedback_rating_check CHECK (rating IN ('helpful','not_quite','confusing','click'));
ALTER TABLE public.iho_feedback DROP CONSTRAINT iho_feedback_component_check;
ALTER TABLE public.iho_feedback ADD CONSTRAINT iho_feedback_component_check CHECK (component IN ('read','followup','resource','overall','resource_click'));