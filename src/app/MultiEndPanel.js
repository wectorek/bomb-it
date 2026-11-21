"use client";

import AdvancedSettings from "./AdvancedSettings";
import styles from "./EndScreen.module.css";

const COLOR_HEX = {
  blue: "#1e88e5",
  red: "#e53935",
  green: "#43a047",
  purple: "#8e24aa",
};

export default function MultiEndPanel({ multi, you }) {
  const { hostId, players, ready, isHost, fillBots, settings } = multi;
  const others = players.filter((player) => player.id !== hostId);
  const everyoneReady = others.every((player) => ready.includes(player.id));
  const meReady = ready.includes(you);

  return (
    <div className={styles.multi}>
      <p className={styles.sectionLabel}>Kolejna gra</p>
      <ul className={styles.multiList}>
        {players.map((player) => {
          const isPlayerHost = player.id === hostId;
          const agreed = isPlayerHost || ready.includes(player.id);
          return (
            <li key={player.id} className={styles.multiRow}>
              <span
                className={styles.swatch}
                style={{ backgroundColor: COLOR_HEX[player.color] ?? player.color }}
              />
              <span className={styles.multiName}>
                {player.name}
                {player.id === you ? " (Ty)" : ""}
                {isPlayerHost ? " · host" : ""}
              </span>
              <span>{agreed ? "✓ gotowy" : "czeka…"}</span>
              {isHost && !isPlayerHost ? (
                <button
                  type="button"
                  className={styles.multiSmall}
                  onClick={() => multi.onTransfer(player.id)}
                >
                  Przekaż hosta
                </button>
              ) : null}
            </li>
          );
        })}
      </ul>

      {isHost ? (
        <>
          <button
            type="button"
            className={styles.multiSmall}
            aria-pressed={fillBots}
            onClick={() => multi.onUpdate({ fillBots: !fillBots })}
          >
            {fillBots
              ? "Boty uzupełniają graczy: tak"
              : "Boty uzupełniają graczy: nie"}
          </button>
          {settings ? (
            <AdvancedSettings
              value={settings}
              onChange={(next) => multi.onUpdate({ settings: next })}
            />
          ) : null}
          <button
            type="button"
            className={styles.restart}
            disabled={!everyoneReady}
            onClick={multi.onStart}
          >
            Start gry
          </button>
          {everyoneReady ? null : (
            <p className={styles.hint}>Czekam na zgodę pozostałych graczy.</p>
          )}
        </>
      ) : (
        <>
          <button
            type="button"
            className={styles.restart}
            onClick={() => multi.onReady(!meReady)}
          >
            {meReady ? "Cofnij zgodę" : "Zagraj ponownie"}
          </button>
          <p className={styles.hint}>
            {meReady
              ? "Czekam, aż host rozpocznie grę."
              : "Zgódź się na kolejną rundę, a host ją rozpocznie."}
          </p>
        </>
      )}
    </div>
  );
}
