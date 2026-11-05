"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Bloom, DepthOfField, EffectComposer, Noise, SSAO, ToneMapping, Vignette } from "@react-three/postprocessing";
import { BlendFunction, ToneMappingMode } from "postprocessing";
import { LensEffect, MotionBlurEffect } from "../effects/CameraEffects";

/**
 * Post-processing chain:
 *   ambient occlusion → depth of field (focused where the torch points) →
 *   bloom → camera motion blur → lens distortion + chromatic aberration →
 *   film grain → vignette → ACES tone mapping
 *
 * `quality: "low"` drops the most expensive passes (used on small screens).
 */
export default function PostFX({ rig, quality = "high" }) {
  const dof = useRef(null);
  const motionBlur = useMemo(() => new MotionBlurEffect(), []);
  const lens = useMemo(() => new LensEffect({ distortion: 0.07, aberration: 0.006 }), []);
  const reduceMotion = useRef(false);

  useEffect(() => {
    reduceMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    return () => {
      motionBlur.dispose();
      lens.dispose();
    };
  }, [motionBlur, lens]);

  useFrame(() => {
    // focus where the torch points — or on the page being read
    dof.current?.target?.lerpVectors(rig.aim, rig.readPoint, rig.readT);
    const k = reduceMotion.current ? 0 : 1;
    motionBlur.uniforms.get("velocity").value.set(-rig.blur.x * 0.9 * k, -rig.blur.y * 0.9 * k);
    motionBlur.uniforms.get("zoom").value = rig.zoomBlur * 0.5 * k;
  });

  const high = quality === "high";

  return (
    <EffectComposer multisampling={high ? 4 : 2} enableNormalPass={high}>
      {high && (
        <SSAO samples={16} rings={4} radius={0.1} intensity={10} luminanceInfluence={0.5} worldDistanceThreshold={40} worldDistanceFalloff={10} worldProximityThreshold={0.3} worldProximityFalloff={0.15} depthAwareUpsampling resolutionScale={0.5} color="black" />
      )}
      {high && <DepthOfField ref={dof} target={[0, 0, 0]} focusRange={3} bokehScale={1.3} resolutionScale={0.75} />}
      <Bloom intensity={0.22} luminanceThreshold={0.92} luminanceSmoothing={0.08} mipmapBlur />
      <primitive object={motionBlur} />
      <primitive object={lens} />
      <Noise premultiply blendFunction={BlendFunction.SCREEN} opacity={0.12} />
      <Vignette offset={0.3} darkness={0.55} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
}
