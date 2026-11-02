"use client";

import { useEffect, useRef } from "react";
import { aliveActors, moveIntervalFor, updateActor } from "./actors";
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
    setToasts,
    throwGrenadeRef,
    wallsRef,
  ]);
}
