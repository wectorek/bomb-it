import { ASSETS, themeById } from "./assets";
import styles from "./page.module.css";
import ActorSprite from "./ActorSprite";
import bonusStyles from "./bonus.module.css";
import {
  ARENA_SIZE,
  BOARD_SIZE,
  EXPLOSION_DURATION_MS,
  GRENADE_FLIGHT_MS,
} from "./config";
import { cellToPixels, wallBlockSize } from "./maze";
import Storm from "./Storm";
import WallBlock from "./WallBlock";

function CellMarker({ cell, className, style: extraStyle }) {
  const { x, y } = cellToPixels(cell.row, cell.col);

  return (
    <div
      className={className}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: `${wallBlockSize}px`,
        height: `${wallBlockSize}px`,
        ...extraStyle,
      }}
    />
  );
}

function BonusPickup({ bonus }) {
  const { x, y } = cellToPixels(bonus.row, bonus.col);

  return (
    <div
      className={bonusStyles.pickup}
      aria-hidden="true"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: `${wallBlockSize}px`,
        height: `${wallBlockSize}px`,
      }}
    >
      <img
        className={bonusStyles.pickupImg}
        src={ASSETS.bonuses.mystery}
        alt=""
        draggable={false}
      />
    </div>
  );
}

function GrenadeMarker({ grenade }) {
  const to = cellToPixels(grenade.row, grenade.col);
  const from = cellToPixels(
    grenade.fromRow ?? grenade.row,
    grenade.fromCol ?? grenade.col,
  );

  return (
    <div
      className={
        grenade.airborne
          ? `${styles.grenade} ${styles.grenadeFlying}`
          : styles.grenade
      }
      aria-hidden="true"
      style={{
        left: `${to.x}px`,
        top: `${to.y}px`,
        width: `${wallBlockSize}px`,
        height: `${wallBlockSize}px`,
        "--grenade-dx": `${from.x - to.x}px`,
        "--grenade-dy": `${from.y - to.y}px`,
        "--grenade-flight-ms": `${GRENADE_FLIGHT_MS}ms`,
      }}
    />
  );
}

export default function Arena({
  walls,
  borders = [],
  actors = [],
  bombs = [],
  grenades = [],
  bonuses = [],
  toasts = [],
  explosionCells = [],
  zoneStartedAt = null,
  themeId = "bee",
}) {
  const visible = actors.filter((actor) => actor.alive && actor.position);
  const bots = visible.filter((actor) => actor.kind === "bot");
  const players = visible.filter((actor) => actor.kind === "player");
  const theme = themeById(themeId);

  return (
    <div
      className={styles.board}
      style={{ "--board-size": BOARD_SIZE, "--arena-size": `${ARENA_SIZE}px` }}
    >
      <div
        className={styles.arena}
        style={{
          width: ARENA_SIZE,
          height: ARENA_SIZE,
          "--board-size": BOARD_SIZE,
          backgroundImage: `url(${theme.floor})`,
        }}
      >
        {toasts.length > 0 ? (
          <div className={bonusStyles.toastStack} aria-live="polite">
            {toasts.map((toast) => (
              <div key={toast.id} className={bonusStyles.toast} role="status">
                {toast.text}
              </div>
            ))}
          </div>
        ) : null}
        {borders.map((cell) => (
          <WallBlock
            key={`border-${cell.row},${cell.col}`}
            row={cell.row}
            col={cell.col}
            permanent
            themeId={themeId}
          />
        ))}
        {walls.map((wall) => (
          <WallBlock
            key={`${wall.row},${wall.col}`}
            row={wall.row}
            col={wall.col}
            type={wall.type}
            themeId={themeId}
          />
        ))}
        {bonuses.map((bonus) => (
          <BonusPickup key={`bonus-${bonus.id}`} bonus={bonus} />
        ))}
        {explosionCells.map((cell) => (
          <CellMarker
            key={`explosion-${cell.row},${cell.col}`}
            cell={cell}
            className={styles.explosion}
            style={{
              "--explosion-duration": `${EXPLOSION_DURATION_MS}ms`,
            }}
          />
        ))}
        {bombs.map((bomb) => (
          <CellMarker
            key={`bomb-${bomb.id}`}
            cell={bomb}
            className={styles.bomb}
          />
        ))}
        {grenades.map((grenade) => (
          <GrenadeMarker key={`grenade-${grenade.id}`} grenade={grenade} />
        ))}
        {bots.map((actor) => (
          <ActorSprite key={actor.id} actor={actor} />
        ))}
        {players.map((actor) => (
          <ActorSprite key={actor.id} actor={actor} />
        ))}
        <Storm startedAt={zoneStartedAt} />
      </div>
    </div>
  );
}
