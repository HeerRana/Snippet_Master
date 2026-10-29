"use client";
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { API_URL } from "@/utils/apiConfig";
import { diffLines } from "@/utils/lineDiff";
import { ISnippet } from "@/types/types";

interface Version {
  _id: string;
  versionNumber: number;
  title: string;
  description: string;
  code: string;
  language: string;
  note: string;
  createdAt: string;
  savedBy?: { name: string };
}

interface Props {
  snippet: ISnippet;
  onClose: () => void;
  // called with the restored snippet so the parent can refresh
  onRestored: (snippet: ISnippet) => void;
}

function VersionHistoryModal({ snippet, onClose, onRestored }: Props) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${API_URL}/snippet/${snippet._id}/versions`, {
          withCredentials: true,
        });
        setVersions(res.data);
        if (res.data.length) setSelectedId(res.data[0]._id);
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Could not load history");
      } finally {
        setLoading(false);
      }
    })();
  }, [snippet._id]);

  const selected = versions.find((v) => v._id === selectedId);

  // diff: selected old version -> what the snippet is now
  const diff = useMemo(
    () => (selected ? diffLines(selected.code, snippet.code) : []),
    [selected, snippet.code]
  );
  const added = diff.filter((d) => d.type === "added").length;
  const removed = diff.filter((d) => d.type === "removed").length;

  const restore = async () => {
    if (!selected) return;
    if (
      !confirm(
        `Restore version ${selected.versionNumber}? Your current code is saved to history first.`
      )
    )
      return;

    setRestoring(true);
    try {
      const res = await axios.post(
        `${API_URL}/snippet/${snippet._id}/versions/${selected._id}/restore`,
        {},
        { withCredentials: true }
      );
      toast.success(`Restored version ${selected.versionNumber}`);
      onRestored(res.data);
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Restore failed");
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-2 w-full max-w-5xl max-h-[90vh] rounded-lg shadow-xl border border-rgba-2 flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-rgba-3">
          <h3 className="text-xl font-semibold text-white">
            Version history · {snippet.title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <p className="p-8 text-gray-400">Loading…</p>
        ) : versions.length === 0 ? (
          <p className="p-8 text-gray-400">
            No earlier versions yet. A version is saved automatically every time
            you edit this snippet.
          </p>
        ) : (
          <div className="flex flex-col md:flex-row min-h-0 flex-1">
            <ul className="md:w-64 shrink-0 overflow-y-auto border-b md:border-b-0 md:border-r border-rgba-3 max-h-48 md:max-h-none">
              {versions.map((v) => (
                <li key={v._id}>
                  <button
                    onClick={() => setSelectedId(v._id)}
                    className={`w-full text-left px-4 py-3 border-b border-rgba-3 hover:bg-rgba-3 ${
                      v._id === selectedId ? "bg-rgba-2" : ""
                    }`}
                  >
                    <span className="block font-semibold text-white">
                      v{v.versionNumber}
                    </span>
                    <span className="block text-xs text-gray-400">{v.note}</span>
                    <span className="block text-xs text-gray-400">
                      {new Date(v.createdAt).toLocaleString()}
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            <div className="flex-1 min-w-0 flex flex-col">
              {selected && (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2 px-6 py-3 border-b border-rgba-3">
                    <p className="text-sm text-gray-300">
                      Comparing <b>v{selected.versionNumber}</b> → current:{" "}
                      <span className="text-green-500">+{added}</span>{" "}
                      <span className="text-red-500">−{removed}</span>
                    </p>
                    <button
                      onClick={restore}
                      disabled={restoring}
                      className="px-4 py-2 rounded-md bg-[#7263F3] text-white font-semibold hover:bg-[#6FCF97] transition-colors disabled:opacity-50"
                    >
                      {restoring ? "Restoring…" : `Restore v${selected.versionNumber}`}
                    </button>
                  </div>

                  {selected.title !== snippet.title && (
                    <p className="px-6 pt-3 text-sm text-gray-400">
                      Title in v{selected.versionNumber}: <b>{selected.title}</b>
                    </p>
                  )}

                  <pre className="flex-1 overflow-auto m-0 p-4 text-sm font-mono leading-6">
                    {diff.map((line, idx) => (
                      <div
                        key={idx}
                        className={
                          line.type === "added"
                            ? "bg-green-500/15 text-green-600"
                            : line.type === "removed"
                            ? "bg-red-500/15 text-red-500"
                            : "text-gray-400"
                        }
                      >
                        <span className="inline-block w-5 select-none">
                          {line.type === "added"
                            ? "+"
                            : line.type === "removed"
                            ? "−"
                            : " "}
                        </span>
                        {line.text || " "}
                      </div>
                    ))}
                  </pre>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default VersionHistoryModal;
