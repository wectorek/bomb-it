export function formatDuration(ms) {
  const totalSeconds = Math.max(0, Math.floor((Number(ms) || 0) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function resultHeading(status) {
  if (status === "win") {
    return "Wygrana!";
  }
  if (status === "lose") {
    return "Przegrana!";
  }
  return "Remis!";
}

function plural(count, one, few, many) {
  const value = Math.abs(count);
  const lastTwo = value % 100;
  const last = value % 10;
  if (value === 1) {
    return one;
  }
  if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) {
    return few;
  }
  return many;
}

function polishList(names) {
  if (names.length <= 1) {
    return names[0] ?? "";
  }
  if (names.length === 2) {
    return `${names[0]} i ${names[1]}`;
  }
  return `${names.slice(0, -1).join(", ")} i ${names[names.length - 1]}`;
}

export function survivorSummary(actors) {
  const alive = actors.filter((actor) => actor.alive);
  if (alive.length === 0) {
    return "Nikt nie przetrwał.";
  }

  const playerAlive = alive.some((actor) => actor.kind === "player");
  const bots = alive.filter((actor) => actor.kind === "bot");
  if (playerAlive && bots.length === 0) {
    return "Przetrwałeś.";
  }
  if (!playerAlive && bots.length === 1) {
    return `Przetrwał bot: ${bots[0].name}.`;
  }
  if (!playerAlive && bots.length > 1) {
    return `Przetrwały boty: ${polishList(bots.map((actor) => actor.name))}.`;
  }
  return `Przetrwali: ${polishList(alive.map((actor) => actor.name))}.`;
}

// Najwcześniej polegli pierwsi. Żywi i aktorzy bez diedAt nie wchodzą do listy.
export function eliminatedActors(actors) {
  return actors
    .filter((actor) => !actor.alive && actor.diedAt != null)
    .sort((left, right) => left.diedAt - right.diedAt);
}

export function bonusSummary(actor) {
  const bonuses = actor?.stats?.bonusesCollected ?? {};
  const positive = bonuses.positive ?? 0;
  const negative = bonuses.negative ?? 0;
  const positiveLabel = plural(
    positive,
    "pozytywny",
    "pozytywne",
    "pozytywnych",
  );
  const negativeLabel = plural(
    negative,
    "negatywny",
    "negatywne",
    "negatywnych",
  );
  return `${positive} ${positiveLabel}, ${negative} ${negativeLabel}`;
}

export function statValue(actor, key) {
  if (key === "lives") {
    return actor?.lives ?? 0;
  }
  if (key === "positive" || key === "negative") {
    return actor?.stats?.bonusesCollected?.[key] ?? 0;
  }
  return actor?.stats?.[key] ?? 0;
}
