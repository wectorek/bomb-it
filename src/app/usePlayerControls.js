"use client";

import { useEffect } from "react";
import { getActor, moveIntervalFor, updateActor } from "./actors";
import { hasEffect } from "./bonus";
import { playerInputFromKey } from "./playerMovement";
import { useLatest } from "./useLatest";

export function usePlayerControls({
  borders,
  bombsEnabled,
  blockWalls,
  blockBombs,
  gameStatusRef,
  actorsRef,
  setActors,
  wallsRef,
  bombsRef,
  placeBomb,
  throwGrenade,
}) {
  const placeBombRef = useLatest(placeBomb);
  const throwGrenadeRef = useLatest(throwGrenade);

  useEffect(() => {
    function onKeyDown(event) {
      const player = getActor(actorsRef.current, "player");
      if (!player) {
        return;
      }

      const now = Date.now();
      const input = playerInputFromKey(event, {
        bombsEnabled,
        blockWalls,
        blockBombs,
        borders,
        gameStatus: gameStatusRef.current,
        position: player.position,
        walls: wallsRef.current,
        bombs: bombsRef.current,
        now,
        nextMoveAt: player.nextMoveAt,
        hasGrenade: hasEffect(player, "grenade", now),
      });

      if (input.preventScroll) {
        event.preventDefault();
      }

      if (!player.alive) {
        return;
      }

      if (input.throwGrenade) {
        const threw = throwGrenadeRef.current(
          player.position,
          player.facing,
          player.id,
        );
        if (threw) {
          const effects = { ...(player.effects ?? {}) };
          delete effects.grenade;
          const nextActors = updateActor(actorsRef.current, player.id, {
            effects,
          });
          actorsRef.current = nextActors;
          setActors(nextActors);
        } else if (input.bombPosition) {
          placeBombRef.current(input.bombPosition, player.id);
        }
      } else if (input.bombPosition) {
        placeBombRef.current(input.bombPosition, player.id);
      }

      const patch = {};
      if (input.facing && input.facing !== player.facing) {
        patch.facing = input.facing;
      }
      if (input.move) {
        patch.position = input.move.position;
        patch.nextMoveAt =
          input.move.at + moveIntervalFor(player, input.move.at);
      }
      if (patch.facing === undefined && patch.position === undefined) {
        return;
      }

      const nextActors = updateActor(actorsRef.current, player.id, patch);
      actorsRef.current = nextActors;
      setActors(nextActors);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    actorsRef,
    blockBombs,
    blockWalls,
    bombsEnabled,
    bombsRef,
    borders,
    gameStatusRef,
    placeBombRef,
    setActors,
    throwGrenadeRef,
    wallsRef,
  ]);
}
