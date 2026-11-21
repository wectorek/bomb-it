"use client";

import { useEffect, useState } from "react";
import GameSession from "./GameSession";
import MusicToggle from "./MusicToggle";
import TouchControls from "./TouchControls";
import { usePlayerControls } from "./usePlayerControls";
import { useRoom } from "./useRoom";
import styles from "./page.module.css";

const THEME_KEY = "bomb-it-theme";

function initialTheme() {
  if (typeof window === "undefined") {
    return "light";
  }
  const saved = window.localStorage.getItem(THEME_KEY);
  if (saved === "light" || saved === "dark") {
    return saved;
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export default function GameFrame() {
  const room = useRoom();
  const [uiTheme, setUiTheme] = useState("light");
  const [themeId, setThemeId] = useState("bee");
  const [themeReady, setThemeReady] = useState(false);
  usePlayerControls(room);

  useEffect(() => {
    // Motyw zależy od localStorage, więc da się go znać dopiero po hydracji.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUiTheme(initialTheme());
    setThemeReady(true);
  }, []);

  useEffect(() => {
    if (!themeReady) {
      return;
    }
    document.documentElement.dataset.theme = uiTheme;
    window.localStorage.setItem(THEME_KEY, uiTheme);
  }, [uiTheme, themeReady]);

  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  function toggleFullscreen(event) {
    event.currentTarget.blur();
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else {
      document.documentElement.requestFullscreen?.().catch(() => {});
    }
  }

  const inGame =
    room.connection === "live" &&
    room.snapshot != null &&
    room.snapshot.status !== "lobby";

  return (
    <>
      <GameSession room={room} zoneEnabled={false} themeId={themeId} />
      {inGame ? null : (
        <button
          type="button"
          className={styles.themeSwitch}
          onClick={() => setUiTheme((t) => (t === "dark" ? "light" : "dark"))}
        >
          {uiTheme === "dark" ? "☀ Motyw jasny" : "☾ Motyw ciemny"}
        </button>
      )}
      <button
        type="button"
        className={`${styles.fullscreenButton} ${inGame ? "" : styles.menuFullscreen}`}
        onClick={toggleFullscreen}
        onKeyDown={(event) => event.preventDefault()}
      >
        {fullscreen ? "Zamknij pełny ekran" : "Pełny ekran"}
      </button>
      <MusicToggle
        themeId={themeId}
        onThemeChange={setThemeId}
        showBoardThemes={inGame}
      />
      {inGame ? (
        <TouchControls onDirection={room.setDirection} onBomb={room.pressBomb} />
      ) : null}
    </>
  );
}
