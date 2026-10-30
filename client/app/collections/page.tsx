"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { FaFolder, FaTrash, FaPen } from "react-icons/fa";
import { API_URL } from "@/utils/apiConfig";
import { useUserContext } from "@/context/userContext";
import useRedirect from "@/hooks/useUserRedirect";
import Snippet from "@/components/Snippet/Snippet";
import { ISnippet } from "@/types/types";

interface CollectionItem {
  _id: string;
  name: string;
  description: string;
  count: number;
}

// Folders for snippets, e.g. "React hooks". Snippets can live in many folders.
function CollectionsPage() {
  useRedirect("/login");
  const userId = useUserContext().user?._id;

  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [selected, setSelected] = useState<CollectionItem | null>(null);
  const [snippets, setSnippets] = useState<ISnippet[]>([]);
  const [loadingSnippets, setLoadingSnippets] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const loadCollections = async (keepId?: string) => {
    try {
      const res = await axios.get(`${API_URL}/collections`, {
        withCredentials: true,
      });
      const list: CollectionItem[] = res.data.collections;
      setCollections(list);
      const id = keepId || selected?._id;
      setSelected(list.find((c) => c._id === id) || null);
    } catch (error) {
      toast.error("Could not load collections");
    }
  };

  const openCollection = async (c: CollectionItem) => {
    setSelected(c);
    setLoadingSnippets(true);
    try {
      const res = await axios.get(`${API_URL}/collections/${c._id}`, {
        withCredentials: true,
      });
      setSnippets(res.data.snippets);
    } catch (error) {
      toast.error("Could not load this collection");
    } finally {
      setLoadingSnippets(false);
    }
  };

  useEffect(() => {
    if (userId) loadCollections();
  }, [userId]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        `${API_URL}/collections`,
        { name, description },
        { withCredentials: true }
      );
      setName("");
      setDescription("");
      toast.success("Collection created");
      await loadCollections(res.data._id);
      setSnippets([]);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Could not create collection");
    }
  };

  const rename = async () => {
    if (!selected) return;
    const next = window.prompt("Rename collection", selected.name);
    if (!next || next.trim() === selected.name) return;
    try {
      await axios.patch(
        `${API_URL}/collections/${selected._id}`,
        { name: next },
        { withCredentials: true }
      );
      await loadCollections(selected._id);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Could not rename");
    }
  };

  const remove = async () => {
    if (!selected) return;
    if (!window.confirm(`Delete "${selected.name}"? The snippets themselves are kept.`)) return;
    try {
      await axios.delete(`${API_URL}/collections/${selected._id}`, {
        withCredentials: true,
      });
      setSelected(null);
      setSnippets([]);
      toast.success("Collection deleted");
      await loadCollections("");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Could not delete");
    }
  };

  const removeSnippet = async (snippetId: string) => {
    if (!selected) return;
    try {
      await axios.delete(
        `${API_URL}/collections/${selected._id}/snippets/${snippetId}`,
        { withCredentials: true }
      );
      setSnippets((prev) => prev.filter((s) => s._id !== snippetId));
      loadCollections(selected._id);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Could not remove");
    }
  };

  const inputClass =
    "w-full px-3 py-2 border-2 border-rgba-3 rounded-md bg-1 text-white placeholder-gray-400 outline-[#6FCF97]";

  return (
    <main className="p-8">
      <h1 className="flex items-center gap-3 text-2xl font-bold text-white">
        <FaFolder /> Collections
      </h1>
      <p className="mt-1 text-gray-400">
        Group snippets into folders. Use the folder button on any snippet to add it.
      </p>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        <aside className="space-y-4">
          <form onSubmit={create} className="p-4 rounded-lg bg-2 border border-rgba-3 space-y-2">
            <h2 className="font-semibold text-white">New collection</h2>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              placeholder="e.g. React hooks"
              className={inputClass}
            />
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={200}
              placeholder="Description (optional)"
              className={inputClass}
            />
            <button
              type="submit"
              disabled={name.trim().length < 2}
              className="w-full px-4 py-2 rounded-md bg-[#7263F3] text-white font-semibold hover:bg-[#6FCF97] transition-colors disabled:opacity-50"
            >
              Create
            </button>
          </form>

          <ul className="rounded-lg bg-2 border border-rgba-3 divide-y divide-[var(--color--rgba-3)] overflow-hidden">
            {collections.length === 0 && (
              <li className="p-4 text-sm text-gray-400">No collections yet.</li>
            )}
            {collections.map((c) => (
              <li key={c._id}>
                <button
                  onClick={() => openCollection(c)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-rgba-3 ${
                    selected?._id === c._id ? "bg-rgba-3" : ""
                  }`}
                >
                  <FaFolder className="text-[#7263F3]" />
                  <span className="flex-1 truncate text-gray-200">{c.name}</span>
                  <span className="text-xs text-gray-400">{c.count}</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section>
          {!selected ? (
            <p className="text-gray-400">Select a collection to see its snippets.</p>
          ) : (
            <>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-white">{selected.name}</h2>
                  {selected.description && (
                    <p className="text-sm text-gray-400">{selected.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={rename}
                    title="Rename"
                    className="w-10 h-10 flex items-center justify-center rounded-md bg-rgba-3 text-blue-400"
                  >
                    <FaPen />
                  </button>
                  <button
                    onClick={remove}
                    title="Delete collection"
                    className="w-10 h-10 flex items-center justify-center rounded-md bg-rgba-3 text-red-500"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>

              {loadingSnippets && <p className="mt-4 text-gray-400">Loading…</p>}
              {!loadingSnippets && snippets.length === 0 && (
                <p className="mt-4 text-gray-400">
                  This collection is empty. Open a snippet and use the folder button to add it.
                </p>
              )}

              <div className="mt-4 grid grid-cols-1 xl:grid-cols-2 gap-6">
                {snippets.map((s) => (
                  <div key={s._id} className="space-y-2">
                    <Snippet snippet={s} />
                    <button
                      onClick={() => removeSnippet(s._id)}
                      className="text-sm text-red-400 hover:underline"
                    >
                      Remove from this collection
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

export default CollectionsPage;
