"use client";

import { wallSpriteUrl } from "./assets";
import styles from "./WallBlock.module.css";
import { cellToPixels, wallBlockSize } from "./maze";

export default function WallBlock({
  row,
  col,
  type = "destructible",
  permanent = false,
}) {
  const { x, y } = cellToPixels(row, col);
  const backgroundImage = `url(${wallSpriteUrl({ type, permanent })})`;

  return (
    <div
      className={styles.block}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: `${wallBlockSize}px`,
        height: `${wallBlockSize}px`,
        backgroundImage,
      }}
    />
  );
}
