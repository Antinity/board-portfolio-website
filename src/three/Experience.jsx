"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import QualityGovernor from "./scene/QualityGovernor";
import QualitySettings from "./scene/QualitySettings";
import { firstLite, startingQuality } from "./quality";
import { loading } from "./loading";
import ClickGuard from "./scene/ClickGuard";

// A plain draw slower than these (ms) starts on lite shading / without effects.
// The timed draw also waits on a pixel read-back and the shadow maps, so even a
// capable GPU reads 15–35 ms here: only plainly slow ones are moved, and the
// governor sorts out everything in between once the board is shown.
const PROBE_LITE_MS = 150;
const PROBE_PLAIN_MS = 90;

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
  // Quality starts where the GPU should cope and steps down if it can't
  // (quality.js, QualityGovernor). Pin it with ?fx=high | medium | low | off.
  const [start] = useState(startingQuality);
  const [level, setLevel] = useState(start.level);
  const rung = start.ladder[level];
  const quality = rung.fx;
  const dpr = Math.min(window.devicePixelRatio || 1, rung.dpr);

  // Nothing is drawn while the loader covers the board: on a slow GPU every
  // frame rendered behind it was time taken from painting the sheets.
  const [shown, setShown] = useState(false);
  useEffect(() => loading.subscribe(({ ready }) => ready && setShown(true)), []);

  // One timed draw before the board is shown (LoadingGate): a GPU that is far
  // off the mark starts lower down the ladder instead of showing a slideshow
  // while the governor walks it down.
  const onProbe = useCallback(
    (ms) => {
      if (start.pinned || !ms) return;
      const lite = firstLite(start.ladder);
      if (ms > PROBE_LITE_MS) setLevel((l) => Math.max(l, lite));
      else if (ms > PROBE_PLAIN_MS) setLevel((l) => Math.max(l, lite - 1));
    },
    [start]
  );

  return (
    <Canvas
      shadows
      flat={quality !== "off"}
      dpr={dpr}
      frameloop={shown ? "always" : "never"}
      camera={{ fov: 32, near: 0.3, far: 300, position: [0, 0, 34] }}
      gl={{ antialias: false, powerPreference: "high-performance", stencil: false }}
      style={{ position: "fixed", inset: 0, touchAction: "none", background: "#050505" }}
    >
      <color attach="background" args={["#050505"]} />
      <LoadingGate steps={ITEMS.length + 1} onProbe={onProbe} />
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
      <ClickGuard rig={rig} />
      <CameraRig rig={rig} />
      {!start.pinned && <QualityGovernor level={level} ladder={start.ladder} onStep={setLevel} />}
      <QualitySettings rig={rig} quality={quality} />
      {["high", "medium", "low"].includes(quality) && <PostFX rig={rig} quality={quality} />}
    </Canvas>
  );
}

