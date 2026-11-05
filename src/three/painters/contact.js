import { contact } from "@/data/content";
import { INK, font, paperBase } from "./common";
import { ICONS, ICON_INK, drawIcon } from "./icons";

/* How to reach him: a long email slip and printed social icon cards. */

/** A long strip of paper: envelope icon and the address, typed large. */
export const emailslip = {
  paint(ctx, { w, h }, { fonts, r }) {
    paperBase(ctx, w, h, { color: "#efede6", r, shade: 0.1 });
    const pad = h * 0.22;
    const icon = h - pad * 2;
    drawIcon(ctx, ICONS.email, pad, pad, icon, ICON_INK.email);

    ctx.fillStyle = INK.type;
    let size = h * 0.34;
    ctx.font = font(fonts.type, size);
    const maxW = w - pad * 3 - icon;
    const tw = ctx.measureText(contact.email).width;
    if (tw > maxW) size = (size * maxW) / tw;
    ctx.font = font(fonts.type, size);
    ctx.fillText(contact.email, pad * 2 + icon, h / 2 + size * 0.35);
  },
};

/** A small die-cut card with one network's icon printed in its ink. */
export const social = {
  alpha: true,
  paint(ctx, { w, h, props }, { fonts, r }) {
    const { social: s } = props;
    const inset = 3;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(inset, inset, w - inset * 2, h - inset * 2, w * 0.12);
    ctx.clip();
    paperBase(ctx, w, h, { color: "#efede6", r, shade: 0.12 });
    const iconSize = w * 0.5;
    const top = s.url ? h * 0.14 : (h - iconSize) / 2;
    drawIcon(ctx, ICONS[s.id], (w - iconSize) / 2, top, iconSize, ICON_INK[s.id]);
    if (s.url) {
      ctx.fillStyle = INK.type;
      ctx.font = font(fonts.type, Math.round(w * 0.1));
      ctx.textAlign = "center";
      ctx.fillText(s.handle, w / 2, h * 0.86, w - 16);
      ctx.textAlign = "left";
    }
    ctx.restore();
  },
};
