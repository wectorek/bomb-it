"use client";

import styles from "./page.module.css";
import { cellToPixels, wallBlockSize } from "./maze";
import { BOT_MOVE_INTERVAL_MS } from "./bot";

export default function Player({ position }) {
  const { x, y } = cellToPixels(position.row, position.col);

  return (
    <div
      className={styles.player}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: `${wallBlockSize}px`,
        height: `${wallBlockSize}px`,
        transition: `left ${BOT_MOVE_INTERVAL_MS}ms linear, top ${BOT_MOVE_INTERVAL_MS}ms linear`,
      }}
    />
  );
}
