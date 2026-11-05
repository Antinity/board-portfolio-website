import * as THREE from "three";

/* Procedural textures drawn once on a 2D canvas. */

/** Small deterministic PRNG so textures are identical on every load. */
export function rng(seed = 1) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}

export function makeCanvas(w, h) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

function toTexture(canvas, { repeat, srgb = true } = {}) {
  const t = new THREE.CanvasTexture(canvas);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(...repeat);
  }
  t.anisotropy = 8;
  return t;
}

/**
 * Cork tile: warm brown base with thousands of granules (light + dark) and a
 * few pin holes. Returns a colour map and a matching bump map.
 */
export function corkTextures(repeat) {
  const S = 2048;
  const color = makeCanvas(S, S);
  const bump = makeCanvas(S, S);
  const c = color.getContext("2d");
  const b = bump.getContext("2d");
  const r = rng(7);

  c.fillStyle = "#9a6c42";
  c.fillRect(0, 0, S, S);
  b.fillStyle = "#808080";
  b.fillRect(0, 0, S, S);

  const tones = ["#7a5230", "#b07f50", "#c4925d", "#6a4526", "#a5764a", "#8d6039", "#d0a06a"];
  for (let i = 0; i < 200000; i++) {
    const x = r() * S;
    const y = r() * S;
    const rad = 0.8 + r() * r() * 4;
    const tone = tones[(r() * tones.length) | 0];
    c.globalAlpha = 0.35 + r() * 0.55;
    c.fillStyle = tone;
    c.beginPath();
    c.ellipse(x, y, rad, rad * (0.6 + r() * 0.6), r() * Math.PI, 0, Math.PI * 2);
    c.fill();
    const lum = tone === "#6a4526" || tone === "#7a5230" ? 60 : 170 + r() * 60;
    b.globalAlpha = 0.5;
    b.fillStyle = `rgb(${lum},${lum},${lum})`;
    b.beginPath();
    b.arc(x, y, rad, 0, Math.PI * 2);
    b.fill();
  }
  // old pin holes
  c.globalAlpha = 0.7;
  b.globalAlpha = 1;
  for (let i = 0; i < 80; i++) {
    const x = r() * S;
    const y = r() * S;
    c.fillStyle = "#2e1d10";
    c.beginPath();
    c.arc(x, y, 1.4, 0, Math.PI * 2);
    c.fill();
    b.fillStyle = "#000";
    b.beginPath();
    b.arc(x, y, 1.6, 0, Math.PI * 2);
    b.fill();
  }
  c.globalAlpha = b.globalAlpha = 1;
  return { map: toTexture(color, { repeat }), bumpMap: toTexture(bump, { repeat, srgb: false }) };
}

/** Fine paper fibre, used as a shared bump map for every sheet of paper. */
let paperBump = null;
export function paperBumpTexture() {
  if (paperBump) return paperBump;
  const S = 512;
  const cv = makeCanvas(S, S);
  const c = cv.getContext("2d");
  const r = rng(3);
  c.fillStyle = "#808080";
  c.fillRect(0, 0, S, S);
  for (let i = 0; i < 9000; i++) {
    const v = 100 + r() * 60;
    c.strokeStyle = `rgba(${v},${v},${v},0.35)`;
    c.lineWidth = 0.5 + r();
    const x = r() * S;
    const y = r() * S;
    const a = r() * Math.PI;
    const l = 2 + r() * 8;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
    c.stroke();
  }
  paperBump = toTexture(cv, { repeat: [3, 3], srgb: false });
  return paperBump;
}

/**
 * Flashlight "cookie" — the beam pattern projected by the torch, modelled on
 * an old LED torch in The Last of Us Part II: a large, evenly lit disc with a
 * crisp edge, soft concentric reflector bands, and a tiny bright halo around
 * the dark bulb at the very centre. Lens wear is kept to a few faint specks.
 */
export function torchCookie() {
  const S = 1024;
  const cv = makeCanvas(S, S);
  const c = cv.getContext("2d");
  const r = rng(11);
  const m = S / 2;

  c.fillStyle = "#000";
  c.fillRect(0, 0, S, S);

  // radial brightness profile, as a fraction of the cone radius
  const g = c.createRadialGradient(m, m, 0, m, m, m);
  [
    [0, 0.5], // the bulb's dark centre
    [0.018, 0.42],
    [0.032, 1], // tiny bright halo
    [0.06, 0.96],
    [0.11, 0.86],
    [0.19, 0.8],
    [0.25, 0.64], // darker reflector band
    [0.32, 0.7],
    [0.42, 0.79], // brighter ring
    [0.5, 0.68],
    [0.6, 0.73],
    [0.7, 0.66],
    [0.8, 0.6],
    [0.86, 0.55],
    [0.9, 0.42], // crisp but not razor edge
    [0.925, 0.12],
    [0.945, 0],
    [1, 0],
  ].forEach(([at, v]) => g.addColorStop(at, `rgba(255,255,255,${v})`));
  c.fillStyle = g;
  c.fillRect(0, 0, S, S);

  // soft, slightly irregular reflector ripples
  c.globalCompositeOperation = "multiply";
  for (let i = 0; i < 10; i++) {
    const rad = m * (0.1 + i * 0.075);
    c.strokeStyle = `rgba(0,0,0,${0.03 + r() * 0.04})`;
    c.lineWidth = 6 + r() * 10;
    c.filter = "blur(4px)";
    c.beginPath();
    c.arc(m + (r() - 0.5) * 6, m + (r() - 0.5) * 6, rad, 0, Math.PI * 2);
    c.stroke();
  }
  c.filter = "none";

  // a few faint specks of dust on the lens
  for (let i = 0; i < 9; i++) {
    const a = r() * Math.PI * 2;
    const d = r() * m * 0.8;
    const x = m + Math.cos(a) * d;
    const y = m + Math.sin(a) * d;
    const rad = 2 + r() * 5;
    const bg = c.createRadialGradient(x, y, 0, x, y, rad);
    bg.addColorStop(0, `rgba(0,0,0,${0.08 + r() * 0.08})`);
    bg.addColorStop(1, "rgba(0,0,0,0)");
    c.fillStyle = bg;
    c.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }

  c.globalCompositeOperation = "source-over";
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
