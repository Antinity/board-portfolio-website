"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { BOARD_H, FRAME, PLANK } from "../space";

/** Tunables for the fluorescent tube on the beam above the board. */
const LAMP = {
  color: "#e9f1ff", // cool fluorescent
  intensity: 0.85, // dim on purpose: the torch is the main light
  width: 7, // tube length, world units
  reach: 0.45, // how far the tube sits in front of the beam
};

const fitting = new THREE.MeshStandardMaterial({ color: "#9aa4b4", metalness: 0.6, roughness: 0.45 });
const bulb = new THREE.MeshStandardMaterial({ color: "#000000", emissive: LAMP.color, emissiveIntensity: 1.6 });

/**
 * A fluorescent tube on the wooden beam above the board, washing it with a
 * dim, cool light from above. Its shadows are rendered while
 * the board loads and while a page moves, then held, since nothing else
 * under it changes.
 */
export default function Lamp({ rig }) {
  const light = useRef(null);
  const target = useMemo(() => new THREE.Object3D(), []);
  const wasMoving = useRef(false);
  const warmUntil = useRef(0);
  const top = BOARD_H / 2 + FRAME + PLANK.overhang - 0.35; // the beam

  useEffect(() => {
    const l = light.current;
    l.target = target;
    l.shadow.autoUpdate = false;
    warmUntil.current = performance.now() + 8000;
  }, [target]);

  useFrame(() => {
    const moving = rig.readT > 0.001 && rig.readT < 0.999;
    if (moving || wasMoving.current || performance.now() < warmUntil.current) light.current.shadow.needsUpdate = true;
    wasMoving.current = moving;
  });

  return (
    <group position={[0, top, 0]}>
      {/* end caps and the glowing tube */}
      {[-1, 1].map((side) => (
        <mesh key={side} material={fitting} position={[side * (LAMP.width / 2 + 0.12), 0, LAMP.reach]}>
          <boxGeometry args={[0.24, 0.22, 0.3]} />
        </mesh>
      ))}
      <mesh material={bulb} position={[0, 0, LAMP.reach]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.07, 0.07, LAMP.width, 16]} />
      </mesh>
      <primitive object={target} position={[0, -BOARD_H * 0.5, 0]} />
      <spotLight
        ref={light}
        position={[0, -0.05, LAMP.reach + 0.6]}
        color={LAMP.color}
        intensity={LAMP.intensity}
        decay={0}
        angle={1.15}
        penumbra={1}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
      />
    </group>
  );
}
