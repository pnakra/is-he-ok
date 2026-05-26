import { useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  /** Kept for back-compat; popover always handles the "why". */
  allowNote?: boolean;
  /** Larger style for the end-of-flow overall prompt. */
  emphasis?: "subtle" | "soft";
  /** Layout alignment for the row. */
  align?: "left" | "center";
}

const REASONS: Record<FeedbackComponent, string[]> = {
  read: ["Doesn't match", "Too harsh", "Too soft", "Confusing"],
  followup: ["Not relevant", "Too many", "Confusing"],
  resource: ["Not relevant", "Bad link", "Not helpful"],
  overall: ["Didn't match", "Too generic", "Missing something", "Confusing"],
  // resource_click etc. won't render this component, but keep TS happy.
} as unknown as Record<FeedbackComponent, string[]>;

export function FeedbackChips({
  sessionId,
  component,
  slot,
  prompt = "Did this land?",
  emphasis = "subtle",
  align = "left",
}: FeedbackChipsProps) {
  const [picked, setPicked] = useState<"up" | "down" | null>(null);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);

  const reasons = REASONS[component] ?? REASONS.overall;

  const send = (
    rating: FeedbackRating,
    extra?: { reason?: string | null; note?: string | null },
  ) => {
    const parts = [
      extra?.reason ? `reason: ${extra.reason}` : null,
      extra?.note?.trim() ? extra.note.trim() : null,
    ].filter(Boolean);
    void logFeedback({
      sessionId,
      component,
      rating,
      slot,
      note: parts.length ? parts.join(" — ") : undefined,
    });
  };

  const handleUp = () => {
    if (picked) return;
    setPicked("up");
    send("helpful");
  };

  const handleDown = () => {
    if (picked) return;
    setPicked("down");
    setOpen(true);
    // Log a baseline immediately, so we capture the negative signal
    // even if the user dismisses the popover.
    send("not_quite");
  };

  const submitReason = () => {
    if (sent) {
      setOpen(false);
      return;
    }
    // Send a second row with structured detail; analytics joins by session+slot.
    send("not_quite", { reason, note });
    setSent(true);
    setOpen(false);
  };

  const promptColor =
    emphasis === "soft" ? "var(--color-muted-foreground)" : "var(--color-text-faint)";
  const promptSize = emphasis === "soft" ? "13px" : "12px";

  const iconBtn = (active: boolean, faded: boolean): React.CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "30px",
    height: "30px",
    borderRadius: "999px",
    border: `1px solid ${active ? "var(--color-primary)" : "var(--color-divider)"}`,
    background: active ? "var(--color-primary)" : "transparent",
    color: active
      ? "var(--color-primary-foreground, #fff)"
      : faded
        ? "var(--color-text-faint)"
        : "var(--color-muted-foreground)",
    opacity: faded ? 0.5 : 1,
    cursor: picked ? "default" : "pointer",
    transition: "all 150ms ease",
    padding: 0,
  });

  return (
    <div
      style={{
        marginTop: emphasis === "soft" ? "0" : "10px",
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
      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
        <button
          type="button"
          onClick={handleUp}
          disabled={picked !== null}
          aria-label="Helpful"
          aria-pressed={picked === "up"}
          style={iconBtn(picked === "up", picked === "down")}
        >
          <ThumbsUp size={14} strokeWidth={2} />
        </button>

        <Popover
          open={open}
          onOpenChange={(o) => {
            // Only allow opening via thumbs-down click; allow closing freely.
            if (!o) setOpen(false);
          }}
        >
          <PopoverTrigger asChild>
            <button
              type="button"
              onClick={handleDown}
              disabled={picked !== null && picked !== "down"}
              aria-label="Not helpful"
              aria-pressed={picked === "down"}
              style={iconBtn(picked === "down", picked === "up")}
            >
              <ThumbsDown size={14} strokeWidth={2} />
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            side="bottom"
            sideOffset={8}
            collisionPadding={12}
            className="w-[280px] sm:w-[320px] p-4 rounded-xl shadow-lg"
            style={{
              background: "var(--color-background)",
              border: "1px solid var(--color-divider)",
              boxShadow: "0 10px 30px -10px rgba(0,0,0,0.15)",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "13px",
                fontWeight: 500,
                color: "var(--color-foreground)",
                marginBottom: "10px",
              }}
            >
              What went wrong?
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "6px",
                marginBottom: "10px",
              }}
            >
              {reasons.map((r) => {
                const active = reason === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setReason(active ? null : r)}
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: "12px",
                      lineHeight: 1,
                      padding: "6px 10px",
                      borderRadius: "999px",
                      border: `1px solid ${active ? "var(--color-primary)" : "var(--color-divider)"}`,
                      background: active ? "var(--color-primary)" : "transparent",
                      color: active
                        ? "var(--color-primary-foreground, #fff)"
                        : "var(--color-muted-foreground)",
                      cursor: "pointer",
                    }}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 500))}
              placeholder="Anything else? (optional)"
              maxLength={500}
              rows={2}
              style={{
                width: "100%",
                fontFamily: "var(--font-sans)",
                fontSize: "13px",
                padding: "8px 10px",
                borderRadius: "6px",
                border: "1px solid var(--color-divider)",
                background: "transparent",
                color: "var(--color-foreground)",
                outline: "none",
                resize: "none",
                marginBottom: "8px",
              }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
              <button
                type="button"
                onClick={() => setOpen(false)}
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "12px",
                  padding: "6px 10px",
                  borderRadius: "6px",
                  border: "1px solid transparent",
                  background: "transparent",
                  color: "var(--color-muted-foreground)",
                  cursor: "pointer",
                }}
              >
                Skip
              </button>
              <button
                type="button"
                onClick={submitReason}
                disabled={!reason && !note.trim()}
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "12px",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  border: "1px solid var(--color-primary)",
                  background: "var(--color-primary)",
                  color: "var(--color-primary-foreground, #fff)",
                  cursor: !reason && !note.trim() ? "not-allowed" : "pointer",
                  opacity: !reason && !note.trim() ? 0.5 : 1,
                }}
              >
                Send
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
