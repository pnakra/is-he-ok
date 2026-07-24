import React from "react";
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from "remotion";
import { COLORS, SANS, SERIF } from "./theme";
import { Cursor, FadeIn, typewriter } from "./components/Shared";
import { CaptionBar, Callout } from "./components/Callout";
import "./fonts";

// ─────────────────────────────────────────────────────────────────────────
// Scene durations (30 fps)
// ─────────────────────────────────────────────────────────────────────────
export const S_INTRO = 300; // 10s
export const S_BASIC = 720; // 24s
export const S_CONTEXT = 720; // 24s
export const S_SAFETY = 720; // 24s
export const S_RESOURCES = 300; // 10s

export const WALKTHROUGH_TOTAL =
  S_INTRO + S_BASIC + S_CONTEXT + S_SAFETY + S_RESOURCES;

export const Walkthrough: React.FC = () => {
  let cursor = 0;
  const seqs: { dur: number; el: React.ReactNode; key: string }[] = [
    { dur: S_INTRO, el: <IntroScene />, key: "intro" },
    { dur: S_BASIC, el: <BasicScene />, key: "basic" },
    { dur: S_CONTEXT, el: <ContextScene />, key: "context" },
    { dur: S_SAFETY, el: <SafetyScene />, key: "safety" },
    { dur: S_RESOURCES, el: <ResourcesScene />, key: "resources" },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      {seqs.map((s) => {
        const from = cursor;
        cursor += s.dur;
        return (
          <Sequence key={s.key} from={from} durationInFrames={s.dur}>
            {s.el}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// Layout constants — a compact browser on the left, a callout rail on the right.
// The caption bar lives at the top of the frame (see Callout.tsx).
// ─────────────────────────────────────────────────────────────────────────
const BROWSER_LEFT = 60;
const BROWSER_TOP = 200;
const BROWSER_WIDTH = 1180;
const BROWSER_HEIGHT = 820;

const RAIL_X = 1300;
const RAIL_Y = 260;
const RAIL_WIDTH = 560;

// Local, narrower browser frame — leaves room for the right rail.
const CompactBrowserFrame: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#E8E1D8" }}>
      <div
        style={{
          position: "absolute",
          left: BROWSER_LEFT,
          top: BROWSER_TOP,
          width: BROWSER_WIDTH,
          height: BROWSER_HEIGHT,
          borderRadius: 18,
          overflow: "hidden",
          backgroundColor: COLORS.bg,
          boxShadow: "0 30px 80px rgba(0,0,0,0.14)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            height: 40,
            backgroundColor: "#EDE6DC",
            borderBottom: `1px solid ${COLORS.divider}`,
            display: "flex",
            alignItems: "center",
            padding: "0 16px",
            gap: 8,
            flexShrink: 0,
          }}
        >
          <Dot color="#E07A6B" />
          <Dot color="#E5B25C" />
          <Dot color="#86B26F" />
          <div
            style={{
              marginLeft: 22,
              backgroundColor: COLORS.surface,
              borderRadius: 8,
              padding: "4px 16px",
              fontFamily: SANS,
              fontSize: 13,
              color: COLORS.faint,
              border: `1px solid ${COLORS.border}`,
            }}
          >
            isheok.app
          </div>
        </div>
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          {children}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Dot: React.FC<{ color: string }> = ({ color }) => (
  <div
    style={{
      width: 11,
      height: 11,
      borderRadius: 6,
      backgroundColor: color,
    }}
  />
);

// Right-rail callout — always at the same slot so only one shows at a time.
const RailCallout: React.FC<{
  from: number;
  duration: number;
  label?: string;
  body: string;
  tone?: "default" | "safety" | "why";
}> = ({ from, duration, label, body, tone }) => (
  <Callout
    from={from}
    duration={duration}
    x={RAIL_X}
    y={RAIL_Y}
    width={RAIL_WIDTH}
    label={label}
    body={body}
    tone={tone}
  />
);

// ─────────────────────────────────────────────────────────────────────────
// SCENE 1 — Intro (title + premise)
// ─────────────────────────────────────────────────────────────────────────
const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleS = spring({ frame: frame - 10, fps, config: { damping: 20 } });
  const subO = interpolate(frame, [40, 70], [0, 1], {
    extrapolateRight: "clamp",
  });
  const kickO = interpolate(frame, [70, 100], [0, 1], {
    extrapolateRight: "clamp",
  });

  const splitO = interpolate(frame, [150, 180], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const splitY = interpolate(frame, [150, 180], [16, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const outO = interpolate(frame, [S_INTRO - 20, S_INTRO], [1, 0], {
    extrapolateLeft: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg,
        opacity: outO,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: 90,
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 520,
          height: 520,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.accentSoft} 0%, transparent 70%)`,
          top: 60,
          right: 60,
          opacity: 0.65,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 360,
          height: 360,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.surface2} 0%, transparent 70%)`,
          bottom: 80,
          left: 100,
          opacity: 0.7,
        }}
      />

      <div
        style={{
          fontFamily: SANS,
          fontSize: 22,
          color: COLORS.faint,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          marginTop: 40,
          marginBottom: 30,
          opacity: kickO,
        }}
      >
        Product walkthrough
      </div>

      <h1
        style={{
          fontFamily: SERIF,
          fontStyle: "italic",
          fontSize: 172,
          margin: 0,
          color: COLORS.fg,
          letterSpacing: "-0.02em",
          lineHeight: 1,
          transform: `scale(${0.92 + 0.08 * titleS}) translateY(${
            (1 - titleS) * 20
          }px)`,
          opacity: titleS,
        }}
      >
        Is He Ok?
      </h1>

      <p
        style={{
          fontFamily: SANS,
          fontSize: 34,
          color: COLORS.muted,
          marginTop: 30,
          textAlign: "center",
          maxWidth: 1200,
          opacity: subO,
        }}
      >
        A sentence-level anti-coercion tool for girls 16–24.
      </p>

      <div
        style={{
          marginTop: 80,
          display: "flex",
          gap: 40,
          opacity: splitO,
          transform: `translateY(${splitY}px)`,
        }}
      >
        <div
          style={{
            width: 560,
            padding: "36px 40px",
            backgroundColor: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 16,
          }}
        >
          <div
            style={{
              fontFamily: SERIF,
              fontStyle: "italic",
              fontSize: 18,
              color: COLORS.faint,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              marginBottom: 14,
            }}
          >
            One sentence he said
          </div>
          <div
            style={{
              fontFamily: SERIF,
              fontStyle: "italic",
              fontSize: 42,
              color: COLORS.fg,
              lineHeight: 1.25,
            }}
          >
            "you're too sensitive."
          </div>
        </div>
        <div
          style={{
            width: 560,
            padding: "36px 40px",
            backgroundColor: COLORS.accentSoft,
            border: `1px solid ${COLORS.primary}`,
            borderRadius: 16,
          }}
        >
          <div
            style={{
              fontFamily: SERIF,
              fontStyle: "italic",
              fontSize: 18,
              color: COLORS.primary,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              marginBottom: 14,
            }}
          >
            What it did to you
          </div>
          <div
            style={{
              fontFamily: SANS,
              fontSize: 26,
              color: COLORS.fg,
              lineHeight: 1.4,
            }}
          >
            It shifts focus off what he said and onto how you reacted — you end
            up defending your feelings instead of naming what bothered you.
          </div>
        </div>
      </div>

      <CaptionBar
        from={200}
        duration={95}
        label="the wedge"
        body="Girls often can't name manipulation in the moment. This tool reads one sentence and names the pattern."
      />
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// Homepage mock — sized for the compact browser (inner ~1180x776).
// ─────────────────────────────────────────────────────────────────────────
const CHIPS = [
  "you're too sensitive",
  "I was just joking",
  "you always do this",
  "calm down",
  "you're overthinking",
];

const HomepageMock: React.FC<{
  text: string;
  contextText?: string;
  contextOpen?: boolean;
  chipsVisible?: boolean;
  ctaHover?: boolean;
  textareaFocused?: boolean;
}> = ({
  text,
  contextText,
  contextOpen,
  chipsVisible = true,
  ctaHover,
  textareaFocused,
}) => {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: COLORS.bg,
        fontFamily: SANS,
        color: COLORS.fg,
        padding: "40px 60px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 34,
        }}
      >
        <span style={{ fontSize: 22, fontWeight: 500 }}>is he ok?</span>
        <span style={{ fontSize: 18, color: COLORS.faint }}>About</span>
      </div>

      <h1
        style={{
          fontSize: 46,
          fontWeight: 600,
          letterSpacing: "-0.01em",
          margin: 0,
          lineHeight: 1.15,
        }}
      >
        Tell us what he said.
      </h1>
      <p
        style={{
          fontSize: 22,
          color: COLORS.faint,
          marginTop: 10,
          marginBottom: 26,
        }}
      >
        One sentence — from a guy in your life: dating, talking, hooking up.
      </p>

      <div
        style={{
          backgroundColor: COLORS.surface,
          border: `2px solid ${
            textareaFocused ? COLORS.primary : COLORS.border
          }`,
          borderRadius: 12,
          padding: "22px 24px",
          minHeight: 110,
          fontSize: 26,
          color: text ? COLORS.fg : COLORS.faint,
          boxShadow: textareaFocused ? `0 0 0 6px ${COLORS.accentSoft}` : "none",
        }}
      >
        {text || 'e.g. "you\'re too sensitive"'}
      </div>

      {chipsVisible && (
        <div style={{ marginTop: 24 }}>
          <p style={{ fontSize: 16, color: COLORS.faint, marginBottom: 10 }}>
            Or pick one to start:
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {CHIPS.map((c) => (
              <div
                key={c}
                style={{
                  fontSize: 17,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 10,
                  padding: "8px 18px",
                  backgroundColor: COLORS.surface,
                }}
              >
                {c}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: 28 }}>
        {!contextOpen ? (
          <span style={{ fontSize: 17, color: COLORS.faint }}>
            + Add a little context (optional)
          </span>
        ) : (
          <div>
            <div style={{ fontSize: 17, color: COLORS.muted }}>
              Add a little context (optional)
            </div>
            <div
              style={{
                marginTop: 8,
                backgroundColor: COLORS.surface,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 10,
                padding: "12px 16px",
                minHeight: 58,
                fontSize: 19,
                color: contextText ? COLORS.fg : COLORS.faint,
              }}
            >
              {contextText || "One or two lines."}
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: 30 }}>
        <div
          style={{
            display: "inline-flex",
            padding: "16px 30px",
            backgroundColor: ctaHover ? COLORS.primaryHover : COLORS.primary,
            color: COLORS.surface,
            borderRadius: 12,
            fontSize: 20,
            fontWeight: 500,
          }}
        >
          Read the sentence
        </div>
      </div>
    </div>
  );
};

// Result mock — sized for the compact browser
const ResultMock: React.FC<{
  quote: string;
  cards: { label: string; body: string; open: number }[];
  resources: { label: string; url: string; highlight?: boolean }[];
  scrollY?: number;
  safety?: boolean;
}> = ({ quote, cards, resources, scrollY = 0, safety }) => {
  return (
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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "32px 60px 0",
        }}
      >
        <span style={{ fontSize: 22, fontWeight: 500 }}>is he ok?</span>
        <span style={{ fontSize: 18, color: COLORS.faint }}>About</span>
      </div>
      <div
        style={{
          padding: "20px 60px",
          transform: `translateY(${scrollY}px)`,
        }}
      >
        <blockquote
          style={{
            fontFamily: SERIF,
            fontStyle: "italic",
            fontSize: 30,
            backgroundColor: safety ? "#F5D9D2" : COLORS.surface2,
            borderLeft: `4px solid ${safety ? "#B84A3A" : COLORS.primary}`,
            padding: "20px 26px",
            borderRadius: 8,
            margin: 0,
            marginBottom: 16,
            lineHeight: 1.35,
          }}
        >
          "{quote}"
        </blockquote>
        <p style={{ fontSize: 18, color: COLORS.muted, marginBottom: 20 }}>
          {safety ? "This one needs care" : "Read with a little more context"}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {cards.map((c, i) => (
            <div
              key={i}
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
                  padding: "18px 24px",
                }}
              >
                <span style={{ fontSize: 20, fontWeight: 500 }}>{c.label}</span>
                <span
                  style={{
                    fontSize: 22,
                    color: COLORS.faint,
                    transform: `rotate(${c.open * 45}deg)`,
                  }}
                >
                  +
                </span>
              </div>
              <div
                style={{
                  maxHeight: c.open * 220,
                  opacity: c.open,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    padding: "0 24px 16px",
                    fontSize: 18,
                    lineHeight: 1.55,
                  }}
                >
                  {c.body}
                </div>
                <div
                  style={{
                    padding: "0 24px 16px",
                    display: "flex",
                    gap: 10,
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontSize: 14, color: COLORS.faint }}>
                    Was this helpful?
                  </span>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      border: `1px solid ${COLORS.border}`,
                      fontSize: 15,
                    }}
                  >
                    👍
                  </span>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      border: `1px solid ${COLORS.border}`,
                      fontSize: 15,
                    }}
                  >
                    👎
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 32 }}>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 500,
              margin: 0,
              marginBottom: 14,
            }}
          >
            {safety
              ? "If you need to talk to someone tonight"
              : "If you want to read further"}
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {resources.map((r) => (
              <div
                key={r.url}
                style={{
                  fontSize: 18,
                  color: safety ? "#B84A3A" : COLORS.primary,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: r.highlight ? "6px 10px" : "6px 0",
                  borderRadius: 8,
                  backgroundColor: r.highlight
                    ? COLORS.accentSoft
                    : "transparent",
                  fontWeight: r.highlight ? 500 : 400,
                  width: "fit-content",
                }}
              >
                <span>{r.label}</span>
                <span>→</span>
              </div>
            ))}
          </div>
        </div>

        {safety && (
          <div
            style={{
              marginTop: 30,
              padding: "18px 24px",
              backgroundColor: "#F5D9D2",
              border: "1px solid #B84A3A",
              borderRadius: 12,
              fontSize: 18,
              color: "#5A1E15",
            }}
          >
            If you're in immediate danger, call 911 or 1-800-799-7233 (24/7).
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// Cursor waypoints are given in browser INNER-content coords (0..1180 x 0..776).
// The Cursor component sits inside the browser inner div, so no offset is needed.
// ─────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────
// SCENE 2 — Scenario 1: no context
// ─────────────────────────────────────────────────────────────────────────
const BasicScene: React.FC = () => {
  const frame = useCurrentFrame();

  const inResult = frame >= 310;

  const chipsVisible = frame < 145;
  const text = frame >= 145 ? "you're too sensitive" : "";
  const ctaHover = frame >= 220 && frame < 260;
  const textareaFocused = frame >= 145 && frame < 260;

  const waypoints = [
    { frame: 0, x: 1000, y: 700 },
    { frame: 60, x: 260, y: 460 }, // first chip
    { frame: 130, x: 260, y: 460, click: true },
    { frame: 180, x: 260, y: 280 }, // hover textarea
    { frame: 230, x: 200, y: 640 }, // move to cta
    { frame: 270, x: 200, y: 640, click: true },
    { frame: 720, x: 900, y: 400 },
  ];

  const cardOpen = [
    inResult ? 1 : 0,
    interpolate(frame, [430, 470], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
    interpolate(frame, [540, 580], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  ];
  const scrollY = interpolate(frame, [500, 700], [0, -220], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <>
      <CompactBrowserFrame>
        {!inResult && (
          <>
            <HomepageMock
              text={text}
              chipsVisible={chipsVisible}
              ctaHover={ctaHover}
              textareaFocused={textareaFocused}
            />
            <Cursor waypoints={waypoints} />
          </>
        )}
        {inResult && (
          <ResultMock
            quote="you're too sensitive"
            cards={[
              {
                label: "How it came across",
                body: "On paper it sounds like a casual observation. In the moment it works more like a label — a quick way to put what you felt into the wrong category.",
                open: cardOpen[0],
              },
              {
                label: "What it did to you",
                body: "It shifts focus off what he said and onto how you reacted. You end up defending your feelings instead of naming what bothered you.",
                open: cardOpen[1],
              },
              {
                label: "What may be going on",
                body: "This is a common minimizing move: re-frame your reaction as the issue so the original behavior doesn't have to be examined.",
                open: cardOpen[2],
              },
            ]}
            resources={[
              {
                label: "Gaslighting: how to recognize it — NDVH",
                url: "thehotline.org",
              },
              {
                label: "Healthy vs unhealthy signs — love is respect",
                url: "loveisrespect.org",
              },
            ]}
            scrollY={scrollY}
          />
        )}
      </CompactBrowserFrame>

      {/* Top caption bar — phase 1 */}
      <CaptionBar
        from={20}
        duration={280}
        label="scenario 1"
        body="No context. A user taps a suggestion chip and hits submit."
      />
      {/* Top caption bar — phase 2 (results) */}
      <CaptionBar
        from={330}
        duration={380}
        label="the read"
        body="Three cards, matched resources, per-card thumbs. Everything under one scroll."
      />

      {/* Right-rail callouts — one at a time, same slot */}
      <RailCallout
        from={70}
        duration={110}
        label="zero-friction start"
        body="Suggestion chips let a first-time user tap in without typing. They disappear the moment text lands in the box."
      />
      <RailCallout
        from={200}
        duration={100}
        label="focus + submit"
        body="Textarea highlights on focus. The submit button reads 'Read the sentence' — never 'analyze'."
      />
      <RailCallout
        from={370}
        duration={150}
        label="voice rules"
        body="Three angles, never a verdict. Hedged, specific, and the user is always the expert on her own life."
      />
      <RailCallout
        from={540}
        duration={170}
        label="resource picker"
        body="Two verified deep links matched to the tactic (minimization / gaslighting) — never generic homepages."
        tone="why"
      />
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// SCENE 3 — Scenario 2: with context (financial)
// ─────────────────────────────────────────────────────────────────────────
const ContextScene: React.FC = () => {
  const frame = useCurrentFrame();

  const typed = typewriter("he said i owe him for dinner", frame, 20, 0.35);
  const contextOpen = frame >= 200;
  const contextTyped = contextOpen
    ? typewriter("we've only been on 2 dates", frame, 210, 0.4)
    : "";

  const ctaHover = frame >= 280 && frame < 320;
  const textareaFocused = frame >= 10 && frame < 320;

  const waypoints = [
    { frame: 0, x: 900, y: 700 },
    { frame: 20, x: 260, y: 280, click: true },
    { frame: 190, x: 280, y: 560, click: true }, // open context
    { frame: 260, x: 200, y: 660 }, // toward cta
    { frame: 300, x: 200, y: 660, click: true },
    { frame: 720, x: 900, y: 400 },
  ];

  const inResult = frame >= 320;
  const cardOpen = [
    inResult ? 1 : 0,
    interpolate(frame, [440, 480], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
    interpolate(frame, [550, 590], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  ];
  const scrollY = interpolate(frame, [520, 700], [0, -200], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <>
      <CompactBrowserFrame>
        {!inResult && (
          <>
            <HomepageMock
              text={typed}
              contextOpen={contextOpen}
              contextText={contextTyped}
              chipsVisible={!typed}
              ctaHover={ctaHover}
              textareaFocused={textareaFocused}
            />
            <Cursor waypoints={waypoints} />
          </>
        )}
        {inResult && (
          <ResultMock
            quote="he said i owe him for dinner"
            scrollY={scrollY}
            cards={[
              {
                label: "How it came across",
                body: "Framed as a fairness point, but it turns dinner into a transaction. Two dates in, that reframe is heavier than it sounds.",
                open: cardOpen[0],
              },
              {
                label: "What it did to you",
                body: "It puts you in a position where saying no starts to feel like a debt you're refusing to pay — not a boundary you're allowed to have.",
                open: cardOpen[1],
              },
              {
                label: "What may be going on",
                body: "This is the early edge of financial pressure being used as leverage. It doesn't have to be dramatic to matter.",
                open: cardOpen[2],
              },
            ]}
            resources={[
              {
                label: "Coercive control basics — Women's Aid",
                url: "womensaid.org.uk",
              },
              {
                label: "Healthy vs unhealthy signs — love is respect",
                url: "loveisrespect.org",
              },
              {
                label: "Financial abuse: recognizing the signs — NNEDV",
                url: "nnedv.org",
                highlight: true,
              },
            ]}
          />
        )}
      </CompactBrowserFrame>

      <CaptionBar
        from={20}
        duration={290}
        label="scenario 2"
        body="A custom sentence with a line of context — the model can now name the specific tactic."
      />
      <CaptionBar
        from={340}
        duration={370}
        label="the read"
        body="Same three-card shape. The resource picker adds a targeted third link when the input maps to a real-world domain."
      />

      <RailCallout
        from={40}
        duration={140}
        label="typed input"
        body="Real users type as often as they tap chips. 86% of organic submissions are custom sentences, ~58 chars long."
      />
      <RailCallout
        from={200}
        duration={110}
        label="context matters"
        body="Two dates in vs. two years in changes the read. Context is optional but disproportionately valuable."
      />
      <RailCallout
        from={360}
        duration={160}
        label="statements only"
        body="No questions in the output. The tool never sounds like it expects a reply — because there's no one on the other end."
      />
      <RailCallout
        from={540}
        duration={170}
        label="situation detector"
        body="Regex matched 'owe / money' → the third resource is financial-abuse specific. Two tactic links + one situational link."
        tone="why"
      />
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// SCENE 4 — Scenario 3: safety flag
// ─────────────────────────────────────────────────────────────────────────
const SafetyScene: React.FC = () => {
  const frame = useCurrentFrame();

  const typed = typewriter("he said he'd hurt me if i left", frame, 30, 0.35);
  const textareaFocused = frame >= 20 && frame < 300;
  const ctaHover = frame >= 260 && frame < 300;

  const waypoints = [
    { frame: 0, x: 1000, y: 700 },
    { frame: 30, x: 260, y: 280, click: true },
    { frame: 250, x: 200, y: 660 },
    { frame: 290, x: 200, y: 660, click: true },
    { frame: 720, x: 900, y: 400 },
  ];

  const inResult = frame >= 310;
  const cardOpen = [
    inResult ? 1 : 0,
    interpolate(frame, [430, 470], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
    interpolate(frame, [540, 580], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  ];
  const scrollY = interpolate(frame, [520, 700], [0, -260], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <>
      <CompactBrowserFrame>
        {!inResult && (
          <>
            <HomepageMock
              text={typed}
              chipsVisible={!typed}
              ctaHover={ctaHover}
              textareaFocused={textareaFocused}
            />
            <Cursor waypoints={waypoints} />
          </>
        )}
        {inResult && (
          <ResultMock
            safety
            quote="he said he'd hurt me if i left"
            scrollY={scrollY}
            cards={[
              {
                label: "What this actually is",
                body: "This is a threat, wrapped in a conditional. The 'if' doesn't soften it — it names the price of leaving.",
                open: cardOpen[0],
              },
              {
                label: "What it does to your choices",
                body: "It's designed to make leaving feel like the dangerous option. It is not, but that's the effect this sentence is engineered for.",
                open: cardOpen[1],
              },
              {
                label: "What comes next",
                body: "Safety planning is a real thing — trained people help with it every day. You don't have to make a decision alone from inside this.",
                open: cardOpen[2],
              },
            ]}
            resources={[
              {
                label: "National DV Hotline — call, chat, text",
                url: "thehotline.org",
                highlight: true,
              },
              {
                label: "love is respect — 24/7 for teens & young adults",
                url: "loveisrespect.org",
                highlight: true,
              },
              {
                label: "Safety planning guide — NDVH",
                url: "thehotline.org/plan-for-safety",
              },
            ]}
          />
        )}
      </CompactBrowserFrame>

      <CaptionBar
        from={20}
        duration={290}
        label="scenario 3 — safety"
        body="A threat-shaped sentence. The pipeline behaves differently from the ground up."
      />
      <CaptionBar
        from={330}
        duration={380}
        label="the read"
        body="Cards still name the pattern — but resources are hard-pinned to hotlines and safety planning."
      />

      <RailCallout
        from={60}
        duration={110}
        label="two-stage pipeline"
        body="Triage classifies first. When status = SAFETY, the analysis branch is hard-overridden."
        tone="safety"
      />
      <RailCallout
        from={190}
        duration={110}
        label="defense-in-depth"
        body="Regex + keyword pre-filter + model triage. Even if one misses (future-tense threats used to), another catches."
        tone="safety"
      />
      <RailCallout
        from={350}
        duration={170}
        label="pattern still named"
        body="We don't skip the analysis in safety mode — she still gets language for what it is. We just also lock the resources."
        tone="safety"
      />
      <RailCallout
        from={540}
        duration={170}
        label="crisis lock"
        body="Resources are locked to crisis lines in this branch. No situation-detector swaps. The 'immediate danger' footer is always visible."
        tone="safety"
      />
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// SCENE 5 — Resource philosophy
// ─────────────────────────────────────────────────────────────────────────
const ResourcesScene: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg,
        padding: 100,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <FadeIn from={10} duration={20}>
        <div
          style={{
            fontFamily: SANS,
            fontSize: 22,
            color: COLORS.faint,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            textAlign: "center",
            marginBottom: 26,
          }}
        >
          Why these links, not others
        </div>
        <h2
          style={{
            fontFamily: SERIF,
            fontStyle: "italic",
            fontSize: 100,
            color: COLORS.fg,
            margin: 0,
            marginBottom: 60,
            textAlign: "center",
            letterSpacing: "-0.02em",
            lineHeight: 1.05,
          }}
        >
          The resources aren't random.
        </h2>
      </FadeIn>

      <div style={{ display: "flex", gap: 32, maxWidth: 1600 }}>
        {[
          {
            n: "01",
            title: "Verified deep links",
            body: "30 hand-picked pages — never a homepage. Audited for dead links every time the bank changes.",
          },
          {
            n: "02",
            title: "Mapped to tactics",
            body: "DARVO, minimization, weaponized concern, financial, sexual coercion — each tactic has its own canonical pair.",
          },
          {
            n: "03",
            title: "Situation detector",
            body: "A lightweight regex layer adds a third contextual link (money, sex, kids, monitoring) when the input matches.",
          },
        ].map((c, i) => (
          <FadeIn key={c.n} from={40 + i * 24} duration={22}>
            <div
              style={{
                width: 460,
                padding: "34px 34px",
                backgroundColor: COLORS.surface,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 16,
                minHeight: 300,
              }}
            >
              <div
                style={{
                  fontFamily: SERIF,
                  fontStyle: "italic",
                  fontSize: 22,
                  color: COLORS.primary,
                  letterSpacing: "0.14em",
                  marginBottom: 14,
                }}
              >
                {c.n}
              </div>
              <div
                style={{
                  fontFamily: SANS,
                  fontSize: 30,
                  fontWeight: 500,
                  color: COLORS.fg,
                  marginBottom: 14,
                  letterSpacing: "-0.01em",
                }}
              >
                {c.title}
              </div>
              <div
                style={{
                  fontFamily: SANS,
                  fontSize: 22,
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

      <CaptionBar
        from={140}
        duration={155}
        body="Small bank. Tight mapping. Every link earns its place."
      />
    </AbsoluteFill>
  );
};
