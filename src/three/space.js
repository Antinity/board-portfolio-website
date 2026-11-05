import { BOARD } from "@/data/boardLayout";

/** World units per board pixel. The board is 24 × 14 world units. */
export const UNIT = 1 / 100;

export const BOARD_W = BOARD.width * UNIT;
export const BOARD_H = BOARD.height * UNIT;
export const FRAME = BOARD.frame * UNIT;

/** Height of each stacking layer above the cork (world units). */
export const LAYER = 0.012;

/** Board pixel (top-left origin, y down) → world position (centre origin, y up). */
export function toWorld(px, py) {
  return [px * UNIT - BOARD_W / 2, BOARD_H / 2 - py * UNIT];
}

/** World position of the centre of a board-pixel rectangle. */
export function rectCenter({ x, y, w, h }) {
  return toWorld(x + w / 2, y + h / 2);
}

/**
 * World position of a point on an item, given as fractions of its size
 * (`at` = [fx, fy], top-left origin), honouring the item's rotation.
 */
export function itemPoint(item, at = [0.5, 0.06]) {
  const [cx, cy] = rectCenter(item);
  const lx = (at[0] - 0.5) * item.w * UNIT;
  const ly = (0.5 - at[1]) * item.h * UNIT;
  const a = (-(item.rot || 0) * Math.PI) / 180;
  return [cx + lx * Math.cos(a) - ly * Math.sin(a), cy + lx * Math.sin(a) + ly * Math.cos(a)];
}

/** Z of an item's surface. */
export const itemZ = (item) => 0.004 + (item.z || 0) * LAYER;
