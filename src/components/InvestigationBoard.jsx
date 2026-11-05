"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SECTIONS } from "@/sections";
import Board from "@/components/board/Board";
import Flashlight from "@/components/flashlight/Flashlight";
import CaseFile from "@/components/case-file/CaseFile";
import Hud from "@/components/hud/Hud";

/**
 * App shell: owns which exhibit is open and whether the torch is on, and wires
 * the board, flashlight, case-file panel and HUD together.
 */
export default function InvestigationBoard() {
  const boardRef = useRef(null);
  const [activeId, setActiveId] = useState(null);
  const [flashlightOn, setFlashlightOn] = useState(true);

  const activeIndex = SECTIONS.findIndex((s) => s.id === activeId);
  const activeSection = SECTIONS[activeIndex] ?? null;

  const close = useCallback(() => setActiveId(null), []);
  const step = useCallback(
    (dir) => setActiveId((id) => {
      const i = SECTIONS.findIndex((s) => s.id === id);
      return SECTIONS[(i + dir + SECTIONS.length) % SECTIONS.length].id;
    }),
    []
  );
  const prev = useCallback(() => step(-1), [step]);
  const next = useCallback(() => step(1), [step]);

  const overview = useCallback(() => {
    if (activeId) setActiveId(null);
    else boardRef.current?.fitAll();
  }, [activeId]);

  // Global shortcuts: F = flashlight, 1–9 = jump to exhibit.
  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.target.closest?.("input, textarea, [contenteditable]")) return;
      if (e.key === "f" || e.key === "F") setFlashlightOn((v) => !v);
      const n = Number(e.key);
      if (n >= 1 && n <= SECTIONS.length) setActiveId(SECTIONS[n - 1].id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <h1 className="sr-only">Portfolio investigation board</h1>
      <Board ref={boardRef} activeId={activeId} onSelect={setActiveId} />
      <Flashlight on={flashlightOn} ambient={activeSection ? 1 : 0} />
      <Hud
        sections={SECTIONS}
        activeId={activeId}
        onSelect={setActiveId}
        onOverview={overview}
        onZoom={(f) => boardRef.current?.zoomBy(f)}
        flashlightOn={flashlightOn}
        onToggleFlashlight={() => setFlashlightOn((v) => !v)}
        hidden={Boolean(activeSection)}
      />
      <CaseFile section={activeSection} onClose={close} onPrev={prev} onNext={next} />
    </>
  );
}
