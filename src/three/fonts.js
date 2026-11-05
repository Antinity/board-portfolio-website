import { loading } from "./loading";

/**
 * Canvas text needs real font-family names. next/font exposes them through
 * CSS variables on <html>; this resolves them and waits until they're loaded.
 */

const VARS = {
  type: "--font-type",
  marker: "--font-marker",
  hand: "--font-hand",
  display: "--font-display",
};

let ready = null;

export function loadFonts() {
  if (ready) return ready;
  const css = getComputedStyle(document.documentElement);
  const fonts = Object.fromEntries(
    Object.entries(VARS).map(([key, v]) => [key, css.getPropertyValue(v).trim() || "serif"])
  );
  ready = Promise.all(
    Object.values(fonts).flatMap((family) => [
      document.fonts.load(`400 32px ${family}`),
      document.fonts.load(`700 32px ${family}`),
      document.fonts.load(`800 32px ${family}`),
    ])
  )
    .catch(() => {})
    .then(() => {
      loading.step("fonts");
      return fonts;
    });
  return ready;
}
