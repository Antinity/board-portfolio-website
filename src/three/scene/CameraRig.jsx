"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { MathUtils, Plane, Raycaster, Vector2, Vector3 } from "three";
import { BOARD_H, BOARD_W, FRAME, OUTER_HALF_H, OUTER_HALF_W } from "../space";
import { damp } from "../rig";
import { loading } from "../loading";

const MIN_DIST = 2.6; // closest zoom
const ZOOM_OUT_MARGIN = 1.06; // furthest zoom: everything on the wall, with a little wall around it
const BOARD_PLANE = new Plane(new Vector3(0, 0, 1), 0);

const REST = new Vector2(0, 0.08); // where the torch is held on a touch screen (NDC)
const TORCH_MAX = 12.2; // widest torch cone (desktop)
const GLIDE_DECAY = 2.2; // per second: how quickly a flick slows down
const GLIDE_MAX = 60; // world units / second
const RUBBER = 0.33; // how much of a finger's travel passes the end of the board
const RUBBER_MAX = 0.15; // furthest past the end, as a fraction of the view

/** Phones and tablets: the board fills the screen and is panned sideways. */
const isFillMode = () => window.matchMedia("(pointer: coarse)").matches || window.innerWidth < window.innerHeight;

/**
 * Perspective camera over the board.
 *  - opens on the subject, then settles fully zoomed out; zoom in from there
 *  - drag to pan, wheel / pinch to zoom
 *  - input is paused while a page is being read
 *
 * On a phone ("fill" mode) the furthest zoom is the board filling the
 * screen edge to edge, and one finger swipes it sideways with momentum
 * and a rubber band at both ends.
 */
export default function CameraRig({ rig }) {
  const { camera, gl, size } = useThree();
  const view = useRef({ x: 0, y: 0, d: 30, lambda: 3 }); // target
  const cur = useRef({ x: 0, y: 0, d: 34 }); // smoothed
  const ray = useRef(new Raycaster());
  const hit = useRef(new Vector3());
  const fill = useRef(false);
  const gesture = useRef({ vel: { x: 0, y: 0 }, samples: [], down: false, moved: false, pinched: false, caught: false });

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
  const farthest = () => (fill.current ? coverDist() : containDist() * ZOOM_OUT_MARGIN);
  /** How far the view centre may travel at distance `d`. */
  const limits = (d) => {
    const vis = visible(d);
    const halfW = fill.current ? OUTER_HALF_W : BOARD_W / 2 + FRAME;
    return {
      vis,
      mx: Math.max(halfW - vis.w / 2, 0),
      my: Math.max(BOARD_H / 2 + FRAME - vis.h / 2, 0),
    };
  };
  /** Keep the target view in range; `slack` (fraction of the view) lets it stretch past the ends. */
  const clampView = (v, slack = 0) => {
    v.d = MathUtils.clamp(v.d, MIN_DIST, farthest());
    const { vis, mx, my } = limits(v.d);
    const sx = slack * vis.w;
    const sy = slack * vis.h;
    v.x = MathUtils.clamp(v.x, -mx - sx, mx + sx);
    v.y = MathUtils.clamp(v.y, -my - sy, my + sy);
    return v;
  };

  // Mode and torch size follow the viewport.
  useEffect(() => {
    fill.current = isFillMode();
    rig.fill = fill.current;
    if (rig.input === "mouse" && window.matchMedia("(pointer: coarse)").matches) rig.input = "touch";
    clampView(view.current);
    const vis = visible(farthest());
    rig.torchRadius = Math.min(TORCH_MAX, 0.65 * Math.min(vis.w, vis.h));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- helpers read live camera values
  }, [size.width, size.height]);

  // Intro: open close on the subject, then pull all the way back
  // (the whole board; on a phone, the board filling the screen).
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

  // Input: drag, flick, wheel, pinch.
  useEffect(() => {
    const el = gl.domElement;
    const g = gesture.current;
    const pointers = new Map();
    let pinch = null;

    const ndcOf = (x, y) => {
      const r = el.getBoundingClientRect();
      return [((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1];
    };
    const toNdc = (e) => ndcOf(e.clientX, e.clientY);
    const noteInput = (e) => {
      rig.input = e.pointerType === "touch" ? "touch" : "mouse";
    };

    /** Zoom the target view, keeping the board point under (cx, cy) in place. */
    const zoomAt = (factor, cx, cy) => {
      const v = view.current;
      const [nx, ny] = ndcOf(cx, cy);
      const before = visible(v.d);
      const px = v.x + (nx * before.w) / 2;
      const py = v.y + (ny * before.h) / 2;
      v.d *= factor;
      clampView(v);
      const after = visible(v.d);
      v.x = px - (nx * after.w) / 2;
      v.y = py - (ny * after.h) / 2;
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

    /** Past the end of the board a finger only moves the view a third as far. */
    const band = (pos, delta, lim) => ((pos < -lim && delta < 0) || (pos > lim && delta > 0) ? delta * RUBBER : delta);

    const onMove = (e) => {
      noteInput(e);
      const [nx, ny] = toNdc(e);
      rig.pointer.set(nx, ny);
      rig.pointerActive = true;
      const p = pointers.get(e.pointerId);
      if (!p) return;
      let dx = e.clientX - p.x;
      let dy = e.clientY - p.y;
      p.x = e.clientX;
      p.y = e.clientY;
      const v = view.current;
      const touch = e.pointerType === "touch";

      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2;
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinch) {
          const vis = visible(v.d);
          v.x -= ((mx - pinch.x) / size.width) * vis.w;
          v.y += ((my - pinch.y) / size.height) * vis.h;
          if (dist > 0) zoomAt(pinch.dist / dist, mx, my);
        }
        pinch = { x: mx, y: my, dist };
        v.lambda = 22;
        g.pinched = true;
        rig.dragging = true;
        return;
      }
      if (!p.moved) {
        if (Math.hypot(e.clientX - p.sx, e.clientY - p.sy) < (touch ? 8 : 6)) return; // still a tap
        p.moved = true;
        dx = e.clientX - p.sx; // include the distance spent deciding
        dy = e.clientY - p.sy;
      }
      g.moved = true;
      rig.dragging = true;
      const vis = visible(v.d);
      const wx = -(dx / size.width) * vis.w;
      const wy = (dy / size.height) * vis.h;
      if (fill.current) {
        const { mx, my } = limits(v.d);
        v.x += band(v.x, wx, mx);
        v.y += band(v.y, wy, my);
      } else {
        v.x += wx;
        v.y += wy;
      }
      v.lambda = touch ? 40 : 14;
      clampView(v, fill.current ? RUBBER_MAX : 0);
      if (touch) {
        g.samples.push({ t: e.timeStamp, x: wx, y: wy });
        if (g.samples.length > 12) g.samples.shift();
      }
    };

    const onDown = (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      noteInput(e);
      if (rig.reading) return;
      const v = view.current;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, moved: false });
      g.down = true;
      rig.touching = e.pointerType === "touch";
      if (pointers.size === 1) {
        g.moved = false;
        g.pinched = false;
        g.samples.length = 0;
        // a finger landing on a gliding board stops it dead, and is not a tap
        g.caught = Math.hypot(g.vel.x, g.vel.y) > 0.6;
        if (g.caught) {
          v.x = cur.current.x;
          v.y = cur.current.y;
          clampView(v, RUBBER_MAX);
        }
        g.vel.x = g.vel.y = 0;
      } else {
        pinch = null;
        g.pinched = true;
      }
      const [nx, ny] = toNdc(e);
      rig.pointer.set(nx, ny);
      rig.pointerActive = true;
    };

    const onUp = (e) => {
      const tracked = pointers.delete(e.pointerId);
      if (pointers.size < 2) pinch = null;
      if (pointers.size === 1) {
        // one finger left after a pinch: carry on as a drag, never as a tap
        const [rest] = pointers.values();
        rest.moved = true;
      }
      if (pointers.size > 0) return;

      g.down = false;
      rig.touching = false;
      if (tracked && e.pointerType === "touch" && g.moved && !g.pinched) {
        // flick: finger speed over the last ~100 ms becomes momentum
        const recent = g.samples.filter((s) => e.timeStamp - s.t < 100);
        const last = recent[recent.length - 1];
        if (last && e.timeStamp - last.t < 60) {
          const span = MathUtils.clamp(last.t - recent[0].t + 16.7, 30, 120) / 1000;
          const vx = recent.reduce((n, s) => n + s.x, 0) / span;
          const vy = recent.reduce((n, s) => n + s.y, 0) / span;
          const speed = Math.hypot(vx, vy);
          if (speed > 1.5) {
            const k = Math.min(1, GLIDE_MAX / speed);
            g.vel.x = vx * k;
            g.vel.y = vy * k;
          }
        }
      }
      if (g.moved || g.pinched || g.caught || rig.dragging) rig.suppressClickUntil = performance.now() + 350;
      rig.dragging = false;
      g.moved = g.pinched = g.caught = false;
    };

    const onWheel = (e) => {
      e.preventDefault();
      if (rig.reading) return;
      const unit = e.deltaMode === 1 ? 16 : 1;
      if (fill.current && (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY))) {
        // sideways scroll (trackpad, shift + wheel) pans along the board
        const v = view.current;
        const along = e.shiftKey && !e.deltaX ? e.deltaY : e.deltaX;
        v.x += ((along * unit) / size.width) * visible(v.d).w;
        v.lambda = 14;
        clampView(v);
        return;
      }
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

  useFrame((_, rawDt) => {
    const v = view.current;
    const c = cur.current;
    const g = gesture.current;
    const dt = Math.min(rawDt, 0.05);

    if (!g.down) {
      if (g.vel.x !== 0 || g.vel.y !== 0) {
        // a flick glides on, slowing down, and stops softly at the ends of the board
        v.x += g.vel.x * dt;
        v.y += g.vel.y * dt;
        const decay = Math.exp(-GLIDE_DECAY * dt);
        const { mx, my } = limits(v.d);
        const past = Math.abs(v.x) > mx || Math.abs(v.y) > my;
        const drag = past ? decay * Math.exp(-14 * dt) : decay;
        g.vel.x *= drag;
        g.vel.y *= drag;
        if (Math.hypot(g.vel.x, g.vel.y) < 0.4) g.vel.x = g.vel.y = 0;
        clampView(v, RUBBER_MAX * 0.5);
      }
      if (g.vel.x === 0 && g.vel.y === 0) {
        // at rest: spring back from any stretch past the ends
        const { mx, my } = limits(v.d);
        if (Math.abs(v.x) > mx || Math.abs(v.y) > my) v.lambda = 10;
        clampView(v);
      }
    }

    const k = damp(v.lambda, dt);
    const prev = { ...c };
    c.x += (v.x - c.x) * k;
    c.y += (v.y - c.y) * k;
    c.d += (v.d - c.d) * k;

    camera.position.set(c.x, c.y, c.d);
    camera.lookAt(c.x, c.y, 0);

    // screen-space velocity → motion blur
    const vis = visible(c.d);
    const fps = 1 / Math.max(rawDt, 1 / 240);
    rig.blur.set(((c.x - prev.x) / vis.w) * (fps / 60), ((c.y - prev.y) / vis.h) * (fps / 60));
    rig.zoomBlur = ((prev.d - c.d) / c.d) * (fps / 60);
    rig.speed = Math.hypot(c.x - prev.x, c.y - prev.y, (c.d - prev.d) * 0.5) / Math.max(rawDt, 1 / 240);

    // where on the board is the torch held? On a phone it rests ahead of you
    // unless a finger is down; with a mouse it is the pointer.
    const resting = rig.input === "touch" && !rig.touching;
    if (!resting && !rig.pointerActive) rig.cursor.copy(rig.home);
    else {
      ray.current.setFromCamera(resting ? REST : rig.pointer, camera);
      if (ray.current.ray.intersectPlane(BOARD_PLANE, hit.current)) rig.cursor.copy(hit.current);
    }
  });

  return null;
}
