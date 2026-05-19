import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { COLORS, SANS } from "../theme";
import { BrowserFrame, Cursor, FadeIn } from "../components/Shared";
import "../fonts";

// 1500 frames = 50s
export const SCENE_3_FRAMES = 1500;

const QUESTIONS = [
  {
    prompt: "Has this happened before, or was it just this one time?",
    options: ["Just this one time", "A few times", "It happens a lot", "I'm not sure"],
    pick: 1,
  },
  {
    prompt: "When you push back or disagree, what usually happens?",
    options: [
      "He listens / we can talk about it",
      "He gets defensive",
      "He shuts down or pulls away",
      "He turns it back on me",
    ],
    pick: 1,
  },
  {
    prompt: "After this, did you still feel free to disagree or say no?",
    options: ["Yes", "Kind of", "No", "I'm not sure"],
    pick: 1,
  },
];

export const Scene3Questions: React.FC = () => {
  const frame = useCurrentFrame();

  // Click sequence: q1 at 280, q2 at 600, q3 at 920, continue at 1300
  const clickFrames = [280, 600, 920, 1300];
  const picks = [
    frame >= clickFrames[0] ? 1 : -1,
    frame >= clickFrames[1] ? 1 : -1,
    frame >= clickFrames[2] ? 1 : -1,
  ];

  // Approximate option positions for cursor (within browser inner content)
  const waypoints = [
    { frame: 0, x: 1500, y: 800 },
    { frame: 200, x: 720, y: 290 },
    { frame: 280, x: 720, y: 290, click: true },
    { frame: 500, x: 720, y: 510 },
    { frame: 600, x: 720, y: 510, click: true },
    { frame: 820, x: 540, y: 740 },
    { frame: 920, x: 540, y: 740, click: true },
    { frame: 1200, x: 800, y: 880 },
    { frame: 1300, x: 800, y: 880, click: true },
    { frame: 1500, x: 800, y: 880 },
  ];

  const continueHover = frame >= 1230;

  return (
    <BrowserFrame>
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: COLORS.bg,
          fontFamily: SANS,
          color: COLORS.fg,
          padding: "50px 80px 40px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            maxWidth: 1100,
            margin: "0 auto 40px",
          }}
        >
          <span style={{ fontSize: 22, fontWeight: 500 }}>is he ok?</span>
          <span style={{ fontSize: 20, color: COLORS.faint }}>About</span>
        </div>

        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <FadeIn from={0} duration={20}>
            <p
              style={{
                fontSize: 24,
                color: COLORS.muted,
                marginBottom: 36,
                lineHeight: 1.6,
              }}
            >
              A few quick questions so the read is more grounded.
            </p>
          </FadeIn>

          <div style={{ display: "flex", flexDirection: "column", gap: 38 }}>
            {QUESTIONS.map((q, qi) => (
              <FadeIn from={20 + qi * 20} duration={22} key={qi}>
                <p
                  style={{
                    fontSize: 26,
                    margin: 0,
                    marginBottom: 16,
                    lineHeight: 1.4,
                  }}
                >
                  {q.prompt}
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {q.options.map((opt, oi) => {
                    const selected = picks[qi] === oi;
                    return (
                      <div
                        key={opt}
                        style={{
                          fontSize: 20,
                          border: `1px solid ${
                            selected ? COLORS.primary : COLORS.border
                          }`,
                          borderRadius: 10,
                          padding: "12px 22px",
                          backgroundColor: selected
                            ? COLORS.accentSoft
                            : COLORS.surface,
                          color: selected ? COLORS.primaryHover : COLORS.fg,
                          transition: "all 0.2s",
                        }}
                      >
                        {opt}
                      </div>
                    );
                  })}
                </div>
              </FadeIn>
            ))}
          </div>

          <div style={{ marginTop: 50 }}>
            <div
              style={{
                display: "inline-flex",
                padding: "16px 32px",
                backgroundColor: continueHover
                  ? COLORS.primaryHover
                  : COLORS.primary,
                color: COLORS.surface,
                borderRadius: 12,
                fontSize: 20,
                fontWeight: 500,
              }}
            >
              Continue
            </div>
          </div>
        </div>

        <Cursor waypoints={waypoints} />
      </div>
    </BrowserFrame>
  );
};
