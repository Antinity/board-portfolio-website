"use client";

import { useEffect, useImperativeHandle, useMemo, useRef } from "react";
import { CENTER_CARD, CROSS_LINKS, WORLD, anchorPoint, sectionById } from "@/data/boardLayout";
import { SECTIONS } from "@/sections";
import { useBoardCamera } from "@/hooks/useBoardCamera";
import { panelInset } from "@/lib/panel";
import Cluster from "./Cluster";
import CaseCard from "./CaseCard";
import RedStrings from "./RedStrings";
import styles from "./board.module.css";

const WORLD_RECT = { x: -WORLD.frame, y: -WORLD.frame, w: WORLD.width + WORLD.frame * 2, h: WORLD.height + WORLD.frame * 2 };

function buildLinks() {
  const center = anchorPoint(CENTER_CARD);
  return [
    ...SECTIONS.map((s) => ({ from: center, to: anchorPoint(s) })),
    ...CROSS_LINKS.filter(([a, b]) => sectionById[a] && sectionById[b]).map(([a, b]) => ({
      from: anchorPoint(sectionById[a]),
      to: anchorPoint(sectionById[b]),
    })),
  ];
}

/**
 * The investigation board: cork + frame, every section cluster, the case card
 * and the red strings, inside a pan / zoom camera.
 *
 * Imperative API (via `ref`): fitAll(), zoomBy(factor)
 *
 * @param {string|null} activeId  section to fly to (null = whole board)
 * @param {(id: string) => void} onSelect
 */
export default function Board({ ref, activeId, onSelect }) {
  const viewportRef = useRef(null);
  const worldRef = useRef(null);
  const activeRef = useRef(activeId);
  const links = useMemo(() => buildLinks(), []);

  const frameActive = (animate = true) => {
    const section = sectionById[activeRef.current];
    if (section) camera.focusRect(section.bounds, { insetRight: panelInset(window.innerWidth), padding: 48, duration: animate ? 1100 : 1 });
    else camera.fitAll({ animate, duration: 1000 });
  };

  const camera = useBoardCamera({
    viewportRef,
    worldRef,
    worldRect: WORLD_RECT,
    onResize: () => frameActive(false),
  });

  useImperativeHandle(ref, () => ({ fitAll: () => camera.fitAll(), zoomBy: camera.zoomBy }), [camera]);

  // Intro: start close on the case card, then pull back to reveal the board.
  useEffect(() => {
    camera.setView(camera.viewForRect(CENTER_CARD.bounds, { padding: 80 }));
    const t = setTimeout(() => camera.fitAll({ duration: 2200 }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  useEffect(() => {
    if (activeRef.current === activeId) return;
    activeRef.current = activeId;
    frameActive();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- frameActive reads refs
  }, [activeId]);

  return (
    <div ref={viewportRef} className={styles.viewport}>
      <div ref={worldRef} className={styles.world} style={{ width: WORLD.width, height: WORLD.height, "--frame": `${WORLD.frame}px` }}>
        <div className={styles.frame} aria-hidden="true" />
        <div className={styles.cork} aria-hidden="true" />
        {SECTIONS.map((section) => (
          <Cluster key={section.id} section={section} active={section.id === activeId} onSelect={onSelect} />
        ))}
        <CaseCard />
        <RedStrings links={links} />
      </div>
    </div>
  );
}
