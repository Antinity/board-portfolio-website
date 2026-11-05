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
    /** "mouse" or "touch": whichever the visitor used last */
    input: "mouse",
    /** a finger is currently down on the board */
    touching: false,
    /**
     * Where on the screen the torch is held on a touch screen (NDC): just above
     * the middle until the visitor taps somewhere, then wherever they tapped.
     * Drags, swipes and pinches never move it, so it stays clear of the thumb.
     */
    held: new Vector2(0, 0.08),
    /** clicks are ignored until this time (ms): the tail of a drag, pinch or glide-stop */
    suppressClickUntil: 0,
    /** the next click belongs to a drag, pinch or glide-stop that just ended: swallow it */
    swallowClick: false,
    /** id of the item the resting torch has settled on (touch only) */
    focus: null,
    /** camera speed on the board, world units / second */
    speed: 0,
    /** cone radius of the torch on the board, world units (sized to the screen) */
    torchRadius: 12.2,
    /** the board fills the screen and is panned sideways (phones) */
    fill: false,
    /** id of the item being read, or null */
    reading: null,
    /** 0 → 1 while a page pops out to be read */
    readT: 0,
    /** world position of the page being read (depth-of-field focus) */
    readPoint: new Vector3(),
    /** how far the held page has been spun by dragging (radians) */
    spin: { yaw: 0, pitch: 0 },
    /** zoom into the held page (1 = fits the screen) and where it has been panned to (NDC) */
    readZoom: 1,
    readPan: new Vector2(0, 0),
    /** half the held page's size on screen at zoom 1, in NDC (set by the page being held) */
    readHalf: new Vector2(0.8, 0.8),
  };
}

/** Frame-rate independent exponential smoothing factor. */
export const damp = (lambda, dt) => 1 - Math.exp(-lambda * dt);
