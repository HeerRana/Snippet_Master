"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { FaGithub } from "react-icons/fa";
import { API_URL } from "@/utils/apiConfig";
import { useUserContext } from "@/context/userContext";
import useRedirect from "@/hooks/useUserRedirect";
import { ISnippet } from "@/types/types";

// Import snippets from a GitHub Gist and export snippets back as a Gist.
// The GitHub token is only sent with the request and is never stored.
function GistPage() {
  useRedirect("/login");
  const userId = useUserContext().user?._id;

  const [gist, setGist] = useState("");
  const [importToken, setImportToken] = useState("");
  const [importPublic, setImportPublic] = useState(false);
  const [importing, setImporting] = useState(false);

  const [mySnippets, setMySnippets] = useState<ISnippet[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [exportToken, setExportToken] = useState("");
  const [exportPublic, setExportPublic] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportedUrl, setExportedUrl] = useState("");

  const loadSnippets = async () => {
    try {
      const res = await axios.get(`${API_URL}/snippets?limit=100`, {
        withCredentials: true,
      });
      setMySnippets(res.data.snippets);
    } catch (error) {
      toast.error("Could not load your snippets");
    }
  };

  useEffect(() => {
    if (userId) loadSnippets();
  }, [userId]);

  const importGist = async (e: React.FormEvent) => {
    e.preventDefault();
    setImporting(true);
    try {
      const res = await axios.post(
        `${API_URL}/gist/import`,
        { gist, token: importToken || undefined, isPublic: importPublic },
        { withCredentials: true }
      );
      toast.success(`Imported ${res.data.imported} snippet(s)`);
      setGist("");
      loadSnippets();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Import failed");
    } finally {
      setImporting(false);
    }
  };

  const exportGist = async (e: React.FormEvent) => {
    e.preventDefault();
    setExporting(true);
    setExportedUrl("");
    try {
      const res = await axios.post(
        `${API_URL}/gist/export`,
        { snippetIds: selected, token: exportToken, isPublic: exportPublic },
        { withCredentials: true }
      );
      setExportedUrl(res.data.url);
      toast.success("Gist created");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const inputClass =
    "w-full px-3 py-2 border-2 border-rgba-3 rounded-md bg-1 text-white placeholder-gray-400 outline-[#6FCF97]";
  const buttonClass =
    "px-4 py-2 rounded-md bg-[#7263F3] text-white font-semibold hover:bg-[#6FCF97] transition-colors disabled:opacity-50";

  return (
    <main className="p-8 max-w-4xl">
      <h1 className="flex items-center gap-3 text-2xl font-bold text-white">
        <FaGithub /> GitHub Gists
      </h1>
      <p className="mt-1 text-gray-400">
        Bring snippets in from a Gist, or send your snippets out as one.
      </p>

      <form onSubmit={importGist} className="mt-8 p-6 rounded-lg bg-2 border border-rgba-3 space-y-3">
        <h2 className="text-xl font-semibold text-white">Import from Gist</h2>
        <input
          value={gist}
          onChange={(e) => setGist(e.target.value)}
          placeholder="https://gist.github.com/user/abc123… or the gist id"
          className={inputClass}
        />
        <input
          type="password"
          value={importToken}
          onChange={(e) => setImportToken(e.target.value)}
          placeholder="GitHub token (only needed for secret gists)"
          className={inputClass}
        />
        <label className="flex items-center gap-2 text-gray-300 text-sm">
          <input
            type="checkbox"
            checked={importPublic}
            onChange={(e) => setImportPublic(e.target.checked)}
          />
          Make imported snippets public
        </label>
        <button type="submit" disabled={!gist || importing} className={buttonClass}>
          {importing ? "Importing…" : "Import"}
        </button>
      </form>

      <form onSubmit={exportGist} className="mt-8 p-6 rounded-lg bg-2 border border-rgba-3 space-y-3">
        <h2 className="text-xl font-semibold text-white">Export to Gist</h2>
        <p className="text-sm text-gray-400">
          Create a token at github.com/settings/tokens with only the{" "}
          <b>gist</b> scope. It is used for this request only and is not saved.
        </p>

        <ul className="max-h-60 overflow-y-auto border border-rgba-3 rounded-md divide-y divide-[var(--color--rgba-3)]">
          {mySnippets.length === 0 && (
            <li className="p-3 text-gray-400 text-sm">You have no snippets yet.</li>
          )}
          {mySnippets.map((s) => (
            <li key={s._id}>
              <label className="flex items-center gap-3 px-3 py-2 cursor-pointer text-gray-300">
                <input
                  type="checkbox"
                  checked={selected.includes(s._id)}
                  onChange={() => toggle(s._id)}
                />
                <span className="flex-1 truncate">{s.title}</span>
                <span className="text-xs text-gray-400">{s.language}</span>
              </label>
            </li>
          ))}
        </ul>

        <input
          type="password"
          value={exportToken}
          onChange={(e) => setExportToken(e.target.value)}
          placeholder="GitHub personal access token (gist scope)"
          className={inputClass}
        />
        <label className="flex items-center gap-2 text-gray-300 text-sm">
          <input
            type="checkbox"
            checked={exportPublic}
            onChange={(e) => setExportPublic(e.target.checked)}
          />
          Public gist (otherwise secret)
        </label>
        <button
          type="submit"
          disabled={selected.length === 0 || !exportToken || exporting}
          className={buttonClass}
        >
          {exporting ? "Exporting…" : `Export ${selected.length || ""} snippet(s)`}
        </button>

        {exportedUrl && (
          <p className="text-sm text-gray-300">
            Created:{" "}
            <a
              href={exportedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#7263F3] hover:underline"
            >
              {exportedUrl}
            </a>
          </p>
        )}
      </form>
    </main>
  );
}

export default GistPage;
