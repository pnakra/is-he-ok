import { supabase } from "@/lib/supabase";

export interface SubmissionLogInput {
  sessionId: string;
  sentence: string;
  context?: string | null;
  analysis?: string | null;
  safetyFlagged?: boolean;
}

/**
 * Log a submission to the iho_submissions table.
 *
 * Fails silently by design — logging must never break the user experience
 * or surface an error to the woman using the app.
 */
export async function logSubmission(input: SubmissionLogInput): Promise<void> {
  try {
    const { sessionId, sentence, context, analysis, safetyFlagged } = input;

    if (!sessionId || !sentence || !sentence.trim()) return;

    await supabase.from("iho_submissions").insert({
      session_id: sessionId,
      sentence,
      context: context ?? null,
      analysis: analysis ?? null,
      safety_flagged: safetyFlagged ?? false,
    });
  } catch {
    // Intentionally swallowed.
  }
}
