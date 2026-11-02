const GAME_OVER_MESSAGE = {
  win: "Wygrałeś! Wszystkie boty pokonane.",
  lose: "Przegrałeś! Straciłeś wszystkie życia.",
  draw: "Remis! Wszyscy polegli.",
};

export function gameOverMessage(status) {
  return GAME_OVER_MESSAGE[status] ?? null;
}
