import styles from "./page.module.css";
import { ARENA_SIZE, BOARD_SIZE } from "./maze";
import Player from "./Player";
import WallBlock from "./WallBlock";

export default function Arena({ walls, playerPosition }) {
  return (
    <div className={styles.board} style={{ "--board-size": BOARD_SIZE }}>
      <div
        className={styles.arena}
        style={{
          width: ARENA_SIZE,
          height: ARENA_SIZE,
          "--board-size": BOARD_SIZE,
        }}
      >
        {walls.map((wall) => (
          <WallBlock key={`${wall.x},${wall.y}`} x={wall.x} y={wall.y} />
        ))}
        <Player position={playerPosition} />
      </div>
    </div>
  );
}
