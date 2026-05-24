import { supabase } from "@/lib/supabase";
import { track } from "@/lib/analytics";

export type FeedbackRating = "helpful" | "not_quite" | "confusing";
export type FeedbackComponent = "read" | "followup" | "resource" | "overall";

export interface FeedbackInput {
  sessionId: string;
  component: FeedbackComponent;
  rating: FeedbackRating;
  note?: string | null;
  // Optional identifier for which card within a component (e.g. "wearing", "did", "tactic").
  // Stored inside note as a small prefix so we don't need a schema change.
  slot?: string | null;
}

/**
 * Record a feedback reaction. Fails silently — feedback must never break the UX.
 */
export async function logFeedback(input: FeedbackInput): Promise<void> {
  try {
    const { sessionId, component, rating, note, slot } = input;
    if (!sessionId) return;

    const composedNote = [slot ? `[${slot}]` : null, note?.trim() || null]
      .filter(Boolean)
      .join(" ")
      .slice(0, 1000);

    await supabase.from("iho_feedback").insert({
      session_id: sessionId,
      component,
      rating,
      note: composedNote || null,
    });

    track("iho_submission_received", {
      // Reuse a known event channel for visibility; the table is the source of truth.
      feedback_component: component,
      feedback_rating: rating,
    });
  } catch {
    // Intentionally swallowed.
  }
}
