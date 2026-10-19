import { wallBlockSize } from "./maze";

function overlaps(a, b, size) {
  return (
    a.x < b.x + size &&
    a.x + size > b.x &&
    a.y < b.y + size &&
    a.y + size > b.y
  );
}

export function collidesWithWall(position, walls, size = wallBlockSize) {
  return walls.some((wall) => overlaps(position, wall, size));
}
