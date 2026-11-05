/*
 * Quality ladder. The board starts on the richest rung the GPU is likely to
 * hold at a steady frame rate, and QualityGovernor steps down one rung at a
 * time whenever it measures it can't (it never steps back up, so the picture
 * doesn't flip back and forth). Each rung gives up as little as possible:
 *
 *  - fx "high":   ambient occlusion + depth of field + 4x MSAA (needs a depth
 *                 and normal pass, roughly doubling the cost of the frame)
 *  - fx "medium": everything else, plus baked contact shadows standing in
 *                 for the ambient occlusion
 *  - fx "low":    as medium with 2x MSAA and a smaller torch shadow map
 *  - fx "off":    no post-processing; the renderer tone-maps instead
 *  - fx "lite":   no shadow maps, and cheap diffuse lighting (lite.js): for
 *                 GPUs that can't manage the rest at any sensible resolution
 *
 * `dpr` caps the pixel ratio (below 1 renders under the screen's resolution).
 * It never goes below 0.75: under that, the writing on the board smears into
 * grey, and the cheaper shading has to make up the difference instead.
 */
export const DESKTOP_LADDER = [
  { fx: "high", dpr: 1.5 },
  { fx: "medium", dpr: 1.5 },
  { fx: "medium", dpr: 1.25 },
  { fx: "low", dpr: 1 },
  { fx: "off", dpr: 1 },
  { fx: "lite", dpr: 1 },
  { fx: "lite", dpr: 0.85 },
  { fx: "lite", dpr: 0.75 },
];

/** Phones and tablets: sharper screens, weaker GPUs, never the depth passes. */
export const TOUCH_LADDER = [
  { fx: "medium", dpr: 2 },
  { fx: "medium", dpr: 1.5 },
  { fx: "low", dpr: 1.5 },
  { fx: "low", dpr: 1.25 },
  { fx: "off", dpr: 1.25 },
  { fx: "lite", dpr: 1.5 },
  { fx: "lite", dpr: 1.25 },
  { fx: "lite", dpr: 1 },
];

/** The first lite rung of a ladder: where a very slow GPU should go straight to. */
export const firstLite = (ladder) => ladder.findIndex((r) => r.fx === "lite");

/** The GPU's name, if the browser will say. */
function gpuName() {
  try {
    const gl = document.createElement("canvas").getContext("webgl2") || document.createElement("canvas").getContext("webgl");
    if (!gl) return "";
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    const name = String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return name;
  } catch {
    return "";
  }
}

/**
 * Which ladder, and which rung to start on. `?fx=high|medium|low|off` pins
 * the effects and turns the governor off (`lite` too).
 */
export function startingQuality() {
  const touch = window.matchMedia("(pointer: coarse)").matches;
  const ladder = touch ? TOUCH_LADDER : DESKTOP_LADDER;
  const forced = new URLSearchParams(window.location.search).get("fx");
  if (["high", "medium", "low", "off", "lite"].includes(forced)) {
    return { ladder, level: Math.max(0, ladder.findIndex((r) => r.fx === forced)), pinned: true, touch };
  }

  const gpu = gpuName();
  let level = 0;
  if (/swiftshader|llvmpipe|software|basic render|microsoft basic/i.test(gpu)) level = ladder.length - 1; // no GPU at all
  else if (!touch && /intel|mali|adreno|powervr|videocore|vivante|radeon\(tm\) graphics|vega \d+ graphics/i.test(gpu) && !/\barc\b/i.test(gpu)) level = 1; // integrated graphics
  if ((navigator.hardwareConcurrency || 8) <= 4) level = Math.max(level, 2);
  return { ladder, level, pinned: false, touch, gpu };
}
