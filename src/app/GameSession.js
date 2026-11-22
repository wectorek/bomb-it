"use client";

import { useState } from "react";
import styles from "./page.module.css";
import GameBoard from "./GameBoard";
import AdvancedSettings, { DEFAULT_ADVANCED } from "./AdvancedSettings";
import { teamForSeat } from "./teams";
import ChatBar from "./ChatBar";

const COLORS = [
  { id: "blue", label: "Niebieski", hex: "#1e88e5" },
  { id: "red", label: "Czerwony", hex: "#e53935" },
  { id: "green", label: "Zielony", hex: "#43a047" },
  { id: "purple", label: "Fioletowy", hex: "#8e24aa" },
];

const hexOf = (color) => COLORS.find((c) => c.id === color)?.hex ?? color;

function cleanNick(value) {
  const trimmed = value.replace(/\s+/g, " ").trim().slice(0, 16);
  return trimmed || "Gracz";
}

function BackButton({ onClick, children = "← Wróć" }) {
  return (
    <button type="button" className={styles.menuButtonSecondary} onClick={onClick}>
      {children}
    </button>
  );
}

function Menu({ room, zoneEnabled, onReplayIntro }) {
  const [view, setView] = useState("main");
  const [botCount, setBotCount] = useState(3);
  const [color, setColor] = useState("blue");
  const [nick, setNick] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [advanced, setAdvanced] = useState(DEFAULT_ADVANCED);
  const name = cleanNick(nick);

  return (
    <section className={styles.menu}>
      <h1 className={styles.menuTitle}>Bomb It</h1>
      {view === "main" ? (
        <>
          <div className={styles.menuBackdrop} aria-hidden="true" />
          <div className={styles.menuBackdropTint} aria-hidden="true" />
        </>
      ) : null}
      {room.error ? <p className={styles.menuError}>{room.error}</p> : null}

      {view === "main" ? (
        <div className={styles.menuStack}>
          <button
            type="button"
            className={styles.startButton}
            onClick={() => setView("bots")}
          >
            Gra z botami
          </button>
          <button
            type="button"
            className={styles.startButton}
            onClick={() => setView("multi")}
          >
            Multiplayer
          </button>
          <button
            type="button"
            className={styles.menuButtonSecondary}
            onClick={() => setView("howto")}
          >
            Jak grać
          </button>
          <button
            type="button"
            className={styles.menuButtonSecondary}
            onClick={() => setView("authors")}
          >
            Autorzy
          </button>
        </div>
      ) : null}

      {view === "howto" ? (
        <div className={styles.menuStack}>
          <p className={styles.sectionLabel}>Sterowanie</p>
          <p>
            Strzałki lub WASD — ruch. Spacja — bomba (przytrzymaj kierunek dla
            granatu z bonusu).
          </p>
          <p className={styles.sectionLabel}>Bonusy</p>
          <p>
            Zbieraj je ze zniszczonych ścian: szybkość, zasięg, nietykalność,
            granat, spowolnienie wrogów i inne.
          </p>
          <p className={styles.sectionLabel}>Strefa</p>
          <p>
            Opcjonalnie kurczy się bezpieczny kwadrat — stój w środku lub
            uciekaj przed burzą.
          </p>
          <p className={styles.sectionLabel}>Tryb rozwolnienia</p>
          <p>
            W ustawieniach można włączyć go po wybranym czasie, na przykład po
            2 minutach, gdy zostaną dwie żywe osoby, albo zostawić wyłączony.
            Gdy ruszy, arena się czyści i spadają kawałki — unikaj zabrudzonych
            pól.
          </p>
          <p className={styles.sectionLabel}>Drużyny 2×2</p>
          <p>
            Osoby z jednej drużyny mają ten sam kolor ramki i literę: A albo B.
          </p>
          <BackButton onClick={() => setView("main")}>← Menu główne</BackButton>
        </div>
      ) : null}

      {view === "authors" ? (
        <div className={styles.menuStack}>
          <p className={styles.sectionLabel}>
            Autor główny - Sonnet 5.5, Composer 2.5 i Grok 4.7
          </p>
          <p className={styles.sectionLabel}>
            Autorzy niegłówni: Cieślov, wektoreczki.
          </p>
          <button
            type="button"
            className={styles.startButton}
            onClick={onReplayIntro}
          >
            Odtwórz animację
          </button>
          <BackButton onClick={() => setView("main")}>
            ← Menu główne
          </BackButton>
        </div>
      ) : null}

      {view === "bots" ? (
        <div className={styles.menuStack}>
          <p className={styles.sectionLabel}>Liczba botów</p>
          <div className={styles.choiceRow}>
            {[1, 2, 3].map((n) => (
              <button
                key={n}
                type="button"
                className={`${styles.choice} ${n === botCount ? styles.choiceOn : ""}`}
                aria-pressed={n === botCount}
                onClick={() => setBotCount(n)}
              >
                {n}
              </button>
            ))}
          </div>
          <p className={styles.sectionLabel}>Twój kolor</p>
          <div className={styles.choiceRow}>
            {COLORS.map((c) => (
              <button
                key={c.id}
                type="button"
                title={c.label}
                aria-label={c.label}
                aria-pressed={c.id === color}
                className={`${styles.swatch} ${c.id === color ? styles.swatchOn : ""}`}
                style={{ "--swatch": c.hex }}
                onClick={() => setColor(c.id)}
              />
            ))}
          </div>
          <AdvancedSettings value={advanced} onChange={setAdvanced} />
          <button
            type="button"
            className={styles.startButton}
            onClick={() =>
              room.play({ nick: "Ty", botCount, color, settings: advanced })
            }
          >
            Start gry
          </button>
          <BackButton onClick={() => setView("main")}>
            ← Menu główne
          </BackButton>
        </div>
      ) : null}

      {view === "multi" || view === "join" || view === "host" ? (
        <div className={styles.menuStack}>
          <label className={styles.menuField}>
            <span>Nick</span>
            <input
              className={styles.menuInput}
              value={nick}
              maxLength={16}
              placeholder="Gracz"
              onChange={(event) => setNick(event.target.value)}
            />
          </label>
          {view === "host" ? (
            <>
              <AdvancedSettings value={advanced} onChange={setAdvanced} />
              <button
                type="button"
                className={styles.startButton}
                onClick={() =>
                  room.createRoom({
                    nick: name,
                    fillBots: true,
                    settings: advanced,
                  })
                }
              >
                Utwórz grę
              </button>
              <BackButton onClick={() => setView("multi")}>
                ← Wróć do wyboru
              </BackButton>
            </>
          ) : view === "multi" ? (
            <>
              <button
                type="button"
                className={styles.menuButtonSecondary}
                onClick={() => setView("join")}
              >
                Dołącz do gry
              </button>
              <button
                type="button"
                className={styles.startButton}
                onClick={() => setView("host")}
              >
                Utwórz grę multiplayer
              </button>
              <BackButton onClick={() => setView("main")}>
                ← Menu główne
              </BackButton>
            </>
          ) : (
            <>
              <label className={styles.menuField}>
                <span>Kod gry</span>
                <input
                  className={styles.menuInput}
                  value={joinCode}
                  maxLength={4}
                  autoCapitalize="characters"
                  onChange={(event) =>
                    setJoinCode(event.target.value.toUpperCase())
                  }
                />
              </label>
              <button
                type="button"
                className={styles.startButton}
                disabled={joinCode.trim().length === 0}
                onClick={() => room.join({ code: joinCode.trim(), nick: name })}
              >
                Dołącz
              </button>
              <BackButton onClick={() => setView("multi")}>
                ← Wróć do wyboru
              </BackButton>
            </>
          )}
        </div>
      ) : null}
    </section>
  );
}

function Lobby({ room }) {
  const actors = room.snapshot?.actors ?? [];
  const isHost = room.snapshot?.host === room.you;
  const fillBots = room.snapshot?.fillBots === true;
  const canStart = isHost && actors.length >= 2;

  return (
    <section className={styles.menu}>
      <h1 className={styles.menuTitle}>Multiplayer</h1>
      <p className={styles.sectionLabel}>Kod gry</p>
      <p className={styles.code} aria-label="Kod gry">
        {room.code}
      </p>
      <ul className={styles.seatList}>
        {actors.map((actor, index) => {
          const team =
            room.snapshot?.settings?.mode === "teams" ? teamForSeat(index) : null;
          return (
          <li
            key={actor.id}
            className={styles.seatRow}
            style={team ? { boxShadow: `inset 4px 0 0 ${team.color}` } : undefined}
          >
            <span
              className={styles.seatDot}
              style={{ backgroundColor: hexOf(actor.color) }}
            />
            {team ? (
              <span className={styles.seatTeam} style={{ "--team": team.color }}>
                {team.short}
              </span>
            ) : null}
            {actor.name}
            {actor.id === room.you ? " (Ty)" : ""}
            {actor.id === room.snapshot?.host ? " · host" : ""}
            {isHost && actor.id !== room.you ? (
              <button
                type="button"
                className={styles.menuButtonSecondary}
                onClick={() => room.transferHost(actor.id)}
              >
                Przekaż hosta
              </button>
            ) : null}
          </li>
          );
        })}
      </ul>
      {isHost ? (
        <button
          type="button"
          className={fillBots ? styles.menuButton : styles.menuButtonSecondary}
          aria-pressed={fillBots}
          onClick={() => room.setFillBots(!fillBots)}
        >
          {fillBots
            ? "Boty uzupełniają graczy: tak"
            : "Boty uzupełniają graczy: nie"}
        </button>
      ) : (
        <p>{fillBots ? "Wolne miejsca zajmą boty." : "Bez botów."}</p>
      )}
      {isHost && room.snapshot?.settings ? (
        <AdvancedSettings
          value={room.snapshot.settings}
          onChange={(settings) => room.updateSettings({ settings })}
        />
      ) : null}
      <ChatBar
        chat={room.snapshot?.chat}
        you={room.you}
        onSend={room.sendChat}
        compact
      />
      <div className={styles.menuStack}>
        {isHost ? (
          <>
            <button
              type="button"
              className={styles.startButton}
              disabled={!canStart}
              onClick={room.restart}
            >
              Start gry
            </button>
            {canStart ? null : <p>Czekam na co najmniej jednego gracza…</p>}
          </>
        ) : (
          <p>Czekam, aż gospodarz rozpocznie grę…</p>
        )}
        <BackButton onClick={room.disconnect}>← Wyjdź</BackButton>
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

export default function GameSession({
  room,
  zoneEnabled,
  themeId,
  onReplayIntro,
}) {
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
        onReplayIntro={onReplayIntro}
      />
    );
  }

  if (room.snapshot.status === "lobby") {
    return <Lobby room={room} />;
  }

  const players = (room.snapshot.actors ?? []).filter(
    (actor) => actor.kind === "player",
  );
  const multi =
    players.length > 1
      ? {
          hostId: room.snapshot.host,
          isHost: room.snapshot.host === room.you,
          players,
          ready: room.snapshot.ready ?? [],
          fillBots: room.snapshot.fillBots === true,
          settings: room.snapshot.settings ?? null,
          onReady: room.setReady,
          onStart: room.restart,
          onTransfer: room.transferHost,
          onUpdate: room.updateSettings,
          onSendChat: room.sendChat,
        }
      : null;

  return (
    <GameBoard
      multi={multi}
      snapshot={room.snapshot}
      you={room.you}
      clock={room.clock}
      themeId={themeId}
      onRestart={room.restart}
      onExit={room.disconnect}
      onSendChat={room.sendChat}
    />
  );
}
