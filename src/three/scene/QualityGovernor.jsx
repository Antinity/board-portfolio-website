"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { loading } from "../loading";

const WINDOW_SECONDS = 2; // frame times are averaged over this long
const SLOW_FRAME = 1 / 38; // slower than ~38 fps on average steps down (keeps a margin above 30)
const SETTLE_SECONDS = 2.5; // after the board appears, and after each step, let things settle first

/**
 * Keeps the frame rate up: once the board is shown, it averages frame times
 * and, while they are too slow, asks for the next rung of the quality ladder
 * (see quality.js). It only ever steps down.
 */
export default function QualityGovernor({ level, last, onStep }) {
  const state = useRef({ ready: false, wait: SETTLE_SECONDS, time: 0, frames: 0 });

  useEffect(() => loading.subscribe(({ ready }) => ready && (state.current.ready = true)), []);

  // a new rung recompiles shaders and resizes buffers: give it time before judging it
  useEffect(() => {
    const s = state.current;
    s.wait = SETTLE_SECONDS;
    s.time = 0;
    s.frames = 0;
  }, [level]);

  useFrame((_, rawDt) => {
    const s = state.current;
    if (!s.ready || level >= last || document.hidden) return;
    const dt = Math.min(rawDt, 1); // a very slow machine still counts; a long stall (tab switched back) doesn't swamp the average
    if (s.wait > 0) {
      s.wait -= dt;
      return;
    }
    s.time += dt;
    s.frames += 1;
    if (s.time < WINDOW_SECONDS) return;
    const average = s.time / s.frames;
    s.time = 0;
    s.frames = 0;
    if (average > SLOW_FRAME) onStep(level + 1);
  });

  return null;
}
