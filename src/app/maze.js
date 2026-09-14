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

export function generateMaze(size, start) {
  const walls = new Set();
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
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
        nextRow < 0 ||
        nextCol < 0 ||
        nextRow >= size ||
        nextCol >= size ||
        visited.has(cellKey(nextRow, nextCol))
      ) {
        continue;
      }

      walls.delete(cellKey(row + step.row / 2, col + step.col / 2));
      carve(nextRow, nextCol);
    }
  }

  carve(start.row, start.col);

  return [...walls].map((key) => {
    const [row, col] = key.split(",").map(Number);
    return { row, col };
  });
}

export function renderWall(row, col, walls) {
  return walls.some((wall) => wall.row === row && wall.col === col);
}

export function checkCollision(position, walls) {
  return walls.some((wall) => wall.row === position.row && wall.col === position.col);
}
