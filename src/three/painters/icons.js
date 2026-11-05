import { faGithub, faLinkedin, faXTwitter } from "@fortawesome/free-brands-svg-icons";
import { faEnvelope } from "@fortawesome/free-regular-svg-icons";
import { markerStroke } from "./marker";

/*
 * Icons are sourced, not drawn freehand: Font Awesome Free (CC BY 4.0,
 * https://fontawesome.com/license/free). Each definition carries its
 * viewBox width/height and SVG path data. On the board they are traced
 * with a marker, following the real outline of each logo.
 */

export const ICONS = {
  x: faXTwitter,
  linkedin: faLinkedin,
  github: faGithub,
  email: faEnvelope,
};

/** The pen each icon is drawn with. */
export const ICON_PEN = {
  x: "#1c1a17",
  linkedin: "#1d3f9e",
  github: "#1c1a17",
  email: "#1c1a17",
};

/**
 * SVG path data → one polyline per subpath, in path units. Curves and arcs
 * are flattened with plain arithmetic: asking an SVG element for hundreds of
 * points along the path (getPointAtLength) took over a second per load.
 */
function flatten(d) {
  const tokens = d.match(/[a-zA-Z]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi) ?? [];
  const out = [];
  let pts = [];
  let i = 0;
  let cmd = "";
  let x = 0;
  let y = 0;
  let sx = 0;
  let sy = 0;
  let cx = 0; // last control point (for S / T)
  let cy = 0;
  let prev = "";
  const num = () => parseFloat(tokens[i++]);
  const flush = () => {
    if (pts.length > 1) out.push(pts);
    pts = [];
  };
  const cubic = (x1, y1, x2, y2, x3, y3) => {
    for (let k = 1; k <= 16; k++) {
      const t = k / 16;
      const u = 1 - t;
      pts.push([u * u * u * x + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3, u * u * u * y + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3]);
    }
    cx = x2;
    cy = y2;
    x = x3;
    y = y3;
  };
  const quad = (x1, y1, x2, y2) => {
    for (let k = 1; k <= 12; k++) {
      const t = k / 12;
      const u = 1 - t;
      pts.push([u * u * x + 2 * u * t * x1 + t * t * x2, u * u * y + 2 * u * t * y1 + t * t * y2]);
    }
    cx = x1;
    cy = y1;
    x = x2;
    y = y2;
  };
  const arc = (rx, ry, rot, large, sweep, x2, y2) => {
    // endpoint to centre parameterisation (SVG implementation notes, F.6.5)
    if (!rx || !ry) {
      pts.push([x2, y2]);
      x = x2;
      y = y2;
      return;
    }
    rx = Math.abs(rx);
    ry = Math.abs(ry);
    const phi = (rot * Math.PI) / 180;
    const cos = Math.cos(phi);
    const sin = Math.sin(phi);
    const dx = (x - x2) / 2;
    const dy = (y - y2) / 2;
    const x1p = cos * dx + sin * dy;
    const y1p = -sin * dx + cos * dy;
    const lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
    if (lambda > 1) {
      rx *= Math.sqrt(lambda);
      ry *= Math.sqrt(lambda);
    }
    const sign = large === sweep ? -1 : 1;
    const num2 = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p;
    const coef = sign * Math.sqrt(Math.max(0, num2 / (rx * rx * y1p * y1p + ry * ry * x1p * x1p)));
    const cxp = (coef * rx * y1p) / ry;
    const cyp = (-coef * ry * x1p) / rx;
    const ccx = cos * cxp - sin * cyp + (x + x2) / 2;
    const ccy = sin * cxp + cos * cyp + (y + y2) / 2;
    const angle = (ux, uy, vx, vy) => Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
    const a0 = angle(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
    let da = angle((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry);
    if (!sweep && da > 0) da -= Math.PI * 2;
    if (sweep && da < 0) da += Math.PI * 2;
    const n = Math.max(4, Math.ceil(Math.abs(da) / (Math.PI / 16)));
    for (let k = 1; k <= n; k++) {
      const a = a0 + (da * k) / n;
      pts.push([ccx + rx * Math.cos(a) * cos - ry * Math.sin(a) * sin, ccy + rx * Math.cos(a) * sin + ry * Math.sin(a) * cos]);
    }
    x = x2;
    y = y2;
  };

  while (i < tokens.length) {
    if (/[a-zA-Z]/.test(tokens[i])) cmd = tokens[i++];
    const rel = cmd === cmd.toLowerCase();
    const ox = rel ? x : 0;
    const oy = rel ? y : 0;
    switch (cmd.toUpperCase()) {
      case "M":
        flush();
        x = ox + num();
        y = oy + num();
        sx = x;
        sy = y;
        pts.push([x, y]);
        cmd = rel ? "l" : "L"; // further pairs are line-tos
        break;
      case "L":
        x = ox + num();
        y = oy + num();
        pts.push([x, y]);
        break;
      case "H":
        x = (rel ? x : 0) + num();
        pts.push([x, y]);
        break;
      case "V":
        y = (rel ? y : 0) + num();
        pts.push([x, y]);
        break;
      case "C":
        cubic(ox + num(), oy + num(), ox + num(), oy + num(), ox + num(), oy + num());
        break;
      case "S": {
        const smooth = /[CS]/i.test(prev);
        const x1 = smooth ? 2 * x - cx : x;
        const y1 = smooth ? 2 * y - cy : y;
        cubic(x1, y1, ox + num(), oy + num(), ox + num(), oy + num());
        break;
      }
      case "Q":
        quad(ox + num(), oy + num(), ox + num(), oy + num());
        break;
      case "T": {
        const smooth = /[QT]/i.test(prev);
        quad(smooth ? 2 * x - cx : x, smooth ? 2 * y - cy : y, ox + num(), oy + num());
        break;
      }
      case "A":
        arc(num(), num(), num(), num(), num(), ox + num(), oy + num());
        break;
      case "Z":
        pts.push([sx, sy]);
        x = sx;
        y = sy;
        flush();
        pts.push([x, y]);
        break;
      default:
        i++; // unknown: skip
    }
    prev = cmd;
  }
  flush();
  return out;
}

/** Points about `step` apart along a polyline. */
function evenly(pts, step) {
  const out = [pts[0]];
  let carry = 0;
  for (let k = 1; k < pts.length; k++) {
    const [x0, y0] = pts[k - 1];
    const [x1, y1] = pts[k];
    const len = Math.hypot(x1 - x0, y1 - y0);
    let at = step - carry;
    while (at <= len) {
      out.push([x0 + ((x1 - x0) * at) / len, y0 + ((y1 - y0) * at) / len]);
      at += step;
    }
    carry = len - (at - step);
  }
  return out;
}

const outlines = new Map();

/**
 * Draw a Font Awesome icon as if traced with a pen: each outline of the
 * logo is followed in one wobbling, swelling stroke that overlaps where it
 * started, instead of being printed as a solid shape. Tiny interior details
 * are left out, as a hand would.
 */
export function drawIconPen(ctx, def, x, y, size, { color, r, width = 4 }) {
  const [vw, vh, , , path] = def.icon;
  const d = Array.isArray(path) ? path.join(" ") : path;
  if (!outlines.has(d)) outlines.set(d, flatten(d));
  const s = size / Math.max(vw, vh);
  const ox = x + (size - vw * s) / 2;
  const oy = y + (size - vh * s) / 2;
  const step = 1.8 / s; // a sample about every two board pixels

  for (const outline of outlines.get(d)) {
    const pts = evenly(outline, step).map(([px, py]) => [ox + px * s, oy + py * s]);
    if (pts.length < 8) continue;
    const xs = pts.map((q) => q[0]);
    const ys = pts.map((q) => q[1]);
    if (Math.hypot(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) < size * 0.1) continue;
    markerStroke(ctx, [...pts, ...pts.slice(0, 6)], { color, r, width, taper: 0.025, wobble: 0.9 });
  }
}
