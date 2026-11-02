import {
  BOMB_RANGE,
  BONUS_DURATION_MS,
  BONUS_LIFETIME_MS,
  BONUSES_DESTROYED_BY_EXPLOSION,
  NEGATIVE_BONUS_CHANCE,
  RANGE_BONUS,
} from "./config";

export const POSITIVE_BONUS_TYPES = ["immunity", "speed", "range", "grenade"];
export const NEGATIVE_BONUS_TYPES = ["slow", "fragile"];

const EFFECT_ORDER = [
  "immunity",
  "speed",
  "range",
  "grenade",
  "slow",
  "fragile",
];

export const BONUS_EMOJI = {
  immunity: "🛡️",
  speed: "⚡",
  range: "🔥",
  grenade: "💣",
  slow: "🐌",
  fragile: "💔",
};

export const BONUS_TOAST = {
  immunity: "Nietykalność!",
  speed: "Szybkość!",
  range: "Zasięg!",
  grenade: "Granat!",
  slow: "Spowolnienie!",
  fragile: "Kruchość!",
};

// Negatywny jako kategoria ma być rzadszy niż pozytywny.
if (!(NEGATIVE_BONUS_CHANCE < 1 - NEGATIVE_BONUS_CHANCE)) {
  throw new Error(
    "NEGATIVE_BONUS_CHANCE musi być mniejsze niż szansa bonusu pozytywnego.",
  );
}

function sameCell(a, b) {
  return a.row === b.row && a.col === b.col;
}

export function isNegativeBonus(type) {
  return NEGATIVE_BONUS_TYPES.includes(type);
}

// Czysta funkcja: ta sama sekwencja `random()` zawsze daje ten sam typ.
export function rollBonusType(random) {
  if (random() < NEGATIVE_BONUS_CHANCE) {
    return random() < 0.5 ? "slow" : "fragile";
  }

  const index = Math.floor(random() * POSITIVE_BONUS_TYPES.length);
  return POSITIVE_BONUS_TYPES[
    Math.min(index, POSITIVE_BONUS_TYPES.length - 1)
  ];
}

export function bonusToastText(type, actorName) {
  const label = BONUS_TOAST[type] ?? "Bonus!";
  if (!actorName) {
    return label;
  }
  return `${actorName}: ${label}`;
}

// Ściany `bonus` zamienia w pickupy. Id nadaje wołający.
export function spawnBonusesFromWalls(
  destroyedWalls,
  random = Math.random,
  now = Date.now(),
) {
  const spawned = [];

  for (const wall of destroyedWalls) {
    if (wall?.type !== "bonus") {
      continue;
    }

    const bonus = {
      row: wall.row,
      col: wall.col,
      type: rollBonusType(random),
    };

    if (BONUS_LIFETIME_MS != null) {
      bonus.expiresAt = now + BONUS_LIFETIME_MS;
    }

    spawned.push(bonus);
  }

  return spawned;
}

export function survivingBonuses(bonuses, cells) {
  if (!BONUSES_DESTROYED_BY_EXPLOSION || bonuses.length === 0) {
    return bonuses;
  }

  const next = bonuses.filter(
    (bonus) => !cells.some((cell) => sameCell(bonus, cell)),
  );
  return next.length === bonuses.length ? bonuses : next;
}

export function pruneBonuses(bonuses, now) {
  if (BONUS_LIFETIME_MS == null || bonuses.length === 0) {
    return bonuses;
  }

  const next = bonuses.filter(
    (bonus) => bonus.expiresAt == null || bonus.expiresAt > now,
  );
  return next.length === bonuses.length ? bonuses : next;
}

function withCollectedStat(actor, type) {
  const stats = actor.stats ?? {
    wallsDestroyed: 0,
    bonusesCollected: { positive: 0, negative: 0 },
    kills: 0,
  };
  const bucket = isNegativeBonus(type) ? "negative" : "positive";
  const bonusesCollected = {
    positive: stats.bonusesCollected?.positive ?? 0,
    negative: stats.bonusesCollected?.negative ?? 0,
  };
  bonusesCollected[bucket] += 1;

  return {
    ...actor,
    stats: {
      wallsDestroyed: stats.wallsDestroyed ?? 0,
      bonusesCollected,
      kills: stats.kills ?? 0,
    },
  };
}

// Ten sam efekt odświeża czas. Granat to flaga bez czasu i bez kumulacji.
export function applyBonus(actor, type, now) {
  const effects = actor.effects ?? {};

  if (type === "grenade") {
    if (effects.grenade) {
      return actor;
    }
    return { ...actor, effects: { ...effects, grenade: {} } };
  }

  return {
    ...actor,
    effects: {
      ...effects,
      [type]: { until: now + BONUS_DURATION_MS },
    },
  };
}

export function expireEffects(actor, now) {
  const effects = actor.effects ?? {};
  let changed = false;
  const nextEffects = {};

  for (const [id, effect] of Object.entries(effects)) {
    if (effect && typeof effect.until === "number" && effect.until <= now) {
      changed = true;
      continue;
    }
    nextEffects[id] = effect;
  }

  if (!changed) {
    return actor;
  }

  return { ...actor, effects: nextEffects };
}

export function expireActorEffects(actors, now) {
  let changed = false;
  const next = actors.map((actor) => {
    const updated = expireEffects(actor, now);
    if (updated !== actor) {
      changed = true;
    }
    return updated;
  });
  return changed ? next : actors;
}

export function hasEffect(actor, id, now) {
  const effect = actor?.effects?.[id];
  if (!effect) {
    return false;
  }
  if (typeof effect.until === "number") {
    return effect.until > now;
  }
  return true;
}

export function activeEffectIds(actor, now) {
  return EFFECT_ORDER.filter((id) => hasEffect(actor, id, now));
}

export function effectSecondsLeft(actor, id, now) {
  const until = actor?.effects?.[id]?.until;
  if (typeof until !== "number") {
    return null;
  }
  return Math.max(0, Math.ceil((until - now) / 1000));
}

// Immunity wygrywa z fragile. Martwego aktora nie ruszamy w resolveExplosionOutcome.
export function damageFor(actor, now) {
  if (hasEffect(actor, "immunity", now)) {
    return 0;
  }
  if (hasEffect(actor, "fragile", now)) {
    return 2;
  }
  return 1;
}

export function rangeFor(actor, now) {
  if (hasEffect(actor, "range", now)) {
    return BOMB_RANGE + RANGE_BONUS;
  }
  return BOMB_RANGE;
}

// Zbiera każdy bonus, na którego polu stoi żywy aktor. Pierwszy w tablicy wygrywa remis.
export function collectBonuses(actors, bonuses, now) {
  if (!bonuses.length) {
    return { actors, bonuses, collected: [] };
  }

  const removed = new Set();
  const collected = [];
  let nextActors = actors;

  for (const actor of actors) {
    if (!actor.alive || !actor.position) {
      continue;
    }

    const here = bonuses.filter(
      (bonus) =>
        !removed.has(bonus.id) &&
        bonus.row === actor.position.row &&
        bonus.col === actor.position.col,
    );
    if (here.length === 0) {
      continue;
    }

    let updated = actor;
    for (const bonus of here) {
      removed.add(bonus.id);
      updated = applyBonus(withCollectedStat(updated, bonus.type), bonus.type, now);
      collected.push({
        id: bonus.id,
        type: bonus.type,
        actorId: actor.id,
        actorName: actor.name,
      });
    }

    nextActors = nextActors.map((item) =>
      item.id === actor.id ? updated : item,
    );
  }

  if (collected.length === 0) {
    return { actors, bonuses, collected };
  }

  return {
    actors: nextActors,
    bonuses: bonuses.filter((bonus) => !removed.has(bonus.id)),
    collected,
  };
}
