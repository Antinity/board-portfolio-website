/**
 * Board layout, authored in "board pixels" (origin top-left, y down) on a
 * 2800 x 1440 whiteboard. The 3D scene converts these to world units.
 *
 *  - SECTIONS: named groups (tape headings; used for accessible names)
 *  - ITEMS:    every piece of paper on the board
 *  - LINKS:    red strings between two specific items
 *
 * Item `kind` picks a painter (src/three/painters) and a transcript
 * (src/reading/transcripts.jsx). `fasten`: "pin" (default) | "tape" | "pins" | "none".
 * `action`: what a click does — "read" (default: pick it up and read it),
 * "link" (open `props.social.url`), "copy" (copy the email address), "none".
 *
 *   Witnesses  |  The subject  |  The jobs
 *   To do      |               |  (3 x 3)
 *   Approach   |  Contact      |
 */

import { operations, socials, stack, witnesses, works } from "./content";

export const BOARD = { width: 2800, height: 1440, frame: 42 };

export const SECTIONS = {
  subject: { title: "The subject" },
  jobs: { title: "The jobs" },
  witnesses: { title: "Witnesses" },
  todo: { title: "To do" },
  approach: { title: "Approach" },
  contact: { title: "Contact" },
};

/** Three columns (board px). */
const COL = { a: { x: 70, w: 860 }, b: { x: 990, w: 790 }, c: { x: 1840, w: 890 } };
const HEADING_H = 58;

/** Tape heading centred over a column. */
const heading = (section, { x, w }, y) => {
  const text = SECTIONS[section].title;
  const hw = 48 + text.length * 22;
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
    action: "none",
    props: { text },
  };
};

/** Evenly spread `n` boxes of width `w` across a span. */
const spread = (span, n, w) => {
  const gap = (span.w - n * w) / (n + 1);
  return Array.from({ length: n }, (_, i) => span.x + gap + i * (w + gap));
};

const PRINT_W = 270;
const PRINT_H = Math.round(PRINT_W * 0.706 + 105);
const ICON_W = 118;
const iconSocials = socials.filter((s) => s.icon);

export const ITEMS = [
  // ---------- Centre: the subject ----------
  heading("subject", COL.b, 40),
  { id: "subject-profile", section: "subject", kind: "profile", x: 1255, y: 110, w: 490, h: 700, rot: 0.5, z: 1, fasten: "pins" },
  { id: "subject-photo", section: "subject", kind: "polaroid", x: 1000, y: 175, w: 290, h: 348, rot: -3, z: 2 },

  // ---------- Centre: contact ----------
  heading("contact", COL.b, 880),
  { id: "contact-email", section: "contact", kind: "emailslip", x: 1015, y: 955, w: 740, h: 118, rot: -0.4, z: 1, fasten: "tape", action: "copy" },
  ...iconSocials.map((social, i) => ({
    id: `social-${social.id}`,
    section: "contact",
    kind: "social",
    x: spread(COL.b, iconSocials.length, ICON_W)[i],
    y: 1135,
    w: ICON_W,
    h: ICON_W,
    rot: [-3, 2, -1.5, 3, -2][i % 5],
    z: 1,
    action: social.url ? "link" : "none",
    props: { social },
  })),

  // ---------- Left column ----------
  heading("witnesses", COL.a, 40),
  ...witnesses.map((witness, i) => ({
    id: `witness-${witness.id}`,
    section: "witnesses",
    kind: "crew",
    x: spread(COL.a, witnesses.length, 255)[i],
    y: 110,
    w: 255,
    h: 350,
    rot: [-0.6, 0.4, -0.3][i],
    z: 1,
    fasten: "pins",
    props: { witness },
  })),

  heading("todo", COL.a, 510),
  { id: "todo-list", section: "todo", kind: "todo", x: COL.a.x + (COL.a.w - 640) / 2, y: 580, w: 640, h: 430, rot: 0.4, z: 1, fasten: "tape", props: { items: operations } },

  heading("approach", COL.a, 1060),
  ...stack.map((group, i) => ({
    id: `stack-${group.group.toLowerCase()}`,
    section: "approach",
    kind: "tag",
    x: spread(COL.a, stack.length, 195)[i],
    y: 1130,
    w: 195,
    h: 235,
    rot: [-0.8, 0.6, -0.4, 0.8][i],
    z: 1,
    props: { group },
  })),

  // ---------- Right column: the jobs, three by three ----------
  heading("jobs", COL.c, 40),
  ...works.map((work, i) => ({
    id: `job-${work.id}`,
    section: "jobs",
    kind: "print",
    x: spread(COL.c, 3, PRINT_W)[i % 3],
    y: 115 + Math.floor(i / 3) * 430,
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

const todoLine = (opId) => [0.075, todoLineY(operations.findIndex((o) => o.id === opId))];

/**
 * Red strings between related evidence: few, short and purposeful.
 * Each end names an item and, optionally, where on it the pin sits
 * (`at`: fractions of width / height, default top-centre).
 */
export const LINKS = [
  // the Ghast.io owner who vouched for him <-> the Ghast.io work on the list
  { from: { item: "witness-jbablestime", at: [0.5, 0.97] }, to: { item: "todo-list", at: todoLine("op-ghast") } },
  // the Minemen community: tier list <-> tier tests
  { from: { item: "job-mtl", at: [0.94, 0.3] }, to: { item: "job-mtt", at: [0.06, 0.3] } },
  // the suspect <-> how to reach him
  { from: { item: "subject-profile", at: [0.5, 0.97] }, to: { item: "contact-email", at: [0.6, 0.1] } },
];
export const itemById = Object.fromEntries(ITEMS.map((i) => [i.id, i]));

/** What a click on an item does. */
export const actionOf = (item) => item.action ?? "read";

/** Items you can pick up and read, in reading order. */
export const READABLE = ITEMS.filter((i) => actionOf(i) === "read");

/** Where the torch rests before the visitor moves the pointer. */
export const HOME_ITEM = "subject-profile";
