"use client";

import styles from "./AdvancedSettings.module.css";

export const DEFAULT_ADVANCED = {
  zone: false,
  finale: false,
  finaleAfterSec: 0,
  mode: "classic",
  botDifficulty: "normal",
  zoneCellSec: 20,
  hillPoints: 10,
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

const MODES = [
  ["classic", "Klasyczny"],
  ["teams", "2×2"],
  ["hill", "Wzgórze"],
];

const MODE_HELP = {
  classic: "Każdy gra sam. Odpadają kolejne życia, wygrywa ostatni żywy.",
  teams:
    "Cztery osoby, dwie drużyny. Miejsca 1 i 3 to drużyna A (złoty znacznik), miejsca 2 i 4 to drużyna B (morski znacznik). Wygrywa drużyna, która zostanie.",
  hill: "Środek planszy daje punkty. Kto pierwszy zbierze próg, wygrywa.",
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

function finaleSeconds(value) {
  if (typeof value.finaleAfterSec === "number") {
    return value.finaleAfterSec > 0 ? value.finaleAfterSec : 0;
  }
  return value.finale ? 120 : 0;
}

function modeOf(value) {
  return MODES.some(([id]) => id === value.mode) ? value.mode : "classic";
}

function Choices({ options, value, onChange }) {
  return (
    <div className={styles.choices}>
      {options.map(([v, label]) => (
        <button
          key={v}
          type="button"
          className={`${styles.choice} ${v === value ? styles.choiceOn : ""}`}
          aria-pressed={v === value}
          onClick={() => onChange(v)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function Card({ title, hint, children }) {
  return (
    <section className={styles.card}>
      <h3 className={styles.cardTitle}>{title}</h3>
      {hint ? <p className={styles.hint}>{hint}</p> : null}
      {children}
    </section>
  );
}

export default function AdvancedSettings({ value, onChange }) {
  const set = (patch) => onChange({ ...value, ...patch });
  const mode = modeOf(value);
  const finaleAfterSec = finaleSeconds(value);
  const finaleOn = finaleAfterSec > 0;
  const finaleMinutes = Math.max(1, Math.round(finaleAfterSec / 60) || 2);
  const modeLabel = MODES.find(([id]) => id === mode)?.[1] ?? "Klasyczny";

  return (
    <details className={styles.advanced}>
      <summary className={styles.summary}>
        Ustawienia zaawansowane
        <span className={styles.summaryMeta}>
          {modeLabel}
          {" · "}
          {finaleOn
            ? `rozwolnienie po ${finaleMinutes} min`
            : "bez rozwolnienia"}
          {value.zone ? ` · strefa co ${value.zoneCellSec ?? 20} s` : ""}
        </span>
      </summary>
      <div className={styles.body}>
        <Card
          title="1. Tryb gry"
          hint="Ustala, kto z kim gra i kiedy partia się kończy."
        >
          <Choices
            options={MODES}
            value={mode}
            onChange={(next) => set({ mode: next })}
          />
          <p className={`${styles.status} ${styles.statusOn}`}>{MODE_HELP[mode]}</p>
          {mode === "hill" ? (
            <label className={styles.range}>
              <span>Punkty na wzgórzu do zwycięstwa: {value.hillPoints ?? 10}</span>
              <input
                type="range"
                min="3"
                max="30"
                value={value.hillPoints ?? 10}
                onChange={(event) =>
                  set({ hillPoints: Number(event.target.value) })
                }
              />
            </label>
          ) : null}
        </Card>

        <Card
          title="2. Rozwolnienie"
          hint="Po odliczonym czasie od startu arena się czyści, spadają kawałki, a zabrudzone pola ranią. Można tego w ogóle nie włączać."
        >
          <Choices
            options={[
              [0, "Nie włączaj"],
              [1, "Włącz po czasie"],
            ]}
            value={finaleOn ? 1 : 0}
            onChange={(flag) => {
              if (flag === 0) {
                set({ finale: false, finaleAfterSec: 0 });
                return;
              }
              const seconds = finaleOn ? finaleAfterSec : 120;
              set({ finale: true, finaleAfterSec: seconds });
            }}
          />
          <p className={`${styles.status} ${finaleOn ? styles.statusOn : ""}`}>
            {finaleOn
              ? `Włączy się ${finaleMinutes} min po starcie rundy.`
              : "Wyłączone. Runda kończy się bez czyszczenia areny."}
          </p>
          {finaleOn ? (
            <label className={styles.range}>
              <span>Start po: {finaleMinutes} min</span>
              <input
                type="range"
                min="1"
                max="8"
                value={finaleMinutes}
                onChange={(event) => {
                  const seconds = Number(event.target.value) * 60;
                  set({ finale: true, finaleAfterSec: seconds });
                }}
              />
            </label>
          ) : null}
        </Card>

        <Card
          title="3. Strefa"
          hint="Burza zjada brzeg planszy. Środek zostaje bezpieczny coraz krócej."
        >
          <Choices
            options={[
              [0, "Wyłączona"],
              [1, "Włączona"],
            ]}
            value={value.zone ? 1 : 0}
            onChange={(flag) => set({ zone: flag === 1 })}
          />
          {value.zone ? (
            <label className={styles.range}>
              <span>Kolejny pierścień co: {value.zoneCellSec ?? 20} s</span>
              <input
                type="range"
                min="5"
                max="60"
                value={value.zoneCellSec ?? 20}
                onChange={(event) =>
                  set({ zoneCellSec: Number(event.target.value) })
                }
              />
            </label>
          ) : (
            <p className={styles.status}>Cała plansza zostaje dostępna.</p>
          )}
        </Card>

        <Card title="4. Boty i tempo" hint="Dotyczy botów oraz szybkości chodzenia.">
          <p className={styles.hint}>Trudność botów</p>
          <Choices
            options={[
              ["easy", "Łatwa"],
              ["normal", "Normalna"],
              ["hard", "Trudna"],
            ]}
            value={value.botDifficulty ?? "normal"}
            onChange={(botDifficulty) => set({ botDifficulty })}
          />
          <p className={styles.hint}>Szybkość graczy</p>
          <Choices
            options={SPEEDS}
            value={value.playerSpeed}
            onChange={(playerSpeed) => set({ playerSpeed })}
          />
        </Card>

        <Card title="5. Plansza" hint="Jak szybko wraca ścięty żywopłot.">
          <label className={styles.range}>
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
        </Card>

        <Card
          title="6. Bonusy"
          hint="Odznacz, żeby bonus nie wypadał. Przy czasowych ustawiasz, ile sekund działa."
        >
          {BONUS_ROWS.map((row) => (
            <div key={row.id} className={styles.bonus}>
              <label className={styles.check}>
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
                <label className={styles.seconds}>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    aria-label={`${row.label}: sekundy`}
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
                  />
                  s
                </label>
              ) : (
                <span className={styles.hint}>jednorazowy</span>
              )}
            </div>
          ))}
          <p className={styles.hint}>Dodatkowy zasięg bomby z bonusu Zasięg</p>
          <Choices
            options={RANGES.map((n) => [n, `+${n}`])}
            value={value.rangeBonus}
            onChange={(rangeBonus) => set({ rangeBonus })}
          />
          <p className={styles.hint}>Siła przyspieszenia</p>
          <Choices
            options={SPEED_BOOSTS}
            value={value.speedMultiplier}
            onChange={(speedMultiplier) => set({ speedMultiplier })}
          />
          <p className={styles.hint}>Siła spowolnienia</p>
          <Choices
            options={SLOW_BOOSTS}
            value={value.slowMultiplier}
            onChange={(slowMultiplier) => set({ slowMultiplier })}
          />
        </Card>

        <button
          type="button"
          className={styles.reset}
          onClick={() => onChange(DEFAULT_ADVANCED)}
        >
          Przywróć domyślne
        </button>
      </div>
    </details>
  );
}
