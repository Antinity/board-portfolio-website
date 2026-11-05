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

  // radial brightness profile, as a fraction of the cone radius. The bright
  // disc fills the inner ~46%; beyond it a very faint spill reaches almost to
  // the cone edge, so most of the board reads as softly lit around the beam.
  const D = 0.46; // disc radius as a fraction of the cone
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
    [0.93, 0.16],
  ]
    .map(([at, v]) => [at * D, v])
    .concat([
      [D * 0.96, 0.13], // faint outer spill…
      [0.62, 0.11],
      [0.8, 0.075],
      [0.92, 0.03],
      [0.97, 0], // …fading out before the cone edge
      [1, 0],
    ])
    .forEach(([at, v]) => g.addColorStop(at, `rgba(255,255,255,${v})`));
  c.fillStyle = g;
  c.fillRect(0, 0, S, S);

  // soft, slightly irregular reflector ripples
  c.globalCompositeOperation = "multiply";
  for (let i = 0; i < 10; i++) {
    const rad = m * 0.46 * (0.1 + i * 0.075);
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
    const d = r() * m * 0.38;
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

/**
 * Painted brick wall: staggered bricks with mortar lines, uneven tone and
 * grime. Tiled across the wall behind the board.
 */
export function brickTexture(repeat) {
  const W = 1024;
  const H = 1024;
  const cv = makeCanvas(W, H);
  const c = cv.getContext("2d");
  const r = rng(61);
  const bw = 128;
  const bh = 48;
  c.fillStyle = "#3a3634";
  c.fillRect(0, 0, W, H);
  for (let row = 0; row * bh < H; row++) {
    const off = row % 2 ? bw / 2 : 0;
    for (let x = -bw; x < W + bw; x += bw) {
      const v = 70 + r() * 30;
      c.fillStyle = `rgb(${v + 8},${v - 6},${v - 12})`;
      c.fillRect(x + off + 4, row * bh + 4, bw - 8, bh - 8);
      for (let i = 0; i < 40; i++) {
        c.fillStyle = `rgba(0,0,0,${r() * 0.15})`;
        c.fillRect(x + off + 4 + r() * (bw - 10), row * bh + 4 + r() * (bh - 10), 2 + r() * 4, 2 + r() * 3);
      }
    }
  }
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(...repeat);
  t.anisotropy = 16;
  return t;
}

/** Pale, whitewashed wood grain for the posts and beam, with a couple of knots. */
export function woodTexture() {
  const W = 256;
  const H = 2048;
  const cv = makeCanvas(W, H);
  const c = cv.getContext("2d");
  const r = rng(41);
  const base = c.createLinearGradient(0, 0, W, 0);
  base.addColorStop(0, "#d9cbb2");
  base.addColorStop(0.5, "#e6dac4");
  base.addColorStop(1, "#d6c7ad");
  c.fillStyle = base;
  c.fillRect(0, 0, W, H);
  for (let i = 0; i < 70; i++) {
    let x = r() * W;
    c.strokeStyle = r() < 0.5 ? `rgba(120,95,60,${0.1 + r() * 0.18})` : `rgba(255,250,240,${0.08 + r() * 0.15})`;
    c.lineWidth = 0.6 + r() * 2.4;
    c.beginPath();
    c.moveTo(x, 0);
    for (let y = 0; y <= H; y += 32) {
      x += (r() - 0.5) * 3;
      c.lineTo(x + Math.sin(y * 0.004 + i) * 4, y);
    }
    c.stroke();
  }
  for (let k = 0; k < 2; k++) {
    const kx = W * (0.3 + r() * 0.4);
    const ky = H * (0.2 + r() * 0.6);
    for (let i = 0; i < 9; i++) {
      c.strokeStyle = `rgba(110,80,45,${0.4 - i * 0.04})`;
      c.lineWidth = 1.6;
      c.beginPath();
      c.ellipse(kx, ky, 6 + i * 5, 14 + i * 13, 0, 0, Math.PI * 2);
      c.stroke();
    }
  }
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 16;
  return t;
}

/**
 * Whiteboard surface: off-white melamine with the ghosts of old, badly
 * erased marker strokes, a few specks, and grubbier edges. Returns a colour
 * map spanning the board and a fine, tiled bump map.
 */
export function whiteboardTextures(bumpRepeat) {
  const W = 2048;
  const H = 1056;
  const cv = makeCanvas(W, H);
  const c = cv.getContext("2d");
  const r = rng(53);
  c.fillStyle = "#e6e7e3";
  c.fillRect(0, 0, W, H);

  // ghost strokes of erased marker
  const inks = ["40,44,52", "40,70,140", "150,40,40", "30,90,60"];
  for (let i = 0; i < 70; i++) {
    const ink = inks[(r() * inks.length) | 0];
    c.strokeStyle = `rgba(${ink},${0.025 + r() * 0.045})`;
    c.lineWidth = 3 + r() * 9;
    c.lineCap = "round";
    let x = r() * W;
    let y = r() * H;
    c.beginPath();
    c.moveTo(x, y);
    const n = 3 + ((r() * 5) | 0);
    for (let k = 0; k < n; k++) {
      x += (r() - 0.5) * 260;
      y += (r() - 0.5) * 120;
      c.quadraticCurveTo(x + (r() - 0.5) * 80, y + (r() - 0.5) * 80, x, y);
    }
    c.stroke();
  }
  // eraser smears
  for (let i = 0; i < 26; i++) {
    const x = r() * W;
    const y = r() * H;
    const g = c.createRadialGradient(x, y, 0, x, y, 60 + r() * 160);
    g.addColorStop(0, `rgba(90,92,96,${0.025 + r() * 0.03})`);
    g.addColorStop(1, "rgba(90,92,96,0)");
    c.fillStyle = g;
    c.fillRect(x - 220, y - 220, 440, 440);
  }
  // specks (a few shared colour strings: setting a new one for every dot is what makes this slow)
  const specks = Array.from({ length: 8 }, (_, i) => `rgba(60,60,60,${((i / 7) * 0.12).toFixed(3)})`);
  for (let i = 0; i < 2600; i++) {
    c.fillStyle = specks[(r() * 8) | 0];
    c.fillRect(r() * W, r() * H, 1 + r(), 1 + r());
  }
  // grain: fine light and dark speckle over the whole surface, then coarser mottling
  const grain = c.getImageData(0, 0, W, H);
  const px = grain.data;
  for (let i = 0; i < px.length; i += 4) {
    const n = (r() - 0.5) * 34;
    px[i] += n;
    px[i + 1] += n;
    px[i + 2] += n;
  }
  c.putImageData(grain, 0, 0);
  const mottle = ["70,70,66", "255,255,255"].map((rgb) => Array.from({ length: 8 }, (_, i) => `rgba(${rgb},${(0.05 + (i / 7) * 0.1).toFixed(3)})`));
  for (let i = 0; i < 9000; i++) {
    c.fillStyle = mottle[r() < 0.5 ? 0 : 1][(r() * 8) | 0];
    const sz = 1.5 + r() * 3.5;
    c.fillRect(r() * W, r() * H, sz, sz);
  }
  // grubbier towards the frame
  const edge = c.createRadialGradient(W / 2, H / 2, H * 0.4, W / 2, H / 2, W * 0.62);
  edge.addColorStop(0, "rgba(80,76,70,0)");
  edge.addColorStop(1, "rgba(80,76,70,0.12)");
  c.fillStyle = edge;
  c.fillRect(0, 0, W, H);

  const map = new THREE.CanvasTexture(cv);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 16;

  const B = 512;
  const bcv = makeCanvas(B, B);
  const b = bcv.getContext("2d");
  // dabs of grey on mid grey, written straight into the pixels (60,000 fillRects were slow)
  const bump = b.createImageData(B, B);
  const d = bump.data;
  const grey = new Float32Array(B * B).fill(128);
  for (let i = 0; i < 60000; i++) {
    const v = 70 + r() * 120;
    const sz = Math.max(1, Math.round(1 + r() * 2));
    const x0 = (r() * B) | 0;
    const y0 = (r() * B) | 0;
    for (let y = y0; y < y0 + sz; y++) for (let x = x0; x < x0 + sz; x++) {
      const k = (y % B) * B + (x % B);
      grey[k] = grey[k] * 0.45 + v * 0.55;
    }
  }
  for (let k = 0; k < B * B; k++) {
    d[k * 4] = d[k * 4 + 1] = d[k * 4 + 2] = grey[k];
    d[k * 4 + 3] = 255;
  }
  b.putImageData(bump, 0, 0);
  const bumpMap = new THREE.CanvasTexture(bcv);
  bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(...bumpRepeat);
  return { map, bumpMap };
}
