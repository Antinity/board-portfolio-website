"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { loading } from "../loading";
import { firstLite } from "../quality";

const WINDOW_SECONDS = 1.5; // frame times are averaged over this long
const SLOW_FRAME = 1 / 38; // slower than ~38 fps on average steps down (keeps a margin above 30)
const FIRST_LOOK_SECONDS = 3; // the opening camera move (motion blur, shadows warming up) isn't judged
const SETTLE_SECONDS = 1.5; // after each step, let shaders and buffers settle first
const CRAWLING_FPS = 14; // this slow: skip straight to lite shading
const SLUGGISH_FPS = 24; // this slow: skip a rung

/**
 * Keeps the frame rate up: once the board is shown, it averages frame times
 * and, while they are too slow, moves down the quality ladder (quality.js).
 * The slower it is, the further it jumps, so a weak GPU doesn't sit through
 * several slow steps first. It only ever steps down.
 */
export default function QualityGovernor({ level, ladder, onStep }) {
  const state = useRef({ ready: false, wait: FIRST_LOOK_SECONDS, time: 0, frames: 0 });
  const last = ladder.length - 1;

  useEffect(() => loading.subscribe(({ ready }) => ready && (state.current.ready = true)), []);

  // a new rung recompiles shaders and resizes buffers: give it time before judging it
  useEffect(() => {
    const s = state.current;
    s.wait = s.ready ? SETTLE_SECONDS : FIRST_LOOK_SECONDS; // a step taken while loading still waits out the opening
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
    if (average <= SLOW_FRAME) return;
    const fps = 1 / average;
    let next = level + (fps < SLUGGISH_FPS ? 2 : 1);
    if (fps < CRAWLING_FPS) next = Math.max(next, firstLite(ladder));
    onStep(Math.min(last, next));
  });

  return null;
}
