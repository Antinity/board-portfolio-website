"use client";

import { useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { ITEMS } from "@/data/boardLayout";
import { createRig } from "./rig";
import BoardSurface from "./scene/BoardSurface";
import Item from "./scene/Item";
import RedStrings, { stringPinsByItem } from "./scene/RedStrings";
import SectionTargets from "./scene/SectionTargets";
import Flashlight from "./scene/Flashlight";
import CameraRig from "./scene/CameraRig";
import PostFX from "./scene/PostFX";

/**
 * The 3D board: cork + frame, every item, red strings, click targets,
 * camera, torch and post-processing.
 *
 * @param {object|null} focus       section bounds to fly to (null = overview)
 * @param {number}      insetRight  px covered by the case-file panel
 */
export default function Experience({ activeId, focus, insetRight, onSelect, torchOn }) {
  const rig = useMemo(() => createRig(), []);
  const occupied = useMemo(() => stringPinsByItem(), []);
  // Client-only component (loaded with ssr: false), so window is available here.
  // Override with ?fx=high | low | off.
  const [quality] = useState(() => {
    const forced = new URLSearchParams(window.location.search).get("fx");
    if (["high", "low", "off"].includes(forced)) return forced;
    return window.innerWidth < 700 || navigator.hardwareConcurrency <= 4 ? "low" : "high";
  });

  return (
    <Canvas
      shadows
      flat
      dpr={[1, quality === "high" ? 1.5 : 1.25]}
      camera={{ fov: 32, near: 0.5, far: 120, position: [0, 0, 34] }}
      gl={{ antialias: false, powerPreference: "high-performance", stencil: false }}
      style={{ position: "fixed", inset: 0, touchAction: "none", background: "#050505" }}
    >
      <color attach="background" args={["#050505"]} />
      {/* barely-there cold room light so the board never goes fully black */}
      <hemisphereLight args={["#5d6a80", "#1a140e", 0.38]} />

      <BoardSurface />
      {ITEMS.map((item) => (
        <Item key={item.id} item={item} occupied={occupied[item.id]} />
      ))}
      <RedStrings />
      <SectionTargets rig={rig} activeId={activeId} onSelect={onSelect} />

      <Flashlight rig={rig} on={torchOn} />
      <CameraRig rig={rig} focus={focus} insetRight={insetRight} />
      {quality !== "off" && <PostFX rig={rig} quality={quality} />}
    </Canvas>
  );
}
