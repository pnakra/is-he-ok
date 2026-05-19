import React from "react";
import { AbsoluteFill } from "remotion";
import {
  TransitionSeries,
  linearTiming,
} from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";

import { Scene1Title, SCENE_1_FRAMES } from "./scenes/Scene1Title";
import { Scene2Homepage, SCENE_2_FRAMES } from "./scenes/Scene2Homepage";
import { Scene3Questions, SCENE_3_FRAMES } from "./scenes/Scene3Questions";
import { Scene4Result, SCENE_4_FRAMES } from "./scenes/Scene4Result";
import { Scene5Youth, SCENE_5_FRAMES } from "./scenes/Scene5Youth";
import { Scene6Impact, SCENE_6_FRAMES } from "./scenes/Scene6Impact";
import { Scene7Closing, SCENE_7_FRAMES } from "./scenes/Scene7Closing";
import { COLORS } from "./theme";

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

const TRANSITION = 20;

// Total = sum of scenes - 6 * transitions
export const TOTAL_FRAMES =
  SCENE_1_FRAMES +
  SCENE_2_FRAMES +
  SCENE_3_FRAMES +
  SCENE_4_FRAMES +
  SCENE_5_FRAMES +
  SCENE_6_FRAMES +
  SCENE_7_FRAMES -
  6 * TRANSITION;

export const MainVideo: React.FC = () => {
  const timing = linearTiming({ durationInFrames: TRANSITION });
  const presentation = fade();
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={SCENE_1_FRAMES}>
          <Scene1Title />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={presentation} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={SCENE_2_FRAMES}>
          <Scene2Homepage />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={presentation} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={SCENE_3_FRAMES}>
          <Scene3Questions />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={presentation} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={SCENE_4_FRAMES}>
          <Scene4Result />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={presentation} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={SCENE_5_FRAMES}>
          <Scene5Youth />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={presentation} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={SCENE_6_FRAMES}>
          <Scene6Impact />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={presentation} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={SCENE_7_FRAMES}>
          <Scene7Closing />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
