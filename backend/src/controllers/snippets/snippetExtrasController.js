import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import crypto from "node:crypto";
import Snippet from "../../models/snippets/SnippetModel.js";
import SnippetComment from "../../models/snippets/SnippetCommentModel.js";
import ShareLink from "../../models/snippets/ShareLinkModel.js";

const isId = (id) => mongoose.Types.ObjectId.isValid(id);

const populate = (query) =>
  query
    .populate("tags", "name")
    .populate("user", "_id name photo")
    .populate("forkedFrom", "_id title");

/* ------------------------------ forking ------------------------------ */

// POST /snippet/:id/fork
export const forkSnippet = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isId(id)) return res.status(400).json({ message: "Invalid snippet id" });

  const original = await Snippet.findById(id);
  // only public snippets (or your own) can be forked
  if (
    !original ||
    (!original.isPublic && original.user.toString() !== req.user._id.toString())
  ) {
    return res.status(404).json({ message: "Snippet not found" });
  }

  const fork = new Snippet({
    title: original.title,
    description: original.description,
    code: original.code,
    language: original.language,
    tags: original.tags,
    isPublic: false, // forks start private, the owner can publish them later
    user: req.user._id,
    forkedFrom: original._id,
  });
  await fork.save();

  original.forkCount = (original.forkCount || 0) + 1;
  await original.save();

  return res.status(201).json(await populate(Snippet.findById(fork._id)));
});

/* ------------------------- inline line comments ------------------------- */

// can the requester see this snippet? (public, or owner)
const canViewSnippet = (snippet, user) =>
  snippet.isPublic || (user && snippet.user.toString() === user._id.toString());

// GET /snippet/:id/comments
export const getComments = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isId(id)) return res.status(400).json({ message: "Invalid snippet id" });

  const snippet = await Snippet.findById(id).select("isPublic user");
  if (!snippet || !canViewSnippet(snippet, req.user)) {
    return res.status(404).json({ message: "Snippet not found" });
  }

  const comments = await SnippetComment.find({ snippet: id })
    .sort({ line: 1, createdAt: 1 })
    .populate("user", "_id name photo");
  return res.status(200).json(comments);
});

// POST /snippet/:id/comments  { line, text }
export const addComment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const line = parseInt(req.body.line);
  const text = (req.body.text || "").trim();

  if (!isId(id)) return res.status(400).json({ message: "Invalid snippet id" });
  if (!line || line < 1) return res.status(400).json({ message: "Invalid line number" });
  if (!text || text.length > 1000) {
    return res.status(400).json({ message: "Comment must be 1-1000 characters" });
  }

  const snippet = await Snippet.findById(id).select("isPublic user code");
  if (!snippet || !canViewSnippet(snippet, req.user)) {
    return res.status(404).json({ message: "Snippet not found" });
  }
  if (line > snippet.code.split("\n").length) {
    return res.status(400).json({ message: "Line does not exist in this snippet" });
  }

  const comment = await SnippetComment.create({
    snippet: id,
    user: req.user._id,
    line,
    text,
  });
  const populated = await comment.populate("user", "_id name photo");

  const io = req.app.get("io");
  if (io && snippet.isPublic) {
    io.to("public-snippets").emit("comment-added", populated);
  }

  return res.status(201).json(populated);
});

// DELETE /snippet/:id/comments/:commentId  (comment author or snippet owner)
export const deleteComment = asyncHandler(async (req, res) => {
  const { id, commentId } = req.params;
  if (!isId(id) || !isId(commentId)) {
    return res.status(400).json({ message: "Invalid id" });
  }

  const comment = await SnippetComment.findOne({ _id: commentId, snippet: id });
  if (!comment) return res.status(404).json({ message: "Comment not found" });

  const snippet = await Snippet.findById(id).select("user");
  const isAuthor = comment.user.toString() === req.user._id.toString();
  const isOwner = snippet && snippet.user.toString() === req.user._id.toString();
  if (!isAuthor && !isOwner) {
    return res.status(403).json({ message: "Not allowed" });
  }

  await comment.deleteOne();
  return res.status(200).json({ message: "Comment deleted" });
});

/* --------------------------- private share links --------------------------- */

// POST /snippet/:id/share  { expiresInHours?, password? }
export const createShareLink = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isId(id)) return res.status(400).json({ message: "Invalid snippet id" });

  const snippet = await Snippet.findOne({ _id: id, user: req.user._id });
  if (!snippet) return res.status(404).json({ message: "Snippet not found" });

  const hours = Number(req.body.expiresInHours);
  const password = (req.body.password || "").toString();

  const link = await ShareLink.create({
    snippet: snippet._id,
    createdBy: req.user._id,
    token: crypto.randomBytes(24).toString("hex"),
    passwordHash: password ? await bcrypt.hash(password, 10) : undefined,
    expiresAt:
      hours > 0 && hours <= 24 * 365
        ? new Date(Date.now() + hours * 60 * 60 * 1000)
        : undefined,
  });

  return res.status(201).json({
    _id: link._id,
    token: link.token,
    expiresAt: link.expiresAt || null,
    hasPassword: !!link.passwordHash,
  });
});

// GET /snippet/:id/share  -> links of my snippet
export const listShareLinks = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isId(id)) return res.status(400).json({ message: "Invalid snippet id" });

  const links = await ShareLink.find({ snippet: id, createdBy: req.user._id })
    .sort({ createdAt: -1 })
    .select("token expiresAt passwordHash createdAt");

  return res.status(200).json(
    links.map((l) => ({
      _id: l._id,
      token: l.token,
      expiresAt: l.expiresAt || null,
      hasPassword: !!l.passwordHash,
      createdAt: l.createdAt,
    }))
  );
});

// DELETE /share/:linkId
export const revokeShareLink = asyncHandler(async (req, res) => {
  if (!isId(req.params.linkId)) return res.status(400).json({ message: "Invalid id" });
  await ShareLink.deleteOne({ _id: req.params.linkId, createdBy: req.user._id });
  return res.status(200).json({ message: "Link revoked" });
});

// POST /shared/:token  { password? }  -> anyone holding the link
export const openShareLink = asyncHandler(async (req, res) => {
  const link = await ShareLink.findOne({ token: req.params.token });
  if (!link || (link.expiresAt && link.expiresAt < new Date())) {
    return res.status(404).json({ message: "This link is invalid or has expired" });
  }

  if (link.passwordHash) {
    const password = (req.body.password || "").toString();
    if (!password) {
      return res.status(401).json({ message: "Password required", passwordRequired: true });
    }
    if (!(await bcrypt.compare(password, link.passwordHash))) {
      return res.status(401).json({ message: "Wrong password", passwordRequired: true });
    }
  }

  const snippet = await populate(Snippet.findById(link.snippet));
  if (!snippet) return res.status(404).json({ message: "Snippet not found" });

  return res.status(200).json({ snippet, expiresAt: link.expiresAt || null });
});

/* ------------------------------- embed ------------------------------- */

const escapeHtml = (s = "") =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// GET /embed/:id  -> self-contained HTML page for an <iframe> (public snippets only)
export const embedSnippet = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const theme = req.query.theme === "light" ? "light" : "dark";
  const snippet = isId(id)
    ? await Snippet.findOne({ _id: id, isPublic: true })
    : null;

  if (!snippet) return res.status(404).send("Snippet not found");

  const clientUrl = (process.env.CLIENT_URL || "")
    .split(",")[0]
    .trim()
    .replace(/\/$/, "");
  const link = `${clientUrl}/snippet/${snippet.title
    .toLowerCase()
    .split(" ")
    .join("-")}-${snippet._id}`;
  const c =
    theme === "light"
      ? { bg: "#ffffff", fg: "#1f2328", bar: "#f1f3f5", border: "#d0d7de" }
      : { bg: "#181818", fg: "#e6e6e6", bar: "#252525", border: "#333" };

  // this route must be frameable, so override the global frame protection
  res.removeHeader("X-Frame-Options");
  res.setHeader("Content-Security-Policy", "frame-ancestors *");
  res.type("html").send(`<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(snippet.title)}</title>
<style>
body{margin:0;background:${c.bg};color:${c.fg};font-family:system-ui,sans-serif}
.bar{background:${c.bar};padding:8px 14px;display:flex;justify-content:space-between;font-size:13px;border-bottom:1px solid ${c.border}}
.bar a{color:#7263F3;text-decoration:none;font-weight:600}
pre{margin:0;padding:14px;overflow:auto;font:13px/1.5 ui-monospace,Menlo,Consolas,monospace}
</style></head><body>
<div class="bar"><span>${escapeHtml(snippet.title)} · ${escapeHtml(snippet.language)}</span>
<a href="${escapeHtml(link)}" target="_blank" rel="noopener">View on Snippy</a></div>
<pre><code>${escapeHtml(snippet.code)}</code></pre></body></html>`);
});
