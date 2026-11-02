export const BOMB_TIMER_MS = 3000; // czas od postawienia do wybuchu
export const BOMB_RANGE = 2; // zasięg wybuchu w każdą stronę krzyża
export const EXPLOSION_DURATION_MS = 400; // jak długo widoczny jest ogień
export const STARTING_LIVES = 3;
export const BOT_MOVE_INTERVAL_MS = 300;
export const PLAYER_MOVE_INTERVAL_MS = BOT_MOVE_INTERVAL_MS;
export const BOARD_SIZE = 15;
export const ARENA_SIZE = 1000;
export const BOT_COUNT = 3;
export const BOT_COLORS = ["red", "green", "purple"];
export const GAME_TICK_MS = 50; // wspólny tick, nie tempo kroku

// Ściany (T1). Pola, gdzie wiersz i kolumna są parzyste, i tak zostają filarami.
export const BONUS_WALL_CHANCE = 0.4;
export const EXTRA_SOLID_CHANCE = 0;

// Muzyka (T5). Plik dorzuca użytkownik; brak pliku nie może wywalić gry.
export const MUSIC_SRC = "/audio/background.mp3";
export const MUSIC_TITLE = "Pszczółka Maja";
export const MUSIC_ARTIST = "Zenon Martyniuk";
export const MUSIC_VOLUME = 0.4;

// Bonusy (T2). Negatywny ma być rzadszy niż pozytywny.
export const BONUS_DURATION_MS = 10000;
export const NEGATIVE_BONUS_CHANCE = 0.2;
export const SPEED_MULTIPLIER = 0.6;
export const SLOW_MULTIPLIER = 1.6;
export const RANGE_BONUS = 2;
export const BONUSES_DESTROYED_BY_EXPLOSION = false;
export const BONUS_LIFETIME_MS = null;
export const TOAST_MS = 1500;

// Granat (T2b). Zasięg wybuchu to BOMB_RANGE, bez bonusu zasięgu.
export const GRENADE_THROW_DISTANCE = 2;
export const GRENADE_TIMER_MS = 2000;
export const GRENADE_FLIGHT_MS = 250;
