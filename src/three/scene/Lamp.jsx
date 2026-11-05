"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { BOARD_H, FRAME } from "../space";

/** Tunables for the picture lamp on top of the frame. */
const LAMP = {
  color: "#ffd9a8", // warm tungsten
  intensity: 0.9, // dim on purpose: the torch is the main light
  width: 3.4, // shade length, world units
  reach: 0.95, // how far the arm holds the shade off the board
};

const brass = new THREE.MeshStandardMaterial({ color: "#3b3328", metalness: 0.7, roughness: 0.55 });
const bulb = new THREE.MeshStandardMaterial({ color: "#000000", emissive: LAMP.color, emissiveIntensity: 1.4 });

/**
 * A gallery-style picture lamp clamped to the top of the frame, washing the
 * board with a dim, warm light from above. Its shadows are rendered while
 * the board loads and while a page moves, then held, since nothing else
 * under it changes.
 */
export default function Lamp({ rig }) {
  const light = useRef(null);
  const target = useMemo(() => new THREE.Object3D(), []);
  const wasMoving = useRef(false);
  const warmUntil = useRef(0);
  const top = BOARD_H / 2 + FRAME;

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
      {/* clamp + arm */}
      <mesh material={brass} position={[0, 0.06, 0.12]}>
        <boxGeometry args={[0.28, 0.12, 0.24]} />
      </mesh>
      <mesh material={brass} position={[0, 0.2, LAMP.reach / 2 + 0.1]} rotation={[Math.PI / 2 - 0.35, 0, 0]}>
        <cylinderGeometry args={[0.025, 0.025, LAMP.reach + 0.2, 10]} />
      </mesh>
      {/* shade with the bulb strip underneath */}
      <group position={[0, 0.3, LAMP.reach]} rotation={[0.55, 0, 0]}>
        <mesh material={brass} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.13, 0.13, LAMP.width, 24, 1, true, Math.PI * 0.5, Math.PI]} />
        </mesh>
        <mesh material={bulb} position={[0, -0.04, 0]}>
          <boxGeometry args={[LAMP.width * 0.94, 0.02, 0.05]} />
        </mesh>
      </group>
      <primitive object={target} position={[0, -BOARD_H * 0.42, 0]} />
      <spotLight
        ref={light}
        position={[0, 0.2, LAMP.reach]}
        color={LAMP.color}
        intensity={LAMP.intensity}
        decay={0}
        angle={1.05}
        penumbra={1}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
      />
    </group>
  );
}
