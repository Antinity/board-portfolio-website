/**
 * Board layout, authored in "board pixels" (origin top-left, y down) on a
 * 2800 x 1440 whiteboard. The 3D scene converts these to world units.
 *
 *  - SECTIONS: named groups (headings written on the board; accessible names)
 *  - ITEMS:    everything on the board: paper, and writing done in marker
 *  - LINKS:    red strings between two specific items
 *
 * Item `kind` picks a painter (src/three/painters) and a transcript
 * (src/reading/transcripts.jsx). `fasten`: "pin" (default) | "tape" | "pins" | "none";
 * `pins` overrides where the magnets go (fractions of width / height).
 * A job is a "case": an index card that opens like a book when picked up.
 * `ink`: written straight on the board (no paper, no fasteners).
 * `action`: what a click does — "read" (default: pick it up and read it),
 * "link" (open `props.social.url`), "copy" (copy the email address),
 * "ink" (open a link written on the board), "none".
 *
 *   To do    |  About me     |  The jobs (3 x 3)
 *   Skills   |  Contact      |  What people say
 *
 * The subject has no heading: the About me page and photo are the centrepiece.
 */

import { operations, socials, stack, witnesses, works } from "./content";

export const BOARD = { width: 2800, height: 1440, frame: 42 };

export const SECTIONS = {
  subject: { title: "The subject" },
  jobs: { title: "The jobs" },
  say: { title: "What people say" },
  todo: { title: "To do" },
  skills: { title: "Skills" },
  contact: { title: "Contact" },
};

/** Three columns (board px). */
const COL = { a: { x: 70, w: 860 }, b: { x: 990, w: 790 }, c: { x: 1840, w: 890 } };
const HEADING_H = 96;

/** A heading written in marker across a column, with its stars and underline. */
const heading = (section, { x, w }, y) => ({
  id: `label-${section}`,
  section,
  kind: "label",
  x,
  y,
  w,
  h: HEADING_H,
  rot: 0,
  z: 1,
  ink: true,
  fasten: "none",
  action: "none",
  props: { text: SECTIONS[section].title },
});

/** Evenly spread `n` boxes of width `w` across a span. */
const spread = (span, n, w) => {
  const gap = (span.w - n * w) / (n + 1);
  return Array.from({ length: n }, (_, i) => span.x + gap + i * (w + gap));
};

const PRINT_W = 270;
const PRINT_H = Math.round(PRINT_W * 0.706 + 105);
const PRINT_PITCH = PRINT_H + 12; // the jobs sit close together
const ICON_W = 140;
const iconSocials = socials.filter((s) => s.icon);
const SAY_W = 280;

export const ITEMS = [
  // ---------- Left column: to do, skills (both written on the board) ----------
  heading("todo", COL.a, 24),
  { id: "todo-list", section: "todo", kind: "todo", x: COL.a.x, y: 126, w: COL.a.w, h: 640, rot: 0, z: 1, ink: true, fasten: "none", action: "ink", props: { items: operations } },

  heading("skills", COL.a, 788),
  ...stack.map((group, i) => ({
    id: `stack-${group.group.toLowerCase()}`,
    section: "skills",
    kind: "tag",
    x: COL.a.x + (i % 2) * 440,
    y: 900 + Math.floor(i / 2) * 242,
    w: 420,
    h: 230,
    rot: 0,
    z: 1,
    ink: true,
    fasten: "none",
    action: "none",
    props: { group },
  })),

  // ---------- Centre: the subject (no heading) ----------
  { id: "subject-profile", section: "subject", kind: "profile", x: 1325, y: 60, w: 455, h: 780, rot: 0.5, z: 1, fasten: "pins" },
  { id: "subject-photo", section: "subject", kind: "polaroid", x: 995, y: 130, w: 305, h: 366, rot: -3, z: 2 },

  // ---------- Centre: contact ----------
  heading("contact", COL.b, 868),
  { id: "contact-email", section: "contact", kind: "emailslip", x: 1015, y: 980, w: 740, h: 150, rot: 0, z: 1, ink: true, fasten: "none", action: "copy" },
  ...iconSocials.map((social, i) => ({
    id: `social-${social.id}`,
    section: "contact",
    kind: "social",
    x: spread(COL.b, iconSocials.length, ICON_W)[i],
    y: 1160,
    w: ICON_W,
    h: ICON_W,
    rot: 0,
    z: 1,
    ink: true,
    fasten: "none",
    action: social.url ? "link" : "none",
    props: { social },
  })),

  // ---------- Right column: the jobs, three by three, then what people say ----------
  heading("jobs", COL.c, 24),
  ...works.map((work, i) => ({
    id: `job-${work.id}`,
    section: "jobs",
    kind: "case",
    x: spread(COL.c, 3, PRINT_W)[i % 3],
    y: 124 + Math.floor(i / 3) * PRINT_PITCH,
    w: PRINT_W,
    h: PRINT_H,
    rot: [0.6, -0.5, 0.4, -0.6, 0.5, -0.4, 0.6, -0.5, 0.4][i % 9],
    z: 1,
    // the magnet keeps clear of the paper clip on the print
    pins: work.image ? [[0.82, 0.05]] : [[0.5, 0.042]],
    props: { work },
  })),

  heading("say", COL.c, 1044),
  ...witnesses.map((witness, i) => ({
    id: `witness-${witness.id}`,
    section: "say",
    kind: "crew",
    x: spread(COL.c, witnesses.length, SAY_W)[i],
    y: 1142,
    w: SAY_W,
    h: 278,
    rot: [-0.6, 0.4, -0.3][i],
    z: 1,
    fasten: "pin",
    props: { witness },
  })),
];

/**
 * Red strings between related evidence: few, short and purposeful.
 * Each end names an item and, optionally, where on it the pin sits
 * (`at`: fractions of width / height, default top-centre).
 */
export const LINKS = [
  // the Minemen community: tier list <-> tier tests
  { from: { item: "job-mtl", at: [0.94, 0.3] }, to: { item: "job-mtt", at: [0.06, 0.3] } },
];
export const itemById = Object.fromEntries(ITEMS.map((i) => [i.id, i]));

/** What a click on an item does. */
export const actionOf = (item) => item.action ?? "read";

/** Items you can pick up and read, in reading order. */
export const READABLE = ITEMS.filter((i) => actionOf(i) === "read");

/** Writing on the board that carries content (read by screen readers, not picked up). */
export const WRITTEN = ITEMS.filter((i) => i.ink && ["todo", "tag"].includes(i.kind));

/** Where the torch rests before the visitor moves the pointer. */
export const HOME_ITEM = "subject-profile";
