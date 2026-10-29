import { cellToPixels, renderWall } from "./maze";
import { renderBorder } from "./border";

export const BOMB_TIMER_MS = 3000; // czas od postawienia do wybuchu
export const BOMB_RANGE = 2; // zasięg wybuchu w każdą stronę krzyża
export const EXPLOSION_DURATION_MS = 400; // jak długo widoczny jest ogień
export const STARTING_LIVES = 3;

const DIRECTIONS = [
  { row: -1, col: 0 },
  { row: 1, col: 0 },
  { row: 0, col: -1 },
  { row: 0, col: 1 },
];

// Czy dana pozycja to pole, na którym aktualnie leży bomba (jeśli bomb === null,
// znaczy że żadna bomba nie jest postawiona, więc zawsze zwraca false).
export function isBombAt(position, bomb) {
  return !!bomb && position.row === bomb.row && position.col === bomb.col;
}

// Czy dana pozycja znajduje się na jednym z pól objętych aktualnym wybuchem.
// Używane zarówno do rysowania ognia, jak i do sprawdzania obrażeń gracza/bota.
export function isInExplosion(position, explosionCells) {
  return explosionCells.some(
    (cell) => cell.row === position.row && cell.col === position.col,
  );
}

/**
 * Liczy komórki objęte wybuchem bomby ustawionej w `origin` - kształt krzyża,
 * bez ukosów. Zewnętrzne obramowanie zatrzymuje falę i nie jest niszczone.
 * Wewnętrzna ściana wchodzi w zasięg wybuchu (zostaje zniszczona), ale fala
 * nie idzie dalej w tym kierunku.
 */
export function getExplosionCells(origin, walls, borders, range = BOMB_RANGE) {
  const cells = [{ ...origin }];

  for (const direction of DIRECTIONS) {
    for (let step = 1; step <= range; step++) {
      const cell = {
        row: origin.row + direction.row * step,
        col: origin.col + direction.col * step,
      };

      if (renderBorder(cell.row, cell.col, borders)) {
        break;
      }

      const hitsWall = renderWall(cell.row, cell.col, walls);
      cells.push(cell);

      if (hitsWall) {
        break;
      }
    }
  }

  return cells;
}

// Usuwa z listy ścian te, które znalazły się w zasięgu wybuchu. Obramowanie
// mapy nie jest przechowywane w `walls`, więc ta funkcja nigdy go nie dotyka.
export function removeDestroyedWalls(walls, explosionCells) {
  return walls.filter(
    (wall) =>
      !explosionCells.some((cell) => {
        const { x, y } = cellToPixels(cell.row, cell.col);
        return wall.x === x && wall.y === y;
      }),
  );
}

function gameStatusAfterHits(playerLives, botLives) {
  if (playerLives <= 0 && botLives <= 0) {
    return "draw";
  }
  if (playerLives <= 0) {
    return "lose";
  }
  if (botLives <= 0) {
    return "win";
  }
  return null;
}

// Liczy skutek wybuchu bez zmiany stanu Reacta: pola ognia, ściany do usunięcia,
// życia po trafieniu i status końca gry, jeśli ktoś stracił ostatnie życie.
export function resolveExplosionOutcome({
  bombPosition,
  walls,
  borders,
  playerPosition,
  botPosition,
  playerLives,
  botLives,
  range = BOMB_RANGE,
}) {
  const cells = getExplosionCells(bombPosition, walls, borders, range);
  const nextPlayerLives = isInExplosion(playerPosition, cells)
    ? playerLives - 1
    : playerLives;
  const nextBotLives =
    botPosition && isInExplosion(botPosition, cells) ? botLives - 1 : botLives;

  return {
    cells,
    walls: removeDestroyedWalls(walls, cells),
    playerLives: nextPlayerLives,
    botLives: nextBotLives,
    gameStatus: gameStatusAfterHits(nextPlayerLives, nextBotLives),
  };
}
