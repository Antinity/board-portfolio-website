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

// Paints run one after another in short slices: as many as fit in SLICE_MS,
// then the page gets the main thread back for a moment (so the loader keeps
// counting smoothly). They used to wait for an animation frame each, which on
// a slow GPU meant one sheet per rendered frame: a minute to load at 1 fps.
const SLICE_MS = 12;
let queue = Promise.resolve();
let sliceStart = 0;
const breathe = () => new Promise((resolve) => setTimeout(resolve, 0));

/** Run `fn` after the paints already queued, yielding between slices. */
function enqueue(fn) {
  const job = queue.then(async () => {
    if (performance.now() - sliceStart > SLICE_MS) {
      await breathe();
      sliceStart = performance.now();
    }
    return fn();
  });
  queue = job.catch(() => {});
  return job;
}

/** Paint an item to a CanvasTexture (queued). Its images start downloading at once, in parallel. */
export function paintItem(item) {
  const painter = PAINTERS[item.kind];
  if (!painter) throw new Error(`No painter for kind "${item.kind}"`);
  painter.images?.(item).forEach(loadImage);
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
