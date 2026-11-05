"use client";

import { useEffect, useState } from "react";
import styles from "./toast.module.css";

/**
 * A short confirmation (e.g. "Email copied"), raised by the board with
 * `window.dispatchEvent(new CustomEvent("board:toast", { detail: text }))`.
 */
export default function Toast() {
  const [message, setMessage] = useState(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    let timer;
    const onToast = (e) => {
      setMessage(e.detail);
      setShown(true);
      clearTimeout(timer);
      timer = setTimeout(() => setShown(false), 1800);
    };
    window.addEventListener("board:toast", onToast);
    return () => {
      window.removeEventListener("board:toast", onToast);
      clearTimeout(timer);
    };
  }, []);

  return (
    <p className={styles.toast} data-shown={shown || undefined} role="status" aria-live="polite">
      {message}
    </p>
  );
}
