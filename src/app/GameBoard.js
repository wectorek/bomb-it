"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./page.module.css";
import { PLAYER_START, createInitialActors } from "./actors";
import Arena from "./Arena";
import { createMapBorder } from "./border";
import { BOARD_SIZE } from "./config";
import EndScreen from "./EndScreen";
import Hud from "./Hud";
import { useBomb } from "./useBomb";
import { useGameLoop } from "./useGameLoop";
import { useLatest } from "./useLatest";
import { useOpeningLayout } from "./useOpeningLayout";
import { usePlayerControls } from "./usePlayerControls";

const BORDERS = createMapBorder(BOARD_SIZE);
const ENABLE_BOMBS = true;
const ENABLE_WALL_COLLISION = true;

export default function GameBoard({
  onRestart,
  zoneEnabled = false,
  themeId = "bee",
}) {
  const [actors, setActors] = useState(() => createInitialActors());
  const [walls, setWalls] = useState([]);
  const [bonuses, setBonuses] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [gameStatus, setGameStatus] = useState("playing");
  const [startedAt] = useState(() => Date.now());
  const [zoneStartedAt, setZoneStartedAt] = useState(null);
  const zoneStartedAtRef = useRef(null);
  const zoneSinceRef = useRef(new Map());

  const actorsRef = useLatest(actors);
  const wallsRef = useLatest(walls);
  const bonusesRef = useLatest(bonuses);
  const gameStatusRef = useLatest(gameStatus);

  useEffect(() => {
    if (!zoneEnabled) {
      zoneStartedAtRef.current = null;
      zoneSinceRef.current.clear();
      setZoneStartedAt(null);
      return;
    }
    const now = Date.now();
    zoneStartedAtRef.current = now;
    zoneSinceRef.current.clear();
    setZoneStartedAt(now);
  }, [zoneEnabled]);

  const { bombs, grenades, bombsRef, explosionCells, placeBomb, throwGrenade } =
    useBomb({
      borders: BORDERS,
      wallsRef,
      actorsRef,
      setWalls,
      setActors,
      setGameStatus,
      gameStatusRef,
      bonusesRef,
      setBonuses,
    });

  useOpeningLayout({
    playerStart: PLAYER_START,
    borders: BORDERS,
    wallsRef,
    setWalls,
    actorsRef,
    setActors,
  });

  usePlayerControls({
    borders: BORDERS,
    bombsEnabled: ENABLE_BOMBS,
    blockWalls: ENABLE_WALL_COLLISION,
    blockBombs: ENABLE_BOMBS,
    gameStatusRef,
    actorsRef,
    setActors,
    wallsRef,
    bombsRef,
    placeBomb,
    throwGrenade,
  });

  useGameLoop({
    borders: BORDERS,
    wallsRef,
    actorsRef,
    setActors,
    bombsRef,
    gameStatusRef,
    placeBomb,
    throwGrenade,
    bonusesRef,
    setBonuses,
    setToasts,
    setGameStatus,
    zoneStartedAtRef,
    zoneSinceRef,
  });

  return (
    <div className={styles.gameWrapper}>
      <Hud actors={actors} />
      <Arena
        walls={walls}
        borders={BORDERS}
        actors={actors}
        bombs={bombs}
        grenades={grenades}
        bonuses={bonuses}
        toasts={toasts}
        explosionCells={explosionCells}
        zoneStartedAt={zoneStartedAt}
        themeId={themeId}
      />
      {gameStatus === "playing" ? null : (
        <EndScreen
          status={gameStatus}
          actors={actors}
          startedAt={startedAt}
          onRestart={onRestart}
        />
      )}
    </div>
  );
}
