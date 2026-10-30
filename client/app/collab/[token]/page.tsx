"use client";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import axios from "axios";
import { io, Socket } from "socket.io-client";
import * as Y from "yjs";
import toast from "react-hot-toast";
import { FaUsers, FaLink, FaSave, FaStop, FaCopy } from "react-icons/fa";
import { API_URL, SERVER_URL } from "@/utils/apiConfig";
import { useUserContext } from "@/context/userContext";
import LoadingSpinner from "@/components/LoadingSpinner";

interface Props {
  params: { token: string };
}

interface SessionInfo {
  snippetId: string;
  title: string;
  language: string;
  ownerName: string;
  isOwner: boolean;
}

// Map a cursor position through a Yjs text delta so remote edits don't make
// the local caret jump.
const mapPosition = (pos: number, delta: any[]) => {
  let idx = 0;
  let out = pos;
  for (const d of delta) {
    if (d.retain) {
      idx += d.retain;
    } else if (d.insert) {
      if (idx <= pos) out += d.insert.length;
    } else if (d.delete) {
      if (idx < pos) out -= Math.min(d.delete, pos - idx);
      idx += d.delete;
    }
  }
  return Math.max(0, out);
};

// Live collaborative editor. Edits are CRDT updates (Yjs) relayed by the
// backend over Socket.IO, so simultaneous typing always converges.
function CollabPage({ params: { token } }: Props) {
  const { user } = useUserContext();
  const [info, setInfo] = useState<SessionInfo | null>(null);
  const [error, setError] = useState("");
  const [guestName, setGuestName] = useState("");
  const [ready, setReady] = useState(false);
  const [text, setText] = useState("");
  const [users, setUsers] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);
  const [ended, setEnded] = useState(false);
  const [saving, setSaving] = useState(false);

  const ytextRef = useRef<Y.Text | null>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const pendingSel = useRef<[number, number] | null>(null);

  const displayName = user?.name || guestName.trim();
  const needsName = !user?._id && !ready;

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${API_URL}/collab/${token}`, {
          withCredentials: true,
        });
        setInfo(res.data);
      } catch (err: any) {
        setError(err.response?.data?.message || "Could not open this session");
      }
    })();
  }, [token]);

  const [started, setStarted] = useState(false);
  useEffect(() => {
    if (info && user?._id) setStarted(true);
  }, [info, user?._id]);

  // connect once we know who is joining
  useEffect(() => {
    if (!info || !started || !displayName) return;

    const doc = new Y.Doc();
    const ytext = doc.getText("code");
    ytextRef.current = ytext;

    const socket: Socket = io(SERVER_URL, {
      transports: ["websocket", "polling"],
      withCredentials: true,
    });

    const join = () => {
      socket.emit("collab:join", { token, name: displayName }, (res: any) => {
        if (!res?.ok) {
          setError(res?.message || "Could not join");
          return;
        }
        Y.applyUpdate(doc, new Uint8Array(res.state), "remote");
        setText(ytext.toString());
        setReady(true);
      });
    };

    socket.on("connect", () => {
      setConnected(true);
      join();
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on("collab:users", (list: string[]) => setUsers(list));
    socket.on("collab:update", (update: ArrayBuffer) => {
      Y.applyUpdate(doc, new Uint8Array(update), "remote");
    });
    socket.on("collab:ended", () => {
      setEnded(true);
      toast("The owner ended this live session");
    });

    // send our own edits
    doc.on("update", (update: Uint8Array, origin: unknown) => {
      if (origin !== "remote") socket.emit("collab:update", update);
    });

    // keep the textarea in sync, preserving the caret on remote edits
    ytext.observe((event, tr) => {
      if (tr.origin === "remote" && areaRef.current) {
        const { selectionStart, selectionEnd } = areaRef.current;
        pendingSel.current = [
          mapPosition(selectionStart, event.delta as any[]),
          mapPosition(selectionEnd, event.delta as any[]),
        ];
      }
      setText(ytext.toString());
    });

    return () => {
      socket.emit("collab:leave");
      socket.close();
      doc.destroy();
      ytextRef.current = null;
    };
  }, [info, started, displayName, token]);

  useLayoutEffect(() => {
    if (pendingSel.current && areaRef.current) {
      areaRef.current.setSelectionRange(...pendingSel.current);
      pendingSel.current = null;
    }
  }, [text]);

  // turn a textarea change into a minimal Yjs insert/delete
  const applyLocalChange = (next: string) => {
    const ytext = ytextRef.current;
    if (!ytext) return;
    const prev = ytext.toString();
    let start = 0;
    while (start < prev.length && start < next.length && prev[start] === next[start]) start++;
    let endPrev = prev.length;
    let endNext = next.length;
    while (endPrev > start && endNext > start && prev[endPrev - 1] === next[endNext - 1]) {
      endPrev--;
      endNext--;
    }
    ytext.doc?.transact(() => {
      if (endPrev > start) ytext.delete(start, endPrev - start);
      if (endNext > start) ytext.insert(start, next.slice(start, endNext));
    }, "local");
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Tab") return;
    e.preventDefault();
    const el = e.currentTarget;
    const { selectionStart, selectionEnd, value } = el;
    const next = value.slice(0, selectionStart) + "  " + value.slice(selectionEnd);
    applyLocalChange(next);
    pendingSel.current = [selectionStart + 2, selectionStart + 2];
  };

  const copyInvite = async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast.success("Invite link copied");
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(text);
    toast.success("Code copied");
  };

  const saveToSnippet = async () => {
    if (!info) return;
    setSaving(true);
    try {
      await axios.patch(
        `${API_URL}/snippet/${info.snippetId}`,
        { code: text },
        { withCredentials: true }
      );
      toast.success("Saved to your snippet (previous version kept in history)");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Could not save");
    } finally {
      setSaving(false);
    }
  };

  const endSession = async () => {
    if (!window.confirm("End the live session for everyone?")) return;
    try {
      await axios.delete(`${API_URL}/collab/${token}`, { withCredentials: true });
      setEnded(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Could not end the session");
    }
  };

  if (error) {
    return (
      <main className="p-8">
        <h1 className="text-2xl text-red-400">{error}</h1>
      </main>
    );
  }
  if (!info) return <LoadingSpinner />;

  if (needsName && !started) {
    return (
      <main className="p-8 flex justify-center">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (guestName.trim()) setStarted(true);
          }}
          className="w-full max-w-md p-8 rounded-lg bg-2 border border-rgba-3 space-y-4"
        >
          <h1 className="text-xl font-semibold text-white">Join live session</h1>
          <p className="text-sm text-gray-400">
            {info.ownerName} invited you to edit <b>{info.title}</b> together. Log in to join
            with your account, or pick a display name.
          </p>
          <input
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            maxLength={30}
            placeholder="Your name"
            autoFocus
            className="w-full px-3 py-2 border-2 border-rgba-3 rounded-md bg-1 text-white outline-[#6FCF97]"
          />
          <button
            type="submit"
            disabled={!guestName.trim()}
            className="w-full px-4 py-2 rounded-md bg-[#7263F3] text-white font-semibold hover:bg-[#6FCF97] transition-colors disabled:opacity-50"
          >
            Join
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="p-8 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">{info.title}</h1>
          <p className="text-sm text-gray-400 flex items-center gap-2">
            <span
              className={`inline-block w-2 h-2 rounded-full ${
                connected && !ended ? "bg-green-500" : "bg-red-500"
              }`}
            />
            {ended ? "Session ended" : connected ? "Live" : "Reconnecting…"} · {info.language}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-2 px-3 py-2 rounded-md bg-rgba-3 text-sm text-gray-300">
            <FaUsers /> {users.length} editing: {users.join(", ") || "just you"}
          </span>
          <button
            onClick={copyInvite}
            className="px-3 py-2 flex items-center gap-2 rounded-md bg-rgba-3 text-gray-200 hover:bg-rgba-2"
          >
            <FaLink /> Invite link
          </button>
          <button
            onClick={copyCode}
            className="px-3 py-2 flex items-center gap-2 rounded-md bg-rgba-3 text-gray-200 hover:bg-rgba-2"
          >
            <FaCopy /> Copy code
          </button>
          {info.isOwner && (
            <>
              <button
                onClick={saveToSnippet}
                disabled={saving || ended}
                className="px-3 py-2 flex items-center gap-2 rounded-md bg-[#7263F3] text-white font-semibold hover:bg-[#6FCF97] transition-colors disabled:opacity-50"
              >
                <FaSave /> {saving ? "Saving…" : "Save to snippet"}
              </button>
              <button
                onClick={endSession}
                disabled={ended}
                className="px-3 py-2 flex items-center gap-2 rounded-md bg-rgba-3 text-red-500 hover:bg-rgba-2 disabled:opacity-50"
              >
                <FaStop /> End
              </button>
            </>
          )}
        </div>
      </div>

      <textarea
        ref={areaRef}
        value={text}
        onChange={(e) => applyLocalChange(e.target.value)}
        onKeyDown={onKeyDown}
        disabled={!ready || ended}
        spellCheck={false}
        className="w-full h-[65vh] p-4 font-mono text-[0.95rem] leading-6 rounded-lg border-2 border-rgba-3 bg-1 text-white outline-[#6FCF97] resize-none"
        style={{ tabSize: 2 }}
      />
      <p className="text-xs text-gray-400">
        Everyone with the link can edit. Only the owner can save the result back to the snippet.
      </p>
    </main>
  );
}

export default CollabPage;
