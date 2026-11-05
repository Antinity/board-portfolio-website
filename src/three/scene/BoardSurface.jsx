"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { BOARD_H, BOARD_W, FRAME, PLANK } from "../space";
import { brickTexture, whiteboardTextures, woodTexture } from "../textures/procedural";

const DEPTH = 0.1; // how far the frame stands proud of the board

const aluminium = new THREE.MeshStandardMaterial({ color: "#b8bbbf", metalness: 0.8, roughness: 0.38 });
const bracket = new THREE.MeshStandardMaterial({ color: "#151515", roughness: 0.6 });
const screwMat = new THREE.MeshStandardMaterial({ color: "#8d8d88", metalness: 0.85, roughness: 0.4 });
const screwHead = new THREE.CylinderGeometry(0.06, 0.068, 0.03, 16).rotateX(Math.PI / 2);

/** A black L-shaped corner bracket, rotated to its corner. */
function LBracket({ x, y, sx, sy }) {
  const arm = 0.42;
  const t = 0.07;
  return (
    <group position={[x, y, DEPTH + 0.015]} scale={[sx, sy, 1]}>
      <mesh material={bracket} position={[-arm / 2 + t, -t / 2, 0]} castShadow>
        <boxGeometry args={[arm, t, 0.03]} />
      </mesh>
      <mesh material={bracket} position={[-t / 2, -arm / 2 + t, 0]} castShadow>
        <boxGeometry args={[t, arm, 0.03]} />
      </mesh>
    </group>
  );
}

/**
 * Whiteboard in a plain aluminium frame with black L-brackets at the
 * corners, standing between two pale wooden posts joined by a beam (the
 * fluorescent tube lives on the beam), against a brick wall.
 */
export default function BoardSurface() {
  const surface = useMemo(() => whiteboardTextures([BOARD_W / 1.5, BOARD_H / 1.5]), []);
  const wood = useMemo(() => woodTexture(), []);
  const bricks = useMemo(() => brickTexture([9, 7]), []);

  const outerW = BOARD_W + FRAME * 2;
  const outerH = BOARD_H + FRAME * 2;

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
    return new THREE.ExtrudeGeometry(shape, { depth: DEPTH, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 2 });
  }, [outerW, outerH]);

  const postH = outerH + PLANK.overhang * 2;
  const postX = outerW / 2 + PLANK.width / 2 - PLANK.overlap;
  const beamY = outerH / 2 + PLANK.overhang - 0.35;
  const cx = outerW / 2 - 0.02;
  const cy = outerH / 2 - 0.02;

  return (
    <group>
      {/* brick wall */}
      <mesh position={[0, 0, -0.5]} receiveShadow>
        <planeGeometry args={[outerW * 3, outerH * 3]} />
        <meshStandardMaterial map={bricks} roughness={0.95} />
      </mesh>

      {/* posts and the top beam, behind the board */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * postX, 0, -0.18]} castShadow receiveShadow>
          <boxGeometry args={[PLANK.width, postH, PLANK.depth]} />
          <meshStandardMaterial map={wood} roughness={0.85} />
        </mesh>
      ))}
      <mesh position={[0, beamY, 0.06]} castShadow receiveShadow>
        <boxGeometry args={[postX * 2 + PLANK.width, 0.5, PLANK.depth]} />
        <meshStandardMaterial map={wood} roughness={0.85} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} geometry={screwHead} material={screwMat} position={[side * postX, beamY, 0.06 + PLANK.depth / 2 + 0.01]} />
      ))}

      {/* whiteboard: satin, not glossy */}
      <mesh receiveShadow>
        <planeGeometry args={[BOARD_W, BOARD_H]} />
        <meshStandardMaterial map={surface.map} bumpMap={surface.bumpMap} bumpScale={0.25} roughness={0.62} />
      </mesh>

      {/* aluminium frame + black corner brackets */}
      <mesh geometry={frameGeometry} material={aluminium} castShadow receiveShadow />
      <LBracket x={-cx} y={cy} sx={-1} sy={1} />
      <LBracket x={cx} y={cy} sx={1} sy={1} />
      <LBracket x={-cx} y={-cy} sx={-1} sy={-1} />
      <LBracket x={cx} y={-cy} sx={1} sy={-1} />
    </group>
  );
}
