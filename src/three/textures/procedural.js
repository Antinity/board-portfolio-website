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
  const S = 1024;
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
  for (let i = 0; i < 52000; i++) {
    const x = r() * S;
    const y = r() * S;
    const rad = 0.6 + r() * r() * 3.2;
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
  for (let i = 0; i < 40; i++) {
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
 * Flashlight "cookie": what the light looks like through a worn torch lens —
 * a small, tight Maglite hotspot, a dimmer reflector band and a soft outer
 * ring, with only the faintest grime, hairline scratches and one tiny chip.
 */
export function damagedGlassCookie() {
  const S = 512;
  const cv = makeCanvas(S, S);
  const c = cv.getContext("2d");
  const r = rng(11);
  const m = S / 2;

  c.fillStyle = "#000";
  c.fillRect(0, 0, S, S);

  const g = c.createRadialGradient(m, m, 0, m, m, m);
  [
    [0, 1],
    [0.06, 0.97],
    [0.11, 0.78], // hotspot edge (small)
    [0.17, 0.5],
    [0.3, 0.36], // reflector band
    [0.42, 0.38],
    [0.48, 0.4], // faint outer ring
    [0.56, 0.24],
    [0.75, 0.09],
    [1, 0],
  ].forEach(([at, v]) => g.addColorStop(at, `rgba(255,255,255,${v})`));
  c.fillStyle = g;
  c.fillRect(0, 0, S, S);

  c.globalCompositeOperation = "multiply";

  // subtle reflector ripples
  for (let i = 0; i < 7; i++) {
    const rad = m * (0.16 + i * 0.05);
    c.strokeStyle = `rgba(0,0,0,${0.02 + r() * 0.03})`;
    c.lineWidth = 2 + r() * 3;
    c.beginPath();
    c.arc(m + (r() - 0.5) * 3, m + (r() - 0.5) * 3, rad, 0, Math.PI * 2);
    c.stroke();
  }

  // a whisper of grime
  for (let i = 0; i < 6; i++) {
    const x = m + (r() - 0.5) * m;
    const y = m + (r() - 0.5) * m;
    const rad = 14 + r() * 26;
    const bg = c.createRadialGradient(x, y, 0, x, y, rad);
    bg.addColorStop(0, `rgba(0,0,0,${0.04 + r() * 0.05})`);
    bg.addColorStop(1, "rgba(0,0,0,0)");
    c.fillStyle = bg;
    c.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }

  // a few hairline scratches
  for (let i = 0; i < 7; i++) {
    const x = m + (r() - 0.5) * m * 0.9;
    const y = m + (r() - 0.5) * m * 0.9;
    const a = r() * Math.PI;
    const l = 12 + r() * 40;
    c.strokeStyle = `rgba(0,0,0,${0.06 + r() * 0.07})`;
    c.lineWidth = 0.5 + r() * 0.5;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
    c.stroke();
  }

  // one tiny chip near the rim
  c.strokeStyle = "rgba(0,0,0,0.22)";
  c.lineWidth = 1;
  c.beginPath();
  let x = m + m * 0.36;
  let y = m - m * 0.18;
  c.moveTo(x, y);
  for (let i = 0; i < 4; i++) {
    x += 4 + r() * 5;
    y += (r() - 0.4) * 6;
    c.lineTo(x, y);
  }
  c.stroke();

  c.globalCompositeOperation = "source-over";
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
