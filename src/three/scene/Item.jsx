"use client";

import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { paintItem } from "../painters";
import { seeded } from "../painters/common";
import { paperBumpTexture } from "../textures/procedural";
import { UNIT, itemZ, rectCenter } from "../space";
import { Pin, Tape } from "./Fasteners";

/**
 * Paper geometry that isn't perfectly flat: edges lift a little, one corner
 * curls, and sticky notes peel away from the board at the bottom.
 */
function curledPlane(item) {
  const w = item.w * UNIT;
  const h = item.h * UNIT;
  const geo = new THREE.PlaneGeometry(w, h, 12, 12);
  const r = seeded(item.id);
  const flat = item.kind === "label" || item.kind === "blueprint";
  const curlCorner = [r() < 0.5 ? -1 : 1, r() < 0.7 ? -1 : 1]; // mostly a bottom corner
  const curl = flat ? 0 : (0.015 + r() * 0.035) * Math.min(1, Math.max(w, h) / 3);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const u = pos.getX(i) / (w / 2); // -1..1
    const v = pos.getY(i) / (h / 2); // -1..1 (top = 1)
    let z = flat ? 0 : 0.006 * (u * u + v * v);
    const d = Math.hypot(u - curlCorner[0], v - curlCorner[1]);
    z += curl * Math.max(0, 1 - d / 0.9) ** 2;
    if (item.kind === "sticky") z += 0.05 * Math.max(0, (1 - v) / 2) ** 2.5; // peels up from the bottom
    pos.setZ(i, z);
  }
  geo.computeVertexNormals();
  return geo;
}

/** Local position on the item for fraction `at` ([fx, fy], top-left origin). */
const local = (item, [fx, fy]) => [(fx - 0.5) * item.w * UNIT, (0.5 - fy) * item.h * UNIT];

const FASTENERS = {
  pin: [[0.5, 0.06]],
  pins: [
    [0.06, 0.04],
    [0.94, 0.04],
  ],
};

/**
 * One piece of evidence: painted texture on a slightly curled sheet, with
 * its pins / tape. `occupied` lists pin spots already taken by red strings.
 */
export default function Item({ item, occupied = [] }) {
  const [painted, setPainted] = useState(null);
  const geometry = useMemo(() => curledPlane(item), [item]);
  const bump = useMemo(() => paperBumpTexture(), []);

  useEffect(() => {
    let alive = true;
    let texture;
    paintItem(item).then((res) => {
      texture = res.texture;
      if (alive) setPainted(res);
      else texture.dispose();
    });
    return () => {
      alive = false;
      texture?.dispose();
    };
  }, [item]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  if (!painted) return null;

  const [cx, cy] = rectCenter(item);
  const z = itemZ(item);
  const fasten = item.fasten ?? "pin";
  const pins = (FASTENERS[fasten] ?? []).filter(
    (at) => !occupied.some((o) => Math.abs(o[0] - at[0]) * item.w < 40 && Math.abs(o[1] - at[1]) * item.h < 40)
  );
  const r = seeded(`${item.id}-pins`);

  return (
    <group position={[cx, cy, z]} rotation={[0, 0, (-(item.rot || 0) * Math.PI) / 180]}>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial
          map={painted.texture}
          bumpMap={bump}
          bumpScale={painted.glossy ? 0.15 : 0.5}
          roughness={painted.glossy ? 0.32 : 0.88}
          alphaTest={painted.alpha ? 0.5 : 0}
          side={THREE.DoubleSide}
        />
      </mesh>
      {pins.map((at) => (
        <Pin key={at.join()} position={[...local(item, at), 0.004]} color={Math.floor(r() * 6)} />
      ))}
      {fasten === "tape" && <Tape position={[0, (item.h * UNIT) / 2 - 0.02, 0.01]} rot={(r() - 0.5) * 0.2} width={Math.min(1.1, item.w * UNIT * 0.4)} />}
    </group>
  );
}
