import { INK, font, paperBase, scribbleLine } from "./common";

/* Labels, notes, tags, cards and the blueprint. */

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
    ctx.font = font(fonts.hand, 21, 500);
    const colW = (w - 64) / 2;
    group.items.forEach((item, i) => {
      const col = i < Math.ceil(group.items.length / 2) ? 0 : 1;
      const row = col ? i - Math.ceil(group.items.length / 2) : i;
      ctx.fillText(item, 54 + col * colW, 80 + row * 19);
    });
  },
};

/** Business-card-ish social contact. */
export const card = {
  paint(ctx, { w, h, props }, { fonts, r }) {
    const { social } = props;
    const dark = social.id === "x";
    paperBase(ctx, w, h, { color: dark ? "#1d1c1a" : "#f6f4ee", r, shade: dark ? 0 : 0.05 });
    ctx.fillStyle = dark ? "#eeeae0" : INK.black;
    ctx.font = font(fonts.display, 30, 700);
    ctx.fillText(social.label.toUpperCase(), 18, 46);
    ctx.font = font(fonts.type, 18);
    ctx.fillText(social.handle, 18, 82);
    ctx.globalAlpha = 0.6;
    ctx.font = font(fonts.type, 11);
    ctx.fillText(social.url.replace(/^https?:\/\//, ""), 18, h - 18);
    ctx.globalAlpha = 1;
  },
};

/** Blueprint sheet: grid, a floor plan, dimension lines and a title block. */
export const blueprint = {
  paint(ctx, { w, h, props }, { fonts, r }) {
    const g = ctx.createRadialGradient(w * 0.3, h * 0.3, 0, w / 2, h / 2, w * 0.8);
    g.addColorStop(0, "#2d5bb0");
    g.addColorStop(1, "#173b80");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 8) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 8) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    for (let x = 0; x < w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // floor plan
    ctx.strokeStyle = "rgba(235,242,255,0.85)";
    ctx.lineWidth = 4;
    ctx.strokeRect(w * 0.06, h * 0.08, w * 0.88, h * 0.78);
    ctx.lineWidth = 2;
    const rooms = [
      [0.06, 0.08, 0.36, 0.45],
      [0.42, 0.08, 0.3, 0.5],
      [0.72, 0.08, 0.22, 0.78],
      [0.06, 0.53, 0.66, 0.33],
    ];
    rooms.forEach(([x, y, rw, rh]) => ctx.strokeRect(w * x, h * y, w * rw, h * rh));
    // doors
    ctx.lineWidth = 1.5;
    [
      [0.42, 0.3, 0],
      [0.72, 0.45, Math.PI],
      [0.3, 0.53, -Math.PI / 2],
    ].forEach(([x, y, a]) => {
      ctx.beginPath();
      ctx.arc(w * x, h * y, 28, a, a + Math.PI / 2);
      ctx.stroke();
    });
    // desk + monitors + chair in the main room
    ctx.strokeRect(w * 0.47, h * 0.14, w * 0.2, h * 0.08);
    ctx.strokeRect(w * 0.5, h * 0.15, w * 0.05, h * 0.02);
    ctx.strokeRect(w * 0.58, h * 0.15, w * 0.05, h * 0.02);
    ctx.beginPath();
    ctx.arc(w * 0.57, h * 0.32, 18, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "rgba(235,242,255,0.8)";
    ctx.font = font(fonts.type, 13);
    ctx.fillText("DESK", w * 0.48, h * 0.26);
    ctx.fillText("SERVER", w * 0.76, h * 0.2);
    ctx.fillText("STORAGE", w * 0.09, h * 0.62);

    // dimension line
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.moveTo(w * 0.06, h * 0.92);
    ctx.lineTo(w * 0.94, h * 0.92);
    ctx.stroke();
    ctx.setLineDash([]);

    // title block
    ctx.lineWidth = 1.5;
    ctx.strokeRect(w - 230, h - 62, 214, 48);
    ctx.font = font(fonts.display, 15, 600);
    ctx.fillText(props.title.toUpperCase(), w - 220, h - 32);

    // red marker route (someone planned something)
    ctx.strokeStyle = "rgba(220,40,40,0.85)";
    ctx.lineWidth = 3;
    scribbleLine(ctx, w * 0.75, h * 0.8, w * 0.75, h * 0.5, r, 3);
    scribbleLine(ctx, w * 0.75, h * 0.5, w * 0.58, h * 0.36, r, 3);
  },
};
