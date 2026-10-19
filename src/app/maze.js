export const BOARD_SIZE = 15;
export const ARENA_SIZE = 1000;
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
    return cellToPixels(row, col);
  });
}

export function renderWall(row, col, walls) {
  const { x, y } = cellToPixels(row, col);
  return walls.some((wall) => wall.x === x && wall.y === y);
}

export function checkCollision(position, walls) {
  const { x, y } = cellToPixels(position.row, position.col);
  return walls.some((wall) => wall.x === x && wall.y === y);
}
