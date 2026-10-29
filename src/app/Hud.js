import styles from "./page.module.css";
import { gameOverMessage } from "./gameOver";

export default function Hud({ playerLives, botLives, gameStatus }) {
  const message = gameOverMessage(gameStatus);

  return (
    <>
      <div className={styles.hud}>
        <span>Gracz: {playerLives} życia</span>
        <span>Bot: {botLives} życia</span>
      </div>
      {message ? <div className={styles.gameOver}>{message}</div> : null}
    </>
  );
}
