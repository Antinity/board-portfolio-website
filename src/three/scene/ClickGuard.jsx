"use client";

import { useEffect } from "react";

/**
 * A drag, pinch or glide-stop must never also act as a click. When one ends
 * it flags the rig; the click the browser then fires is stopped before the
 * scene sees it. Unlike a timer this doesn't depend on how quickly frames
 * are drawn. The flag is cleared by the next press, since a click always
 * follows its own press (and a touch drag fires no click at all).
 */
export default function ClickGuard({ rig }) {
  useEffect(() => {
    const clear = () => {
      rig.swallowClick = false;
    };
    const swallow = (e) => {
      if (!rig.swallowClick) return;
      rig.swallowClick = false;
      e.stopPropagation();
    };
    window.addEventListener("pointerdown", clear, true);
    window.addEventListener("click", swallow, true);
    return () => {
      window.removeEventListener("pointerdown", clear, true);
      window.removeEventListener("click", swallow, true);
    };
  }, [rig]);

  return null;
}
