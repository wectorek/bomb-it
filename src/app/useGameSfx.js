"use client";

import { useEffect, useRef } from "react";
import { playSfx, startBattleMusic, stopBattleMusic } from "./sfx";

const BAD_TOASTS = ["Spowolnienie", "Kruchość", "Zatrzymanie"];

export function useGameSfx(snapshot, you, serverNow) {
  const seen = useRef(null);
  const zoneRings = useRef(new Set());

  useEffect(() => stopBattleMusic, []);

  useEffect(() => {
    const bombs = new Set((snapshot.bombs ?? []).map((b) => b.id));
    const blasts = new Set((snapshot.explosions ?? []).map((b) => b.id));
    const toasts = new Set((snapshot.toasts ?? []).map((t) => t.id));
    const lives = new Map((snapshot.actors ?? []).map((a) => [a.id, a.lives]));
    if (snapshot.finale && snapshot.status === "playing") {
      startBattleMusic();
    } else {
      stopBattleMusic();
    }

    const prev = seen.current;
    const now = serverNow ?? Date.now();
    const until = snapshot.countdownUntil;
    let countdownDigit = null;
    if (until != null && now < until) {
      const left = Math.ceil((until - now) / 1000);
      if (left > 0 && left <= 3) {
        countdownDigit = left;
      }
    }
    const countdownKey =
      until != null && now >= until - 50 && now < until + 200 ? "go" : countdownDigit;

    seen.current = {
      bombs,
      blasts,
      toasts,
      lives,
      status: snapshot.status,
      finale: Boolean(snapshot.finale),
      drops: new Set((snapshot.drops ?? []).map((d) => d.id)),
      countdownKey,
      zoneRadius: snapshot.zone?.radius,
    };
    if (!prev) {
      return;
    }

    if (countdownKey === "go" && prev.countdownKey !== "go") {
      playSfx("go");
    } else if (
      typeof countdownKey === "number" &&
      countdownKey !== prev.countdownKey
    ) {
      playSfx("tick");
    }

    if (snapshot.zone?.zoneWarn) {
      const ring = snapshot.zone.radius;
      if (ring != null && !zoneRings.current.has(ring)) {
        zoneRings.current.add(ring);
        playSfx("zone");
      }
    }

    if (snapshot.finale && !prev.finale) {
      playSfx("finale");
    }
    if ([...prev.drops].some((id) => !(snapshot.drops ?? []).some((d) => d.id === id))) {
      playSfx("splat");
    }
    for (const bomb of snapshot.bombs ?? []) {
      if (!prev.bombs.has(bomb.id)) {
        playSfx(bomb.kind === "grenade" ? "throw" : "bomb");
      }
    }
    if ([...blasts].some((id) => !prev.blasts.has(id))) {
      playSfx("boom");
    }
    for (const toast of snapshot.toasts ?? []) {
      if (!prev.toasts.has(toast.id)) {
        playSfx(BAD_TOASTS.some((t) => toast.text?.includes(t)) ? "bad" : "bonus");
      }
    }
    for (const [id, count] of lives) {
      const before = prev.lives.get(id);
      if (before != null && count < before) {
        playSfx(id === you ? "hurt" : "hit");
      }
    }
    if (prev.status === "playing" && snapshot.status !== "playing") {
      playSfx(snapshot.status === "win" ? "win" : "lose");
    }
  }, [snapshot, you, serverNow]);
}