import Image from "next/image";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <h1>Hello World</h1>
      <GameBoard />
    </div>
  );
}
const GameBoard = () => {
  const playerPosition = [0, 8];
  const size = 15;
  return (
    <table className={styles.table} style={{ "--board-size": size }}>
      <tbody>
        {Array.from({ length: size }, (_, row) => (
          <tr key={row}>
            {Array.from({ length: size }, (_, col) => (
              <td key={col}>
                {row === playerPosition[0] && col === playerPosition[1] ? (
                  <Player row={row} col={col} />
                ) : null
              }
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const Player = ({row, col}) => {
  return (
    <div className={styles.player}>
      {row},{col}
    </div>
  );
};
