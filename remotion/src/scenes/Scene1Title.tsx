import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { COLORS, SANS, SERIF } from "../theme";
import "../fonts";

// 600 frames @ 30fps = 20s
export const SCENE_1_FRAMES = 600;

export const Scene1Title: React.FC = () => {
  const frame = useCurrentFrame();

  const titleOpacity = interpolate(frame, [10, 40], [0, 1], {
    extrapolateRight: "clamp",
  });
  const titleY = interpolate(frame, [10, 40], [14, 0], {
    extrapolateRight: "clamp",
  });
  const subOpacity = interpolate(frame, [50, 80], [0, 1], {
    extrapolateRight: "clamp",
  });
  const tagOpacity = interpolate(frame, [90, 120], [0, 1], {
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(
    frame,
    [SCENE_1_FRAMES - 25, SCENE_1_FRAMES],
    [1, 1],
    { extrapolateRight: "clamp", extrapolateLeft: "clamp" },
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg,
        opacity: fadeOut,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: 120,
      }}
    >
      {/* Soft accent shape */}
      <div
        style={{
          position: "absolute",
          width: 480,
          height: 480,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.accentSoft} 0%, transparent 70%)`,
          top: 120,
          right: 80,
          opacity: 0.7,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 360,
          height: 360,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.surface2} 0%, transparent 70%)`,
          bottom: 120,
          left: 100,
          opacity: 0.8,
        }}
      />

      <div
        style={{
          fontFamily: SANS,
          fontSize: 22,
          color: COLORS.faint,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          marginBottom: 36,
          opacity: titleOpacity,
        }}
      >
        Override Labs
      </div>

      <h1
        style={{
          fontFamily: SERIF,
          fontStyle: "italic",
          fontSize: 180,
          color: COLORS.fg,
          margin: 0,
          letterSpacing: "-0.02em",
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          lineHeight: 1,
        }}
      >
        Is He Ok?
      </h1>

      <p
        style={{
          fontFamily: SANS,
          fontSize: 36,
          color: COLORS.muted,
          marginTop: 44,
          maxWidth: 1200,
          textAlign: "center",
          lineHeight: 1.4,
          opacity: subOpacity,
        }}
      >
        A sentence-level anti-coercion tool for girls.
      </p>

      <div
        style={{
          marginTop: 80,
          padding: "12px 28px",
          border: `1px solid ${COLORS.border}`,
          borderRadius: 999,
          fontFamily: SANS,
          fontSize: 20,
          color: COLORS.muted,
          backgroundColor: COLORS.surface,
          opacity: tagOpacity,
        }}
      >
        Young Futures · Girl on Fire track
      </div>
    </AbsoluteFill>
  );
};
