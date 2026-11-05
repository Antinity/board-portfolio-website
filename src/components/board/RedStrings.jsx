import { WORLD } from "@/data/boardLayout";
import { Pin } from "@/components/evidence";
import styles from "./board.module.css";

/** Quadratic curve that sags under gravity, like real yarn. */
function sagPath(a, b, sag = 0.1) {
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  const cx = (a.x + b.x) / 2;
  const cy = (a.y + b.y) / 2 + len * sag;
  return `M${a.x} ${a.y} Q${cx} ${cy} ${b.x} ${b.y}`;
}

/**
 * Red string connecting pinned points in world coordinates.
 * @param {{ from: {x,y}, to: {x,y} }[]} links
 */
export default function RedStrings({ links }) {
  const pins = new Map();
  links.forEach(({ from, to }) => {
    pins.set(`${from.x},${from.y}`, from);
    pins.set(`${to.x},${to.y}`, to);
  });

  return (
    <div className={styles.strings} aria-hidden="true">
      <svg width={WORLD.width} height={WORLD.height} viewBox={`0 0 ${WORLD.width} ${WORLD.height}`}>
        {links.map(({ from, to }, i) => (
          <g key={i}>
            <path className={styles.stringShadow} d={sagPath(from, to, 0.06 + (i % 3) * 0.02)} />
            <path className={styles.string} d={sagPath(from, to, 0.06 + (i % 3) * 0.02)} />
          </g>
        ))}
      </svg>
      {[...pins.values()].map((p) => (
        <Pin key={`${p.x},${p.y}`} color="red" style={{ left: p.x, top: p.y }} />
      ))}
    </div>
  );
}
