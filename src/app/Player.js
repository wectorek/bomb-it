"use client";
import { useEffect, useState } from "react";
import styles from "./page.module.css";
const directions = {
  UP: "ArrowUp",
  DOWN: "ArrowDown",
  LEFT: "ArrowLeft",
  RIGHT: "ArrowRight",
};
let PLAYER_X = 500;
let PLAYER_Y = 500;
const PLAYER_SPEED = 0.5;

export default function Player() {
  const [playerPosition, setPlayerPosition] = useState({
    x: 500,
    y: 500,
  });
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
    switch (direction) {
      case directions.UP:
        setPlayerPosition((prev) => ({
          x: prev.x,
          y: prev.y - PLAYER_SPEED,
        }));
        break;
      case directions.DOWN:
        setPlayerPosition((prev) => ({
          x:prev.x,
          y: prev.y + PLAYER_SPEED,
        }));
        break;
      case directions.LEFT:
      setPlayerPosition((prev) => ({
        x: prev.x - PLAYER_SPEED,
        y: prev.y,
      }));
        break;
      case directions.RIGHT:
         setPlayerPosition((prev) => ({
          x: prev.x + PLAYER_SPEED,
          y: prev.y,
        }));
        break;
    }
  }

  return (
    <div
      className={styles.player}
      style={{
        left: `${playerPosition.x}px`,
        top: `${playerPosition.y}px`,
      }}
    ></div>
  );
}


