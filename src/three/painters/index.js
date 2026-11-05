import * as THREE from "three";
import { loadFonts } from "../fonts";
import { makeCanvas } from "../textures/procedural";
import { seeded } from "./common";
import { crew, profile, todo } from "./documents";
import { polaroid } from "./photos";
import { casecard } from "./cases";
import { label, sticky, tag } from "./props";
import { emailslip, social } from "./contact";

/**
 * Painter registry. A painter is `{ paint(ctx, item, env), images?, alpha? }`:
 *  - paint:  draws the item in board-pixel units; may return clickable link
 *            regions `[{ x, y, w, h, href }]` (board px, item-local)
 *  - images: URLs it needs, preloaded into env.images
 *  - alpha:  has transparent cut-outs
 *  - pages:  `{ left, right }` painters for the inside, if it opens like a book
 */
export const PAINTERS = { case: casecard, crew, emailslip, label, polaroid, profile, social, sticky, tag, todo };

/** The inside pages of an item that opens like a book, or null. */
export const pagesOf = (item) => PAINTERS[item.kind]?.pages ?? null;

/** Texture pixels per board pixel (capped so nothing exceeds 2048px). */
const DENSITY = 3;
/** Inside pages are only seen up close, held open in front of the camera, so they get more. */
const PAGE_DENSITY = 6;
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

/** Run `fn` after the paints already queued, on a frame of its own. */
function enqueue(fn) {
  const job = queue.then(nextFrame).then(fn);
  queue = job.catch(() => {});
  return job;
}

/** Paint an item to a CanvasTexture (queued: one per frame). */
export function paintItem(item) {
  const painter = PAINTERS[item.kind];
  if (!painter) throw new Error(`No painter for kind "${item.kind}"`);
  return enqueue(() => paintNow(item, painter, DENSITY));
}

/** Paint the inside pages of a book item: `{ left, right }`, each `{ texture, links }`. */
export async function paintPages(item) {
  const pages = pagesOf(item);
  const [left, right] = await Promise.all(["left", "right"].map((side) => enqueue(() => paintNow(item, pages[side], PAGE_DENSITY, side))));
  return { left, right };
}

async function paintNow(item, painter, density, side = "") {
  const fonts = await loadFonts();
  const srcs = painter.images?.(item) ?? [];
  const loaded = await Promise.all(srcs.map(loadImage));
  const images = Object.fromEntries(srcs.map((s, i) => [s, loaded[i]]));

  const scale = Math.min(density, MAX_SIZE / Math.max(item.w, item.h));
  const canvas = makeCanvas(Math.ceil(item.w * scale), Math.ceil(item.h * scale));
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);
  const links = painter.paint(ctx, item, { fonts, images, r: seeded(item.id + side) }) ?? [];

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 16; // clamped to the GPU's maximum by three.js
  return { texture, links, alpha: Boolean(painter.alpha) };
}
