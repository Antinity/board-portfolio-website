import { subject } from "@/data/content";
import { INK, ageImage, bareUrl, drawCover, font, linkText, paperBase } from "./common";
import { BRAND, brandSurface, sparkle } from "./identity";

/* Photographs and printouts. These use a glossier material. */

export const polaroid = {
  glossy: true,
  images: () => [subject.photo],
  paint(ctx, { w, h }, { fonts, r, images }) {
    paperBase(ctx, w, h, { color: "#f4f2ec", r, shade: 0.05 });
    const pad = 14;
    const ph = w - pad * 2;
    const img = images[subject.photo];
    if (img) drawCover(ctx, img, pad, pad, w - pad * 2, ph);
    ageImage(ctx, pad, pad, w - pad * 2, ph, r, { fade: 0.1, warm: 0.12 });
    ctx.fillStyle = INK.black;
    ctx.font = font(fonts.hand, 30, 600);
    ctx.textAlign = "center";
    ctx.fillText(subject.name, w / 2, ph + pad + (h - ph - pad) / 2 + 10);
    ctx.textAlign = "left";
  },
};

/**
 * One of the works: a screenshot printed on photo paper with a caption strip
 * (title, then client location · services · year). Works with no screenshot
 * yet get a navy "file pending" face — never a fake screenshot.
 */
export const print = {
  glossy: true,
  images: ({ props }) => (props.work.image ? [props.work.image] : []),
  paint(ctx, { w, h, props }, { fonts, r, images }) {
    const { work } = props;
    paperBase(ctx, w, h, { color: "#f5f3ee", r, shade: 0.04 });
    const pad = 9;
    const strip = 78;
    const ih = h - pad - strip;
    const img = work.image && images[work.image];

    if (img) {
      drawCover(ctx, img, pad, pad, w - pad * 2, ih);
      ageImage(ctx, pad, pad, w - pad * 2, ih, r, { fade: 0.08, warm: 0.08 });
    } else {
      ctx.save();
      ctx.translate(pad, pad);
      brandSurface(ctx, w - pad * 2, ih, r);
      const iw = w - pad * 2;
      ctx.fillStyle = BRAND.sage;
      ctx.font = font(fonts.brand, Math.min(iw * 0.16, 34), 800);
      const words = work.title.split(" ");
      const lines = words.length > 2 ? [words.slice(0, Math.ceil(words.length / 2)).join(" "), words.slice(Math.ceil(words.length / 2)).join(" ")] : [work.title];
      lines.forEach((line, i) => ctx.fillText(line, 16, ih * 0.42 + i * Math.min(iw * 0.16, 34) * 1.05));
      sparkle(ctx, iw - 24, 24, 11, BRAND.sage, 2);
      ctx.fillStyle = BRAND.sageSoft;
      ctx.font = font(fonts.type, 11);
      ctx.fillText("PHOTO PENDING", 16, ih - 16);
      ctx.restore();
    }

    ctx.fillStyle = INK.black;
    ctx.font = font(fonts.marker, 19);
    ctx.fillText(work.title, pad + 3, ih + pad + 26, w - pad * 2 - 6);
    ctx.fillStyle = INK.type;
    ctx.font = font(fonts.type, 11);
    ctx.fillText(`${work.location} · ${work.services} · ${work.year}`, pad + 3, ih + pad + 46, w - pad * 2 - 6);
    if (!work.url) return [];
    ctx.fillStyle = INK.blue;
    ctx.font = font(fonts.type, 11);
    return [linkText(ctx, bareUrl(work.url), pad + 3, ih + pad + 66, work.url)];
  },
};
