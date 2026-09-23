// Lightweight client-side analytics. We rely on Lovable's built-in project
// analytics for sessions/pageviews/dropoff (no code required, automatic once
// published). These named events let us see funnel transitions in the same
// dashboard. Never include free text or PII — submission content lives in the
// database (iho_submissions) for evals.
//
// Events we fire:
//   iho_submission_started   — user clicked the button with a non-empty input
//   iho_submission_received  — server returned a response (safe or analyzed)
//   iho_submission_failed    — network/parse error surfaced as fallback copy
//   iho_safety_flagged       — server returned safetyFlagged: true
//   iho_share_clicked        — share button copied the URL
//   iho_reset_clicked        — user started a new submission

type EventName =
  | "iho_submission_started"
  | "iho_submission_received"
  | "iho_submission_failed"
  | "iho_safety_flagged"
  | "iho_share_clicked"
  | "iho_read_copied"
  | "iho_reset_clicked"
  | "iho_triage_result"
  | "iho_card_opened"
  | "iho_card_saved";

type EventProps = Record<string, string | number | boolean>;

interface AnalyticsWindow extends Window {
  // Lovable / Plausible-style analytics often expose a `plausible` global.
  plausible?: (event: string, opts?: { props?: EventProps }) => void;
  // Generic queue some providers read from.
  dataLayer?: Array<Record<string, unknown>>;
}

export function track(event: EventName, props: EventProps = {}): void {
  if (typeof window === "undefined") return;
  try {
    const w = window as AnalyticsWindow;
    if (typeof w.plausible === "function") {
      w.plausible(event, { props });
      return;
    }
    if (Array.isArray(w.dataLayer)) {
      w.dataLayer.push({ event, ...props });
      return;
    }
  } catch {
    // Analytics must never break the UX.
  }
}
