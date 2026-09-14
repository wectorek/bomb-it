"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";
import { generateMaze, renderWall, checkCollision } from "./maze";
import { createMapBorder, renderBorder } from "./border";
import { pickEmptyPosition } from "./bot";

const SIZE = 15;
const PLAYER_START = { row: 1, col: 8 };
const BORDERS = createMapBorder(SIZE);

export default function GameBoard() {
  const [playerPosition, setPlayerPosition] = useState(PLAYER_START);
  const [walls, setWalls] = useState([]);
  const [botPosition, setBotPosition] = useState(null);

  useEffect(() => {
    const nextWalls = generateMaze(SIZE, PLAYER_START);
    setWalls(nextWalls);
    setBotPosition(
      pickEmptyPosition(SIZE, nextWalls, BORDERS, [PLAYER_START]),
    );
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
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
          checkCollision(next, walls) ||
          renderBorder(next.row, next.col, BORDERS)
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

  return (
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
              const isBorder = renderBorder(row, col, BORDERS);
              const isWall = renderWall(row, col, walls);
              const cellClass = isPlayer
                ? styles.player
                : isBot
                  ? styles.bot
                  : isBorder
                    ? styles.border
                    : isWall
                      ? styles.wall
                      : undefined;
              return (
                <td key={col} className={cellClass}>
                  {isPlayer || isBot || isBorder || isWall
                    ? `${row},${col}`
                    : null}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
