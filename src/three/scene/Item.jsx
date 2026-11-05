"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { paintItem } from "../painters";
import { seeded } from "../painters/common";
import { paperBumpTexture } from "../textures/procedural";
import { UNIT, itemZ, rectCenter } from "../space";
import { damp } from "../rig";
import { Pin, Tape } from "./Fasteners";

const READ_DIST = 1.6; // how far in front of the camera a page is held to read
const HOVER_OPACITY = 0.08;
const PICK_UP_SECONDS = 1.15;
const PUT_BACK_SECONDS = 1.6;
const READ_TILT = { x: 0.07, y: 0.1 }; // max paper tilt toward the pointer while reading (radians)

/**
 * Paper geometry that isn't perfectly flat: edges lift a little, one corner
 * curls, and sticky notes peel away from the board at the bottom.
 */
function curledPlane(item) {
  const w = item.w * UNIT;
  const h = item.h * UNIT;
  const geo = new THREE.PlaneGeometry(w, h, 12, 12);
  const r = seeded(item.id);
  const flat = item.kind === "label";
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

/** White highlight that follows the paper's own cut-out shape (alpha). */
function overlayMaterial(map) {
  return new THREE.ShaderMaterial({
    uniforms: { map: { value: map }, opacity: { value: 0 } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D map;
      uniform float opacity;
      varying vec2 vUv;
      void main() {
        if (texture2D(map, vUv).a < 0.5 || opacity < 0.001) discard;
        gl_FragColor = vec4(1.0, 1.0, 1.0, opacity);
      }`,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
  });
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

const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp01 = (t) => Math.min(1, Math.max(0, t));
const tmp = { pos: new THREE.Vector3(), quat: new THREE.Quaternion(), fwd: new THREE.Vector3(), right: new THREE.Vector3() };
const TILT = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, THREE.MathUtils.degToRad(-1.2)));
const tiltEuler = new THREE.Euler();
const tiltQuat = new THREE.Quaternion();

/** Link region (board px, item-local) under a uv coordinate, if any. */
function linkAt(item, links, uv) {
  if (!uv || !links?.length) return null;
  const x = uv.x * item.w;
  const y = (1 - uv.y) * item.h;
  return links.find((l) => x >= l.x && x <= l.x + l.w && y >= l.y && y <= l.y + l.h) ?? null;
}

/**
 * One piece of evidence: painted texture on a slightly curled sheet with
 * its pins / tape. Hover shows a faint white overlay; when `selected` the
 * sheet lifts off the board and is held up in front of the camera to read,
 * tilting gently toward the pointer. Links printed on the page (URLs,
 * email…) are clickable while it's being read.
 *
 * @param {number[][]} occupied   pin spots already used by red strings
 * @param {{shift:number,height:number,width:number}} readLayout  reading pose,
 *        as fractions of the visible area (shift: horizontal offset)
 */
export default function Item({ item, occupied = [], rig, selected, onRead, readLayout }) {
  const [painted, setPainted] = useState(null);
  const geometry = useMemo(() => curledPlane(item), [item]);
  const bump = useMemo(() => paperBumpTexture(), []);
  const overlay = useMemo(() => (painted ? overlayMaterial(painted.texture) : null), [painted]);
  const group = useRef(null);
  const fasteners = useRef(null);
  const pinsRef = useRef(null);
  const tapePeel = useRef(null);
  const material = useRef(null);
  const state = useRef({ t: 0, hover: 0, hovered: false, tiltX: 0, tiltY: 0 });
  const readable = item.readable !== false;

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
  useEffect(() => () => overlay?.dispose(), [overlay]);

  // Pose on the board.
  const board = useMemo(() => {
    const [cx, cy] = rectCenter(item);
    return {
      pos: new THREE.Vector3(cx, cy, itemZ(item)),
      quat: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, (-(item.rot || 0) * Math.PI) / 180)),
    };
  }, [item]);

  useFrame(({ camera }, rawDt) => {
    const g = group.current;
    if (!g) return;
    const dt = Math.min(rawDt, 0.05);
    const s = state.current;

    // hover overlay
    const wantHover = s.hovered && !rig.reading ? HOVER_OPACITY : 0;
    s.hover += (wantHover - s.hover) * damp(14, dt);
    if (overlay) overlay.uniforms.opacity.value = s.hover;

    // Taking a page off the board is a short sequence on one timeline:
    // pins pull out and the tape peels up, then the page lifts and turns to
    // face the viewer. Putting it back plays the same timeline in reverse,
    // a little slower.
    const target = selected ? 1 : 0;
    if (s.t === target && !selected) return;
    const rate = dt / (selected ? PICK_UP_SECONDS : PUT_BACK_SECONDS);
    s.t = selected ? Math.min(1, s.t + rate) : Math.max(0, s.t - rate);
    const release = easeInOutCubic(clamp01(s.t / 0.24));
    const e = easeInOutCubic(clamp01((s.t - 0.16) / 0.84));

    const fov = THREE.MathUtils.degToRad(camera.fov);
    const visH = 2 * READ_DIST * Math.tan(fov / 2);
    const visW = visH * camera.aspect;
    const scale = Math.min((readLayout.height * visH) / (item.h * UNIT), (readLayout.width * visW) / (item.w * UNIT));
    camera.getWorldDirection(tmp.fwd);
    tmp.right.set(1, 0, 0).applyQuaternion(camera.quaternion);
    tmp.pos
      .copy(camera.position)
      .addScaledVector(tmp.fwd, READ_DIST)
      .addScaledVector(tmp.right, readLayout.shift * visW);
    // gentle tilt toward the pointer while held
    const wantX = selected ? -rig.pointer.y * READ_TILT.x : 0;
    const wantY = selected ? rig.pointer.x * READ_TILT.y : 0;
    s.tiltX += (wantX - s.tiltX) * damp(5, dt);
    s.tiltY += (wantY - s.tiltY) * damp(5, dt);
    tiltQuat.setFromEuler(tiltEuler.set(s.tiltX, s.tiltY, 0));
    tmp.quat.copy(camera.quaternion).multiply(TILT).multiply(tiltQuat);

    g.position.lerpVectors(board.pos, tmp.pos, e);
    g.position.z += Math.sin(e * Math.PI) * 0.45; // arc toward the viewer
    g.quaternion.slerpQuaternions(board.quat, tmp.quat, e);
    g.scale.setScalar(THREE.MathUtils.lerp(1, scale, e));
    if (pinsRef.current) {
      pinsRef.current.position.z = release * 0.22; // pulled out
      pinsRef.current.visible = release < 0.98;
    }
    if (tapePeel.current) tapePeel.current.rotation.x = release * 1.25; // peeled up off the cork
    if (fasteners.current) fasteners.current.visible = e < 0.35;
    if (material.current) material.current.emissiveIntensity = e * 0.72; // readable even in the dark

    if (selected || s.t > 0.001) {
      rig.readT = e;
      rig.readPoint.copy(g.position);
    }
  });

  if (!painted) return null;

  const fasten = item.fasten ?? "pin";
  const pins = (FASTENERS[fasten] ?? []).filter(
    (at) => !occupied.some((o) => Math.abs(o[0] - at[0]) * item.w < 40 && Math.abs(o[1] - at[1]) * item.h < 40)
  );
  const r = seeded(`${item.id}-pins`);

  const handlers = readable
    ? {
        onPointerOver: (e) => {
          e.stopPropagation();
          if (!rig.reading) state.current.hovered = true;
        },
        onPointerOut: () => {
          state.current.hovered = false;
          if (selected) document.body.style.cursor = "";
        },
        onPointerMove: (e) => {
          if (!selected) return;
          e.stopPropagation();
          document.body.style.cursor = linkAt(item, painted.links, e.uv) ? "pointer" : "";
        },
        onClick: (e) => {
          e.stopPropagation();
          if (selected) {
            const link = linkAt(item, painted.links, e.uv);
            if (link) window.open(link.href, link.href.startsWith("mailto:") ? "_self" : "_blank", "noopener");
            return;
          }
          if (rig.dragging || rig.reading) return;
          state.current.hovered = false;
          onRead(item.id);
        },
      }
    : {};

  return (
    <group ref={group} position={board.pos} quaternion={board.quat}>
      <mesh geometry={geometry} castShadow receiveShadow {...handlers}>
        <meshStandardMaterial
          ref={material}
          map={painted.texture}
          emissiveMap={painted.texture}
          emissive="#ffffff"
          emissiveIntensity={0}
          bumpMap={bump}
          bumpScale={painted.glossy ? 0.15 : 0.5}
          roughness={painted.glossy ? 0.32 : 0.88}
          alphaTest={painted.alpha ? 0.5 : 0}
          side={THREE.DoubleSide}
        />
      </mesh>
      {overlay && <mesh geometry={geometry} material={overlay} renderOrder={2} />}
      <group ref={fasteners}>
        <group ref={pinsRef}>
          {pins.map((at) => (
            <Pin key={at.join()} position={[...local(item, at), 0.004]} color={Math.floor(r() * 6)} />
          ))}
        </group>
        {fasten === "tape" && (
          <Tape
            peelRef={tapePeel}
            position={[0, (item.h * UNIT) / 2, 0.01]}
            rot={(r() - 0.5) * 0.2}
            width={Math.min(1.1, item.w * UNIT * 0.4)}
          />
        )}
      </group>
    </group>
  );
}
