"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MUSIC_SRC, MUSIC_VOLUME } from "./config";

export function useBackgroundMusic() {
  const audioRef = useRef(null);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const audio = new Audio(MUSIC_SRC);
    audio.loop = true;
    audio.volume = MUSIC_VOLUME;
    audioRef.current = audio;

    function onError() {
      setPlaying(false);
      setMuted(true);
    }

    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("error", onError);
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, []);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    if (muted) {
      audio
        .play()
        .then(() => {
          setMuted(false);
          setPlaying(true);
        })
        .catch(() => {
          setMuted(true);
          setPlaying(false);
        });
    } else {
      audio.pause();
      setMuted(true);
      setPlaying(false);
    }
  }, [muted]);

  return { muted, playing, toggleMute };
}
