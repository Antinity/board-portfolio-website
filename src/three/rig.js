import { Vector2, Vector3 } from "three";

/**
 * Mutable per-frame state shared by the camera, flashlight and effects.
 * (Plain object, not React state — it changes every frame.)
 */
export function createRig() {
  return {
    /** pointer in normalised device coords (-1..1) */
    pointer: new Vector2(0, 0),
    pointerActive: false,
    /** point on the board under the pointer */
    cursor: new Vector3(0, 0, 0),
    /** point the torch is aimed at (smoothed) */
    aim: new Vector3(0, 0, 0),
    /** screen-space camera velocity for motion blur */
    blur: new Vector2(0, 0),
    zoomBlur: 0,
    /** user is dragging the camera */
    dragging: false,
  };
}

/** Frame-rate independent exponential smoothing factor. */
export const damp = (lambda, dt) => 1 - Math.exp(-lambda * dt);
