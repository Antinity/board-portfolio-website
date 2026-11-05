import { ageImage, drawCover, paperBase } from "./common";
import { sketchedPlaceholder } from "./marker";

/* Photographs of the subject: polaroids on matte paper, with a blank strip at the foot. */

const BLANK = "#e4e2dc";

/** `props.photo` is the image, or null for a polaroid still to come (marked in pencil). */
export const polaroid = {
  images: ({ props }) => (props.photo ? [props.photo] : []),
  paint(ctx, { w, h, props }, { fonts, r, images }) {
    paperBase(ctx, w, h, { color: "#efede6", r, shade: 0.08 });
    const pad = 14;
    const pw = w - pad * 2;
    const img = props.photo && images[props.photo];
    if (img) {
      drawCover(ctx, img, pad, pad, pw, pw);
      ageImage(ctx, pad, pad, pw, pw, r, { fade: 0.12, warm: 0.12 });
    } else {
      ctx.fillStyle = BLANK;
      ctx.fillRect(pad, pad, pw, pw);
      sketchedPlaceholder(ctx, pad + 14, pad + 14, pw - 28, pw - 28, { f: fonts.hand, r, note: "photo to come", ground: BLANK });
    }
  },
};
