"use client";

import { useEffect, useRef } from "react";

function directionFromKey(key) {
  switch (String(key).toLowerCase()) {
    case "w":
    case "arrowup":
      return { row: -1, col: 0 };
    case "s":
    case "arrowdown":
      return { row: 1, col: 0 };
    case "a":
    case "arrowleft":
      return { row: 0, col: -1 };
    case "d":
    case "arrowright":
      return { row: 0, col: 1 };
    default:
      return null;
  }
}

function isSpaceKey(event) {
  return event.code === "Space" || event.key === " ";
}

function isTyping(event) {
  const tag = event.target?.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || event.target?.isContentEditable;
}

export function usePlayerControls(room) {
  const pressBomb = room?.pressBomb;
  const setDirection = room?.setDirection;
  const actions = useRef({ pressBomb, setDirection });

  useEffect(() => {
    actions.current = { pressBomb, setDirection };
  }, [pressBomb, setDirection]);

  useEffect(() => {
    if (!room) {
      return undefined;
    }
    const held = [];

    function directionNow() {
      return held.length > 0 ? held[held.length - 1].direction : null;
    }

    function onKeyDown(event) {
      if (isTyping(event)) {
        return;
      }

      if (isSpaceKey(event)) {
        event.preventDefault();
        if (!event.repeat) {
          actions.current.pressBomb();
        }
        return;
      }

      const direction = directionFromKey(event.key);
      if (!direction) {
        return;
      }
      event.preventDefault();
      const key = event.key.toLowerCase();
      const without = held.filter((item) => item.key !== key);
      without.push({ key, direction });
      held.splice(0, held.length, ...without);
      actions.current.setDirection(direction);
    }

    function onKeyUp(event) {
      if (isTyping(event) || !directionFromKey(event.key)) {
        return;
      }
      const key = event.key.toLowerCase();
      const next = held.filter((item) => item.key !== key);
      held.splice(0, held.length, ...next);
      actions.current.setDirection(directionNow());
    }

    function onBlur() {
      held.splice(0, held.length);
      actions.current.setDirection(null);
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [room]);
}
