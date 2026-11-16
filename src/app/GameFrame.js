"use client";

import { useState } from "react";
import GameSession from "./GameSession";
import MusicToggle from "./MusicToggle";
import TouchControls from "./TouchControls";
import { usePlayerControls } from "./usePlayerControls";
import { useRoom } from "./useRoom";

export default function GameFrame() {
  const room = useRoom();
  const [zoneEnabled, setZoneEnabled] = useState(false);
  const [themeId, setThemeId] = useState("bee");
  usePlayerControls(room);

  return (
    <>
      <GameSession room={room} zoneEnabled={zoneEnabled} themeId={themeId} />
      <MusicToggle
        zoneEnabled={zoneEnabled}
        onZoneChange={setZoneEnabled}
        themeId={themeId}
        onThemeChange={setThemeId}
      />
      <TouchControls onDirection={room.setDirection} onBomb={room.pressBomb} />
    </>
  );
}
