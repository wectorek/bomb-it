import { renderWall, checkCollision } from "./maze";
import { renderBorder } from "./border";
import { isBombAt } from "./bomb";

export const BOT_MOVE_INTERVAL_MS = 300;

const DIRECTIONS = [
  { row: -1, col: 0 },
  { row: 1, col: 0 },
  { row: 0, col: -1 },
  { row: 0, col: 1 },
];

// Bot traktuje bombę jak każdą inną przeszkodę - nigdy nie wejdzie na
// pole, na którym stoi aktualnie postawiona bomba (ale sam bomb nie stawia).
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
