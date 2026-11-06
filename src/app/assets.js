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
    freeze: "/bonuses/freeze.svg",
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

export const THEMES = [
  {
    id: "main",
    name: "Główny",
    floor: "/floor.png",
    solid: "/walls/solid.png",
    destructible: "/walls/destructible.png",
    border: "/walls/border.png",
    hedge: "/walls/hedge.png",
  },
  {
    id: "bee",
    name: "Pszczeli",
    floor: "/themes/bee/floor.png",
    solid: "/themes/bee/solid.png",
    destructible: "/themes/bee/destructible.png",
    border: "/themes/bee/border.png",
    hedge: "/themes/bee/hedge.png",
  },
  {
    id: "sacred",
    name: "Religijny",
    floor: "/themes/sacred/floor.png",
    solid: "/themes/sacred/solid.png",
    destructible: "/themes/sacred/destructible.png",
    border: "/themes/sacred/border.png",
    hedge: "/themes/sacred/hedge.png",
  },
  {
    id: "circuit",
    name: "AI",
    floor: "/themes/circuit/floor.png",
    solid: "/themes/circuit/solid.png",
    destructible: "/themes/circuit/destructible.png",
    border: "/themes/circuit/border.png",
    hedge: "/themes/circuit/hedge.png",
  },
  {
    id: "cosmos",
    name: "Kosmiczny",
    floor: "/themes/cosmos/floor.png",
    solid: "/themes/cosmos/solid.png",
    destructible: "/themes/cosmos/destructible.png",
    border: "/themes/cosmos/border.png",
    hedge: "/themes/cosmos/hedge.png",
  },
];

export function themeById(id) {
  return THEMES.find((theme) => theme.id === id) ?? THEMES[0];
}

/** Grafika ściany zależy od motywu. Bonus wygląda jak zwykła skrzynka. */
export function wallSpriteUrl({
  type = "destructible",
  permanent = false,
  themeId = "bee",
} = {}) {
  const theme = themeById(themeId);
  if (permanent) {
    return theme.border;
  }
  if (type === "solid") {
    return theme.solid;
  }
  if (type === "hedge") {
    return theme.hedge;
  }
  return theme.destructible;
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
