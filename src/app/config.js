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

// Ściany. Solid jest losowany, nie układa się w kratkę.
export const BONUS_WALL_CHANCE = 0.4;
export const SOLID_WALL_CHANCE = 0.22;
export const HEDGE_WALL_CHANCE = 0.34;
export const HEDGE_REGROW_MS = 8000;

// Bot stawia ładunek dopiero przy innym żywym aktorze.
export const BOT_ENGAGE_DISTANCE = 4;

// Muzyka. Lista utworów powstaje z plików mp3 w public/audio.
export const MUSIC_VOLUME = 0.4;

// Strefa schodzi od brzegu o jedno pole na 20 sekund. Obrażenia co 5 sekund w niej.
export const ZONE_CELL_MS = 20000;
export const ZONE_DAMAGE_MS = 5000;

// Bonusy (T2). Negatywny ma być rzadszy niż pozytywny.
export const BONUS_DURATION_MS = 10000;
export const NEGATIVE_BONUS_CHANCE = 0.2;
export const SPEED_MULTIPLIER = 0.6;
export const SLOW_MULTIPLIER = 1.6;
export const RANGE_BONUS = 2;
export const BONUSES_DESTROYED_BY_EXPLOSION = false;
export const BONUS_LIFETIME_MS = null;
export const TOAST_MS = 1500;
export const FREEZE_DURATION_MS = 3000;

// Granat (T2b). Zasięg wybuchu to BOMB_RANGE, bez bonusu zasięgu.
export const GRENADE_THROW_DISTANCE = 2;
export const GRENADE_TIMER_MS = 2000;
export const GRENADE_FLIGHT_MS = 250;
