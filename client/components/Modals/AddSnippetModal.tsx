"use client";
import { useGlobalContext } from "@/context/globalContext";
import { useSnippetContext } from "@/context/snippetsContext";
import useDetectOutside from "@/hooks/useDetectOutside";
import { ITag } from "@/types/types";
import { edit, plus } from "@/utils/Icons";
import React, { act, useEffect, useRef, useState } from "react";
import Button from "../Button/Button";

function AddSnippetModal() {
  const { modalMode, closeModal, activeSnippet } = useGlobalContext();
  const { createSnippet, tags, useTagColorMemo, updateSnippet } =
    useSnippetContext();
  const ref = useRef<HTMLDivElement>(null);

  const [activeTags, setActiveTags] = useState([]) as any;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [isPublic, setIsPublic] = useState(true);

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

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCode("");
    setLanguage("javascript");
    setIsPublic(true);
    setActiveTags([]);
  };

  const languages = [
    "c",
    "c#",
    "c++",
    "css",
    "django",
    "go",
    "haskell",
    "html",
    "java",
    "javascript",
    "json",
    "kotlin",
    "lua",
    "php",
    "python",
    "r",
    "ruby",
    "rust",
    "sql",
    "swift",
    "typescript",
  ];

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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const snippetData = {
      _id: activeSnippet?._id,
      title,
      description,
      code,
      language,
      isPublic,
      tags: activeTags.length > 0 ? activeTags.map((tag: ITag) => tag._id) : [],
    };

    if (modalMode === "edit-snippet") {
      updateSnippet(snippetData);

      closeModal();
    } else if (modalMode === "add-snippet") {
      const res = createSnippet(snippetData);

      if (res._id) {
        closeModal();
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
              <select
                name="language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full h-12 px-4 bg-1 text-white rounded-lg border-2 border-rgba-3 focus:border-[#7263F3] focus:bg-2 cursor-pointer transition-all duration-300"
              >
                {languages.map((lang) => (
                  <option key={lang} value={lang} className="bg-1">
                    {lang.charAt(0).toUpperCase() + lang.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Visibility Section */}
          <div>
            <label className="block text-white font-semibold mb-2">Visibility</label>
            <select
              name="isPublic"
              value={isPublic.toString()}
              onChange={(e) => setIsPublic(e.target.value === "true")}
              className="w-full h-12 px-4 bg-1 text-white rounded-lg border-2 border-rgba-3 focus:border-[#7263F3] focus:bg-2 cursor-pointer transition-all duration-300"
            >
              <option value="true" className="bg-1">🌍 Public - Anyone can view</option>
              <option value="false" className="bg-1">🔒 Private - Only you can view</option>
            </select>
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
            <label className="block text-white font-semibold mb-2">Code</label>
            <div className="relative">
              <textarea
                name="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full py-4 px-4 bg-1 text-white rounded-lg border-2 border-rgba-3 focus:border-[#7263F3] focus:bg-2 transition-all duration-300 font-mono text-sm resize-none"
                placeholder={`// Enter your ${language} code here...
// Use proper indentation and formatting
// Add comments to explain complex logic`}
                rows={15}
              />
              <div className="absolute top-2 right-2 text-xs text-gray-500 bg-1 px-2 py-1 rounded">
                {language.toUpperCase()}
              </div>
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
            </div>
            <p className="text-gray-400 text-sm mt-2">
              {tags && tags.length > 0 
                ? "Select relevant tags to help others discover your snippet"
                : "Tags are being loaded from the server..."
              }
            </p>
          </div>

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
              className="px-8 py-3 bg-gradient-to-r from-[#7263F3] to-[#6BBE92] text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-[#7263F3]/25 hover:scale-105 transition-all duration-300"
            >
              {modalMode === "edit-snippet" ? "Update Snippet" : "Create Snippet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddSnippetModal;
