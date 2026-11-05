"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { READABLE, SECTIONS, WRITTEN } from "@/data/boardLayout";
import { contact, socials, subject } from "@/data/content";
import { transcriptFor } from "@/reading/transcripts";
import ReadingView from "@/reading/ReadingView";
import Loader from "@/components/Loader";
import Toast from "@/components/Toast";

// WebGL only runs in the browser. The 3D code starts downloading as soon as
// this module runs in the browser, rather than after the page has hydrated.
const loadExperience = () => import("@/three/Experience");
if (typeof window !== "undefined") loadExperience();
const Experience = dynamic(loadExperience, { ssr: false });

/** Where a page is held while reading, as fractions of the visible area (centred). */
function readLayoutFor(width) {
  return width >= 900 ? { shift: 0, height: 0.84, width: 0.8 } : { shift: 0, height: 0.74, width: 0.92 };
}

/**
 * App shell: which page is being read, torch on/off, and keyboard access.
 * No HUD — the board is the interface.
 *
 * The torch is the cursor (the system cursor is hidden over the board).
 * Keyboard: ← / → step through documents while reading, Esc puts it back,
 * F toggles the torch. A visually hidden list gives screen readers and
 * keyboard users a way into every document.
 */
export default function InvestigationBoard() {
  const [readingId, setReadingId] = useState(null);
  // ?torch=off starts with the torch switched off (used to take the share image)
  const [torchOn, setTorchOn] = useState(() => typeof window === "undefined" || new URLSearchParams(window.location.search).get("torch") !== "off");
  const [readLayout, setReadLayout] = useState(() => readLayoutFor(1280));

  const holdsEntry = useRef(false); // a history entry was added for the held page
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

  // The held page gets its own history entry, so a phone's back swipe or
  // button puts the page back instead of leaving the site.
  const isReading = readingId !== null;
  useEffect(() => {
    if (!isReading) return;
    window.history.pushState({ reading: true }, "");
    holdsEntry.current = true;
    const onPop = () => {
      holdsEntry.current = false;
      setReadingId(null);
    };
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      if (holdsEntry.current) {
        holdsEntry.current = false;
        window.history.back(); // put back by tap or Esc: drop the entry we added
      }
    };
  }, [isReading]);

  // No page zoom (iOS pinch) and no long-press menu over the board.
  useEffect(() => {
    const stop = (e) => e.preventDefault();
    const onMenu = (e) => {
      if (e.target instanceof HTMLCanvasElement) e.preventDefault();
    };
    document.addEventListener("gesturestart", stop, { passive: false });
    document.addEventListener("contextmenu", onMenu);
    return () => {
      document.removeEventListener("gesturestart", stop);
      document.removeEventListener("contextmenu", onMenu);
    };
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
        <ul>
          <li>
            <a href={`mailto:${contact.email}`}>Email {contact.email}</a>
          </li>
          {socials
            .filter((s) => s.url)
            .map((s) => (
              <li key={s.id}>
                <a href={s.url} target="_blank" rel="noopener noreferrer">
                  {s.label}
                </a>
              </li>
            ))}
        </ul>
      </nav>

      <section className="sr-only" aria-label="Written on the board">
        {WRITTEN.map((item) => {
          const { title, body } = transcriptFor(item);
          return (
            <article key={item.id}>
              <h2>{title}</h2>
              {body}
            </article>
          );
        })}
      </section>

      <ReadingView item={reading} onClose={close} onPrev={prev} onNext={next} />
      <Toast />
      <Loader />
    </>
  );
}
