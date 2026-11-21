"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { wsUrl } from "./net";

export function useServerClock(clock) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, []);

  if (!clock) {
    return now;
  }
  return clock.serverNow + (now - clock.receivedAt);
}

export function useRoom() {
  const [connection, setConnection] = useState("idle");
  const [snapshot, setSnapshot] = useState(null);
  const [you, setYou] = useState(null);
  const [code, setCode] = useState(null);
  const [error, setError] = useState(null);
  const [clock, setClock] = useState(null);
  const wsRef = useRef(null);
  const seqRef = useRef(0);
  const directionRef = useRef(null);

  const closeSocket = useCallback(() => {
    const ws = wsRef.current;
    wsRef.current = null;
    if (!ws) {
      return;
    }
    ws.onopen = null;
    ws.onmessage = null;
    ws.onclose = null;
    ws.onerror = null;
    ws.close();
  }, []);

  const connect = useCallback(
    (firstMessage) => {
      closeSocket();
      setError(null);
      setSnapshot(null);
      setClock(null);
      setYou(null);
      setCode(null);
      setConnection("connecting");
      seqRef.current = 0;
      directionRef.current = null;

      const ws = new WebSocket(wsUrl());
      wsRef.current = ws;

      ws.onopen = () => {
        if (wsRef.current !== ws) {
          return;
        }
        ws.send(JSON.stringify(firstMessage));
      };

      ws.onmessage = (event) => {
        if (wsRef.current !== ws) {
          return;
        }
        let message;
        try {
          message = JSON.parse(event.data);
        } catch {
          return;
        }

        if (message.type === "welcome") {
          setYou(message.you);
          setCode(message.code ?? message.roomId ?? null);
          setConnection("live");
          seqRef.current = 0;
          return;
        }

        if (message.type === "state") {
          setClock({
            serverNow: message.serverNow,
            receivedAt: Date.now(),
          });
          setSnapshot(message);
          setYou(message.you ?? null);
          if (message.roomId) {
            setCode(message.roomId);
          }
          setConnection("live");
          return;
        }

        if (message.type === "error") {
          setError(message.message || "Błąd serwera.");
          setConnection("idle");
          closeSocket();
          return;
        }

        if (message.type === "bye") {
          setConnection("closed");
          closeSocket();
        }
      };

      ws.onclose = () => {
        if (wsRef.current !== ws) {
          return;
        }
        wsRef.current = null;
        setConnection((current) => (current === "idle" ? current : "closed"));
      };
    },
    [closeSocket],
  );

  useEffect(() => () => closeSocket(), [closeSocket]);

  const play = useCallback(
    ({
      nick = "Ty",
      zone = false,
      botCount = 3,
      color = "blue",
      settings = null,
    } = {}) => {
      connect({
        type: "create",
        nick,
        zone: Boolean(zone),
        fillBots: true,
        botCount,
        color,
        settings,
      });
    },
    [connect],
  );

  const createRoom = useCallback(
    ({ nick = "Ty", zone = false, fillBots = false, settings = null } = {}) => {
      connect({
        type: "create",
        nick,
        zone: Boolean(zone),
        fillBots: Boolean(fillBots),
        settings,
        lobby: true,
      });
    },
    [connect],
  );

  const join = useCallback(
    ({ code: roomCode, nick = "Ty" } = {}) => {
      connect({
        type: "join",
        code: roomCode,
        nick,
      });
    },
    [connect],
  );

  const send = useCallback((payload) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return;
    }
    ws.send(JSON.stringify(payload));
  }, []);

  const setFillBots = useCallback(
    (fillBots) => send({ type: "settings", fillBots }),
    [send],
  );

  const setReady = useCallback(
    (ready) => send({ type: "ready", ready }),
    [send],
  );

  const updateSettings = useCallback(
    (patch) => send({ type: "settings", ...patch }),
    [send],
  );

  const transferHost = useCallback(
    (to) => send({ type: "transferHost", to }),
    [send],
  );

  const restart = useCallback(() => {
    seqRef.current = 0;
    send({ type: "restart" });
  }, [send]);

  const sendInput = useCallback(
    (action) => {
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        return;
      }
      seqRef.current += 1;
      ws.send(
        JSON.stringify({
          type: "input",
          direction: directionRef.current,
          action,
          seq: seqRef.current,
        }),
      );
    },
    [],
  );

  const setDirection = useCallback(
    (direction) => {
      const previous = directionRef.current;
      const same =
        previous === direction ||
        (previous == null && direction == null) ||
        (previous != null &&
          direction != null &&
          previous.row === direction.row &&
          previous.col === direction.col);
      if (same) {
        return;
      }
      directionRef.current = direction;
      sendInput(null);
    },
    [sendInput],
  );

  const pressBomb = useCallback(() => {
    sendInput("bomb");
  }, [sendInput]);

  const disconnect = useCallback(() => {
    send({ type: "leave" });
    closeSocket();
    setConnection("idle");
    setSnapshot(null);
    setClock(null);
    setYou(null);
    setCode(null);
    setError(null);
    seqRef.current = 0;
    directionRef.current = null;
  }, [closeSocket, send]);

  return {
    connection,
    snapshot,
    you,
    code,
    error,
    clock,
    play,
    createRoom,
    join,
    restart,
    setFillBots,
    setReady,
    updateSettings,
    transferHost,
    setDirection,
    pressBomb,
    disconnect,
  };
}
