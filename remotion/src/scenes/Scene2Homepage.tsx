import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { COLORS, SANS } from "../theme";
import { BrowserFrame, Cursor, typewriter, FadeIn } from "../components/Shared";
import "../fonts";

// 1200 frames = 40s
export const SCENE_2_FRAMES = 1200;

const TYPE_START = 320;
const TYPE_END = 720;
const FULL_TEXT = "You're too sensitive";

const CHIPS = [
  "You're too sensitive",
  "I was just joking",
  "Why are you making this a big deal?",
  "You always do this",
  "You're overthinking it",
  "Calm down",
];

export const Scene2Homepage: React.FC = () => {
  const frame = useCurrentFrame();
  // Browser inner content is 1680 wide, ~896 tall.
  // App centers content in 720px column. Center: 840.

  // Cursor waypoints (within browser-frame inner content coords)
  const waypoints = [
    { frame: 0, x: 1500, y: 800 },
    { frame: 60, x: 760, y: 540 }, // hover first chip
    { frame: 120, x: 920, y: 540 }, // hover second chip
    { frame: 180, x: 1100, y: 540 }, // hover third
    { frame: 240, x: 760, y: 330, click: true }, // click into textarea
    { frame: 320, x: 760, y: 330 },
    { frame: 760, x: 760, y: 330 }, // stay during typing
    { frame: 820, x: 480, y: 670, click: true }, // click "Add context"
    { frame: 900, x: 480, y: 670 },
    { frame: 1100, x: 540, y: 820 }, // approach button
    { frame: 1200, x: 540, y: 820 },
  ];

  const typed = typewriter(FULL_TEXT, frame, TYPE_START, 0.06 * 30); // ~1.8 chars/sec... actually charsPerFrame
  // We want full text by frame 720: 20 chars over 400 frames = 0.05/frame. Let's recompute:
  const typedChars = Math.min(
    FULL_TEXT.length,
    Math.max(0, Math.floor((frame - TYPE_START) * 0.05 * 30 / 30 * 1.5)),
  );
  // Simpler: spread typing over TYPE_END-TYPE_START frames.
  const progress = interpolate(
    frame,
    [TYPE_START, TYPE_END],
    [0, FULL_TEXT.length],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const displayText = FULL_TEXT.slice(0, Math.floor(progress));

  const cursorBlink = Math.floor(frame / 15) % 2 === 0;
  const showContext = frame >= 870;
  const contextExpand = interpolate(frame, [870, 920], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Hover highlight for chips
  const hoveredChip =
    frame >= 60 && frame < 120
      ? 0
      : frame >= 120 && frame < 180
      ? 1
      : frame >= 180 && frame < 240
      ? 2
      : -1;

  const buttonHover = frame >= 1140;

  return (
    <BrowserFrame>
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: COLORS.bg,
          fontFamily: SANS,
          color: COLORS.fg,
          padding: "60px 80px",
          overflow: "hidden",
        }}
      >
        {/* Brand bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 60,
            maxWidth: 1100,
            margin: "0 auto 60px",
          }}
        >
          <span style={{ fontSize: 22, fontWeight: 500 }}>is he ok?</span>
          <span style={{ fontSize: 20, color: COLORS.faint }}>About</span>
        </div>

        {/* Centered column */}
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <FadeIn from={0} duration={20}>
            <h1
              style={{
                fontSize: 56,
                fontWeight: 600,
                letterSpacing: "-0.01em",
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              Tell us what he said.
            </h1>
            <p
              style={{
                fontSize: 26,
                color: COLORS.faint,
                marginTop: 14,
                marginBottom: 36,
              }}
            >
              A clearer way to make sense of one sentence.
            </p>
          </FadeIn>

          {/* Textarea */}
          <div
            style={{
              backgroundColor: COLORS.surface,
              border: `2px solid ${
                frame >= 240 ? COLORS.primary : COLORS.border
              }`,
              borderRadius: 12,
              padding: "26px 28px",
              minHeight: 140,
              fontSize: 30,
              color: displayText.length > 0 ? COLORS.fg : COLORS.faint,
              fontStyle: displayText.length > 0 ? "normal" : "normal",
              transition: "border-color 0.3s",
              boxShadow:
                frame >= 240
                  ? `0 0 0 6px ${COLORS.accentSoft}`
                  : "none",
            }}
          >
            {displayText.length === 0 ? (
              <span style={{ color: COLORS.faint }}>
                e.g. "you're too sensitive"
              </span>
            ) : (
              <>
                {displayText}
                {frame >= TYPE_START &&
                  frame < TYPE_END + 60 &&
                  cursorBlink && (
                    <span
                      style={{
                        display: "inline-block",
                        width: 2,
                        height: 30,
                        backgroundColor: COLORS.fg,
                        marginLeft: 2,
                        verticalAlign: "middle",
                      }}
                    />
                  )}
              </>
            )}
          </div>

          {/* Chips */}
          <div style={{ marginTop: 36 }}>
            <p
              style={{
                fontSize: 20,
                color: COLORS.faint,
                marginBottom: 14,
              }}
            >
              Or pick one to start:
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              {CHIPS.map((chip, i) => (
                <div
                  key={chip}
                  style={{
                    fontSize: 20,
                    border: `1px solid ${
                      hoveredChip === i ? COLORS.fg : COLORS.border
                    }`,
                    borderRadius: 10,
                    padding: "12px 22px",
                    backgroundColor:
                      hoveredChip === i ? COLORS.surface2 : COLORS.surface,
                    transition: "all 0.2s",
                  }}
                >
                  {chip}
                </div>
              ))}
            </div>
          </div>

          {/* Add context */}
          <div style={{ marginTop: 40 }}>
            {!showContext ? (
              <span style={{ fontSize: 20, color: COLORS.faint }}>
                + Add a little context (optional)
              </span>
            ) : (
              <div
                style={{
                  opacity: contextExpand,
                  transform: `translateY(${(1 - contextExpand) * 8}px)`,
                }}
              >
                <div style={{ fontSize: 20, color: COLORS.muted }}>
                  Add a little context (optional)
                </div>
                <div
                  style={{ fontSize: 18, color: COLORS.faint, marginTop: 6 }}
                >
                  You can include what happened before, how he said it, or what
                  felt off.
                </div>
                <div
                  style={{
                    marginTop: 12,
                    backgroundColor: COLORS.surface,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 10,
                    padding: "16px 20px",
                    minHeight: 80,
                    fontSize: 22,
                    color: COLORS.faint,
                  }}
                >
                  One or two lines.
                </div>
              </div>
            )}
          </div>

          {/* Button */}
          <div style={{ marginTop: 48 }}>
            <div
              style={{
                display: "inline-flex",
                padding: "20px 36px",
                backgroundColor: buttonHover
                  ? COLORS.primaryHover
                  : COLORS.primary,
                color: COLORS.surface,
                borderRadius: 12,
                fontSize: 22,
                fontWeight: 500,
                transition: "background 0.2s",
              }}
            >
              Read the sentence
            </div>
          </div>
        </div>

        <Cursor waypoints={waypoints} />
      </div>
    </BrowserFrame>
  );
};
