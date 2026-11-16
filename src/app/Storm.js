"use client";

import { useEffect, useState } from "react";
import styles from "./Storm.module.css";
import { safeHalf, stormInsetPixels } from "./zone";

export default function Storm({ startedAt }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, []);

  if (startedAt == null) {
    return null;
  }

  const inset = stormInsetPixels(safeHalf(now - startedAt));

  return (
    <div
      className={styles.storm}
      style={{ "--inset": `${inset}px` }}
      aria-hidden="true"
    />
  );
}
