import { caseFileFor } from "@/data/content";
import { INK, ageImage, bareUrl, drawCover, font, linkText, paperBase, seeded, wrapLines } from "./common";
import { inkWidth, markerLine, markerStroke, markerText } from "./marker";

/*
 * A job, as a ruled index card. On the board you see its front: the
 * screenshot print held at the top edge by a paper clip (the clip is 3D,
 * see Fasteners), the name handwritten, the details written underneath.
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

/** A matte print with a white border and a soft shadow, turned `rot` about its centre. */
function print(ctx, img, x, y, w, h, rot, r) {
  const border = 6;
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(rot);
  ctx.shadowColor = "rgba(30,24,16,0.3)";
  ctx.shadowBlur = 7;
  ctx.shadowOffsetY = 2;
  ctx.fillStyle = "#f8f7f2";
  ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.shadowColor = "transparent";
  drawCover(ctx, img, -w / 2 + border, -h / 2 + border, w - border * 2, h - border * 2);
  ageImage(ctx, -w / 2 + border, -h / 2 + border, w - border * 2, h - border * 2, r, { fade: 0.07, warm: 0.06 });
  ctx.restore();
}

/** Where the screenshot will go: a box sketched in pencil, crossed through, with a note. */
function sketchedFrame(ctx, x, y, w, h, fonts, r) {
  const pen = { color: INK.pencil, r, width: 1.3, taper: 0.04, wobble: 0.5, alpha: 0.7 };
  const j = () => (r() - 0.5) * 3;
  markerStroke(ctx, [[x + j(), y + j()], [x + w + j(), y + j()], [x + w + j(), y + h + j()], [x + j(), y + h + j()], [x + j(), y + 4]], pen);
  markerLine(ctx, x + 6, y + 6, x + w - 6, y + h - 6, { ...pen, width: 0.8, alpha: 0.35, bow: 3 });
  markerLine(ctx, x + w - 6, y + 6, x + 6, y + h - 6, { ...pen, width: 0.8, alpha: 0.35, bow: 3 });
  // the note sits on a patch of clean paper so the cross doesn't run through it
  ctx.font = font(fonts.hand, 17, 600);
  const note = "screenshot to come";
  const nw = ctx.measureText(note).width;
  ctx.fillStyle = STOCK;
  ctx.fillRect(x + w / 2 - nw / 2 - 8, y + h / 2 - 15, nw + 16, 24);
  markerText(ctx, note, x + w / 2, y + h / 2 + 3, { f: fonts.hand, size: 17, weight: 600, color: PENCIL, r, align: "center", jitter: 0.6, press: 0.2, dry: 0 });
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

    if (img) {
      const box = printBox(w);
      print(ctx, img, box.x, 9, box.w, box.h, -0.012, r);
      const size = fit(ctx, work.title, fonts.marker, 25, inner);
      markerText(ctx, work.title, pad, 190, { f: fonts.marker, size, color: INK.black, r, jitter: 0.6, press: 0.5, dry: 0.5 });
      return details(217);
    }

    // no screenshot yet: the name across the top, what it is written on the lines in pen
    const size = fit(ctx, work.title, fonts.marker, 27, inner);
    markerText(ctx, work.title, pad, HEAD - 8, { f: fonts.marker, size, color: INK.black, r, jitter: 0.6, press: 0.5, dry: 0.5 });
    if (!work.summary) return details(HEAD + RULE - 3); // nothing to say yet: the details go straight under the name
    ctx.font = font(fonts.hand, 19, 600);
    wrapLines(ctx, work.summary, inner)
      .slice(0, 6)
      .forEach((line, i) => {
        markerText(ctx, line, pad, HEAD + RULE * (i + 1) - 3, { f: fonts.hand, size: 19, weight: 600, color: INK.blue, r, jitter: 0.5, press: 0.25, dry: 0 });
      });
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
        if (img) {
          print(ctx, img, box.x + 2, top, box.w - 4, box.h - 2, 0.006, r);
          tape(ctx, box.x + 18, top + 2, 46, -0.62, r);
          tape(ctx, box.x + box.w - 18, top + 2, 46, 0.6, r);
        } else {
          sketchedFrame(ctx, box.x + 4, top + 2, box.w - 8, box.h - 6, fonts, r);
        }

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
          if (href) links.push(linkText(ctx, value, pad + labelW, y, href));
          else ctx.fillText(value, pad + labelW, y, inner - labelW);
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
