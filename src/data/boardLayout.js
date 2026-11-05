/**
 * Board layout, authored in "board pixels" (origin top-left, y down) on a
 * 2400 × 1400 cork surface. The 3D scene converts these to world units.
 *
 *  - SECTIONS: clickable areas that open a case file
 *  - ITEMS:    every piece of paper / photo on the board
 *  - LINKS:    red strings between two specific items
 *
 * Item `kind` picks a painter in src/three/painters. `props` are passed to it.
 * `fasten`: "pin" (default) | "tape" | "pins" (two pins) | "none".
 */

import { experience, operations, projects, socials, stack, witnesses } from "./content";

export const BOARD = { width: 2400, height: 1400, frame: 34 };

export const SECTIONS = [
  { id: "subject", exhibit: "A", title: "The Subject", bounds: { x: 40, y: 30, w: 790, h: 720 } },
  { id: "jobs", exhibit: "B", title: "The Jobs", bounds: { x: 860, y: 30, w: 830, h: 720 } },
  { id: "todo", exhibit: "C", title: "To Do", bounds: { x: 1720, y: 30, w: 650, h: 570 } },
  { id: "approach", exhibit: "D", title: "Approach", bounds: { x: 1720, y: 610, w: 650, h: 360 } },
  { id: "witnesses", exhibit: "E", title: "Witnesses", bounds: { x: 40, y: 770, w: 1110, h: 610 } },
  { id: "record", exhibit: "F", title: "Record", bounds: { x: 1170, y: 770, w: 520, h: 610 } },
  { id: "contact", exhibit: "G", title: "Contact", bounds: { x: 1720, y: 980, w: 650, h: 400 } },
];

const label = (section, text, x, y, rot = -1.5) => ({
  id: `label-${section}`,
  section,
  kind: "label",
  x,
  y,
  w: 34 + text.length * 26,
  h: 58,
  rot,
  z: 6,
  fasten: "none",
  props: { text },
});

const project = (id) => projects.find((p) => p.id === id);
const PHOTO_RATIO = 530 / 750;

export const ITEMS = [
  // ---------- A · The subject ----------
  label("subject", "THE SUBJECT", 70, 40),
  { id: "subject-blueprint", section: "subject", kind: "blueprint", x: 60, y: 108, w: 760, h: 480, rot: 0, z: 0, fasten: "pins", props: { title: "Workstation — LVL 1" } },
  { id: "subject-photo", section: "subject", kind: "polaroid", x: 92, y: 150, w: 250, h: 300, rot: -4, z: 2, props: { photo: "subject" } },
  { id: "subject-dossier", section: "subject", kind: "dossier", x: 380, y: 136, w: 410, h: 440, rot: 2, z: 1, fasten: "tape" },
  { id: "subject-alias", section: "subject", kind: "sticky", x: 108, y: 476, w: 200, h: 180, rot: -6, z: 3, props: { text: "a.k.a.\nANTINITY", color: "yellow" } },
  { id: "subject-clipping", section: "subject", kind: "clipping", x: 360, y: 560, w: 420, h: 180, rot: -1.5, z: 2 },

  // ---------- B · The jobs ----------
  label("jobs", "THE JOBS", 900, 40, 1.5),
  { id: "job-mtt", section: "jobs", kind: "print", x: 880, y: 110, w: 390, h: 390 * PHOTO_RATIO + 64, rot: -2, z: 1, props: { project: project("mtt") } },
  { id: "job-nexora", section: "jobs", kind: "print", x: 1300, y: 104, w: 360, h: 360 * (451 / 750) + 64, rot: 2.5, z: 1, props: { project: project("nexora") } },
  { id: "job-unipower", section: "jobs", kind: "print", x: 880, y: 440, w: 260, h: 260 * PHOTO_RATIO + 56, rot: 3, z: 2, props: { project: project("unipower") } },
  { id: "job-raam", section: "jobs", kind: "print", x: 1150, y: 420, w: 260, h: 260 * PHOTO_RATIO + 56, rot: -2, z: 1, props: { project: project("raam") } },
  { id: "job-mtl", section: "jobs", kind: "print", x: 1420, y: 440, w: 260, h: 260 * PHOTO_RATIO + 56, rot: 1.5, z: 2, props: { project: project("mtl") } },
  { id: "sticky-mtt", section: "jobs", kind: "sticky", x: 1170, y: 330, w: 140, h: 120, rot: 6, z: 4, fasten: "none", props: { text: "Next.js", color: "pink", small: true } },
  { id: "sticky-nexora", section: "jobs", kind: "sticky", x: 1540, y: 300, w: 140, h: 120, rot: -5, z: 4, fasten: "none", props: { text: "React", color: "yellow", small: true } },
  { id: "sticky-unipower", section: "jobs", kind: "sticky", x: 1010, y: 600, w: 130, h: 110, rot: -4, z: 4, fasten: "none", props: { text: "PHP", color: "yellow", small: true } },
  { id: "sticky-raam", section: "jobs", kind: "sticky", x: 1290, y: 590, w: 140, h: 110, rot: 5, z: 4, fasten: "none", props: { text: "Vanilla JS", color: "green", small: true } },
  { id: "sticky-mtl", section: "jobs", kind: "sticky", x: 1560, y: 610, w: 130, h: 110, rot: -3, z: 4, fasten: "none", props: { text: "PHP", color: "pink", small: true } },

  // ---------- C · To do ----------
  label("todo", "TO DO", 1880, 40, 1),
  { id: "todo-list", section: "todo", kind: "todo", x: 1770, y: 104, w: 560, h: 480, rot: 1.2, z: 1, fasten: "tape", props: { items: operations } },

  // ---------- D · Approach ----------
  label("approach", "APPROACH", 1880, 616, -1),
  ...stack.map((group, i) => ({
    id: `stack-${group.group.toLowerCase()}`,
    section: "approach",
    kind: "tag",
    x: 1745 + (i % 2) * 305,
    y: 680 + Math.floor(i / 2) * 140 + (i % 2) * 12,
    w: 290,
    h: 150,
    rot: [-2.5, 2, 1.5, -2][i],
    z: 1 + (i % 2),
    props: { group },
  })),

  // ---------- E · Witnesses ----------
  label("witnesses", "WITNESSES", 80, 780, -2),
  ...witnesses.map((witness, i) => ({
    id: `witness-${witness.id}`,
    section: "witnesses",
    kind: "crew",
    x: 70 + i * 355,
    y: 846 + (i % 2) * 14,
    w: 330,
    h: 500,
    rot: [-1.2, 1, -0.6][i],
    z: 1,
    fasten: "pins",
    props: { witness },
  })),

  // ---------- F · Record ----------
  label("record", "RECORD", 1230, 780, 1.5),
  ...experience.map((job, i) => ({
    id: `record-${job.id}`,
    section: "record",
    kind: "indexcard",
    x: 1195 + i * 25,
    y: 850 + i * 255,
    w: 460,
    h: 270,
    rot: i ? 2 : -2,
    z: 1 + i,
    props: { job },
  })),

  // ---------- G · Contact ----------
  label("contact", "CONTACT", 1770, 990, -1),
  { id: "contact-flyer", section: "contact", kind: "flyer", x: 1755, y: 1050, w: 330, h: 310, rot: -1.5, z: 1 },
  ...socials.map((social, i) => ({
    id: `social-${social.id}`,
    section: "contact",
    kind: "card",
    x: 2110 + (i % 2) * 14,
    y: 1020 + i * 86,
    w: 240,
    h: 136,
    rot: [4, -3, 2, -2][i],
    z: 2 + i,
    fasten: i === 0 ? "pin" : "none",
    props: { social },
  })),
];

/**
 * Red strings. Each end names an item and, optionally, where on the item the
 * pin sits (`at`: fractions of width / height, default top-centre).
 */
const todoLine = (opId) => [0.075, todoLineY(operations.findIndex((o) => o.id === opId))];

/** Vertical position (fraction) of to-do line `i` — must match the todo painter. */
export function todoLineY(i) {
  return 0.29 + i * 0.105;
}

export const LINKS = [
  // Ghast.io: the job, the client who vouched for it, and the shipped item
  { from: { item: "witness-jbablestime", at: [0.5, 0.1] }, to: { item: "record-ghast", at: [0.12, 0.15] } },
  { from: { item: "record-ghast", at: [0.9, 0.12] }, to: { item: "todo-list", at: todoLine("op-ghast") } },
  // Minemen community: tier list owner ↔ the tier list ↔ the tier tests site
  { from: { item: "witness-nsrd", at: [0.5, 0.1] }, to: { item: "job-mtl" } },
  { from: { item: "job-mtl" }, to: { item: "job-mtt", at: [0.85, 0.1] } },
  // Shipped list ↔ the work itself
  { from: { item: "todo-list", at: todoLine("op-tiertests") }, to: { item: "job-mtt", at: [0.9, 0.5] } },
  { from: { item: "todo-list", at: todoLine("op-nexora") }, to: { item: "job-nexora", at: [0.85, 0.12] } },
  // Freelance record ↔ client who hired him and the client sites
  { from: { item: "witness-zackaria", at: [0.5, 0.1] }, to: { item: "record-freelance", at: [0.1, 0.18] } },
  { from: { item: "record-freelance", at: [0.85, 0.15] }, to: { item: "job-raam", at: [0.5, 0.92] } },
  // The subject ↔ how he works ↔ how to reach him
  { from: { item: "subject-dossier", at: [0.88, 0.2] }, to: { item: "stack-frameworks", at: [0.5, 0.12] } },
  { from: { item: "subject-dossier", at: [0.7, 0.92] }, to: { item: "contact-flyer", at: [0.5, 0.08] } },
];

export const sectionById = Object.fromEntries(SECTIONS.map((s) => [s.id, s]));
export const itemById = Object.fromEntries(ITEMS.map((i) => [i.id, i]));
