import { subject } from "@/data/content";
import { INK, ageImage, bareUrl, drawCover, font, linkText, paperBase } from "./common";

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
    ctx.fillText(subject.photoCaption, w / 2, ph + pad + (h - ph - pad) / 2 + 10);
    ctx.textAlign = "left";
  },
};

/** A website screenshot printed on photo paper with a white border. */
export const print = {
  glossy: true,
  images: ({ props }) => [props.project.image],
  paint(ctx, { w, h, props }, { fonts, r, images }) {
    const { project } = props;
    paperBase(ctx, w, h, { color: "#f5f3ee", r, shade: 0.04 });
    const pad = 10;
    const strip = 66; // white caption strip under the photo
    const ih = h - pad - strip;
    const img = images[project.image];
    if (img) drawCover(ctx, img, pad, pad, w - pad * 2, ih);
    ageImage(ctx, pad, pad, w - pad * 2, ih, r, { fade: 0.08, warm: 0.08 });

    ctx.fillStyle = INK.black;
    ctx.font = font(fonts.marker, 22);
    ctx.fillText(project.title, pad + 4, ih + pad + 30);
    ctx.fillStyle = INK.blue;
    ctx.font = font(fonts.type, 13);
    return [linkText(ctx, bareUrl(project.url), pad + 4, ih + pad + 52, project.url)];
  },
};
