import type * as Party from "partykit/server";

interface PilotState {
  name: string;
  hue: number;
  x: number;
  y: number;
  z: number;
  yaw: number;
  bank: number;
}

type ClientMsg =
  | { type: "join"; name?: string }
  | { type: "move"; x: number; y: number; z: number; yaw: number; bank: number };

type ServerMsg =
  | { type: "sync"; pilots: (PilotState & { id: string })[] }
  | { type: "join"; pilot: PilotState & { id: string } }
  | { type: "move"; id: string; x: number; y: number; z: number; yaw: number; bank: number }
  | { type: "leave"; id: string };

const MOVE_INTERVAL_MS = 80;
const ANON_NAMES = [
  "anon-builder",
  "vibe-pilot",
  "midnight-coder",
  "neon-wanderer",
  "pixel-pilot",
  "lone-coder",
  "shadow-shipper",
  "drone-zero",
];

function randomName(): string {
  const base = ANON_NAMES[Math.floor(Math.random() * ANON_NAMES.length)];
  return `${base}-${Math.floor(Math.random() * 1000)}`;
}

export default class FlyServer implements Party.Server {
  options: Party.ServerOptions = { hibernate: true };

  readonly pilots = new Map<string, PilotState>();
  readonly lastMove = new Map<string, number>();

  constructor(readonly room: Party.Room) {}

  onConnect(conn: Party.Connection, _ctx: Party.ConnectionContext) {
    const pilots = [...this.pilots.entries()].map(([id, p]) => ({ id, ...p }));
    const syncMsg: ServerMsg = { type: "sync", pilots };
    conn.send(JSON.stringify(syncMsg));
  }

  onMessage(message: string, sender: Party.Connection) {
    let msg: ClientMsg;
    try {
      msg = JSON.parse(message);
    } catch {
      return;
    }

    const id = sender.id;
    const now = Date.now();

    if (msg.type === "join") {
      const name =
        typeof msg.name === "string" && msg.name.trim().length > 0
          ? msg.name.slice(0, 32)
          : randomName();
      const pilot: PilotState = {
        name,
        hue: Math.floor(Math.random() * 360),
        x: 0,
        y: 120,
        z: 400,
        yaw: 0,
        bank: 0,
      };
      this.pilots.set(id, pilot);
      const joinMsg: ServerMsg = { type: "join", pilot: { id, ...pilot } };
      this.room.broadcast(JSON.stringify(joinMsg), [sender.id]);
      return;
    }

    if (msg.type === "move") {
      const last = this.lastMove.get(id) ?? 0;
      if (now - last < MOVE_INTERVAL_MS) return;
      this.lastMove.set(id, now);

      const pilot = this.pilots.get(id);
      if (!pilot) return;

      if (
        typeof msg.x !== "number" ||
        typeof msg.y !== "number" ||
        typeof msg.z !== "number" ||
        typeof msg.yaw !== "number" ||
        typeof msg.bank !== "number"
      ) {
        return;
      }

      pilot.x = msg.x;
      pilot.y = msg.y;
      pilot.z = msg.z;
      pilot.yaw = msg.yaw;
      pilot.bank = msg.bank;

      const moveMsg: ServerMsg = {
        type: "move",
        id,
        x: msg.x,
        y: msg.y,
        z: msg.z,
        yaw: msg.yaw,
        bank: msg.bank,
      };
      this.room.broadcast(JSON.stringify(moveMsg), [sender.id]);
    }
  }

  onClose(conn: Party.Connection) {
    const id = conn.id;
    this.pilots.delete(id);
    this.lastMove.delete(id);
    const leaveMsg: ServerMsg = { type: "leave", id };
    this.room.broadcast(JSON.stringify(leaveMsg));
  }
}

FlyServer satisfies Party.Worker;
