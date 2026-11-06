"use client";

import { useEffect, useRef, useState } from "react";
import { ASSETS, THEMES } from "./assets";
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
        <img
          className={styles.icon}
          src={muted ? ASSETS.ui.soundOff : ASSETS.ui.soundOn}
          alt=""
          draggable={false}
        />
      </button>
    </div>
  );
}
