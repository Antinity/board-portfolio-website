import { rng } from "../textures/procedural";

/* Shared drawing helpers for painters. All sizes are in board pixels. */

export const INK = {
  black: "#1c1a17",
  type: "#26231e",
  red: "#a3161c",
  blue: "#1d3f9e",
  pencil: "#4a4740",
};

export const hashSeed = (str) => [...str].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 17);

export function seeded(id) {
  return rng(hashSeed(id));
}

export function font(f, size, weight = 400) {
  return `${weight} ${size}px ${f}`;
}

/** Word-wrap `text` inside `maxW`; returns the y after the last line. */
export function wrapText(ctx, text, x, y, maxW, lineH, { maxLines = Infinity, align = "left" } = {}) {
  const words = String(text).split(/\s+/);
  let line = "";
  let lines = 0;
  ctx.textAlign = align;
  const draw = (str) => {
    const ox = align === "center" ? x + maxW / 2 : x;
    ctx.fillText(str, ox, y);
    y += lineH;
    lines++;
  };
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) {
      if (lines === maxLines - 1) {
        draw(`${line}…`);
        line = "";
        break;
      }
      draw(line);
      line = word;
    } else line = test;
  }
  if (line && lines < maxLines) draw(line);
  ctx.textAlign = "left";
  return y;
}

/** Off-white sheet with fibre speckle, darkened edges and the odd stain. */
export function paperBase(ctx, w, h, { color = "#f2ede1", r = Math.random, stains = 0, shade = 0.12 } = {}) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < (w * h) / 60; i++) {
    ctx.fillStyle = `rgba(${r() < 0.5 ? "60,45,20" : "255,255,255"},${0.03 + r() * 0.05})`;
    ctx.fillRect(r() * w, r() * h, 1 + r() * 1.5, 1 + r() * 1.5);
  }

  const edge = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
  edge.addColorStop(0, "rgba(120,90,40,0)");
  edge.addColorStop(1, `rgba(120,90,40,${shade})`);
  ctx.fillStyle = edge;
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < stains; i++) coffeeRing(ctx, w * (0.2 + r() * 0.6), h * (0.2 + r() * 0.6), 30 + r() * 30, r);
}

export function coffeeRing(ctx, x, y, rad, r = Math.random) {
  ctx.save();
  ctx.strokeStyle = "rgba(120,72,25,0.22)";
  for (let i = 0; i < 3; i++) {
    ctx.lineWidth = 1 + r() * 3;
    ctx.beginPath();
    ctx.arc(x + r() * 2, y + r() * 2, rad - i * 1.5, r() * 6, r() * 6 + Math.PI * (1.4 + r() * 0.6));
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(140,90,30,0.05)";
  ctx.beginPath();
  ctx.arc(x, y, rad, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Rubber stamp: outlined, slightly patchy ink. */
export function stamp(ctx, text, x, y, { size = 26, color = INK.red, rot = -0.12, f, r = Math.random } = {}) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.font = font(f, size, 700);
  const tw = ctx.measureText(text).width;
  ctx.globalAlpha = 0.78;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 3;
  ctx.strokeRect(-tw / 2 - 12, -size * 0.85, tw + 24, size * 1.35);
  ctx.textAlign = "center";
  ctx.fillText(text, 0, size * 0.25);
  // patchy ink
  ctx.globalCompositeOperation = "destination-out";
  for (let i = 0; i < 90; i++) {
    ctx.globalAlpha = 0.3 + r() * 0.5;
    ctx.fillRect(-tw / 2 - 14 + r() * (tw + 28), -size + r() * size * 1.6, 1 + r() * 3, 1 + r() * 2);
  }
  ctx.restore();
}

/** Draw an image to fill the box, cropping the overflow. */
export function drawCover(ctx, img, x, y, w, h, { anchorY = 0 } = {}) {
  const s = Math.max(w / img.width, h / img.height);
  const sw = w / s;
  const sh = h / s;
  const sx = (img.width - sw) / 2;
  const sy = (img.height - sh) * anchorY;
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

/** Make a printed photo look printed: slight fade, warm cast, grain. */
export function ageImage(ctx, x, y, w, h, r = Math.random, { fade = 0.12, warm = 0.1 } = {}) {
  ctx.save();
  ctx.fillStyle = `rgba(255,240,210,${fade})`;
  ctx.fillRect(x, y, w, h);
  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = `rgba(255,220,170,${warm})`;
  ctx.fillRect(x, y, w, h);
  ctx.globalCompositeOperation = "source-over";
  for (let i = 0; i < (w * h) / 40; i++) {
    ctx.fillStyle = `rgba(${r() < 0.5 ? "0,0,0" : "255,255,255"},${r() * 0.06})`;
    ctx.fillRect(x + r() * w, y + r() * h, 1.2, 1.2);
  }
  const v = ctx.createRadialGradient(x + w / 2, y + h / 2, Math.min(w, h) * 0.3, x + w / 2, y + h / 2, Math.max(w, h) * 0.7);
  v.addColorStop(0, "rgba(0,0,0,0)");
  v.addColorStop(1, "rgba(0,0,0,0.25)");
  ctx.fillStyle = v;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

/** Small label + value pair in typewriter style (like a form field). */
export function field(ctx, label, value, x, y, w, fonts, { valueSize = 22 } = {}) {
  ctx.fillStyle = "rgba(40,36,30,0.55)";
  ctx.font = font(fonts.display, 12, 500);
  ctx.fillText(label.toUpperCase().split("").join(String.fromCharCode(8202)), x, y);
  ctx.fillStyle = INK.type;
  ctx.font = font(fonts.type, valueSize);
  ctx.fillText(value, x, y + valueSize + 4);
  ctx.strokeStyle = "rgba(40,36,30,0.25)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y + valueSize + 12);
  ctx.lineTo(x + w, y + valueSize + 12);
  ctx.stroke();
  return y + valueSize + 34;
}

/** Hand-drawn wobbly line. */
export function scribbleLine(ctx, x1, y1, x2, y2, r = Math.random, wobble = 1.5) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  const steps = 8;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    ctx.lineTo(x1 + (x2 - x1) * t + (r() - 0.5) * wobble, y1 + (y2 - y1) * t + (r() - 0.5) * wobble);
  }
  ctx.stroke();
}

/** Grey silhouette used when there's no photo on file. */
export function silhouette(ctx, x, y, w, h) {
  ctx.save();
  const g = ctx.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, "#b9b5ab");
  g.addColorStop(1, "#8f8a80");
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = "rgba(40,38,34,0.75)";
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h * 0.4, w * 0.2, h * 0.21, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + w * 0.12, y + h);
  ctx.bezierCurveTo(x + w * 0.15, y + h * 0.7, x + w * 0.32, y + h * 0.63, x + w / 2, y + h * 0.63);
  ctx.bezierCurveTo(x + w * 0.68, y + h * 0.63, x + w * 0.85, y + h * 0.7, x + w * 0.88, y + h);
  ctx.fill();
  ctx.restore();
}

/**
 * Draw a single line of text that should be clickable in the reading view.
 * Uses the current font / fill / textAlign; returns its link region.
 */
export function linkText(ctx, text, x, y, href, { underline = true } = {}) {
  const w = ctx.measureText(text).width;
  const size = parseFloat(/(\d+(\.\d+)?)px/.exec(ctx.font)?.[1] ?? 16);
  const left = ctx.textAlign === "center" ? x - w / 2 : ctx.textAlign === "right" ? x - w : x;
  ctx.fillText(text, x, y);
  if (underline) {
    ctx.save();
    ctx.globalAlpha *= 0.5;
    ctx.fillRect(left, y + size * 0.18, w, Math.max(1, size * 0.06));
    ctx.restore();
  }
  return { x: left - 4, y: y - size, w: w + 8, h: size * 1.45, href };
}

/** "https://example.com/" → "example.com" */
export const bareUrl = (url) => url.replace(/^https?:\/\//, "").replace(/\/$/, "");
