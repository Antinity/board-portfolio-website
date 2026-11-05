"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { SECTIONS } from "@/data/boardLayout";
import { seeded } from "../painters/common";
import { UNIT, rectCenter } from "../space";

const MARKER_Z = 0.13;
const marker = new THREE.MeshStandardMaterial({ color: "#a8141b", roughness: 0.55 });
const hitMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false });

/** A loose, overshooting loop around a section, like a red marker circle. */
function markerGeometry(section) {
  const [cx, cy] = rectCenter(section.bounds);
  const rx = (section.bounds.w * UNIT) / 2 + 0.25;
  const ry = (section.bounds.h * UNIT) / 2 + 0.2;
  const r = seeded(section.id);
  const pts = [];
  const turns = 1.12;
  const steps = 22;
  const start = Math.PI * (0.9 + r() * 0.3);
  for (let i = 0; i <= steps; i++) {
    const a = start - (i / steps) * Math.PI * 2 * turns;
    const wobble = 1 + (r() - 0.5) * 0.05 + i * 0.002;
    pts.push(new THREE.Vector3(cx + Math.cos(a) * rx * wobble, cy + Math.sin(a) * ry * wobble, MARKER_Z));
  }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 220, 0.03, 5);
}

function Marker({ section, shown }) {
  const geometry = useMemo(() => markerGeometry(section), [section]);
  const progress = useRef(0);
  const total = geometry.index.count;

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((_, dt) => {
    const target = shown ? 1 : 0;
    progress.current += (target - progress.current) * (1 - Math.exp(-dt * (shown ? 3.5 : 9)));
    const count = Math.floor((progress.current * total) / 6) * 6;
    geometry.setDrawRange(0, count);
  });

  return <mesh geometry={geometry} material={marker} castShadow />;
}

/**
 * Invisible click/hover areas for each section, plus the marker loop drawn
 * around whichever is hovered or open.
 */
export default function SectionTargets({ rig, activeId, onSelect }) {
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    document.body.style.cursor = hovered ? "pointer" : "";
    return () => (document.body.style.cursor = "");
  }, [hovered]);

  return SECTIONS.map((section) => {
    const [cx, cy] = rectCenter(section.bounds);
    return (
      <group key={section.id}>
        <mesh
          position={[cx, cy, 0.2]}
          material={hitMaterial}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered(section.id);
          }}
          onPointerOut={() => setHovered((h) => (h === section.id ? null : h))}
          onClick={(e) => {
            e.stopPropagation();
            if (rig.dragging) return;
            onSelect(section.id);
          }}
        >
          <planeGeometry args={[section.bounds.w * UNIT, section.bounds.h * UNIT]} />
        </mesh>
        <Marker section={section} shown={hovered === section.id || activeId === section.id} />
      </group>
    );
  });
}
