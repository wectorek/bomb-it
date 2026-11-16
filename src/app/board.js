import { ARENA_SIZE, BOARD_SIZE } from "./config";

export const wallBlockSize = ARENA_SIZE / BOARD_SIZE;

export function cellToPixels(row, col) {
  return {
    x: col * wallBlockSize,
    y: row * wallBlockSize,
  };
}

export function createMapBorder(size = BOARD_SIZE) {
  const borders = [];

  for (let i = 0; i < size; i += 1) {
    borders.push({ row: 0, col: i });
    borders.push({ row: size - 1, col: i });

    if (i !== 0 && i !== size - 1) {
      borders.push({ row: i, col: 0 });
      borders.push({ row: i, col: size - 1 });
    }
  }

  return borders;
}

export function stormInsetPixels(half) {
  const center = Math.floor((BOARD_SIZE - 1) / 2);
  const insetCells = Math.max(0, center - half);
  return insetCells * wallBlockSize;
}
