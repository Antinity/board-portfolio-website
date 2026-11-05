"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { READABLE, SECTIONS } from "@/data/boardLayout";
import { subject } from "@/data/content";
import { transcriptFor } from "@/reading/transcripts";
import ReadingView from "@/reading/ReadingView";

// WebGL only runs in the browser.
const Experience = dynamic(() => import("@/three/Experience"), { ssr: false });

/**
 * Where a page is held while reading, as fractions of the visible area.
 * Wide screens leave the right side free for the transcript (see reading.module.css).
 */
function readLayoutFor(width) {
  return width >= 900 ? { shift: -0.17, height: 0.8, width: 0.52 } : { shift: 0, height: 0.7, width: 0.9 };
}

/**
 * App shell: which page is being read, torch on/off, and keyboard access.
 * No HUD — the board is the interface.
 *
 * Keyboard: ← / → step through documents while reading, Esc puts it back,
 * F toggles the torch. A visually hidden list gives screen readers and
 * keyboard users a way into every document.
 */
export default function InvestigationBoard() {
  const [readingId, setReadingId] = useState(null);
  const [torchOn, setTorchOn] = useState(true);
  const [readLayout, setReadLayout] = useState(() => readLayoutFor(1280));

  const index = READABLE.findIndex((i) => i.id === readingId);
  const reading = READABLE[index] ?? null;

  const close = useCallback(() => setReadingId(null), []);
  const step = useCallback(
    (dir) =>
      setReadingId((id) => {
        const i = READABLE.findIndex((it) => it.id === id);
        return READABLE[(i + dir + READABLE.length) % READABLE.length].id;
      }),
    []
  );
  const prev = useCallback(() => step(-1), [step]);
  const next = useCallback(() => step(1), [step]);

  useEffect(() => {
    const measure = () => setReadLayout(readLayoutFor(window.innerWidth));
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.target.closest?.("input, textarea, [contenteditable]")) return;
      if (e.key === "f" || e.key === "F") setTorchOn((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <h1 className="sr-only">
        {subject.name} ({subject.alias}) — {subject.role}
      </h1>

      <Experience readingId={readingId} onRead={setReadingId} onClose={close} torchOn={torchOn} readLayout={readLayout} />

      <nav className="sr-only" aria-label="Documents on the board">
        <ul>
          {READABLE.map((item) => (
            <li key={item.id}>
              <button type="button" onClick={() => setReadingId(item.id)}>
                {SECTIONS[item.section]?.title}: {transcriptFor(item).title}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <ReadingView item={reading} index={index} total={READABLE.length} onClose={close} onPrev={prev} onNext={next} />
    </>
  );
}
