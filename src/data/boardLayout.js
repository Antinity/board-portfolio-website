/**
 * Board layout, authored in "board pixels" (origin top-left, y down) on a
 * 2800 × 1640 cork surface. The 3D scene converts these to world units.
 *
 *  - SECTIONS: named groups (tape headings; used for accessible names)
 *  - ITEMS:    every piece of paper / photo on the board
 *  - LINKS:    red strings between two specific items
 *
 * Item `kind` picks a painter (src/three/painters) and a transcript
 * (src/reading/transcripts.jsx). `fasten`: "pin" (default) | "tape" | "pins" | "none".
 * `readable: false` keeps an item out of the reading view (e.g. headings).
 *
 *   Witnesses │                │ To Do
 *   Record    │  THE SUBJECT   │
 *   Approach  │  (poster)      │ Contact
 *   ─────────────── The Jobs (nine prints) ───────────────
 */

import { experience, operations, socials, stack, witnesses, works } from "./content";

export const BOARD = { width: 2800, height: 1640, frame: 70 };

export const SECTIONS = {
  subject: { exhibit: "A", title: "The Subject" },
  jobs: { exhibit: "B", title: "The Jobs" },
  witnesses: { exhibit: "C", title: "Witnesses" },
  record: { exhibit: "D", title: "Record" },
  approach: { exhibit: "E", title: "Approach" },
  todo: { exhibit: "F", title: "To Do" },
  contact: { exhibit: "G", title: "Contact" },
};

/** Grid: three columns over a full-width bottom row (board px). */
const COL = { a: { x: 70, w: 860 }, b: { x: 990, w: 820 }, c: { x: 1870, w: 860 } };
const FULL = { x: 70, w: 2660 };
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

const PRINT_W = 270;
const PRINT_H = Math.round(PRINT_W * 0.706 + 87);
const iconSocials = socials.filter((s) => s.icon);

export const ITEMS = [
  // ---------- Centre: the subject ----------
  { id: "subject-poster", section: "subject", kind: "poster", x: 1250, y: 120, w: 530, h: 620, rot: 0.5, z: 1, fasten: "pins" },
  { id: "subject-photo", section: "subject", kind: "polaroid", x: 1015, y: 270, w: 270, h: 324, rot: -4, z: 2, props: { photo: "subject" } },
  { id: "subject-dossier", section: "subject", kind: "dossier", x: 1040, y: 815, w: 730, h: 270, rot: -0.4, z: 1, fasten: "tape" },

  // ---------- Left column ----------
  heading("witnesses", COL.a, 50),
  ...witnesses.map((witness, i) => ({
    id: `witness-${witness.id}`,
    section: "witnesses",
    kind: "crew",
    x: spread(COL.a, witnesses.length, 255)[i],
    y: 120,
    w: 255,
    h: 350,
    rot: [-0.6, 0.4, -0.3][i],
    z: 1,
    fasten: "pins",
    props: { witness },
  })),

  heading("record", COL.a, 515),
  ...experience.map((job, i) => ({
    id: `record-${job.id}`,
    section: "record",
    kind: "indexcard",
    x: spread(COL.a, experience.length, 400)[i],
    y: 585,
    w: 400,
    h: 215,
    rot: i ? 0.6 : -0.6,
    z: 1,
    props: { job },
  })),

  heading("approach", COL.a, 840),
  ...stack.map((group, i) => ({
    id: `stack-${group.group.toLowerCase()}`,
    section: "approach",
    kind: "tag",
    x: spread(COL.a, stack.length, 195)[i],
    y: 910,
    w: 195,
    h: 235,
    rot: [-0.8, 0.6, -0.4, 0.8][i],
    z: 1,
    props: { group },
  })),

  // ---------- Right column ----------
  heading("todo", COL.c, 50),
  { id: "todo-list", section: "todo", kind: "todo", x: COL.c.x + (COL.c.w - 640) / 2, y: 120, w: 640, h: 440, rot: 0.4, z: 1, fasten: "tape", props: { items: operations } },

  heading("contact", COL.c, 620),
  { id: "contact-card", section: "contact", kind: "contactcard", x: 1905, y: 695, w: 480, h: 300, rot: -0.6, z: 1, fasten: "pins" },
  ...iconSocials.map((social, i) => ({
    id: `social-${social.id}`,
    section: "contact",
    kind: "social",
    x: 2425 + (i % 2) * 150,
    y: 700 + Math.floor(i / 2) * 150,
    w: 125,
    h: 125,
    rot: [-4, 3, 2.5, -3][i],
    z: 1,
    props: { social },
  })),

  // ---------- Bottom row: the jobs ----------
  heading("jobs", FULL, 1210),
  ...works.map((work, i) => ({
    id: `job-${work.id}`,
    section: "jobs",
    kind: "print",
    x: spread(FULL, works.length, PRINT_W)[i],
    y: 1285,
    w: PRINT_W,
    h: PRINT_H,
    rot: [0.6, -0.5, 0.4, -0.6, 0.5, -0.4, 0.6, -0.5, 0.4][i % 9],
    z: 1,
    props: { work },
  })),
];

/** Vertical position (fraction) of to-do line `i` — must match the todo painter. */
export function todoLineY(i) {
  return 0.29 + i * 0.105;
}

/**
 * Red strings between related evidence — kept few, short and purposeful.
 * Each end names an item and, optionally, where on it the pin sits
 * (`at`: fractions of width / height, default top-centre).
 */
export const LINKS = [
  // clients who vouched ↔ the work they hired him for
  { from: { item: "witness-jbablestime", at: [0.5, 0.97] }, to: { item: "record-ghast", at: [0.3, 0.06] } },
  { from: { item: "witness-nsrd", at: [0.5, 0.97] }, to: { item: "record-freelance", at: [0.25, 0.06] } },
  { from: { item: "witness-zackaria", at: [0.5, 0.97] }, to: { item: "record-freelance", at: [0.7, 0.06] } },
  // the Minemen community: tier list ↔ tier tests
  { from: { item: "job-mtl", at: [0.92, 0.3] }, to: { item: "job-mtt", at: [0.08, 0.3] } },
  // the subject ↔ how to reach him
  { from: { item: "subject-dossier", at: [0.97, 0.5] }, to: { item: "contact-card", at: [0.06, 0.5] } },
];
export const itemById = Object.fromEntries(ITEMS.map((i) => [i.id, i]));

/** Items you can pick up and read, in reading order (subject first). */
export const READABLE = ITEMS.filter((i) => i.readable !== false);

/** Where the torch rests before the visitor moves the pointer. */
export const HOME_ITEM = "subject-poster";
