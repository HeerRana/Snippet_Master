import * as Y from "yjs";
import CollabSession from "../models/snippets/CollabSessionModel.js";
import Snippet from "../models/snippets/SnippetModel.js";

// Live editing: every room holds a Yjs document that clients keep in sync by
// relaying binary updates (CRDT, so simultaneous typing always converges).
const rooms = new Map(); // token -> { doc, users: Map<socketId, name>, cleanup }
const EMPTY_ROOM_TTL = 30 * 60 * 1000;

const roomName = (token) => `collab:${token}`;

const userList = (room) => [...room.users.values()];

export const registerCollabHandlers = (io, socket) => {
  let joined = null; // token this socket is in

  const leave = () => {
    if (!joined) return;
    const token = joined;
    joined = null;
    const room = rooms.get(token);
    socket.leave(roomName(token));
    if (!room) return;
    room.users.delete(socket.id);
    io.to(roomName(token)).emit("collab:users", userList(room));
    if (room.users.size === 0) {
      room.cleanup = setTimeout(() => rooms.delete(token), EMPTY_ROOM_TTL);
    }
  };

  socket.on("collab:join", async (payload, ack) => {
    const reply = typeof ack === "function" ? ack : () => {};
    try {
      const token = String(payload?.token || "");
      const name = String(payload?.name || "Guest").trim().slice(0, 30) || "Guest";

      const session = await CollabSession.findOne({
        token,
        expiresAt: { $gt: new Date() },
      });
      if (!session) return reply({ ok: false, message: "Session has ended" });

      let room = rooms.get(token);
      if (!room) {
        const snippet = await Snippet.findById(session.snippet).select("code");
        if (!snippet) return reply({ ok: false, message: "Snippet not found" });
        const doc = new Y.Doc();
        doc.getText("code").insert(0, snippet.code || "");
        room = { doc, users: new Map(), cleanup: null };
        rooms.set(token, room);
      }
      if (room.cleanup) {
        clearTimeout(room.cleanup);
        room.cleanup = null;
      }

      leave();
      joined = token;
      socket.join(roomName(token));
      room.users.set(socket.id, name);
      io.to(roomName(token)).emit("collab:users", userList(room));

      reply({ ok: true, state: Buffer.from(Y.encodeStateAsUpdate(room.doc)) });
    } catch (error) {
      console.log("collab:join error", error.message);
      reply({ ok: false, message: "Could not join the session" });
    }
  });

  socket.on("collab:update", (update) => {
    if (!joined) return;
    const room = rooms.get(joined);
    if (!room) return;
    try {
      const bytes = new Uint8Array(update);
      Y.applyUpdate(room.doc, bytes);
      socket.to(roomName(joined)).emit("collab:update", Buffer.from(bytes));
    } catch (error) {
      console.log("collab:update error", error.message);
    }
  });

  socket.on("collab:leave", leave);
  socket.on("disconnect", leave);
};
