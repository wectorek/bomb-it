"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./EndScreen.module.css";
import ChatBar from "./ChatBar";
import MultiEndPanel from "./MultiEndPanel";
import { playerPoseSrc } from "./assets";
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

export default function EndScreen({
  status,
  actors,
  you,
  startedAt,
  serverNow,
  onRestart,
  onExit,
  multi = null,
  mode = "classic",
  winningTeam = null,
  sessionWins = null,
  sessionScores = null,
  chat = [],
  onSendChat = null,
}) {
  const buttonRef = useRef(null);
  const restartedRef = useRef(false);
  const [elapsedMs] = useState(() =>
    Math.max(0, (serverNow ?? Date.now()) - (startedAt ?? Date.now())),
  );
  const heading = resultHeading(status);
  const fallen = eliminatedActors(actors);
  const others = actors.filter((actor) => actor.id !== you);
  const othersAreBots = others.every((actor) => actor.kind === "bot");
  const player = actors.find((actor) => actor.id === you) ?? null;
  const clock = formatDuration(elapsedMs);
  const poseColor = player?.color ?? "blue";
  const poseSrc = playerPoseSrc(status === "win" ? "win" : "lose", poseColor);

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

      if (event.key !== "Enter" || multi) {
        return;
      }

      event.preventDefault();
      restart();
    }

    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [restart, multi]);

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
          <p className={styles.survivors}>
            {mode === "teams" && winningTeam != null
              ? `Wygrała drużyna ${winningTeam === 0 ? "A" : "B"}.`
              : survivorSummary(actors, you, status)}
          </p>
          {sessionWins && Object.keys(sessionWins).length > 0 ? (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <caption>Wygrane w sesji</caption>
                <thead>
                  <tr>
                    <th scope="col">Gracz</th>
                    <th scope="col">Wygrane</th>
                    {sessionScores ? <th scope="col">Suma punktów</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {actors
                    .filter((actor) => actor.kind === "player")
                    .map((actor) => (
                      <tr key={actor.id}>
                        <th scope="row">{actor.name}</th>
                        <td>{sessionWins[actor.id] ?? 0}</td>
                        {sessionScores ? (
                          <td>{sessionScores[actor.id] ?? 0}</td>
                        ) : null}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : null}
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
          {others.length > 0 ? (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <caption>{othersAreBots ? "Boty" : "Pozostali"}</caption>
                <thead>
                  <tr>
                    <th scope="col">{othersAreBots ? "Bot" : "Gracz"}</th>
                    <th scope="col">Czas</th>
                    <th scope="col">Ściany</th>
                    <th scope="col">Bonus +</th>
                    <th scope="col">Bonus −</th>
                    <th scope="col">Pokonani</th>
                    <th scope="col">Życia</th>
                  </tr>
                </thead>
                <tbody>
                  {others.map((actor) => (
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
          {multi || onSendChat ? (
            <ChatBar chat={chat} you={you} onSend={onSendChat ?? multi?.onSendChat} compact />
          ) : null}
          <div className={styles.actions}>
            {multi ? (
              <MultiEndPanel multi={multi} you={you} />
            ) : (
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
            )}
            {onExit ? (
              <button
                type="button"
                className={styles.menuLink}
                onClick={onExit}
                onKeyDown={blockActivationKey}
                onKeyUp={blockActivationKey}
              >
                Menu główne
              </button>
            ) : null}
            {multi ? null : (
              <p className={styles.hint}>Enter zaczyna nową rundę.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
