"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import styles from "./page.module.css";
import { generateMaze, renderWall } from "./maze";
import { createMapBorder, renderBorder } from "./border";
import { STARTING_LIVES } from "./bomb";

const SIZE = 15;
const PLAYER_START_CELL = { row: 1, col: 8 };
const BORDERS = createMapBorder(SIZE);
const PLAYER_SPEED_PX_PER_SEC = 180;

// Tymczasowo wyłączone: bot, bomby i kolizje ze ścianami.
const ENABLE_BOT = false;
const ENABLE_BOMBS = false;
const ENABLE_WALL_COLLISION = false;

export default function GameBoard() {
  const [walls, setWalls] = useState([]);
  const [playerPosition, setPlayerPosition] = useState({ x: 0, y: 0 });
  const [playerSize, setPlayerSize] = useState(0);
  const [playerLives] = useState(STARTING_LIVES);
  const [gameStatus] = useState("playing");

  const boardRef = useRef(null);
  const playerPositionRef = useRef(playerPosition);
  const playerSizeRef = useRef(playerSize);
  const boardSizeRef = useRef(0);
  const keysRef = useRef(new Set());
  const rafRef = useRef(0);

  useEffect(() => {
    setWalls(generateMaze(SIZE, PLAYER_START_CELL));
  }, []);

  useLayoutEffect(() => {
    const board = boardRef.current;
    if (!board) {
      return undefined;
    }

    function applyBoardSize(width) {
      const prevSize = boardSizeRef.current;
      boardSizeRef.current = width;
      const cellSize = width / SIZE;
      playerSizeRef.current = cellSize;
      setPlayerSize(cellSize);

      if (!prevSize) {
        const next = {
          x: PLAYER_START_CELL.col * cellSize,
          y: PLAYER_START_CELL.row * cellSize,
        };
        playerPositionRef.current = next;
        setPlayerPosition(next);
        return;
      }

      const scale = width / prevSize;
      if (scale === 1) {
        return;
      }

      const next = {
        x: playerPositionRef.current.x * scale,
        y: playerPositionRef.current.y * scale,
      };
      playerPositionRef.current = next;
      setPlayerPosition(next);
    }

    applyBoardSize(board.offsetWidth);

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width) {
        applyBoardSize(width);
      }
    });
    observer.observe(board);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (ENABLE_BOMBS && (event.code === "Space" || event.key === " ")) {
        event.preventDefault();
        return;
      }

      const key = event.key.toLowerCase();
      if (key === "w" || key === "a" || key === "s" || key === "d") {
        event.preventDefault();
        keysRef.current.add(key);
      }
    };

    const handleKeyUp = (event) => {
      keysRef.current.delete(event.key.toLowerCase());
    };

    let lastTime = performance.now();

    function tick(now) {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      if (gameStatus === "playing" && keysRef.current.size > 0) {
        const step = PLAYER_SPEED_PX_PER_SEC * dt;
        const prev = playerPositionRef.current;
        let x = prev.x;
        let y = prev.y;

        if (keysRef.current.has("w")) {
          y -= step;
        }
        if (keysRef.current.has("s")) {
          y += step;
        }
        if (keysRef.current.has("a")) {
          x -= step;
        }
        if (keysRef.current.has("d")) {
          x += step;
        }

        const size = playerSizeRef.current;
        const boardSize = boardSizeRef.current;
        const max = Math.max(0, boardSize - size);
        x = Math.max(0, Math.min(x, max));
        y = Math.max(0, Math.min(y, max));

        // Kolizje ze ścianami tymczasowo wyłączone — gracz zostaje tylko
        // w granicach planszy i przechodzi przez ściany oraz obramowanie.
        if (!ENABLE_WALL_COLLISION) {
          const next = { x, y };
          playerPositionRef.current = next;
          const rounded = { x: Math.round(x), y: Math.round(y) };
          if (
            rounded.x !== Math.round(prev.x) ||
            rounded.y !== Math.round(prev.y)
          ) {
            setPlayerPosition(rounded);
          }
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      cancelAnimationFrame(rafRef.current);
    };
  }, [gameStatus]);

  return (
    <div className={styles.gameWrapper}>
      <div className={styles.hud}>
        <span>Gracz: {playerLives} życia</span>
        {ENABLE_BOT ? <span>Bot: {STARTING_LIVES} życia</span> : null}
      </div>
      <div
        className={styles.board}
        ref={boardRef}
        style={{ "--board-size": SIZE }}
      >
        <table className={styles.table}>
          <tbody>
            {Array.from({ length: SIZE }, (_, row) => (
              <tr key={row}>
                {Array.from({ length: SIZE }, (_, col) => {
                  const isBorder = renderBorder(row, col, BORDERS);
                  const isWall = renderWall(row, col, walls);
                  const cellClass = isBorder
                    ? styles.border
                    : isWall
                      ? styles.wall
                      : undefined;
                  return (
                    <td key={col} className={cellClass}>
                      {isBorder || isWall ? `${row},${col}` : null}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {playerSize > 0 ? (
          <div
            className={styles.playerSprite}
            style={{
              width: playerSize,
              height: playerSize,
              transform: `translate(${playerPosition.x}px, ${playerPosition.y}px)`,
            }}
          />
        ) : null}
      </div>
    </div>
  );
}
