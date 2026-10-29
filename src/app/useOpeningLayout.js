"use client";

import { useEffect } from "react";
import { BOARD_SIZE, generateMaze } from "./maze";
import { pickEmptyPosition } from "./bot";

export function useOpeningLayout({
  playerStart,
  borders,
  enableBot,
  setWalls,
  setBotPosition,
}) {
  useEffect(() => {
    const walls = generateMaze(BOARD_SIZE, playerStart);
    setWalls(walls);

    if (!enableBot) {
      return;
    }

    setBotPosition(
      pickEmptyPosition(BOARD_SIZE, walls, borders, [playerStart]),
    );
  }, [borders, enableBot, playerStart, setBotPosition, setWalls]);
}
