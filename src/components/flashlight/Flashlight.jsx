"use client";

import { useEffect, useRef } from "react";
import styles from "./flashlight.module.css";

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

/** Tunables — tweak these to change the feel of the light. */
const CONFIG = {
  darkness: 0.94, // room darkness with the torch on (0–1)
  lightsOnDarkness: 0.22, // room darkness with the torch off
  follow: 9, // how quickly the beam catches the pointer (higher = snappier)
  sway: 1, // hand-held wobble amplitude
  maxStretch: 0.22, // beam elongation when moving fast
  flickerChance: 0.06, // flickers per second (on average)
  dustCount: 70,
  warm: [255, 238, 212], // beam colour
};

const BEAM_STOPS = [
  // [position, alpha] — reflector rings: hot centre, soft plateau, bright rim, long falloff
  [0, 1],
  [0.38, 0.97],
  [0.52, 0.9],
  [0.6, 0.94],
  [0.68, 0.78],
  [0.76, 0.46],
  [0.86, 0.18],
  [1, 0],
];

function makeDust(count, w, h) {
  return Array.from({ length: count }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    r: 0.5 + Math.random() * 1.4,
    vx: (Math.random() - 0.5) * 10,
    vy: (Math.random() - 0.3) * 6,
    phase: Math.random() * Math.PI * 2,
  }));
}

/**
 * Full-screen darkness with a realistic hand-held torch following the pointer.
 *
 * @param {boolean} on       torch on (dark room) or off (dim room light)
 * @param {number} ambient   0–1 extra room light, e.g. while reading a case file
 */
export default function Flashlight({ on = true, ambient = 0 }) {
  const shadowRef = useRef(null);
  const glowRef = useRef(null);
  const props = useRef({ on, ambient });

  useEffect(() => {
    props.current = { on, ambient };
  }, [on, ambient]);

  useEffect(() => {
    const shadow = shadowRef.current;
    const glow = glowRef.current;
    const sctx = shadow.getContext("2d");
    const gctx = glow.getContext("2d");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    let w = 0;
    let h = 0;
    let dpr = 1;
    let radius = 200;
    let dust = [];

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      for (const c of [shadow, glow]) {
        c.width = Math.round(w * dpr);
        c.height = Math.round(h * dpr);
      }
      radius = clamp(Math.hypot(w, h) * 0.17, 160, 360);
      dust = makeDust(CONFIG.dustCount, w, h);
    };
    resize();

    const target = { x: w / 2, y: h / 2 };
    const pos = { ...target };
    const prevBeam = { ...target };
    const vel = { x: 0, y: 0 };
    let intensity = 0;
    let darkness = CONFIG.darkness;
    let flickerUntil = 0;
    let last = performance.now();
    let raf = 0;

    const onPointer = (e) => {
      target.x = e.clientX;
      target.y = e.clientY;
    };

    const drawBeam = (ctx, x, y, angle, stretch, stops) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.scale(1 + stretch, 1 - stretch * 0.35);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
      stops.forEach(([at, color]) => g.addColorStop(at, color));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const frame = (now) => {
      const dt = Math.min(now - last, 50) / 1000;
      last = now;
      const t = now / 1000;
      const calm = reduceMotion.matches;
      const { on: isOn, ambient: amb } = props.current;

      // --- motion: lagged follow + hand sway ---
      const k = 1 - Math.exp(-dt * CONFIG.follow);
      pos.x += (target.x - pos.x) * k;
      pos.y += (target.y - pos.y) * k;
      const sway = calm ? 0 : CONFIG.sway;
      const bx = pos.x + (Math.sin(t * 1.7) * 2.2 + Math.sin(t * 0.63 + 1.3) * 3.6 + Math.sin(t * 3.3) * 0.7) * sway;
      const by = pos.y + (Math.cos(t * 1.3) * 2.0 + Math.sin(t * 0.47 + 0.4) * 3.4 + Math.cos(t * 2.9) * 0.7) * sway;

      if (dt > 0) {
        vel.x += ((bx - prevBeam.x) / dt - vel.x) * 0.2;
        vel.y += ((by - prevBeam.y) / dt - vel.y) * 0.2;
      }
      prevBeam.x = bx;
      prevBeam.y = by;
      const speed = Math.hypot(vel.x, vel.y);
      const angle = Math.atan2(vel.y, vel.x);
      const stretch = calm ? 0 : Math.min(speed / 4000, CONFIG.maxStretch);

      // --- intensity: on/off fade, flicker, electrical hum ---
      intensity += ((isOn ? 1 : 0) - intensity) * (1 - Math.exp(-dt * 6));
      const targetDark = isOn ? CONFIG.darkness - amb * 0.3 : CONFIG.lightsOnDarkness;
      darkness += (targetDark - darkness) * (1 - Math.exp(-dt * 4));

      if (!calm && isOn && Math.random() < dt * CONFIG.flickerChance) flickerUntil = now + 90 + Math.random() * 260;
      const flicker = now < flickerUntil ? 0.45 + Math.random() * 0.55 : 1;
      const hum = calm ? 1 : 0.985 + 0.015 * Math.sin(t * 31) * Math.sin(t * 7.3);
      const I = intensity * flicker * hum;

      // --- darkness layer ---
      sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sctx.globalCompositeOperation = "source-over";
      sctx.clearRect(0, 0, w, h);
      sctx.fillStyle = `rgba(3, 4, 7, ${darkness})`;
      sctx.fillRect(0, 0, w, h);

      gctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      gctx.clearRect(0, 0, w, h);

      if (I > 0.005) {
        sctx.globalCompositeOperation = "destination-out";

        // wide, faint spill / bounce light
        const spill = sctx.createRadialGradient(bx, by, 0, bx, by, radius * 2.4);
        spill.addColorStop(0, `rgba(0,0,0,${0.22 * I})`);
        spill.addColorStop(0.45, `rgba(0,0,0,${0.06 * I})`);
        spill.addColorStop(1, "rgba(0,0,0,0)");
        sctx.fillStyle = spill;
        sctx.fillRect(0, 0, w, h);

        // main beam
        drawBeam(sctx, bx, by, angle, stretch, BEAM_STOPS.map(([at, a]) => [at, `rgba(0,0,0,${a * I})`]));

        // dust motes caught in the beam
        sctx.globalCompositeOperation = "source-over";
        const [r, g, b] = CONFIG.warm;
        for (const d of dust) {
          if (!calm) {
            d.x += (d.vx + Math.sin(t * 0.7 + d.phase) * 4) * dt;
            d.y += (d.vy + Math.cos(t * 0.5 + d.phase) * 3) * dt;
            if (d.x < 0) d.x += w;
            if (d.x > w) d.x -= w;
            if (d.y < 0) d.y += h;
            if (d.y > h) d.y -= h;
          }
          const falloff = 1 - Math.hypot(d.x - bx, d.y - by) / radius;
          if (falloff <= 0) continue;
          const twinkle = 0.6 + 0.4 * Math.sin(t * 2 + d.phase * 3);
          sctx.fillStyle = `rgba(${r},${g},${b},${falloff * falloff * 0.5 * twinkle * I})`;
          sctx.beginPath();
          sctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
          sctx.fill();
        }

        // warm hotspot + reflector ring (blended with "overlay" via CSS)
        const c = (a) => `rgba(${r},${g},${b},${a * I})`;
        drawBeam(gctx, bx, by, angle, stretch, [
          [0, c(0.6)],
          [0.3, c(0.42)],
          [0.5, c(0.2)],
          [0.56, `rgba(0,0,0,${0.05 * I})`],
          [0.66, c(0.26)],
          [0.78, c(0.08)],
          [1, c(0)],
        ]);
      }

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("pointerdown", onPointer, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, []);

  return (
    <>
      <canvas ref={glowRef} className={`${styles.layer} ${styles.glow}`} aria-hidden="true" />
      <canvas ref={shadowRef} className={`${styles.layer} ${styles.shadow}`} aria-hidden="true" />
      <div className={`${styles.layer} ${styles.grain}`} aria-hidden="true" />
    </>
  );
}
