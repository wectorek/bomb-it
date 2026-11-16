"use client";

import styles from "./Storm.module.css";
import { stormInsetPixels } from "./board";

export default function Storm({ radius }) {
  if (radius == null) {
    return null;
  }

  const inset = stormInsetPixels(radius);

  return (
    <div
      className={styles.storm}
      style={{ "--inset": `${inset}px` }}
      aria-hidden="true"
    />
  );
}
