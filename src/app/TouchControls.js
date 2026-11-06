"use client";

import { useEffect, useRef } from "react";
import styles from "./TouchControls.module.css";

const MOVE_KEYS = [
  { key: "ArrowUp", label: "Góra", className: styles.up },
  { key: "ArrowLeft", label: "Lewo", className: styles.left },
  { key: "ArrowDown", label: "Dół", className: styles.down },
  { key: "ArrowRight", label: "Prawo", className: styles.right },
];

function sendKey(key) {
  window.dispatchEvent(
    new KeyboardEvent("keydown", {
      key,
      code: key === " " ? "Space" : key,
      bubbles: true,
      cancelable: true,
    }),
  );
}

function HoldButton({ label, keyName, className, children }) {
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  function start(event) {
    event.preventDefault();
    sendKey(keyName);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    timerRef.current = setInterval(() => sendKey(keyName), 80);
  }

  function stop(event) {
    event.preventDefault();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
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

export default function TouchControls() {
  return (
    <div className={styles.pad}>
      <div className={styles.dpad} aria-label="Ruch">
        {MOVE_KEYS.map((item) => (
          <HoldButton
            key={item.key}
            label={item.label}
            keyName={item.key}
            className={`${styles.key} ${item.className}`}
          >
            <span aria-hidden="true" className={styles.arrow} />
          </HoldButton>
        ))}
      </div>
      <HoldButton label="Bomba" keyName=" " className={styles.bomb}>
        Bomba
      </HoldButton>
    </div>
  );
}
