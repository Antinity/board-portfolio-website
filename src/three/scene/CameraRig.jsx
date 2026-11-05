"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { MathUtils, Plane, Raycaster, Vector3 } from "three";
import { BOARD_H, BOARD_W, FRAME, OUTER_HALF_H, OUTER_HALF_W } from "../space";
import { damp } from "../rig";
import { loading } from "../loading";

const MIN_DIST = 2.6; // closest zoom
const ZOOM_OUT_MARGIN = 1.06; // furthest zoom: everything on the wall, with a little wall around it
const BOARD_PLANE = new Plane(new Vector3(0, 0, 1), 0);

/**
 * Perspective camera over the board.
 *  - opens on the subject, then settles fully zoomed out (the whole board,
 *    frame and planks in view); zoom in from there
 *  - drag to pan, wheel / pinch to zoom toward the pointer
 *  - opens close on the subject, then pulls back
 *  - input is paused while a page is being read
 */
export default function CameraRig({ rig }) {
  const { camera, gl, size } = useThree();
  const view = useRef({ x: 0, y: 0, d: 30, lambda: 3 }); // target
  const cur = useRef({ x: 0, y: 0, d: 34 }); // smoothed
  const ray = useRef(new Raycaster());
  const hit = useRef(new Vector3());

  const tanHalf = () => Math.tan(MathUtils.degToRad(camera.fov / 2));
  const visible = (d) => {
    const h = 2 * d * tanHalf();
    return { w: h * camera.aspect, h };
  };
  /** Furthest distance at which the board (incl. frame) still covers the screen. */
  const coverDist = () => {
    const halfW = BOARD_W / 2 + FRAME;
    const halfH = BOARD_H / 2 + FRAME;
    return Math.min(halfW / (tanHalf() * camera.aspect), halfH / tanHalf());
  };
  /** Distance at which the whole board (frame and planks included) fits on screen. */
  const containDist = () => Math.max(OUTER_HALF_W / (tanHalf() * camera.aspect), OUTER_HALF_H / tanHalf());
  const farthest = () => containDist() * ZOOM_OUT_MARGIN;
  const clampView = (v) => {
    v.d = MathUtils.clamp(v.d, MIN_DIST, farthest());
    const vis = visible(v.d);
    const mx = Math.max(BOARD_W / 2 + FRAME - vis.w / 2, 0);
    const my = Math.max(BOARD_H / 2 + FRAME - vis.h / 2, 0);
    v.x = MathUtils.clamp(v.x, -mx, mx);
    v.y = MathUtils.clamp(v.y, -my, my);
    return v;
  };

  // Intro: open close on the subject, then pull all the way back so the
  // whole board is in view (the furthest zoom).
  useEffect(() => {
    const v = view.current;
    const c = cur.current;
    c.x = v.x = rig.home.x;
    c.y = v.y = rig.home.y;
    c.d = v.d = coverDist() * 0.45;
    // the pull-back starts once the loader has finished
    let t;
    const unsubscribe = loading.subscribe(({ ready }) => {
      if (!ready || t) return;
      t = setTimeout(() => {
        v.x = 0;
        v.y = 0;
        v.d = farthest();
        v.lambda = 1.3;
        clampView(v);
      }, 450);
    });
    return () => {
      unsubscribe();
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  // Stay within limits when the viewport changes.
  useEffect(() => {
    clampView(view.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- helpers read live camera values
  }, [size.width, size.height]);

  // Input: drag, wheel, pinch.
  useEffect(() => {
    const el = gl.domElement;
    const pointers = new Map();
    let pinchDist = 0;

    const toNdc = (e) => {
      const r = el.getBoundingClientRect();
      return [((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1];
    };

    const onMove = (e) => {
      const [nx, ny] = toNdc(e);
      rig.pointer.set(nx, ny);
      rig.pointerActive = true;
      const p = pointers.get(e.pointerId);
      if (!p) return;
      const dx = e.clientX - p.x;
      const dy = e.clientY - p.y;
      p.x = e.clientX;
      p.y = e.clientY;
      const v = view.current;

      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinchDist) zoomBy(pinchDist / dist);
        pinchDist = dist;
        rig.dragging = true;
        return;
      }
      if (!p.moved) {
        if (Math.hypot(e.clientX - p.sx, e.clientY - p.sy) < 6) return; // still a click
        p.moved = true;
      }
      rig.dragging = true;
      const vis = visible(v.d);
      v.x -= (dx / size.width) * vis.w;
      v.y += (dy / size.height) * vis.h;
      v.lambda = 14;
      clampView(v);
    };

    const zoomBy = (factor) => {
      const v = view.current;
      const before = v.d;
      v.d *= factor;
      clampView(v);
      const k = 1 - v.d / before;
      v.x += (rig.cursor.x - v.x) * k;
      v.y += (rig.cursor.y - v.y) * k;
      v.lambda = 9;
      clampView(v);
    };

    const onDown = (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if (rig.reading) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY });
      if (pointers.size === 2) pinchDist = 0;
      const [nx, ny] = toNdc(e);
      rig.pointer.set(nx, ny);
      rig.pointerActive = true;
    };
    const onUp = (e) => {
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinchDist = 0;
      if (pointers.size === 0) {
        // let the click handler see `dragging` first, then reset
        setTimeout(() => (rig.dragging = false), 0);
      }
    };
    const onWheel = (e) => {
      e.preventDefault();
      if (rig.reading) return;
      const unit = e.deltaMode === 1 ? 16 : 1;
      zoomBy(Math.exp(e.deltaY * unit * (e.ctrlKey ? 0.01 : 0.0012)));
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- helpers read live camera values
  }, [gl, rig, size.width, size.height]);

  useFrame((_, dt) => {
    const v = view.current;
    const c = cur.current;
    const k = damp(v.lambda, Math.min(dt, 0.05));
    const prev = { ...c };
    c.x += (v.x - c.x) * k;
    c.y += (v.y - c.y) * k;
    c.d += (v.d - c.d) * k;

    camera.position.set(c.x, c.y, c.d);
    camera.lookAt(c.x, c.y, 0);

    // screen-space velocity → motion blur
    const vis = visible(c.d);
    const fps = 1 / Math.max(dt, 1 / 240);
    rig.blur.set(((c.x - prev.x) / vis.w) * (fps / 60), ((c.y - prev.y) / vis.h) * (fps / 60));
    rig.zoomBlur = ((prev.d - c.d) / c.d) * (fps / 60);

    // where on the board is the pointer?
    if (!rig.pointerActive) rig.cursor.copy(rig.home);
    else {
      ray.current.setFromCamera(rig.pointer, camera);
      if (ray.current.ray.intersectPlane(BOARD_PLANE, hit.current)) rig.cursor.copy(hit.current);
    }
  });

  return null;
}
