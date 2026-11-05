"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { ACESFilmicToneMapping, NoToneMapping } from "three";

/**
 * Settings that follow the current quality rung (quality.js):
 *  - contact shadows under the paper stand in for ambient occlusion when that pass is off
 *  - with no post-processing chain the renderer does the ACES tone mapping itself, so the look holds
 */
export default function QualitySettings({ rig, quality }) {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    rig.contactShadows = quality !== "high";
    gl.toneMapping = quality === "off" ? ACESFilmicToneMapping : NoToneMapping;
    gl.domElement.dataset.quality = quality; // for checking which rung a device ended up on
  }, [gl, rig, quality]);
  return null;
}
