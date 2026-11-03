"use client";

import styles from "./page.module.css";
import tintStyles from "./ActorSprite.module.css";
import { moveIntervalFor } from "./actors";
import { cellToPixels, wallBlockSize } from "./maze";
import { useWalkAnimation } from "./useWalkAnimation";

export default function ActorSprite({ actor }) {
  const { displaySrc, bobCycleKey } = useWalkAnimation(actor);

  if (!actor?.position) {
    return null;
  }

  const { x, y } = cellToPixels(actor.position.row, actor.position.col);
  const interval = moveIntervalFor(actor, actor.nextMoveAt);

  return (
    <div
      className={actor.kind === "bot" ? styles.bot : styles.player}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: `${wallBlockSize}px`,
        height: `${wallBlockSize}px`,
        transition: `left ${interval}ms linear, top ${interval}ms linear`,
      }}
    >
      <div
        key={bobCycleKey}
        className={tintStyles.spriteBob}
        style={{ "--move-interval": `${interval}ms` }}
      >
        <img
          className={styles.playerSprite}
          src={displaySrc}
          alt=""
          draggable={false}
        />
      </div>
    </div>
  );
}
