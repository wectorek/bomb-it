import { computeGameStatus, creditCombatStats } from "./actors";
import { damageFor } from "./bonus";
import { renderBorder } from "./border";
import { BOARD_SIZE, BOMB_RANGE, GRENADE_THROW_DISTANCE } from "./config";

const DIRECTIONS = [
  { row: -1, col: 0 },
  { row: 1, col: 0 },
  { row: 0, col: -1 },
  { row: 0, col: 1 },
];

const FACING_STEP = {
  up: { row: -1, col: 0 },
  down: { row: 1, col: 0 },
  left: { row: 0, col: -1 },
  right: { row: 0, col: 1 },
};

// Czy dana pozycja to pole z bombą. `bomb` może być jedną bombą albo listą.
// Granat w locie (`airborne`) nie blokuje ruchu ani kolejnego ładunku na polu.
export function isBombAt(position, bomb) {
  if (!position || bomb == null) {
    return false;
  }

  const bombs = Array.isArray(bomb) ? bomb : [bomb];
  return bombs.some(
    (item) =>
      item &&
      !item.airborne &&
      item.row === position.row &&
      item.col === position.col,
  );
}

export function ownsBomb(bombs, owner) {
  return Array.isArray(bombs) && bombs.some((bomb) => bomb.owner === owner);
}

// Czy dana pozycja znajduje się na jednym z pól objętych aktualnym wybuchem.
export function isInExplosion(position, explosionCells) {
  if (!position) {
    return false;
  }
  return explosionCells.some(
    (cell) => cell.row === position.row && cell.col === position.col,
  );
}

function wallAt(row, col, walls) {
  return walls.find((wall) => wall.row === row && wall.col === col);
}

function isGrenadeLandingOpen(cell, walls, borders, bombs) {
  if (
    cell.row < 0 ||
    cell.col < 0 ||
    cell.row >= BOARD_SIZE ||
    cell.col >= BOARD_SIZE
  ) {
    return false;
  }
  if (renderBorder(cell.row, cell.col, borders)) {
    return false;
  }
  // Każdy typ ściany blokuje lądowanie. Pole pośrednie nie jest sprawdzane.
  if (wallAt(cell.row, cell.col, walls)) {
    return false;
  }
  return !isBombAt(cell, bombs);
}

// Pole lądowania w kierunku `facing`: najpierw GRENADE_THROW_DISTANCE, potem 1.
// null oznacza, że rzut jest niemożliwy i granat nie powinien zostać zużyty.
export function getGrenadeTarget(
  position,
  facing,
  walls = [],
  borders = [],
  bombs = [],
) {
  const step = FACING_STEP[facing];
  if (!position || !step) {
    return null;
  }

  const distances =
    GRENADE_THROW_DISTANCE === 1 ? [1] : [GRENADE_THROW_DISTANCE, 1];

  for (const distance of distances) {
    const cell = {
      row: position.row + step.row * distance,
      col: position.col + step.col * distance,
    };
    if (isGrenadeLandingOpen(cell, walls, borders, bombs)) {
      return cell;
    }
  }

  return null;
}

/**
 * Liczy komórki objęte wybuchem bomby ustawionej w `origin` - kształt krzyża,
 * bez ukosów. Obramowanie i ściana `solid` zatrzymują falę bez wchodzenia
 * na to pole. Ściana `destructible` albo `bonus` wchodzi w zasięg (zostaje
 * zniszczona), ale fala nie idzie dalej w tym kierunku.
 */
export function getExplosionCells(origin, walls, borders, range = BOMB_RANGE) {
  const cells = [{ ...origin }];

  for (const direction of DIRECTIONS) {
    for (let step = 1; step <= range; step++) {
      const cell = {
        row: origin.row + direction.row * step,
        col: origin.col + direction.col * step,
      };

      if (renderBorder(cell.row, cell.col, borders)) {
        break;
      }

      const wall = wallAt(cell.row, cell.col, walls);
      if (wall?.type === "solid") {
        break;
      }

      cells.push(cell);

      if (wall) {
        break;
      }
    }
  }

  return cells;
}

// Usuwa ściany leżące na polach wybuchu. `solid` zostaje; obramowanie nie jest w `walls`.
export function removeDestroyedWalls(walls, explosionCells) {
  return walls.filter(
    (wall) => wall.type === "solid" || !isInExplosion(wall, explosionCells),
  );
}

// Skutek wybuchu bez zmiany stanu Reacta. Martwy aktor nie traci życia drugi raz.
export function resolveExplosionOutcome({
  bombPosition,
  walls,
  borders,
  actors,
  range = bombPosition?.range ?? BOMB_RANGE,
  now = Date.now(),
  owner = bombPosition?.owner ?? null,
}) {
  const cells = getExplosionCells(bombPosition, walls, borders, range);
  const destroyedWalls = walls.filter(
    (wall) => wall.type !== "solid" && isInExplosion(wall, cells),
  );
  const killedIds = [];
  const damaged = actors.map((actor) => {
    if (!actor.alive || !actor.position || !isInExplosion(actor.position, cells)) {
      return actor;
    }
    const damage = damageFor(actor, now);
    if (damage <= 0) {
      return actor;
    }
    const lives = Math.max(0, actor.lives - damage);
    const alive = lives > 0;
    if (!alive) {
      killedIds.push(actor.id);
    }
    return {
      ...actor,
      lives,
      alive,
      ...(!alive && actor.diedAt == null ? { diedAt: now } : {}),
    };
  });
  const nextActors = creditCombatStats(damaged, owner, {
    wallsDestroyed: destroyedWalls.length,
    killedIds,
  });

  return {
    cells,
    walls: removeDestroyedWalls(walls, cells),
    destroyedWalls,
    actors: nextActors,
    gameStatus: computeGameStatus(nextActors),
  };
}
