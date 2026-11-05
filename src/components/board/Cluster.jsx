import { SectionLabel } from "@/components/evidence";
import styles from "./board.module.css";

const MARKER_BLEED = { x: 50, y: 40 };

// A loose, overshooting hand-drawn loop, in 0–100 space.
const MARKER_SHAPE = [
  [8, 46], [6, 18, 34, 3, 58, 4], [84, 5, 98, 26, 96, 52], [94, 80, 70, 97, 44, 96], [18, 95, 3, 74, 6, 46], [8, 30, 18, 18, 30, 12],
];

function markerPath(w, h) {
  const pt = (x, y) => `${((x / 100) * w).toFixed(1)} ${((y / 100) * h).toFixed(1)}`;
  const [[mx, my], ...curves] = MARKER_SHAPE;
  return `M${pt(mx, my)} ` + curves.map(([a, b, c, d, e, f]) => `C${pt(a, b)} ${pt(c, d)} ${pt(e, f)}`).join(" ");
}

/**
 * One section of the board: a clickable group of evidence with a typed label
 * and a hand-drawn marker circle that appears on hover / focus.
 */
export default function Cluster({ section, active, onSelect }) {
  const { id, exhibit, title, bounds, Evidence } = section;

  const open = () => onSelect(id);
  const onKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      open();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Open exhibit ${exhibit}: ${title}`}
      aria-pressed={active}
      data-active={active || undefined}
      data-cluster
      className={styles.cluster}
      style={{ left: bounds.x, top: bounds.y, width: bounds.w, height: bounds.h }}
      onClick={open}
      onKeyDown={onKeyDown}
    >
      <svg
        className={styles.marker}
        width={bounds.w + MARKER_BLEED.x * 2}
        height={bounds.h + MARKER_BLEED.y * 2}
        aria-hidden="true"
      >
        <path pathLength="1" d={markerPath(bounds.w + MARKER_BLEED.x * 2, bounds.h + MARKER_BLEED.y * 2)} />
      </svg>
      <Evidence section={section} />
      <div className={styles.label}>
        <SectionLabel exhibit={exhibit} title={title} />
      </div>
    </div>
  );
}
