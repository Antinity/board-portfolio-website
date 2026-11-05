import styles from "./evidence.module.css";
import Pin from "./Pin";
import Tape from "./Tape";

/**
 * Positions any piece of evidence on the board (coordinates are relative to
 * the parent cluster) and optionally fastens it with a pin or a strip of tape.
 *
 * @param {object} props
 * @param {number} props.x
 * @param {number} props.y
 * @param {number} [props.w]       width in world units
 * @param {number} [props.h]       height in world units (defaults to auto)
 * @param {number} [props.rotate]  degrees
 * @param {number} [props.z]       stacking order inside the cluster
 * @param {string|false} [props.pin]  pin colour name, or false
 * @param {boolean|number} [props.tape] true, or a tape rotation in degrees
 */
export default function BoardItem({
  x,
  y,
  w,
  h,
  rotate = 0,
  z,
  pin = false,
  tape = false,
  className = "",
  style,
  children,
}) {
  return (
    <div
      className={`${styles.item} ${className}`}
      style={{ left: x, top: y, width: w, height: h, zIndex: z, "--rot": `${rotate}deg`, ...style }}
    >
      {children}
      {pin && <Pin color={pin} className={styles.pinTop} />}
      {tape !== false && <Tape rotate={typeof tape === "number" ? tape : undefined} />}
    </div>
  );
}
