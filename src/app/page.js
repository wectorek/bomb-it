import styles from "./page.module.css";
import GameFrame from "./GameFrame";

export default function Home() {
  return (
    <div className={styles.page}>
      <GameFrame />
    </div>
  );
}
