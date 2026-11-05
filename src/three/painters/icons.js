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

const SVG_NS = "http://www.w3.org/2000/svg";
let probe = null;

/** A hidden SVG path used only to measure and sample outlines. */
function pathProbe() {
  if (!probe) {
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("width", "0");
    svg.setAttribute("height", "0");
    svg.style.cssText = "position:absolute;visibility:hidden;pointer-events:none";
    probe = document.createElementNS(SVG_NS, "path");
    svg.appendChild(probe);
    document.body.appendChild(svg);
  }
  return probe;
}

/**
 * Draw a Font Awesome icon as if traced with a pen: each outline of the
 * logo is followed in one wobbling, swelling stroke that overlaps where it
 * started, instead of being printed as a solid shape. Tiny interior details
 * are left out, as a hand would.
 */
export function drawIconPen(ctx, def, x, y, size, { color, r, width = 4 }) {
  const [vw, vh, , , path] = def.icon;
  const d = Array.isArray(path) ? path.join(" ") : path;
  const s = size / Math.max(vw, vh);
  const ox = x + (size - vw * s) / 2;
  const oy = y + (size - vh * s) / 2;

  const p = pathProbe();
  p.setAttribute("d", d);
  const length = p.getTotalLength();
  const step = 1.8 / s; // a sample about every two board pixels

  // sample the whole path; a jump between samples is where one outline ends and the next begins
  const outlines = [];
  let current = [];
  let last = null;
  for (let l = 0; l <= length; l += step) {
    const pt = p.getPointAtLength(l);
    if (last && Math.hypot(pt.x - last.x, pt.y - last.y) > step * 4) {
      outlines.push(current);
      current = [];
    }
    current.push([ox + pt.x * s, oy + pt.y * s]);
    last = pt;
  }
  outlines.push(current);

  for (const pts of outlines) {
    if (pts.length < 8) continue;
    const xs = pts.map((q) => q[0]);
    const ys = pts.map((q) => q[1]);
    if (Math.hypot(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) < size * 0.1) continue;
    markerStroke(ctx, [...pts, ...pts.slice(0, 6)], { color, r, width, taper: 0.025, wobble: 0.9 });
  }
}
