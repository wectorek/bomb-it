"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";

const SIZE = 15;

export default function GameBoard() {
  const [playerPosition, setPlayerPosition] = useState({ row: 0, col: 8 });
  useEffect(() => {
    const handleKeyDown = (event) => {
      setPlayerPosition((prev) => {
        switch (event.key.toLowerCase()) {
          case "w":
            return { ...prev, row: prev.row - 1 };
          case "s":
            return { ...prev, row: prev.row + 1 };
          case "a":
            return { ...prev, col: prev.col - 1 };
          case "d":
            return { ...prev, col: prev.col + 1 };
          default:
            return prev;
        }
      });
    };

    window.addEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <table className={styles.table} style={{ "--board-size": SIZE }}>
      <tbody>
        {Array.from({ length: SIZE }, (_, row) => (
          <tr key={row}>
            {Array.from({ length: SIZE }, (_, col) => {
              const isPlayer =
                row === playerPosition.row && col === playerPosition.col;
              return (
                <td key={col} className={isPlayer ? styles.player : undefined}>
                  {isPlayer ? `${row},${col}` : null}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
