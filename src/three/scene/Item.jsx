"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { actionOf } from "@/data/boardLayout";
import { contact } from "@/data/content";
import { paintItem } from "../painters";
import { seeded } from "../painters/common";
import { paperBumpTexture } from "../textures/procedural";
import { UNIT, itemZ, rectCenter } from "../space";
import { damp } from "../rig";
import { loading } from "../loading";
import { Pin, Tape } from "./Fasteners";

const READ_DIST = 1.6; // how far in front of the camera a page is held to read
const PICK_UP_SECONDS = 1.15;
const PUT_BACK_SECONDS = 1.6;
const CIRCLE_IN_SECONDS = 0.22; // the red marker loop draws on hover…
const CIRCLE_OUT_SECONDS = 0.18; // …and wipes away when the pointer leaves
const READ_TILT = { x: 0.06, y: 0.08 }; // slight tilt toward the pointer while reading (radians)

/**
 * Paper geometry that isn't perfectly flat: edges lift a little and one
 * corner curls.
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
    pos.setZ(i, z);
  }
  geo.computeVertexNormals();
  return geo;
}

/** A loose, overshooting dry-erase loop around an item, in its local space. */
function markerLoop(item) {
  const r = seeded(`${item.id}-loop`);
  const rx = (item.w * UNIT) / 2 + Math.min(0.32, item.w * UNIT * 0.14);
  const ry = (item.h * UNIT) / 2 + Math.min(0.28, item.h * UNIT * 0.14);
  const start = Math.PI * (0.85 + r() * 0.3);
  const pts = [];
  const steps = 26;
  for (let i = 0; i <= steps; i++) {
    const a = start - (i / steps) * Math.PI * 2 * 1.1; // a little past a full turn
    const wobble = 1 + (r() - 0.5) * 0.045 + i * 0.0018;
    pts.push(new THREE.Vector3(Math.cos(a) * rx * wobble, Math.sin(a) * ry * wobble, 0.07));
  }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 200, 0.026, 5);
}

const markerInk = new THREE.MeshStandardMaterial({ color: "#b3161d", roughness: 0.7 });

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
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const clamp01 = (t) => Math.min(1, Math.max(0, t));
const tmp = { pos: new THREE.Vector3(), quat: new THREE.Quaternion(), fwd: new THREE.Vector3(), right: new THREE.Vector3() };
const TILT = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, THREE.MathUtils.degToRad(-1.2)));
const turnEuler = new THREE.Euler(0, 0, 0, "YXZ");
const turnQuat = new THREE.Quaternion();

/** Link region (board px, item-local) under a uv coordinate, if any. */
function linkAt(item, links, uv) {
  if (!uv || !links?.length) return null;
  const x = uv.x * item.w;
  const y = (1 - uv.y) * item.h;
  return links.find((l) => x >= l.x && x <= l.x + l.w && y >= l.y && y <= l.y + l.h) ?? null;
}

function openLink(href) {
  window.open(href, href.startsWith("mailto:") ? "_self" : "_blank", "noopener");
}

async function copyEmail() {
  try {
    await navigator.clipboard.writeText(contact.email);
    window.dispatchEvent(new CustomEvent("board:toast", { detail: "Email copied" }));
  } catch {
    window.dispatchEvent(new CustomEvent("board:toast", { detail: contact.email }));
  }
}

/**
 * One piece of evidence: a painted sheet of matte paper with its pins or
 * tape. Hovering draws a red marker loop around it. Clicking does the
 * item's action: pick it up to read (it lifts off the board, faces the
 * viewer and can be spun with a drag), open a link, or copy the email.
 *
 * @param {number[][]} occupied   pin spots already used by red strings
 * @param {{shift:number,height:number,width:number}} readLayout  reading pose
 */
export default function Item({ item, occupied = [], rig, selected, onRead, readLayout }) {
  const [painted, setPainted] = useState(null);
  const geometry = useMemo(() => curledPlane(item), [item]);
  const action = actionOf(item);
  const loop = useMemo(() => (action === "none" ? null : markerLoop(item)), [item, action]);
  const bump = useMemo(() => paperBumpTexture(), []);
  const group = useRef(null);
  const fasteners = useRef(null);
  const pinsRef = useRef(null);
  const tapePeel = useRef(null);
  const material = useRef(null);
  const state = useRef({ t: 0, hovered: false, circle: 0, tiltX: 0, tiltY: 0, yaw: 0, pitch: 0 });

  useEffect(() => {
    let alive = true;
    let texture;
    paintItem(item).then((res) => {
      texture = res.texture;
      if (!alive) return texture.dispose();
      setPainted(res);
      loading.step(item.id);
    });
    return () => {
      alive = false;
      texture?.dispose();
    };
  }, [item]);

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => loop?.dispose(), [loop]);

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

    // red marker loop: drawn quickly on hover, wiped from its start on leave
    if (loop) {
      const want = s.hovered && !rig.reading;
      s.circle = clamp01(s.circle + (want ? dt / CIRCLE_IN_SECONDS : -dt / CIRCLE_OUT_SECONDS));
      const n = loop.index.count;
      const p = easeOutCubic(s.circle);
      if (want) loop.setDrawRange(0, Math.floor((p * n) / 6) * 6);
      else {
        const startAt = Math.floor(((1 - p) * n) / 6) * 6;
        loop.setDrawRange(startAt, n - startAt);
      }
    }

    // Taking a page off the board is one timeline: pins pull out and the tape
    // peels up, then the page lifts and turns to face the viewer. Putting it
    // back plays it in reverse, a little slower.
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

    // held page: drag to spin it all the way round, plus a slight tilt
    // toward the pointer; it settles back to facing you when let go
    const k = damp(8, dt);
    s.yaw += ((selected ? rig.spin.yaw : 0) - s.yaw) * k;
    s.pitch += ((selected ? rig.spin.pitch : 0) - s.pitch) * k;
    s.tiltX += ((selected ? -rig.pointer.y * READ_TILT.x : 0) - s.tiltX) * damp(5, dt);
    s.tiltY += ((selected ? rig.pointer.x * READ_TILT.y : 0) - s.tiltY) * damp(5, dt);
    turnQuat.setFromEuler(turnEuler.set(s.pitch + s.tiltX, s.yaw + s.tiltY, 0));
    tmp.quat.copy(camera.quaternion).multiply(TILT).multiply(turnQuat);

    g.position.lerpVectors(board.pos, tmp.pos, e);
    g.position.z += Math.sin(e * Math.PI) * 0.45; // arc toward the viewer
    g.quaternion.slerpQuaternions(board.quat, tmp.quat, e);
    g.scale.setScalar(THREE.MathUtils.lerp(1, scale, e));

    if (pinsRef.current) {
      pinsRef.current.position.z = release * 0.22; // pulled out
      pinsRef.current.visible = release < 0.98;
    }
    if (tapePeel.current) tapePeel.current.rotation.x = release * 1.25; // peeled up off the board
    if (fasteners.current) fasteners.current.visible = e < 0.35;
    if (material.current) material.current.emissiveIntensity = e * 0.5; // readable even in the dark

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

  const handlers =
    action === "none"
      ? {}
      : {
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
              if (rig.dragging) return;
              const link = linkAt(item, painted.links, e.uv);
              if (link) openLink(link.href);
              return;
            }
            if (rig.dragging || rig.reading) return;
            if (action === "link") return openLink(item.props.social.url);
            if (action === "copy") return copyEmail();
            state.current.hovered = false;
            onRead(item.id);
          },
        };

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
          bumpScale={0.9}
          roughness={0.96}
          alphaTest={painted.alpha ? 0.5 : 0}
          side={painted.alpha ? THREE.DoubleSide : THREE.FrontSide}
        />
      </mesh>
      {/* the blank back of the sheet, seen when a held page is spun round */}
      {!painted.alpha && (
        <mesh geometry={geometry} receiveShadow>
          <meshStandardMaterial color="#e3e0d8" bumpMap={bump} bumpScale={0.9} roughness={0.97} side={THREE.BackSide} />
        </mesh>
      )}
      {loop && <mesh geometry={loop} material={markerInk} />}
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
