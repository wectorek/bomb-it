"use client";

import { useState } from "react";
import styles from "./page.module.css";

const EMOJIS = ["😄", "😬", "👍", "💥", "🔥", "GG"];

export default function ChatBar({ chat = [], you, onSend, compact = false }) {
  const [text, setText] = useState("");

  function send(value) {
    const trimmed = value.trim().slice(0, 80);
    if (!trimmed || !onSend) {
      return;
    }
    onSend(trimmed);
    setText("");
  }

  return (
    <div className={compact ? styles.chatCompact : styles.chatPanel}>
      <ul className={styles.chatLog} aria-live="polite">
        {(chat ?? []).map((entry) => (
          <li key={entry.id}>
            <strong>
              {entry.name}
              {entry.from === you ? " (Ty)" : ""}
            </strong>
            : {entry.text}
          </li>
        ))}
      </ul>
      <div className={styles.chatEmojiRow}>
        {EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            className={styles.chatEmoji}
            onClick={() => send(emoji)}
          >
            {emoji}
          </button>
        ))}
      </div>
      <form
        className={styles.chatForm}
        onSubmit={(event) => {
          event.preventDefault();
          send(text);
        }}
      >
        <input
          className={styles.menuInput}
          value={text}
          maxLength={80}
          placeholder="Napisz wiadomość (max 80 znaków)"
          onChange={(event) => setText(event.target.value)}
        />
        <button type="submit" className={styles.menuButtonSecondary}>
          Wyślij
        </button>
      </form>
    </div>
  );
}