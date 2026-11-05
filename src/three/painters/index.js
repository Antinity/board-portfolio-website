import * as THREE from "three";
import { loadFonts } from "../fonts";
import { makeCanvas } from "../textures/procedural";
import { seeded } from "./common";
import { crew, profile, todo } from "./documents";
import { polaroid, print } from "./photos";
import { label, sticky, tag } from "./props";
import { emailslip, social } from "./contact";

/**
 * Painter registry. A painter is `{ paint(ctx, item, env), images?, alpha? }`:
 *  - paint:  draws the item in board-pixel units; may return clickable link
 *            regions `[{ x, y, w, h, href }]` (board px, item-local)
 *  - images: URLs it needs, preloaded into env.images
 *  - alpha:  has transparent cut-outs
 */
export const PAINTERS = { crew, emailslip, label, polaroid, print, profile, social, sticky, tag, todo };

/** Texture pixels per board pixel (capped so nothing exceeds 2048px). */
const DENSITY = 3;
const MAX_SIZE = 2048;

const imageCache = new Map();
function loadImage(src) {
  if (!imageCache.has(src)) {
    imageCache.set(
      src,
      new Promise((resolve) => {
        const img = new Image();
        img.decoding = "async";
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = src;
      })
    );
  }
  return imageCache.get(src);
}

// Paint one item per animation frame, so the loader keeps moving smoothly
// instead of freezing while every texture is drawn in one long task.
let queue = Promise.resolve();
const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => resolve()));

/** Paint an item to a CanvasTexture (queued: one per frame). */
export function paintItem(item) {
  const job = queue.then(nextFrame).then(() => paintNow(item));
  queue = job.catch(() => {});
  return job;
}

async function paintNow(item) {
  const painter = PAINTERS[item.kind];
  if (!painter) throw new Error(`No painter for kind "${item.kind}"`);
  const fonts = await loadFonts();
  const srcs = painter.images?.(item) ?? [];
  const loaded = await Promise.all(srcs.map(loadImage));
  const images = Object.fromEntries(srcs.map((s, i) => [s, loaded[i]]));

  const scale = Math.min(DENSITY, MAX_SIZE / Math.max(item.w, item.h));
  const canvas = makeCanvas(Math.ceil(item.w * scale), Math.ceil(item.h * scale));
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);
  const links = painter.paint(ctx, item, { fonts, images, r: seeded(item.id) }) ?? [];

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 16; // clamped to the GPU's maximum by three.js
  return { texture, links, alpha: Boolean(painter.alpha) };
}
