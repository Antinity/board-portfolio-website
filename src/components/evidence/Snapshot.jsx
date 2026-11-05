import styles from "./evidence.module.css";

const hash = (str = "") => [...str].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

function PortraitSketch({ mugshot }) {
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {mugshot &&
        Array.from({ length: 9 }, (_, i) => (
          <g key={i} stroke="rgb(255 255 255 / 0.35)" strokeWidth="0.4">
            <line x1="0" x2="100" y1={10 + i * 10} y2={10 + i * 10} />
            <text x="3" y={9 + i * 10} fontSize="3.2" fill="rgb(255 255 255 / 0.5)" stroke="none">
              {6 - Math.floor(i / 2)}&apos;{i % 2 ? "6" : "0"}
            </text>
          </g>
        ))}
      <ellipse cx="50" cy="40" rx="15" ry="18" fill="rgb(20 18 16 / 0.85)" />
      <path d="M18 100 C20 72 34 62 50 62 C66 62 80 72 82 100 Z" fill="rgb(20 18 16 / 0.85)" />
    </svg>
  );
}

function SceneSketch({ seed }) {
  const r = (n) => ((seed >> n) & 15) / 15;
  return (
    <svg viewBox="0 0 100 75" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect x="0" y="52" width="100" height="23" fill="rgb(0 0 0 / 0.35)" />
      <rect x={8 + r(1) * 10} y={22 + r(2) * 10} width="26" height="40" fill="rgb(0 0 0 / 0.5)" />
      <rect x={44 + r(3) * 8} y={12 + r(4) * 12} width="18" height="50" fill="rgb(0 0 0 / 0.42)" />
      <rect x={70 + r(5) * 6} y={28 + r(6) * 8} width="22" height="34" fill="rgb(0 0 0 / 0.55)" />
      <circle cx={20 + r(7) * 60} cy="14" r="6" fill="rgb(255 250 230 / 0.35)" />
    </svg>
  );
}

function BadgeSketch({ label }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="30" fill="none" stroke="rgb(20 18 16 / 0.7)" strokeWidth="3" />
      <text
        x="50"
        y="58"
        textAnchor="middle"
        fontSize="24"
        fontFamily="var(--font-display)"
        fill="rgb(20 18 16 / 0.8)"
      >
        {label?.slice(0, 2).toUpperCase()}
      </text>
    </svg>
  );
}

/**
 * A photograph. Shows `src` when provided, otherwise a generated placeholder.
 *
 * @param {"portrait"|"mugshot"|"scene"|"badge"} [variant]
 * @param {number} [ratio]   width / height
 * @param {string} [seed]    varies the placeholder's tint and shapes
 * @param {string} [label]   text on a placard (mugshot) or monogram (badge)
 */
export default function Snapshot({ src, alt = "", variant = "scene", ratio = 1, seed = "", label }) {
  const h = hash(seed + variant);
  const hue = h % 360;
  const bg =
    variant === "badge"
      ? `linear-gradient(160deg, hsl(${hue} 18% 78%), hsl(${hue} 14% 62%))`
      : `linear-gradient(${150 + (h % 60)}deg, hsl(${hue} 22% 62%), hsl(${(hue + 40) % 360} 18% 34%))`;

  return (
    <div className={styles.snapshot} style={{ "--ratio": ratio, "--snap-bg": bg }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- arbitrary user images, sized by the card
        <img src={src} alt={alt} draggable={false} />
      ) : variant === "portrait" || variant === "mugshot" ? (
        <PortraitSketch mugshot={variant === "mugshot"} />
      ) : variant === "badge" ? (
        <BadgeSketch label={label} />
      ) : (
        <SceneSketch seed={h} />
      )}
      {variant === "mugshot" && label && <span className={styles.snapshotLabel}>{label}</span>}
    </div>
  );
}
