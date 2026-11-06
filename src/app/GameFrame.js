"use client";

import { useState } from "react";
import GameSession from "./GameSession";
import MusicToggle from "./MusicToggle";
import TouchControls from "./TouchControls";

export default function GameFrame() {
  const [zoneEnabled, setZoneEnabled] = useState(false);
  const [themeId, setThemeId] = useState("bee");

  return (
    <>
      <GameSession zoneEnabled={zoneEnabled} themeId={themeId} />
      <MusicToggle
        zoneEnabled={zoneEnabled}
        onZoneChange={setZoneEnabled}
        themeId={themeId}
        onThemeChange={setThemeId}
      />
      <TouchControls />
    </>
  );
}
