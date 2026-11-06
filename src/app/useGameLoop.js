"use client";

import { useEffect, useRef } from "react";
import { aliveActors, computeGameStatus, moveIntervalFor, updateActor } from "./actors";
import {
  bonusToastText,
  collectBonuses,
  expireActorEffects,
  hasEffect,
  pruneBonuses,
  rangeFor,
} from "./bonus";
import { nextBotTurn } from "./bot";
import { GAME_TICK_MS, TOAST_MS } from "./config";
import { facingFromDirection } from "./playerMovement";
import { useLatest } from "./useLatest";
import { applyZoneDamage, safeRadius } from "./zone";

// Tick planszy: wygasanie efektów, ruch botów i zebranie bonusów spod nóg.
export function useGameLoop({
  borders,
  wallsRef,
  actorsRef,
  setActors,
  bombsRef,
  gameStatusRef,
  placeBomb,
  throwGrenade,
  bonusesRef,
  setBonuses,
  setToasts,
  setGameStatus,
  zoneStartedAtRef,
  zoneSinceRef,
}) {
  const placeBombRef = useLatest(placeBomb);
  const throwGrenadeRef = useLatest(throwGrenade);
  const directionByIdRef = useRef({});

  useEffect(() => {
    const toastTimers = [];

    function showToasts(collected, now) {
      if (collected.length === 0) {
        return;
      }

      const additions = collected.map((item) => ({
        id: item.id,
        text: bonusToastText(item.type, item.actorName),
        until: now + TOAST_MS,
      }));
      setToasts((current) => [...current, ...additions]);

      for (const toast of additions) {
        const timer = setTimeout(() => {
          setToasts((current) =>
            current.filter((item) => item.id !== toast.id),
          );
        }, TOAST_MS);
        toastTimers.push(timer);
      }
    }

    const id = setInterval(() => {
      if (gameStatusRef.current !== "playing") {
        return;
      }

      const now = Date.now();
      let next = expireActorEffects(actorsRef.current, now);

      for (const actor of aliveActors(next)) {
        if (actor.kind !== "bot" || !actor.position || now < actor.nextMoveAt) {
          continue;
        }

        const turn = nextBotTurn(
          actor.position,
          directionByIdRef.current[actor.id] ?? null,
          wallsRef.current,
          borders,
          bombsRef.current,
          actor.id,
          rangeFor(actor, now),
          {
            hasGrenade: hasEffect(actor, "grenade", now),
            facing: actor.facing,
            others: aliveActors(next)
              .filter((other) => other.id !== actor.id && other.position)
              .map((other) => other.position),
          },
        );

        if (turn.grenade && turn.grenadeFacing) {
          const threw = throwGrenadeRef.current(
            actor.position,
            turn.grenadeFacing,
            actor.id,
          );
          if (threw) {
            const effects = { ...(actor.effects ?? {}) };
            delete effects.grenade;
            next = updateActor(next, actor.id, { effects });
          }
        } else if (turn.plant) {
          placeBombRef.current(turn.plant, actor.id);
        }

        directionByIdRef.current[actor.id] = turn.direction;
        const patch = {
          position: turn.position,
          nextMoveAt: now + moveIntervalFor(actor, now),
        };
        if (turn.direction) {
          patch.facing = facingFromDirection(turn.direction);
        }
        next = updateActor(next, actor.id, patch);
      }

      const pickup = collectBonuses(next, bonusesRef.current, now);
      next = pickup.actors;
      const bonuses = pruneBonuses(pickup.bonuses, now);

      if (bonuses !== bonusesRef.current) {
        bonusesRef.current = bonuses;
        setBonuses(bonuses);
      }

      showToasts(pickup.collected, now);

      if (zoneStartedAtRef.current != null) {
        const radius = safeRadius(now - zoneStartedAtRef.current);
        const zoned = applyZoneDamage(next, radius, now, zoneSinceRef.current);
        if (zoned !== next) {
          next = zoned;
          const status = computeGameStatus(next);
          if (status !== "playing") {
            gameStatusRef.current = status;
            setGameStatus(status);
          }
        }
      }

      if (next !== actorsRef.current) {
        actorsRef.current = next;
        setActors(next);
      }
    }, GAME_TICK_MS);

    return () => {
      clearInterval(id);
      for (const timer of toastTimers) {
        clearTimeout(timer);
      }
    };
  }, [
    actorsRef,
    bombsRef,
    bonusesRef,
    borders,
    gameStatusRef,
    placeBombRef,
    setActors,
    setBonuses,
    setGameStatus,
    setToasts,
    throwGrenadeRef,
    wallsRef,
    zoneSinceRef,
    zoneStartedAtRef,
  ]);
}
