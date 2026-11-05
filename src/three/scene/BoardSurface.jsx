"use client";

import { useMemo } from "react";
import { BOARD_H, BOARD_W, FRAME } from "../space";
import { corkTextures, rng } from "../textures/procedural";

const RAIL = FRAME; // aluminium rail width
const DEPTH = 0.09; // how far the frame stands proud of the cork

/** Large-scale tone variation baked into vertex colours (no extra texture). */
function useCorkGeometryColors(segX, segY) {
  return useMemo(() => {
    const r = rng(21);
    const blobs = Array.from({ length: 14 }, () => ({ x: r(), y: r(), s: 0.08 + r() * 0.2, v: (r() - 0.5) * 0.22 }));
    const colors = [];
    for (let j = 0; j <= segY; j++) {
      for (let i = 0; i <= segX; i++) {
        const u = i / segX;
        const v = j / segY;
        let k = 1;
        for (const b of blobs) k += b.v * Math.exp(-((u - b.x) ** 2 + (v - b.y) ** 2) / (b.s * b.s));
        // sun-faded centre, grubbier edges
        k *= 1 - 0.12 * (Math.abs(u - 0.5) ** 2 + Math.abs(v - 0.5) ** 2) * 2;
        colors.push(k, k * 0.98, k * 0.95);
      }
    }
    return new Float32Array(colors);
  }, [segX, segY]);
}

/** Cork board in an aluminium frame with dark plastic corner caps, on a grimy wall. */
export default function BoardSurface() {
  const cork = useMemo(() => corkTextures([BOARD_W / 4, BOARD_H / 4]), []);
  const colors = useCorkGeometryColors(48, 28);

  const outerW = BOARD_W + RAIL * 2;
  const outerH = BOARD_H + RAIL * 2;
  const rails = [
    { pos: [0, BOARD_H / 2 + RAIL / 2, DEPTH / 2], size: [outerW, RAIL, DEPTH] },
    { pos: [0, -BOARD_H / 2 - RAIL / 2, DEPTH / 2], size: [outerW, RAIL, DEPTH] },
    { pos: [-BOARD_W / 2 - RAIL / 2, 0, DEPTH / 2], size: [RAIL, BOARD_H, DEPTH] },
    { pos: [BOARD_W / 2 + RAIL / 2, 0, DEPTH / 2], size: [RAIL, BOARD_H, DEPTH] },
  ];
  const corners = [-1, 1].flatMap((sx) => [-1, 1].map((sy) => [sx * (outerW / 2 - RAIL * 0.4), sy * (outerH / 2 - RAIL * 0.4)]));

  return (
    <group>
      {/* wall */}
      <mesh position={[0, 0, -0.25]} receiveShadow>
        <planeGeometry args={[outerW * 3, outerH * 3]} />
        <meshStandardMaterial color="#2b2824" roughness={1} />
      </mesh>

      {/* cork */}
      <mesh receiveShadow>
        <planeGeometry args={[BOARD_W, BOARD_H, 48, 28]}>
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </planeGeometry>
        <meshStandardMaterial map={cork.map} bumpMap={cork.bumpMap} bumpScale={1.2} roughness={0.95} vertexColors />
      </mesh>

      {/* aluminium rails */}
      {rails.map((r, i) => (
        <mesh key={i} position={r.pos} castShadow receiveShadow>
          <boxGeometry args={r.size} />
          <meshStandardMaterial color="#b9bcc0" metalness={0.85} roughness={0.32} />
        </mesh>
      ))}

      {corners.map(([x, y], i) => (
        <mesh key={i} position={[x, y, DEPTH * 0.75]} castShadow>
          <boxGeometry args={[RAIL * 1.9, RAIL * 1.9, DEPTH * 1.5]} />
          <meshStandardMaterial color="#3a3b3e" roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}
