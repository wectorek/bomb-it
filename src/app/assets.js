const DIRECTIONS = ["up", "down", "left", "right"];
const BEE_COLORS = ["blue", "red", "green", "purple"];

export function playerIdleSrc(facing, color = "blue") {
  const dir = DIRECTIONS.includes(facing) ? facing : "down";
  const team = BEE_COLORS.includes(color) ? color : "blue";
  return `/bees/${team}/${dir}.png`;
}

export function playerWalkSrc(facing, frame, color = "blue") {
  const dir = DIRECTIONS.includes(facing) ? facing : "down";
  const team = BEE_COLORS.includes(color) ? color : "blue";
  const step = frame === 2 ? 2 : 1;
  return `/bees/${team}/walk/${dir}-${step}.png`;
}

export function playerHitSrc(color = "blue") {
  const team = BEE_COLORS.includes(color) ? color : "blue";
  return `/bees/${team}/hit.png`;
}

export function playerPoseSrc(kind, color = "blue") {
  const team = BEE_COLORS.includes(color) ? color : "blue";
  return `/bees/${team}/${kind === "win" ? "win" : "lose"}.png`;
}

export const PLAYER_IDLE = {
  down: playerIdleSrc("down"),
  up: playerIdleSrc("up"),
  left: playerIdleSrc("left"),
  right: playerIdleSrc("right"),
};

export const PLAYER_HIT = playerHitSrc("blue");

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
    hit: playerHitSrc("blue"),
    win: playerPoseSrc("win"),
    lose: playerPoseSrc("lose"),
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
  return playerWalkSrc(dir, frame, "blue");
}

export function allPlayerSpriteUrls() {
  const urls = [];
  for (const color of BEE_COLORS) {
    urls.push(playerHitSrc(color), playerPoseSrc("win", color), playerPoseSrc("lose", color));
    for (const dir of DIRECTIONS) {
      urls.push(playerIdleSrc(dir, color), playerWalkSrc(dir, 1, color), playerWalkSrc(dir, 2, color));
    }
  }
  return urls;
}

export function preloadPlayerSprites() {
  for (const src of allPlayerSpriteUrls()) {
    const img = new Image();
    img.src = src;
  }
}
