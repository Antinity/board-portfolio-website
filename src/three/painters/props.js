import { INK, font, wrapLines } from "./common";
import { markerLine, markerStar, markerText, inkWidth } from "./marker";

/* Things written straight onto the whiteboard, and sticky notes. */

/**
 * A section heading in marker on the board itself: the words centred in
 * capitals, a hand-drawn star at each end and a long line underneath.
 * Nothing is stuck on; it is all ink.
 */
export const label = {
  alpha: true,
  paint(ctx, { w, h, props }, { fonts, r }) {
    const text = props.text.toUpperCase();
    const size = 44;
    const base = h * 0.6;
    const pen = { color: INK.black, r };

    ctx.font = font(fonts.type, size);
    const tw = inkWidth(ctx, text);
    markerText(ctx, text, w / 2, base, { f: fonts.type, size, align: "center", jitter: 1.1, press: 1.2, ...pen });

    const gap = 38;
    const sy = base - size * 0.34;
    markerStar(ctx, w / 2 - tw / 2 - gap, sy, 15, { width: 4.4, ...pen });
    markerStar(ctx, w / 2 + tw / 2 + gap, sy, 15, { width: 4.4, ...pen });

    // the underline: one long pull of the pen, then a short second pass
    const y = base + 22;
    markerLine(ctx, w * 0.035, y + (r() - 0.5) * 4, w * 0.965, y + (r() - 0.5) * 6, { width: 5.2, bow: 4, taper: 0.07, wobble: 1, ...pen });
    const from = w * (0.55 + r() * 0.15);
    markerLine(ctx, from, y + 6, from + w * 0.2, y + 5 + (r() - 0.5) * 3, { width: 3, bow: 2, taper: 0.3, wobble: 0.8, alpha: 0.9, ...pen });
  },
};

export const NOTE_COLORS = {
  yellow: "#f2d95c",
  pink: "#f3a0b8",
  green: "#b8e08a",
  blue: "#9fd0ef",
};

export const sticky = {
  paint(ctx, { w, h, props }, { fonts }) {
    const base = NOTE_COLORS[props.color] ?? props.color;
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "rgba(0,0,0,0.12)");
    g.addColorStop(0.18, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(0,0,0,0.06)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = INK.black;
    const lines = props.text.split("\n");
    const size = props.small ? Math.min(30, (w * 1.4) / Math.max(...lines.map((l) => l.length), 4)) : 38;
    ctx.font = font(fonts.marker, size);
    ctx.textAlign = "center";
    const top = h / 2 - ((lines.length - 1) * size * 1.15) / 2 + size * 0.35;
    lines.forEach((line, i) => ctx.fillText(line, w / 2, top + i * size * 1.15));
    ctx.textAlign = "left";
  },
};

/**
 * One group of skills, written on the board: its name in marker with a
 * quick underline, then the list in blue, running on and wrapping like
 * someone writing it out.
 */
export const tag = {
  alpha: true,
  paint(ctx, { w, h, props }, { fonts, r }) {
    const { group } = props;
    const title = 40;
    const body = 31;
    const x = 8;

    ctx.font = font(fonts.marker, title);
    const tw = inkWidth(ctx, group.group);
    markerText(ctx, group.group, x, 46, { f: fonts.marker, size: title, color: INK.black, r, jitter: 0.9 });
    markerLine(ctx, x - 2, 60, x + tw + 14, 59 + (r() - 0.5) * 5, { color: INK.black, r, width: 4, bow: 3, taper: 0.1 });

    ctx.font = font(fonts.type, body);
    const lines = wrapLines(ctx, group.items.join(", "), w - x * 2);
    const room = Math.max(1, Math.floor((h - 70) / (body * 1.3)));
    lines.slice(0, room).forEach((line, i) => {
      markerText(ctx, line, x, 104 + i * body * 1.3, { f: fonts.type, size: body, color: INK.blue, r, jitter: 1 });
    });
  },
};
