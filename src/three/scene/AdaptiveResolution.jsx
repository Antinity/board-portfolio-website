"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { loading } from "../loading";

const STEPS = [2, 1.5, 1.25, 1]; // pixel ratios, sharpest first
const WINDOW_SECONDS = 2; // frame times are averaged over this long
const SLOW_FRAME = 0.022; // seconds: slower than ~45 fps steps the resolution down

/**
 * Keeps phones smooth: once the board is shown, if frames are slow it
 * renders at a lower pixel ratio, one step at a time. It never steps back
 * up, so the picture can't flip between sharp and soft.
 */
export default function AdaptiveResolution() {
  const setDpr = useThree((s) => s.setDpr);
  const initial = useThree((s) => s.viewport.initialDpr);
  const state = useRef({ ready: false, time: 0, frames: 0, level: 0 });

  useEffect(() => {
    const s = state.current;
    // start from the first step that doesn't exceed what the screen was given
    s.level = Math.max(
      0,
      STEPS.findIndex((v) => v <= initial + 0.01)
    );
    return loading.subscribe(({ ready }) => {
      if (ready) s.ready = true;
    });
  }, [initial]);

  useFrame((_, dt) => {
    const s = state.current;
    if (!s.ready || dt > 0.25) return; // still loading, or the tab was in the background
    s.time += dt;
    s.frames += 1;
    if (s.time < WINDOW_SECONDS) return;
    const average = s.time / s.frames;
    s.time = 0;
    s.frames = 0;
    if (average > SLOW_FRAME && s.level < STEPS.length - 1) {
      s.level += 1;
      setDpr(STEPS[s.level]);
    }
  });

  return null;
}
