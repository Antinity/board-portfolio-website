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
 * Flashlight "cookie": what the light looks like through an old, damaged
 * torch lens — a tight Maglite hotspot, a darker reflector band, a faint outer
 * ring, plus scratches, a crack and grime that project onto the board.
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
    [0.12, 0.98],
    [0.2, 0.78], // hotspot edge
    [0.26, 0.42],
    [0.36, 0.3], // reflector band (dimmer)
    [0.46, 0.36],
    [0.52, 0.42], // faint outer ring
    [0.58, 0.22],
    [0.75, 0.08],
    [1, 0],
  ].forEach(([at, v]) => g.addColorStop(at, `rgba(255,255,255,${v})`));
  c.fillStyle = g;
  c.fillRect(0, 0, S, S);

  // concentric reflector ripples
  c.globalCompositeOperation = "multiply";
  for (let i = 0; i < 9; i++) {
    const rad = m * (0.22 + i * 0.045);
    c.strokeStyle = `rgba(0,0,0,${0.035 + r() * 0.045})`;
    c.lineWidth = 2 + r() * 4;
    c.beginPath();
    c.arc(m + (r() - 0.5) * 4, m + (r() - 0.5) * 4, rad, 0, Math.PI * 2);
    c.stroke();
  }

  // grime blotches
  for (let i = 0; i < 18; i++) {
    const x = m + (r() - 0.5) * m * 1.1;
    const y = m + (r() - 0.5) * m * 1.1;
    const rad = 10 + r() * 40;
    const bg = c.createRadialGradient(x, y, 0, x, y, rad);
    bg.addColorStop(0, `rgba(0,0,0,${0.12 + r() * 0.18})`);
    bg.addColorStop(1, "rgba(0,0,0,0)");
    c.fillStyle = bg;
    c.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }

  // scratches
  for (let i = 0; i < 26; i++) {
    const x = m + (r() - 0.5) * m;
    const y = m + (r() - 0.5) * m;
    const a = r() * Math.PI;
    const l = 20 + r() * 110;
    c.strokeStyle = `rgba(0,0,0,${0.18 + r() * 0.3})`;
    c.lineWidth = 0.6 + r() * 1.3;
    c.beginPath();
    c.moveTo(x, y);
    c.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + (r() - 0.5) * 10, y + Math.sin(a) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l);
    c.stroke();
  }

  // a crack running across one side of the lens
  c.strokeStyle = "rgba(0,0,0,0.75)";
  c.lineWidth = 2.2;
  c.beginPath();
  let x = m * 0.62;
  let y = m * 0.5;
  c.moveTo(x, y);
  for (let i = 0; i < 14; i++) {
    x += 9 + r() * 12;
    y += (r() - 0.3) * 18;
    c.lineTo(x, y);
    if (r() < 0.3) {
      c.moveTo(x, y);
      c.lineTo(x + (r() - 0.5) * 40, y + 20 + r() * 30);
      c.moveTo(x, y);
    }
  }
  c.stroke();

  c.globalCompositeOperation = "source-over";
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
