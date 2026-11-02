import { checkCollision } from "./maze";
import { renderBorder } from "./border";
import { isBombAt, ownsBomb } from "./bomb";

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

export function facingFromDirection(direction) {
  if (direction.row < 0) return "up";
  if (direction.row > 0) return "down";
  if (direction.col < 0) return "left";
  return "right";
}

function isSpaceKey(event) {
  return event.code === "Space" || event.key === " ";
}

export function playerInputFromKey(event, state) {
  if (isSpaceKey(event)) {
    const playing = state.bombsEnabled && state.gameStatus === "playing";
    const ownsCharge = ownsBomb(state.bombs, "player");
    const feetFree = !isBombAt(state.position, state.bombs);
    const hasGrenade = Boolean(state.hasGrenade);

    return {
      preventScroll: true,
      throwGrenade: playing && hasGrenade && !ownsCharge,
      bombPosition: playing && !ownsCharge && feetFree ? state.position : null,
      move: null,
      facing: null,
    };
  }

  if (state.gameStatus !== "playing") {
    return {
      preventScroll: false,
      bombPosition: null,
      throwGrenade: false,
      move: null,
      facing: null,
    };
  }

  const direction = directionFromKey(event.key);
  if (!direction) {
    return {
      preventScroll: false,
      bombPosition: null,
      throwGrenade: false,
      move: null,
      facing: null,
    };
  }

  const facing = facingFromDirection(direction);

  if (state.now < state.nextMoveAt) {
    return {
      preventScroll: true,
      bombPosition: null,
      throwGrenade: false,
      move: null,
      facing,
    };
  }

  const next = cellAfterStep(state.position, direction);
  const blocked = isPlayerStepBlocked(next, state.walls, state.borders, state.bombs, {
    blockWalls: state.blockWalls,
    blockBombs: state.blockBombs,
  });

  if (blocked) {
    return {
      preventScroll: true,
      bombPosition: null,
      throwGrenade: false,
      move: null,
      facing,
    };
  }

  return {
    preventScroll: true,
    bombPosition: null,
    throwGrenade: false,
    move: { position: next, at: state.now },
    facing,
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
