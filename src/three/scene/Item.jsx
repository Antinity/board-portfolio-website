"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { actionOf } from "@/data/boardLayout";
import { contact } from "@/data/content";
import { paintItem, paintPages, pagesOf } from "../painters";
import { seeded } from "../painters/common";
import { smoothNoise } from "../painters/marker";
import { paperBumpTexture } from "../textures/procedural";
import { UNIT, itemZ, rectCenter } from "../space";
import { damp } from "../rig";
import { loading } from "../loading";
import { CLIP_TOP, Clip, Pin, Tape } from "./Fasteners";

const READ_DIST = 1.6; // how far in front of the camera a page is held to read
const PICK_UP_SECONDS = 1.15;
const PUT_BACK_SECONDS = 1.6;

// A card that opens like a book flies up first, then its cover swings open
// (and closes before it flies back). Both run on one timeline, 0..1.
const BOOK_PICK_UP_SECONDS = 2.0;
const BOOK_PUT_BACK_SECONDS = 1.8;
const BOOK_FLY = 0.6; // the flight takes this much of the timeline…
const BOOK_OPEN = 0.55; // …and the cover starts to swing just before it ends
const BOOK_SKEW = 0.011; // on the board, the leaf underneath sits a hair askew and peeks out
const STOCK = "#f6f4ee";
const BOOK_SPREAD = 0.978; // it opens not quite flat, so the spine reads as a fold
const GUTTER = 0.13; // width of the soft shadow either side of the spine (world units)

/** The shade in the fold of an open book: dark at the spine, gone a little way in. */
let gutterMap = null;
function gutterTexture() {
  if (gutterMap) return gutterMap;
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 2;
  const ctx = c.getContext("2d");
  const g = ctx.createLinearGradient(0, 0, 128, 0);
  g.addColorStop(0, "rgba(40,30,18,0.28)");
  g.addColorStop(0.35, "rgba(40,30,18,0.09)");
  g.addColorStop(1, "rgba(40,30,18,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 2);
  gutterMap = new THREE.CanvasTexture(c);
  gutterMap.colorSpace = THREE.SRGBColorSpace;
  return gutterMap;
}
const gutterGeometry = new THREE.PlaneGeometry(1, 1);
const CIRCLE_IN_SECONDS = 0.62; // the red marker loop is drawn on slowly enough to watch…
const CIRCLE_OUT_SECONDS = 0.34; // …and wipes away when the pointer leaves
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
  const flat = Boolean(item.ink); // writing on the board is flat
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

/**
 * The leaves of a card that opens like a book: a flat sheet, plus copies
 * for the inside of the cover with the texture mirrored, so it reads the
 * right way round once the cover has swung over sideways (`u`) or up (`v`).
 */
function bookLeaves(item) {
  const sheet = new THREE.PlaneGeometry(item.w * UNIT, item.h * UNIT, 4, 4);
  const mirror = (axis) => {
    const g = sheet.clone();
    const uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) {
      if (axis === "u") uv.setX(i, 1 - uv.getX(i));
      else uv.setY(i, 1 - uv.getY(i));
    }
    return g;
  };
  return { sheet, insideSide: mirror("u"), insideTop: mirror("v") };
}

/**
 * A loose, overshooting red marker loop drawn around an item, in its local
 * space: a flat ribbon lying on the board (not a wire) that swells and thins
 * with the pressure of the pen, thinner where it starts and lifts off.
 */
function markerLoop(item) {
  const r = seeded(`${item.id}-loop`);
  const margin = 0.11; // it hugs the item, outside its edge
  const a = (item.w * UNIT) / 2 + margin;
  const b = (item.h * UNIT) / 2 + margin;
  const start = Math.PI * (0.8 + r() * 0.4);
  const turns = 1.12; // a little past a full turn
  const e = 2 / 3.4; // squared-off circle: it follows a rectangle
  const N = 240;
  const sway = smoothNoise(r, 9);
  const press = smoothNoise(r, 16);
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const ang = start - t * Math.PI * 2 * turns;
    const c = Math.cos(ang);
    const sn = Math.sin(ang);
    const grow = 1 + t * 0.04 + (sway(t) - 0.5) * 0.06; // the pen wanders and spirals outward
    pts.push([a * grow * Math.sign(c) * Math.abs(c) ** e, b * grow * Math.sign(sn) * Math.abs(sn) ** e]);
  }
  const position = [];
  const index = [];
  const normal = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const [x0, y0] = pts[Math.max(i - 1, 0)];
    const [x1, y1] = pts[Math.min(i + 1, N)];
    const len = Math.hypot(x1 - x0, y1 - y0) || 1;
    const nx = -(y1 - y0) / len;
    const ny = (x1 - x0) / len;
    const lift = Math.min(1, t / 0.05, (1 - t) / 0.07);
    const w = 0.075 * (0.4 + 0.6 * press(t)) * (0.45 + 0.55 * lift) * (0.92 + r() * 0.16);
    const [x, y] = pts[i];
    position.push(x + (nx * w) / 2, y + (ny * w) / 2, 0.03, x - (nx * w) / 2, y - (ny * w) / 2, 0.03);
    normal.push(0, 0, 1, 0, 0, 1);
    if (i < N) index.push(2 * i, 2 * i + 1, 2 * i + 2, 2 * i + 1, 2 * i + 3, 2 * i + 2);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(position, 3));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(normal, 3));
  geo.setIndex(index);
  return geo;
}

// dry-erase ink: slightly shiny, lying flat on whatever it is drawn over
// it is drawn on top of everything near it (never hidden behind a neighbouring page, pin or string)
const markerInk = new THREE.MeshStandardMaterial({
  color: "#b3161d",
  roughness: 0.42,
  side: THREE.DoubleSide,
  transparent: true,
  depthTest: false,
  depthWrite: false,
});

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
const easeOutQuad = (t) => 1 - (1 - t) * (1 - t);
const clamp01 = (t) => Math.min(1, Math.max(0, t));
const tmp = {
  pos: new THREE.Vector3(),
  quat: new THREE.Quaternion(),
  fwd: new THREE.Vector3(),
  right: new THREE.Vector3(),
  up: new THREE.Vector3(),
  off: new THREE.Vector3(),
  base: new THREE.Vector3(),
};
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
  const loop = useMemo(() => (action === "none" || action === "ink" ? null : markerLoop(item)), [item, action]);
  const bump = useMemo(() => paperBumpTexture(), []);
  const group = useRef(null);
  const fasteners = useRef(null);
  const pinsRef = useRef(null);
  const tapePeel = useRef(null);
  const material = useRef(null);
  const loopMesh = useRef(null);
  const state = useRef({ t: 0, hovered: false, circle: 0, tiltX: 0, tiltY: 0, yaw: 0, pitch: 0, zoom: 1, panX: 0, panY: 0, hinge: "side" });

  // ---- a card that opens like a book ----
  const book = Boolean(pagesOf(item));
  const leaves = useMemo(() => (book ? bookLeaves(item) : null), [book, item]);
  const spread = useRef(null); // moves so the open spread stays centred
  const under = useRef(null); // the leaf under the cover
  const hinge = useRef(null);
  const cover = useRef(null);
  const insideSide = useRef(null);
  const insideTop = useRef(null);
  const gutterUnder = useRef(null);
  const gutterCover = useRef(null);
  const [inside, setInside] = useState(null); // { left, right } textures, painted only while open
  const insideNow = useRef(null);
  const pageMats = useMemo(() => {
    if (!book) return null;
    const page = (side) =>
      new THREE.MeshStandardMaterial({ color: STOCK, roughness: 0.96, bumpMap: bump, bumpScale: 0.9, side, emissive: "#000000", emissiveIntensity: 0 });
    return { left: page(THREE.BackSide), right: page(THREE.FrontSide) };
  }, [book, bump]);

  useEffect(() => () => leaves && Object.values(leaves).forEach((g) => g.dispose()), [leaves]);
  useEffect(() => () => pageMats && Object.values(pageMats).forEach((m) => m.dispose()), [pageMats]);
  const gutter = useMemo(
    () => (book ? new THREE.MeshBasicMaterial({ map: gutterTexture(), transparent: true, depthWrite: false, opacity: 0, side: THREE.DoubleSide }) : null),
    [book]
  );
  useEffect(() => () => gutter?.dispose(), [gutter]);

  // the inside pages are painted when the card is picked up, and let go a while after it is put back
  useEffect(() => {
    if (!book) return;
    const release = () => {
      const res = insideNow.current;
      insideNow.current = null;
      setInside(null);
      res?.left.texture.dispose();
      res?.right.texture.dispose();
    };
    if (!selected) {
      const t = setTimeout(release, BOOK_PUT_BACK_SECONDS * 1000 + 300);
      return () => clearTimeout(t);
    }
    if (insideNow.current) return;
    let alive = true;
    paintPages(item).then((res) => {
      if (!alive) {
        res.left.texture.dispose();
        res.right.texture.dispose();
        return;
      }
      insideNow.current = res;
      setInside(res);
    });
    return () => {
      alive = false;
    };
  }, [book, item, selected]);
  useEffect(
    () => () => {
      insideNow.current?.left.texture.dispose();
      insideNow.current?.right.texture.dispose();
    },
    []
  );

  useEffect(() => {
    if (!pageMats) return;
    for (const side of ["left", "right"]) {
      const m = pageMats[side];
      const tex = inside?.[side].texture ?? null;
      m.map = tex;
      m.emissiveMap = tex;
      m.color.set(tex ? "#ffffff" : STOCK);
      m.emissive.set(tex ? "#ffffff" : "#000000");
      m.needsUpdate = true;
    }
  }, [pageMats, inside]);

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
      const onBoard = s.t === 0; // not while it is held, or flying back to its place
      if (loopMesh.current) loopMesh.current.visible = !rig.reading && onBoard;
      const want = (s.hovered || rig.focus === item.id) && !rig.reading && onBoard;
      s.circle = clamp01(s.circle + (want ? dt / CIRCLE_IN_SECONDS : -dt / CIRCLE_OUT_SECONDS));
      const n = loop.index.count;
      const p = easeOutQuad(s.circle);
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
    const rate = dt / (book ? (selected ? BOOK_PICK_UP_SECONDS : BOOK_PUT_BACK_SECONDS) : selected ? PICK_UP_SECONDS : PUT_BACK_SECONDS);
    s.t = selected ? Math.min(1, s.t + rate) : Math.max(0, s.t - rate);
    if (book && selected && !insideNow.current) s.t = Math.min(s.t, BOOK_OPEN); // hold it shut until the inside is painted
    const fly = book ? clamp01(s.t / BOOK_FLY) : s.t;
    const release = easeInOutCubic(clamp01(fly / 0.24));
    const e = easeInOutCubic(clamp01((fly - 0.16) / 0.84));
    const open = book ? easeInOutCubic(clamp01((s.t - BOOK_OPEN) / (1 - BOOK_OPEN))) : 0;

    const fov = THREE.MathUtils.degToRad(camera.fov);
    const visH = 2 * READ_DIST * Math.tan(fov / 2);
    const visW = visH * camera.aspect;
    const fitScale = (w, h) => Math.min((readLayout.height * visH) / (h * UNIT), (readLayout.width * visW) / (w * UNIT));
    // while it is shut, pick the way to open it that shows the pages largest:
    // sideways like a book on a wide screen, upward like a notepad on a tall one
    if (book && open === 0) s.hinge = fitScale(item.w * 2, item.h) >= fitScale(item.w, item.h * 2) ? "side" : "top";
    const sideways = s.hinge === "side";
    const spanW = item.w * (book && sideways ? 1 + open : 1);
    const spanH = item.h * (book && !sideways ? 1 + open : 1);
    const scale = fitScale(spanW, spanH);

    if (book && spread.current) {
      const W = item.w * UNIT;
      const H = item.h * UNIT;
      spread.current.position.set(sideways ? (W / 2) * open : 0, sideways ? 0 : (-H / 2) * open, 0);
      hinge.current.position.set(sideways ? -W / 2 : 0, sideways ? 0 : H / 2, 0.0025);
      const swing = -Math.PI * BOOK_SPREAD * open;
      hinge.current.rotation.set(sideways ? 0 : swing, sideways ? swing : 0, 0);
      // the shade in the fold, along whichever edge is the spine (the same edge on both leaves)
      for (const [m, z] of [
        [gutterUnder.current, 0.0006],
        [gutterCover.current, -0.0006],
      ]) {
        m.scale.set(GUTTER, sideways ? H : W, 1);
        m.rotation.set(0, 0, sideways ? 0 : -Math.PI / 2);
        m.position.set(sideways ? (GUTTER - W) / 2 : 0, sideways ? 0 : (H - GUTTER) / 2, z);
      }
      gutter.opacity = open;
      cover.current.position.set(sideways ? W / 2 : 0, sideways ? 0 : -H / 2, 0);
      insideSide.current.visible = sideways;
      insideTop.current.visible = !sideways;
      under.current.rotation.z = BOOK_SKEW * (1 - e);
      if (pageMats) {
        pageMats.left.emissiveIntensity = e * 0.5;
        pageMats.right.emissiveIntensity = e * 0.5;
      }
    }
    camera.getWorldDirection(tmp.fwd);
    tmp.right.set(1, 0, 0).applyQuaternion(camera.quaternion);
    tmp.up.set(0, 1, 0).applyQuaternion(camera.quaternion);
    tmp.pos
      .copy(camera.position)
      .addScaledVector(tmp.fwd, READ_DIST)
      .addScaledVector(tmp.right, readLayout.shift * visW);

    // zoom into the held page and pan around it
    const kz = damp(10, dt);
    s.zoom += ((selected ? rig.readZoom : 1) - s.zoom) * kz;
    s.panX += ((selected ? rig.readPan.x : 0) - s.panX) * kz;
    s.panY += ((selected ? rig.readPan.y : 0) - s.panY) * kz;
    if (selected) rig.readHalf.set((spanW * UNIT * scale) / visW, (spanH * UNIT * scale) / visH);
    tmp.off
      .copy(tmp.right)
      .multiplyScalar((s.panX * visW) / 2)
      .addScaledVector(tmp.up, (s.panY * visH) / 2);

    // held page: drag to spin it all the way round, plus a slight tilt
    // toward the pointer; it settles back to facing you when let go
    const k = damp(8, dt);
    s.yaw += ((selected ? rig.spin.yaw : 0) - s.yaw) * k;
    s.pitch += ((selected ? rig.spin.pitch : 0) - s.pitch) * k;
    const tilts = selected && rig.input === "mouse"; // a finger has no hover to tilt toward
    s.tiltX += ((tilts ? -rig.pointer.y * READ_TILT.x : 0) - s.tiltX) * damp(5, dt);
    s.tiltY += ((tilts ? rig.pointer.x * READ_TILT.y : 0) - s.tiltY) * damp(5, dt);
    turnQuat.setFromEuler(turnEuler.set(s.pitch + s.tiltX, s.yaw + s.tiltY, 0));
    tmp.quat.copy(camera.quaternion).multiply(TILT).multiply(turnQuat);

    g.position.lerpVectors(board.pos, tmp.pos, e);
    g.position.z += Math.sin(e * Math.PI) * 0.45; // arc toward the viewer
    const base = tmp.base.copy(g.position);
    g.position.addScaledVector(tmp.off, e);
    g.quaternion.slerpQuaternions(board.quat, tmp.quat, e);
    g.scale.setScalar(THREE.MathUtils.lerp(1, scale * s.zoom, e));

    if (pinsRef.current) {
      pinsRef.current.position.z = release * 0.22; // pulled out
      pinsRef.current.visible = release < 0.98;
    }
    if (tapePeel.current) tapePeel.current.rotation.x = release * 1.25; // peeled up off the board
    if (fasteners.current) fasteners.current.visible = e < 0.35;
    if (material.current) material.current.emissiveIntensity = e * 0.5; // readable even in the dark

    if (selected || s.t > 0.001) {
      rig.readT = e;
      rig.readPoint.copy(base); // the torch and focus stay on the middle of the screen while the page is panned
    }
  });

  if (!painted) return null;

  const ink = Boolean(item.ink); // written on the board in marker: no paper, no fasteners
  const fasten = item.fasten ?? "pin";
  const pins = (item.pins ?? FASTENERS[fasten] ?? []).filter(
    (at) => !occupied.some((o) => Math.abs(o[0] - at[0]) * item.w < 40 && Math.abs(o[1] - at[1]) * item.h < 40)
  );
  const r = seeded(`${item.id}-pins`);

  /** Pointer handlers for one face; `links` are the link regions painted on it. */
  const handlersFor = (links) =>
    action === "none"
      ? {}
      : {
          onPointerOver: (e) => {
            e.stopPropagation();
            // only a mouse hovers; a touch must not leave a loop stuck on the last thing tapped
            if (!rig.reading && e.pointerType === "mouse") state.current.hovered = true;
          },
          onPointerOut: () => {
            state.current.hovered = false;
            if (selected) document.body.style.cursor = "";
          },
          onPointerMove: (e) => {
            if (!selected) return;
            e.stopPropagation();
            document.body.style.cursor = linkAt(item, links, e.uv) ? "pointer" : "";
          },
          onClick: (e) => {
            e.stopPropagation();
            if (selected) {
              if (rig.dragging || performance.now() < rig.suppressClickUntil) return;
              const link = linkAt(item, links, e.uv);
              if (link) openLink(link.href);
              return;
            }
            if (rig.dragging || rig.reading || performance.now() < rig.suppressClickUntil) return;
            if (action === "ink") {
              const link = linkAt(item, links, e.uv);
              if (link) openLink(link.href);
              return;
            }
            if (action === "link") return openLink(item.props.social.url);
            if (action === "copy") return copyEmail();
            state.current.hovered = false;
            onRead(item.id);
          },
        };

  const W = item.w * UNIT;
  const H = item.h * UNIT;
  const blankBack = <meshStandardMaterial color="#e3e0d8" bumpMap={bump} bumpScale={0.9} roughness={0.97} side={THREE.BackSide} />;
  const front = (
    <meshStandardMaterial
      ref={material}
      map={painted.texture}
      emissiveMap={painted.texture}
      emissive="#ffffff"
      emissiveIntensity={0}
      bumpMap={ink ? null : bump}
      bumpScale={0.9}
      roughness={ink ? 0.48 : 0.96}
      transparent={ink}
      depthWrite={!ink}
      polygonOffset={ink}
      polygonOffsetFactor={-1}
      polygonOffsetUnits={-1}
      alphaTest={painted.alpha && !ink ? 0.5 : 0}
      side={painted.alpha && !ink ? THREE.DoubleSide : THREE.FrontSide}
    />
  );

  return (
    <group ref={group} position={board.pos} quaternion={board.quat}>
      {book ? (
        <group ref={spread}>
          {/* the leaf underneath: the write-up on its face, blank behind */}
          <group ref={under} rotation={[0, 0, BOOK_SKEW]}>
            <mesh geometry={leaves.sheet} material={pageMats.right} receiveShadow {...handlersFor(inside?.right.links)} />
            <mesh ref={gutterUnder} geometry={gutterGeometry} material={gutter} />
            <mesh geometry={leaves.sheet} receiveShadow>
              {blankBack}
            </mesh>
          </group>
          {/* the cover, on a hinge along its left edge (or its top edge, opened like a notepad) */}
          <group ref={hinge} position={[-W / 2, 0, 0.0025]}>
            <group ref={cover} position={[W / 2, 0, 0]}>
              <mesh geometry={leaves.sheet} castShadow receiveShadow {...handlersFor(painted.links)}>
                {front}
              </mesh>
              <mesh ref={insideSide} geometry={leaves.insideSide} material={pageMats.left} receiveShadow {...handlersFor(inside?.left.links)} />
              <mesh ref={insideTop} geometry={leaves.insideTop} material={pageMats.left} receiveShadow visible={false} {...handlersFor(inside?.left.links)} />
              <mesh ref={gutterCover} geometry={gutterGeometry} material={gutter} />
              {item.props.work?.image && <Clip position={[-W * 0.27, H / 2 + 0.17 - CLIP_TOP, 0.001]} rot={0.07} />}
            </group>
          </group>
        </group>
      ) : (
        <>
          <mesh geometry={geometry} castShadow={!ink} receiveShadow={!ink} renderOrder={ink ? 2 : 0} {...handlersFor(painted.links)}>
            {front}
          </mesh>
          {/* the blank back of the sheet, seen when a held page is spun round */}
          {!painted.alpha && (
            <mesh geometry={geometry} receiveShadow>
              {blankBack}
            </mesh>
          )}
        </>
      )}
      {loop && <mesh ref={loopMesh} geometry={loop} material={markerInk} renderOrder={10} />}
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
