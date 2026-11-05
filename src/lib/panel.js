/**
 * Width the case-file side panel takes on screen. Keep in sync with
 * `.panel` in components/case-file/caseFile.module.css.
 * Below the breakpoint the panel covers the whole screen, so no inset is needed.
 */
export const PANEL_BREAKPOINT = 900;
export const PANEL_MAX_WIDTH = 580;

export function panelInset(viewportWidth) {
  if (viewportWidth < PANEL_BREAKPOINT) return 0;
  return Math.min(PANEL_MAX_WIDTH, viewportWidth * 0.45);
}
