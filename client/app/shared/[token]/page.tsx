"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import SyntaxHighlighter from "react-syntax-highlighter";
import { vs, vs2015 } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { API_URL } from "@/utils/apiConfig";
import { useTheme } from "@/context/themeContext";
import LoadingSpinner from "@/components/LoadingSpinner";
import { ISnippet } from "@/types/types";

interface Props {
  params: { token: string };
}

// Opens a private share link: read-only view, optional password, optional expiry.
function SharedSnippetPage({ params: { token } }: Props) {
  const { theme } = useTheme();
  const [snippet, setSnippet] = useState<ISnippet | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const open = async (pw?: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${API_URL}/shared/${token}`, { password: pw });
      setSnippet(res.data.snippet);
      setExpiresAt(res.data.expiresAt);
      setNeedsPassword(false);
    } catch (err: any) {
      if (err.response?.data?.passwordRequired) {
        setNeedsPassword(true);
        if (pw) setError(err.response.data.message);
      } else {
        setError(err.response?.data?.message || "Could not open this link");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    open();
  }, [token]);

  if (loading && !snippet) return <LoadingSpinner />;

  if (needsPassword) {
    return (
      <main className="p-8 flex justify-center">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            open(password);
          }}
          className="w-full max-w-md p-8 rounded-lg bg-2 border border-rgba-3 space-y-4"
        >
          <h1 className="text-xl font-semibold text-white">Password required</h1>
          <p className="text-gray-400 text-sm">
            The owner protected this snippet with a password.
          </p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border-2 border-rgba-3 rounded-md bg-1 text-white outline-[#6FCF97]"
            placeholder="Password"
            autoFocus
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full px-4 py-2 rounded-md bg-[#7263F3] text-white font-semibold hover:bg-[#6FCF97] transition-colors"
          >
            Open snippet
          </button>
        </form>
      </main>
    );
  }

  if (!snippet) {
    return (
      <main className="p-8">
        <h1 className="text-2xl text-red-400">{error || "Link not found"}</h1>
      </main>
    );
  }

  return (
    <main className="p-8 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-white">{snippet.title}</h1>
        <p className="text-gray-400">{snippet.description}</p>
        <p className="mt-1 text-sm text-gray-400">
          Shared privately by {snippet.user?.name}
          {expiresAt && ` · link expires ${new Date(expiresAt).toLocaleString()}`}
        </p>
      </div>
      <div className="border-2 border-rgba-3 rounded-lg overflow-hidden">
        <SyntaxHighlighter
          language={snippet.language}
          showLineNumbers
          style={theme === "light" ? vs : vs2015}
          customStyle={{
            fontSize: "1.1rem",
            margin: 0,
            background: theme === "light" ? "#f8f9fc" : "#181818",
          }}
        >
          {snippet.code}
        </SyntaxHighlighter>
      </div>
    </main>
  );
}

export default SharedSnippetPage;
