import { renderWall } from "./maze";
import { renderBorder } from "./border";

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
