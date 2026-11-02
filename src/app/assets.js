const DIRECTIONS = ["up", "down", "left", "right"];

export const PLAYER_IDLE = {
  down: "/player/down.png",
  up: "/player/up.png",
  left: "/player/left.png",
  right: "/player/right.png",
};

export const PLAYER_HIT = "/player/hit.png";

export const ASSETS = {
  walls: {
    solid: "/walls/solid.png",
    destructible: "/walls/destructible.png",
    border: "/walls/border.png",
  },
  floor: "/floor.png",
  objects: {
    bomb: "/objects/bomb.png",
    grenade: "/objects/grenade.png",
    explosion: "/objects/explosion.png",
    explosionFrames: [
      "/objects/explosion-1.png",
      "/objects/explosion-2.png",
      "/objects/explosion-3.png",
    ],
  },
  bonuses: {
    mystery: "/bonuses/mystery.png",
    immunity: "/bonuses/immunity.png",
    speed: "/bonuses/speed.png",
    range: "/bonuses/range.png",
    slow: "/bonuses/slow.png",
    fragile: "/bonuses/fragile.png",
  },
  ui: {
    soundOn: "/ui/sound-on.png",
    soundOff: "/ui/sound-off.png",
    endBackground: "/ui/end-background.png",
  },
  player: {
    hit: "/player/hit.png",
    win: "/player/win.png",
    lose: "/player/lose.png",
  },
};

/** Grafika ściany: obramowanie, solid, destructible i bonus (ten sam co destructible). */
export function wallSpriteUrl({ type = "destructible", permanent = false } = {}) {
  if (permanent) {
    return ASSETS.walls.border;
  }
  if (type === "solid") {
    return ASSETS.walls.solid;
  }
  return ASSETS.walls.destructible;
}

export function playerWalkPath(dir, frame) {
  return `/player/walk/${dir}-${frame}.png`;
}

export function playerIdleSrc(facing) {
  return PLAYER_IDLE[facing] ?? PLAYER_IDLE.down;
}

export function playerWalkSrc(facing, frame) {
  return playerWalkPath(facing, frame);
}

export function allPlayerSpriteUrls() {
  const urls = [...Object.values(PLAYER_IDLE), PLAYER_HIT];
  for (const dir of DIRECTIONS) {
    urls.push(playerWalkPath(dir, 1), playerWalkPath(dir, 2));
  }
  return urls;
}

export function preloadPlayerSprites() {
  for (const src of allPlayerSpriteUrls()) {
    const img = new Image();
    img.src = src;
  }
}
