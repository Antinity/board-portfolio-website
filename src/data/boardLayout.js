/**
 * Board layout, authored in "board pixels" (origin top-left, y down) on a
 * 2800 × 1600 cork surface. The 3D scene converts these to world units.
 *
 *  - SECTIONS: named groups (shown as tape labels and in the reading view)
 *  - ITEMS:    every piece of paper / photo on the board
 *  - LINKS:    red strings between two specific items
 *
 * Item `kind` picks a painter (src/three/painters) and a transcript
 * (src/reading/transcripts.jsx). `fasten`: "pin" (default) | "tape" | "pins" | "none".
 * `readable: false` keeps an item out of the reading view (e.g. tape labels).
 *
 * Columns: The Jobs (left) · Approach / The Subject / Witnesses (centre) ·
 * To Do / Record / Contact (right). The subject sits dead centre.
 */

import { experience, operations, projects, stack, witnesses } from "./content";

export const BOARD = { width: 2800, height: 1600, frame: 36 };

export const SECTIONS = {
  subject: { exhibit: "A", title: "The Subject" },
  jobs: { exhibit: "B", title: "The Jobs" },
  todo: { exhibit: "C", title: "To Do" },
  approach: { exhibit: "D", title: "Approach" },
  witnesses: { exhibit: "E", title: "Witnesses" },
  record: { exhibit: "F", title: "Record" },
  contact: { exhibit: "G", title: "Contact" },
};

const label = (section, x, y, rot = -1.5) => {
  const text = SECTIONS[section].title.toUpperCase();
  return {
    id: `label-${section}`,
    section,
    kind: "label",
    x,
    y,
    w: 40 + text.length * 26,
    h: 58,
    rot,
    z: 6,
    fasten: "none",
    readable: false,
    props: { text },
  };
};

const project = (id) => projects.find((p) => p.id === id);
const printH = (w, img = 530 / 750) => w * img + 60;

export const ITEMS = [
  // ---------- A · The subject (centre) ----------
  label("subject", 1250, 440, -1),
  { id: "subject-photo", section: "subject", kind: "polaroid", x: 985, y: 520, w: 320, h: 384, rot: -3, z: 1, props: { photo: "subject" } },
  { id: "subject-dossier", section: "subject", kind: "dossier", x: 1360, y: 500, w: 470, h: 500, rot: 1.5, z: 1, fasten: "tape" },
  { id: "subject-alias", section: "subject", kind: "sticky", x: 1010, y: 860, w: 170, h: 150, rot: -7, z: 3, props: { text: "a.k.a.\nANTINITY", color: "yellow" } },

  // ---------- B · The jobs (left column) ----------
  label("jobs", 110, 50, 1.5),
  { id: "job-mtt", section: "jobs", kind: "print", x: 90, y: 140, w: 330, h: printH(330), rot: -2, z: 1, props: { project: project("mtt") } },
  { id: "job-nexora", section: "jobs", kind: "print", x: 470, y: 160, w: 330, h: printH(330, 451 / 750), rot: 2.5, z: 1, props: { project: project("nexora") } },
  { id: "job-unipower", section: "jobs", kind: "print", x: 100, y: 590, w: 330, h: printH(330), rot: 2, z: 1, props: { project: project("unipower") } },
  { id: "job-raam", section: "jobs", kind: "print", x: 475, y: 620, w: 330, h: printH(330), rot: -1.5, z: 1, props: { project: project("raam") } },
  { id: "job-mtl", section: "jobs", kind: "print", x: 285, y: 1080, w: 330, h: printH(330), rot: 1.2, z: 1, props: { project: project("mtl") } },

  // ---------- D · Approach (centre top) ----------
  label("approach", 1270, 40, 1),
  ...stack.map((group, i) => ({
    id: `stack-${group.group.toLowerCase()}`,
    section: "approach",
    kind: "tag",
    x: 915 + i * 250,
    y: 120 + (i % 2) * 14,
    w: 225,
    h: 250,
    rot: [-2.5, 1.8, -1.2, 2.2][i],
    z: 1,
    props: { group },
  })),

  // ---------- E · Witnesses (centre bottom) ----------
  label("witnesses", 1240, 1060, -2),
  ...witnesses.map((witness, i) => ({
    id: `witness-${witness.id}`,
    section: "witnesses",
    kind: "crew",
    x: 925 + i * 330,
    y: 1135 + (i % 2) * 12,
    w: 300,
    h: 400,
    rot: [-1.2, 1, -0.6][i],
    z: 1,
    fasten: "pins",
    props: { witness },
  })),

  // ---------- C · To do (right top) ----------
  label("todo", 2280, 45, 1),
  { id: "todo-list", section: "todo", kind: "todo", x: 2040, y: 110, w: 600, h: 440, rot: 1.2, z: 1, fasten: "tape", props: { items: operations } },

  // ---------- F · Record (right middle) ----------
  label("record", 2260, 610, 1.5),
  ...experience.map((job, i) => ({
    id: `record-${job.id}`,
    section: "record",
    kind: "indexcard",
    x: 2060 + i * 30,
    y: 680 + i * 235,
    w: 520,
    h: 215,
    rot: i ? 1.5 : -1.5,
    z: 1,
    props: { job },
  })),

  // ---------- G · Contact (right bottom) ----------
  label("contact", 2250, 1185, -1),
  { id: "contact-flyer", section: "contact", kind: "flyer", x: 2110, y: 1250, w: 440, h: 320, rot: -1.5, z: 1 },
];

/** Vertical position (fraction) of to-do line `i` — must match the todo painter. */
export function todoLineY(i) {
  return 0.29 + i * 0.105;
}

const todoLine = (opId) => [0.075, todoLineY(operations.findIndex((o) => o.id === opId))];

/**
 * Red strings between related evidence. Each end names an item and,
 * optionally, where on it the pin sits (`at`: fractions, default top-centre).
 */
export const LINKS = [
  // Ghast.io: the client who vouched ↔ the job ↔ the shipped item
  { from: { item: "witness-jbablestime", at: [0.5, 0.08] }, to: { item: "record-ghast", at: [0.08, 0.2] } },
  { from: { item: "record-ghast", at: [0.5, 0.08] }, to: { item: "todo-list", at: todoLine("op-ghast") } },
  // Minemen community: tier list owner ↔ tier list ↔ tier tests
  { from: { item: "witness-nsrd", at: [0.5, 0.08] }, to: { item: "job-mtl", at: [0.92, 0.5] } },
  { from: { item: "job-mtl" }, to: { item: "job-mtt", at: [0.5, 0.92] } },
  // Shipped list ↔ the work itself
  { from: { item: "todo-list", at: todoLine("op-nexora") }, to: { item: "job-nexora", at: [0.9, 0.1] } },
  // Freelance record ↔ the client who hired him
  { from: { item: "witness-zackaria", at: [0.5, 0.08] }, to: { item: "record-freelance", at: [0.08, 0.5] } },
  // The subject ↔ how he works ↔ how to reach him
  { from: { item: "subject-dossier", at: [0.5, 0.04] }, to: { item: "stack-frameworks", at: [0.6, 0.9] } },
  { from: { item: "subject-dossier", at: [0.95, 0.85] }, to: { item: "contact-flyer", at: [0.5, 0.08] } },
];

export const itemById = Object.fromEntries(ITEMS.map((i) => [i.id, i]));

/** Items you can pick up and read, in reading order (subject first). */
export const READABLE = ITEMS.filter((i) => i.readable !== false);

/** Where the torch rests before the visitor moves the pointer. */
export const HOME_ITEM = "subject-dossier";
