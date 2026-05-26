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
 * Routes through the server endpoint so we can also notify Slack with the
 * full submission context (sentence + AI analysis) attached.
 */
export async function logFeedback(input: FeedbackInput): Promise<void> {
  try {
    const { sessionId, component, rating, note, slot } = input;
    if (!sessionId) return;

    await fetch("/api/public/notify-feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        component,
        rating,
        note: note ?? null,
        slot: slot ?? null,
      }),
      keepalive: true,
    });

    track("iho_submission_received", {
      feedback_component: component,
      feedback_rating: rating,
    });
  } catch {
    // Intentionally swallowed.
  }
}

/**
 * Record that a user clicked a suggested resource link. Stored in the same
 * iho_feedback table so we can join click-throughs back to a session.
 */
export async function logResourceClick(input: {
  sessionId: string;
  url: string;
  label: string;
}): Promise<void> {
  try {
    const { sessionId, url, label } = input;
    if (!sessionId) return;
    const note = `${label} — ${url}`.slice(0, 1000);
    await supabase.from("iho_feedback").insert({
      session_id: sessionId,
      component: "resource_click",
      rating: "click",
      note,
    });
  } catch {
    // Intentionally swallowed.
  }
}
