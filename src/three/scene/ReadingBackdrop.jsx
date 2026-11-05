"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";

const DIST = 2.6; // just behind the page being read

/**
 * A dark veil between the board and a page held up to read. The board
 * behind also falls out of focus (depth of field), like a game note screen.
 * Clicking it puts the page back.
 */
export default function ReadingBackdrop({ rig, readingId, onClose }) {
  const mesh = useRef(null);
  const mat = useRef(null);

  // Let the camera, torch and items know a page is being read; the system
  // cursor reappears while reading (the torch is the cursor otherwise).
  useEffect(() => {
    rig.reading = readingId;
    if (readingId) document.body.dataset.reading = "";
    else {
      delete document.body.dataset.reading;
      document.body.style.cursor = "";
    }
  }, [rig, readingId]);

  useFrame(({ camera }) => {
    const m = mesh.current;
    if (!m) return;
    const t = rig.readT;
    m.visible = t > 0.002;
    if (!m.visible) return;
    camera.getWorldDirection(m.position);
    m.position.multiplyScalar(DIST).add(camera.position);
    m.quaternion.copy(camera.quaternion);
    mat.current.opacity = t * 0.62;
  });

  return (
    <mesh
      ref={mesh}
      visible={false}
      renderOrder={1}
      onClick={(e) => {
        if (!rig.reading || rig.readT < 0.6 || rig.dragging) return; // a spin-drag is not a click
        e.stopPropagation();
        onClose();
      }}
    >
      <planeGeometry args={[40, 40]} />
      <meshBasicMaterial ref={mat} color="#020203" transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}
