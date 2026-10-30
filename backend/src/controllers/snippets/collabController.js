import asyncHandler from "express-async-handler";
import crypto from "crypto";
import mongoose from "mongoose";
import Snippet from "../../models/snippets/SnippetModel.js";
import CollabSession from "../../models/snippets/CollabSessionModel.js";

const SESSION_HOURS = 6;

// owner starts (or reuses) a live editing session for one of their snippets
export const startCollab = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid id" });
  }

  const snippet = await Snippet.findOne({ _id: id, user: req.user._id }).select("_id");
  if (!snippet) return res.status(404).json({ message: "Snippet not found" });

  const expiresAt = new Date(Date.now() + SESSION_HOURS * 60 * 60 * 1000);

  let session = await CollabSession.findOne({
    snippet: snippet._id,
    owner: req.user._id,
    expiresAt: { $gt: new Date() },
  });

  if (session) {
    session.expiresAt = expiresAt;
    await session.save();
  } else {
    session = await CollabSession.create({
      snippet: snippet._id,
      owner: req.user._id,
      token: crypto.randomBytes(16).toString("hex"),
      expiresAt,
    });
  }

  res.status(200).json({ token: session.token, expiresAt: session.expiresAt });
});

// public: what the join page needs before connecting the socket
export const getCollab = asyncHandler(async (req, res) => {
  const session = await CollabSession.findOne({
    token: req.params.token,
    expiresAt: { $gt: new Date() },
  })
    .populate("snippet", "title language")
    .populate("owner", "_id name");

  if (!session || !session.snippet) {
    return res.status(404).json({ message: "This live session has ended or does not exist" });
  }

  res.status(200).json({
    snippetId: session.snippet._id,
    title: session.snippet.title,
    language: session.snippet.language,
    ownerName: session.owner?.name,
    isOwner: !!req.user && String(req.user._id) === String(session.owner?._id),
    expiresAt: session.expiresAt,
  });
});

// owner ends the session and kicks everyone out
export const endCollab = asyncHandler(async (req, res) => {
  const session = await CollabSession.findOneAndDelete({
    token: req.params.token,
    owner: req.user._id,
  });
  if (!session) return res.status(404).json({ message: "Session not found" });

  const io = req.app.get("io");
  if (io) io.to(`collab:${session.token}`).emit("collab:ended");

  res.status(200).json({ message: "Live session ended" });
});
