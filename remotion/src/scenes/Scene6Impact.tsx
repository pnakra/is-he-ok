import React from "react";
import { AbsoluteFill } from "remotion";
import { COLORS, SANS, SERIF } from "../theme";
import { FadeIn } from "../components/Shared";
import "../fonts";

// 900 frames = 30s
export const SCENE_6_FRAMES = 900;

const COLUMNS = [
  {
    title: "Clarity",
    body: "Understanding why a line felt off.",
    icon: "◐",
  },
  {
    title: "Self-trust",
    body: "Trusting your reaction instead of shrinking.",
    icon: "◆",
  },
  {
    title: "Help-seeking",
    body: "Talking to a friend, an adult, or a hotline.",
    icon: "✦",
  },
];

export const Scene6Impact: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg,
        padding: 120,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <FadeIn from={0} duration={24}>
        <div
          style={{
            fontFamily: SANS,
            fontSize: 22,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: COLORS.faint,
            marginBottom: 24,
          }}
        >
          Measuring what matters
        </div>
        <h2
          style={{
            fontFamily: SERIF,
            fontStyle: "italic",
            fontSize: 92,
            color: COLORS.fg,
            margin: 0,
            lineHeight: 1.05,
            letterSpacing: "-0.015em",
            marginBottom: 80,
            maxWidth: 1500,
          }}
        >
          Three things we're tracking.
        </h2>
      </FadeIn>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 32,
        }}
      >
        {COLUMNS.map((c, i) => (
          <FadeIn key={c.title} from={60 + i * 50} duration={24}>
            <div
              style={{
                border: `1px solid ${COLORS.border}`,
                borderRadius: 20,
                padding: "44px 36px",
                backgroundColor: COLORS.surface,
                minHeight: 320,
              }}
            >
              <div
                style={{
                  fontSize: 54,
                  color: COLORS.primary,
                  marginBottom: 24,
                }}
              >
                {c.icon}
              </div>
              <div
                style={{
                  fontFamily: SANS,
                  fontSize: 36,
                  fontWeight: 600,
                  color: COLORS.fg,
                  marginBottom: 16,
                }}
              >
                {c.title}
              </div>
              <div
                style={{
                  fontFamily: SANS,
                  fontSize: 24,
                  color: COLORS.muted,
                  lineHeight: 1.5,
                }}
              >
                {c.body}
              </div>
            </div>
          </FadeIn>
        ))}
      </div>
    </AbsoluteFill>
  );
};
