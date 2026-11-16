export const GAME_PORT = 8787;

export function wsUrl() {
  if (typeof window !== "undefined" && window.BOMB_IT_WS_URL) {
    return window.BOMB_IT_WS_URL;
  }
  if (typeof window === "undefined") {
    return `ws://127.0.0.1:${GAME_PORT}`;
  }
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") {
    return `ws://127.0.0.1:${GAME_PORT}`;
  }
  return `ws://${host}:${GAME_PORT}`;
}
