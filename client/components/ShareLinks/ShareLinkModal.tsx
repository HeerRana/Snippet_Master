"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { API_URL, SERVER_URL } from "@/utils/apiConfig";
import { ISnippet } from "@/types/types";

interface ShareLink {
  _id: string;
  token: string;
  expiresAt: string | null;
  hasPassword: boolean;
}

interface Props {
  snippet: ISnippet;
  onClose: () => void;
}

const EXPIRY_OPTIONS = [
  { label: "1 hour", hours: 1 },
  { label: "24 hours", hours: 24 },
  { label: "7 days", hours: 24 * 7 },
  { label: "30 days", hours: 24 * 30 },
  { label: "Never", hours: 0 },
];

// Private expiring / password protected links, plus the embed code for blogs.
function ShareLinkModal({ snippet, onClose }: Props) {
  const [links, setLinks] = useState<ShareLink[]>([]);
  const [hours, setHours] = useState(24);
  const [password, setPassword] = useState("");
  const [creating, setCreating] = useState(false);
  const [embedTheme, setEmbedTheme] = useState<"dark" | "light">("dark");

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const linkUrl = (token: string) => `${origin}/shared/${token}`;

  const embedCode = `<iframe src="${SERVER_URL}/api/v1/embed/${snippet._id}?theme=${embedTheme}" width="100%" height="320" style="border:0;border-radius:8px" loading="lazy" title="${snippet.title.replace(
    /"/g,
    "&quot;"
  )}"></iframe>`;

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${API_URL}/snippet/${snippet._id}/share`, {
          withCredentials: true,
        });
        setLinks(res.data);
      } catch (error) {
        // listing is optional, creating still works
      }
    })();
  }, [snippet._id]);

  const copy = async (text: string, message: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(message);
    } catch (error) {
      toast.error("Could not copy");
    }
  };

  const create = async () => {
    setCreating(true);
    try {
      const res = await axios.post(
        `${API_URL}/snippet/${snippet._id}/share`,
        { expiresInHours: hours, password },
        { withCredentials: true }
      );
      setLinks((prev) => [res.data, ...prev]);
      setPassword("");
      await copy(linkUrl(res.data.token), "Link created and copied");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Could not create link");
    } finally {
      setCreating(false);
    }
  };

  const revoke = async (id: string) => {
    try {
      await axios.delete(`${API_URL}/share/${id}`, { withCredentials: true });
      setLinks((prev) => prev.filter((l) => l._id !== id));
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Could not revoke link");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-2 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg shadow-xl border border-rgba-2 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">Share · {snippet.title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <section className="mb-6">
          <h4 className="font-semibold text-white mb-2">Private link</h4>
          <p className="text-sm text-gray-400 mb-3">
            Works even if the snippet is private. Optionally protect it with a
            password and make it expire.
          </p>
          <div className="flex flex-wrap gap-2">
            <select
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              className="px-3 py-2 border-2 border-rgba-3 rounded-md bg-1 text-white"
            >
              {EXPIRY_OPTIONS.map((o) => (
                <option key={o.hours} value={o.hours}>
                  Expires: {o.label}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (optional)"
              className="flex-1 min-w-[160px] px-3 py-2 border-2 border-rgba-3 rounded-md bg-1 text-white placeholder-gray-400"
            />
            <button
              onClick={create}
              disabled={creating}
              className="px-4 py-2 rounded-md bg-[#7263F3] text-white font-semibold hover:bg-[#6FCF97] transition-colors disabled:opacity-50"
            >
              Create link
            </button>
          </div>

          {links.length > 0 && (
            <ul className="mt-4 space-y-2">
              {links.map((l) => (
                <li
                  key={l._id}
                  className="flex items-center justify-between gap-2 border border-rgba-3 rounded-md px-3 py-2 text-sm"
                >
                  <span className="text-gray-300 truncate">
                    …{l.token.slice(0, 10)} ·{" "}
                    {l.expiresAt
                      ? `expires ${new Date(l.expiresAt).toLocaleString()}`
                      : "no expiry"}
                    {l.hasPassword ? " · 🔒 password" : ""}
                  </span>
                  <span className="flex gap-3 shrink-0">
                    <button
                      onClick={() => copy(linkUrl(l.token), "Link copied")}
                      className="text-[#7263F3] hover:underline"
                    >
                      Copy
                    </button>
                    <button
                      onClick={() => revoke(l._id)}
                      className="text-red-500 hover:underline"
                    >
                      Revoke
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h4 className="font-semibold text-white mb-2">Embed on your blog</h4>
          {snippet.isPublic === false ? (
            <p className="text-sm text-gray-400">
              Embedding only works for public snippets. Make this snippet public
              to embed it.
            </p>
          ) : (
            <>
              <div className="flex gap-2 mb-2">
                {(["dark", "light"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setEmbedTheme(t)}
                    className={`px-3 py-1 rounded-md border-2 text-sm ${
                      embedTheme === t
                        ? "border-[#7263F3] text-[#7263F3]"
                        : "border-rgba-3 text-gray-300"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <textarea
                readOnly
                value={embedCode}
                rows={3}
                className="w-full px-3 py-2 border-2 border-rgba-3 rounded-md bg-1 text-white text-xs font-mono"
              />
              <button
                onClick={() => copy(embedCode, "Embed code copied")}
                className="mt-2 px-4 py-2 rounded-md bg-[#7263F3] text-white font-semibold hover:bg-[#6FCF97] transition-colors"
              >
                Copy embed code
              </button>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export default ShareLinkModal;
