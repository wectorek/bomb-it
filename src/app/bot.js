import { renderBorder } from "./border";
import { BOMB_RANGE } from "./config";
import { renderWall, checkCollision } from "./maze";
import { getExplosionCells, getGrenadeTarget, isBombAt, isInExplosion } from "./bomb";
import { facingFromDirection } from "./playerMovement";

const DIRECTIONS = [
  { row: -1, col: 0 },
  { row: 1, col: 0 },
  { row: 0, col: -1 },
  { row: 0, col: 1 },
];

// Bot traktuje każdą bombę jak przeszkodę i sam stawia co najwyżej jedną.
function isBlocked(position, walls, borders, bomb) {
  return (
    checkCollision(position, walls) ||
    renderBorder(position.row, position.col, borders) ||
    isBombAt(position, bomb)
  );
}

function step(position, direction) {
  return {
    row: position.row + direction.row,
    col: position.col + direction.col,
  };
}

export function getOpenDirections(position, walls, borders, bomb) {
  return DIRECTIONS.filter(
    (direction) => !isBlocked(step(position, direction), walls, borders, bomb),
  );
}

export function pickOpenDirection(position, walls, borders, bomb) {
  const openDirections = getOpenDirections(position, walls, borders, bomb);

  if (openDirections.length === 0) {
    return null;
  }

  return openDirections[Math.floor(Math.random() * openDirections.length)];
}

export function nextBotMove(position, direction, walls, borders, bomb) {
  const openDirections = getOpenDirections(position, walls, borders, bomb);
  const isIntersection = openDirections.length > 2;

  let currentDirection;
  if (isIntersection) {
    // On a crossroads, always roll a new direction instead of continuing straight.
    currentDirection =
      openDirections[Math.floor(Math.random() * openDirections.length)];
  } else if (direction && openDirections.includes(direction)) {
    currentDirection = direction;
  } else if (openDirections.length > 0) {
    currentDirection =
      openDirections[Math.floor(Math.random() * openDirections.length)];
  } else {
    currentDirection = null;
  }

  if (!currentDirection) {
    return { position, direction: null };
  }

  return {
    position: step(position, currentDirection),
    direction: currentDirection,
  };
}

function manhattan(a, b) {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
}

function canEscapeBlast(
  origin,
  walls,
  borders,
  bombs,
  owner,
  range = BOMB_RANGE,
  start = origin,
) {
  const planted = { row: origin.row, col: origin.col, owner, range };
  const bombsForMove = [...bombs, planted];
  const danger = new Set(
    getExplosionCells(origin, walls, borders, range).map(
      (cell) => `${cell.row},${cell.col}`,
    ),
  );
  const queue = [{ row: start.row, col: start.col, distance: 0 }];
  const seen = new Set([`${start.row},${start.col}`]);
  const thrown = start.row !== origin.row || start.col !== origin.col;

  while (queue.length > 0) {
    const current = queue.shift();
    const key = `${current.row},${current.col}`;
    if (!danger.has(key) && (current.distance > 0 || thrown)) {
      return true;
    }
    if (current.distance > range + 1) {
      continue;
    }

    for (const direction of getOpenDirections(
      current,
      walls,
      borders,
      bombsForMove,
    )) {
      const next = step(current, direction);
      const nextKey = `${next.row},${next.col}`;
      if (seen.has(nextKey)) {
        continue;
      }
      seen.add(nextKey);
      queue.push({ row: next.row, col: next.col, distance: current.distance + 1 });
    }
  }

  return false;
}

function pickFrom(pool, direction) {
  if (pool.length === 0) {
    return null;
  }
  if (direction && pool.includes(direction)) {
    return direction;
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

// Stawia bombę, gdy da się z niej uciec, i schodzi z pola w tej samej turze.
// Z granatem rzuca w dotychczasowym kierunku (albo facing) i liczy wybuch od lądowania.
// Dopóki stoi w przyszłym wybuchu, idzie w stronę, która zwiększa odległość.
export function nextBotTurn(
  position,
  direction,
  walls,
  borders,
  bombs = [],
  owner = "bot-1",
  range = BOMB_RANGE,
  options = {},
) {
  const hasGrenade = Boolean(options.hasGrenade);
  const throwFacing = direction
    ? facingFromDirection(direction)
    : (options.facing ?? null);
  const grenadeTarget =
    hasGrenade && throwFacing
      ? getGrenadeTarget(position, throwFacing, walls, borders, bombs)
      : null;

  const hasOwnBomb = bombs.some((bomb) => bomb.owner === owner);
  const canLeave = getOpenDirections(position, walls, borders, bombs).length > 0;
  const feetFree = !isBombAt(position, bombs);
  const canThrow =
    Boolean(grenadeTarget) &&
    !hasOwnBomb &&
    canLeave &&
    canEscapeBlast(
      grenadeTarget,
      walls,
      borders,
      bombs,
      owner,
      BOMB_RANGE,
      position,
    );
  const canPlantBomb =
    !canThrow &&
    !hasOwnBomb &&
    feetFree &&
    canLeave &&
    (!hasGrenade || !grenadeTarget) &&
    canEscapeBlast(position, walls, borders, bombs, owner, range);

  const grenadeCell = canThrow ? grenadeTarget : null;
  const plantedCell = canPlantBomb
    ? { row: position.row, col: position.col }
    : null;
  const blastCell = grenadeCell ?? plantedCell;
  const blastRange = grenadeCell ? BOMB_RANGE : range;
  const bombsForMove = blastCell
    ? [
        ...bombs,
        {
          row: blastCell.row,
          col: blastCell.col,
          owner,
          range: blastRange,
        },
      ]
    : bombs;
  const threats = bombsForMove.filter((bomb) =>
    isInExplosion(
      position,
      getExplosionCells(bomb, walls, borders, bomb.range ?? BOMB_RANGE),
    ),
  );
  const turn = {
    plant: plantedCell,
    grenade: grenadeCell,
    grenadeFacing: grenadeCell ? throwFacing : null,
  };

  if (threats.length === 0) {
    return {
      ...turn,
      ...nextBotMove(position, direction, walls, borders, bombsForMove),
    };
  }

  const openDirections = getOpenDirections(
    position,
    walls,
    borders,
    bombsForMove,
  );
  const here = Math.min(...threats.map((bomb) => manhattan(position, bomb)));
  const away = openDirections.filter((dir) => {
    const next = step(position, dir);
    const nextDistance = Math.min(
      ...threats.map((bomb) => manhattan(next, bomb)),
    );
    return nextDistance > here;
  });
  const currentDirection = pickFrom(
    away.length > 0 ? away : openDirections,
    direction,
  );

  if (!currentDirection) {
    return { ...turn, position, direction: null };
  }

  return {
    ...turn,
    position: step(position, currentDirection),
    direction: currentDirection,
  };
}

export function pickEmptyPosition(size, walls, borders, blocked = []) {
  const emptyCells = [];

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const isBlocked = blocked.some(
        (cell) => cell.row === row && cell.col === col,
      );
      if (
        isBlocked ||
        renderWall(row, col, walls) ||
        renderBorder(row, col, borders)
      ) {
        continue;
      }
      emptyCells.push({ row, col });
    }
  }

  if (emptyCells.length === 0) {
    return null;
  }

  return emptyCells[Math.floor(Math.random() * emptyCells.length)];
}
