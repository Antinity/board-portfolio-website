"use client";

import { useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Vector3 } from "three";
import { HOME_ITEM, ITEMS, itemById } from "@/data/boardLayout";
import { createRig } from "./rig";
import { rectCenter } from "./space";
import BoardSurface from "./scene/BoardSurface";
import Item from "./scene/Item";
import RedStrings, { stringPinsByItem } from "./scene/RedStrings";
import Flashlight from "./scene/Flashlight";
import CameraRig from "./scene/CameraRig";
import ReadingBackdrop from "./scene/ReadingBackdrop";
import PostFX from "./scene/PostFX";
import Moonlight from "./scene/Moonlight";
import Lamp from "./scene/Lamp";
import ReadingSpin from "./scene/ReadingSpin";
import LoadingGate from "./scene/LoadingGate";
import TorchFocus from "./scene/TorchFocus";
import AdaptiveResolution from "./scene/AdaptiveResolution";

/**
 * The 3D board: whiteboard + frame, every item, red strings, the torch,
 * moonlight and the frame lamp, camera and post-processing.
 *
 * @param {string|null} readingId   item currently held up to read
 * @param {(id: string) => void} onRead
 * @param {() => void}  onClose     put the page back
 * @param {{shift:number,height:number,width:number}} readLayout  reading pose
 */
export default function Experience({ readingId, onRead, onClose, torchOn, readLayout }) {
  const rig = useMemo(() => {
    const [x, y] = rectCenter(itemById[HOME_ITEM]);
    return createRig(new Vector3(x, y, 0));
  }, []);
  const occupied = useMemo(() => stringPinsByItem(), []);

  // Client-only component (loaded with ssr: false), so window is available here.
  // Override with ?fx=high | low | off.
  const [{ quality, coarse }] = useState(() => {
    const touch = window.matchMedia("(pointer: coarse)").matches;
    const forced = new URLSearchParams(window.location.search).get("fx");
    if (["high", "low", "off"].includes(forced)) return { quality: forced, coarse: touch };
    // phones and tablets always get the lighter chain, whatever their size
    return { quality: touch || window.innerWidth < 700 || navigator.hardwareConcurrency <= 4 ? "low" : "high", coarse: touch };
  });

  return (
    <Canvas
      shadows
      flat
      dpr={coarse ? [1, 2] : [1, quality === "high" ? 1.5 : 1.25]}
      camera={{ fov: 32, near: 0.3, far: 300, position: [0, 0, 34] }}
      gl={{ antialias: false, powerPreference: "high-performance", stencil: false }}
      style={{ position: "fixed", inset: 0, touchAction: "none", background: "#050505" }}
    >
      <color attach="background" args={["#050505"]} />
      <LoadingGate steps={ITEMS.length + 1} />
      <Moonlight rig={rig} />
      <Lamp rig={rig} />

      <BoardSurface />
      {ITEMS.map((item) => (
        <Item
          key={item.id}
          item={item}
          occupied={occupied[item.id]}
          rig={rig}
          selected={item.id === readingId}
          onRead={onRead}
          readLayout={readLayout}
        />
      ))}
      <RedStrings />
      <ReadingBackdrop rig={rig} readingId={readingId} onClose={onClose} />
      <ReadingSpin rig={rig} readingId={readingId} />

      <Flashlight rig={rig} on={torchOn} quality={quality} />
      <TorchFocus rig={rig} />
      <CameraRig rig={rig} />
      {coarse && <AdaptiveResolution />}
      {quality !== "off" && <PostFX rig={rig} quality={quality} />}
    </Canvas>
  );
}
