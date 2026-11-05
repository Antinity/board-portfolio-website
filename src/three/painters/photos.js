import { subject } from "@/data/content";
import { INK, ageImage, drawCover, font, paperBase } from "./common";

/* The photograph of the subject, on matte paper. */

export const polaroid = {
  images: () => [subject.photo],
  paint(ctx, { w, h }, { fonts, r, images }) {
    paperBase(ctx, w, h, { color: "#efede6", r, shade: 0.08 });
    const pad = 14;
    const ph = w - pad * 2;
    const img = images[subject.photo];
    if (img) drawCover(ctx, img, pad, pad, w - pad * 2, ph);
    ageImage(ctx, pad, pad, w - pad * 2, ph, r, { fade: 0.12, warm: 0.12 });
    ctx.fillStyle = INK.black;
    ctx.font = font(fonts.hand, 30, 600);
    ctx.textAlign = "center";
    ctx.fillText(subject.name, w / 2, ph + pad + (h - ph - pad) / 2 + 10);
    ctx.textAlign = "left";
  },
};
