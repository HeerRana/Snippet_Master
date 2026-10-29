import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import Snippet from "../../models/snippets/SnippetModel.js";
import SnippetVersion from "../../models/snippets/SnippetVersionModel.js";
import { saveVersion } from "../../helpers/versionHelper.js";

const findOwnedSnippet = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ message: "Invalid snippet id" });
    return null;
  }
  const snippet = await Snippet.findOne({ _id: id, user: req.user._id });
  if (!snippet) {
    res.status(404).json({ message: "Snippet not found" });
    return null;
  }
  return snippet;
};

// GET /snippet/:id/versions
export const getVersions = asyncHandler(async (req, res) => {
  const snippet = await findOwnedSnippet(req, res);
  if (!snippet) return;

  const versions = await SnippetVersion.find({ snippet: snippet._id })
    .sort({ versionNumber: -1 })
    .populate("savedBy", "name");

  return res.status(200).json(versions);
});

// POST /snippet/:id/versions/:versionId/restore
export const restoreVersion = asyncHandler(async (req, res) => {
  const snippet = await findOwnedSnippet(req, res);
  if (!snippet) return;

  const { versionId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(versionId)) {
    return res.status(400).json({ message: "Invalid version id" });
  }

  const version = await SnippetVersion.findOne({
    _id: versionId,
    snippet: snippet._id,
  });
  if (!version) {
    return res.status(404).json({ message: "Version not found" });
  }

  // keep the current state so the rollback itself can be undone
  await saveVersion(
    snippet,
    req.user._id,
    `Before restore of v${version.versionNumber}`
  );

  snippet.title = version.title;
  snippet.description = version.description;
  snippet.code = version.code;
  snippet.language = version.language;
  await snippet.save();

  const updated = await Snippet.findById(snippet._id)
    .populate("tags", "name")
    .populate("user", "_id name photo");

  const io = req.app.get("io");
  if (io && updated.isPublic) {
    io.to("public-snippets").emit("snippet-updated", updated);
  }

  return res.status(200).json(updated);
});
