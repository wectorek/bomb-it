"use client";

import { useEffect, useRef, useState } from "react";
import { THEMES } from "./assets";
import styles from "./MusicToggle.module.css";
import { useBackgroundMusic } from "./useBackgroundMusic";

function isSpaceKey(event) {
  return event.key === " " || event.key === "Spacebar" || event.code === "Space";
}

export default function MusicToggle({
  zoneEnabled = false,
  onZoneChange,
  themeId = "bee",
  onThemeChange,
}) {
  const { muted, playing, track, tracks, refresh, toggleMute, selectTrack } =
    useBackgroundMusic();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const trackLabel = track
    ? track.artist
      ? `♪ ${track.title} – ${track.artist}`
      : `♪ ${track.title}`
    : "Muzyka";

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key !== "m" && event.key !== "M") {
        return;
      }
      if (event.repeat) {
        return;
      }
      event.preventDefault();
      toggleMute();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggleMute]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function onPointerDown(event) {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  function keepSpaceForBombs(event) {
    if (isSpaceKey(event)) {
      event.preventDefault();
    }
  }

  return (
    <div className={styles.root} ref={rootRef}>
      {playing ? (
        <span className={styles.nowPlaying} title={trackLabel}>
          {trackLabel}
        </span>
      ) : null}
      {open ? (
        <div className={styles.menu} role="menu" aria-label="Opcje">
          <button
            type="button"
            className={styles.menuItem}
            role="menuitemcheckbox"
            aria-checked={zoneEnabled}
            onClick={() => onZoneChange?.(!zoneEnabled)}
            onKeyDown={keepSpaceForBombs}
          >
            {zoneEnabled ? "Wyłącz strefę" : "Włącz strefę"}
          </button>
          {THEMES.map((theme) => (
            <button
              key={theme.id}
              type="button"
              className={styles.menuItem}
              role="menuitemradio"
              aria-checked={theme.id === themeId}
              onClick={() => onThemeChange?.(theme.id)}
              onKeyDown={keepSpaceForBombs}
            >
              <span aria-hidden="true">▣</span>
              <span>{theme.name}</span>
            </button>
          ))}
          <button
            type="button"
            className={styles.menuItem}
            role="menuitemcheckbox"
            aria-checked={muted}
            onClick={() => {
              toggleMute();
            }}
            onKeyDown={keepSpaceForBombs}
          >
            {muted ? "Włącz dźwięk" : "Wycisz"}
          </button>
          {tracks.length === 0 ? (
            <p className={styles.empty}>
              Wrzuć plik mp3 do folderu public/audio.
            </p>
          ) : null}
          {tracks.map((item) => (
            <button
              key={item.id}
              type="button"
              className={styles.menuItem}
              role="menuitemradio"
              aria-checked={item.id === track?.id}
              onClick={() => {
                selectTrack(item);
                setOpen(false);
              }}
              onKeyDown={keepSpaceForBombs}
            >
              <span aria-hidden="true">♪</span>
              <span>
                {item.title}
                {item.artist ? (
                  <span className={styles.artist}>{item.artist}</span>
                ) : null}
              </span>
            </button>
          ))}
        </div>
      ) : null}
      <button
        type="button"
        className={styles.button}
        aria-label="Opcje: muzyka i strefa"
        aria-expanded={open}
        aria-haspopup="menu"
        title={trackLabel}
        onClick={(event) => {
          setOpen((current) => {
            if (!current) {
              refresh();
            }
            return !current;
          });
          event.currentTarget.blur();
        }}
        onKeyDown={keepSpaceForBombs}
      >
        <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.61l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.2 7.2 0 0 0-1.63-.94l-.36-2.54a.5.5 0 0 0-.5-.42h-3.84a.5.5 0 0 0-.49.42l-.36 2.54c-.59.22-1.13.53-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.74 8.87a.5.5 0 0 0 .12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.5.5 0 0 0-.12.61l1.92 3.32c.13.22.39.31.61.22l2.39-.96c.5.41 1.04.72 1.63.94l.36 2.54c.05.24.26.42.49.42h3.84c.24 0 .44-.18.5-.42l.36-2.54c.59-.22 1.13-.53 1.63-.94l2.39.96c.22.08.47 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.61l-2.03-1.58zM12 15.6A3.6 3.6 0 1 1 12 8.4a3.6 3.6 0 0 1 0 7.2z"
          />
        </svg>
      </button>
    </div>
  );
}
