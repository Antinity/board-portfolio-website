"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { MathUtils, Object3D, Vector3 } from "three";
import { damagedGlassCookie } from "../textures/procedural";

/** Tunables for the feel of the torch. */
const TORCH = {
  intensity: 3.1, // overall brightness
  coneScale: 0.72, // beam size relative to the screen height
  hold: new Vector3(0.12, -0.16, 0), // where the hand holds it, × camera distance
  smoothTime: 0.16, // seconds for the aim to catch up (higher = heavier torch)
  maxSpeed: 26, // world units / second the aim can travel
  sway: 0.012, // hand wobble, × camera distance
  flickerChance: 0.05, // flickers per second
};

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
 * A hand-held torch: a shadow-casting spotlight shining through a scratched,
 * cracked lens (the cookie texture), aimed wherever the pointer is.
 */
export default function Flashlight({ rig, on = true }) {
  const { camera } = useThree();
  const light = useRef(null);
  const target = useMemo(() => new Object3D(), []);
  const cookie = useMemo(() => damagedGlassCookie(), []);
  const state = useRef({ vel: new Vector3(), power: 0, flickerUntil: 0, bootAt: Infinity });
  const reduceMotion = useRef(false);

  useEffect(() => {
    reduceMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    state.current.bootAt = performance.now() + 900; // torch clicks on shortly after load
    if (light.current) light.current.target = target;
    return () => cookie.dispose();
  }, [cookie, target]);

  useFrame(({ clock }, rawDt) => {
    const l = light.current;
    if (!l) return;
    const dt = Math.min(rawDt, 0.05);
    const s = state.current;
    const t = clock.elapsedTime;
    const dist = camera.position.z;
    const calm = reduceMotion.current;

    // aim: heavy, smooth follow (no beam stretching)
    smoothDamp(rig.aim, rig.cursor, s.vel, calm ? 0.05 : TORCH.smoothTime, TORCH.maxSpeed, dt);
    const sway = calm ? 0 : TORCH.sway * dist;
    target.position.set(
      rig.aim.x + (Math.sin(t * 1.3) * 0.6 + Math.sin(t * 0.47 + 1.2) * 0.9) * sway,
      rig.aim.y + (Math.cos(t * 1.1) * 0.6 + Math.sin(t * 0.39 + 0.4) * 0.9) * sway,
      0
    );
    target.updateMatrixWorld();

    // held slightly below and to the right of the eye
    l.position.set(
      camera.position.x + TORCH.hold.x * dist,
      camera.position.y + TORCH.hold.y * dist,
      camera.position.z * 0.98
    );

    // beam keeps a constant size on screen at any zoom
    const tanHalf = Math.tan(MathUtils.degToRad(camera.fov / 2));
    l.angle = Math.min(Math.atan(TORCH.coneScale * tanHalf), 1.2);
    l.shadow.camera.far = dist * 2;

    // power: boot-up stutter, on/off fade, random flicker
    const now = performance.now();
    const wanted = on && now > s.bootAt ? 1 : 0;
    s.power += (wanted - s.power) * (1 - Math.exp(-dt * (wanted ? 5 : 8)));
    if (!calm && on && Math.random() < dt * TORCH.flickerChance) s.flickerUntil = now + 80 + Math.random() * 240;
    const booting = now > s.bootAt && now < s.bootAt + 450;
    const flicker = now < s.flickerUntil || booting ? 0.35 + Math.random() * 0.65 : 1;
    l.intensity = TORCH.intensity * s.power * flicker;
  });

  return (
    <>
      <primitive object={target} />
      <spotLight
        ref={light}
        map={cookie}
        color="#fff1dc"
        decay={0}
        penumbra={0}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.015}
        shadow-camera-near={1}
      />
    </>
  );
}
