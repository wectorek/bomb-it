import { renderWall, checkCollision } from "./maze";
import { renderBorder } from "./border";

export const BOT_MOVE_INTERVAL_MS = 500;

const DIRECTIONS = [
  { row: -1, col: 0 },
  { row: 1, col: 0 },
  { row: 0, col: -1 },
  { row: 0, col: 1 },
];

function isBlocked(position, walls, borders) {
  return (
    checkCollision(position, walls) ||
    renderBorder(position.row, position.col, borders)
  );
}

function step(position, direction) {
  return {
    row: position.row + direction.row,
    col: position.col + direction.col,
  };
}

export function getOpenDirections(position, walls, borders) {
  return DIRECTIONS.filter(
    (direction) => !isBlocked(step(position, direction), walls, borders),
  );
}

export function pickOpenDirection(position, walls, borders) {
  const openDirections = getOpenDirections(position, walls, borders);

  if (openDirections.length === 0) {
    return null;
  }

  return openDirections[Math.floor(Math.random() * openDirections.length)];
}

export function nextBotMove(position, direction, walls, borders) {
  const openDirections = getOpenDirections(position, walls, borders);
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
