import { subject, witnesses } from "@/data/content";
import { makeCanvas } from "../textures/procedural";
import { INK, coffeeRing, font, paperBase, wrapLines, wrapText } from "./common";
import { markerLine, markerStroke, markerText } from "./marker";

/* Paper documents and writing on the board. */

const MAX_SCALE = 1.9;

/**
 * "About me": a typed profile form. The text is set as large as the sheet
 * allows, so the page is filled rather than leaving a blank foot.
 */
export const profile = {
  paint(ctx, { w, h }, { fonts, r }) {
    paperBase(ctx, w, h, { color: "#eeebe3", r, shade: 0.14 });
    coffeeRing(ctx, w * 0.84, h * 0.93, 38, r);
    const pad = 34;
    const inner = w - pad * 2;
    const half = (inner - 24) / 2;

    const fields = [
      ["Name", subject.name, pad, half],
      ["Known as", subject.alias, pad + half + 24, half],
      ["Origin", subject.origin, pad, half],
      ["Active since", String(subject.activeSince), pad + half + 24, half],
      ["Occupation", subject.role, pad, inner],
    ];
    const description = `${subject.bio[0]} ${subject.bio[1]}`;

    /** Lay the whole page out at scale `s` on `c`; returns the y it ends at. */
    const layout = (c, s) => {
      c.textAlign = "left";
      c.fillStyle = INK.type;
      c.font = font(fonts.display, 46, 600);
      c.fillText("About me", pad, 66);
      c.fillRect(pad, 82, inner, 2.5);
      c.fillRect(pad, 88, inner, 1);

      let y = 124;
      const row = [];
      const flush = () => {
        if (row.length) y = Math.max(...row);
        row.length = 0;
      };
      fields.forEach(([label, value, x, wd], i) => {
        const ls = 13 * s;
        const vs = 21 * s;
        c.fillStyle = "rgba(40,36,30,0.62)";
        c.font = font(fonts.type, ls);
        c.fillText(label, x, y);
        c.fillStyle = INK.type;
        c.font = font(fonts.type, vs);
        c.fillText(value, x, y + vs + 3);
        c.strokeStyle = "rgba(40,36,30,0.25)";
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(x, y + vs + 11);
        c.lineTo(x + wd, y + vs + 11);
        c.stroke();
        row.push(y + vs + 30 * s);
        if (wd === inner || i % 2 === 1) flush();
      });

      const section = (label, text) => {
        y += 8 * s;
        c.fillStyle = "rgba(40,36,30,0.62)";
        c.font = font(fonts.type, 13 * s);
        c.fillText(label, pad, y);
        c.fillStyle = INK.type;
        c.font = font(fonts.type, 15.5 * s);
        y = wrapText(c, text, pad, y + 24 * s, inner, 22 * s) + 6 * s;
      };
      section("Description", description);
      section("Known habits", subject.bio[2]);
      return y;
    };

    // the biggest scale at which every value still fits its column and the page its sheet
    const probe = makeCanvas(8, 8).getContext("2d");
    probe.font = font(fonts.type, 21);
    let s = MAX_SCALE;
    for (const [, value, , wd] of fields) s = Math.min(s, wd / probe.measureText(value).width);
    s = Math.max(1, s);
    while (s > 1 && layout(probe, s) > h - pad * 0.8) s -= 0.02;
    layout(ctx, s);
  },
};

/**
 * The to-do list, written on the board itself: a marker box for each job,
 * ticked and struck through where it has shipped. Each name opens its site.
 */
export const todo = {
  alpha: true,
  paint(ctx, { w, h, props }, { fonts, r }) {
    const size = 50;
    const pitch = Math.min(104, (h - 40) / props.items.length);
    const links = [];

    props.items.forEach((op, i) => {
      const y = 78 + i * pitch;
      const bx = 10;
      const bs = 44;
      const by = y - bs * 0.82;
      const j = () => (r() - 0.5) * 4;

      // the box: four corners in one loop of the pen, never quite closing
      markerStroke(
        ctx,
        [
          [bx + j(), by + j()],
          [bx + bs + j(), by + j()],
          [bx + bs + j(), by + bs + j()],
          [bx + j(), by + bs + j()],
          [bx + j() * 0.5, by + 3],
          [bx + 9, by + j()],
        ],
        { color: INK.black, r, width: 4.4, taper: 0.06, wobble: 0.7 }
      );

      ctx.font = font(fonts.type, size);
      const tx = 92;
      const text = markerText(ctx, op.title, tx, y, { f: fonts.type, size, color: INK.black, r, jitter: 1, press: 1.1 });

      if (op.done) {
        // shipped: struck through, and a big blue tick across the box
        markerLine(ctx, tx - 6, y - size * 0.3, tx + text.width + 8, y - size * 0.34 + (r() - 0.5) * 6, { color: INK.black, r, width: 3.2, bow: 3, taper: 0.1 });
        markerStroke(
          ctx,
          [
            [bx + 5, by + bs * 0.55],
            [bx + bs * 0.38, by + bs + 4],
            [bx + bs + 14, by - 20],
          ],
          { color: INK.blue, r, width: 7, taper: 0.2, wobble: 0.5 }
        );
      }
      if (op.url) links.push({ x: tx - 8, y: y - size, w: text.width + 16, h: size * 1.4, href: op.url });
    });
    return links;
  },
};

/**
 * What a client said: a plain card. A red marker quote mark, their words,
 * and their name and company underneath. No form, no stamp.
 */
export const crew = {
  paint(ctx, { w, h, props }, { fonts, r }) {
    const { witness } = props;
    paperBase(ctx, w, h, { color: "#f1eee6", r, shade: 0.1 });
    const pad = 24;
    const inner = w - pad * 2;

    markerText(ctx, "“", pad - 2, 62, { f: fonts.marker, size: 68, color: INK.red, r, jitter: 0.5, dry: 0 });

    // every card sets its quote at the same size: the largest at which the longest still fits
    const top = 66;
    const bottom = h - 64;
    let size = 20;
    for (; size >= 11.5; size -= 0.5) {
      ctx.font = font(fonts.type, size);
      if (witnesses.every((o) => wrapLines(ctx, o.statement, inner).length * size * 1.32 <= bottom - top)) break;
    }
    ctx.fillStyle = INK.type;
    ctx.font = font(fonts.type, size);
    const lines = wrapLines(ctx, witness.statement, inner);
    lines.forEach((line, i) => ctx.fillText(line, pad, top + size + i * size * 1.32));

    ctx.fillStyle = INK.black;
    ctx.font = font(fonts.display, 19, 600);
    ctx.fillText(witness.name, pad, h - 38);
    ctx.fillStyle = "rgba(72,58,38,0.78)";
    ctx.font = font(fonts.type, 13.5);
    ctx.fillText(`${witness.role}, ${witness.org}`, pad, h - 18, inner);
  },
};
