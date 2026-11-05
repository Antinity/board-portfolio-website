"use client";

import { useCallback, useEffect, useRef } from "react";

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const lerp = (a, b, t) => a + (b - a) * t;
const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const DRAG_THRESHOLD = 6; // px before a press becomes a drag (otherwise it's a click)
const INERTIA_FRICTION = 0.92; // velocity multiplier per 16ms frame

/**
 * Pan / zoom camera for a large "world" element inside a viewport.
 *
 * - drag (mouse, pen, touch) to pan, with inertia
 * - wheel / trackpad pinch / two-finger pinch to zoom around the pointer
 * - animated flights to any rectangle (focusRect) or the whole world (fitAll)
 *
 * Transforms are written straight to the DOM (no React re-render per frame).
 *
 * @param {object} opts
 * @param {React.RefObject<HTMLElement>} opts.viewportRef
 * @param {React.RefObject<HTMLElement>} opts.worldRef
 * @param {{x:number,y:number,w:number,h:number}} opts.worldRect  area the camera may explore
 * @param {number} [opts.maxZoom]
 * @param {() => void} [opts.onResize]  called after the viewport is resized
 */
export function useBoardCamera({ viewportRef, worldRef, worldRect, maxZoom = 2.4, onResize }) {
  const cam = useRef({ x: 0, y: 0, scale: 1 });
  const fitScale = useRef(1);
  const frame = useRef(0);
  const onResizeRef = useRef(onResize);
  useEffect(() => {
    onResizeRef.current = onResize;
  });

  const viewportSize = useCallback(() => {
    const el = viewportRef.current;
    return { w: el?.clientWidth || 1, h: el?.clientHeight || 1 };
  }, [viewportRef]);

  const minZoom = () => fitScale.current * 0.7;

  const apply = useCallback(() => {
    const { x, y, scale } = cam.current;
    if (worldRef.current) worldRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
    viewportRef.current?.style.setProperty("--cam-scale", scale.toFixed(4));
  }, [viewportRef, worldRef]);

  /** Keep part of the world on screen; centre it when it is smaller than the viewport. */
  const constrain = useCallback(
    (c) => {
      const { w, h } = viewportSize();
      const pad = Math.min(w, h) * 0.4;
      const axis = (pos, size, start, extent) => {
        const scaled = extent * c.scale;
        if (scaled + pad * 2 <= size) return (size - scaled) / 2 - start * c.scale;
        return clamp(pos, size - (start + extent) * c.scale - pad, -start * c.scale + pad);
      };
      return {
        scale: c.scale,
        x: axis(c.x, w, worldRect.x, worldRect.w),
        y: axis(c.y, h, worldRect.y, worldRect.h),
      };
    },
    [viewportSize, worldRect]
  );

  const stop = () => cancelAnimationFrame(frame.current);

  /** Camera that frames `rect`, leaving `insetRight` px free on the right (for a side panel). */
  const viewForRect = useCallback(
    (rect, { padding = 60, insetRight = 0, zoomCap = maxZoom } = {}) => {
      const { w, h } = viewportSize();
      const availW = Math.max(w - insetRight, 1);
      const scale = clamp(Math.min((availW - padding * 2) / rect.w, (h - padding * 2) / rect.h), 0.05, zoomCap);
      return {
        scale,
        x: availW / 2 - (rect.x + rect.w / 2) * scale,
        y: h / 2 - (rect.y + rect.h / 2) * scale,
      };
    },
    [viewportSize, maxZoom]
  );

  /** Fly to a target camera, keeping the motion natural (log-space zoom). */
  const animateTo = useCallback(
    (target, duration = 1000) => {
      stop();
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const from = { ...cam.current };
      const { w, h } = viewportSize();
      // world point at the viewport centre, at start and end
      const c0 = { x: (w / 2 - from.x) / from.scale, y: (h / 2 - from.y) / from.scale };
      const c1 = { x: (w / 2 - target.x) / target.scale, y: (h / 2 - target.y) / target.scale };
      const start = performance.now();
      const dur = reduce ? 1 : duration;

      const tick = (now) => {
        const t = easeInOutCubic(clamp((now - start) / dur, 0, 1));
        const scale = Math.exp(lerp(Math.log(from.scale), Math.log(target.scale), t));
        const cx = lerp(c0.x, c1.x, t);
        const cy = lerp(c0.y, c1.y, t);
        cam.current = { scale, x: w / 2 - cx * scale, y: h / 2 - cy * scale };
        apply();
        if (t < 1) frame.current = requestAnimationFrame(tick);
      };
      frame.current = requestAnimationFrame(tick);
    },
    [apply, viewportSize]
  );

  const fitAll = useCallback(
    ({ animate = true, duration } = {}) => {
      const { w, h } = viewportSize();
      let view = viewForRect(worldRect, { padding: 40 });
      // Portrait phones: a "contain" fit leaves the board tiny, so fill the
      // height instead and let the visitor pan sideways.
      if (w / h < 0.8) {
        const scale = (h * 0.62) / worldRect.h;
        view = { scale, x: w / 2 - (worldRect.x + worldRect.w / 2) * scale, y: h / 2 - (worldRect.y + worldRect.h / 2) * scale };
      }
      if (animate) animateTo(view, duration);
      else {
        stop();
        cam.current = view;
        apply();
      }
    },
    [animateTo, apply, viewForRect, viewportSize, worldRect]
  );

  const focusRect = useCallback(
    (rect, opts = {}) => animateTo(viewForRect(rect, { zoomCap: 1.6, ...opts }), opts.duration ?? 1100),
    [animateTo, viewForRect]
  );

  /** Instantly place the camera (used for intro shots). */
  const setView = useCallback(
    (view) => {
      stop();
      cam.current = view;
      apply();
    },
    [apply]
  );

  const zoomAt = useCallback(
    (px, py, factor) => {
      const c = cam.current;
      const scale = clamp(c.scale * factor, minZoom(), maxZoom);
      const k = scale / c.scale;
      cam.current = constrain({ scale, x: px - (px - c.x) * k, y: py - (py - c.y) * k });
      apply();
    },
    [apply, constrain, maxZoom]
  );

  const zoomBy = useCallback(
    (factor) => {
      const { w, h } = viewportSize();
      const c = cam.current;
      const scale = clamp(c.scale * factor, minZoom(), maxZoom);
      const k = scale / c.scale;
      animateTo(constrain({ scale, x: w / 2 - (w / 2 - c.x) * k, y: h / 2 - (h / 2 - c.y) * k }), 400);
    },
    [animateTo, constrain, maxZoom, viewportSize]
  );

  // ---- Fit scale + resize ----
  useEffect(() => {
    const el = viewportRef.current;
    let last = "";
    const measure = () => {
      const { w, h } = viewportSize();
      if (`${w}x${h}` === last) return;
      const first = !last;
      last = `${w}x${h}`;
      fitScale.current = viewForRect(worldRect, { padding: 40 }).scale;
      if (!first) onResizeRef.current?.();
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [viewportRef, viewForRect, viewportSize, worldRect]);

  // ---- Pointer + wheel input ----
  useEffect(() => {
    const el = viewportRef.current;
    const pointers = new Map();
    let drag = null;
    let pinch = null;
    let suppressClick = false;

    const local = (e) => {
      const r = el.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };

    const startInertia = (vx, vy) => {
      let last = performance.now();
      const step = (now) => {
        const dt = Math.min(now - last, 48);
        last = now;
        const decay = Math.pow(INERTIA_FRICTION, dt / 16);
        vx *= decay;
        vy *= decay;
        const c = cam.current;
        cam.current = constrain({ ...c, x: c.x + vx * dt, y: c.y + vy * dt });
        apply();
        if (Math.hypot(vx, vy) > 0.02) frame.current = requestAnimationFrame(step);
      };
      frame.current = requestAnimationFrame(step);
    };

    const pinchState = () => {
      const [a, b] = [...pointers.values()];
      return { dist: Math.hypot(a.x - b.x, a.y - b.y), x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    };

    const onDown = (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      stop();
      pointers.set(e.pointerId, local(e));
      if (pointers.size === 1) {
        const p = local(e);
        drag = { sx: p.x, sy: p.y, lx: p.x, ly: p.y, lt: performance.now(), vx: 0, vy: 0, moved: false };
      } else if (pointers.size === 2) {
        pinch = pinchState();
        if (drag) drag.moved = true;
      }
    };

    const onMove = (e) => {
      if (!pointers.has(e.pointerId)) return;
      const p = local(e);
      pointers.set(e.pointerId, p);

      if (pinch && pointers.size >= 2) {
        const next = pinchState();
        const c = cam.current;
        cam.current = constrain({ ...c, x: c.x + next.x - pinch.x, y: c.y + next.y - pinch.y });
        zoomAt(next.x, next.y, next.dist / pinch.dist);
        pinch = next;
        return;
      }
      if (!drag) return;

      if (!drag.moved && Math.hypot(p.x - drag.sx, p.y - drag.sy) > DRAG_THRESHOLD) {
        drag.moved = true;
        el.setPointerCapture?.(e.pointerId);
        el.dataset.dragging = "true";
      }
      if (!drag.moved) return;

      const now = performance.now();
      const dt = Math.max(now - drag.lt, 1);
      const dx = p.x - drag.lx;
      const dy = p.y - drag.ly;
      drag.vx = lerp(drag.vx, dx / dt, 0.4);
      drag.vy = lerp(drag.vy, dy / dt, 0.4);
      drag.lx = p.x;
      drag.ly = p.y;
      drag.lt = now;

      const c = cam.current;
      cam.current = constrain({ ...c, x: c.x + dx, y: c.y + dy });
      apply();
    };

    const onUp = (e) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinch = null;

      if (pointers.size === 1) {
        // one finger lifted mid-pinch: keep panning with the other, never click
        const p = [...pointers.values()][0];
        drag = { sx: p.x, sy: p.y, lx: p.x, ly: p.y, lt: performance.now(), vx: 0, vy: 0, moved: true };
        return;
      }
      if (pointers.size === 0 && drag) {
        if (drag.moved) {
          suppressClick = true;
          setTimeout(() => (suppressClick = false), 0);
          if (performance.now() - drag.lt < 80) startInertia(drag.vx, drag.vy);
        }
        drag = null;
        delete el.dataset.dragging;
      }
    };

    const onClickCapture = (e) => {
      if (!suppressClick) return;
      e.stopPropagation();
      e.preventDefault();
      suppressClick = false;
    };

    const onWheel = (e) => {
      e.preventDefault();
      stop();
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? el.clientHeight : 1;
      const speed = e.ctrlKey ? 0.01 : 0.0015; // ctrlKey = trackpad pinch
      const p = local(e);
      zoomAt(p.x, p.y, Math.exp(-e.deltaY * unit * speed));
    };

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("click", onClickCapture, true);
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      stop();
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("click", onClickCapture, true);
      el.removeEventListener("wheel", onWheel);
    };
  }, [apply, constrain, viewportRef, zoomAt]);

  return { fitAll, focusRect, zoomBy, setView, viewForRect };
}
