"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { makeCanvas, rng } from "../textures/procedural";

/* Magnets, masking tape and paper clips. Geometry/materials are shared across instances. */

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

/**
 * A steel paper clip, bent from one wire: an inner loop and an outer loop.
 * Laid out in board pixels (y up, centred), then scaled to world units.
 */
const clipGeometry = (() => {
  const px = 0.01; // world units per board pixel
  const pts = [];
  const zIn = 0.9; // the inner loop sits on the paper, the outer one a hair higher
  const zOut = 1.6;
  const line = (x0, y0, x1, y1, z0, z1) => {
    const n = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0)));
    for (let i = 0; i < n; i++) pts.push([x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, z0 + ((z1 - z0) * i) / n]);
  };
  const arc = (cx, cy, rad, a0, a1, z0, z1) => {
    const n = 18;
    for (let i = 0; i < n; i++) {
      const a = a0 + ((a1 - a0) * i) / n;
      pts.push([cx + rad * Math.cos(a), cy + rad * Math.sin(a), z0 + ((z1 - z0) * i) / n]);
    }
  };
  line(-3.1, -7, -3.1, 16.8, zIn, zIn);
  arc(0, 16.8, 3.1, Math.PI, 0, zIn, zIn);
  line(3.1, 16.8, 3.1, -22.4, zIn, zIn);
  arc(-1.9, -22.4, 5, 0, -Math.PI, zIn, zOut);
  line(-6.9, -22.4, -6.9, 25.2, zOut, zOut);
  arc(0.4, 25.2, 7.3, Math.PI, 0, zOut, zOut);
  line(7.7, 25.2, 7.7, -14, zOut, zOut);
  pts.push([7.7, -14, zOut]);
  const curve = new THREE.CatmullRomCurve3(pts.map(([x, y, z]) => new THREE.Vector3(x * px, y * px, z * px)));
  return new THREE.TubeGeometry(curve, 360, 0.95 * px, 8, false);
})();
/** How far the clip reaches above its centre (world units): for setting it over an edge. */
export const CLIP_TOP = 0.334;

const clipMaterial = new THREE.MeshStandardMaterial({ color: "#c6cacf", metalness: 0.78, roughness: 0.3 });

/** A paper clip at `position`, turned `rot` (radians) on the paper. */
export function Clip({ position, rot = 0 }) {
  return <mesh geometry={clipGeometry} material={clipMaterial} position={position} rotation={[0, 0, rot]} castShadow />;
}
