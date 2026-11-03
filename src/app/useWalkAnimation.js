"use client";

import { useEffect, useRef, useState } from "react";
import { moveIntervalFor } from "./actors";
import {
  playerHitSrc,
  playerIdleSrc,
  playerWalkSrc,
  preloadPlayerSprites,
} from "./assets";

function sameCell(a, b) {
  return a?.row === b?.row && a?.col === b?.col;
}

export function useWalkAnimation(actor) {
  const facing = actor?.facing ?? "down";
  const color = actor?.color ?? "blue";
  const [spriteSrc, setSpriteSrc] = useState(() => playerIdleSrc(facing, color));
  const [bobCycleKey, setBobCycleKey] = useState(0);
  const [hitFlash, setHitFlash] = useState(false);

  const footRef = useRef(1);
  const currentStrideFootRef = useRef(1);
  const walkPhaseRef = useRef("idle");
  const prevPositionRef = useRef(actor?.position ?? null);
  const prevLivesRef = useRef(actor?.lives);
  const prevFacingRef = useRef(facing);
  const skipInitialStepRef = useRef(true);
  const hitActiveRef = useRef(false);
  const strideTimerRef = useRef(null);
  const footResetTimerRef = useRef(null);
  const hitTimerRef = useRef(null);

  useEffect(() => {
    preloadPlayerSprites();
  }, []);

  useEffect(() => {
    return () => {
      if (strideTimerRef.current) {
        clearTimeout(strideTimerRef.current);
      }
      if (footResetTimerRef.current) {
        clearTimeout(footResetTimerRef.current);
      }
      if (hitTimerRef.current) {
        clearTimeout(hitTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (actor == null) {
      return;
    }
    if (actor.lives < prevLivesRef.current) {
      hitActiveRef.current = true;
      setHitFlash(true);
      if (hitTimerRef.current) {
        clearTimeout(hitTimerRef.current);
      }
      const restoreFacing = actor.facing;
      hitTimerRef.current = setTimeout(() => {
        hitActiveRef.current = false;
        setHitFlash(false);
        if (walkPhaseRef.current === "stride") {
          setSpriteSrc(
            playerWalkSrc(restoreFacing, currentStrideFootRef.current, color),
          );
        } else {
        setSpriteSrc(playerIdleSrc(restoreFacing, color));
        }
      }, 300);
    }
    prevLivesRef.current = actor.lives;
  }, [actor]);

  useEffect(() => {
    if (actor?.position == null) {
      return;
    }

    const now = Date.now();
    const interval = moveIntervalFor(actor, now);
    const pos = actor.position;
    const cellChanged = !sameCell(prevPositionRef.current, pos);

    if (cellChanged) {
      if (skipInitialStepRef.current) {
        skipInitialStepRef.current = false;
        prevPositionRef.current = pos;
        prevFacingRef.current = actor.facing;
        setSpriteSrc(playerIdleSrc(actor.facing, color));
        return;
      }

      prevPositionRef.current = pos;
      prevFacingRef.current = actor.facing;

      if (strideTimerRef.current) {
        clearTimeout(strideTimerRef.current);
      }
      if (footResetTimerRef.current) {
        clearTimeout(footResetTimerRef.current);
      }

      const strideFoot = footRef.current;
      const moveFacing = actor.facing;
      currentStrideFootRef.current = strideFoot;
      footRef.current = strideFoot === 1 ? 2 : 1;

      walkPhaseRef.current = "stride";
      setBobCycleKey((key) => key + 1);

      if (!hitActiveRef.current) {
        setSpriteSrc(playerWalkSrc(moveFacing, strideFoot, color));
      }

      const half = interval / 2;
      strideTimerRef.current = setTimeout(() => {
        walkPhaseRef.current = "idle";
        if (!hitActiveRef.current) {
          setSpriteSrc(playerIdleSrc(moveFacing, color));
        }
      }, half);

      // Krok pada co interwał, a tick gry ma 50 ms spóźnienia. Reset stopy
      // dopiero po postoju, inaczej ciągły marsz zawsze zostaje na nodze 1.
      footResetTimerRef.current = setTimeout(() => {
        footRef.current = 1;
      }, interval + 80);
      return;
    }

    if (prevFacingRef.current !== actor.facing) {
      prevFacingRef.current = actor.facing;
      if (walkPhaseRef.current === "idle" && !hitActiveRef.current) {
        setSpriteSrc(playerIdleSrc(actor.facing, color));
      }
    }
  }, [actor]);

  const displaySrc = hitFlash ? playerHitSrc(color) : spriteSrc;

  return { displaySrc, bobCycleKey };
}
