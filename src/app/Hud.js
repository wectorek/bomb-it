"use client";

import styles from "./page.module.css";
import { ASSETS } from "./assets";
import bonusStyles from "./bonus.module.css";
import { useServerClock } from "./useRoom";

const EFFECT_ICON = {
  immunity: ASSETS.bonuses.immunity,
  speed: ASSETS.bonuses.speed,
  range: ASSETS.bonuses.range,
  grenade: ASSETS.objects.grenade,
  slow: ASSETS.bonuses.slow,
  fragile: ASSETS.bonuses.fragile,
  freeze: ASSETS.bonuses.freeze,
};

const EFFECT_TITLE = {
  immunity: "Nietykalność!",
  speed: "Szybkość!",
  range: "Zasięg!",
  grenade: "Granat!",
  slow: "Spowolnienie!",
  fragile: "Kruchość!",
  freeze: "Zatrzymanie!",
};

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

function secondsLeft(effect, clock, serverNow) {
  if (typeof effect.msLeft !== "number" || !clock) {
    return null;
  }
  const left = effect.msLeft - (serverNow - clock.serverNow);
  return Math.max(0, Math.ceil(left / 1000));
}

function EffectList({ actor, clock, serverNow }) {
  const effects = actor.effects ?? [];
  if (effects.length === 0) {
    return null;
  }

  return (
    <span className={bonusStyles.effects}>
      {effects.map((effect) => {
        const seconds = secondsLeft(effect, clock, serverNow);
        return (
          <span
            key={effect.id}
            className={bonusStyles.effect}
            title={EFFECT_TITLE[effect.id] ?? effect.id}
          >
            <img
              className={bonusStyles.effectIcon}
              src={EFFECT_ICON[effect.id]}
              alt=""
              draggable={false}
            />
            {seconds == null ? null : `${seconds}s`}
          </span>
        );
      })}
    </span>
  );
}

export default function Hud({ actors = [], clock = null }) {
  const serverNow = useServerClock(clock);

  return (
    <div className={styles.hud}>
      {actors.map((actor) => (
        <span
          key={actor.id}
          className={styles.hudActor}
          style={{ "--dot": HUD_DOT[actor.color] ?? actor.color }}
        >
          <span
            className={styles.hudDot}
            style={{ backgroundColor: HUD_DOT[actor.color] ?? actor.color }}
          />
          <span className={actor.alive ? undefined : styles.hudDead}>
            {actor.name}
          </span>
          <span className={styles.hudLives}>{livesLabel(actor.lives)}</span>
          {actor.alive ? (
            <EffectList actor={actor} clock={clock} serverNow={serverNow} />
          ) : null}
        </span>
      ))}
    </div>
  );
}
