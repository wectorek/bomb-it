"use client";

import { useState } from "react";
import styles from "./page.module.css";
import GameBoard from "./GameBoard";

function cleanNick(value) {
  const trimmed = value.replace(/\s+/g, " ").trim().slice(0, 16);
  return trimmed || "Ty";
}

function Menu({
  room,
  zoneEnabled,
  nick,
  setNick,
  joinCode,
  setJoinCode,
  roomOpen,
  setRoomOpen,
  botsEnabled,
  setBotsEnabled,
}) {
  const name = cleanNick(nick);

  return (
    <section className={styles.menu}>
      <h1 className={styles.menuTitle}>Bomb-It</h1>
      {room.error ? <p className={styles.menuError}>{room.error}</p> : null}
      <label className={styles.menuField}>
        <span>Nick</span>
        <input
          className={styles.menuInput}
          value={nick}
          maxLength={16}
          onChange={(event) => setNick(event.target.value)}
        />
      </label>
      <div className={styles.menuActions}>
        <button
          type="button"
          className={styles.menuButton}
          onClick={() => room.play({ nick: name, zone: zoneEnabled })}
        >
          Graj
        </button>
        <button
          type="button"
          className={styles.menuButtonSecondary}
          onClick={() => setRoomOpen((open) => !open)}
        >
          Pokój
        </button>
      </div>
      {roomOpen ? (
        <div className={styles.roomBox}>
          <button
            type="button"
            className={botsEnabled ? styles.menuButton : styles.menuButtonSecondary}
            aria-pressed={botsEnabled}
            onClick={() => setBotsEnabled((enabled) => !enabled)}
          >
            {botsEnabled ? "Boty: włączone" : "Boty: wyłączone"}
          </button>
          <button
            type="button"
            className={styles.menuButton}
            onClick={() =>
              room.createRoom({
                nick: name,
                zone: zoneEnabled,
                fillBots: botsEnabled,
              })
            }
          >
            Utwórz pokój
          </button>
          <label className={styles.menuField}>
            <span>Kod</span>
            <input
              className={styles.menuInput}
              value={joinCode}
              maxLength={4}
              autoCapitalize="characters"
              onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
            />
          </label>
          <button
            type="button"
            className={styles.menuButton}
            onClick={() =>
              room.join({ code: joinCode.trim(), nick: name })
            }
          >
            Dołącz
          </button>
        </div>
      ) : null}
    </section>
  );
}

function Lobby({ room }) {
  const actors = room.snapshot?.actors ?? [];

  return (
    <section className={styles.menu}>
      <h1 className={styles.menuTitle}>Pokój</h1>
      <p className={styles.code} aria-label="Kod pokoju">
        {room.code}
      </p>
      <p>{room.snapshot?.fillBots ? "Start doda boty." : "Bez botów."}</p>
      <ul className={styles.seatList}>
        {actors.map((actor) => (
          <li key={actor.id}>{actor.name}</li>
        ))}
      </ul>
      <div className={styles.menuActions}>
        <button type="button" className={styles.menuButton} onClick={room.restart}>
          Start
        </button>
        <button
          type="button"
          className={styles.menuButtonSecondary}
          onClick={room.disconnect}
        >
          Wyjdź
        </button>
      </div>
    </section>
  );
}

function ClosedNotice({ onBack }) {
  return (
    <section className={styles.menu}>
      <h1 className={styles.menuTitle}>Połączenie zerwane</h1>
      <p className={styles.menuError}>
        Serwer nie odpowiada. Plansza nie jest liczona na tym urządzeniu.
      </p>
      <button type="button" className={styles.menuButton} onClick={onBack}>
        Wróć do menu
      </button>
    </section>
  );
}

export default function GameSession({ room, zoneEnabled, themeId }) {
  const [nick, setNick] = useState("Ty");
  const [joinCode, setJoinCode] = useState("");
  const [roomOpen, setRoomOpen] = useState(false);
  const [botsEnabled, setBotsEnabled] = useState(false);

  if (room.connection === "connecting") {
    return (
      <section className={styles.menu}>
        <p className={styles.menuTitle}>Łączenie…</p>
      </section>
    );
  }

  if (room.connection === "closed") {
    return <ClosedNotice onBack={room.disconnect} />;
  }

  if (room.connection !== "live" || !room.snapshot) {
    return (
      <Menu
        room={room}
        zoneEnabled={zoneEnabled}
        nick={nick}
        setNick={setNick}
        joinCode={joinCode}
        setJoinCode={setJoinCode}
        roomOpen={roomOpen}
        setRoomOpen={setRoomOpen}
        botsEnabled={botsEnabled}
        setBotsEnabled={setBotsEnabled}
      />
    );
  }

  if (room.snapshot.status === "lobby") {
    return <Lobby room={room} />;
  }

  return (
    <GameBoard
      snapshot={room.snapshot}
      you={room.you}
      clock={room.clock}
      themeId={themeId}
      onRestart={room.restart}
    />
  );
}
