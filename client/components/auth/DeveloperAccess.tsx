"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { API_URL } from "@/utils/apiConfig";

interface TokenItem {
  _id: string;
  name: string;
  prefix: string;
  lastUsedAt?: string;
  createdAt: string;
}

// Personal access tokens, used to sign in the VS Code extension.
function DeveloperAccess() {
  const [tokens, setTokens] = useState<TokenItem[]>([]);
  const [name, setName] = useState("");
  const [fresh, setFresh] = useState("");

  const load = async () => {
    try {
      const res = await axios.get(`${API_URL}/api-tokens`, { withCredentials: true });
      setTokens(res.data.tokens);
    } catch (error) {
      // section stays empty if the request fails
    }
  };

  useEffect(() => {
    load();
  }, []);

  const create = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        `${API_URL}/api-tokens`,
        { name },
        { withCredentials: true }
      );
      setFresh(res.data.token);
      setName("");
      load();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Could not create token");
    }
  };

  const remove = async (id: string) => {
    try {
      await axios.delete(`${API_URL}/api-tokens/${id}`, { withCredentials: true });
      load();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Could not delete token");
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(fresh);
    toast.success("Token copied");
  };

  return (
    <div className="mt-10 p-6 rounded-lg bg-2 border border-rgba-3">
      <h2 className="text-xl font-semibold text-white">VS Code extension</h2>
      <p className="mt-1 text-sm text-gray-400">
        Create a token and paste it into the Snippet Master VS Code extension to save and
        search your snippets from the editor. Treat a token like a password.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          placeholder="Token name, e.g. My laptop"
          className="flex-1 min-w-[200px] px-3 py-2 border-2 border-rgba-3 rounded-md bg-1 text-white placeholder-gray-400"
        />
        <button
          onClick={create}
          className="px-4 py-2 rounded-md bg-[#7263F3] text-white font-semibold hover:bg-[#6FCF97] transition-colors"
        >
          Create token
        </button>
      </div>

      {fresh && (
        <div className="mt-4 p-3 rounded-md border border-[#6FCF97] bg-1">
          <p className="text-sm text-gray-300">
            Copy it now, it will not be shown again:
          </p>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 break-all text-sm text-white">{fresh}</code>
            <button
              onClick={copy}
              className="px-3 py-1 rounded-md bg-[#7263F3] text-white text-sm"
            >
              Copy
            </button>
          </div>
        </div>
      )}

      <ul className="mt-4 divide-y divide-[var(--color--rgba-3)]">
        {tokens.map((t) => (
          <li key={t._id} className="py-2 flex items-center gap-3 text-sm text-gray-300">
            <span className="flex-1 truncate">
              {t.name} <span className="text-gray-400">({t.prefix}…)</span>
            </span>
            <span className="text-xs text-gray-400">
              {t.lastUsedAt
                ? `used ${new Date(t.lastUsedAt).toLocaleDateString()}`
                : "never used"}
            </span>
            <button
              onClick={() => remove(t._id)}
              className="text-red-400 hover:underline"
            >
              Delete
            </button>
          </li>
        ))}
        {tokens.length === 0 && (
          <li className="py-2 text-sm text-gray-400">No tokens yet.</li>
        )}
      </ul>
    </div>
  );
}

export default DeveloperAccess;
