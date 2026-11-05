import * as THREE from "three";
import { caseFileFor } from "@/data/content";
import { makeCanvas, rng } from "../textures/procedural";
import { INK, ageImage, bareUrl, drawCover, font, linkText, paperBase, seeded, wrapLines } from "./common";
import { inkWidth, markerLine, markerText, sketchedPlaceholder } from "./marker";

/*
 * A job, as a ruled index card. On the board you see its front: the
 * screenshot print held at the top edge by a paper clip (the clip is 3D,
 * see Fasteners; a blank print marked "photo to come" until a screenshot
 * is added), the name handwritten, the details written underneath.
 * Picked up, the card opens like a book: the inside of the cover on the
 * left (screenshot, name, facts), the write-up on the right (story, tools,
 * timeline). The inside pages are only painted while the card is open.
 */

const STOCK = "#f6f4ee";
const RULE = 18; // blue rule pitch
const HEAD = 58; // the red rule across the top of the front (the magnet sits above it)
const BLUE_RULE = "rgba(64,104,178,0.3)";
const RED_RULE = "rgba(196,66,66,0.55)";
const PENCIL = "rgba(62,58,52,0.62)";
const MUTED = "rgba(38,35,30,0.72)";
const PRINT_RATIO = 0.5625; // screenshots are 16:9

/** Index-card stock with its printed rules; returns the y of each blue rule. */
function card(ctx, w, h, r, { header = true, first = HEAD + RULE } = {}) {
  paperBase(ctx, w, h, { color: STOCK, r, shade: 0.06 });
  const rules = [];
  ctx.save();
  for (let y = first; y < h - 8; y += RULE) {
    rules.push(y);
    ctx.strokeStyle = BLUE_RULE;
    ctx.globalAlpha = 0.75 + r() * 0.25; // printed rules are never perfectly even
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  if (header) {
    ctx.globalAlpha = 1;
    ctx.strokeStyle = RED_RULE;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(0, HEAD);
    ctx.lineTo(w, HEAD);
    ctx.stroke();
  }
  ctx.restore();
  return rules;
}

const PRINT_PAPER = "#f8f7f2";
const PRINT_BLANK = "#ecebe5";

/**
 * A matte print with a white border and a soft shadow, turned `rot` about
 * its centre. With no screenshot yet, the print is blank and marked in
 * pencil for the photo to come.
 */
function print(ctx, img, x, y, w, h, rot, r, fonts) {
  const border = 6;
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(rot);
  ctx.shadowColor = "rgba(30,24,16,0.3)";
  ctx.shadowBlur = 7;
  ctx.shadowOffsetY = 2;
  ctx.fillStyle = PRINT_PAPER;
  ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.shadowColor = "transparent";
  const [ix, iy, iw, ih] = [-w / 2 + border, -h / 2 + border, w - border * 2, h - border * 2];
  if (img) {
    drawCover(ctx, img, ix, iy, iw, ih);
    ageImage(ctx, ix, iy, iw, ih, r, { fade: 0.07, warm: 0.06 });
  } else {
    ctx.fillStyle = PRINT_BLANK;
    ctx.fillRect(ix, iy, iw, ih);
    sketchedPlaceholder(ctx, ix + 8, iy + 8, iw - 16, ih - 16, { f: fonts.hand, r, note: "photo to come", ground: PRINT_BLANK });
  }
  ctx.restore();
}

/** A strip of masking tape laid across a corner. */
function tape(ctx, cx, cy, w, rot, r) {
  const h = w * 0.34;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  ctx.beginPath();
  ctx.moveTo(-w / 2, -h / 2);
  for (let x = -w / 2; x <= w / 2; x += 4) ctx.lineTo(x, -h / 2 + r() * 1.4);
  for (let y = -h / 2; y <= h / 2; y += 3) ctx.lineTo(w / 2 - r() * 2.4, y);
  for (let x = w / 2; x >= -w / 2; x -= 4) ctx.lineTo(x, h / 2 - r() * 1.4);
  for (let y = h / 2; y >= -h / 2; y -= 3) ctx.lineTo(-w / 2 + r() * 2.4, y);
  ctx.closePath();
  ctx.shadowColor = "rgba(30,24,16,0.12)";
  ctx.shadowBlur = 2;
  ctx.fillStyle = "rgba(232,222,192,0.74)";
  ctx.fill();
  ctx.restore();
}

/**
 * The "open in a new tab" mark: a box with an arrow leaving its top-right
 * corner, drawn in the link's ink. (x, y) is its top-left; `size` its width.
 */
function openIcon(ctx, x, y, size, color) {
  const s = size;
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(0.9, s * 0.12);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(s * 0.44, s * 0.22);
  ctx.lineTo(s * 0.06, s * 0.22);
  ctx.lineTo(s * 0.06, s * 0.94);
  ctx.lineTo(s * 0.78, s * 0.94);
  ctx.lineTo(s * 0.78, s * 0.56);
  ctx.moveTo(s * 0.4, s * 0.6);
  ctx.lineTo(s * 0.94, s * 0.06);
  ctx.moveTo(s * 0.58, s * 0.06);
  ctx.lineTo(s * 0.94, s * 0.06);
  ctx.lineTo(s * 0.94, s * 0.42);
  ctx.stroke();
  ctx.restore();
}

/** The largest size, up to `max`, at which `text` set in `f` fits `width`. */
function fit(ctx, text, f, max, width, weight = 400) {
  ctx.font = font(f, max, weight);
  return Math.min(max, (max * width) / inkWidth(ctx, text));
}

const printBox = (w) => {
  const pw = w - 24;
  return { x: 12, w: pw, h: Math.round((pw - 12) * PRINT_RATIO) + 12 };
};

/** The front of the card, as it hangs on the board. */
export const casecard = {
  images: ({ props }) => (props.work.image ? [props.work.image] : []),
  paint(ctx, { w, h, props }, { fonts, r, images }) {
    const { work } = props;
    const img = work.image && images[work.image];
    const pad = 16;
    const inner = w - pad * 2;
    card(ctx, w, h, r);

    // the details: services, place and year, and the site, one to a rule
    const details = (y) => {
      ctx.textAlign = "left";
      ctx.fillStyle = INK.type;
      ctx.font = font(fonts.type, 12.5);
      ctx.fillText(work.services, pad, y, inner);
      ctx.fillStyle = MUTED;
      ctx.fillText(`${work.location}, ${work.year}`, pad, y + RULE, inner);
      if (!work.url) return [];
      ctx.fillStyle = INK.blue;
      return [linkText(ctx, bareUrl(work.url), pad, y + RULE * 2, work.url)];
    };

    // every job leads with its screenshot, clipped to the card (a blank print until there is one)
    const box = printBox(w);
    print(ctx, img, box.x, 9, box.w, box.h, -0.012, r, fonts);
    const size = fit(ctx, work.title, fonts.marker, 25, inner);
    markerText(ctx, work.title, pad, 190, { f: fonts.marker, size, color: INK.black, r, jitter: 0.6, press: 0.5, dry: 0.5 });
    return details(217);
  },

  /** The two inside pages, seen once the card is opened. */
  pages: {
    /** Inside the cover: the screenshot taped in, the name, and the facts. */
    left: {
      images: ({ props }) => (props.work.image ? [props.work.image] : []),
      paint(ctx, { w, h, props }, { fonts, r, images }) {
        const { work } = props;
        const img = work.image && images[work.image];
        const pad = 16;
        const inner = w - pad * 2;
        card(ctx, w, h, r, { header: false, first: 1000 }); // plain inside

        const box = printBox(w);
        const top = 16;
        print(ctx, img, box.x + 2, top, box.w - 4, box.h - 2, 0.006, r, fonts);
        tape(ctx, box.x + 18, top + 2, 46, -0.62, r);
        tape(ctx, box.x + box.w - 18, top + 2, 46, 0.6, r);

        const tb = top + box.h + 36;
        const size = fit(ctx, work.title, fonts.marker, 26, inner);
        const written = markerText(ctx, work.title, pad, tb, { f: fonts.marker, size, color: INK.black, r, jitter: 0.6, press: 0.5, dry: 0.4 });
        markerLine(ctx, pad - 2, tb + 8, pad + written.width + 4, tb + 7 + (r() - 0.5) * 3, { color: INK.red, r, width: 2.2, bow: 2, taper: 0.1, wobble: 0.5 });

        // the facts: a pencilled label, then the value
        const rows = [
          ["Where", work.location],
          ["When", String(work.year)],
          ["What", work.services],
        ];
        const labelW = 44;
        let y = tb + 30;
        const links = [];
        const row = (label, value, href) => {
          markerText(ctx, label, pad, y, { f: fonts.hand, size: 14, weight: 600, color: PENCIL, r, jitter: 0.4, press: 0.2, dry: 0 });
          ctx.textAlign = "left";
          ctx.font = font(fonts.type, 11.5);
          ctx.fillStyle = href ? INK.blue : INK.type;
          if (href) {
            // the link, then the mark that says it opens in a new tab; both are one click target
            const link = linkText(ctx, value, pad + labelW, y, href);
            const icon = 9;
            openIcon(ctx, link.x + link.w + 1, y - icon * 0.95, icon, INK.blue);
            link.w += icon + 5;
            links.push(link);
          } else ctx.fillText(value, pad + labelW, y, inner - labelW);
          y += 16;
        };
        rows.forEach(([label, value]) => row(label, value));
        if (work.url) row("Visit", bareUrl(work.url), work.url);
        return links;
      },
    },

    /** The write-up: the story, the tools, and how long it took. */
    right: {
      paint(ctx, { w, h, props }, { fonts, r }) {
        const { work } = props;
        const file = caseFileFor(work);
        const pad = 16;
        const inner = w - pad * 2;
        card(ctx, w, h, r, { header: false, first: 1000 });

        const heading = (c, text, y, s, draw) => {
          if (draw) markerText(c, text, pad, y, { f: fonts.marker, size: 13 * s, color: INK.red, r: seeded(`${work.id}-${text}`), jitter: 0.5, press: 0.4, dry: 0 });
          return y + 8 * s;
        };

        /** Lay the page out at scale `s` on `c`; returns the y it ends at. */
        const layout = (c, s, draw) => {
          let y = pad + 13 * s;
          y = heading(c, "The story", y, s, draw);

          if (work.summary) {
            c.font = font(fonts.hand, 15 * s, 600);
            for (const line of wrapLines(c, work.summary, inner)) {
              y += 15 * s;
              if (draw) markerText(c, line, pad, y, { f: fonts.hand, size: 15 * s, weight: 600, color: INK.blue, r, jitter: 0.4, press: 0.2, dry: 0 });
            }
            y += 6 * s;
          }

          c.font = font(fonts.type, 9.6 * s);
          c.fillStyle = INK.type;
          c.textAlign = "left";
          for (const para of file.story) {
            for (const line of wrapLines(c, para, inner)) {
              y += 12.8 * s;
              if (draw) c.fillText(line, pad, y);
            }
            y += 5 * s;
          }

          y = heading(c, "Tools", y + 14 * s, s, draw);
          c.font = font(fonts.type, 10 * s);
          let x = pad;
          y += 12 * s;
          file.tools.forEach((tool, i) => {
            const tw = c.measureText(tool).width;
            const slash = i ? 14 * s : 0;
            if (x + slash + tw > pad + inner) {
              x = pad;
              y += 14 * s;
            } else x += slash;
            if (draw) {
              if (x > pad) markerLine(c, x - 9 * s, y + 1, x - 5 * s, y - 9 * s, { color: INK.red, r, width: 1.1, bow: 0.4, taper: 0.2, wobble: 0.2 });
              c.fillStyle = INK.type;
              c.fillText(tool, x, y);
            }
            x += tw;
          });

          y = heading(c, "Timeline", y + 20 * s, s, draw);
          // a line drawn in pen with a tick for each stage: the stage above, when below
          const lineY = y + 22 * s;
          const n = file.timeline.length;
          const step = inner / n;
          if (draw) markerLine(c, pad, lineY, pad + inner, lineY + (r() - 0.5) * 2, { color: INK.black, r, width: 1.6, bow: 1.5, taper: 0.05, wobble: 0.4 });
          file.timeline.forEach(([stage, when], i) => {
            const tx = pad + step * i + 3;
            if (!draw) return;
            markerLine(c, tx, lineY - 4 * s, tx + (r() - 0.5), lineY + 4 * s, { color: INK.black, r, width: 1.4, bow: 0.2, taper: 0.2, wobble: 0.2 });
            markerText(c, stage, tx, lineY - 7 * s, { f: fonts.hand, size: 14 * s, weight: 600, color: INK.blue, r, jitter: 0.4, press: 0.2, dry: 0 });
            c.fillStyle = MUTED;
            c.font = font(fonts.type, 8.4 * s);
            c.textAlign = "left";
            c.fillText(when, tx, lineY + 15 * s, step - 6);
          });
          return lineY + 17 * s;
        };

        // set as large as the page allows
        let s = 1.15;
        while (s > 0.7 && layout(ctx, s, false) > h - 12) s -= 0.01;
        layout(ctx, s, true);
        return [];
      },
    },
  },
};

let stock = null;
/** Plain index-card stock with no rules: the back of a leaf. One texture shared by every card. */
export function blankStockTexture() {
  if (stock) return stock;
  const w = 270;
  const h = 296;
  const canvas = makeCanvas(w * 2, h * 2);
  const ctx = canvas.getContext("2d");
  ctx.scale(2, 2);
  paperBase(ctx, w, h, { color: STOCK, r: rng(91), shade: 0.06 });
  stock = new THREE.CanvasTexture(canvas);
  stock.colorSpace = THREE.SRGBColorSpace;
  return stock;
}
