"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MUSIC_VOLUME } from "./config";

export function useBackgroundMusic() {
  const audioRef = useRef(null);
  const tracksRef = useRef([]);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [tracks, setTracks] = useState([]);
  const [trackId, setTrackId] = useState(null);

  const track = tracks.find((item) => item.id === trackId) ?? tracks[0] ?? null;
  tracksRef.current = tracks;

  useEffect(() => {
    const audio = new Audio();
    audio.loop = true;
    audio.volume = MUSIC_VOLUME;
    audio.preload = "none";
    audioRef.current = audio;

    function onError() {
      setPlaying(false);
    }

    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("error", onError);
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, []);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/music", { cache: "no-store" });
      if (!response.ok) {
        return;
      }
      const next = await response.json();
      if (!Array.isArray(next)) {
        return;
      }
      setTracks(next);
      setTrackId((current) => {
        if (current && next.some((item) => item.id === current)) {
          return current;
        }
        return next[0]?.id ?? null;
      });
    } catch {
      setTracks([]);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const playTrack = useCallback((nextTrack) => {
    const audio = audioRef.current;
    const chosen =
      nextTrack ??
      tracksRef.current.find((item) => item.id === trackId) ??
      tracksRef.current[0];
    if (!audio || !chosen) {
      return;
    }

    if (!audio.src.endsWith(chosen.src)) {
      audio.src = chosen.src;
    }
    setTrackId(chosen.id);
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
  }, [trackId]);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || tracksRef.current.length === 0) {
      return;
    }

    if (muted || audio.paused) {
      playTrack();
      return;
    }

    audio.pause();
    setMuted(true);
    setPlaying(false);
  }, [muted, playTrack]);

  return {
    muted: muted || !playing,
    playing,
    track,
    tracks,
    refresh,
    toggleMute,
    selectTrack: playTrack,
  };
}
