"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./EndScreen.module.css";
import {
  bonusSummary,
  eliminatedActors,
  formatDuration,
  resultHeading,
  statValue,
  survivorSummary,
} from "./gameStats";

const SPACE_GUARD_MS = 500;

const ACTOR_COLOR = {
  blue: "#1e88e5",
  red: "#e53935",
  green: "#43a047",
  purple: "#8e24aa",
};

function isSpaceKey(event) {
  return event.key === " " || event.key === "Spacebar" || event.code === "Space";
}

function blockActivationKey(event) {
  if (isSpaceKey(event) || event.key === "Enter") {
    event.preventDefault();
  }
}

export default function EndScreen({ status, actors, startedAt, onRestart }) {
  const buttonRef = useRef(null);
  const restartedRef = useRef(false);
  const [elapsedMs] = useState(() => Math.max(0, Date.now() - startedAt));
  const heading = resultHeading(status);
  const fallen = eliminatedActors(actors);
  const bots = actors.filter((actor) => actor.kind === "bot");
  const player = actors.find((actor) => actor.kind === "player") ?? null;
  const clock = formatDuration(elapsedMs);
  const poseSrc = status === "win" ? "/player/win.png" : "/player/lose.png";

  const restart = useCallback(() => {
    if (restartedRef.current || typeof onRestart !== "function") {
      return;
    }
    restartedRef.current = true;
    onRestart();
  }, [onRestart]);

  useEffect(() => {
    const appearedAt = Date.now();
    buttonRef.current?.focus();

    function onKeyDown(event) {
      if (event.repeat) {
        if (event.key === "Enter" || isSpaceKey(event)) {
          event.preventDefault();
        }
        return;
      }

      if (isSpaceKey(event)) {
        if (Date.now() - appearedAt < SPACE_GUARD_MS) {
          event.preventDefault();
        }
        return;
      }

      if (event.key !== "Enter") {
        return;
      }

      event.preventDefault();
      restart();
    }

    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [restart]);

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="end-heading"
    >
      <div className={styles.card}>
        <img className={styles.pose} src={poseSrc} alt="" draggable={false} />
        <div className={styles.content}>
          <h1 id="end-heading" className={styles.heading} data-status={status}>
            {heading}
          </h1>
          <p className={styles.survivors}>{survivorSummary(actors)}</p>
          <div className={styles.elimination}>
            <p className={styles.sectionLabel}>Kolejność eliminacji</p>
            {fallen.length === 0 ? (
              <p className={styles.muted}>Nikt nie odpadł.</p>
            ) : (
              <ol className={styles.fallen}>
                {fallen.map((actor) => (
                  <li key={actor.id}>{actor.name}</li>
                ))}
              </ol>
            )}
          </div>
          {player ? (
            <div className={styles.playerStats}>
              <p className={styles.sectionLabel}>Twoje statystyki</p>
              <dl className={styles.stats}>
                <div>
                  <dt>Czas</dt>
                  <dd>{clock}</dd>
                </div>
                <div>
                  <dt>Zniszczone ściany</dt>
                  <dd>{statValue(player, "wallsDestroyed")}</dd>
                </div>
                <div>
                  <dt>Bonusy</dt>
                  <dd>{bonusSummary(player)}</dd>
                </div>
                <div>
                  <dt>Pokonane boty</dt>
                  <dd>{statValue(player, "kills")}</dd>
                </div>
                <div>
                  <dt>Pozostałe życia</dt>
                  <dd>{statValue(player, "lives")}</dd>
                </div>
              </dl>
            </div>
          ) : null}
          {bots.length > 0 ? (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <caption>Boty</caption>
                <thead>
                  <tr>
                    <th scope="col">Bot</th>
                    <th scope="col">Czas</th>
                    <th scope="col">Ściany</th>
                    <th scope="col">Bonus +</th>
                    <th scope="col">Bonus −</th>
                    <th scope="col">Pokonani</th>
                    <th scope="col">Życia</th>
                  </tr>
                </thead>
                <tbody>
                  {bots.map((actor) => (
                    <tr
                      key={actor.id}
                      data-alive={actor.alive ? "true" : "false"}
                    >
                      <th scope="row">
                        <span
                          className={styles.swatch}
                          style={{
                            backgroundColor:
                              ACTOR_COLOR[actor.color] ?? actor.color,
                          }}
                        />
                        {actor.name}
                      </th>
                      <td>{clock}</td>
                      <td>{statValue(actor, "wallsDestroyed")}</td>
                      <td>{statValue(actor, "positive")}</td>
                      <td>{statValue(actor, "negative")}</td>
                      <td>{statValue(actor, "kills")}</td>
                      <td>{statValue(actor, "lives")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
          <div className={styles.actions}>
            <button
              ref={buttonRef}
              type="button"
              className={styles.restart}
              autoFocus
              onClick={restart}
              onKeyDown={blockActivationKey}
              onKeyUp={blockActivationKey}
            >
              Zagraj ponownie
            </button>
            <p className={styles.hint}>Enter zaczyna nową rundę.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
