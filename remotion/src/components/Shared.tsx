import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { COLORS, SANS } from "../theme";

// Shared "browser chrome" wrapper so the product scenes feel like a screen recording.
export const BrowserFrame: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#E8E1D8" }}>
      <div
        style={{
          position: "absolute",
          left: 120,
          top: 70,
          right: 120,
          bottom: 70,
          borderRadius: 18,
          overflow: "hidden",
          backgroundColor: COLORS.bg,
          boxShadow: "0 30px 80px rgba(0,0,0,0.12)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Title bar */}
        <div
          style={{
            height: 44,
            backgroundColor: "#EDE6DC",
            borderBottom: `1px solid ${COLORS.divider}`,
            display: "flex",
            alignItems: "center",
            padding: "0 18px",
            gap: 8,
          }}
        >
          <Dot color="#E07A6B" />
          <Dot color="#E5B25C" />
          <Dot color="#86B26F" />
          <div
            style={{
              marginLeft: 24,
              backgroundColor: COLORS.surface,
              borderRadius: 8,
              padding: "5px 18px",
              fontFamily: SANS,
              fontSize: 14,
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
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: color,
    }}
  />
);

// Animated cursor that moves between waypoints.
export type Waypoint = { frame: number; x: number; y: number; click?: boolean };

export const Cursor: React.FC<{ waypoints: Waypoint[] }> = ({ waypoints }) => {
  const frame = useCurrentFrame();
  if (waypoints.length === 0) return null;

  let x = waypoints[0].x;
  let y = waypoints[0].y;
  let clickScale = 1;

  for (let i = 0; i < waypoints.length - 1; i++) {
    const a = waypoints[i];
    const b = waypoints[i + 1];
    if (frame >= a.frame && frame <= b.frame) {
      const t = (frame - a.frame) / Math.max(1, b.frame - a.frame);
      const eased = easeInOut(t);
      x = a.x + (b.x - a.x) * eased;
      y = a.y + (b.y - a.y) * eased;
      break;
    }
    if (frame > b.frame) {
      x = b.x;
      y = b.y;
    }
  }

  // Click pulse
  for (const w of waypoints) {
    if (w.click && frame >= w.frame && frame <= w.frame + 12) {
      const t = (frame - w.frame) / 12;
      clickScale = 1 - 0.18 * Math.sin(t * Math.PI);
    }
  }

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `scale(${clickScale})`,
        transformOrigin: "top left",
        pointerEvents: "none",
        zIndex: 1000,
        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.25))",
      }}
    >
      <svg width="28" height="28" viewBox="0 0 24 24">
        <path
          d="M3 2 L3 19 L8 15 L11 22 L14 21 L11 14 L18 14 Z"
          fill="#1F1A17"
          stroke="#FBF8F4"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

// Typewriter helper: returns substring of `text` based on frame range.
export function typewriter(
  text: string,
  frame: number,
  startFrame: number,
  charsPerFrame = 0.7,
): string {
  if (frame < startFrame) return "";
  const chars = Math.floor((frame - startFrame) * charsPerFrame);
  return text.slice(0, Math.min(chars, text.length));
}

export const FadeIn: React.FC<{
  from: number;
  duration?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
  riseY?: number;
}> = ({ from, duration = 18, children, style, riseY = 8 }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [from, from + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const y = interpolate(frame, [from, from + duration], [riseY, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div style={{ ...style, opacity, transform: `translateY(${y}px)` }}>
      {children}
    </div>
  );
};
