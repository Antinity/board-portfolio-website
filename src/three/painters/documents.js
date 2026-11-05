import { subject } from "@/data/content";
import { todoLineY } from "@/data/boardLayout";
import { INK, bareUrl, coffeeRing, field, font, linkText, paperBase, scribbleLine, silhouette, stamp, wrapText } from "./common";

/* Typed and handwritten paper documents. */

export const dossier = {
  /** Landscape fact sheet under the poster: the record, typed. */
  paint(ctx, { w, h }, { fonts, r }) {
    paperBase(ctx, w, h, { color: "#efe9da", r });
    coffeeRing(ctx, w * 0.9, h * 0.72, 34, r);
    const pad = 28;

    ctx.fillStyle = INK.type;
    ctx.font = font(fonts.display, 24, 700);
    ctx.fillText("SUBJECT FILE", pad, 46);
    ctx.font = font(fonts.type, 13);
    ctx.fillText(`REF. ${subject.alias.toUpperCase()}-${subject.activeSince}`, pad + 170, 45);
    ctx.fillRect(pad, 58, w - pad * 2, 2);

    const cols = 3;
    const cw = (w - pad * 2 - (cols - 1) * 26) / cols;
    const rows = [
      ["Name", subject.name],
      ["Alias", subject.alias],
      ["Age", String(subject.age)],
      ["Origin", subject.origin],
      ["Timezone", "IST +5:30"],
      ["Active since", String(subject.activeSince)],
    ];
    rows.forEach(([k, v], i) => {
      const x = pad + (i % cols) * (cw + 26);
      const y = 84 + Math.floor(i / cols) * 58;
      field(ctx, k, v, x, y, cw, fonts, { valueSize: 19 });
    });
    field(ctx, "Occupation", subject.role, pad, 84 + 2 * 58, w - pad * 2 - 160, fonts, { valueSize: 19 });

    stamp(ctx, "CLASSIFIED", w - 112, 40, { f: fonts.display, size: 20, rot: 0.12, r });
  },
};

export const todo = {
  paint(ctx, { w, h, props }, { fonts, r }) {
    paperBase(ctx, w, h, { color: "#f4f1e8", r, shade: 0.08 });
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
    ctx.fillText("TO DO", w * 0.17, h * 0.14);
    ctx.font = font(fonts.hand, 22);
    ctx.fillStyle = INK.pencil;
    ctx.fillText("shipped ✓   /   building", w * 0.52, h * 0.13);

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
    paperBase(ctx, w, h, { color: "#f1eee6", r, shade: 0.08 });
    const pad = 20;

    // header like an ID sheet
    ctx.fillStyle = INK.black;
    ctx.beginPath();
    ctx.arc(pad + 15, pad + 15, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f1eee6";
    ctx.font = font(fonts.display, 13, 700);
    ctx.textAlign = "center";
    ctx.fillText(witness.name[0], pad + 15, pad + 20);
    ctx.textAlign = "left";
    ctx.fillStyle = INK.black;
    ctx.font = font(fonts.display, 12, 600);
    ctx.fillText("WITNESS STATEMENT", pad + 38, pad + 20);

    const photoW = 84;
    const photoX = w - pad - photoW;
    silhouette(ctx, photoX, pad + 44, photoW, 100);
    ctx.fillStyle = "rgba(30,30,30,0.55)";
    ctx.font = font(fonts.type, 8);
    ctx.fillText("NO PHOTO ON FILE", photoX + 2, pad + 156);

    let y = pad + 56;
    const fw = photoX - pad - 14;
    y = field(ctx, "Name", witness.name, pad, y, fw, fonts, { valueSize: w < 280 ? 15 : 17 });
    y = field(ctx, "Role", witness.role, pad, y, fw, fonts, { valueSize: w < 280 ? 15 : 17 });
    y = field(ctx, "Organisation", witness.org, pad, y, fw, fonts, { valueSize: w < 280 ? 15 : 17 });

    y += 6;
    ctx.fillStyle = "rgba(40,36,30,0.55)";
    ctx.font = font(fonts.display, 11, 500);
    ctx.fillText("STATEMENT", pad, y);
    ctx.fillStyle = INK.type;
    ctx.font = font(fonts.type, 12.5);
    const lineH = 16;
    const maxLines = Math.max(2, Math.floor((h - 70 - (y + 18)) / lineH));
    wrapText(ctx, `"${witness.statement}"`, pad, y + 18, w - pad * 2, lineH, { maxLines });

    stamp(ctx, "RECOMMENDS", w / 2, h - 28, { f: fonts.display, size: 17, rot: -0.06, color: INK.blue, r });
  },
};

export const indexcard = {
  paint(ctx, { w, h, props }, { fonts, r }) {
    const { job } = props;
    paperBase(ctx, w, h, { color: "#fbf9f2", r, shade: 0.06 });
    ctx.strokeStyle = "rgba(80,120,190,0.35)";
    ctx.lineWidth = 1;
    for (let y = 92; y < h; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(200,50,50,0.6)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 62);
    ctx.lineTo(w, 62);
    ctx.stroke();

    ctx.fillStyle = INK.red;
    ctx.font = font(fonts.marker, 26);
    ctx.fillText(job.role, 22, 46);
    ctx.fillStyle = INK.type;
    ctx.font = font(fonts.type, 17);
    ctx.textAlign = "right";
    ctx.fillText(job.period ?? "dates —", w - 22, 44);
    ctx.textAlign = "left";

    ctx.font = font(fonts.type, 19);
    ctx.fillText(job.company, 22, 86);
    ctx.fillStyle = INK.blue;
    ctx.font = font(fonts.hand, 26, 500);
    job.highlights.slice(0, Math.floor((h - 130) / 30)).forEach((line, i) => ctx.fillText(`– ${line}`, 30, 116 + i * 30));
    if (!job.url) return [];
    ctx.fillStyle = INK.type;
    ctx.font = font(fonts.type, 14);
    ctx.textAlign = "right";
    const link = linkText(ctx, bareUrl(job.url), w - 22, h - 16, job.url);
    ctx.textAlign = "left";
    return [link];
  },
};
