import styles from "./page.module.css";
import GameSession from "./GameSession";
import MusicToggle from "./MusicToggle";

export default function Home() {
  return (
    <div className={styles.page}>
      <GameSession />
      <MusicToggle />
    </div>
  );
}
