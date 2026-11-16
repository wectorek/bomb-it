"use client";

import styles from "./TouchControls.module.css";

const MOVE_KEYS = [
  { label: "Góra", className: styles.up, direction: { row: -1, col: 0 } },
  { label: "Lewo", className: styles.left, direction: { row: 0, col: -1 } },
  { label: "Dół", className: styles.down, direction: { row: 1, col: 0 } },
  { label: "Prawo", className: styles.right, direction: { row: 0, col: 1 } },
];

function HoldButton({ label, className, children, onPress, onRelease }) {
  function start(event) {
    event.preventDefault();
    onPress();
  }

  function stop(event) {
    event.preventDefault();
    onRelease?.();
  }

  return (
    <button
      type="button"
      className={className}
      aria-label={label}
      onPointerDown={start}
      onPointerUp={stop}
      onPointerCancel={stop}
      onPointerLeave={stop}
      onContextMenu={(event) => event.preventDefault()}
    >
      {children}
    </button>
  );
}

export default function TouchControls({ onDirection, onBomb }) {
  return (
    <div className={styles.pad}>
      <div className={styles.dpad} aria-label="Ruch">
        {MOVE_KEYS.map((item) => (
          <HoldButton
            key={item.label}
            label={item.label}
            className={`${styles.key} ${item.className}`}
            onPress={() => onDirection?.(item.direction)}
            onRelease={() => onDirection?.(null)}
          >
            <span aria-hidden="true" className={styles.arrow} />
          </HoldButton>
        ))}
      </div>
      <HoldButton label="Bomba" className={styles.bomb} onPress={() => onBomb?.()}>
        Bomba
      </HoldButton>
    </div>
  );
}
