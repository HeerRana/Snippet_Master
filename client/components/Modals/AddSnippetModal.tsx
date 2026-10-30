"use client";
import { useGlobalContext } from "@/context/globalContext";
import { useSnippetContext } from "@/context/snippetsContext";
import useDetectOutside from "@/hooks/useDetectOutside";
import { ITag } from "@/types/types";
import { edit, plus } from "@/utils/Icons";
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { FaMagic, FaFolderOpen, FaFolder, FaTimes } from "react-icons/fa";
import GlassSelect from "@/components/GlassSelect/GlassSelect";
import { API_URL } from "@/utils/apiConfig";
import { SUPPORTED_LANGUAGES, languageFromFilename } from "@/utils/languages";

const DRAFT_KEY = "snippy-snippet-draft-v1";
const MAX_FILE_BYTES = 300 * 1024;
const MAX_EXTRA_TAGS = 5;

interface Draft {
  title: string;
  description: string;
  code: string;
  language: string;
  isPublic: boolean;
  tagIds: string[];
  extraTags: string[];
  collectionIds: string[];
  savedAt: number;
}

interface CollectionItem {
  _id: string;
  name: string;
  count: number;
}

// browser storage can throw (private window, blocked site data): never let it break the form
const readDraft = (): Draft | null => {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
};
const writeDraft = (draft: Draft) => {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // ignore
  }
};
const clearDraft = () => {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // ignore
  }
};
const isEmptyForm = (d: { title: string; description: string; code: string }) =>
  !d.title.trim() && !d.description.trim() && !d.code.trim();

function AddSnippetModal() {
  const { modalMode, closeModal, activeSnippet } = useGlobalContext();
  const { createSnippet, tags, getTags, useTagColorMemo, updateSnippet } =
    useSnippetContext();
  const ref = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const isAdd = modalMode === "add-snippet";

  const [activeTags, setActiveTags] = useState([]) as any;
  const [extraTags, setExtraTags] = useState<string[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [isPublic, setIsPublic] = useState(true);

  const [dragging, setDragging] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [newCollection, setNewCollection] = useState("");
  const [newTag, setNewTag] = useState("");

  const [draft, setDraft] = useState<Draft | null>(null);

  // use the hook to detect outside click
  useDetectOutside({
    ref,
    callback: () => {
      closeModal();
      resetForm();
    },
  });

  useEffect(() => {
    if (modalMode === "edit-snippet" && activeSnippet) {
      // initialize activeTags and form fields with the activeSnippet data

      setActiveTags(activeSnippet.tags);
      setTitle(activeSnippet.title);
      setDescription(activeSnippet.description);
      setCode(activeSnippet.code);
      setLanguage(activeSnippet.language);
      setIsPublic(activeSnippet.isPublic);
    }
  }, [modalMode, activeSnippet]);

  // creating a snippet: offer a saved draft and load the user's collections
  useEffect(() => {
    if (!isAdd) return;
    const saved = readDraft();
    setDraft(saved && !isEmptyForm(saved) ? saved : null);

    (async () => {
      try {
        const res = await axios.get(`${API_URL}/collections`, {
          withCredentials: true,
        });
        setCollections(res.data.collections);
      } catch (error) {
        // collections are optional, the form works without them
      }
    })();
  }, [isAdd]);

  // autosave the draft shortly after every change (never saves an empty form,
  // so closing or resetting the modal cannot wipe a draft)
  useEffect(() => {
    if (!isAdd || isEmptyForm({ title, description, code })) return;
    const timer = setTimeout(() => {
      writeDraft({
        title,
        description,
        code,
        language,
        isPublic,
        tagIds: activeTags.map((t: ITag) => t._id),
        extraTags,
        collectionIds: selectedCollections,
        savedAt: Date.now(),
      });
      setDraft(null);
    }, 600);
    return () => clearTimeout(timer);
  }, [
    isAdd,
    title,
    description,
    code,
    language,
    isPublic,
    activeTags,
    extraTags,
    selectedCollections,
  ]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCode("");
    setLanguage("javascript");
    setIsPublic(true);
    setActiveTags([]);
    setExtraTags([]);
    setSelectedCollections([]);
    setNewCollection("");
  };

  const restoreDraft = () => {
    if (!draft) return;
    setTitle(draft.title || "");
    setDescription(draft.description || "");
    setCode(draft.code || "");
    setLanguage(draft.language || "javascript");
    setIsPublic(draft.isPublic !== false);
    setActiveTags(
      (draft.tagIds || [])
        .map((id) => tags.find((t: ITag) => t._id === id))
        .filter(Boolean)
    );
    setExtraTags(draft.extraTags || []);
    setSelectedCollections(draft.collectionIds || []);
    setDraft(null);
    toast.success("Draft restored");
  };

  const discardDraft = () => {
    clearDraft();
    setDraft(null);
  };

  const languages = [...SUPPORTED_LANGUAGES] as string[];

  const handleTags = (tag: ITag) => {
    const isTagActive = activeTags.some((activeTag: { _id: string }) => {
      return activeTag._id === tag._id;
    });

    if (isTagActive) {
      // remove from active tags
      setActiveTags(
        activeTags.filter((activeTag: { _id: string }) => {
          return activeTag._id !== tag._id;
        })
      );
    } else {
      // add to active tags
      setActiveTags([...activeTags, tag]);
    }
  };

  // ---------- load a file (button or drag and drop) ----------
  const loadFile = async (file: File) => {
    if (file.size > MAX_FILE_BYTES) {
      return toast.error("That file is too large (max 300 KB)");
    }
    const text = await file.text();
    if (text.includes("\u0000")) {
      return toast.error("That looks like a binary file, not code");
    }

    setCode(text);
    const lang = languageFromFilename(file.name);
    if (lang) setLanguage(lang);
    if (!title.trim()) setTitle(file.name.replace(/\.[^.]+$/, ""));
    toast.success(`Loaded ${file.name}`);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) loadFile(file);
  };

  // ---------- AI: fill empty fields from the code ----------
  const suggest = async () => {
    if (code.trim().length < 10) {
      return toast.error("Paste some code first");
    }
    setAiBusy(true);
    try {
      const res = await axios.post(
        `${API_URL}/suggest-snippet-details`,
        { code, existingTags: tags.map((t: ITag) => t.name) },
        { withCredentials: true }
      );
      const s = res.data;
      const filled: string[] = [];

      if (!title.trim() && s.title) {
        setTitle(s.title);
        filled.push("title");
      }
      if (!description.trim() && s.description) {
        setDescription(s.description);
        filled.push("description");
      }

      // tags: existing ones are selected, unknown ones become new tags
      const byName = new Map<string, ITag>(
        tags.map((t: ITag) => [t.name.toLowerCase(), t])
      );
      const matched: ITag[] = [];
      const fresh: string[] = [];
      for (const name of (s.tags || []) as string[]) {
        const known = byName.get(name.toLowerCase());
        if (known) matched.push(known);
        else fresh.push(name);
      }
      if (matched.length) {
        setActiveTags((prev: ITag[]) => [
          ...prev,
          ...matched.filter((m) => !prev.some((p) => p._id === m._id)),
        ]);
      }
      if (fresh.length) {
        setExtraTags((prev) =>
          Array.from(new Set([...prev, ...fresh])).slice(0, MAX_EXTRA_TAGS)
        );
      }
      if (matched.length || fresh.length) filled.push("tags");

      toast.success(
        filled.length
          ? `Filled: ${filled.join(", ")}`
          : "Your fields are already filled in"
      );
    } catch (error: any) {
      toast.error(
        error.response?.status === 404 && typeof error.response?.data !== "object"
          ? "AI suggestions are not available on this server yet. Deploy the latest backend."
          : error.response?.data?.message || "Could not get suggestions"
      );
    } finally {
      setAiBusy(false);
    }
  };

  // ---------- tags: type your own ----------
  const addCustomTag = () => {
    const name = newTag
      .trim()
      .replace(/^#/, "")
      .replace(/\s+/g, " ")
      .toLowerCase();

    if (name.length < 2 || name.length > 30) {
      return toast.error("A tag needs 2 to 30 characters");
    }

    // an existing tag with that name is simply selected
    const existing = tags.find((t: ITag) => t.name.toLowerCase() === name);
    if (existing) {
      if (!activeTags.some((a: ITag) => a._id === existing._id)) {
        setActiveTags([...activeTags, existing]);
      }
    } else if (!extraTags.includes(name)) {
      if (extraTags.length >= MAX_EXTRA_TAGS) {
        return toast.error(`You can add up to ${MAX_EXTRA_TAGS} new tags`);
      }
      setExtraTags([...extraTags, name]);
    }
    setNewTag("");
  };

  // ---------- collections ----------
  const toggleCollection = (id: string) =>
    setSelectedCollections((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );

  const createCollection = async () => {
    const name = newCollection.trim();
    if (name.length < 2) return;
    try {
      const res = await axios.post(
        `${API_URL}/collections`,
        { name },
        { withCredentials: true }
      );
      setCollections((prev) => [
        { _id: res.data._id, name: res.data.name, count: 0 },
        ...prev,
      ]);
      setSelectedCollections((prev) => [...prev, res.data._id]);
      setNewCollection("");
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Could not create the collection"
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;

    const tagIds = activeTags.map((tag: ITag) => tag._id);
    const snippetData = {
      _id: activeSnippet?._id,
      title,
      description,
      code,
      language,
      isPublic,
      // new (AI suggested) tags go by name, the server creates them
      tags: [...tagIds, ...extraTags],
    };

    if (modalMode === "edit-snippet") {
      const saved = updateSnippet(snippetData);

      closeModal();

      // new tags are created by the server, refresh the tag list once it has finished
      await saved;
      if (extraTags.length) getTags();
    } else if (isAdd) {
      setSubmitting(true);
      const created = await createSnippet(snippetData);
      setSubmitting(false);

      if (created?._id) {
        clearDraft();
        if (extraTags.length) getTags();

        if (selectedCollections.length) {
          const results = await Promise.allSettled(
            selectedCollections.map((id) =>
              axios.put(
                `${API_URL}/collections/${id}/snippets/${created._id}`,
                {},
                { withCredentials: true }
              )
            )
          );
          const added = results.filter((r) => r.status === "fulfilled").length;
          if (added) {
            toast.success(
              `Added to ${added} collection${added > 1 ? "s" : ""}`
            );
          }
        }
        resetForm();
      }
    }
  };

  return (
    <div className="fixed top-0 left-0 z-50 h-full w-full bg-black/60 backdrop-blur-sm overflow-hidden">
      <div
        ref={ref}
        className="max-h-[95vh] overflow-y-auto py-8 px-8 bg-gradient-to-br from-2 to-3 max-w-[1000px] w-full flex flex-col gap-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-rgba-3 shadow-2xl"
      >
        <form action="" className="flex flex-col gap-6" onSubmit={handleSubmit}>
          {/* Header */}
          <div className="text-center mb-4">
            <h1 className="text-4xl font-bold text-white mb-2">
              {modalMode === "edit-snippet" ? (
                <span className="flex items-center justify-center gap-3">
                  <span className="text-2xl">{edit}</span>
                  Edit Snippet
                </span>
              ) : (
                <span className="flex items-center justify-center gap-3">
                  <span className="text-2xl">{plus}</span>
                  Create New Snippet
                </span>
              )}
            </h1>
            <p className="text-gray-400">
              {modalMode === "edit-snippet"
                ? "Update your code snippet"
                : "Share your code with the community"
              }
            </p>
          </div>

          {/* Saved draft */}
          {isAdd && draft && (
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-[#7263F3]/40 bg-[#7263F3]/10">
              <p className="text-sm text-gray-200">
                You have an unsaved draft
                {draft.title ? ` “${draft.title}”` : ""} from{" "}
                {new Date(draft.savedAt).toLocaleString()}.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={restoreDraft}
                  className="px-4 py-1.5 bg-[#7263F3] text-white rounded-full text-sm font-semibold hover:bg-[#6FCF97] transition-colors"
                >
                  Restore draft
                </button>
                <button
                  type="button"
                  onClick={discardDraft}
                  className="px-4 py-1.5 bg-gray-600 text-white rounded-full text-sm"
                >
                  Discard
                </button>
              </div>
            </div>
          )}

          {/* Basic Info Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <label className="block text-white font-semibold mb-2">Snippet Title</label>
              <input
                type="text"
                name="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a descriptive title..."
                className="w-full h-12 px-4 bg-1 text-white rounded-lg border-2 border-rgba-3 focus:border-[#7263F3] focus:bg-2 transition-all duration-300"
              />
            </div>
            <div>
              <label className="block text-white font-semibold mb-2">Language</label>
              <GlassSelect
                value={language}
                onChange={setLanguage}
                options={languages.map((lang) => ({
                  value: lang,
                  label: lang.charAt(0).toUpperCase() + lang.slice(1),
                }))}
                ariaLabel="Language"
                className="w-full h-12 px-4 bg-1 text-white rounded-lg border-2 border-rgba-3"
              />
            </div>
          </div>

          {/* Visibility Section */}
          <div>
            <label className="block text-white font-semibold mb-2">Visibility</label>
            <GlassSelect
              value={isPublic.toString()}
              onChange={(v) => setIsPublic(v === "true")}
              options={[
                { value: "true", label: "🌍 Public - Anyone can view" },
                { value: "false", label: "🔒 Private - Only you can view" },
              ]}
              ariaLabel="Visibility"
              className="w-full h-12 px-4 bg-1 text-white rounded-lg border-2 border-rgba-3"
            />
          </div>

          {/* Description Section */}
          <div>
            <label className="block text-white font-semibold mb-2">Description</label>
            <textarea
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain what this code does, how to use it, or any important notes..."
              className="w-full py-3 px-4 bg-1 text-white rounded-lg border-2 border-rgba-3 focus:border-[#7263F3] focus:bg-2 transition-all duration-300 resize-none"
              rows={3}
            />
          </div>

          {/* Code Section */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <label className="block text-white font-semibold">Code</label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  className="px-3 py-1.5 flex items-center gap-2 rounded-full bg-rgba-3 text-gray-200 text-sm hover:bg-rgba-2 transition-colors"
                >
                  <FaFolderOpen /> Open file
                </button>
                <button
                  type="button"
                  onClick={suggest}
                  disabled={aiBusy || code.trim().length < 10}
                  className="px-4 py-1.5 flex items-center gap-2 rounded-full bg-[#7263F3] text-white text-sm font-semibold hover:bg-[#6FCF97] transition-colors disabled:opacity-50"
                >
                  <FaMagic />
                  {aiBusy ? "Thinking…" : "Suggest title, description & tags"}
                </button>
              </div>
            </div>
            <input
              ref={fileInput}
              type="file"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) loadFile(file);
                e.target.value = "";
              }}
            />
            <div
              className={`relative rounded-lg transition-shadow ${
                dragging ? "ring-2 ring-[#7263F3]" : ""
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
            >
              <textarea
                name="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full py-4 px-4 bg-1 text-white rounded-lg border-2 border-rgba-3 focus:border-[#7263F3] focus:bg-2 transition-all duration-300 font-mono text-sm resize-none"
                placeholder={`// Enter your ${language} code here...
// or drop a code file onto this box`}
                rows={15}
              />
              <div className="absolute top-2 right-2 text-xs text-gray-500 bg-1 px-2 py-1 rounded">
                {language.toUpperCase()}
              </div>
              {dragging && (
                <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-[#7263F3]/20 text-white font-semibold pointer-events-none">
                  Drop the file to load it
                </div>
              )}
            </div>
          </div>

          {/* Tags Section */}
          <div>
            <label className="block text-white font-semibold mb-3">
              Tags {tags.length > 0 && `(${tags.length} available)`}
            </label>
            <div className="flex flex-wrap gap-3 p-4 bg-1 rounded-lg border-2 border-rgba-3 min-h-[80px]">
              {tags && tags.length > 0 ? (
                tags.map((tag: ITag, index: number) => (
                  <button
                    key={tag._id || index}
                    type="button"
                    className={`py-2 px-4 text-white text-sm rounded-lg transition-all duration-300 hover:scale-105 cursor-pointer border ${
                      activeTags.some((activeTag: any) => activeTag._id === tag._id)
                        ? 'bg-gradient-to-r from-[#7263F3] to-[#6BBE92] shadow-lg border-[#7263F3]'
                        : 'bg-gray-700 hover:bg-gray-600 border-gray-600'
                    }`}
                    onClick={() => handleTags(tag)}
                  >
                    {tag.name}
                  </button>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center w-full text-center">
                  <div className="w-12 h-12 bg-rgba-3 rounded-full flex items-center justify-center mb-2">
                    <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 italic">Loading tags...</p>
                  <p className="text-gray-600 text-xs mt-1">Tags will appear here once loaded</p>
                </div>
              )}

              {/* new tags suggested by the AI, created when the snippet is saved */}
              {extraTags.map((name) => (
                <button
                  key={`new-${name}`}
                  type="button"
                  title="New tag, click to remove"
                  className="py-2 px-4 flex items-center gap-2 text-white text-sm rounded-lg border border-dashed border-[#6BBE92] bg-[#6BBE92]/15 hover:bg-[#6BBE92]/30 transition-colors"
                  onClick={() =>
                    setExtraTags((prev) => prev.filter((t) => t !== name))
                  }
                >
                  {name}
                  <span className="text-[10px] uppercase opacity-80">new</span>
                  <FaTimes className="text-[10px]" />
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <input
                type="text"
                value={newTag}
                maxLength={30}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustomTag();
                  }
                }}
                placeholder="Add your own tag, e.g. recursion"
                className="flex-1 min-w-[200px] h-10 px-3 text-sm bg-1 text-white rounded-lg border-2 border-rgba-3 focus:border-[#7263F3]"
              />
              <button
                type="button"
                onClick={addCustomTag}
                disabled={newTag.trim().length < 2}
                className="h-10 px-5 text-sm bg-[#7263F3] text-white rounded-full font-semibold hover:bg-[#6FCF97] transition-colors disabled:opacity-50"
              >
                Add tag
              </button>
            </div>
            <p className="text-gray-400 text-sm mt-2">
              {tags && tags.length > 0
                ? "Select relevant tags, or type your own, to help others discover your snippet"
                : "Tags are being loaded from the server..."
              }
            </p>
          </div>

          {/* Collections Section (new snippets) */}
          {isAdd && (
            <div>
              <label className="flex items-center gap-2 text-white font-semibold mb-3">
                <FaFolder className="text-[#7263F3]" /> Collections
                <span className="text-xs font-normal text-gray-400">
                  optional
                </span>
              </label>
              <div className="flex flex-wrap items-center gap-3 p-4 bg-1 rounded-lg border-2 border-rgba-3">
                {collections.map((c) => (
                  <button
                    key={c._id}
                    type="button"
                    onClick={() => toggleCollection(c._id)}
                    className={`py-2 px-4 text-white text-sm rounded-lg border transition-all duration-300 hover:scale-105 ${
                      selectedCollections.includes(c._id)
                        ? "bg-gradient-to-r from-[#7263F3] to-[#6BBE92] border-[#7263F3] shadow-lg"
                        : "bg-gray-700 hover:bg-gray-600 border-gray-600"
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
                {collections.length === 0 && (
                  <span className="text-sm text-gray-400">
                    No collections yet, create one:
                  </span>
                )}
                <input
                  type="text"
                  value={newCollection}
                  maxLength={60}
                  onChange={(e) => setNewCollection(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      createCollection();
                    }
                  }}
                  placeholder="New collection…"
                  className="h-10 px-3 text-sm bg-1 text-white rounded-lg border-2 border-rgba-3 focus:border-[#7263F3] min-w-[160px]"
                />
                <button
                  type="button"
                  onClick={createCollection}
                  disabled={newCollection.trim().length < 2}
                  className="h-10 px-4 text-sm bg-[#7263F3] text-white rounded-full font-semibold hover:bg-[#6FCF97] transition-colors disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-4 border-t border-rgba-3">
            <button
              type="button"
              className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-semibold hover:from-red-600 hover:to-red-700 hover:shadow-lg hover:shadow-red-500/25 transition-all duration-300"
              onClick={closeModal}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-3 bg-gradient-to-r from-[#7263F3] to-[#6BBE92] text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-[#7263F3]/25 hover:scale-105 transition-all duration-300 disabled:opacity-60"
            >
              {modalMode === "edit-snippet"
                ? "Update Snippet"
                : submitting
                ? "Creating…"
                : "Create Snippet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddSnippetModal;
