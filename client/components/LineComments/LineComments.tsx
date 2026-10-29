"use client";
import React, { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { API_URL } from "@/utils/apiConfig";

export interface ILineComment {
  _id: string;
  line: number;
  text: string;
  createdAt: string;
  user: { _id: string; name: string; photo?: string };
}

interface Props {
  snippetId: string;
  snippetOwnerId?: string;
  currentUserId?: string;
  selectedLine: number | null;
  comments: ILineComment[];
  onChange: (comments: ILineComment[]) => void;
  onSelectLine: (line: number | null) => void;
}

// Review style comments for the line the user clicked in the code block.
function LineComments({
  snippetId,
  snippetOwnerId,
  currentUserId,
  selectedLine,
  comments,
  onChange,
  onSelectLine,
}: Props) {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  const visible = selectedLine
    ? comments.filter((c) => c.line === selectedLine)
    : comments;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLine || !text.trim()) return;
    if (!currentUserId) {
      toast.error("Please log in to comment");
      return;
    }

    setSaving(true);
    try {
      const res = await axios.post(
        `${API_URL}/snippet/${snippetId}/comments`,
        { line: selectedLine, text },
        { withCredentials: true }
      );
      onChange(
        [...comments, res.data].sort(
          (a, b) => a.line - b.line || a.createdAt.localeCompare(b.createdAt)
        )
      );
      setText("");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Could not add comment");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (commentId: string) => {
    try {
      await axios.delete(`${API_URL}/snippet/${snippetId}/comments/${commentId}`, {
        withCredentials: true,
      });
      onChange(comments.filter((c) => c._id !== commentId));
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Could not delete comment");
    }
  };

  return (
    <div className="px-6 py-4 bg-4 border-t-2 border-rgba-3 rounded-b-lg">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-white">
          {selectedLine ? `Comments on line ${selectedLine}` : "Line comments"}
        </h4>
        {selectedLine && (
          <button
            onClick={() => onSelectLine(null)}
            className="text-sm text-[#7263F3] hover:underline"
          >
            Show all
          </button>
        )}
      </div>

      {visible.length === 0 ? (
        <p className="text-sm text-gray-400">
          {selectedLine
            ? "No comments on this line yet."
            : "Click any line of code above to start a review comment."}
        </p>
      ) : (
        <ul className="space-y-3 mb-3">
          {visible.map((c) => (
            <li key={c._id} className="text-sm border border-rgba-3 rounded-md p-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">
                  <b>{c.user?.name}</b>{" "}
                  <button
                    onClick={() => onSelectLine(c.line)}
                    className="text-[#7263F3] hover:underline"
                  >
                    line {c.line}
                  </button>{" "}
                  <span className="text-gray-400">
                    · {new Date(c.createdAt).toLocaleString()}
                  </span>
                </span>
                {(c.user?._id === currentUserId ||
                  snippetOwnerId === currentUserId) &&
                  currentUserId && (
                    <button
                      onClick={() => remove(c._id)}
                      className="text-red-500 hover:underline"
                    >
                      Delete
                    </button>
                  )}
              </div>
              <p className="mt-1 text-gray-300 whitespace-pre-wrap">{c.text}</p>
            </li>
          ))}
        </ul>
      )}

      {selectedLine && (
        <form onSubmit={submit} className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={1000}
            placeholder={`Comment on line ${selectedLine}…`}
            className="flex-1 px-3 py-2 border-2 border-rgba-3 rounded-md bg-1 text-white placeholder-gray-400 outline-[#6FCF97]"
          />
          <button
            type="submit"
            disabled={saving || !text.trim()}
            className="px-4 py-2 rounded-md bg-[#7263F3] text-white font-semibold hover:bg-[#6FCF97] transition-colors disabled:opacity-50"
          >
            Comment
          </button>
        </form>
      )}
    </div>
  );
}

export default LineComments;
