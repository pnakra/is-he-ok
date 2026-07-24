import React from "react";
import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { COLORS, SANS, SERIF } from "../theme";

/**
 * Lower-third caption bar. Fades in at `from`, holds, fades out `duration` frames later.
 * Sits centered near the bottom of the frame.
 */
export const CaptionBar: React.FC<{
  from: number;
  duration: number;
  label?: string;
  body: string;
}> = ({ from, duration, label, body }) => {
  const frame = useCurrentFrame();
  const inO = interpolate(frame, [from, from + 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const outO = interpolate(
    frame,
    [from + duration - 14, from + duration],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const opacity = Math.min(inO, outO);
  const y = interpolate(frame, [from, from + 18], [12, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  if (opacity <= 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        bottom: 80,
        left: "50%",
        transform: `translate(-50%, ${y}px)`,
        opacity,
        maxWidth: 1400,
        width: "80%",
        backgroundColor: "rgba(31,26,23,0.92)",
        color: "#F7F3EE",
        padding: "22px 34px",
        borderRadius: 14,
        boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
        display: "flex",
        gap: 22,
        alignItems: "flex-start",
        zIndex: 2000,
      }}
    >
      {label && (
        <div
          style={{
            fontFamily: SERIF,
            fontStyle: "italic",
            fontSize: 22,
            color: COLORS.accentSoft,
            letterSpacing: "0.02em",
            flexShrink: 0,
            paddingTop: 4,
          }}
        >
          {label}
        </div>
      )}
      <div
        style={{
          fontFamily: SANS,
          fontSize: 26,
          lineHeight: 1.4,
          fontWeight: 400,
        }}
      >
        {body}
      </div>
    </div>
  );
};

/**
 * Floating callout with a soft border, small kicker label, and an optional
 * connector line pointing to a target point. Position is absolute in the
 * composition's coordinate space (1920x1080).
 */
export const Callout: React.FC<{
  from: number;
  duration: number;
  x: number; // top-left of callout box
  y: number;
  width?: number;
  label?: string;
  body: string;
  // Optional connector target (in the same 1920x1080 space)
  pointTo?: { x: number; y: number };
  tone?: "default" | "safety" | "why";
}> = ({
  from,
  duration,
  x,
  y,
  width = 380,
  label,
  body,
  pointTo,
  tone = "default",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const s = spring({
    frame: frame - from,
    fps,
    config: { damping: 18, stiffness: 180 },
  });
  const inO = interpolate(frame, [from, from + 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const outO = interpolate(
    frame,
    [from + duration - 12, from + duration],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const opacity = Math.min(inO, outO);
  if (opacity <= 0) return null;

  const accent =
    tone === "safety"
      ? "#B84A3A"
      : tone === "why"
      ? COLORS.primary
      : COLORS.fg;

  return (
    <>
      {pointTo && (
        <svg
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 1920,
            height: 1080,
            pointerEvents: "none",
            opacity,
            zIndex: 1500,
          }}
        >
          <line
            x1={x + width / 2}
            y1={y + 40}
            x2={pointTo.x}
            y2={pointTo.y}
            stroke={accent}
            strokeWidth={2}
            strokeDasharray="6 6"
          />
          <circle cx={pointTo.x} cy={pointTo.y} r={7} fill={accent} />
          <circle
            cx={pointTo.x}
            cy={pointTo.y}
            r={14}
            fill="none"
            stroke={accent}
            strokeWidth={1.5}
            opacity={0.4}
          />
        </svg>
      )}
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          width,
          opacity,
          transform: `scale(${0.94 + 0.06 * s})`,
          transformOrigin: "top left",
          backgroundColor: COLORS.surface,
          border: `1.5px solid ${accent}`,
          borderRadius: 12,
          padding: "18px 22px",
          boxShadow: "0 18px 40px rgba(0,0,0,0.15)",
          zIndex: 1600,
        }}
      >
        {label && (
          <div
            style={{
              fontFamily: SERIF,
              fontStyle: "italic",
              fontSize: 16,
              color: accent,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            {label}
          </div>
        )}
        <div
          style={{
            fontFamily: SANS,
            fontSize: 20,
            lineHeight: 1.45,
            color: COLORS.fg,
          }}
        >
          {body}
        </div>
      </div>
    </>
  );
};

/**
 * Soft accent highlight ring you can drop over any element (absolutely positioned).
 */
export const HighlightRing: React.FC<{
  from: number;
  duration: number;
  x: number;
  y: number;
  width: number;
  height: number;
  radius?: number;
  tone?: "default" | "safety";
}> = ({ from, duration, x, y, width, height, radius = 12, tone = "default" }) => {
  const frame = useCurrentFrame();
  const inO = interpolate(frame, [from, from + 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const outO = interpolate(
    frame,
    [from + duration - 12, from + duration],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const opacity = Math.min(inO, outO);
  if (opacity <= 0) return null;
  const color = tone === "safety" ? "#B84A3A" : COLORS.primary;
  return (
    <div
      style={{
        position: "absolute",
        left: x - 8,
        top: y - 8,
        width: width + 16,
        height: height + 16,
        borderRadius: radius + 4,
        boxShadow: `0 0 0 3px ${color}`,
        opacity: opacity * 0.6,
        pointerEvents: "none",
        zIndex: 1400,
      }}
    />
  );
};
