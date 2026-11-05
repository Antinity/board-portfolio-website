import styles from "./evidence.module.css";

/** A strip of masking tape across the top edge of its parent. */
export default function Tape({ rotate = -3, style }) {
  return <span aria-hidden="true" className={styles.tape} style={{ "--tape-rot": `${rotate}deg`, ...style }} />;
}
