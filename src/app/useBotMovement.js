"use client";

import { useEffect } from "react";
import { BOT_MOVE_INTERVAL_MS, nextBotMove } from "./bot";

export function useBotMovement({
  enabled,
  walls,
  borders,
  botPositionRef,
  bombRef,
  gameStatusRef,
  setBotPosition,
}) {
  useEffect(() => {
    if (!enabled || walls.length === 0) {
      return undefined;
    }

    let direction = null;
    const id = setInterval(() => {
      if (gameStatusRef.current !== "playing") {
        return;
      }

      const prev = botPositionRef.current;
      if (!prev) {
        return;
      }

      const nextMove = nextBotMove(
        prev,
        direction,
        walls,
        borders,
        bombRef.current,
      );
      direction = nextMove.direction;
      botPositionRef.current = nextMove.position;
      setBotPosition(nextMove.position);
    }, BOT_MOVE_INTERVAL_MS);

    return () => clearInterval(id);
  }, [
    bombRef,
    borders,
    botPositionRef,
    enabled,
    gameStatusRef,
    setBotPosition,
    walls,
  ]);
}
