"use client";

import { useState } from "react";
import styles from "./page.module.css";
import { createMapBorder } from "./border";
import { STARTING_LIVES } from "./bomb";
import { BOARD_SIZE } from "./maze";
import Arena from "./Arena";
import Hud from "./Hud";
import { useBomb } from "./useBomb";
import { useBotMovement } from "./useBotMovement";
import { useLatest } from "./useLatest";
import { useOpeningLayout } from "./useOpeningLayout";
import { usePlayerControls } from "./usePlayerControls";

const PLAYER_START = { row: 1, col: 8 };
const BORDERS = createMapBorder(BOARD_SIZE);

const ENABLE_BOT = false;
const ENABLE_BOMBS = false;
const ENABLE_WALL_COLLISION = true;

export default function GameBoard() {
  const [playerPosition, setPlayerPosition] = useState(PLAYER_START);
  const [walls, setWalls] = useState([]);
  const [botPosition, setBotPosition] = useState(null);
  const [playerLives, setPlayerLives] = useState(STARTING_LIVES);
  const [botLives, setBotLives] = useState(STARTING_LIVES);
  const [gameStatus, setGameStatus] = useState("playing");

  const playerPositionRef = useLatest(playerPosition);
  const botPositionRef = useLatest(botPosition);
  const wallsRef = useLatest(walls);
  const playerLivesRef = useLatest(playerLives);
  const botLivesRef = useLatest(botLives);
  const gameStatusRef = useLatest(gameStatus);

  const { bombRef, placeBomb } = useBomb({
    borders: BORDERS,
    wallsRef,
    playerPositionRef,
    botPositionRef,
    playerLivesRef,
    botLivesRef,
    setWalls,
    setPlayerLives,
    setBotLives,
    setGameStatus,
  });

  useOpeningLayout({
    playerStart: PLAYER_START,
    borders: BORDERS,
    enableBot: ENABLE_BOT,
    setWalls,
    setBotPosition,
  });

  usePlayerControls({
    borders: BORDERS,
    bombsEnabled: ENABLE_BOMBS,
    blockWalls: ENABLE_WALL_COLLISION,
    blockBombs: ENABLE_BOMBS,
    gameStatusRef,
    playerPositionRef,
    wallsRef,
    bombRef,
    setPlayerPosition,
    placeBomb,
  });

  useBotMovement({
    enabled: ENABLE_BOT,
    walls,
    borders: BORDERS,
    botPositionRef,
    bombRef,
    gameStatusRef,
    setBotPosition,
  });

  return (
    <div className={styles.gameWrapper}>
      <Hud
        playerLives={playerLives}
        botLives={botLives}
        gameStatus={gameStatus}
      />
      <Arena walls={walls} playerPosition={playerPosition} />
    </div>
  );
}
