"use client";

import styles from "./page.module.css";
import { wallBlock, wallBlockSize } from "./maze";

export default function WallBlock({ x = wallBlock.x, y = wallBlock.y }) {
  return (
    <div
      className={styles.wallBlock}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: `${wallBlockSize}px`,
        height: `${wallBlockSize}px`,
      }}
    />
  );
}
