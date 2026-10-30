"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { FaFolder, FaFolderPlus, FaCheck } from "react-icons/fa";
import { API_URL } from "@/utils/apiConfig";
import { ISnippet } from "@/types/types";

interface CollectionItem {
  _id: string;
  name: string;
  count: number;
  snippetIds: string[];
}

interface Props {
  snippet: ISnippet;
  onClose: () => void;
}

// Pick the collections (folders) a snippet belongs to, or create a new one.
function AddToCollectionModal({ snippet, onClose }: Props) {
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await axios.get(`${API_URL}/collections`, {
        withCredentials: true,
      });
      setCollections(res.data.collections);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Could not load collections");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggle = async (c: CollectionItem) => {
    const has = c.snippetIds.includes(snippet._id);
    setBusyId(c._id);
    try {
      if (has) {
        await axios.delete(`${API_URL}/collections/${c._id}/snippets/${snippet._id}`, {
          withCredentials: true,
        });
      } else {
        await axios.put(
          `${API_URL}/collections/${c._id}/snippets/${snippet._id}`,
          {},
          { withCredentials: true }
        );
        toast.success(`Added to ${c.name}`);
      }
      await load();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Could not update collection");
    } finally {
      setBusyId(null);
    }
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      const res = await axios.post(
        `${API_URL}/collections`,
        { name },
        { withCredentials: true }
      );
      await axios.put(
        `${API_URL}/collections/${res.data._id}/snippets/${snippet._id}`,
        {},
        { withCredentials: true }
      );
      toast.success(`Added to ${res.data.name}`);
      setName("");
      await load();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Could not create collection");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-2 p-6 rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="flex items-center gap-2 text-xl font-semibold text-white">
            <FaFolderPlus /> Save to collection
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>

        <ul className="max-h-60 overflow-y-auto border border-rgba-3 rounded-md divide-y divide-[var(--color--rgba-3)]">
          {loading && <li className="p-3 text-sm text-gray-400">Loading…</li>}
          {!loading && collections.length === 0 && (
            <li className="p-3 text-sm text-gray-400">
              No collections yet. Create your first one below.
            </li>
          )}
          {collections.map((c) => {
            const has = c.snippetIds.includes(snippet._id);
            return (
              <li key={c._id}>
                <button
                  onClick={() => toggle(c)}
                  disabled={busyId === c._id}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left text-gray-300 hover:bg-rgba-3 disabled:opacity-50"
                >
                  <FaFolder className="text-[#7263F3]" />
                  <span className="flex-1 truncate">{c.name}</span>
                  <span className="text-xs text-gray-400">{c.count}</span>
                  {has && <FaCheck className="text-[#6BBE92]" />}
                </button>
              </li>
            );
          })}
        </ul>

        <form onSubmit={create} className="mt-4 flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            placeholder="New collection, e.g. React hooks"
            className="flex-1 px-3 py-2 border-2 border-rgba-3 rounded-md bg-1 text-white placeholder-gray-400 outline-[#6FCF97]"
          />
          <button
            type="submit"
            disabled={name.trim().length < 2}
            className="px-4 py-2 rounded-md bg-[#7263F3] text-white font-semibold hover:bg-[#6FCF97] transition-colors disabled:opacity-50"
          >
            Create
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddToCollectionModal;
