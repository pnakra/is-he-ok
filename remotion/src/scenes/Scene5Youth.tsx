import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { COLORS, SANS, SERIF } from "../theme";
import { FadeIn } from "../components/Shared";
import "../fonts";

// 1200 frames = 40s
export const SCENE_5_FRAMES = 1200;

const PILLARS = [
  {
    title: "Real sentences",
    body: "Built from sentences young women actually shared with us.",
  },
  {
    title: "TikTok + DMs",
    body: "Informed by comments and DMs to early 'Is this ok?' ads.",
  },
  {
    title: "Prolific study",
    body: "What girls actually did after reading lines like these.",
  },
  {
    title: "Teen feedback",
    body: "Copy and UI rewritten based on direct feedback from teens.",
  },
];

const QUOTES = [
  "\"he said he was just worried about me\"",
  "\"why are you making this a big deal\"",
  "\"you always do this\"",
  "\"calm down, i was joking\"",
];

export const Scene5Youth: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, padding: 120 }}>
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
          Built with young people
        </div>
        <h2
          style={{
            fontFamily: SERIF,
            fontStyle: "italic",
            fontSize: 96,
            color: COLORS.fg,
            margin: 0,
            lineHeight: 1.05,
            letterSpacing: "-0.015em",
            maxWidth: 1500,
          }}
        >
          Built from real sentences young women shared.
        </h2>
      </FadeIn>

      {/* Pillars grid */}
      <div
        style={{
          marginTop: 80,
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 28,
          maxWidth: 1500,
        }}
      >
        {PILLARS.map((p, i) => (
          <FadeIn key={p.title} from={120 + i * 50} duration={24}>
            <div
              style={{
                border: `1px solid ${COLORS.border}`,
                borderRadius: 18,
                padding: "32px 36px",
                backgroundColor: COLORS.surface,
                minHeight: 180,
              }}
            >
              <div
                style={{
                  fontFamily: SANS,
                  fontSize: 28,
                  fontWeight: 600,
                  color: COLORS.fg,
                  marginBottom: 12,
                }}
              >
                {p.title}
              </div>
              <div
                style={{
                  fontFamily: SANS,
                  fontSize: 22,
                  color: COLORS.muted,
                  lineHeight: 1.5,
                }}
              >
                {p.body}
              </div>
            </div>
          </FadeIn>
        ))}
      </div>

      {/* Floating quote ribbon */}
      <FadeIn from={500} duration={30}>
        <div
          style={{
            marginTop: 60,
            display: "flex",
            gap: 20,
            flexWrap: "wrap",
            maxWidth: 1500,
          }}
        >
          {QUOTES.map((q, i) => {
            const drift = Math.sin((frame + i * 40) / 60) * 4;
            return (
              <div
                key={q}
                style={{
                  fontFamily: SERIF,
                  fontStyle: "italic",
                  fontSize: 22,
                  color: COLORS.muted,
                  border: `1px solid ${COLORS.divider}`,
                  borderRadius: 999,
                  padding: "10px 22px",
                  backgroundColor: COLORS.surface2,
                  transform: `translateY(${drift}px)`,
                }}
              >
                {q}
              </div>
            );
          })}
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};
