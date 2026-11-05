import { Vector2, Vector3 } from "three";

/**
 * Mutable per-frame state shared by the camera, torch, items and effects.
 * (Plain object, not React state — it changes every frame.)
 */
export function createRig(home = new Vector3()) {
  return {
    /** pointer in normalised device coords (-1..1) */
    pointer: new Vector2(0, 0),
    /** false until the visitor first moves the pointer */
    pointerActive: false,
    /** point on the board under the pointer (or `home` before any input) */
    cursor: home.clone(),
    /** where the torch rests before any input */
    home: home.clone(),
    /** point the torch is aimed at (smoothed) */
    aim: home.clone(),
    /** screen-space camera velocity for motion blur */
    blur: new Vector2(0, 0),
    zoomBlur: 0,
    /** user is dragging the camera */
    dragging: false,
    /** id of the item being read, or null */
    reading: null,
    /** 0 → 1 while a page pops out to be read */
    readT: 0,
    /** world position of the page being read (depth-of-field focus) */
    readPoint: new Vector3(),
    /** how far the held page has been spun by dragging (radians) */
    spin: { yaw: 0, pitch: 0 },
  };
}

/** Frame-rate independent exponential smoothing factor. */
export const damp = (lambda, dt) => 1 - Math.exp(-lambda * dt);
