import { subject } from "@/data/content";
import { todoLineY } from "@/data/boardLayout";
import { INK, coffeeRing, field, font, linkText, paperBase, scribbleLine, silhouette, stamp, wrapText } from "./common";

/* Typed and handwritten paper documents. */

/**
 * "Profile of the suspect": the about page, as a typed police profile form
 * with an investigator's marker note at the foot.
 */
export const profile = {
  paint(ctx, { w, h }, { fonts, r }) {
    paperBase(ctx, w, h, { color: "#eeebe3", r, shade: 0.14 });
    coffeeRing(ctx, w * 0.82, h * 0.9, 38, r);
    const pad = 34;
    const inner = w - pad * 2;

    ctx.fillStyle = INK.type;
    ctx.font = font(fonts.display, 34, 600);
    ctx.fillText("Profile of the suspect", pad, 64);
    ctx.fillRect(pad, 80, inner, 2.5);
    ctx.fillRect(pad, 86, inner, 1);

    const half = (inner - 24) / 2;
    let y = 118;
    field(ctx, "Name", subject.name, pad, y, half, fonts, { valueSize: 20 });
    y = field(ctx, "Known as", subject.alias, pad + half + 24, y, half, fonts, { valueSize: 20 });
    field(ctx, "Origin", subject.origin, pad, y, half, fonts, { valueSize: 20 });
    y = field(ctx, "Active since", String(subject.activeSince), pad + half + 24, y, half, fonts, { valueSize: 20 });
    y = field(ctx, "Occupation", subject.role, pad, y, inner, fonts, { valueSize: 20 });

    const section = (label, text, maxLines) => {
      y += 10;
      ctx.fillStyle = "rgba(40,36,30,0.6)";
      ctx.font = font(fonts.type, 12);
      ctx.fillText(label, pad, y);
      ctx.fillStyle = INK.type;
      ctx.font = font(fonts.type, 14.5);
      y = wrapText(ctx, text, pad, y + 22, inner, 20, { maxLines }) + 4;
    };
    section("Description", `${subject.bio[0]} ${subject.bio[1]}`, 9);
    section("Known habits", subject.bio[2], 5);

    // investigator's note in red marker
    ctx.fillStyle = INK.red;
    ctx.font = font(fonts.marker, 21);
    const quote = `“${subject.headline.join(" ")}”`;
    const noteY = Math.min(y + 34, h - 46);
    wrapText(ctx, quote, pad, noteY, inner - 40, 26, { maxLines: 2 });
    ctx.strokeStyle = INK.red;
    ctx.lineWidth = 2;
    scribbleLine(ctx, pad, noteY + 34, pad + inner * 0.62, noteY + 31, r, 2.5);
  },
};

export const todo = {
  paint(ctx, { w, h, props }, { fonts, r }) {
    paperBase(ctx, w, h, { color: "#f0eee6", r, shade: 0.12 });
    // ruled lines + margin
    ctx.strokeStyle = "rgba(70,110,180,0.25)";
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 11; i++) {
      const y = h * (todoLineY(i) + 0.03);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(200,60,60,0.45)";
    ctx.beginPath();
    ctx.moveTo(w * 0.13, 0);
    ctx.lineTo(w * 0.13, h);
    ctx.stroke();

    ctx.fillStyle = INK.black;
    ctx.font = font(fonts.marker, 44);
    ctx.fillText("To do", w * 0.17, h * 0.14);

    const links = [];
    props.items.forEach((op, i) => {
      const y = h * todoLineY(i);
      const bx = w * 0.055;
      const bs = 24;
      ctx.strokeStyle = INK.black;
      ctx.lineWidth = 2;
      ctx.strokeRect(bx, y - bs / 2, bs, bs);
      ctx.fillStyle = INK.black;
      ctx.font = font(fonts.hand, 38, 600);
      links.push(linkText(ctx, op.title, w * 0.17, y + 11, op.url, { underline: false }));
      if (op.done) {
        const tw = ctx.measureText(op.title).width;
        ctx.strokeStyle = INK.blue;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(bx + 4, y);
        ctx.lineTo(bx + 11, y + 9);
        ctx.lineTo(bx + bs + 6, y - 16);
        ctx.stroke();
        ctx.lineWidth = 2;
        scribbleLine(ctx, w * 0.16, y, w * 0.17 + tw + 6, y - 2, r, 2);
      }
    });
    return links;
  },
};

export const crew = {
  paint(ctx, { w, h, props }, { fonts, r }) {
    const { witness } = props;
    paperBase(ctx, w, h, { color: "#eeebe4", r, shade: 0.12 });
    const pad = 20;
    const size = w < 280 ? 15 : 17;

    ctx.fillStyle = INK.black;
    ctx.font = font(fonts.display, 17, 600);
    ctx.fillText("Witness statement", pad, pad + 20);
    ctx.fillRect(pad, pad + 30, w - pad * 2, 1.5);

    const photoW = 84;
    const photoX = w - pad - photoW;
    silhouette(ctx, photoX, pad + 46, photoW, 100);
    ctx.fillStyle = "rgba(30,30,30,0.55)";
    ctx.font = font(fonts.type, 9);
    ctx.fillText("No photo on file", photoX, pad + 160);

    let y = pad + 60;
    const fw = photoX - pad - 14;
    y = field(ctx, "Name", witness.name, pad, y, fw, fonts, { valueSize: size });
    y = field(ctx, "Role", witness.role, pad, y, fw, fonts, { valueSize: size });
    y = field(ctx, "Organisation", witness.org, pad, y, fw, fonts, { valueSize: size });

    y += 6;
    ctx.fillStyle = "rgba(40,36,30,0.6)";
    ctx.font = font(fonts.type, 12);
    ctx.fillText("Statement", pad, y);
    ctx.fillStyle = INK.type;
    ctx.font = font(fonts.type, 12.5);
    const lineH = 16;
    const maxLines = Math.max(2, Math.floor((h - 70 - (y + 18)) / lineH));
    wrapText(ctx, `"${witness.statement}"`, pad, y + 18, w - pad * 2, lineH, { maxLines });

    stamp(ctx, "RECOMMENDS", w / 2, h - 28, { f: fonts.display, size: 17, rot: -0.06, color: INK.blue, r });
  },
};
