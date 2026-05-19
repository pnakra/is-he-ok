import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { COLORS, SANS, SERIF } from "../theme";
import { FadeIn } from "../components/Shared";
import "../fonts";

// 900 frames = 30s
export const SCENE_7_FRAMES = 900;

const BULLETS = [
  "Focuses on one sentence plus context.",
  "Targets subtle coercion and confidence erosion.",
  "Uses AI as a reflection tool, not a judge.",
];

export const Scene7Closing: React.FC = () => {
  const frame = useCurrentFrame();
  const fade = interpolate(
    frame,
    [SCENE_7_FRAMES - 60, SCENE_7_FRAMES],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg,
        padding: 120,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        opacity: fade,
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
            marginBottom: 28,
          }}
        >
          Why this is different
        </div>
        <h2
          style={{
            fontFamily: SERIF,
            fontStyle: "italic",
            fontSize: 110,
            color: COLORS.fg,
            margin: 0,
            lineHeight: 1.0,
            letterSpacing: "-0.015em",
            maxWidth: 1500,
          }}
        >
          A reflection tool, not a verdict.
        </h2>
      </FadeIn>

      <div
        style={{
          marginTop: 70,
          display: "flex",
          flexDirection: "column",
          gap: 22,
          maxWidth: 1400,
        }}
      >
        {BULLETS.map((b, i) => (
          <FadeIn key={b} from={80 + i * 40} duration={22}>
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 22,
                fontFamily: SANS,
                fontSize: 34,
                color: COLORS.fg,
                lineHeight: 1.4,
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: 14,
                  height: 14,
                  borderRadius: 7,
                  backgroundColor: COLORS.primary,
                  marginTop: 18,
                  flexShrink: 0,
                }}
              />
              <span>{b}</span>
            </div>
          </FadeIn>
        ))}
      </div>

      <FadeIn from={300} duration={30}>
        <div
          style={{
            marginTop: 100,
            paddingTop: 30,
            borderTop: `1px solid ${COLORS.divider}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontFamily: SANS,
            fontSize: 24,
            color: COLORS.faint,
          }}
        >
          <span>Thank you.</span>
          <span style={{ color: COLORS.primary }}>isheok.app</span>
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};
