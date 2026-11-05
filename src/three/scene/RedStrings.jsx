"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { LINKS, itemById } from "@/data/boardLayout";
import { itemPoint, itemZ } from "../space";
import { Pin } from "./Fasteners";

const STRING_Z = 0.11; // yarn rests over the papers between pins
const DEFAULT_AT = [0.5, 0.06];

const yarn = new THREE.MeshStandardMaterial({ color: "#8e1212", roughness: 0.95 });

/** Resolve a link end to a world point and the z of the surface it's pinned to. */
function resolve(end) {
  const item = itemById[end.item];
  if (!item) throw new Error(`Red string points at unknown item "${end.item}"`);
  const [x, y] = itemPoint(item, end.at ?? DEFAULT_AT);
  return { x, y, z: itemZ(item) };
}

/** For each item, the pin spots used by strings (so items don't double-pin). */
export function stringPinsByItem() {
  const map = {};
  for (const { from, to } of LINKS) {
    for (const end of [from, to]) (map[end.item] ??= []).push(end.at ?? DEFAULT_AT);
  }
  return map;
}

/** Red yarn between related pieces of evidence, sagging under gravity. */
export default function RedStrings() {
  const strings = useMemo(
    () =>
      LINKS.map(({ from, to }) => {
        const a = resolve(from);
        const b = resolve(to);
        const len = Math.hypot(b.x - a.x, b.y - a.y);
        const curve = new THREE.CubicBezierCurve3(
          new THREE.Vector3(a.x, a.y, a.z + 0.06),
          new THREE.Vector3(a.x + (b.x - a.x) * 0.3, a.y + (b.y - a.y) * 0.3 - len * 0.035, STRING_Z),
          new THREE.Vector3(a.x + (b.x - a.x) * 0.7, a.y + (b.y - a.y) * 0.7 - len * 0.035, STRING_Z),
          new THREE.Vector3(b.x, b.y, b.z + 0.06)
        );
        return { a, b, geometry: new THREE.TubeGeometry(curve, Math.max(24, Math.round(len * 6)), 0.013, 6) };
      }),
    []
  );

  const pins = useMemo(() => {
    const seen = new Map();
    strings.forEach(({ a, b }) => [a, b].forEach((p) => seen.set(`${p.x.toFixed(2)},${p.y.toFixed(2)}`, p)));
    return [...seen.values()];
  }, [strings]);

  return (
    <group>
      {strings.map(({ geometry }, i) => (
        <mesh key={i} geometry={geometry} material={yarn} castShadow />
      ))}
      {pins.map((p, i) => (
        <Pin key={i} position={[p.x, p.y, p.z + 0.004]} color="#b51c22" />
      ))}
    </group>
  );
}
