"use client";

import { useEffect } from "react";
import { ASSETS } from "./assets";
import { MUSIC_ARTIST, MUSIC_TITLE } from "./config";
import styles from "./MusicToggle.module.css";
import { useBackgroundMusic } from "./useBackgroundMusic";

const trackLabel = `♪ ${MUSIC_TITLE} – ${MUSIC_ARTIST}`;

export default function MusicToggle() {
  const { muted, playing, toggleMute } = useBackgroundMusic();

  useEffect(() => {
    function onKeyDown(event) {
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

  function handleClick(event) {
    toggleMute();
    event.currentTarget.blur();
  }

  function handleKeyDown(event) {
    if (event.key === " " || event.key === "Spacebar") {
      event.preventDefault();
    }
  }

  const soundLabel = muted
    ? "Włącz muzykę w tle"
    : "Wyłącz muzykę w tle";

  return (
    <div className={styles.root}>
      {playing ? (
        <span className={styles.nowPlaying} title={trackLabel}>
          {trackLabel}
        </span>
      ) : null}
      <button
        type="button"
        className={styles.button}
        aria-label={soundLabel}
        aria-pressed={!muted}
        title={trackLabel}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
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
