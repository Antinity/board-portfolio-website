import { contact } from "@/data/content";
import { INK, coffeeRing, font, paperBase } from "./common";
import { ICONS, ICON_INK, drawIcon } from "./icons";
import { markerLine, markerStroke, markerText, inkWidth } from "./marker";

/* How to reach him: a torn-off slip with the address in biro, and printed social icon cards. */

const BIRO = "#1b3aa6"; // ballpoint blue

/** A random walk between `lo` and `hi`: the ragged width of a tear. */
function tear(r, n, lo, hi) {
  let v = (lo + hi) / 2;
  return Array.from({ length: n }, () => {
    v = Math.min(hi, Math.max(lo, v + (r() - 0.5) * (hi - lo) * 0.7));
    return v;
  });
}

/**
 * A strip of lined notepad paper, torn off at both ends: ragged edges with
 * a pale fibre rim, a faint fold, a coffee ring, a red margin and ruled
 * lines. The address is written across it in ballpoint, pressing harder in
 * places, with a quick underline; a pencilled envelope and "tap to copy"
 * in the margin.
 */
export const emailslip = {
  alpha: true,
  paint(ctx, { w, h }, { fonts, r }) {
    const steps = Math.ceil(h / 4);
    const left = tear(r, steps + 1, 2, 13);
    const right = tear(r, steps + 1, 2, 13);
    const yAt = (i) => (i * h) / steps;
    const wave = () => (r() - 0.5) * 2.4; // scissors never cut dead straight

    const outline = new Path2D();
    outline.moveTo(left[0], wave());
    for (let x = 60; x < w - 60; x += 60) outline.lineTo(x, wave());
    outline.lineTo(w - right[0], wave());
    for (let i = 1; i <= steps; i++) outline.lineTo(w - right[i], yAt(i));
    for (let x = w - 60; x > 60; x -= 60) outline.lineTo(x, h + wave());
    for (let i = steps; i >= 0; i--) outline.lineTo(left[i], yAt(i));
    outline.closePath();

    ctx.save();
    ctx.clip(outline);
    paperBase(ctx, w, h, { color: "#f0ead9", r, shade: 0.16 });

    // ruled lines and the red margin
    ctx.strokeStyle = "rgba(78,112,182,0.3)";
    ctx.lineWidth = 1.4;
    [0.2, 0.46, 0.72].forEach((f) => {
      ctx.beginPath();
      ctx.moveTo(0, h * f);
      ctx.lineTo(w, h * f + (r() - 0.5) * 2);
      ctx.stroke();
    });
    ctx.strokeStyle = "rgba(196,64,64,0.4)";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(74, 0);
    ctx.lineTo(75, h);
    ctx.stroke();

    // a fold running down the strip
    const fx = w * 0.37;
    const fold = ctx.createLinearGradient(fx - 12, 0, fx + 12, 0);
    fold.addColorStop(0, "rgba(0,0,0,0)");
    fold.addColorStop(0.45, "rgba(60,45,20,0.09)");
    fold.addColorStop(0.55, "rgba(255,255,255,0.22)");
    fold.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = fold;
    ctx.fillRect(fx - 12, 0, 24, h);

    coffeeRing(ctx, w * 0.9, h * 0.6, 44, r);

    // the torn ends show the pale core of the paper
    ctx.strokeStyle = "rgba(255,253,246,0.9)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) (i ? ctx.lineTo : ctx.moveTo).call(ctx, left[i] + 2.5, yAt(i));
    ctx.stroke();
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) (i ? ctx.lineTo : ctx.moveTo).call(ctx, w - right[i] - 2.5, yAt(i));
    ctx.stroke();
    ctx.restore();

    // the address, in biro, sitting on the second ruled line
    const base = h * 0.7;
    const x = 96;
    ctx.font = font(fonts.type, 60);
    const fit = Math.min(60, (60 * (w - x - 40)) / inkWidth(ctx, contact.email));
    ctx.font = font(fonts.type, fit);
    const written = markerText(ctx, contact.email, x, base, { f: fonts.type, size: fit, color: BIRO, r, jitter: 0.9, press: 0.9, dry: 0 });
    markerLine(ctx, x + 4, base + 12, x + written.width * 0.93, base + 10 + (r() - 0.5) * 6, { color: BIRO, r, width: 2.6, bow: 3, taper: 0.1, wobble: 0.7 });

    // pencilled in the margin: a small envelope, and a note to the reader
    const ex = 20;
    const ey = h * 0.4;
    const pencil = { color: INK.pencil, r, width: 2.2, wobble: 0.5, alpha: 0.85 };
    markerStroke(ctx, [[ex, ey], [ex + 36, ey + 1], [ex + 36, ey + 26], [ex + 1, ey + 25], [ex, ey - 1]], { taper: 0.05, ...pencil });
    markerStroke(ctx, [[ex + 1, ey + 1], [ex + 18, ey + 15], [ex + 35, ey + 1]], { taper: 0.1, ...pencil });
    markerText(ctx, "tap to copy", w - 34, h * 0.93, { f: fonts.type, size: 21, color: INK.pencil, r, align: "right", jitter: 1, press: 0.5, dry: 0 });
  },
};

/** A small die-cut card with one network's icon printed in its ink. */
export const social = {
  alpha: true,
  paint(ctx, { w, h, props }, { fonts, r }) {
    const { social: s } = props;
    const inset = 3;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(inset, inset, w - inset * 2, h - inset * 2, w * 0.12);
    ctx.clip();
    paperBase(ctx, w, h, { color: "#efede6", r, shade: 0.12 });
    const iconSize = w * 0.5;
    const top = s.url ? h * 0.14 : (h - iconSize) / 2;
    drawIcon(ctx, ICONS[s.id], (w - iconSize) / 2, top, iconSize, ICON_INK[s.id]);
    if (s.url) {
      ctx.fillStyle = INK.type;
      ctx.font = font(fonts.type, Math.round(w * 0.1));
      ctx.textAlign = "center";
      ctx.fillText(s.handle, w / 2, h * 0.86, w - 16);
      ctx.textAlign = "left";
    }
    ctx.restore();
  },
};
