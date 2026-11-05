"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";

const SPEED = 0.011; // radians per pixel dragged
const DRAG_THRESHOLD = 4; // px before a press becomes a spin (otherwise it's a click)

/**
 * While a page is held up to read, pressing and dragging (mouse or touch)
 * spins it freely — all the way round to its blank back. Letting go settles
 * it to the nearest face-on turn. A drag never counts as a click, so it
 * can't accidentally put the page back.
 */
export default function ReadingSpin({ rig, readingId }) {
  const { gl } = useThree();

  // every new page starts face-on
  useEffect(() => {
    rig.spin.yaw = 0;
    rig.spin.pitch = 0;
  }, [rig, readingId]);

  useEffect(() => {
    const el = gl.domElement;
    let drag = null;

    const onDown = (e) => {
      if (!rig.reading || (e.pointerType === "mouse" && e.button !== 0)) return;
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false };
    };
    const onMove = (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      if (!drag.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      drag.moved = true;
      rig.dragging = true;
      rig.spin.yaw += dx * SPEED;
      rig.spin.pitch = Math.max(-1.45, Math.min(1.45, rig.spin.pitch + dy * SPEED));
      drag.x = e.clientX;
      drag.y = e.clientY;
    };
    const onUp = (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      if (drag.moved) rig.suppressClickUntil = performance.now() + 350;
      drag = null;
      rig.spin.yaw = Math.round(rig.spin.yaw / (Math.PI * 2)) * Math.PI * 2;
      rig.spin.pitch = 0;
    };

    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [gl, rig]);

  return null;
}
