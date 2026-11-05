"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { ITEMS, actionOf } from "@/data/boardLayout";
import { UNIT, rectCenter } from "../space";

const SETTLE_MS = 180; // how long the torch and board must be still before it "finds" something
const QUIET = { board: 0.15, aim: 0.3 }; // world units / second
const MOVING = { board: 0.6, aim: 1.2 };

/** Every clickable item as a rotated rectangle, topmost last. */
const TARGETS = ITEMS.filter((item) => ["read", "link", "copy"].includes(actionOf(item)))
  .map((item, order) => {
    const [cx, cy] = rectCenter(item);
    const a = (-(item.rot || 0) * Math.PI) / 180; // the item's rotation on the board
    return { id: item.id, cx, cy, hw: (item.w * UNIT) / 2, hh: (item.h * UNIT) / 2, cos: Math.cos(a), sin: Math.sin(a), z: item.z || 0, order };
  })
  .sort((p, q) => p.z - q.z || p.order - q.order);

/** The topmost clickable item under a board point, if any. */
function itemAt(x, y) {
  for (let i = TARGETS.length - 1; i >= 0; i--) {
    const t = TARGETS[i];
    const dx = x - t.cx;
    const dy = y - t.cy;
    const lx = dx * t.cos + dy * t.sin; // into the item's own frame
    const ly = -dx * t.sin + dy * t.cos;
    if (Math.abs(lx) <= t.hw && Math.abs(ly) <= t.hh) return t.id;
  }
  return null;
}

/**
 * Touch screens have no hover, so the torch does it instead: once the board
 * stops moving and the beam has settled, whatever it rests on gets the red
 * marker loop (`rig.focus`). It lets go the moment the board moves again.
 */
export default function TorchFocus({ rig }) {
  const state = useRef({ x: 0, y: 0, still: 0 });

  useFrame((_, rawDt) => {
    const s = state.current;
    const dt = Math.max(rawDt, 1 / 240);
    const aimSpeed = Math.hypot(rig.aim.x - s.x, rig.aim.y - s.y) / dt;
    s.x = rig.aim.x;
    s.y = rig.aim.y;

    if (rig.input !== "touch" || rig.reading) {
      s.still = 0;
      if (rig.focus) rig.focus = null;
      return;
    }
    if (rig.speed > MOVING.board || aimSpeed > MOVING.aim) {
      s.still = 0;
      if (rig.focus) rig.focus = null;
    } else if (rig.speed < QUIET.board && aimSpeed < QUIET.aim) {
      s.still += dt * 1000;
    } else {
      s.still = 0;
    }
    if (s.still >= SETTLE_MS) {
      const hit = itemAt(rig.aim.x, rig.aim.y);
      if (hit !== rig.focus) rig.focus = hit;
    }
  });

  return null;
}
