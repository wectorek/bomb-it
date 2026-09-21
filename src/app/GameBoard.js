"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./page.module.css";
import { generateMaze, renderWall, checkCollision } from "./maze";
import { createMapBorder, renderBorder } from "./border";
import { pickEmptyPosition, nextBotMove, BOT_MOVE_INTERVAL_MS } from "./bot";
import {
  BOMB_TIMER_MS,
  BOMB_RANGE,
  EXPLOSION_DURATION_MS,
  STARTING_LIVES,
  isBombAt,
  isInExplosion,
  getExplosionCells,
  removeDestroyedWalls,
} from "./bomb";

const SIZE = 15;
const PLAYER_START = { row: 1, col: 8 };
const BORDERS = createMapBorder(SIZE);
// Gracz ma poruszać się z tą samą prędkością co bot, więc używamy tego
// samego interwału jako minimalnego odstępu między ruchami gracza.
const PLAYER_MOVE_INTERVAL_MS = BOT_MOVE_INTERVAL_MS;

// Tymczasowo wyłączone: bot, bomby i kolizje ze ścianami.
const ENABLE_BOT = false;
const ENABLE_BOMBS = false;
const ENABLE_WALL_COLLISION = false;

export default function GameBoard() {
  const [playerPosition, setPlayerPosition] = useState(PLAYER_START);
  const [walls, setWalls] = useState([]);
  const [botPosition, setBotPosition] = useState(null);
  const [bomb, setBomb] = useState(null);
  const [explosionCells, setExplosionCells] = useState([]);
  const [playerLives, setPlayerLives] = useState(STARTING_LIVES);
  const [botLives, setBotLives] = useState(STARTING_LIVES);
  const [gameStatus, setGameStatus] = useState("playing");

  const playerPositionRef = useRef(playerPosition);
  playerPositionRef.current = playerPosition;

  const botPositionRef = useRef(botPosition);
  botPositionRef.current = botPosition;

  const wallsRef = useRef(walls);
  wallsRef.current = walls;

  const bombRef = useRef(bomb);
  bombRef.current = bomb;

  const playerLivesRef = useRef(playerLives);
  playerLivesRef.current = playerLives;

  const botLivesRef = useRef(botLives);
  botLivesRef.current = botLives;

  const gameStatusRef = useRef(gameStatus);
  gameStatusRef.current = gameStatus;

  // Znacznik czasu ostatniego ruchu gracza. Używany do throttlingu ruchu,
  // tak żeby spamowanie klawisza WASD nie pozwalało graczowi ruszać się
  // częściej niż raz na PLAYER_MOVE_INTERVAL_MS (czyli tak samo jak bot).
  const lastPlayerMoveRef = useRef(0);

  useEffect(() => {
    const nextWalls = generateMaze(SIZE, PLAYER_START);
    setWalls(nextWalls);
    if (ENABLE_BOT) {
      setBotPosition(
        pickEmptyPosition(SIZE, nextWalls, BORDERS, [PLAYER_START]),
      );
    }
  }, []);

  // Wywoływane po odczekaniu BOMB_TIMER_MS od postawienia bomby. Liczy pola
  // ognia, usuwa zniszczone ściany, zadaje obrażenia i sprawdza koniec gry.
  function resolveExplosion(bombPosition) {
    // Krok 1: policz pola objęte wybuchem (krzyż o zasięgu BOMB_RANGE).
    const cells = getExplosionCells(
      bombPosition,
      wallsRef.current,
      BORDERS,
      BOMB_RANGE,
    );

    // Krok 2: usuń tylko wewnętrzne ściany trafione wybuchem (obramowanie
    // mapy nie jest częścią `walls`, więc zawsze zostaje nietknięte).
    setWalls((prev) => removeDestroyedWalls(prev, cells));
    // Krok 3: pokaż ogień na chwilę (czyszczony niżej po EXPLOSION_DURATION_MS).
    setExplosionCells(cells);

    // Sprawdzamy pozycje z refów, żeby złapać dokładny stan w momencie
    // wybuchu, niezależnie od tego, kiedy React zdąży przerenderować.
    const playerHit = isInExplosion(playerPositionRef.current, cells);
    const botHit =
      !!botPositionRef.current && isInExplosion(botPositionRef.current, cells);

    let nextPlayerLives = playerLivesRef.current;
    let nextBotLives = botLivesRef.current;

    // Krok 4: obrażenia - gracz traci życie nawet od własnej bomby.
    if (playerHit) {
      nextPlayerLives -= 1;
      playerLivesRef.current = nextPlayerLives;
      setPlayerLives(nextPlayerLives);
    }

    if (botHit) {
      nextBotLives -= 1;
      botLivesRef.current = nextBotLives;
      setBotLives(nextBotLives);
    }

    // Krok 5: bomba została zdetonowana - zwolnij miejsce na kolejną.
    setBomb(null);
    bombRef.current = null;

    // Krok 6: sprawdź, czy ktoś stracił wszystkie życia w tym wybuchu.
    if (nextPlayerLives <= 0 && nextBotLives <= 0) {
      setGameStatus("draw");
    } else if (nextPlayerLives <= 0) {
      setGameStatus("lose");
    } else if (nextBotLives <= 0) {
      setGameStatus("win");
    }

    // Po chwili gaśnie animacja ognia (sama plansza/ściany są już zmienione
    // od razu, to tylko wizualne podświetlenie pól wybuchu).
    setTimeout(() => {
      setExplosionCells([]);
    }, EXPLOSION_DURATION_MS);
  }

  // Stawia bombę na podanej pozycji i planuje jej wybuch po BOMB_TIMER_MS.
  function placeBomb(position) {
    setBomb(position);
    bombRef.current = position;

    setTimeout(() => {
      resolveExplosion(position);
    }, BOMB_TIMER_MS);
  }

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.code === "Space" || event.key === " ") {
        // Blokujemy domyślne przewijanie strony spacją.
        event.preventDefault();

        // Bomby można stawiać tylko podczas gry i tylko jedną naraz -
        // jeśli `bombRef.current` nie jest null, ignorujemy kolejne spacje.
        if (
          !ENABLE_BOMBS ||
          gameStatusRef.current !== "playing" ||
          bombRef.current
        ) {
          return;
        }

        placeBomb(playerPositionRef.current);
        return;
      }

      if (gameStatusRef.current !== "playing") {
        return;
      }

      // Throttling ruchu: nawet jeśli klawisz jest spamowany (wiele
      // zdarzeń keydown w krótkim czasie, np. przy trzymaniu klawisza),
      // ruch faktycznie wykonuje się co najwyżej raz na
      // PLAYER_MOVE_INTERVAL_MS - tak samo często jak porusza się bot.
      const now = Date.now();
      if (now - lastPlayerMoveRef.current < PLAYER_MOVE_INTERVAL_MS) {
        return;
      }
      lastPlayerMoveRef.current = now;

      setPlayerPosition((prev) => {
        let next = prev;
        switch (event.key.toLowerCase()) {
          case "w":
            next = { ...prev, row: prev.row - 1 };
            break;
          case "s":
            next = { ...prev, row: prev.row + 1 };
            break;
          case "a":
            next = { ...prev, col: prev.col - 1 };
            break;
          case "d":
            next = { ...prev, col: prev.col + 1 };
            break;
          default:
            return prev;
        }

        if (
          (ENABLE_WALL_COLLISION && checkCollision(next, walls)) ||
          renderBorder(next.row, next.col, BORDERS) ||
          (ENABLE_BOMBS && isBombAt(next, bombRef.current))
        ) {
          return prev;
        }

        return next;
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [walls]);

  useEffect(() => {
    if (!ENABLE_BOT || walls.length === 0) {
      return undefined;
    }

    let direction = null;
    // Bot rusza się co BOT_MOVE_INTERVAL_MS - to samo tempo, którym
    // ograniczamy ruch gracza (patrz PLAYER_MOVE_INTERVAL_MS wyżej).
    const id = setInterval(() => {
      if (gameStatusRef.current !== "playing") {
        return;
      }

      const prev = botPositionRef.current;
      if (!prev) {
        return;
      }

      const nextMove = nextBotMove(
        prev,
        direction,
        walls,
        BORDERS,
        bombRef.current,
      );
      direction = nextMove.direction;
      botPositionRef.current = nextMove.position;
      setBotPosition(nextMove.position);
    }, BOT_MOVE_INTERVAL_MS);

    return () => {
      clearInterval(id);
    };
  }, [walls]);

  const gameOverMessage =
    gameStatus === "win"
      ? "Wygrałeś! Bot stracił wszystkie życia."
      : gameStatus === "lose"
        ? "Przegrałeś! Straciłeś wszystkie życia."
        : gameStatus === "draw"
          ? "Remis! Obaj stracili wszystkie życia."
          : null;

  return (
    <div className={styles.gameWrapper}>
      <div className={styles.hud}>
        <span>Gracz: {playerLives} życia</span>
        <span>Bot: {botLives} życia</span>
      </div>
      {gameOverMessage ? (
        <div className={styles.gameOver}>{gameOverMessage}</div>
      ) : null}
      <table className={styles.table} style={{ "--board-size": SIZE }}>
        <tbody>
          {Array.from({ length: SIZE }, (_, row) => (
            <tr key={row}>
              {Array.from({ length: SIZE }, (_, col) => {
                const isPlayer =
                  row === playerPosition.row && col === playerPosition.col;
                const isBot =
                  botPosition &&
                  row === botPosition.row &&
                  col === botPosition.col;
                const isExplosion = isInExplosion({ row, col }, explosionCells);
                const isBomb = isBombAt({ row, col }, bomb);
                const isBorder = renderBorder(row, col, BORDERS);
                const isWall = renderWall(row, col, walls);
                const cellClass = isPlayer
                  ? styles.player
                  : isBot
                    ? styles.bot
                    : isExplosion
                      ? styles.explosion
                      : isBomb
                        ? styles.bomb
                        : isBorder
                          ? styles.border
                          : isWall
                            ? styles.wall
                            : undefined;
                return (
                  <td key={col} className={cellClass}>
                    {isPlayer ||
                    isBot ||
                    isExplosion ||
                    isBomb ||
                    isBorder ||
                    isWall
                      ? `${row},${col}`
                      : null}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
