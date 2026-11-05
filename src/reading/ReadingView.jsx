"use client";

import { useEffect, useRef, useState } from "react";
import { SECTIONS } from "@/data/boardLayout";
import { transcriptFor } from "./transcripts";
import styles from "./reading.module.css";

/**
 * The text side of the reading screen. The page itself is held up in the
 * 3D scene; this shows its transcript (with working links) and the controls.
 * On narrow screens the transcript is behind a toggle, like in games.
 *
 * Keyboard: Esc puts the page back, ← / → read the previous / next document.
 */
export default function ReadingView({ item, index, total, onClose, onPrev, onNext }) {
  const [showText, setShowText] = useState(false);
  const closeRef = useRef(null);
  const open = Boolean(item);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") onPrev();
      else if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, onPrev, onNext]);

  useEffect(() => {
    if (item) closeRef.current?.focus({ preventScroll: true });
  }, [item]);

  const transcript = item ? transcriptFor(item) : null;
  const section = item ? SECTIONS[item.section] : null;

  return (
    <div className={styles.root} data-open={open || undefined} data-text={showText || undefined} aria-hidden={!open} inert={!open}>
      {item && (
        <>
          <article key={item.id} className={styles.transcript} aria-live="polite">
            {section && (
              <p className={styles.kicker}>
                Exhibit {section.exhibit} · {section.title}
              </p>
            )}
            <h2 className={styles.title}>{transcript.title}</h2>
            <div className={styles.body}>{transcript.body}</div>
          </article>

          <nav className={styles.controls} aria-label="Document controls">
            <button type="button" onClick={onPrev} aria-label="Previous document">
              ←
            </button>
            <span className={styles.count}>
              {index + 1} / {total}
            </span>
            <button type="button" onClick={onNext} aria-label="Next document">
              →
            </button>
            <button type="button" className={styles.textToggle} onClick={() => setShowText((v) => !v)} aria-pressed={showText}>
              {showText ? "Hide text" : "Read text"}
            </button>
            <button ref={closeRef} type="button" onClick={onClose}>
              Put back <kbd>Esc</kbd>
            </button>
          </nav>
        </>
      )}
    </div>
  );
}
