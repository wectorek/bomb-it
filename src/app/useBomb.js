"use client";

import { useEffect, useRef, useState } from "react";
import { getActor } from "./actors";
import { rangeFor, spawnBonusesFromWalls, survivingBonuses } from "./bonus";
import {
  getGrenadeTarget,
  isBombAt,
  ownsBomb,
  resolveExplosionOutcome,
} from "./bomb";
import {
  BOMB_RANGE,
  BOMB_TIMER_MS,
  EXPLOSION_DURATION_MS,
  GRENADE_FLIGHT_MS,
  GRENADE_TIMER_MS,
  HEDGE_REGROW_MS,
} from "./config";
import { useLatest } from "./useLatest";

export function useBomb({
  borders,
  wallsRef,
  actorsRef,
  setWalls,
  setActors,
  setGameStatus,
  gameStatusRef,
  bonusesRef,
  setBonuses,
}) {
  const [bombs, setBombs] = useState([]);
  const bombsRef = useLatest(bombs);
  const [explosions, setExplosions] = useState([]);
  const timersRef = useRef([]);
  const nextBombIdRef = useRef(1);
  const nextBonusIdRef = useRef(1);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      for (const id of timers) {
        clearTimeout(id);
      }
    };
  }, []);

  function schedule(callback, delay) {
    const id = setTimeout(() => {
      const index = timersRef.current.indexOf(id);
      if (index !== -1) {
        timersRef.current.splice(index, 1);
      }
      callback();
    }, delay);
    timersRef.current.push(id);
  }

  function hedgeCellBlocked(row, col) {
    const actorThere = actorsRef.current.some(
      (actor) =>
        actor.alive &&
        actor.position?.row === row &&
        actor.position?.col === col,
    );
    const bombThere = bombsRef.current.some(
      (bomb) => !bomb.airborne && bomb.row === row && bomb.col === col,
    );
    const wallThere = wallsRef.current.some(
      (wall) => wall.row === row && wall.col === col,
    );
    return actorThere || bombThere || wallThere;
  }

  function scheduleHedge(row, col, delay = HEDGE_REGROW_MS) {
    schedule(() => {
      if (hedgeCellBlocked(row, col)) {
        scheduleHedge(row, col, 1000);
        return;
      }
      const walls = [...wallsRef.current, { row, col, type: "hedge" }];
      wallsRef.current = walls;
      setWalls(walls);
    }, delay);
  }

  function explode(bomb) {
    const remaining = bombsRef.current.filter((item) => item.id !== bomb.id);
    bombsRef.current = remaining;
    setBombs(remaining);

    const now = Date.now();
    const outcome = resolveExplosionOutcome({
      bombPosition: bomb,
      walls: wallsRef.current,
      borders,
      actors: actorsRef.current,
      range: bomb.range,
      now,
      owner: bomb.owner,
    });

    const kept = survivingBonuses(bonusesRef.current, outcome.cells);
    const spawned = spawnBonusesFromWalls(
      outcome.destroyedWalls,
      Math.random,
      now,
    ).map((bonus) => {
      const id = nextBonusIdRef.current;
      nextBonusIdRef.current += 1;
      return { ...bonus, id };
    });
    const nextBonuses =
      spawned.length === 0 && kept === bonusesRef.current
        ? kept
        : [...kept, ...spawned];
    if (nextBonuses !== bonusesRef.current) {
      bonusesRef.current = nextBonuses;
      setBonuses(nextBonuses);
    }

    wallsRef.current = outcome.walls;
    setWalls(outcome.walls);
    for (const wall of outcome.destroyedWalls) {
      if (wall.type === "hedge") {
        scheduleHedge(wall.row, wall.col);
      }
    }
    actorsRef.current = outcome.actors;
    setActors(outcome.actors);
    gameStatusRef.current = outcome.gameStatus;
    setGameStatus(outcome.gameStatus);

    setExplosions((current) => [
      ...current,
      { id: bomb.id, cells: outcome.cells },
    ]);

    schedule(() => {
      setExplosions((current) =>
        current.filter((blast) => blast.id !== bomb.id),
      );
    }, EXPLOSION_DURATION_MS);
  }

  function commitBombs(nextBombs) {
    bombsRef.current = nextBombs;
    setBombs(nextBombs);
  }

  // Lądowanie od tego momentu blokuje pole. Timer wybuchu liczy się od lądowania.
  function landGrenade(id) {
    const grenade = bombsRef.current.find((item) => item.id === id);
    if (!grenade || grenade.kind !== "grenade" || !grenade.airborne) {
      return;
    }

    const landed = { ...grenade, airborne: false };
    commitBombs(
      bombsRef.current.map((item) => (item.id === id ? landed : item)),
    );
    schedule(() => explode(landed), GRENADE_TIMER_MS);
  }

  function placeBomb(position, owner = "player") {
    if (!position || ownsBomb(bombsRef.current, owner)) {
      return;
    }
    if (isBombAt(position, bombsRef.current)) {
      return;
    }

    const ownerActor = getActor(actorsRef.current, owner);
    const bomb = {
      row: position.row,
      col: position.col,
      owner,
      id: nextBombIdRef.current,
      range: ownerActor ? rangeFor(ownerActor, Date.now()) : BOMB_RANGE,
    };
    nextBombIdRef.current += 1;
    const nextBombs = [...bombsRef.current, bomb];
    commitBombs(nextBombs);
    schedule(() => explode(bomb), BOMB_TIMER_MS);
  }

  // Jednorazowy rzut. false: brak ładunku albo brak pola — efekt zostaje u wołającego.
  function throwGrenade(from, facing, owner = "player") {
    if (!from || !facing || ownsBomb(bombsRef.current, owner)) {
      return false;
    }

    const target = getGrenadeTarget(
      from,
      facing,
      wallsRef.current,
      borders,
      bombsRef.current,
    );
    if (!target) {
      return false;
    }

    const grenade = {
      row: target.row,
      col: target.col,
      fromRow: from.row,
      fromCol: from.col,
      owner,
      id: nextBombIdRef.current,
      range: BOMB_RANGE,
      kind: "grenade",
      airborne: true,
    };
    nextBombIdRef.current += 1;
    commitBombs([...bombsRef.current, grenade]);
    schedule(() => landGrenade(grenade.id), GRENADE_FLIGHT_MS);
    return true;
  }

  const explosionCells = [];
  const seenCells = new Set();
  for (const blast of explosions) {
    for (const cell of blast.cells) {
      const key = `${cell.row},${cell.col}`;
      if (seenCells.has(key)) {
        continue;
      }
      seenCells.add(key);
      explosionCells.push(cell);
    }
  }

  const placedBombs = [];
  const grenades = [];
  for (const charge of bombs) {
    if (charge.kind === "grenade") {
      grenades.push(charge);
    } else {
      placedBombs.push(charge);
    }
  }

  return {
    bombs: placedBombs,
    grenades,
    bombsRef,
    explosionCells,
    placeBomb,
    throwGrenade,
  };
}
