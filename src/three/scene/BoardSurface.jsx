"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { BOARD_H, BOARD_W, FRAME, PLANK } from "../space";
import { corkTextures, navyFrameTexture, rng, woodTexture } from "../textures/procedural";
import { brandSurface } from "../painters/identity";

const DEPTH = 0.12; // how far the frame stands proud of the cork

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

/** A screw: a shallow metal dome with a slot. */
const screwHead = new THREE.CylinderGeometry(0.075, 0.085, 0.035, 18).rotateX(Math.PI / 2);
const screwSlot = new THREE.BoxGeometry(0.11, 0.018, 0.02);
const screwMat = new THREE.MeshStandardMaterial({ color: "#9a9a96", metalness: 0.85, roughness: 0.38 });
const slotMat = new THREE.MeshStandardMaterial({ color: "#2a2a28", roughness: 0.8 });

function Screw({ position, turn }) {
  return (
    <group position={position} rotation={[0, 0, turn]}>
      <mesh geometry={screwHead} material={screwMat} castShadow />
      <mesh geometry={screwSlot} material={slotMat} position={[0, 0, 0.012]} />
    </group>
  );
}

/**
 * Cork board in a navy frame (the prototype site's cloud-and-grid stock with
 * a sage inner edge), held to the wall by two wooden planks screwed over its
 * left and right edges.
 */
export default function BoardSurface() {
  const cork = useMemo(() => corkTextures([BOARD_W / 4, BOARD_H / 4]), []);
  const colors = useCorkGeometryColors(48, 28);
  const frameMap = useMemo(() => navyFrameTexture(brandSurface), []);
  const wood = useMemo(() => woodTexture(), []);

  const outerW = BOARD_W + FRAME * 2;
  const outerH = BOARD_H + FRAME * 2;

  // frame: a rectangle with the cork opening cut out, extruded
  const frameGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-outerW / 2, -outerH / 2);
    shape.lineTo(outerW / 2, -outerH / 2);
    shape.lineTo(outerW / 2, outerH / 2);
    shape.lineTo(-outerW / 2, outerH / 2);
    shape.closePath();
    const hole = new THREE.Path();
    hole.moveTo(-BOARD_W / 2, -BOARD_H / 2);
    hole.lineTo(-BOARD_W / 2, BOARD_H / 2);
    hole.lineTo(BOARD_W / 2, BOARD_H / 2);
    hole.lineTo(BOARD_W / 2, -BOARD_H / 2);
    hole.closePath();
    shape.holes.push(hole);
    const geo = new THREE.ExtrudeGeometry(shape, { depth: DEPTH, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 2 });
    // extrude UVs are raw x/y: normalise them across the frame face
    const uv = geo.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / outerW + 0.5, uv.getY(i) / outerH + 0.5);
    return geo;
  }, [outerW, outerH]);

  const lip = 0.022; // sage inner edge
  const lips = [
    { pos: [0, BOARD_H / 2 - lip / 2, DEPTH * 0.5], size: [BOARD_W, lip, DEPTH] },
    { pos: [0, -BOARD_H / 2 + lip / 2, DEPTH * 0.5], size: [BOARD_W, lip, DEPTH] },
    { pos: [-BOARD_W / 2 + lip / 2, 0, DEPTH * 0.5], size: [lip, BOARD_H, DEPTH] },
    { pos: [BOARD_W / 2 - lip / 2, 0, DEPTH * 0.5], size: [lip, BOARD_H, DEPTH] },
  ];

  const plankH = outerH + PLANK.overhang * 2;
  const plankX = outerW / 2 + PLANK.width / 2 - PLANK.overlap;
  const screwYs = [plankH / 2 - 0.45, plankH / 2 - PLANK.overhang - FRAME / 2, 0, -plankH / 2 + PLANK.overhang + FRAME / 2, -plankH / 2 + 0.45];

  return (
    <group>
      {/* wall */}
      <mesh position={[0, 0, -0.3]} receiveShadow>
        <planeGeometry args={[outerW * 3, outerH * 3]} />
        <meshStandardMaterial color="#26231f" roughness={1} />
      </mesh>

      {/* cork */}
      <mesh receiveShadow>
        <planeGeometry args={[BOARD_W, BOARD_H, 48, 28]}>
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </planeGeometry>
        <meshStandardMaterial map={cork.map} bumpMap={cork.bumpMap} bumpScale={1.2} roughness={0.95} vertexColors />
      </mesh>

      {/* navy frame */}
      <mesh geometry={frameGeometry} castShadow receiveShadow>
        <meshStandardMaterial map={frameMap} roughness={0.72} metalness={0.05} />
      </mesh>
      {lips.map((l, i) => (
        <mesh key={i} position={l.pos} receiveShadow>
          <boxGeometry args={l.size} />
          <meshStandardMaterial color="#b9dc9b" roughness={0.55} />
        </mesh>
      ))}

      {/* wooden planks holding it to the wall */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * plankX, 0, DEPTH + PLANK.depth / 2]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[PLANK.width, plankH, PLANK.depth]} />
            <meshStandardMaterial map={wood} roughness={0.78} />
          </mesh>
          {screwYs.map((y, i) => (
            <Screw key={i} position={[0, y, PLANK.depth / 2 + 0.012]} turn={(side * 0.7 + i * 1.3) % Math.PI} />
          ))}
        </group>
      ))}
    </group>
  );
}
