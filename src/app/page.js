import styles from "./page.module.css";
import GameBoard from "./GameBoard";

export default function Home() {
  return (
    <div className={styles.page}>
      <h1>Hello World</h1>
      <GameBoard />
    </div>
  );
}
