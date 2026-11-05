"use client";

import { useEffect } from "react";
import { transcriptFor } from "./transcripts";

/**
 * Reading mode has no visible UI — the page itself is the interface, held up
 * in the 3D scene. This component only handles the keyboard and gives
 * screen readers the page's text.
 *
 * Keyboard: Esc puts the page back, ← / → read the previous / next document.
 * Pointer: clicking anywhere off the page puts it back (see ReadingBackdrop).
 */
export default function ReadingView({ item, onClose, onPrev, onNext }) {
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

  const transcript = item ? transcriptFor(item) : null;

  return (
    <div className="sr-only" aria-live="polite">
      {transcript && (
        <article>
          <h2>{transcript.title}</h2>
          {transcript.body}
          <p>Press Escape to put it back.</p>
        </article>
      )}
    </div>
  );
}
