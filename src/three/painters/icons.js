import { faGithub, faInstagram, faLinkedin, faWhatsapp, faXTwitter } from "@fortawesome/free-brands-svg-icons";
import { faEnvelope } from "@fortawesome/free-regular-svg-icons";

/*
 * Icons are sourced, not drawn: Font Awesome Free (CC BY 4.0,
 * https://fontawesome.com/license/free). Each definition carries its
 * viewBox width/height and SVG path data, which we print onto paper.
 */

export const ICONS = {
  x: faXTwitter,
  instagram: faInstagram,
  linkedin: faLinkedin,
  whatsapp: faWhatsapp,
  github: faGithub,
  email: faEnvelope,
};

/** Brand ink for each network, as it would be printed. */
export const ICON_INK = {
  x: "#141414",
  instagram: "#d62976",
  linkedin: "#0a66c2",
  whatsapp: "#1fa855",
  github: "#181717",
  email: "#26231e",
};

/** Print a Font Awesome icon centred in a `size` box at (x, y). */
export function drawIcon(ctx, def, x, y, size, color) {
  const [vw, vh, , , path] = def.icon;
  const paths = Array.isArray(path) ? path : [path];
  const s = size / Math.max(vw, vh);
  ctx.save();
  ctx.translate(x + (size - vw * s) / 2, y + (size - vh * s) / 2);
  ctx.scale(s, s);
  ctx.fillStyle = color;
  paths.forEach((d) => ctx.fill(new Path2D(d)));
  ctx.restore();
}
