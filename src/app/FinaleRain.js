"use client";

import styles from "./FinaleRain.module.css";

// Tło finału: brązowy błysk na starcie. Same spadające kawałki rysuje Arena.
export default function FinaleRain() {
  return (
    <div className={styles.rain} aria-hidden="true">
      <div className={styles.tint} />
    </div>
  );
}
