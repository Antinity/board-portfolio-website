"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";

const SPEED = 0.011; // radians per pixel dragged
const DRAG_THRESHOLD = 4; // px before a press becomes a drag (otherwise it's a click)
const ZOOM_MAX = 3; // how far a page can be magnified
const ZOOMED = 1.12; // beyond this, one finger pans the page instead of spinning it
const EDGE = 0.85; // a zoomed page's edge can be brought in this far (NDC), no further

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/**
 * Input for a page held up to read.
 *  - drag (mouse or touch) spins it freely, all the way round to its blank
 *    back, and it settles face-on when let go
 *  - wheel or pinch zooms into it, toward the pointer or the fingers; once
 *    zoomed, a drag pans around the page instead
 * A drag or pinch never counts as a click, so it can't put the page back.
 */
export default function ReadingSpin({ rig, readingId }) {
  const { gl } = useThree();

  // every new page starts face-on and unzoomed
  useEffect(() => {
    rig.spin.yaw = 0;
    rig.spin.pitch = 0;
    rig.readZoom = 1;
    rig.readPan.set(0, 0);
  }, [rig, readingId]);

  useEffect(() => {
    const el = gl.domElement;
    const pointers = new Map();
    let drag = null;
    let pinch = null;

    const ndc = (x, y) => {
      const r = el.getBoundingClientRect();
      return [((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1];
    };
    const clampPan = () => {
      const lx = Math.max(0, rig.readHalf.x * rig.readZoom - EDGE);
      const ly = Math.max(0, rig.readHalf.y * rig.readZoom - EDGE);
      rig.readPan.set(clamp(rig.readPan.x, -lx, lx), clamp(rig.readPan.y, -ly, ly));
    };
    /** Zoom by `factor`, keeping the point of the page under (nx, ny) where it is. */
    const zoomAt = (factor, nx, ny) => {
      const before = rig.readZoom;
      const after = clamp(before * factor, 1, ZOOM_MAX);
      const k = after / before;
      rig.readPan.set(nx - (nx - rig.readPan.x) * k, ny - (ny - rig.readPan.y) * k);
      rig.readZoom = after;
      clampPan();
    };
    const settleSpin = () => {
      rig.spin.yaw = Math.round(rig.spin.yaw / (Math.PI * 2)) * Math.PI * 2;
      rig.spin.pitch = 0;
    };

    const onDown = (e) => {
      if (!rig.reading || (e.pointerType === "mouse" && e.button !== 0)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 2) {
        // a second finger: pinch, and let go of any spin
        if (drag) settleSpin();
        drag = null;
        pinch = null;
        return;
      }
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false, pan: rig.readZoom > ZOOMED };
    };

    const onMove = (e) => {
      const p = pointers.get(e.pointerId);
      if (!p) return;
      const dx = e.clientX - p.x;
      const dy = e.clientY - p.y;
      p.x = e.clientX;
      p.y = e.clientY;

      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2;
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        const [nx, ny] = ndc(mx, my);
        if (pinch && dist > 0 && pinch.dist > 0) {
          rig.readPan.x += nx - pinch.nx;
          rig.readPan.y += ny - pinch.ny;
          zoomAt(dist / pinch.dist, nx, ny);
        }
        pinch = { nx, ny, dist };
        rig.dragging = true;
        return;
      }

      if (!drag || e.pointerId !== drag.id) return;
      if (!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < DRAG_THRESHOLD) return;
      drag.moved = true;
      rig.dragging = true;
      if (drag.pan) {
        const r = el.getBoundingClientRect();
        rig.readPan.x += (dx / r.width) * 2;
        rig.readPan.y -= (dy / r.height) * 2;
        clampPan();
      } else {
        rig.spin.yaw += dx * SPEED;
        rig.spin.pitch = clamp(rig.spin.pitch + dy * SPEED, -1.45, 1.45);
      }
    };

    const onUp = (e) => {
      if (!pointers.delete(e.pointerId)) return;
      if (pinch || drag?.moved) {
        rig.suppressClickUntil = performance.now() + 350;
        rig.swallowClick = true;
      }
      if (pointers.size < 2) pinch = null;
      if (drag && e.pointerId === drag.id) {
        if (!drag.pan && drag.moved) settleSpin();
        drag = null;
      }
    };

    const onWheel = (e) => {
      if (!rig.reading) return;
      e.preventDefault();
      const unit = e.deltaMode === 1 ? 16 : 1;
      const [nx, ny] = ndc(e.clientX, e.clientY);
      zoomAt(Math.exp(-e.deltaY * unit * (e.ctrlKey ? 0.01 : 0.0015)), nx, ny);
    };

    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      el.removeEventListener("wheel", onWheel);
    };
  }, [gl, rig]);

  return null;
}
