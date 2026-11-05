"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Object3D, Vector3 } from "three";
import { torchCookie } from "../textures/procedural";
import { loading } from "../loading";

/** Tunables for the feel of the torch. */
const TORCH = {
  color: "#d4e4ff", // cool LED white-blue
  intensity: 1.55, // overall brightness (the board is white, so it needs less)
  radius: 12.2, // cone radius on the board, world units (bright disc ≈ 46% of it, faint spill beyond) — constant at every zoom
  minThrow: 20, // the torch is never closer to the board than this (keeps the cone narrow)
  hold: new Vector3(0.35, -0.5, 0), // offset from the eye, world units
  smoothTime: 0.055, // seconds to catch up with the pointer (it *is* the cursor)
  maxSpeed: 80, // world units / second
  sway: 0.03, // hand wobble, world units
  flickerChance: 0.04, // flickers per second
};

const toBoard = new Vector3();

/** Critically-damped spring toward `target` (Unity-style SmoothDamp). */
function smoothDamp(current, target, velocity, smoothTime, maxSpeed, dt) {
  const omega = 2 / smoothTime;
  const x = omega * dt;
  const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
  const change = new Vector3().subVectors(current, target);
  const maxChange = maxSpeed * smoothTime;
  if (change.length() > maxChange) change.setLength(maxChange);
  const temp = new Vector3().copy(velocity).addScaledVector(change, omega).multiplyScalar(dt);
  velocity.addScaledVector(temp, -omega).multiplyScalar(exp);
  const out = new Vector3().subVectors(current, change).addScaledVector(new Vector3().addVectors(change, temp), exp);
  current.copy(out);
}

/**
 * The hand-held torch, which doubles as the cursor: a shadow-casting
 * spotlight projecting the beam pattern, aimed at the pointer. While a page
 * is being read it holds still on that page.
 */
export default function Flashlight({ rig, on = true }) {
  const { camera } = useThree();
  const light = useRef(null);
  const target = useMemo(() => new Object3D(), []);
  const cookie = useMemo(() => torchCookie(), []);
  const state = useRef({ vel: new Vector3(), power: 0, flickerUntil: 0, bootAt: Infinity });
  const reduceMotion = useRef(false);

  useEffect(() => {
    reduceMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (light.current) light.current.target = target;
    // the torch clicks on just after the loader clears
    const unsubscribe = loading.subscribe(({ ready }) => {
      if (ready && state.current.bootAt === Infinity) state.current.bootAt = performance.now() + 250;
    });
    return () => {
      unsubscribe();
      cookie.dispose();
    };
  }, [cookie, target]);

  useFrame(({ clock }, rawDt) => {
    const l = light.current;
    if (!l) return;
    const dt = Math.min(rawDt, 0.05);
    const s = state.current;
    const t = clock.elapsedTime;
    const calm = reduceMotion.current;

    // where to point: the cursor — or, while reading, the board behind the page
    let goal = rig.cursor;
    if (rig.reading && rig.readT > 0.01) {
      toBoard.subVectors(rig.readPoint, camera.position);
      toBoard.multiplyScalar(-camera.position.z / toBoard.z).add(camera.position);
      goal = toBoard;
    }
    smoothDamp(rig.aim, goal, s.vel, rig.reading ? 0.35 : TORCH.smoothTime, TORCH.maxSpeed, dt);
    const sway = calm ? 0 : TORCH.sway;
    target.position.set(
      rig.aim.x + (Math.sin(t * 1.3) * 0.6 + Math.sin(t * 0.47 + 1.2) * 0.9) * sway,
      rig.aim.y + (Math.cos(t * 1.1) * 0.6 + Math.sin(t * 0.39 + 0.4) * 0.9) * sway,
      0
    );
    target.updateMatrixWorld();

    // held near the eye, but never so close that the cone has to splay wide;
    // while reading, it comes from straight behind the eye so the beam lands
    // in the middle of the page rather than off to one side
    const hold = 1 - rig.readT;
    l.position.set(
      camera.position.x + TORCH.hold.x * hold,
      camera.position.y + TORCH.hold.y * hold,
      Math.max(camera.position.z, TORCH.minThrow)
    );

    // constant beam size on the board at any zoom
    const throwDist = l.position.distanceTo(target.position);
    l.angle = Math.atan(TORCH.radius / throwDist);
    l.shadow.camera.near = Math.max(0.5, throwDist * 0.3);
    l.shadow.camera.far = throwDist * 1.6;

    // power: boot-up stutter, on/off fade, random flicker
    const now = performance.now();
    const wanted = on && now > s.bootAt ? 1 : 0;
    s.power += (wanted - s.power) * (1 - Math.exp(-dt * (wanted ? 5 : 8)));
    if (!calm && on && Math.random() < dt * TORCH.flickerChance) s.flickerUntil = now + 70 + Math.random() * 180;
    const booting = now > s.bootAt && now < s.bootAt + 450;
    const flicker = now < s.flickerUntil || booting ? 0.45 + Math.random() * 0.55 : 1;
    l.intensity = TORCH.intensity * s.power * flicker;
  });

  return (
    <>
      <primitive object={target} />
      <spotLight
        ref={light}
        map={cookie}
        color={TORCH.color}
        decay={0}
        penumbra={0.04}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0003}
        shadow-normalBias={0.02}
      />
    </>
  );
}
