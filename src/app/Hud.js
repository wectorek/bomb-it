"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";
import bonusStyles from "./bonus.module.css";
import {
  BONUS_EMOJI,
  BONUS_TOAST,
  activeEffectIds,
  effectSecondsLeft,
} from "./bonus";

const HUD_DOT = {
  blue: "#1e88e5",
  red: "#e53935",
  green: "#43a047",
  purple: "#8e24aa",
};

function livesLabel(lives) {
  if (lives === 1) {
    return "1 życie";
  }
  const last = lives % 10;
  const lastTwo = lives % 100;
  if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) {
    return `${lives} życia`;
  }
  return `${lives} żyć`;
}

function EffectList({ actor, now }) {
  const ids = activeEffectIds(actor, now);
  if (ids.length === 0) {
    return null;
  }

  return (
    <span className={bonusStyles.effects}>
      {ids.map((id) => {
        const seconds = effectSecondsLeft(actor, id, now);
        return (
          <span key={id} className={bonusStyles.effect} title={BONUS_TOAST[id]}>
            {BONUS_EMOJI[id]}
            {seconds == null ? null : ` ${seconds}s`}
          </span>
        );
      })}
    </span>
  );
}

export default function Hud({ actors = [] }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  return (
    <div className={styles.hud}>
      {actors.map((actor) => (
        <span key={actor.id} className={styles.hudActor}>
          <span
            className={styles.hudDot}
            style={{ backgroundColor: HUD_DOT[actor.color] ?? actor.color }}
          />
          <span className={actor.alive ? undefined : styles.hudDead}>
            {actor.name}: {livesLabel(actor.lives)}
          </span>
          {actor.alive ? <EffectList actor={actor} now={now} /> : null}
        </span>
      ))}
    </div>
  );
}
