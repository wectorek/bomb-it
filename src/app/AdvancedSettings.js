"use client";

import styles from "./page.module.css";

export const DEFAULT_ADVANCED = {
  zone: false,
  playerSpeed: 1,
  hedgeRegrowSec: 8,
  rangeBonus: 2,
  speedMultiplier: 0.6,
  slowMultiplier: 1.6,
  durationsSec: {
    immunity: 10,
    speed: 10,
    range: 10,
    slow: 10,
    fragile: 10,
    freeze: 3,
  },
  enabledBonuses: {
    immunity: true,
    speed: true,
    range: true,
    grenade: true,
    slow: true,
    fragile: true,
    freeze: true,
  },
};

const BONUS_ROWS = [
  { id: "immunity", label: "Nietykalność", timed: true },
  { id: "speed", label: "Szybkość", timed: true },
  { id: "range", label: "Zasięg", timed: true },
  { id: "grenade", label: "Granat", timed: false },
  { id: "slow", label: "Spowolnienie", timed: true },
  { id: "fragile", label: "Kruchość", timed: true },
  { id: "freeze", label: "Zatrzymanie", timed: true },
];

const SPEEDS = [
  [0.75, "Wolna"],
  [1, "Normalna"],
  [1.4, "Szybka"],
  [1.8, "Bardzo szybka"],
];
const RANGES = [1, 2, 3, 4];
const SPEED_BOOSTS = [
  [0.8, "Lekka"],
  [0.6, "Normalna"],
  [0.45, "Mocna"],
];
const SLOW_BOOSTS = [
  [1.3, "Lekka"],
  [1.6, "Normalna"],
  [2.2, "Mocna"],
];

function Choices({ options, value, onChange }) {
  return (
    <div className={styles.choiceRow}>
      {options.map(([v, label]) => (
        <button
          key={v}
          type="button"
          className={`${styles.choice} ${styles.choiceSmall} ${v === value ? styles.choiceOn : ""}`}
          aria-pressed={v === value}
          onClick={() => onChange(v)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export default function AdvancedSettings({ value, onChange }) {
  const set = (patch) => onChange({ ...value, ...patch });

  return (
    <details className={styles.advanced}>
      <summary className={styles.advancedSummary}>Ustawienia zaawansowane</summary>
      <div className={styles.advancedBody}>
        <label className={styles.checkRow}>
          <input
            type="checkbox"
            checked={value.zone}
            onChange={(event) => set({ zone: event.target.checked })}
          />
          Strefa (kurcząca się plansza)
        </label>

        <p className={styles.sectionLabel}>Szybkość graczy</p>
        <Choices
          options={SPEEDS}
          value={value.playerSpeed}
          onChange={(playerSpeed) => set({ playerSpeed })}
        />

        <label className={styles.rangeRow}>
          <span>Odrastanie żywopłotu: {value.hedgeRegrowSec} s</span>
          <input
            type="range"
            min="2"
            max="30"
            value={value.hedgeRegrowSec}
            onChange={(event) =>
              set({ hedgeRegrowSec: Number(event.target.value) })
            }
          />
        </label>

        <p className={styles.sectionLabel}>Boostery</p>
        {BONUS_ROWS.map((row) => (
          <div key={row.id} className={styles.bonusRow}>
            <label className={styles.checkRow}>
              <input
                type="checkbox"
                checked={value.enabledBonuses[row.id]}
                onChange={(event) =>
                  set({
                    enabledBonuses: {
                      ...value.enabledBonuses,
                      [row.id]: event.target.checked,
                    },
                  })
                }
              />
              {row.label}
            </label>
            {row.timed ? (
              <label className={styles.secondsField}>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={value.durationsSec[row.id]}
                  onChange={(event) =>
                    set({
                      durationsSec: {
                        ...value.durationsSec,
                        [row.id]: Math.min(
                          60,
                          Math.max(1, Number(event.target.value) || 1),
                        ),
                      },
                    })
                  }
                />{" "}
                s
              </label>
            ) : null}
          </div>
        ))}

        <p className={styles.sectionLabel}>Dodatkowy zasięg bomby (Zasięg)</p>
        <Choices
          options={RANGES.map((n) => [n, `+${n}`])}
          value={value.rangeBonus}
          onChange={(rangeBonus) => set({ rangeBonus })}
        />
        <p className={styles.sectionLabel}>Siła przyspieszenia (Szybkość)</p>
        <Choices
          options={SPEED_BOOSTS}
          value={value.speedMultiplier}
          onChange={(speedMultiplier) => set({ speedMultiplier })}
        />
        <p className={styles.sectionLabel}>Siła spowolnienia (Spowolnienie)</p>
        <Choices
          options={SLOW_BOOSTS}
          value={value.slowMultiplier}
          onChange={(slowMultiplier) => set({ slowMultiplier })}
        />

        <button
          type="button"
          className={styles.menuButtonSecondary}
          onClick={() => onChange(DEFAULT_ADVANCED)}
        >
          Przywróć domyślne
        </button>
      </div>
    </details>
  );
}
