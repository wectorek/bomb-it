"use client";

import { useState } from "react";
import {
  BOMB_TIMER_MS,
  EXPLOSION_DURATION_MS,
  resolveExplosionOutcome,
} from "./bomb";
import { useLatest } from "./useLatest";

export function useBomb({
  borders,
  wallsRef,
  playerPositionRef,
  botPositionRef,
  playerLivesRef,
  botLivesRef,
  setWalls,
  setPlayerLives,
  setBotLives,
  setGameStatus,
}) {
  const [bomb, setBomb] = useState(null);
  const bombRef = useLatest(bomb);
  const [, setExplosionCells] = useState([]);

  function explode(bombPosition) {
    const outcome = resolveExplosionOutcome({
      bombPosition,
      walls: wallsRef.current,
      borders,
      playerPosition: playerPositionRef.current,
      botPosition: botPositionRef.current,
      playerLives: playerLivesRef.current,
      botLives: botLivesRef.current,
    });

    setWalls(outcome.walls);
    setExplosionCells(outcome.cells);
    playerLivesRef.current = outcome.playerLives;
    setPlayerLives(outcome.playerLives);
    botLivesRef.current = outcome.botLives;
    setBotLives(outcome.botLives);
    bombRef.current = null;
    setBomb(null);

    if (outcome.gameStatus) {
      setGameStatus(outcome.gameStatus);
    }

    setTimeout(() => {
      setExplosionCells([]);
    }, EXPLOSION_DURATION_MS);
  }

  function placeBomb(position) {
    bombRef.current = position;
    setBomb(position);
    setTimeout(() => explode(position), 5);
  }

  return { bombRef, placeBomb };
}
