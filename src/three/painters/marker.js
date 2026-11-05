import { font } from "./common";

/*
 * Hand-drawn marks. Nothing here is a clean vector: every stroke wobbles off
 * its line, swells and thins with the pressure of the pen, and tapers where
 * the pen lands and lifts; every letter sits a little off the baseline.
 * All sizes are board pixels.
 */

/** Smooth 1-D noise in 0..1: random knots eased into each other. */
export function smoothNoise(r, knots = 8) {
  const v = Array.from({ length: Math.max(2, knots) }, () => r());
  return (t) => {
    const x = Math.min(Math.max(t, 0), 1) * (v.length - 1);
    const i = Math.min(Math.floor(x), v.length - 2);
    const f = x - i;
    const s = f * f * (3 - 2 * f);
    return v[i] + (v[i + 1] - v[i]) * s;
  };
}

/** Points along a polyline, about `step` apart. */
function resample(pts, step) {
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / step));
    for (let k = 1; k <= n; k++) out.push([x0 + ((x1 - x0) * k) / n, y0 + ((y1 - y0) * k) / n]);
  }
  return out;
}

/**
 * One pen stroke through `pts`: drifts off the line, swells and thins along
 * its length, and is narrower where the pen touches down and lifts off.
 */
export function markerStroke(ctx, pts, { color, width = 5, r, taper = 0.12, wobble = 0.8, alpha = 1 }) {
  const path = resample(pts, 2.5);
  const n = path.length;
  const press = smoothNoise(r, Math.max(3, Math.round(n / 14)));
  const sway = smoothNoise(r, Math.max(3, Math.round(n / 24)));
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.globalAlpha = alpha;
  let prev = null;
  for (let i = 0; i < n; i++) {
    const t = n > 1 ? i / (n - 1) : 0;
    const [x, y] = path[i];
    const [px, py] = path[Math.max(i - 1, 0)];
    const [nx, ny] = path[Math.min(i + 1, n - 1)];
    let tx = nx - px;
    let ty = ny - py;
    const len = Math.hypot(tx, ty) || 1;
    tx /= len;
    ty /= len;
    const drift = (sway(t) - 0.5) * 2 * wobble;
    const X = x - ty * drift;
    const Y = y + tx * drift;
    const ends = Math.min(1, t / taper, (1 - t) / taper);
    const w = width * (0.5 + 0.65 * press(t)) * (0.4 + 0.6 * Math.max(0, ends));
    if (prev) {
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.moveTo(prev[0], prev[1]);
      ctx.lineTo(X, Y);
      ctx.stroke();
    }
    prev = [X, Y];
  }
  ctx.restore();
}

/** A gently bowed, sloping line from (x0, y0) to (x1, y1). */
export function markerLine(ctx, x0, y0, x1, y1, { r, bow = 3, ...pen }) {
  const n = Math.max(8, Math.round(Math.hypot(x1 - x0, y1 - y0) / 24));
  const lift = (r() - 0.5) * 2 * bow;
  const pts = Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    return [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t + Math.sin(Math.PI * t) * lift];
  });
  markerStroke(ctx, pts, { r, ...pen });
}

/** A five-point star drawn in one go, closing a little past where it began. */
export function markerStar(ctx, cx, cy, radius, { r, ...pen }) {
  const spin = (r() - 0.5) * 0.5;
  const at = (k) => {
    const a = -Math.PI / 2 + spin + (k * 2 * Math.PI) / 5;
    const rr = radius * (0.9 + r() * 0.2);
    return [cx + Math.cos(a) * rr + (r() - 0.5) * radius * 0.14, cy + Math.sin(a) * rr + (r() - 0.5) * radius * 0.14];
  };
  const pts = [0, 2, 4, 1, 3, 0].map(at);
  const [x0, y0] = pts[0];
  const [x2, y2] = pts[1];
  pts.push([x0 + (x2 - x0) * 0.2, y0 + (y2 - y0) * 0.2]); // overshoot
  markerStroke(ctx, pts, { r, taper: 0.05, wobble: 0.5, ...pen });
}

/** Width of `text` set one letter at a time (as markerText lays it out). */
export function inkWidth(ctx, text, spacing = 0) {
  return [...text].reduce((n, c) => n + ctx.measureText(c).width + spacing, 0);
}

/**
 * Handwriting. The current font is used for the letterforms, but each one
 * is set separately: nudged off the baseline, turned a hair, a touch
 * larger or smaller, with extra stroke where the pen pressed hard, and the
 * whole line drifting. Returns where it sat.
 */
export function markerText(ctx, text, x, y, { f, size, color, r, align = "left", weight = 400, jitter = 1, press = 1, dry = 1 }) {
  ctx.save();
  ctx.font = font(f, size, weight);
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  const chars = [...text];
  const adv = chars.map((c) => ctx.measureText(c).width);
  const total = adv.reduce((a, b) => a + b, 0);
  const left = align === "center" ? x - total / 2 : align === "right" ? x - total : x;
  const drift = (r() - 0.5) * 0.014;
  const pressure = smoothNoise(r, Math.max(3, Math.round(chars.length / 3)));
  let cx = left;
  chars.forEach((c, i) => {
    if (c !== " ") {
      const t = chars.length > 1 ? i / (chars.length - 1) : 0;
      ctx.save();
      ctx.translate(cx + adv[i] / 2, y + (cx - left) * drift + (r() - 0.5) * size * 0.05 * jitter);
      ctx.rotate((r() - 0.5) * 0.1 * jitter);
      ctx.scale(1 + (r() - 0.5) * 0.08 * jitter, 1 + (r() - 0.5) * 0.1 * jitter);
      ctx.fillStyle = color;
      ctx.strokeStyle = color;
      ctx.fillText(c, 0, 0);
      ctx.lineJoin = "round";
      ctx.lineWidth = size * 0.045 * press * pressure(t);
      if (ctx.lineWidth > 0.2) ctx.strokeText(c, 0, 0);
      ctx.restore();
    }
    cx += adv[i];
  });
  // a pen running dry leaves faint streaks in the stroke
  if (dry > 0) {
    ctx.globalCompositeOperation = "destination-out";
    const bits = Math.round((total / 9) * dry);
    for (let i = 0; i < bits; i++) {
      ctx.globalAlpha = 0.2 + r() * 0.35;
      ctx.fillRect(left + r() * total, y - size * (0.1 + r() * 0.75), 0.6 + r() * 1.3, 0.5 + r() * 0.6);
    }
  }
  ctx.restore();
  return { left, width: total };
}

/**
 * Where a picture will go: a box sketched in pencil, crossed through, with a
 * note on a patch of clean paper (`ground`) so the cross doesn't run through it.
 */
export function sketchedPlaceholder(ctx, x, y, w, h, { f, r, note, ground, color = "#4a4740" }) {
  const pen = { color, r, width: 1.3, taper: 0.04, wobble: 0.5, alpha: 0.7 };
  const j = () => (r() - 0.5) * 3;
  markerStroke(ctx, [[x + j(), y + j()], [x + w + j(), y + j()], [x + w + j(), y + h + j()], [x + j(), y + h + j()], [x + j(), y + 4]], pen);
  markerLine(ctx, x + 6, y + 6, x + w - 6, y + h - 6, { ...pen, width: 0.8, alpha: 0.35, bow: 3 });
  markerLine(ctx, x + w - 6, y + 6, x + 6, y + h - 6, { ...pen, width: 0.8, alpha: 0.35, bow: 3 });
  const size = Math.min(17, w / 7.5);
  ctx.font = font(f, size, 600);
  const nw = ctx.measureText(note).width;
  ctx.fillStyle = ground;
  ctx.fillRect(x + w / 2 - nw / 2 - 8, y + h / 2 - size * 0.9, nw + 16, size * 1.45);
  markerText(ctx, note, x + w / 2, y + h / 2 + size * 0.2, { f, size, weight: 600, color: "rgba(62,58,52,0.66)", r, align: "center", jitter: 0.6, press: 0.2, dry: 0 });
}
