"use client";

import { useMemo } from "react";
import styles from "./page.module.css";
import Arena from "./Arena";
import { createMapBorder } from "./board";
import { BOARD_SIZE } from "./config";
import EndScreen from "./EndScreen";
import Hud from "./Hud";
import { useServerClock } from "./useRoom";

export default function GameBoard({ snapshot, you, clock, themeId, onRestart, onExit }) {
  const borders = useMemo(() => createMapBorder(BOARD_SIZE), []);
  const serverNow = useServerClock(clock);
  const bombs = [];
  const grenades = [];

  for (const charge of snapshot.bombs ?? []) {
    if (charge.kind === "grenade") {
      grenades.push(charge);
    } else {
      bombs.push(charge);
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

  function exitToMenu(event) {
    event.currentTarget.blur();
    if (!window.confirm("Przerwać grę i wrócić do menu głównego?")) {
      return;
    }
    onExit?.();
  }

  return (
    <div className={styles.gameWrapper}>
      <button
        type="button"
        className={`${styles.fullscreenButton} ${styles.exitButton}`}
        onClick={exitToMenu}
        onKeyDown={(event) => event.preventDefault()}
      >
        Menu główne
      </button>
      <Hud actors={snapshot.actors ?? []} clock={clock} />
      <Arena
        walls={snapshot.walls ?? []}
        borders={borders}
        actors={snapshot.actors ?? []}
        bombs={bombs}
        grenades={grenades}
        bonuses={snapshot.bonuses ?? []}
        toasts={toasts}
        explosionCells={explosionCells}
        zoneRadius={snapshot.zone?.radius ?? null}
        themeId={themeId}
      />
      {snapshot.status === "playing" ? null : (
        <EndScreen
          status={snapshot.status}
          actors={snapshot.actors ?? []}
          you={you}
          startedAt={snapshot.startedAt}
          serverNow={serverNow}
          onRestart={onRestart}
          onExit={onExit}
        />
      )}
    </div>
  );
}
