import { contact } from "@/data/content";
import { INK, font } from "./common";
import { ICONS, ICON_PEN, drawIconPen } from "./icons";
import { inkWidth, markerLine, markerText } from "./marker";

/* How to reach him, written and drawn on the board with a marker. */

/**
 * The email address, written large in marker with an envelope drawn beside
 * it (centred on the lettering), an underline, and "click to copy" small
 * underneath. Clicking it copies the address.
 */
export const emailslip = {
  alpha: true,
  paint(ctx, { w, h }, { fonts, r }) {
    const base = h * 0.6;
    const left = 112; // lettering starts after the envelope
    ctx.font = font(fonts.type, 80);
    const size = Math.min(80, (80 * (w - left - 16)) / inkWidth(ctx, contact.email));
    const written = markerText(ctx, contact.email, left, base, { f: fonts.type, size, color: INK.black, r, jitter: 0.9, press: 1.1 });

    // the envelope sits on the middle of the lowercase letters
    const icon = Math.min(72, h * 0.5);
    drawIconPen(ctx, ICONS.email, 12, base - size * 0.3 - icon / 2, icon, { color: ICON_PEN.email, r, width: 3.6 });

    markerLine(ctx, left - 2, base + 14, left + written.width * 0.96, base + 12 + (r() - 0.5) * 6, { color: INK.black, r, width: 4, bow: 4, taper: 0.08, wobble: 0.9 });
    markerText(ctx, "click to copy", left + written.width, h - 8, { f: fonts.type, size: 26, color: INK.blue, r, align: "right", jitter: 1, press: 0.8 });
  },
};

/** One network's logo, traced on the board with a marker; no caption. */
export const social = {
  alpha: true,
  paint(ctx, { w, h, props }, { r }) {
    const { social: s } = props;
    const size = Math.min(w, h) * 0.84;
    drawIconPen(ctx, ICONS[s.id], (w - size) / 2, (h - size) / 2, size, { color: ICON_PEN[s.id], r, width: size * 0.034 });
  },
};
