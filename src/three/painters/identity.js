import { contact, socials, subject } from "@/data/content";
import { font, linkText, paperBase, wrapText } from "./common";

/*
 * Identity pieces, printed in the prototype site's palette: deep navy stock
 * with cloudy mottling and a faint grid, sage-green ink, a bright smiley.
 */

export const BRAND = {
  navy: "#0f2340",
  navyDeep: "#091831",
  sage: "#b9dc9b",
  sageSoft: "rgba(185,220,155,0.78)",
  smile: "#2fc444",
  ink: "#0c1d33",
};

/** Navy card stock: cloud mottling, a faint grid and paper grain. */
export function brandSurface(ctx, w, h, r) {
  ctx.fillStyle = BRAND.navy;
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 14; i++) {
    const x = r() * w;
    const y = r() * h;
    const rad = (0.15 + r() * 0.35) * Math.max(w, h);
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    const light = r() < 0.55;
    g.addColorStop(0, light ? `rgba(120,140,160,${0.08 + r() * 0.1})` : `rgba(4,10,24,${0.15 + r() * 0.2})`);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }
  ctx.strokeStyle = "rgba(185,220,155,0.06)";
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 22) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += 22) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  for (let i = 0; i < (w * h) / 50; i++) {
    ctx.fillStyle = `rgba(255,255,255,${r() * 0.035})`;
    ctx.fillRect(r() * w, r() * h, 1.2, 1.2);
  }
}

/** Eight-ray sparkle, like the prototype's asterisks. */
export function sparkle(ctx, x, y, size, color = BRAND.sage, width = 3) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 4 + 0.15;
    const l = i % 2 ? size * 0.75 : size;
    ctx.beginPath();
    ctx.moveTo(-Math.cos(a) * l, -Math.sin(a) * l);
    ctx.lineTo(Math.cos(a) * l, Math.sin(a) * l);
    ctx.stroke();
  }
  ctx.restore();
}

/** The prototype's green smiley badge. */
export function smiley(ctx, x, y, rad) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = BRAND.smile;
  ctx.strokeStyle = BRAND.ink;
  ctx.lineWidth = rad * 0.1;
  ctx.beginPath();
  ctx.arc(0, 0, rad, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, rad * 0.78, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = BRAND.ink;
  for (const ex of [-0.28, 0.28]) {
    ctx.beginPath();
    ctx.ellipse(ex * rad, -0.22 * rad, rad * 0.08, rad * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.lineWidth = rad * 0.09;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(0, 0.02 * rad, rad * 0.48, 0.18 * Math.PI, 0.82 * Math.PI);
  ctx.stroke();
  ctx.restore();
}

/** Size a single line of text to fill `maxW`. */
function fitFont(ctx, text, family, weight, maxW, maxSize) {
  let size = maxSize;
  ctx.font = font(family, size, weight);
  const m = ctx.measureText(text).width;
  if (m > maxW) size = Math.floor((size * maxW) / m);
  ctx.font = font(family, size, weight);
  return size;
}

/**
 * The centrepiece: a printed poster of the subject in his own identity —
 * the wordmark, the headline and the role, as on the prototype site.
 */
export const poster = {
  paint(ctx, { w, h }, { fonts, r }) {
    brandSurface(ctx, w, h, r);
    const pad = w * 0.075;

    ctx.fillStyle = BRAND.sageSoft;
    ctx.font = font(fonts.hand, w * 0.058, 600);
    ctx.fillText("Hey, I'm", pad, h * 0.13);
    // small curling arrow
    ctx.strokeStyle = BRAND.sageSoft;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    const ax = pad + ctx.measureText("Hey, I'm").width + w * 0.03;
    const ay = h * 0.1;
    ctx.moveTo(ax, ay);
    ctx.bezierCurveTo(ax + 40, ay - 16, ax + 70, ay + 4, ax + 52, ay + 30);
    ctx.lineTo(ax + 44, ay + 22);
    ctx.moveTo(ax + 52, ay + 30);
    ctx.lineTo(ax + 60, ay + 20);
    ctx.stroke();

    // wordmark
    ctx.fillStyle = BRAND.sage;
    const size = fitFont(ctx, subject.firstName, fonts.brand, 800, w - pad * 2, w * 0.3);
    const wordY = h * 0.13 + size * 0.95;
    ctx.fillText(subject.firstName, pad - size * 0.03, wordY);
    // the smiley sits on the shoulder of the "k", as on the prototype site
    smiley(ctx, pad + ctx.measureText(subject.firstName.slice(0, 3)).width - size * 0.16, wordY - size * 0.7, size * 0.19);
    sparkle(ctx, w - pad * 0.9, h * 0.1, w * 0.04, BRAND.sage, 3.5);

    // role pill
    ctx.font = font(fonts.brand, w * 0.032, 600);
    const role = "developer & designer";
    const pw = ctx.measureText(role).width + w * 0.07;
    const ph = w * 0.065;
    const px = w - pad - pw;
    const py = wordY + size * 0.18;
    ctx.fillStyle = BRAND.sage;
    ctx.beginPath();
    ctx.roundRect(px, py, pw, ph, ph / 2);
    ctx.fill();
    ctx.fillStyle = BRAND.ink;
    ctx.fillText(role, px + w * 0.035, py + ph * 0.68);

    // headline: "Don't you think / I might be built different."
    const [l1, l2, l3] = subject.headline;
    const hs = w * 0.068;
    let y = py + ph + hs * 1.7;
    ctx.fillStyle = BRAND.sage;
    ctx.font = font(fonts.brand, hs, 700);
    ctx.fillText(l1, pad, y);
    y += hs * 1.15;
    ctx.fillText(l2, pad, y);
    const l2w = ctx.measureText(`${l2} `).width;
    ctx.font = font(fonts.display, hs * 1.08, 400);
    ctx.fillText(l3, pad + l2w, y);
    const l3w = ctx.measureText(l3).width;
    ctx.strokeStyle = BRAND.sage;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pad + l2w - 4, y + hs * 0.28);
    ctx.quadraticCurveTo(pad + l2w + l3w * 0.5, y + hs * 0.36, pad + l2w + l3w + 6, y + hs * 0.24);
    ctx.moveTo(pad + l2w + l3w * 0.15, y + hs * 0.44);
    ctx.quadraticCurveTo(pad + l2w + l3w * 0.6, y + hs * 0.5, pad + l2w + l3w * 0.85, y + hs * 0.42);
    ctx.stroke();

    // intro paragraph
    y += hs * 1.5;
    sparkle(ctx, pad + w * 0.04, y + w * 0.02, w * 0.04, BRAND.sage, 2.5);
    ctx.fillStyle = BRAND.sageSoft;
    ctx.font = font(fonts.brand, w * 0.03, 400);
    wrapText(ctx, subject.intro, pad + w * 0.12, y, w - pad * 2 - w * 0.12, w * 0.042, { maxLines: 5 });

    // footer rule
    ctx.fillStyle = "rgba(185,220,155,0.35)";
    ctx.fillRect(pad, h - pad * 1.25, w - pad * 2, 1.5);
    ctx.fillStyle = BRAND.sageSoft;
    ctx.font = font(fonts.type, w * 0.024);
    ctx.fillText(`${subject.alias.toUpperCase()}  ·  ${subject.origin.toUpperCase()}  ·  SINCE ${subject.activeSince}`, pad, h - pad * 0.62);
  },
};

/** The way to reach him: a heavy navy card with the address set large. */
export const contactcard = {
  paint(ctx, { w, h }, { fonts, r }) {
    brandSurface(ctx, w, h, r);
    const pad = w * 0.07;
    const links = [];

    ctx.fillStyle = BRAND.sage;
    ctx.font = font(fonts.brand, w * 0.085, 800);
    ctx.fillText("Let's work", pad, pad + w * 0.07);
    ctx.fillText("together.", pad, pad + w * 0.155);
    sparkle(ctx, w - pad * 1.4, pad + w * 0.05, w * 0.045, BRAND.sage, 3);

    // the address, set large like a stamp line, clickable while reading
    const ey = h * 0.66;
    ctx.fillStyle = BRAND.sage;
    fitFont(ctx, contact.email, fonts.brand, 600, w - pad * 2, w * 0.062);
    links.push(linkText(ctx, contact.email, pad, ey, `mailto:${contact.email}`));

    ctx.fillStyle = BRAND.sageSoft;
    ctx.font = font(fonts.type, w * 0.027);
    const others = socials.filter((s) => !s.icon && s.url);
    let x = pad;
    const y2 = h - pad * 0.95;
    others.forEach((s) => {
      const label = `${s.label} ${s.handle}`;
      links.push(linkText(ctx, label, x, y2, s.url));
      x += ctx.measureText(label).width + w * 0.05;
    });
    ctx.textAlign = "right";
    ctx.fillText(`replies in ${contact.timezone.split(" ")[0]}`, w - pad, y2);
    ctx.textAlign = "left";
    return links;
  },
};

/* ---------- Paper social icons (die-cut card stock) ---------- */

const ICONS = {
  x: {
    paper: "#151515",
    draw(ctx, s) {
      ctx.fillStyle = "#f2f2ee";
      // stylised X mark: a thick diagonal and a thin counter-diagonal
      ctx.beginPath();
      ctx.moveTo(s * 0.27, s * 0.26);
      ctx.lineTo(s * 0.41, s * 0.26);
      ctx.lineTo(s * 0.74, s * 0.74);
      ctx.lineTo(s * 0.6, s * 0.74);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(s * 0.7, s * 0.26);
      ctx.lineTo(s * 0.745, s * 0.26);
      ctx.lineTo(s * 0.3, s * 0.74);
      ctx.lineTo(s * 0.255, s * 0.74);
      ctx.closePath();
      ctx.fill();
    },
  },
  instagram: {
    paper: (ctx, s) => {
      const g = ctx.createLinearGradient(0, s, s, 0);
      g.addColorStop(0, "#f9b13c");
      g.addColorStop(0.35, "#ef4a5c");
      g.addColorStop(0.7, "#c2318f");
      g.addColorStop(1, "#6a43c9");
      return g;
    },
    draw(ctx, s) {
      ctx.strokeStyle = "#fffaf3";
      ctx.lineWidth = s * 0.07;
      ctx.beginPath();
      ctx.roundRect(s * 0.25, s * 0.25, s * 0.5, s * 0.5, s * 0.14);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(s * 0.5, s * 0.5, s * 0.115, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#fffaf3";
      ctx.beginPath();
      ctx.arc(s * 0.645, s * 0.355, s * 0.035, 0, Math.PI * 2);
      ctx.fill();
    },
  },
  linkedin: {
    paper: "#0a66c2",
    draw(ctx, s, fonts) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(s * 0.27, s * 0.43, s * 0.1, s * 0.32);
      ctx.beginPath();
      ctx.arc(s * 0.32, s * 0.32, s * 0.06, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = font(fonts.brand, s * 0.42, 800);
      ctx.fillText("n", s * 0.42, s * 0.75);
    },
  },
  whatsapp: {
    paper: "#25d366",
    round: true,
    draw(ctx, s) {
      ctx.strokeStyle = "#ffffff";
      ctx.fillStyle = "#ffffff";
      ctx.lineWidth = s * 0.06;
      // speech bubble ring with a tail
      ctx.beginPath();
      ctx.arc(s * 0.52, s * 0.48, s * 0.25, 0.75 * Math.PI, 2.62 * Math.PI);
      ctx.lineTo(s * 0.24, s * 0.78);
      ctx.closePath();
      ctx.stroke();
      // handset
      ctx.save();
      ctx.translate(s * 0.52, s * 0.48);
      ctx.rotate(-0.6);
      ctx.beginPath();
      ctx.roundRect(-s * 0.13, -s * 0.045, s * 0.26, s * 0.09, s * 0.04);
      ctx.fill();
      ctx.fillRect(-s * 0.13, -s * 0.045, s * 0.06, s * 0.13);
      ctx.fillRect(s * 0.07, -s * 0.045, s * 0.06, s * 0.13);
      ctx.restore();
    },
  },
};

/** One social network as a die-cut piece of printed card stock. */
export const social = {
  alpha: true,
  paint(ctx, { w, h, props }, { fonts, r }) {
    const { social: s } = props;
    const icon = ICONS[s.id];
    const size = Math.min(w, h);
    const inset = size * 0.04;

    // paper edge (the white core of the card stock shows at the cut)
    ctx.save();
    ctx.beginPath();
    if (icon.round) ctx.arc(size / 2, size / 2, size / 2 - inset, 0, Math.PI * 2);
    else ctx.roundRect(inset, inset, size - inset * 2, size - inset * 2, size * 0.2);
    ctx.clip();
    paperBase(ctx, size, size, { color: "#f4f1e8", r, shade: 0.05 });
    ctx.restore();

    // printed face
    ctx.save();
    ctx.beginPath();
    const e = inset + size * 0.025;
    if (icon.round) ctx.arc(size / 2, size / 2, size / 2 - e, 0, Math.PI * 2);
    else ctx.roundRect(e, e, size - e * 2, size - e * 2, size * 0.18);
    ctx.clip();
    ctx.fillStyle = typeof icon.paper === "function" ? icon.paper(ctx, size) : icon.paper;
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 260; i++) {
      ctx.fillStyle = `rgba(255,255,255,${r() * 0.05})`;
      ctx.fillRect(r() * size, r() * size, 1.5, 1.5);
    }
    icon.draw(ctx, size, fonts);
    ctx.restore();

    return s.url ? [{ x: 0, y: 0, w, h, href: s.url }] : [];
  },
};
