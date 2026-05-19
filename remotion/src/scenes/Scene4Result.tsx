import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { COLORS, SANS, SERIF } from "../theme";
import { BrowserFrame, Cursor, FadeIn } from "../components/Shared";
import "../fonts";

// 2100 frames = 70s
export const SCENE_4_FRAMES = 2100;

const SENTENCE = "You're too sensitive";

const CARDS = [
  {
    label: "How it came across",
    body:
      "On paper it sounds like a casual observation. In the moment it works more like a label — a quick way to put what you felt into the wrong category and hand it back to you as the problem.",
  },
  {
    label: "What it did to you",
    body:
      "It shifts the focus off what he said or did and onto how you reacted. You end up defending your feelings instead of being able to name what bothered you. Over time, this teaches you to second-guess your own read of a situation.",
  },
  {
    label: "What may be going on",
    body:
      "This is a common minimizing move: re-frame your reaction as the issue so the original behavior doesn't have to be examined. It doesn't make him a bad person, but it is a pattern worth noticing — especially when it shows up the same way every time you push back.",
  },
];

const CLOSING = "You are allowed to take seriously how this landed on you.";

const RESOURCES = [
  { label: "Healthy relationship warning signs — One Love", url: "joinonelove.org" },
  { label: "Healthy vs unhealthy relationship signs — love is respect", url: "loveisrespect.org" },
];

export const Scene4Result: React.FC = () => {
  const frame = useCurrentFrame();

  // Scroll: pan the content upward over the scene to reveal cards and resources.
  // Content total height ~ 1500, viewport ~ 896. Scroll from 0 to -650 over frames 600..1800.
  const scrollY = interpolate(frame, [600, 1800], [0, -680], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Cards open at staggered moments (defaultOpen first; others open on click)
  // Card 0 open from 0. Card 1 opens at 350. Card 2 opens at 700.
  const cardOpen = [
    1,
    interpolate(frame, [350, 410], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
    interpolate(frame, [700, 760], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  ];

  // Cursor waypoints
  const waypoints = [
    { frame: 0, x: 1500, y: 800 },
    { frame: 280, x: 760, y: 660 },
    { frame: 350, x: 760, y: 660, click: true },
    { frame: 640, x: 760, y: 780 },
    { frame: 700, x: 760, y: 780, click: true },
    { frame: 1100, x: 1500, y: 700 },
    { frame: 2100, x: 1500, y: 700 },
  ];

  return (
    <BrowserFrame>
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: COLORS.bg,
          fontFamily: SANS,
          color: COLORS.fg,
          overflow: "hidden",
        }}
      >
        {/* Fixed brand bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            maxWidth: 1100,
            margin: "0 auto",
            padding: "50px 80px 0",
          }}
        >
          <span style={{ fontSize: 22, fontWeight: 500 }}>is he ok?</span>
          <span style={{ fontSize: 20, color: COLORS.faint }}>About</span>
        </div>

        {/* Scrolling content */}
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "30px 80px",
            transform: `translateY(${scrollY}px)`,
          }}
        >
          <FadeIn from={0} duration={24}>
            <blockquote
              style={{
                fontFamily: SERIF,
                fontStyle: "italic",
                fontSize: 36,
                color: COLORS.fg,
                backgroundColor: COLORS.surface2,
                borderLeft: `4px solid ${COLORS.primary}`,
                padding: "24px 32px",
                borderRadius: 8,
                margin: 0,
                marginBottom: 24,
                lineHeight: 1.4,
              }}
            >
              "{SENTENCE}"
            </blockquote>
            <p
              style={{
                fontSize: 22,
                color: COLORS.muted,
                marginBottom: 30,
              }}
            >
              Read with a little more context
            </p>
          </FadeIn>

          <div
            style={{ display: "flex", flexDirection: "column", gap: 14 }}
          >
            {CARDS.map((card, i) => (
              <FadeIn key={i} from={24 + i * 80} duration={20}>
                <ResultCard
                  label={card.label}
                  body={card.body}
                  openness={cardOpen[i]}
                />
              </FadeIn>
            ))}
          </div>

          <FadeIn from={800} duration={30}>
            <p
              style={{
                fontFamily: SERIF,
                fontStyle: "italic",
                fontSize: 32,
                color: COLORS.fg,
                marginTop: 48,
                marginBottom: 48,
                lineHeight: 1.5,
              }}
            >
              {CLOSING}
            </p>
          </FadeIn>

          <FadeIn from={900} duration={30}>
            <div>
              <h2
                style={{
                  fontSize: 22,
                  fontWeight: 500,
                  margin: 0,
                  marginBottom: 18,
                }}
              >
                If you want to read further
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {RESOURCES.map((r) => (
                  <div
                    key={r.url}
                    style={{
                      fontSize: 22,
                      color: COLORS.primary,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <span>{r.label}</span>
                    <span aria-hidden="true">→</span>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>

          <div
            style={{
              marginTop: 60,
              paddingTop: 28,
              borderTop: `1px solid ${COLORS.divider}`,
              textAlign: "center",
              color: COLORS.faint,
              fontSize: 18,
              lineHeight: 1.6,
            }}
          >
            <p style={{ margin: 0 }}>No account. Nothing saved about you.</p>
            <p style={{ margin: 0 }}>
              If you're in immediate danger, call 911 or 1-800-799-7233.
            </p>
          </div>
        </div>

        <Cursor waypoints={waypoints} />
      </div>
    </BrowserFrame>
  );
};

const ResultCard: React.FC<{
  label: string;
  body: string;
  openness: number;
}> = ({ label, body, openness }) => {
  // Approximate body block height for animation
  const maxH = 260;
  return (
    <div
      style={{
        border: `1px solid ${COLORS.border}`,
        borderRadius: 14,
        backgroundColor: COLORS.surface,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "22px 28px",
        }}
      >
        <span style={{ fontSize: 24, fontWeight: 500, color: COLORS.fg }}>
          {label}
        </span>
        <span
          style={{
            fontSize: 28,
            color: COLORS.faint,
            transform: `rotate(${openness * 45}deg)`,
            transition: "transform 0.2s",
          }}
        >
          +
        </span>
      </div>
      <div
        style={{
          maxHeight: openness * maxH,
          opacity: openness,
          transition: "max-height 0.2s, opacity 0.2s",
        }}
      >
        <div
          style={{
            padding: "0 28px 24px",
            fontSize: 22,
            lineHeight: 1.6,
            color: COLORS.fg,
          }}
        >
          {body}
        </div>
      </div>
    </div>
  );
};
