"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { makeCanvas, rng } from "../textures/procedural";

/* Magnets and masking tape. Geometry/materials are shared across instances. */

const PIN_COLORS = ["#c3242c", "#2557c4", "#2c9a4a", "#e0b52a", "#e8e5dc", "#1d1d1f"];

/** A round whiteboard magnet: a short disc with a softly rounded top. */
const magnetGeometry = (() => {
  const body = new THREE.CylinderGeometry(0.085, 0.09, 0.05, 28).rotateX(Math.PI / 2).translate(0, 0, 0.025);
  const top = new THREE.SphereGeometry(0.085, 28, 8, 0, Math.PI * 2, 0, Math.PI * 0.18).rotateX(Math.PI / 2).translate(0, 0, 0.05 - 0.085 * Math.cos(Math.PI * 0.18));
  return mergeGeometries([body.toNonIndexed(), top.toNonIndexed()]);
})();

const magnetMaterials = new Map();
function magnetMaterial(color) {
  if (!magnetMaterials.has(color)) {
    magnetMaterials.set(color, new THREE.MeshStandardMaterial({ color, roughness: 0.62 }));
  }
  return magnetMaterials.get(color);
}

/** A magnet holding paper at world `position` ([x, y, z of surface]). */
export function Pin({ position, color = 0 }) {
  const mat = magnetMaterial(typeof color === "number" ? PIN_COLORS[color % PIN_COLORS.length] : color);
  return <mesh geometry={magnetGeometry} material={mat} position={position} castShadow />;
}

let tapeTexture = null;
function getTapeTexture() {
  if (tapeTexture) return tapeTexture;
  const cv = makeCanvas(256, 80);
  const c = cv.getContext("2d");
  const r = rng(5);
  c.beginPath();
  c.moveTo(0, 0);
  for (let x = 0; x <= 256; x += 8) c.lineTo(x, r() * 5);
  for (let y = 0; y <= 80; y += 6) c.lineTo(256 - r() * 6, y);
  for (let x = 256; x >= 0; x -= 8) c.lineTo(x, 80 - r() * 5);
  for (let y = 80; y >= 0; y -= 6) c.lineTo(r() * 6, y);
  c.closePath();
  c.fillStyle = "rgba(236,226,196,0.78)";
  c.fill();
  c.globalCompositeOperation = "source-atop";
  for (let i = 0; i < 400; i++) {
    c.fillStyle = `rgba(255,255,255,${r() * 0.08})`;
    c.fillRect(r() * 256, r() * 80, 2, 1);
  }
  tapeTexture = new THREE.CanvasTexture(cv);
  tapeTexture.colorSpace = THREE.SRGBColorSpace;
  return tapeTexture;
}

/**
 * Strip of masking tape across a paper edge. `position` is the hinge — the
 * point on the paper's edge the tape straddles. The half stuck to the cork
 * sits on a pivot (`peelRef`) so it can be peeled up when the page is taken.
 */
export function Tape({ position, rot = 0, width = 1, peelRef }) {
  const map = useMemo(() => getTapeTexture(), []);
  const h = width * 0.3;
  return (
    <group position={position} rotation={[0, 0, rot]}>
      <mesh position={[0, -h / 4, 0]} receiveShadow>
        <planeGeometry args={[width, h / 2]} />
        <meshStandardMaterial map={map} transparent roughness={0.6} depthWrite={false} />
      </mesh>
      <group ref={peelRef}>
        <mesh position={[0, h / 4, 0]} receiveShadow castShadow>
          <planeGeometry args={[width, h / 2]} />
          <meshStandardMaterial map={map} transparent roughness={0.6} depthWrite={false} side={2} />
        </mesh>
      </group>
    </group>
  );
}
