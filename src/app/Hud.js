"use client";

import styles from "./page.module.css";
import { ASSETS } from "./assets";
import bonusStyles from "./bonus.module.css";
import { formatDuration } from "./gameStats";
import { teamById } from "./teams";
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

function ActorRow({ actor, mode, clock, serverNow }) {
  const team = teamById(actor.team);
  return (
    <span
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
      {team ? (
        <span className={styles.hudTeamChip} style={{ "--team": team.color }}>
          {team.short}
        </span>
      ) : null}
      <span className={styles.hudLives}>{livesLabel(actor.lives)}</span>
      {mode === "hill" ? (
        <span className={styles.hudScore}>{actor.score ?? 0} pkt</span>
      ) : null}
      {actor.alive ? (
        <EffectList actor={actor} clock={clock} serverNow={serverNow} />
      ) : null}
    </span>
  );
}

export default function Hud({
  actors = [],
  clock = null,
  mode = "classic",
  finaleStartsAt = null,
  finaleActive = false,
  serverNow: serverNowProp = null,
}) {
  const tickNow = useServerClock(clock);
  const serverNow = serverNowProp ?? tickNow;
  const finaleLeft =
    !finaleActive && finaleStartsAt != null
      ? Math.max(0, finaleStartsAt - serverNow)
      : null;
  const teamed = mode === "teams" && actors.some((actor) => teamById(actor.team));

  return (
    <div className={styles.hud}>
      {finaleLeft != null ? (
        <p className={styles.hudTimer}>
          Rozwolnienie za {formatDuration(finaleLeft)}
        </p>
      ) : null}
      {teamed
        ? [0, 1].map((id) => {
            const team = teamById(id);
            const group = actors.filter((actor) => actor.team === id);
            if (group.length === 0) {
              return null;
            }
            return (
              <div
                key={team.id}
                className={styles.hudTeam}
                style={{ "--team": team.color }}
              >
                <p className={styles.hudTeamLabel}>{team.label}</p>
                {group.map((actor) => (
                  <ActorRow
                    key={actor.id}
                    actor={actor}
                    mode={mode}
                    clock={clock}
                    serverNow={serverNow}
                  />
                ))}
              </div>
            );
          })
        : actors.map((actor) => (
            <ActorRow
              key={actor.id}
              actor={actor}
              mode={mode}
              clock={clock}
              serverNow={serverNow}
            />
          ))}
    </div>
  );
}