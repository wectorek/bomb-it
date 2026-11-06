import { ARENA_SIZE, BOARD_SIZE, ZONE_CELL_MS, ZONE_DAMAGE_MS } from "./config";

const CELL = ARENA_SIZE / BOARD_SIZE;

function boardCenter(boardSize) {
  return boardSize / 2;
}

// Promień na starcie sięga za narożniki, więc burza jest jeszcze poza mapą.
export function initialSafeRadius(boardSize = BOARD_SIZE) {
  const mid = boardCenter(boardSize);
  return Math.hypot(mid - 0.5, mid - 0.5) + 0.35;
}

export function safeRadius(elapsedMs, boardSize = BOARD_SIZE) {
  const shrunk = Math.max(0, elapsedMs) / ZONE_CELL_MS;
  return Math.max(0, initialSafeRadius(boardSize) - shrunk);
}

export function safeRadiusPixels(radius) {
  return radius * CELL;
}

export function isOutsideSafe(position, radius, boardSize = BOARD_SIZE) {
  if (!position) {
    return false;
  }
  const mid = boardCenter(boardSize);
  const distance = Math.hypot(position.row + 0.5 - mid, position.col + 0.5 - mid);
  return distance > radius;
}

// Co pełne 5 sekund w burzy zabiera jedno życie. Wyjście zeruje licznik.
export function applyZoneDamage(actors, radius, now, sinceMap) {
  let changed = false;
  const next = actors.map((actor) => {
    if (!actor.alive || !actor.position || !isOutsideSafe(actor.position, radius)) {
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
