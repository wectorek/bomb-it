import { hasEffect } from "./bonus";
import { renderBorder } from "./border";
import {
  BOARD_SIZE,
  BOT_COLORS,
  BOT_COUNT,
  BOT_MOVE_INTERVAL_MS,
  PLAYER_MOVE_INTERVAL_MS,
  SLOW_MULTIPLIER,
  SPEED_MULTIPLIER,
  STARTING_LIVES,
} from "./config";
import { renderWall } from "./maze";

export const PLAYER_START = { row: 1, col: 8 };

const NEIGHBOR_STEPS = [
  { row: -1, col: 0 },
  { row: 1, col: 0 },
  { row: 0, col: -1 },
  { row: 0, col: 1 },
];

// Nazwy HUD stoją przy kolorach: gracz niebieski, potem bot-1, bot-2, bot-3.
const ACTOR_NAMES = {
  blue: "Ty",
  red: "Czerwony",
  green: "Zielony",
  purple: "Fioletowy",
};

function actorName(color) {
  return ACTOR_NAMES[color] ?? "Bot";
}

function initialStats() {
  return {
    wallsDestroyed: 0,
    bonusesCollected: { positive: 0, negative: 0 },
    kills: 0,
  };
}

function manhattan(a, b) {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
}

function boardSizeFromBorders(borders) {
  let maxIndex = 0;
  for (const cell of borders) {
    maxIndex = Math.max(maxIndex, cell.row, cell.col);
  }
  return maxIndex + 1;
}

function innerCorners(size) {
  const last = size - 2;
  return [
    { row: 1, col: 1 },
    { row: 1, col: last },
    { row: last, col: 1 },
    { row: last, col: last },
  ];
}

function isCornerRegion(cell, size) {
  const band = Math.floor(size / 3);
  const nearStart = (value) => value <= band;
  const nearEnd = (value) => value >= size - 1 - band;
  return (
    (nearStart(cell.row) || nearEnd(cell.row)) &&
    (nearStart(cell.col) || nearEnd(cell.col))
  );
}

// Kotwica w narożniku zostawia gracza przy najbliższym rogu. Inaczej pierwszy
// róg jest gracza, a kolejne — botów.
export function spawnCornerOrder(anchor, size) {
  const corners = innerCorners(size);
  if (!anchor || !isCornerRegion(anchor, size)) {
    return corners;
  }

  let bestIndex = 0;
  let bestDistance = Infinity;
  for (let index = 0; index < corners.length; index += 1) {
    const distance = manhattan(anchor, corners[index]);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  }

  return [
    corners[bestIndex],
    ...corners.filter((_, index) => index !== bestIndex),
  ];
}

function isCorridor(row, col, size, walls, borders) {
  if (row < 0 || col < 0 || row >= size || col >= size) {
    return false;
  }
  return !renderBorder(row, col, borders) && !renderWall(row, col, walls);
}

function blockedNeighborCount(cell, size, walls, borders) {
  let blocked = 0;
  for (const step of NEIGHBOR_STEPS) {
    const row = cell.row + step.row;
    const col = cell.col + step.col;
    if (row < 0 || col < 0 || row >= size || col >= size) {
      continue;
    }
    if (renderBorder(row, col, borders)) {
      continue;
    }
    if (renderWall(row, col, walls)) {
      blocked += 1;
    }
  }
  return blocked;
}

function chooseNearCorner(corner, corridors, chosen, size, walls, borders) {
  const free = corridors.filter(
    (cell) =>
      !chosen.some((other) => other.row === cell.row && other.col === cell.col),
  );
  if (free.length === 0) {
    return null;
  }

  const separated = free.filter(
    (cell) => !chosen.some((other) => manhattan(cell, other) <= 1),
  );
  const pool = separated.length > 0 ? separated : free;
  const nearest = Math.min(...pool.map((cell) => manhattan(cell, corner)));
  const clear = pool.filter(
    (cell) =>
      manhattan(cell, corner) <= nearest + 2 &&
      blockedNeighborCount(cell, size, walls, borders) === 0,
  );
  const candidates =
    clear.length > 0
      ? clear
      : pool.filter((cell) => manhattan(cell, corner) === nearest);

  candidates.sort((a, b) => {
    const byDistance = manhattan(a, corner) - manhattan(b, corner);
    if (byDistance !== 0) {
      return byDistance;
    }
    const byWalls =
      blockedNeighborCount(a, size, walls, borders) -
      blockedNeighborCount(b, size, walls, borders);
    if (byWalls !== 0) {
      return byWalls;
    }
    if (a.row !== b.row) {
      return a.row - b.row;
    }
    return a.col - b.col;
  });

  return candidates[0];
}

export function pickSpawnPositions(
  walls,
  borders,
  count,
  anchor = PLAYER_START,
) {
  const size = boardSizeFromBorders(borders);
  const corners = spawnCornerOrder(anchor, size);
  const corridors = [];

  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (isCorridor(row, col, size, walls, borders)) {
        corridors.push({ row, col });
      }
    }
  }

  const chosen = [];
  for (let index = 0; index < count; index += 1) {
    const corner = corners[Math.min(index, corners.length - 1)];
    const cell = chooseNearCorner(
      corner,
      corridors,
      chosen,
      size,
      walls,
      borders,
    );
    if (cell) {
      chosen.push(cell);
    }
  }

  return chosen;
}

export function createActor({
  id,
  kind,
  color,
  name = actorName(color),
  position = null,
  facing = "down",
  lives = STARTING_LIVES,
  nextMoveAt = 0,
}) {
  return {
    id,
    kind,
    color,
    name,
    position,
    facing,
    lives,
    alive: lives > 0,
    effects: {},
    stats: initialStats(),
    nextMoveAt,
  };
}

export function createInitialActors(now = Date.now()) {
  const playerCell = spawnCornerOrder(PLAYER_START, BOARD_SIZE)[0];
  const actors = [
    createActor({
      id: "player",
      kind: "player",
      color: "blue",
      name: actorName("blue"),
      position: playerCell,
      facing: "down",
      nextMoveAt: 0,
    }),
  ];

  for (let number = 1; number <= BOT_COUNT; number += 1) {
    const kind = "bot";
    const color = BOT_COLORS[(number - 1) % BOT_COLORS.length];
    actors.push(
      createActor({
        id: `bot-${number}`,
        kind,
        color,
        name: actorName(color),
        position: null,
        facing: "down",
        nextMoveAt: now + moveIntervalFor({ kind }, now),
      }),
    );
  }

  return actors;
}

export function updateActor(actors, id, patch) {
  return actors.map((actor) =>
    actor.id === id ? { ...actor, ...patch } : actor,
  );
}

export function getActor(actors, id) {
  return actors.find((actor) => actor.id === id) ?? null;
}

export function aliveActors(actors) {
  return actors.filter((actor) => actor.alive);
}

// speed × 0.6 i slow × 1.6 mnożą się, gdy oba trwają.
export function moveIntervalFor(actor, now) {
  const base =
    actor?.kind === "player" ? PLAYER_MOVE_INTERVAL_MS : BOT_MOVE_INTERVAL_MS;
  let multiplier = 1;
  if (hasEffect(actor, "speed", now)) {
    multiplier *= SPEED_MULTIPLIER;
  }
  if (hasEffect(actor, "slow", now)) {
    multiplier *= SLOW_MULTIPLIER;
  }
  return Math.max(1, Math.round(base * multiplier));
}

// Ściany i zabójstwa przypisane właścicielowi bomby. Samobójstwo nie jest zabójstwem.
export function creditCombatStats(
  actors,
  ownerId,
  { wallsDestroyed = 0, killedIds = [] } = {},
) {
  if (!ownerId) {
    return actors;
  }

  const kills = killedIds.filter((id) => id !== ownerId).length;
  if (wallsDestroyed === 0 && kills === 0) {
    return actors;
  }

  return actors.map((actor) => {
    if (actor.id !== ownerId) {
      return actor;
    }
    const stats = actor.stats ?? initialStats();
    return {
      ...actor,
      stats: {
        wallsDestroyed: (stats.wallsDestroyed ?? 0) + wallsDestroyed,
        bonusesCollected: stats.bonusesCollected ?? {
          positive: 0,
          negative: 0,
        },
        kills: (stats.kills ?? 0) + kills,
      },
    };
  });
}

export function computeGameStatus(actors) {
  const playerAlive = Boolean(getActor(actors, "player")?.alive);
  const bots = actors.filter((actor) => actor.kind === "bot");
  const anyBotAlive = bots.some((actor) => actor.alive);

  if (!playerAlive && anyBotAlive) {
    return "lose";
  }
  if (playerAlive && bots.every((actor) => !actor.alive)) {
    return "win";
  }
  if (!playerAlive) {
    return "draw";
  }
  return "playing";
}
