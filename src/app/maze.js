import { ARENA_SIZE, BOARD_SIZE, BONUS_WALL_CHANCE } from "./config";

export const wallBlockSize = ARENA_SIZE / BOARD_SIZE;
export const wallBlock = { x: wallBlockSize, y: wallBlockSize };
export const wallCursor = "pointer";

export function cellToPixels(row, col) {
  return {
    x: col * wallBlockSize,
    y: row * wallBlockSize,
  };
}

function cellKey(row, col) {
  return `${row},${col}`;
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function alignToLattice(value, min) {
  return value - ((value - min) % 2);
}

export function generateMaze(size, start, inset = 1) {
  const min = inset;
  const max = size - inset;
  const walls = new Set();
  for (let row = min; row < max; row++) {
    for (let col = min; col < max; col++) {
      walls.add(cellKey(row, col));
    }
  }

  const visited = new Set();
  const steps = [
    { row: -2, col: 0 },
    { row: 2, col: 0 },
    { row: 0, col: -2 },
    { row: 0, col: 2 },
  ];

  function carve(row, col) {
    visited.add(cellKey(row, col));
    walls.delete(cellKey(row, col));

    for (const step of shuffle(steps)) {
      const nextRow = row + step.row;
      const nextCol = col + step.col;
      if (
        nextRow < min ||
        nextCol < min ||
        nextRow >= max ||
        nextCol >= max ||
        visited.has(cellKey(nextRow, nextCol))
      ) {
        continue;
      }

      walls.delete(cellKey(row + step.row / 2, col + step.col / 2));
      carve(nextRow, nextCol);
    }
  }

  carve(alignToLattice(start.row, min), alignToLattice(start.col, min));
  walls.delete(cellKey(start.row, start.col));

  return [...walls].map((key) => {
    const [row, col] = key.split(",").map(Number);
    return { row, col, type: wallType(row, col) };
  });
}

// Filary (obie współrzędne parzyste) DFS i tak zostawia. Reszta to skrzynki.
function wallType(row, col) {
  if (row % 2 === 0 && col % 2 === 0) {
    return "solid";
  }

  return Math.random() < BONUS_WALL_CHANCE ? "bonus" : "destructible";
}

export function renderWall(row, col, walls) {
  return walls.some((wall) => wall.row === row && wall.col === col);
}

export function checkCollision(position, walls) {
  return renderWall(position.row, position.col, walls);
}
