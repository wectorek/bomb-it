import { checkCollision } from "./maze";
import { renderBorder } from "./border";
import { isBombAt } from "./bomb";
import { BOT_MOVE_INTERVAL_MS } from "./bot";

export const PLAYER_MOVE_INTERVAL_MS = BOT_MOVE_INTERVAL_MS;

export function directionFromKey(key) {
  switch (key.toLowerCase()) {
    case "w":
    case "arrowup":
      return { row: -1, col: 0 };
    case "s":
    case "arrowdown":
      return { row: 1, col: 0 };
    case "a":
    case "arrowleft":
      return { row: 0, col: -1 };
    case "d":
    case "arrowright":
      return { row: 0, col: 1 };
    default:
      return null;
  }
}

export function cellAfterStep(position, direction) {
  return {
    row: position.row + direction.row,
    col: position.col + direction.col,
  };
}

function isSpaceKey(event) {
  return event.code === "Space" || event.key === " ";
}

export function playerInputFromKey(event, state) {
  if (isSpaceKey(event)) {
    const canPlaceBomb =
      state.bombsEnabled && state.gameStatus === "playing" && !state.bomb;

    return {
      preventScroll: true,
      bombPosition: canPlaceBomb ? state.position : null,
      move: null,
    };
  }

  if (state.gameStatus !== "playing") {
    return { preventScroll: false, bombPosition: null, move: null };
  }

  const direction = directionFromKey(event.key);
  if (!direction) {
    return { preventScroll: false, bombPosition: null, move: null };
  }

  if (state.now - state.lastMoveAt < PLAYER_MOVE_INTERVAL_MS) {
    return { preventScroll: true, bombPosition: null, move: null };
  }

  const next = cellAfterStep(state.position, direction);
  const blocked = isPlayerStepBlocked(next, state.walls, state.borders, state.bomb, {
    blockWalls: state.blockWalls,
    blockBombs: state.blockBombs,
  });

  if (blocked) {
    return { preventScroll: true, bombPosition: null, move: null };
  }

  return {
    preventScroll: true,
    bombPosition: null,
    move: { position: next, at: state.now },
  };
}

export function isPlayerStepBlocked(
  cell,
  walls,
  borders,
  bomb,
  { blockWalls, blockBombs },
) {
  const hitsWall = blockWalls && checkCollision(cell, walls);
  const hitsBorder = renderBorder(cell.row, cell.col, borders);
  const hitsBomb = blockBombs && isBombAt(cell, bomb);

  return hitsWall || hitsBorder || hitsBomb;
}
