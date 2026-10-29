import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import Snippet from "../../models/snippets/SnippetModel.js";
import Tags from "../../models/tags/TagsModel.js";

const GITHUB_API = "https://api.github.com";

const EXT_TO_LANGUAGE = {
  js: "javascript", jsx: "javascript", mjs: "javascript", ts: "typescript",
  tsx: "typescript", py: "python", java: "java", c: "c", cpp: "c++", cc: "c++",
  cs: "c#", go: "go", rb: "ruby", rs: "rust", php: "php", swift: "swift",
  kt: "kotlin", lua: "lua", r: "r", sql: "sql", html: "html", css: "css",
  json: "json", sh: "bash", md: "markdown", hs: "haskell",
};

const LANGUAGE_TO_EXT = Object.fromEntries(
  Object.entries(EXT_TO_LANGUAGE).reverse().map(([ext, lang]) => [lang, ext])
);

const githubHeaders = (token) => ({
  Accept: "application/vnd.github+json",
  "User-Agent": "snippet-master",
  "X-GitHub-Api-Version": "2022-11-28",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

// accepts a bare gist id or a gist.github.com URL
const parseGistId = (input = "") => {
  const match = String(input)
    .trim()
    .match(/([0-9a-f]{20,40})(?:[/?#].*)?$/i);
  return match ? match[1] : null;
};

const getOrCreateTag = async (name, userId) => {
  let tag = await Tags.findOne({ name });
  if (!tag) tag = await Tags.create({ name, user: userId });
  return tag._id;
};

// POST /gist/import  { gist: "<url or id>", token?: "<github PAT for secret gists>", isPublic? }
export const importGist = asyncHandler(async (req, res) => {
  const gistId = parseGistId(req.body.gist);
  if (!gistId) {
    return res.status(400).json({ message: "Enter a valid gist URL or id" });
  }

  const response = await fetch(`${GITHUB_API}/gists/${gistId}`, {
    headers: githubHeaders(req.body.token),
  });

  if (response.status === 404) {
    return res.status(404).json({ message: "Gist not found (secret gists need a token)" });
  }
  if (response.status === 403 || response.status === 429) {
    return res.status(429).json({ message: "GitHub rate limit reached, try again later or add a token" });
  }
  if (!response.ok) {
    return res.status(502).json({ message: "Could not reach GitHub" });
  }

  const gist = await response.json();
  const files = Object.values(gist.files || {}).filter(
    (f) => f.content && f.content.trim().length >= 10 && !f.truncated
  );
  if (files.length === 0) {
    return res.status(400).json({ message: "Gist has no importable files" });
  }

  const tagId = await getOrCreateTag("gist", req.user._id);
  const isPublic = req.body.isPublic === true;

  const created = [];
  for (const file of files.slice(0, 20)) {
    const ext = file.filename.split(".").pop().toLowerCase();
    const snippet = await Snippet.create({
      title: file.filename.length >= 3 ? file.filename : `${file.filename}.txt`,
      description: gist.description || `Imported from GitHub Gist ${gistId}`,
      code: file.content,
      language: EXT_TO_LANGUAGE[ext] || file.language?.toLowerCase() || "javascript",
      tags: [tagId],
      isPublic,
      user: req.user._id,
    });
    created.push(snippet._id);
  }

  const snippets = await Snippet.find({ _id: { $in: created } })
    .populate("tags", "name")
    .populate("user", "_id name photo");

  return res.status(201).json({ imported: snippets.length, snippets });
});

// POST /gist/export  { snippetIds: [...], token, isPublic? }
// The GitHub token is only used for this request and is never stored.
export const exportGist = asyncHandler(async (req, res) => {
  const { snippetIds, token } = req.body;

  if (!token) {
    return res.status(400).json({ message: "A GitHub personal access token (gist scope) is required" });
  }
  if (!Array.isArray(snippetIds) || snippetIds.length === 0 || snippetIds.length > 20) {
    return res.status(400).json({ message: "Select between 1 and 20 snippets" });
  }
  if (!snippetIds.every((id) => mongoose.Types.ObjectId.isValid(id))) {
    return res.status(400).json({ message: "Invalid snippet id" });
  }

  const snippets = await Snippet.find({ _id: { $in: snippetIds }, user: req.user._id });
  if (snippets.length === 0) {
    return res.status(404).json({ message: "Snippets not found" });
  }

  const files = {};
  for (const s of snippets) {
    const ext = LANGUAGE_TO_EXT[s.language] || "txt";
    let name = `${s.title.replace(/[^\w.-]+/g, "_")}.${ext}`;
    while (files[name]) name = `${Date.now()}_${name}`;
    files[name] = { content: s.code };
  }

  const response = await fetch(`${GITHUB_API}/gists`, {
    method: "POST",
    headers: { ...githubHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({
      description:
        snippets.length === 1 ? snippets[0].description : "Exported from Snippet Master",
      public: req.body.isPublic === true,
      files,
    }),
  });

  if (response.status === 401 || response.status === 403) {
    return res.status(400).json({ message: "GitHub rejected the token (needs the gist scope)" });
  }
  if (!response.ok) {
    return res.status(502).json({ message: "GitHub could not create the gist" });
  }

  const gist = await response.json();
  return res.status(201).json({ url: gist.html_url, id: gist.id });
});
