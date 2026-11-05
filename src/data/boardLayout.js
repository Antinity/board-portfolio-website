/**
 * Board geometry, in "world" units (1 unit = 1px at zoom 1).
 * Move a section by changing its `bounds`; strings follow automatically.
 */

export const WORLD = { width: 2600, height: 1700, frame: 56 };

/** Order here is the order used by the case index and prev/next navigation. */
export const SECTION_LAYOUT = [
  {
    id: "profile",
    exhibit: "A",
    title: "Subject Profile",
    bounds: { x: 80, y: 80, w: 760, h: 640 },
    anchor: { x: 600, y: 72 },
  },
  {
    id: "experience",
    exhibit: "B",
    title: "Timeline",
    bounds: { x: 900, y: 60, w: 1040, h: 560 },
    anchor: { x: 520, y: 520 },
  },
  {
    id: "skills",
    exhibit: "C",
    title: "Evidence Locker",
    bounds: { x: 2020, y: 70, w: 500, h: 720 },
    anchor: { x: 60, y: 420 },
  },
  {
    id: "projects",
    exhibit: "D",
    title: "Case Files",
    bounds: { x: 880, y: 1040, w: 1120, h: 600 },
    anchor: { x: 560, y: 70 },
  },
  {
    id: "contact",
    exhibit: "E",
    title: "Tip Line",
    bounds: { x: 2040, y: 880, w: 480, h: 740 },
    anchor: { x: 60, y: 120 },
  },
  {
    id: "socials",
    exhibit: "F",
    title: "Known Associates",
    bounds: { x: 80, y: 790, w: 760, h: 400 },
    anchor: { x: 700, y: 110 },
  },
  {
    id: "education",
    exhibit: "G",
    title: "Background Check",
    bounds: { x: 80, y: 1260, w: 760, h: 380 },
    anchor: { x: 680, y: 90 },
  },
];

/** The central case title card every string leads back to. */
export const CENTER_CARD = {
  bounds: { x: 1070, y: 690, w: 460, h: 290 },
  anchor: { x: 230, y: 16 },
};

/**
 * Extra red strings between sections (in addition to centre → every section).
 * Each end is a section id; it attaches at that section's anchor.
 */
export const CROSS_LINKS = [
  ["profile", "experience"],
  ["projects", "skills"],
  ["contact", "socials"],
  ["profile", "socials"],
  ["projects", "experience"],
];

export const sectionById = Object.fromEntries(SECTION_LAYOUT.map((s) => [s.id, s]));

/** Absolute world position of a section anchor. */
export function anchorPoint({ bounds, anchor }) {
  return { x: bounds.x + anchor.x, y: bounds.y + anchor.y };
}
