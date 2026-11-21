"use client";

import styles from "./page.module.css";
import tintStyles from "./ActorSprite.module.css";
import { cellToPixels, wallBlockSize } from "./board";
import { teamById } from "./teams";
import { useWalkAnimation } from "./useWalkAnimation";

export default function ActorSprite({ actor, highlight = false }) {
  const { displaySrc, bobCycleKey } = useWalkAnimation(actor);

  if (!actor?.position) {
    return null;
  }

  const { x, y } = cellToPixels(actor.position.row, actor.position.col);
  const interval = actor.moveIntervalMs ?? 300;
  const team = teamById(actor.team);

  return (
    <div
      className={`${actor.kind === "bot" ? styles.bot : styles.player} ${
        highlight ? styles.actorFocus : ""
      } ${team ? tintStyles.teamRing : ""}`}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: `${wallBlockSize}px`,
        height: `${wallBlockSize}px`,
        transition: `left ${interval}ms linear, top ${interval}ms linear`,
        ...(team ? { "--team": team.color } : null),
      }}
    >
      {team ? (
        <span className={tintStyles.teamBadge} aria-hidden="true">
          {team.short}
        </span>
      ) : null}
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
