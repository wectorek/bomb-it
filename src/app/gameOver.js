const GAME_OVER_MESSAGE = {
  win: "Wygrałeś! Bot stracił wszystkie życia.",
  lose: "Przegrałeś! Straciłeś wszystkie życia.",
  draw: "Remis! Obaj stracili wszystkie życia.",
};

export function gameOverMessage(status) {
  return GAME_OVER_MESSAGE[status] ?? null;
}
