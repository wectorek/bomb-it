"use client";

import { useEffect, useRef } from "react";
import { playerInputFromKey } from "./playerMovement";
import { useLatest } from "./useLatest";

export function usePlayerControls({
  borders,
  bombsEnabled,
  blockWalls,
  blockBombs,
  gameStatusRef,
  playerPositionRef,
  wallsRef,
  bombRef,
  setPlayerPosition,
  placeBomb,
}) {
  const placeBombRef = useLatest(placeBomb);
  const lastMoveAtRef = useRef(0);

  useEffect(() => {
    function onKeyDown(event) {
      const input = playerInputFromKey(event, {
        bombsEnabled,
        blockWalls,
        blockBombs,
        borders,
        gameStatus: gameStatusRef.current,
        position: playerPositionRef.current,
        walls: wallsRef.current,
        bomb: bombRef.current,
        now: Date.now(),
        lastMoveAt: lastMoveAtRef.current,
      });

      if (input.preventScroll) {
        event.preventDefault();
      }

      if (input.bombPosition) {
        placeBombRef.current(input.bombPosition);
      }

      if (input.move) {
        lastMoveAtRef.current = input.move.at;
        playerPositionRef.current = input.move.position;
        setPlayerPosition(input.move.position);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    blockBombs,
    blockWalls,
    bombRef,
    bombsEnabled,
    borders,
    gameStatusRef,
    placeBombRef,
    playerPositionRef,
    setPlayerPosition,
    wallsRef,
  ]);
}
