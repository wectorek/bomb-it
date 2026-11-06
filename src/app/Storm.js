"use client";

import { useEffect, useState } from "react";
import styles from "./Storm.module.css";
import { safeRadius, safeRadiusPixels } from "./zone";

export default function Storm({ startedAt }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, []);

  if (startedAt == null) {
    return null;
  }

  const radius = safeRadiusPixels(safeRadius(now - startedAt));

  return (
    <div
      className={styles.storm}
      style={{ "--safe": `${radius}px` }}
      aria-hidden="true"
    />
  );
}
