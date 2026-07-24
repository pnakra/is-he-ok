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
import { BrowserFrame, Cursor, FadeIn, typewriter } from "./components/Shared";
import { CaptionBar, Callout, HighlightRing } from "./components/Callout";
import "./fonts";

// ─────────────────────────────────────────────────────────────────────────
// Scene durations (30 fps)
// ─────────────────────────────────────────────────────────────────────────
export const S_INTRO = 300; // 10s
export const S_BASIC = 720; // 24s
export const S_CONTEXT = 720; // 24s
export const S_SAFETY = 720; // 24s
export const S_RESOURCES = 300; // 10s
export const S_OUTRO = 150; // 5s

export const WALKTHROUGH_TOTAL =
  S_INTRO + S_BASIC + S_CONTEXT + S_SAFETY + S_RESOURCES + S_OUTRO;

export const Walkthrough: React.FC = () => {
  let cursor = 0;
  const seqs: { dur: number; el: React.ReactNode; key: string }[] = [
    { dur: S_INTRO, el: <IntroScene />, key: "intro" },
    { dur: S_BASIC, el: <BasicScene />, key: "basic" },
    { dur: S_CONTEXT, el: <ContextScene />, key: "context" },
    { dur: S_SAFETY, el: <SafetyScene />, key: "safety" },
    { dur: S_RESOURCES, el: <ResourcesScene />, key: "resources" },
    { dur: S_OUTRO, el: <OutroScene />, key: "outro" },
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
// SCENE 1 — Intro (title + premise)
// ─────────────────────────────────────────────────────────────────────────
const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleS = spring({ frame: frame - 10, fps, config: { damping: 20 } });
  const subO = interpolate(frame, [40, 70], [0, 1], { extrapolateRight: "clamp" });
  const kickO = interpolate(frame, [70, 100], [0, 1], { extrapolateRight: "clamp" });

  // premise split card entrance
  const splitO = interpolate(frame, [150, 180], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const splitY = interpolate(frame, [150, 180], [16, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // fade both blocks out at end so transition to product feels clean
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
      {/* Ambient shapes */}
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
          transform: `scale(${0.92 + 0.08 * titleS}) translateY(${(1 - titleS) * 20}px)`,
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

      {/* Split premise */}
      <div
        style={{
          marginTop: 90,
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
            It shifts focus off what he said and onto how you reacted — you end up
            defending your feelings instead of naming what bothered you.
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
// Reusable mock homepage — simplified to keep code tight.
// Renders textarea, optional context block, chips, and CTA.
// Coordinates are relative to the BrowserFrame's inner content (approx 1680x896).
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
        padding: "60px 80px",
        overflow: "hidden",
      }}
    >
      {/* brand bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          maxWidth: 1100,
          margin: "0 auto 50px",
        }}
      >
        <span style={{ fontSize: 22, fontWeight: 500 }}>is he ok?</span>
        <span style={{ fontSize: 20, color: COLORS.faint }}>About</span>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <h1
          style={{
            fontSize: 54,
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
            fontSize: 24,
            color: COLORS.faint,
            marginTop: 12,
            marginBottom: 32,
          }}
        >
          One sentence — from a guy in your life: dating, talking, hooking up.
        </p>

        {/* textarea */}
        <div
          data-role="textarea"
          style={{
            backgroundColor: COLORS.surface,
            border: `2px solid ${textareaFocused ? COLORS.primary : COLORS.border}`,
            borderRadius: 12,
            padding: "24px 26px",
            minHeight: 130,
            fontSize: 28,
            color: text ? COLORS.fg : COLORS.faint,
            boxShadow: textareaFocused ? `0 0 0 6px ${COLORS.accentSoft}` : "none",
          }}
        >
          {text || 'e.g. "you\'re too sensitive"'}
        </div>

        {/* chips */}
        {chipsVisible && (
          <div style={{ marginTop: 32 }}>
            <p style={{ fontSize: 18, color: COLORS.faint, marginBottom: 12 }}>
              Or pick one to start:
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {CHIPS.map((c) => (
                <div
                  key={c}
                  style={{
                    fontSize: 18,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 10,
                    padding: "10px 20px",
                    backgroundColor: COLORS.surface,
                  }}
                >
                  {c}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* context */}
        <div style={{ marginTop: 36 }}>
          {!contextOpen ? (
            <span style={{ fontSize: 18, color: COLORS.faint }}>
              + Add a little context (optional)
            </span>
          ) : (
            <div>
              <div style={{ fontSize: 18, color: COLORS.muted }}>
                Add a little context (optional)
              </div>
              <div
                style={{
                  marginTop: 10,
                  backgroundColor: COLORS.surface,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 10,
                  padding: "14px 18px",
                  minHeight: 68,
                  fontSize: 20,
                  color: contextText ? COLORS.fg : COLORS.faint,
                }}
              >
                {contextText || "One or two lines."}
              </div>
            </div>
          )}
        </div>

        {/* cta */}
        <div style={{ marginTop: 40 }}>
          <div
            style={{
              display: "inline-flex",
              padding: "18px 34px",
              backgroundColor: ctaHover ? COLORS.primaryHover : COLORS.primary,
              color: COLORS.surface,
              borderRadius: 12,
              fontSize: 22,
              fontWeight: 500,
            }}
          >
            Read the sentence
          </div>
        </div>
      </div>
    </div>
  );
};

// Result mock — three collapsible-style cards + resources list
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
          maxWidth: 1100,
          margin: "0 auto",
          padding: "40px 80px 0",
        }}
      >
        <span style={{ fontSize: 22, fontWeight: 500 }}>is he ok?</span>
        <span style={{ fontSize: 20, color: COLORS.faint }}>About</span>
      </div>
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "24px 80px",
          transform: `translateY(${scrollY}px)`,
        }}
      >
        <blockquote
          style={{
            fontFamily: SERIF,
            fontStyle: "italic",
            fontSize: 34,
            backgroundColor: safety ? "#F5D9D2" : COLORS.surface2,
            borderLeft: `4px solid ${safety ? "#B84A3A" : COLORS.primary}`,
            padding: "22px 30px",
            borderRadius: 8,
            margin: 0,
            marginBottom: 20,
            lineHeight: 1.35,
          }}
        >
          "{quote}"
        </blockquote>
        <p style={{ fontSize: 20, color: COLORS.muted, marginBottom: 24 }}>
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
                  padding: "20px 26px",
                }}
              >
                <span style={{ fontSize: 22, fontWeight: 500 }}>{c.label}</span>
                <span
                  style={{
                    fontSize: 24,
                    color: COLORS.faint,
                    transform: `rotate(${c.open * 45}deg)`,
                  }}
                >
                  +
                </span>
              </div>
              <div
                style={{
                  maxHeight: c.open * 240,
                  opacity: c.open,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    padding: "0 26px 20px",
                    fontSize: 20,
                    lineHeight: 1.55,
                  }}
                >
                  {c.body}
                </div>
                {/* feedback thumbs */}
                <div
                  style={{
                    padding: "0 26px 18px",
                    display: "flex",
                    gap: 10,
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontSize: 15, color: COLORS.faint }}>
                    Was this helpful?
                  </span>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 34,
                      height: 34,
                      borderRadius: 8,
                      border: `1px solid ${COLORS.border}`,
                      fontSize: 16,
                    }}
                  >
                    👍
                  </span>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 34,
                      height: 34,
                      borderRadius: 8,
                      border: `1px solid ${COLORS.border}`,
                      fontSize: 16,
                    }}
                  >
                    👎
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 40 }}>
          <h2 style={{ fontSize: 22, fontWeight: 500, margin: 0, marginBottom: 16 }}>
            {safety ? "If you need to talk to someone tonight" : "If you want to read further"}
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {resources.map((r) => (
              <div
                key={r.url}
                style={{
                  fontSize: 20,
                  color: safety ? "#B84A3A" : COLORS.primary,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: r.highlight ? "6px 10px" : "6px 0",
                  borderRadius: 8,
                  backgroundColor: r.highlight ? COLORS.accentSoft : "transparent",
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
              marginTop: 40,
              padding: "20px 26px",
              backgroundColor: "#F5D9D2",
              border: "1px solid #B84A3A",
              borderRadius: 12,
              fontSize: 20,
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
// SCENE 2 — Scenario 1: no context
// ─────────────────────────────────────────────────────────────────────────
const BasicScene: React.FC = () => {
  const frame = useCurrentFrame();

  // Beats:
  // 0-60   land on homepage
  // 60-140 hover chip
  // 140-160 click chip → text appears, chips hide
  // 160-240 hold, focus textarea
  // 240-310 click CTA
  // 310-720 result screen with callouts
  const inResult = frame >= 310;
  const localFrame = frame; // absolute within scene

  const chipsVisible = frame < 145;
  const text = frame >= 145 ? "you're too sensitive" : "";
  const ctaHover = frame >= 220 && frame < 260;
  const textareaFocused = frame >= 145 && frame < 260;

  // Cursor waypoints (in browser inner content coords)
  const waypoints = [
    { frame: 0, x: 1500, y: 800 },
    { frame: 60, x: 320, y: 620 }, // first chip
    { frame: 130, x: 320, y: 620, click: true },
    { frame: 180, x: 320, y: 320 }, // hover textarea
    { frame: 230, x: 380, y: 810 }, // move to cta
    { frame: 270, x: 380, y: 810, click: true },
    { frame: 320, x: 1300, y: 500 },
    { frame: 720, x: 1300, y: 500 },
  ];

  // Result content
  const cardOpen = [
    inResult ? 1 : 0,
    interpolate(frame, [420, 460], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
    interpolate(frame, [520, 560], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  ];
  const scrollY = interpolate(frame, [500, 700], [0, -200], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <BrowserFrame>
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
        <>
          <ResultMock
            quote="you're too sensitive"
            cards={[
              {
                label: "How it came across",
                body:
                  "On paper it sounds like a casual observation. In the moment it works more like a label — a quick way to put what you felt into the wrong category.",
                open: cardOpen[0],
              },
              {
                label: "What it did to you",
                body:
                  "It shifts focus off what he said and onto how you reacted. You end up defending your feelings instead of naming what bothered you.",
                open: cardOpen[1],
              },
              {
                label: "What may be going on",
                body:
                  "This is a common minimizing move: re-frame your reaction as the issue so the original behavior doesn't have to be examined.",
                open: cardOpen[2],
              },
            ]}
            resources={[
              { label: "Gaslighting: how to recognize it — NDVH", url: "thehotline.org" },
              { label: "Healthy vs unhealthy signs — love is respect", url: "loveisrespect.org" },
            ]}
            scrollY={scrollY}
          />
        </>
      )}

      {/* ── Callouts (positioned in 1920x1080 space, above BrowserFrame's inset of ~120/70) ── */}

      {/* Callout A — suggestion chips */}
      <Callout
        from={70}
        duration={80}
        x={1360}
        y={420}
        width={440}
        label="zero-friction start"
        body="Suggestion chips let a first-time user tap in without typing. They disappear the moment text lands in the box."
        pointTo={{ x: 500, y: 780 }}
      />

      {/* Callout B — add context */}
      <Callout
        from={165}
        duration={70}
        x={1360}
        y={640}
        width={420}
        label="optional depth"
        body="Context sharpens the read, but most first-time users skip it — the tool has to work with almost nothing."
        pointTo={{ x: 500, y: 940 }}
      />

      <CaptionBar
        from={20}
        duration={280}
        label="scenario 1"
        body="No context. A user taps a suggestion chip and hits submit."
      />

      {/* Result-side callouts */}
      <Callout
        from={370}
        duration={110}
        x={130}
        y={200}
        width={420}
        label="voice rules"
        body="Three angles, never a verdict. Hedged, specific, and the user is always the expert on her own life."
        pointTo={{ x: 500, y: 400 }}
      />

      <Callout
        from={520}
        duration={150}
        x={1360}
        y={640}
        width={420}
        label="resource picker"
        body="Two verified deep links matched to the tactic (minimization / gaslighting) — never generic homepages."
        pointTo={{ x: 1400, y: 900 }}
      />

      <CaptionBar
        from={330}
        duration={380}
        label="the read"
        body="Three cards, matched resources, per-card thumbs. Everything under one scroll."
      />
    </BrowserFrame>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// SCENE 3 — Scenario 2: with context (financial)
// ─────────────────────────────────────────────────────────────────────────
const ContextScene: React.FC = () => {
  const frame = useCurrentFrame();

  // Beats:
  // 0-200  typing sentence
  // 200-260 open context, type context
  // 260-320 click CTA
  // 320+   result with situation-detector callout
  const typed = typewriter("he said i owe him for dinner", frame, 20, 0.35);
  const contextOpen = frame >= 200;
  const contextTyped = contextOpen
    ? typewriter("we've only been on 2 dates", frame, 210, 0.4)
    : "";

  const ctaHover = frame >= 280 && frame < 320;
  const textareaFocused = frame >= 10 && frame < 320;

  const waypoints = [
    { frame: 0, x: 1300, y: 800 },
    { frame: 20, x: 380, y: 320, click: true },
    { frame: 190, x: 400, y: 720, click: true }, // open context
    { frame: 260, x: 380, y: 820 }, // toward cta
    { frame: 300, x: 380, y: 820, click: true },
    { frame: 340, x: 1300, y: 500 },
    { frame: 720, x: 1300, y: 500 },
  ];

  const inResult = frame >= 320;
  const cardOpen = [
    inResult ? 1 : 0,
    interpolate(frame, [430, 470], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
    interpolate(frame, [530, 570], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
  ];
  const scrollY = interpolate(frame, [520, 700], [0, -180], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <BrowserFrame>
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
              body:
                "Framed as a fairness point, but it turns dinner into a transaction. Two dates in, that reframe is heavier than it sounds.",
              open: cardOpen[0],
            },
            {
              label: "What it did to you",
              body:
                "It puts you in a position where saying no starts to feel like a debt you're refusing to pay — not a boundary you're allowed to have.",
              open: cardOpen[1],
            },
            {
              label: "What may be going on",
              body:
                "This is the early edge of financial pressure being used as leverage. It doesn't have to be dramatic to matter.",
              open: cardOpen[2],
            },
          ]}
          resources={[
            { label: "Coercive control basics — Women's Aid", url: "womensaid.org.uk" },
            { label: "Healthy vs unhealthy signs — love is respect", url: "loveisrespect.org" },
            {
              label: "Financial abuse: recognizing the signs — NNEDV",
              url: "nnedv.org",
              highlight: true,
            },
          ]}
        />
      )}

      <CaptionBar
        from={20}
        duration={290}
        label="scenario 2"
        body="A custom sentence with a line of context — the model can now name the specific tactic."
      />

      <Callout
        from={220}
        duration={90}
        x={1340}
        y={620}
        width={440}
        label="context matters"
        body="Two dates in vs. two years in changes the read. Context is optional but disproportionately valuable."
        pointTo={{ x: 500, y: 940 }}
      />

      {/* result callouts */}
      <Callout
        from={360}
        duration={140}
        x={130}
        y={220}
        width={420}
        label="statements only"
        body="No questions in the output. The tool never sounds like it expects a reply — because there's no one on the other end."
        pointTo={{ x: 500, y: 400 }}
      />

      <Callout
        from={540}
        duration={160}
        x={1340}
        y={720}
        width={440}
        label="situation detector"
        body="Regex matched 'owe / money' → the third resource is financial-abuse specific. Two tactic links + one situational link."
        pointTo={{ x: 1400, y: 930 }}
        tone="why"
      />

      <CaptionBar
        from={330}
        duration={380}
        label="the read"
        body="Same three-card shape. The resource picker adds a targeted third link when the input maps to a real-world domain."
      />
    </BrowserFrame>
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
    { frame: 0, x: 1400, y: 800 },
    { frame: 30, x: 380, y: 320, click: true },
    { frame: 250, x: 380, y: 820 },
    { frame: 290, x: 380, y: 820, click: true },
    { frame: 340, x: 1300, y: 500 },
    { frame: 720, x: 1300, y: 500 },
  ];

  const inResult = frame >= 310;
  const cardOpen = [
    inResult ? 1 : 0,
    interpolate(frame, [420, 460], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
    interpolate(frame, [520, 560], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
  ];
  const scrollY = interpolate(frame, [520, 700], [0, -240], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <BrowserFrame>
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
              body:
                "This is a threat, wrapped in a conditional. The 'if' doesn't soften it — it names the price of leaving.",
              open: cardOpen[0],
            },
            {
              label: "What it does to your choices",
              body:
                "It's designed to make leaving feel like the dangerous option. It is not, but that's the effect this sentence is engineered for.",
              open: cardOpen[1],
            },
            {
              label: "What comes next",
              body:
                "Safety planning is a real thing — trained people help with it every day. You don't have to make a decision alone from inside this.",
              open: cardOpen[2],
            },
          ]}
          resources={[
            { label: "National DV Hotline — call, chat, text", url: "thehotline.org", highlight: true },
            { label: "love is respect — 24/7 for teens & young adults", url: "loveisrespect.org", highlight: true },
            { label: "Safety planning guide — NDVH", url: "thehotline.org/plan-for-safety" },
          ]}
        />
      )}

      <CaptionBar
        from={20}
        duration={290}
        label="scenario 3 — safety"
        body="A threat-shaped sentence. The pipeline behaves differently from the ground up."
      />

      <Callout
        from={80}
        duration={220}
        x={1340}
        y={280}
        width={440}
        label="two-stage pipeline"
        body="Triage classifies first. When status = SAFETY, the analysis branch is hard-overridden — regardless of what the language model would have picked."
        pointTo={{ x: 500, y: 400 }}
        tone="safety"
      />

      {/* result callouts */}
      <Callout
        from={340}
        duration={160}
        x={130}
        y={200}
        width={420}
        label="defense-in-depth"
        body="Regex + keyword pre-filter + model triage. Even if one misses (future-tense threats used to), another catches. Real prod misses are backfilled."
        pointTo={{ x: 500, y: 300 }}
        tone="safety"
      />

      <Callout
        from={520}
        duration={200}
        x={1340}
        y={620}
        width={440}
        label="crisis lock"
        body="Resources are locked to crisis lines in this branch. No situation-detector swaps. The 'immediate danger' footer is always visible."
        pointTo={{ x: 1420, y: 900 }}
        tone="safety"
      />

      <CaptionBar
        from={330}
        duration={380}
        label="the read"
        body="Cards still name the pattern — but resources are hard-pinned to hotlines and safety planning."
      />
    </BrowserFrame>
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
            body:
              "30 hand-picked pages — never a homepage. Audited for dead links every time the bank changes.",
          },
          {
            n: "02",
            title: "Mapped to tactics",
            body:
              "DARVO, minimization, weaponized concern, financial, sexual coercion — each tactic has its own canonical pair.",
          },
          {
            n: "03",
            title: "Situation detector",
            body:
              "A lightweight regex layer adds a third contextual link (money, sex, kids, monitoring) when the input matches.",
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

// ─────────────────────────────────────────────────────────────────────────
// SCENE 6 — Outro
// ─────────────────────────────────────────────────────────────────────────
const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const s = spring({ frame: frame - 5, fps, config: { damping: 20 } });
  const subO = interpolate(frame, [30, 60], [0, 1], { extrapolateRight: "clamp" });
  const footO = interpolate(frame, [55, 90], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 620,
          height: 620,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.accentSoft} 0%, transparent 70%)`,
          opacity: 0.55,
        }}
      />
      <h1
        style={{
          fontFamily: SERIF,
          fontStyle: "italic",
          fontSize: 200,
          color: COLORS.fg,
          margin: 0,
          letterSpacing: "-0.02em",
          transform: `scale(${0.9 + 0.1 * s}) translateY(${(1 - s) * 24}px)`,
          opacity: s,
        }}
      >
        is he ok?
      </h1>
      <p
        style={{
          fontFamily: SANS,
          fontSize: 32,
          color: COLORS.muted,
          marginTop: 30,
          opacity: subO,
        }}
      >
        Private. Anonymous. No account.
      </p>
      <div
        style={{
          marginTop: 60,
          fontFamily: SANS,
          fontSize: 18,
          color: COLORS.faint,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          opacity: footO,
        }}
      >
        Override Labs · Young Futures — Girl on Fire
      </div>
    </AbsoluteFill>
  );
};
