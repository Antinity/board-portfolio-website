"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { loading } from "../loading";
import { liteUniforms } from "../lite";

/**
 * Cold light through a high window: everything stays faintly visible.
 * Its shadows only re-render while something on the board is moving
 * (a page being picked up / put back), since the board is otherwise static.
 */
export default function Moonlight({ rig }) {
  const light = useRef(null);
  const sky = useRef(null);
  const wasMoving = useRef(false);
  const warmUntil = useRef(0);

  useEffect(() => {
    light.current.shadow.autoUpdate = false;
    // the same light for lite shading (lite.js)
    const l = light.current;
    liteUniforms.uLiteMoonDir.value.copy(l.position).sub(l.target.position).normalize();
    liteUniforms.uLiteMoonColor.value.copy(l.color).multiplyScalar(l.intensity);
    liteUniforms.uLiteSky.value.copy(sky.current.color).multiplyScalar(sky.current.intensity);
    liteUniforms.uLiteGround.value.copy(sky.current.groundColor).multiplyScalar(sky.current.intensity);
    warmUntil.current = Infinity; // until the board is shown…
    return loading.subscribe(({ ready }) => {
      if (ready) warmUntil.current = performance.now() + 3000; // …and a little after
    });
  }, []);

  useFrame(() => {
    const moving = rig.readT > 0.001 && rig.readT < 0.999;
    // keep updating while moving, plus one final frame once it settles
    const warming = performance.now() < warmUntil.current;
    if (moving || wasMoving.current || warming) light.current.shadow.needsUpdate = true;
    wasMoving.current = moving;
  });

  return (
    <>
      <hemisphereLight ref={sky} args={["#4a5878", "#120e0a", 0.16]} />
      <directionalLight
        ref={light}
        color="#9fb4e8"
        intensity={0.4}
        position={[-14, 12, 16]}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-camera-near={1}
        shadow-camera-far={60}
      />
    </>
  );
}
