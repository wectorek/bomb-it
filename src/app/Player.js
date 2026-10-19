"use client";
import { useEffect, useRef, useState } from "react";
import styles from "./page.module.css";
import { wallBlockSize } from "./maze";
import { collidesWithWall } from "./collision";
const directions = {
  UP: "ArrowUp",
  DOWN: "ArrowDown",
  LEFT: "ArrowLeft",
  RIGHT: "ArrowRight",
};
let PLAYER_X = 500;
let PLAYER_Y = 500;
const PLAYER_SPEED = 10;

export default function Player({ walls = [], start = { x: 500, y: 500 } }) {
  const [playerPosition, setPlayerPosition] = useState(start);
  const wallsRef = useRef(walls);
  wallsRef.current = walls;

  useEffect(() => {
    function handleKeyDown(event) {
      movePlayer(event.key);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function movePlayer(direction) {
    setPlayerPosition((prev) => {
      let next = prev;
      switch (direction) {
        case directions.UP:
          next = { x: prev.x, y: prev.y - PLAYER_SPEED };
          break;
        case directions.DOWN:
          next = { x: prev.x, y: prev.y + PLAYER_SPEED };
          break;
        case directions.LEFT:
          next = { x: prev.x - PLAYER_SPEED, y: prev.y };
          break;
        case directions.RIGHT:
          next = { x: prev.x + PLAYER_SPEED, y: prev.y };
          break;
        default:
          return prev;
      }

      if (collidesWithWall(next, wallsRef.current)) {
        return prev;
      }

      return next;
    });
  }

  return (
    <div
      className={styles.player}
      style={{
        left: `${playerPosition.x}px`,
        top: `${playerPosition.y}px`,
        width: `${wallBlockSize}px`,
        height: `${wallBlockSize}px`,
      }}
    ></div>
  );
}


