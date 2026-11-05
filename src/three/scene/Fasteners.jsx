"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { makeCanvas, rng } from "../textures/procedural";

/* Push pins and masking tape. Geometry/materials are shared across instances. */

const PIN_COLORS = ["#c3242c", "#2557c4", "#2c9a4a", "#e0b52a", "#e8e5dc", "#1d1d1f"];

/** Neck + head + domed cap, merged into one geometry (one draw call per pin). */
const pinGeometry = (() => {
  const neck = new THREE.CylinderGeometry(0.022, 0.03, 0.05, 12).rotateX(Math.PI / 2).translate(0, 0, 0.025);
  const head = new THREE.CylinderGeometry(0.055, 0.07, 0.05, 20).rotateX(Math.PI / 2).translate(0, 0, 0.07);
  const cap = new THREE.SphereGeometry(0.058, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2).rotateX(Math.PI / 2).translate(0, 0, 0.095);
  return mergeGeometries([neck.toNonIndexed(), head.toNonIndexed(), cap.toNonIndexed()]);
})();

const pinMaterials = new Map();
function pinMaterial(color) {
  if (!pinMaterials.has(color)) {
    pinMaterials.set(color, new THREE.MeshPhysicalMaterial({ color, roughness: 0.25, clearcoat: 0.6, clearcoatRoughness: 0.2 }));
  }
  return pinMaterials.get(color);
}

/** Push pin standing on a surface at world `position` ([x, y, z of surface]). */
export function Pin({ position, color = 0 }) {
  const mat = pinMaterial(typeof color === "number" ? PIN_COLORS[color % PIN_COLORS.length] : color);
  return <mesh geometry={pinGeometry} material={mat} position={position} castShadow />;
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

/** Strip of masking tape, centred at `position`, rotated `rot` radians. */
export function Tape({ position, rot = 0, width = 1 }) {
  const map = useMemo(() => getTapeTexture(), []);
  return (
    <mesh position={position} rotation={[0, 0, rot]} receiveShadow>
      <planeGeometry args={[width, width * 0.3]} />
      <meshStandardMaterial map={map} transparent roughness={0.6} depthWrite={false} />
    </mesh>
  );
}
