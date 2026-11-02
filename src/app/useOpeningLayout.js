"use client";

import { useEffect } from "react";
import {
  moveIntervalFor,
  pickSpawnPositions,
  spawnCornerOrder,
  updateActor,
} from "./actors";
import { BOARD_SIZE } from "./config";
import { generateMaze } from "./maze";

export function useOpeningLayout({
  playerStart,
  borders,
  wallsRef,
  setWalls,
  actorsRef,
  setActors,
}) {
  useEffect(() => {
    const carveAt = spawnCornerOrder(playerStart, BOARD_SIZE)[0];
    const walls = generateMaze(BOARD_SIZE, carveAt);
    wallsRef.current = walls;
    setWalls(walls);

    const now = Date.now();
    const positions = pickSpawnPositions(
      walls,
      borders,
      actorsRef.current.length,
      playerStart,
    );
    let actors = actorsRef.current;

    for (let index = 0; index < actors.length; index += 1) {
      const actor = actors[index];
      const position = positions[index];
      if (!position) {
        continue;
      }

      const patch = { position };
      if (actor.kind === "bot") {
        patch.nextMoveAt = now + moveIntervalFor(actor, now);
      }
      actors = updateActor(actors, actor.id, patch);
    }

    actorsRef.current = actors;
    setActors(actors);
  }, [actorsRef, borders, playerStart, setActors, setWalls, wallsRef]);
}
