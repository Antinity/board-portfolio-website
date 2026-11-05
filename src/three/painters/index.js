import * as THREE from "three";
import { loadFonts } from "../fonts";
import { makeCanvas } from "../textures/procedural";
import { seeded } from "./common";
import { crew, dossier, flyer, indexcard, todo } from "./documents";
import { polaroid, print } from "./photos";
import { label, sticky, tag } from "./props";

/**
 * Painter registry. A painter is `{ paint(ctx, item, env), images?, glossy?, alpha? }`:
 *  - paint:  draws the item in board-pixel units; may return clickable link
 *            regions `[{ x, y, w, h, href }]` (board px, item-local)
 *  - images: URLs it needs, preloaded into env.images
 *  - glossy: photo paper (lower roughness)
 *  - alpha:  has transparent cut-outs
 */
export const PAINTERS = { crew, dossier, flyer, indexcard, label, polaroid, print, sticky, tag, todo };

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

/** Paint an item to a CanvasTexture. */
export async function paintItem(item) {
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
  return { texture, links, glossy: Boolean(painter.glossy), alpha: Boolean(painter.alpha) };
}
