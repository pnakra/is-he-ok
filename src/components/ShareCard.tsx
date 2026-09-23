import { forwardRef } from "react";

type Props = { hisSentence: string; read: string };

const SYSTEM_SANS = "ui-sans-serif, system-ui, -apple-system, sans-serif";
const SYSTEM_SERIF = "ui-serif, Georgia, serif";

export const ShareCard = forwardRef<HTMLDivElement, Props>(function ShareCard(
  { hisSentence, read },
  ref,
) {
  const sans = `var(--font-sans), ${SYSTEM_SANS}`;
  const display = `var(--font-display, var(--font-serif)), ${SYSTEM_SERIF}`;
  const label = {
    fontFamily: sans,
    fontSize: 28,
    color: "var(--color-muted-foreground)",
    margin: 0,
  } as const;

  return (
    <div
      ref={ref}
      aria-hidden
      style={{
        position: "fixed",
        left: -10000,
        top: 0,
        pointerEvents: "none",
        width: 1080,
        height: 1350,
        padding: 96,
        boxSizing: "border-box",
        background: "var(--color-background)",
        color: "var(--color-foreground)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 28 }}>
        <p style={label}>He said:</p>
        <blockquote
          style={{
            fontFamily: display,
            fontStyle: "italic",
            fontSize: 64,
            lineHeight: 1.3,
            margin: 0,
            padding: "36px 44px",
            background: "var(--color-surface-2)",
            borderLeft: "8px solid var(--color-primary)",
            borderRadius: 16,
          }}
        >
          “{hisSentence}”
        </blockquote>
        <p style={{ ...label, marginTop: 40 }}>How it came across:</p>
        <p style={{ fontFamily: sans, fontSize: 40, lineHeight: 1.45, margin: 0 }}>{read}</p>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          fontFamily: sans,
          fontSize: 28,
          paddingTop: 40,
        }}
      >
        <span style={{ fontWeight: 500, color: "var(--color-foreground)" }}>is he ok?</span>
        <span style={{ color: "var(--color-muted-foreground)" }}>he.isthisok.app</span>
      </div>
    </div>
  );
});
