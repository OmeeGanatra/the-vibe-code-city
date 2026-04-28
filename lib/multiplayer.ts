"use client";

import PartySocket from "partysocket";
import { useEffect, useRef, useState } from "react";

export interface RemotePilot {
  id: string;
  name: string;
  hue: number;
  x: number;
  y: number;
  z: number;
  yaw: number;
  bank: number;
}

type ServerMsg =
  | { type: "sync"; pilots: RemotePilot[] }
  | { type: "join"; pilot: RemotePilot }
  | {
      type: "move";
      id: string;
      x: number;
      y: number;
      z: number;
      yaw: number;
      bank: number;
    }
  | { type: "leave"; id: string };

export interface PartyFlyConnection {
  /** Map of remote pilots, keyed by id. Mutated in place — do NOT mutate from consumer. */
  pilots: Map<string, RemotePilot>;
  /** Send our position to the server. Called every ~80ms by the consumer. */
  sendMove: (x: number, y: number, z: number, yaw: number, bank: number) => void;
  /** True once the WebSocket is open. */
  ready: boolean;
}

const MOVE_INTERVAL_MS = 80;

/**
 * Connect to the PartyKit `fly` room when `enabled` is true.
 * Returns the live remote-pilot map plus a `sendMove` to broadcast our position.
 *
 * No-ops gracefully if `NEXT_PUBLIC_PARTYKIT_HOST` is unset (build-time decision).
 */
export function usePartyFly(enabled: boolean): PartyFlyConnection {
  const pilotsRef = useRef<Map<string, RemotePilot>>(new Map());
  const socketRef = useRef<PartySocket | null>(null);
  const lastSendRef = useRef(0);
  const [ready, setReady] = useState(false);
  const [, setTick] = useState(0);

  const host = process.env.NEXT_PUBLIC_PARTYKIT_HOST;

  useEffect(() => {
    if (!enabled || !host) {
      pilotsRef.current.clear();
      setReady(false);
      return;
    }

    const socket = new PartySocket({
      host,
      room: "city",
    });
    socketRef.current = socket;

    const handleOpen = () => {
      setReady(true);
      socket.send(JSON.stringify({ type: "join" }));
    };

    const handleMessage = (e: MessageEvent<string>) => {
      let msg: ServerMsg;
      try {
        msg = JSON.parse(e.data);
      } catch {
        return;
      }

      if (msg.type === "sync") {
        pilotsRef.current.clear();
        for (const p of msg.pilots) pilotsRef.current.set(p.id, p);
        setTick((t) => t + 1);
        return;
      }

      if (msg.type === "join") {
        pilotsRef.current.set(msg.pilot.id, msg.pilot);
        setTick((t) => t + 1);
        return;
      }

      if (msg.type === "move") {
        const existing = pilotsRef.current.get(msg.id);
        if (!existing) return;
        existing.x = msg.x;
        existing.y = msg.y;
        existing.z = msg.z;
        existing.yaw = msg.yaw;
        existing.bank = msg.bank;
        // No setTick — frame-driven render in RemoteDrones reads the ref directly.
        return;
      }

      if (msg.type === "leave") {
        pilotsRef.current.delete(msg.id);
        setTick((t) => t + 1);
      }
    };

    socket.addEventListener("open", handleOpen);
    socket.addEventListener("message", handleMessage);

    return () => {
      socket.removeEventListener("open", handleOpen);
      socket.removeEventListener("message", handleMessage);
      socket.close();
      socketRef.current = null;
      pilotsRef.current.clear();
      setReady(false);
    };
  }, [enabled, host]);

  const sendMove = (x: number, y: number, z: number, yaw: number, bank: number) => {
    const now = Date.now();
    if (now - lastSendRef.current < MOVE_INTERVAL_MS) return;
    lastSendRef.current = now;
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify({ type: "move", x, y, z, yaw, bank }));
  };

  return { pilots: pilotsRef.current, sendMove, ready };
}
