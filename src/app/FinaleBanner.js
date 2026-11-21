"use client";

import styles from "./FinaleBanner.module.css";

export default function FinaleBanner() {
  return (
    <div className={styles.overlay} aria-live="assertive" role="alert">
      <div className={styles.text}>MASZ PRZESRANE</div>
    </div>
  );
}
