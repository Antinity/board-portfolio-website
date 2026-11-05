"use client";

import { useState } from "react";
import { caseInfo } from "@/data/content";
import styles from "./hud.module.css";

/**
 * Screen-space UI: case title, exhibit index, zoom + flashlight controls, hint.
 */
export default function Hud({ sections, activeId, onSelect, onOverview, onZoom, flashlightOn, onToggleFlashlight, hidden }) {
  const [indexOpen, setIndexOpen] = useState(false);

  return (
    <div className={styles.hud} data-hidden={hidden || undefined}>
      <header className={styles.title}>
        <span className={styles.caseNo}>Case № {caseInfo.caseNumber}</span>
        <button type="button" className={styles.name} onClick={onOverview}>
          {caseInfo.name}
        </button>
        <span className={styles.role}>{caseInfo.title}</span>
      </header>

      <nav className={styles.index} data-open={indexOpen || undefined} aria-label="Exhibits">
        <button type="button" className={styles.indexToggle} aria-expanded={indexOpen} onClick={() => setIndexOpen((v) => !v)}>
          Exhibits
        </button>
        <ol className={styles.indexList}>
          {sections.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                aria-current={s.id === activeId || undefined}
                onClick={() => {
                  setIndexOpen(false);
                  onSelect(s.id);
                }}
              >
                <span>{s.exhibit}</span>
                {s.title}
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <div className={styles.tools}>
        <button type="button" onClick={() => onZoom(1.35)} aria-label="Zoom in">
          +
        </button>
        <button type="button" onClick={() => onZoom(1 / 1.35)} aria-label="Zoom out">
          −
        </button>
        <button type="button" onClick={onOverview} aria-label="Show whole board">
          ⤢
        </button>
        <button type="button" onClick={onToggleFlashlight} aria-pressed={flashlightOn} className={styles.torch}>
          {flashlightOn ? "Lights on" : "Flashlight"} <kbd>F</kbd>
        </button>
      </div>

      <p className={styles.hint}>Drag to explore · Scroll to zoom · Click evidence to open</p>
    </div>
  );
}
