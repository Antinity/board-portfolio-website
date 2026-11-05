import styles from "./evidence.module.css";
import Snapshot from "./Snapshot";

/*
 * Paper-like surfaces. Each one only renders the surface itself — wrap it in
 * <BoardItem> to place it on the board.
 */

export function Polaroid({ caption, ...snapshotProps }) {
  return (
    <div className={styles.polaroid}>
      <Snapshot {...snapshotProps} />
      <div className={styles.polaroidCaption}>{caption}</div>
    </div>
  );
}

export const NOTE_COLORS = {
  yellow: "#f3dc6b",
  pink: "#f2a3b6",
  green: "#b5e08f",
  blue: "#9fd0ee",
  orange: "#f6b56a",
};

export function StickyNote({ color = "yellow", style, children }) {
  return (
    <div className={styles.sticky} style={{ "--note": NOTE_COLORS[color] ?? color, ...style }}>
      {children}
    </div>
  );
}

/** @param {"plain"|"lined"} [variant] @param {boolean} [torn] torn top edge */
export function Paper({ variant = "plain", torn = false, style, children }) {
  const cls = [styles.paper, variant === "lined" && styles.paperLined, torn && styles.paperTorn]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={cls} style={style}>
      {children}
    </div>
  );
}

export function IndexCard({ title, children }) {
  return (
    <div className={styles.indexCard}>
      <div className={styles.indexCardTitle}>{title}</div>
      {children}
    </div>
  );
}

export function Clipping({ masthead = "The Daily Record", date, headline, children }) {
  return (
    <div className={styles.clipping}>
      <div className={styles.clippingMast}>
        <span>{masthead}</span>
        {date && <span>{date}</span>}
      </div>
      <div className={styles.clippingHeadline}>{headline}</div>
      <div className={styles.clippingBody}>{children}</div>
    </div>
  );
}

/** A blueprint sheet. `sketch` adds faint architectural lines. */
export function Blueprint({ title, sketch = true, style, children }) {
  return (
    <div className={styles.blueprint} style={{ position: "relative", width: "100%", height: "100%", ...style }}>
      {sketch && (
        <svg className={styles.blueprintSketch} viewBox="0 0 1000 460" preserveAspectRatio="none" aria-hidden="true">
          <path d="M60 60 H420 V200 H260 V380 H60 Z M420 120 H640 V380 H260" />
          <path d="M700 60 H940 V300 H700 Z M760 300 V400 H940" />
          <circle cx="820" cy="180" r="60" />
          <path d="M120 200 H220 M330 260 V340 M500 200 V300" strokeDasharray="8 6" />
        </svg>
      )}
      {children}
      {title && <div className={styles.blueprintTitle}>{title}</div>}
    </div>
  );
}

export function Stamp({ children, color, rotate = -8, style }) {
  return (
    <span className={styles.stamp} style={{ "--stamp": color, "--stamp-rot": `${rotate}deg`, ...style }}>
      {children}
    </span>
  );
}

/** A key / value line in typewriter style. */
export function TypedRow({ label, children }) {
  return (
    <div className={styles.typedRow}>
      <span className={styles.typedKey}>{label}</span>
      <span>{children}</span>
    </div>
  );
}

export function TypedHeading({ children }) {
  return <div className={styles.typedHeading}>{children}</div>;
}

/** Big typed section label, e.g. "EXHIBIT A — SUBJECT PROFILE". */
export function SectionLabel({ exhibit, title }) {
  return (
    <div className={styles.label}>
      <span className={styles.labelExhibit}>Exhibit {exhibit}</span>
      {title}
    </div>
  );
}
