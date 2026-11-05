import styles from "./evidence.module.css";

export const PIN_COLORS = {
  red: "#c4262e",
  blue: "#2a5fc4",
  green: "#2f9a4c",
  yellow: "#e2b82c",
  white: "#e9e6dc",
  black: "#222",
};

/** A push pin. Position it with `style` ({ left, top }) or a className. */
export default function Pin({ color = "red", className = "", style }) {
  return (
    <span
      aria-hidden="true"
      className={`${styles.pin} ${className}`}
      style={{ "--pin-color": PIN_COLORS[color] ?? color, ...style }}
    />
  );
}
