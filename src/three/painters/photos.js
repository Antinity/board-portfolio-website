import { subject } from "@/data/content";
import { INK, ageImage, bareUrl, drawCover, font, linkText, paperBase, wrapText } from "./common";

/* Photographs and printouts, on matte paper. */

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

/**
 * One of the works: a screenshot printed on matte paper with a caption strip
 * (title, services, then place and year). A work with no screenshot yet
 * shows an empty print area marked "No photo on file", never a fake one.
 */
export const print = {
  images: ({ props }) => (props.work.image ? [props.work.image] : []),
  paint(ctx, { w, h, props }, { fonts, r, images }) {
    const { work } = props;
    paperBase(ctx, w, h, { color: "#efede6", r, shade: 0.07 });
    const pad = 9;
    const strip = 96;
    const ih = h - pad - strip;
    const img = work.image && images[work.image];

    if (img) {
      drawCover(ctx, img, pad, pad, w - pad * 2, ih);
      ageImage(ctx, pad, pad, w - pad * 2, ih, r, { fade: 0.1, warm: 0.08 });
    } else {
      ctx.fillStyle = "#dedbd2";
      ctx.fillRect(pad, pad, w - pad * 2, ih);
      ctx.strokeStyle = "rgba(40,36,30,0.25)";
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(pad + 10, pad + 10, w - pad * 2 - 20, ih - 20);
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(40,36,30,0.55)";
      ctx.font = font(fonts.type, 13);
      ctx.textAlign = "center";
      ctx.fillText("No photo on file", w / 2, pad + ih / 2 + 4);
      ctx.textAlign = "left";
    }

    const x = pad + 3;
    const cw = w - pad * 2 - 6;
    ctx.fillStyle = INK.black;
    ctx.font = font(fonts.marker, 19);
    wrapText(ctx, work.title, x, ih + pad + 26, cw, 21, { maxLines: 1 });
    ctx.fillStyle = INK.type;
    ctx.font = font(fonts.type, 11.5);
    ctx.fillText(work.services, x, ih + pad + 46, cw);
    ctx.fillText(`${work.location}, ${work.year}`, x, ih + pad + 63, cw);
    if (!work.url) return [];
    ctx.fillStyle = INK.blue;
    return [linkText(ctx, bareUrl(work.url), x, ih + pad + 82, work.url)];
  },
};
