import { useState } from "react";
import {
  logFeedback,
  type FeedbackComponent,
  type FeedbackRating,
} from "@/lib/feedback";

interface FeedbackChipsProps {
  sessionId: string;
  component: FeedbackComponent;
  slot?: string;
  /** Slightly different prompt text per context. */
  prompt?: string;
  /** When true, shows an optional one-line note input on "not_quite" / "confusing". */
  allowNote?: boolean;
  /** Larger style for the end-of-flow overall prompt. */
  emphasis?: "subtle" | "soft";
  /** Layout alignment for the row. */
  align?: "left" | "center";
}

const OPTIONS: Array<{ rating: FeedbackRating; label: string }> = [
  { rating: "helpful", label: "Yes" },
  { rating: "not_quite", label: "Not quite" },
  { rating: "confusing", label: "Something else" },
];

export function FeedbackChips({
  sessionId,
  component,
  slot,
  prompt = "Did this land?",
  allowNote = false,
  emphasis = "subtle",
  align = "left",
}: FeedbackChipsProps) {
  const [picked, setPicked] = useState<FeedbackRating | null>(null);
  const [note, setNote] = useState("");
  const [noteSent, setNoteSent] = useState(false);

  const showNoteField =
    allowNote && (picked === "not_quite" || picked === "confusing") && !noteSent;

  const handlePick = (rating: FeedbackRating) => {
    if (picked) return;
    setPicked(rating);
    void logFeedback({ sessionId, component, rating, slot });
  };

  const handleSendNote = () => {
    if (!picked || !note.trim()) {
      setNoteSent(true);
      return;
    }
    void logFeedback({
      sessionId,
      component,
      rating: picked,
      slot,
      note: note.trim(),
    });
    setNoteSent(true);
  };

  const promptColor =
    emphasis === "soft" ? "var(--color-muted-foreground)" : "var(--color-text-faint)";
  const promptSize = emphasis === "soft" ? "13px" : "12px";

  return (
    <div
      style={{
        marginTop: emphasis === "soft" ? "0" : "10px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        alignItems: align === "center" ? "center" : "stretch",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: align === "center" ? "center" : "flex-start",
          gap: "10px",
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: promptSize,
            color: promptColor,
          }}
        >
          {picked ? "Thanks — noted." : prompt}
        </span>
        <div style={{ display: "flex", gap: "6px" }}>
          {OPTIONS.map((opt) => {
            const isPicked = picked === opt.rating;
            const isFaded = picked !== null && !isPicked;
            return (
              <button
                key={opt.rating}
                type="button"
                onClick={() => handlePick(opt.rating)}
                disabled={picked !== null}
                aria-pressed={isPicked}
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "12px",
                  lineHeight: 1,
                  padding: "6px 10px",
                  borderRadius: "999px",
                  border: `1px solid ${isPicked ? "var(--color-primary)" : "var(--color-divider)"}`,
                  background: isPicked ? "var(--color-primary)" : "transparent",
                  color: isPicked
                    ? "var(--color-primary-foreground, #fff)"
                    : isFaded
                      ? "var(--color-text-faint)"
                      : "var(--color-muted-foreground)",
                  opacity: isFaded ? 0.5 : 1,
                  cursor: picked ? "default" : "pointer",
                  transition: "all 150ms ease",
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {showNoteField && (
        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 240))}
            placeholder="One line on what missed (optional)"
            maxLength={240}
            style={{
              flex: 1,
              fontFamily: "var(--font-sans)",
              fontSize: "13px",
              padding: "8px 10px",
              borderRadius: "6px",
              border: "1px solid var(--color-divider)",
              background: "transparent",
              color: "var(--color-foreground)",
              outline: "none",
            }}
          />
          <button
            type="button"
            onClick={handleSendNote}
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "12px",
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid var(--color-divider)",
              background: "transparent",
              color: "var(--color-muted-foreground)",
              cursor: "pointer",
            }}
          >
            Send
          </button>
        </div>
      )}
    </div>
  );
}
