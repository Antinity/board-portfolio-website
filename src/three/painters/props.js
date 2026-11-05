import { INK, font, paperBase } from "./common";

/* Tape labels, sticky notes and evidence tags. */

/** Strip of grey gaffer tape with a marker label, like the reference board. */
export const label = {
  alpha: true,
  paint(ctx, { w, h, props }, { fonts, r }) {
    // torn tape outline
    ctx.beginPath();
    ctx.moveTo(4, 2);
    for (let y = 0; y <= h; y += 6) ctx.lineTo(r() * 6, y);
    ctx.lineTo(w - r() * 6, h);
    for (let y = h; y >= 0; y -= 6) ctx.lineTo(w - r() * 6, y);
    ctx.closePath();
    ctx.save();
    ctx.clip();
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#d6d3cb");
    g.addColorStop(0.5, "#c8c5bc");
    g.addColorStop(1, "#bdb9af");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    for (let x = 0; x < w; x += 3) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    ctx.fillStyle = "#24221f";
    ctx.font = font(fonts.marker, 32);
    ctx.textAlign = "center";
    ctx.fillText(props.text, w / 2, h / 2 + 12);
    ctx.restore();
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

/** Manila evidence tag with a reinforced string hole. */
export const tag = {
  alpha: true,
  paint(ctx, { w, h, props }, { fonts, r }) {
    const c = 26;
    ctx.beginPath();
    ctx.moveTo(c, 0);
    ctx.lineTo(w, 0);
    ctx.lineTo(w, h);
    ctx.lineTo(c, h);
    ctx.lineTo(0, h - c);
    ctx.lineTo(0, c);
    ctx.closePath();
    ctx.save();
    ctx.clip();
    paperBase(ctx, w, h, { color: "#d9bd84", r, shade: 0.18 });
    ctx.restore();

    // hole + reinforcement
    ctx.fillStyle = "#c9a768";
    ctx.beginPath();
    ctx.arc(26, h / 2, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(26, h / 2, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";

    const { group } = props;
    ctx.fillStyle = INK.red;
    ctx.font = font(fonts.display, 12, 600);
    ctx.fillText("EVIDENCE", 54, 26);
    ctx.fillStyle = INK.black;
    ctx.font = font(fonts.marker, 24);
    ctx.fillText(group.group, 54, 54);
    ctx.font = font(fonts.hand, 22, 500);
    group.items.forEach((item, i) => ctx.fillText(item, 54, 84 + i * 20));
  },
};
