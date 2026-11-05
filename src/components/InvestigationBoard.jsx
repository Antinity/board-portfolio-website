"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { SECTIONS } from "@/sections";
import { subject } from "@/data/content";
import { panelInset } from "@/lib/panel";
import CaseFile from "@/components/case-file/CaseFile";

// WebGL only runs in the browser.
const Experience = dynamic(() => import("@/three/Experience"), { ssr: false });

/**
 * App shell: owns which exhibit is open and whether the torch is on, and wires
 * the 3D board to the case-file panel. No HUD — the board is the interface.
 *
 * Keyboard: 1–7 open an exhibit, ← / → step through, Esc closes, F toggles the torch.
 */
export default function InvestigationBoard() {
  const [activeId, setActiveId] = useState(null);
  const [torchOn, setTorchOn] = useState(true);
  const [inset, setInset] = useState(0);

  const active = SECTIONS.find((s) => s.id === activeId) ?? null;

  const close = useCallback(() => setActiveId(null), []);
  const step = useCallback(
    (dir) =>
      setActiveId((id) => {
        const i = SECTIONS.findIndex((s) => s.id === id);
        return SECTIONS[(i + dir + SECTIONS.length) % SECTIONS.length].id;
      }),
    []
  );
  const prev = useCallback(() => step(-1), [step]);
  const next = useCallback(() => step(1), [step]);

  useEffect(() => {
    const measure = () => setInset(panelInset(window.innerWidth));
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.target.closest?.("input, textarea, [contenteditable]")) return;
      if (e.key === "f" || e.key === "F") setTorchOn((v) => !v);
      const n = Number(e.key);
      if (n >= 1 && n <= SECTIONS.length) setActiveId(SECTIONS[n - 1].id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <h1 className="sr-only">
        {subject.name} ({subject.alias}) — {subject.role}
      </h1>

      <Experience activeId={activeId} focus={active?.bounds ?? null} insetRight={active ? inset : 0} onSelect={setActiveId} torchOn={torchOn} />

      {/* Screen-reader / keyboard route into every exhibit */}
      <nav className="sr-only" aria-label="Exhibits">
        <ul>
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <button type="button" onClick={() => setActiveId(s.id)}>
                Exhibit {s.exhibit}: {s.title}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <CaseFile section={active} onClose={close} onPrev={prev} onNext={next} />
    </>
  );
}
