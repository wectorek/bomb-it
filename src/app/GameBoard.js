"use client";

import { useMemo, useState } from "react";
import styles from "./page.module.css";
import Arena from "./Arena";
import { createMapBorder } from "./board";
import { BOARD_SIZE } from "./config";
import EndScreen from "./EndScreen";
import FinaleBanner from "./FinaleBanner";
import FinaleRain from "./FinaleRain";
import Hud from "./Hud";
import { useGameSfx } from "./useGameSfx";
import { useServerClock } from "./useRoom";

function countdownLabel(serverNow, until) {
  if (until == null || serverNow >= until) {
    return null;
  }
  const left = Math.ceil((until - serverNow) / 1000);
  if (left > 3) {
    return null;
  }
  if (left <= 0) {
    return "Start!";
  }
  return String(left);
}

export default function GameBoard({
  snapshot,
  you,
  clock,
  themeId,
  onRestart,
  onExit,
  multi,
  onSendChat = null,
}) {
  const borders = useMemo(() => createMapBorder(BOARD_SIZE), []);
  const serverNow = useServerClock(clock);
  const [spectateId, setSpectateId] = useState(null);
  useGameSfx(snapshot, you, serverNow);

  const self = (snapshot.actors ?? []).find((actor) => actor.id === you);
  const alivePlayers = (snapshot.actors ?? []).filter(
    (actor) => actor.alive && actor.position,
  );
  const spectating =
    self && !self.alive && snapshot.status === "playing"
      ? alivePlayers.find((actor) => actor.id === spectateId) ??
        alivePlayers[0] ??
        null
      : null;

  const showEndOverlay = snapshot.status !== "playing";
  const countdown = countdownLabel(serverNow, snapshot.countdownUntil);

  const bombs = [];
  const grenades = [];
  const previewCells = [];

  for (const charge of snapshot.bombs ?? []) {
    if (charge.kind === "grenade") {
      grenades.push(charge);
    } else {
      bombs.push(charge);
    }
    if (snapshot.status !== "playing") {
      continue;
    }
    for (const cell of charge.previewCells ?? []) {
      previewCells.push(cell);
    }
  }

  const explosionCells = [];
  const seenCells = new Set();
  for (const blast of snapshot.explosions ?? []) {
    if (typeof blast.until === "number" && blast.until <= serverNow) {
      continue;
    }
    for (const cell of blast.cells ?? []) {
      const key = `${cell.row},${cell.col}`;
      if (seenCells.has(key)) {
        continue;
      }
      seenCells.add(key);
      explosionCells.push(cell);
    }
  }

  const toasts = (snapshot.toasts ?? []).filter(
    (toast) => toast.until == null || toast.until > serverNow,
  );

  return (
    <div className={styles.gameWrapper}>
      {snapshot.finale ? <FinaleRain /> : null}
      {snapshot.finale && snapshot.status === "playing" ? <FinaleBanner /> : null}
      <Hud
        actors={snapshot.actors ?? []}
        clock={clock}
        mode={snapshot.modeEffective}
        finaleStartsAt={snapshot.finaleStartsAt}
        finaleWhenTwo={snapshot.settings?.finaleOnDuel === true}
        finaleActive={Boolean(snapshot.finale)}
        serverNow={serverNow}
      />
      {spectating ? (
        <div className={styles.spectatorBar} role="status">
          <span>
            Obserwujesz: <strong>{spectating.name}</strong>
          </span>
          <div className={styles.spectatorButtons}>
            {alivePlayers.map((actor) => (
              <button
                key={actor.id}
                type="button"
                className={`${styles.menuButtonSecondary} ${
                  spectating.id === actor.id ? styles.choiceOn : ""
                }`}
                onClick={() => setSpectateId(actor.id)}
              >
                {actor.name}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <Arena
        walls={snapshot.walls ?? []}
        borders={borders}
        actors={snapshot.actors ?? []}
        bombs={bombs}
        grenades={grenades}
        bonuses={snapshot.bonuses ?? []}
        toasts={toasts}
        explosionCells={explosionCells}
        previewCells={previewCells}
        drops={(snapshot.drops ?? []).filter((drop) => drop.landAt > serverNow)}
        mess={snapshot.mess ?? []}
        serverNow={serverNow}
        zoneRadius={snapshot.zone?.radius ?? null}
        hillCells={snapshot.hillCells ?? []}
        themeId={themeId}
        focusActorId={spectating?.id ?? you}
      />
      {countdown ? (
        <p className={styles.countdown} aria-live="assertive">
          {countdown}
        </p>
      ) : null}
      {showEndOverlay ? (
        <EndScreen
          status={snapshot.status}
          actors={snapshot.actors ?? []}
          you={you}
          startedAt={snapshot.startedAt}
          serverNow={serverNow}
          onRestart={onRestart}
          onExit={onExit}
          multi={multi}
          mode={snapshot.modeEffective}
          winningTeam={snapshot.winningTeam}
          sessionWins={snapshot.sessionWins}
          sessionScores={snapshot.sessionScores}
          chat={snapshot.chat}
          onSendChat={onSendChat ?? multi?.onSendChat}
        />
      ) : null}
    </div>
  );
}