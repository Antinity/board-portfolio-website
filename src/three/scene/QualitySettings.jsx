"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { ACESFilmicToneMapping, NoToneMapping } from "three";
import { makeLite } from "../lite";

const LITE_SWEEP_FRAMES = 30; // how often lite mode looks for materials made since (pages opened, sheets painted)

/**
 * Settings that follow the current quality rung (quality.js):
 *  - contact shadows under the paper stand in for ambient occlusion when that pass is off
 *  - with no post-processing chain the renderer does the ACES tone mapping itself, so the look holds
 *  - "lite": shadow maps off, and every lit material switched to lite shading (lite.js)
 */
export default function QualitySettings({ rig, quality }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const lite = quality === "lite";
  const frames = useRef(0);

  useEffect(() => {
    rig.contactShadows = quality !== "high";
    gl.toneMapping = quality === "off" || lite ? ACESFilmicToneMapping : NoToneMapping;
    gl.shadowMap.enabled = !lite;
    gl.domElement.dataset.quality = quality; // for checking which rung a device ended up on
  }, [gl, rig, quality, lite]);

  useFrame(() => {
    if (!lite || frames.current++ % LITE_SWEEP_FRAMES) return;
    scene.traverse((o) => {
      if (!o.material) return;
      if (Array.isArray(o.material)) o.material.forEach(makeLite);
      else makeLite(o.material);
    });
  });

  return null;
}
