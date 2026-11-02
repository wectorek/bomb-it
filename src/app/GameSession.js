"use client";

import { useCallback, useState } from "react";
import GameBoard from "./GameBoard";

export default function GameSession() {
  const [sessionId, setSessionId] = useState(1);

  const restart = useCallback(() => {
    setSessionId((current) => current + 1);
  }, []);

  return <GameBoard key={sessionId} onRestart={restart} />;
}
