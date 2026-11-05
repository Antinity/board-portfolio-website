"use client";

import { useEffect, useRef } from "react";
import { caseInfo } from "@/data/content";
import { Stamp } from "@/components/evidence";
import styles from "./caseFile.module.css";

/**
 * Manila case folder that slides in with a section's full content.
 * Keyboard: Esc closes, ← / → move between sections.
 */
export default function CaseFile({ section, onClose, onPrev, onNext }) {
  const bodyRef = useRef(null);
  const closeRef = useRef(null);
  const open = Boolean(section);

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

  // New section: scroll to top and move focus into the panel.
  useEffect(() => {
    if (!section) return;
    bodyRef.current?.scrollTo({ top: 0 });
    closeRef.current?.focus({ preventScroll: true });
  }, [section]);

  const File = section?.File;

  return (
    <aside className={styles.panel} data-open={open || undefined} aria-hidden={!open} aria-label={section ? `Exhibit ${section.exhibit}: ${section.title}` : undefined} inert={!open}>
      <div className={styles.tab}>
        {section && (
          <>
            Exhibit {section.exhibit} <span>— {section.title}</span>
          </>
        )}
      </div>

      <div className={styles.folder}>
        <div className={styles.sheet} ref={bodyRef}>
          <header className={styles.header}>
            <div>
              <div className={styles.caseNo}>
                Case № {caseInfo.caseNumber} · Exhibit {section?.exhibit}
              </div>
              <h2 className={styles.title}>{section?.title}</h2>
            </div>
            <Stamp rotate={8}>Confidential</Stamp>
          </header>

          <div className={styles.body}>{File && <File />}</div>
        </div>

        <nav className={styles.controls}>
          <button type="button" onClick={onPrev} aria-label="Previous exhibit">
            ← Prev
          </button>
          <button type="button" onClick={onNext} aria-label="Next exhibit">
            Next →
          </button>
          <button ref={closeRef} type="button" className={styles.close} onClick={onClose} aria-label="Close file and return to board">
            ✕ Back to board
          </button>
        </nav>
      </div>
    </aside>
  );
}
