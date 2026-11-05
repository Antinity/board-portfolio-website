"use client";

import { useEffect, useRef, useState } from "react";
import { loading } from "@/three/loading";
import styles from "./loader.module.css";

/**
 * 0–100 loader. The number follows real progress (fonts, every painted
 * sheet, shader compile), eased so it counts up smoothly instead of jumping,
 * and never reaches 100 before the scene is actually ready.
 */
export default function Loader() {
  const [gone, setGone] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const numberRef = useRef(null);
  const barRef = useRef(null);

  useEffect(() => {
    let target = 0;
    let shown = 0;
    let ready = false;
    let raf = 0;
    let last = performance.now();
    const unsubscribe = loading.subscribe((s) => {
      target = (s.done / s.total) * 96 + (s.ready ? 4 : 0);
      ready = s.ready;
    });

    const tick = (now) => {
      const dt = Math.min(now - last, 64) / 1000;
      last = now;
      // ease toward the target, with a gentle floor speed so it never stalls
      shown = Math.min(target, shown + Math.max((target - shown) * (1 - Math.exp(-dt * 5)), dt * 6));
      const value = Math.floor(shown);
      if (numberRef.current) numberRef.current.textContent = String(value);
      if (barRef.current) barRef.current.style.transform = `scaleX(${shown / 100})`;
      if (ready && shown >= 100) {
        setLeaving(true);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      unsubscribe();
      cancelAnimationFrame(raf);
    };
  }, []);

  if (gone) return null;

  return (
    <div
      className={styles.loader}
      data-leaving={leaving || undefined}
      onTransitionEnd={() => leaving && setGone(true)}
      role="status"
      aria-live="polite"
      aria-label="Loading the board"
    >
      <p className={styles.number} aria-hidden="true">
        <span ref={numberRef}>0</span>
      </p>
      <div className={styles.track} aria-hidden="true">
        <div ref={barRef} className={styles.bar} />
      </div>
    </div>
  );
}
