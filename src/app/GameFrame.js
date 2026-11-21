"use client";

import { useEffect, useState } from "react";
import GameSession from "./GameSession";
import Intro from "./Intro";
import MusicToggle from "./MusicToggle";
import TouchControls from "./TouchControls";
import { usePlayerControls } from "./usePlayerControls";
import { playSfx } from "./sfx";
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

  useEffect(() => {
    function onClick(event) {
      const button = event.target.closest?.("button");
      if (!button || button.disabled) {
        return;
      }
      const cls = button.className || "";
      if (cls.includes("TouchControls") || cls.includes("Intro")) {
        return;
      }
      const label = button.textContent || "";
      if (label.includes("←") || label.includes("Menu główne") || label.includes("Wyjdź")) {
        playSfx("back");
      } else if (cls.includes("startButton")) {
        playSfx("start");
      } else if (cls.includes("choice") || cls.includes("swatch")) {
        playSfx("select");
      } else {
        playSfx("click");
      }
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  const [contrast, setContrast] = useState(false);
  const [contrastReady, setContrastReady] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setContrast(window.localStorage.getItem("bomb-it-contrast") === "high");
    setContrastReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    if (!contrastReady) {
      return;
    }
    document.documentElement.dataset.contrast = contrast ? "high" : "normal";
    window.localStorage.setItem("bomb-it-contrast", contrast ? "high" : "normal");
  }, [contrast, contrastReady]);

  const [introDone, setIntroDone] = useState(false);
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

  function exitToMenu() {
    if (window.confirm("Przerwać grę i wrócić do menu głównego?")) {
      room.disconnect();
    }
  }

  const inGame =
    room.connection === "live" &&
    room.snapshot != null &&
    room.snapshot.status !== "lobby";
  const self = (room.snapshot?.actors ?? []).find((a) => a.id === room.you);
  const controlsOn =
    inGame &&
    room.snapshot?.status === "playing" &&
    self?.alive !== false;

  usePlayerControls(controlsOn ? room : null);

  return (
    <>
      {introDone ? null : <Intro onPlay={() => setIntroDone(true)} />}
      {introDone ? (
        <GameSession
          room={room}
          zoneEnabled={false}
          themeId={themeId}
          onReplayIntro={() => setIntroDone(false)}
        />
      ) : null}
      {inGame ? null : (
        <button
          type="button"
          className={styles.themeSwitch}
          onClick={() => setUiTheme((t) => (t === "dark" ? "light" : "dark"))}
        >
          {uiTheme === "dark" ? "☀ Motyw jasny" : "☾ Motyw ciemny"}
        </button>
      )}
      <MusicToggle
        themeId={themeId}
        onThemeChange={setThemeId}
        showBoardThemes={inGame}
        fullscreen={fullscreen}
        onToggleFullscreen={toggleFullscreen}
        onExit={inGame ? exitToMenu : null}
        contrast={contrast}
        onToggleContrast={() => setContrast((value) => !value)}
      />
      {controlsOn ? (
        <TouchControls onDirection={room.setDirection} onBomb={room.pressBomb} />
      ) : null}
    </>
  );
}
