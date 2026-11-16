import { ARENA_SIZE, BOARD_SIZE, ZONE_CELL_MS, ZONE_DAMAGE_MS } from "./config";

const CELL = ARENA_SIZE / BOARD_SIZE;

function boardCenterIndex(boardSize) {
  return Math.floor((boardSize - 1) / 2);
}

// Na starcie cały kwadrat planszy jest bezpieczny. Co ZONE_CELL_MS odpada jeden pierścień.
export function safeHalf(elapsedMs, boardSize = BOARD_SIZE) {
  const closed = Math.floor(Math.max(0, elapsedMs) / ZONE_CELL_MS);
  return boardCenterIndex(boardSize) - closed;
}

export function stormInsetPixels(half, boardSize = BOARD_SIZE) {
  const insetCells = Math.max(0, boardCenterIndex(boardSize) - half);
  return insetCells * CELL;
}

export function isOutsideSafe(position, half, boardSize = BOARD_SIZE) {
  if (!position) {
    return false;
  }
  const center = boardCenterIndex(boardSize);
  const distance = Math.max(
    Math.abs(position.row - center),
    Math.abs(position.col - center),
  );
  return distance > half;
}

// Co pełne 5 sekund w burzy zabiera jedno życie. Wyjście zeruje licznik.
export function applyZoneDamage(actors, half, now, sinceMap) {
  let changed = false;
  const next = actors.map((actor) => {
    if (!actor.alive || !actor.position || !isOutsideSafe(actor.position, half)) {
      if (sinceMap.has(actor.id)) {
        sinceMap.delete(actor.id);
      }
      return actor;
    }

    const since = sinceMap.get(actor.id) ?? now;
    if (!sinceMap.has(actor.id)) {
      sinceMap.set(actor.id, since);
    }
    if (now - since < ZONE_DAMAGE_MS) {
      return actor;
    }

    sinceMap.set(actor.id, now);
    changed = true;
    const lives = Math.max(0, actor.lives - 1);
    const alive = lives > 0;
    return {
      ...actor,
      lives,
      alive,
      ...(!alive && actor.diedAt == null ? { diedAt: now } : {}),
    };
  });

  return changed ? next : actors;
}
