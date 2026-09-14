export function createMapBorder(size) {
  const borders = [];

  for (let i = 0; i < size; i++) {
    borders.push({ row: 0, col: i });
    borders.push({ row: size - 1, col: i });

    if (i !== 0 && i !== size - 1) {
      borders.push({ row: i, col: 0 });
      borders.push({ row: i, col: size - 1 });
    }
  }

  return borders;
}

export function renderBorder(row, col, borders) {
  return borders.some((cell) => cell.row === row && cell.col === col);
}
