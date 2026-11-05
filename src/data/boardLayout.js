/**
 * Board layout, authored in "board pixels" (origin top-left, y down) on a
 * 2800 × 1560 cork surface. The 3D scene converts these to world units.
 *
 *  - SECTIONS: named groups (tape headings; used for accessible names)
 *  - ITEMS:    every piece of paper / photo on the board
 *  - LINKS:    red strings between two specific items
 *
 * Item `kind` picks a painter (src/three/painters) and a transcript
 * (src/reading/transcripts.jsx). `fasten`: "pin" (default) | "tape" | "pins" | "none".
 * `readable: false` keeps an item out of the reading view (e.g. headings).
 *
 * Organised like a heist planning board, in three rows:
 *   Witnesses · The Subject · To Do
 *   Approach  · Record      · Contact
 *   The Jobs (full width)
 */

import { experience, operations, projects, stack, witnesses } from "./content";

export const BOARD = { width: 2800, height: 1560, frame: 36 };

export const SECTIONS = {
  subject: { exhibit: "A", title: "The Subject" },
  witnesses: { exhibit: "B", title: "Witnesses" },
  todo: { exhibit: "C", title: "To Do" },
  approach: { exhibit: "D", title: "Approach" },
  record: { exhibit: "E", title: "Record" },
  contact: { exhibit: "F", title: "Contact" },
  jobs: { exhibit: "G", title: "The Jobs" },
};

/** Grid: three columns, three rows (board px). */
const COL = { a: { x: 80, w: 940 }, b: { x: 1080, w: 820 }, c: { x: 1960, w: 760 } };
const ROW = { top: 60, middle: 650, bottom: 1030 };
const HEADING_H = 58;

/** Tape heading centred over a column (or any span). */
const heading = (section, { x, w }, y) => {
  const text = SECTIONS[section].title.toUpperCase();
  const hw = 40 + text.length * 26;
  return {
    id: `label-${section}`,
    section,
    kind: "label",
    x: x + (w - hw) / 2,
    y,
    w: hw,
    h: HEADING_H,
    rot: 0,
    z: 6,
    fasten: "none",
    readable: false,
    props: { text },
  };
};

/** Evenly spread `n` boxes of width `w` across a span. */
const spread = (span, n, w) => {
  const gap = (span.w - n * w) / (n + 1);
  return Array.from({ length: n }, (_, i) => span.x + gap + i * (w + gap));
};

const project = (id) => projects.find((p) => p.id === id);
const PRINT_W = 400;
const printH = (img = 530 / 750) => Math.round(PRINT_W * img + 76);
const JOBS_ORDER = ["mtl", "mtt", "nexora", "raam", "unipower"];
const FULL = { x: 80, w: 2640 };

export const ITEMS = [
  // ---------- Top row ----------
  heading("witnesses", COL.a, ROW.top),
  ...witnesses.map((witness, i) => ({
    id: `witness-${witness.id}`,
    section: "witnesses",
    kind: "crew",
    x: spread(COL.a, witnesses.length, 280)[i],
    y: ROW.top + 80,
    w: 280,
    h: 400,
    rot: [-0.6, 0.4, -0.3][i],
    z: 1,
    fasten: "pins",
    props: { witness },
  })),

  heading("subject", COL.b, ROW.top),
  { id: "subject-photo", section: "subject", kind: "polaroid", x: 1110, y: ROW.top + 90, w: 300, h: 360, rot: -1, z: 1, props: { photo: "subject" } },
  { id: "subject-dossier", section: "subject", kind: "dossier", x: 1440, y: ROW.top + 80, w: 430, h: 470, rot: 0.6, z: 1, fasten: "tape" },
  { id: "subject-alias", section: "subject", kind: "sticky", x: 1200, y: ROW.top + 400, w: 150, h: 130, rot: -4, z: 3, fasten: "none", props: { text: "a.k.a.\nANTINITY", color: "yellow" } },

  heading("todo", COL.c, ROW.top),
  { id: "todo-list", section: "todo", kind: "todo", x: 2010, y: ROW.top + 85, w: 660, h: 450, rot: 0.4, z: 1, fasten: "tape", props: { items: operations } },

  // ---------- Middle row ----------
  heading("approach", COL.a, ROW.middle),
  ...stack.map((group, i) => ({
    id: `stack-${group.group.toLowerCase()}`,
    section: "approach",
    kind: "tag",
    x: spread(COL.a, stack.length, 205)[i],
    y: ROW.middle + 80,
    w: 205,
    h: 250,
    rot: [-0.8, 0.6, -0.4, 0.8][i],
    z: 1,
    props: { group },
  })),

  heading("record", COL.b, ROW.middle),
  ...experience.map((job, i) => ({
    id: `record-${job.id}`,
    section: "record",
    kind: "indexcard",
    x: spread(COL.b, experience.length, 385)[i],
    y: ROW.middle + 85,
    w: 385,
    h: 230,
    rot: i ? 0.6 : -0.6,
    z: 1,
    props: { job },
  })),

  heading("contact", COL.c, ROW.middle),
  { id: "contact-flyer", section: "contact", kind: "flyer", x: COL.c.x + (COL.c.w - 480) / 2, y: ROW.middle + 80, w: 480, h: 290, rot: -0.5, z: 1 },

  // ---------- Bottom row ----------
  heading("jobs", FULL, ROW.bottom),
  ...JOBS_ORDER.map((id, i) => {
    const p = project(id);
    return {
      id: `job-${id}`,
      section: "jobs",
      kind: "print",
      x: spread(FULL, JOBS_ORDER.length, PRINT_W)[i],
      y: ROW.bottom + 90,
      w: PRINT_W,
      h: printH(id === "nexora" ? 451 / 750 : undefined),
      rot: [0.6, -0.5, 0.4, -0.6, 0.5][i],
      z: 1,
      props: { project: p },
    };
  }),
];

/** Vertical position (fraction) of to-do line `i` — must match the todo painter. */
export function todoLineY(i) {
  return 0.29 + i * 0.105;
}

const todoLine = (opId) => [0.075, todoLineY(operations.findIndex((o) => o.id === opId))];

/**
 * Red strings between related evidence — kept few and purposeful.
 * Each end names an item and, optionally, where on it the pin sits
 * (`at`: fractions of width / height, default top-centre).
 */
export const LINKS = [
  // Ghast.io: the client who vouched ↔ the job ↔ the shipped item
  { from: { item: "witness-jbablestime", at: [0.5, 0.97] }, to: { item: "record-ghast", at: [0.1, 0.12] } },
  { from: { item: "record-ghast", at: [0.9, 0.12] }, to: { item: "todo-list", at: todoLine("op-ghast") } },
  // Minemen community: tier list owner ↔ tier list ↔ tier tests
  { from: { item: "witness-nsrd", at: [0.5, 0.97] }, to: { item: "job-mtl", at: [0.5, 0.05] } },
  { from: { item: "job-mtl", at: [0.95, 0.3] }, to: { item: "job-mtt", at: [0.05, 0.3] } },
  // Freelance record ↔ the client who hired him
  { from: { item: "witness-zackaria", at: [0.5, 0.97] }, to: { item: "record-freelance", at: [0.5, 0.06] } },
  // The subject ↔ how to reach him
  { from: { item: "subject-dossier", at: [0.92, 0.94] }, to: { item: "contact-flyer", at: [0.5, 0.05] } },
];
export const itemById = Object.fromEntries(ITEMS.map((i) => [i.id, i]));

/** Items you can pick up and read, in reading order (subject first). */
export const READABLE = ITEMS.filter((i) => i.readable !== false);

/** Where the torch rests before the visitor moves the pointer. */
export const HOME_ITEM = "subject-dossier";
