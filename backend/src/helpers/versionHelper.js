import SnippetVersion from "../models/snippets/SnippetVersionModel.js";

const MAX_VERSIONS = 50;

// Save the current content of a snippet document as a new version.
export const saveVersion = async (snippet, userId, note = "Edited") => {
  const last = await SnippetVersion.findOne({ snippet: snippet._id })
    .sort({ versionNumber: -1 })
    .select("versionNumber");

  const version = await SnippetVersion.create({
    snippet: snippet._id,
    versionNumber: (last?.versionNumber || 0) + 1,
    title: snippet.title,
    description: snippet.description,
    code: snippet.code,
    language: snippet.language,
    note,
    savedBy: userId,
  });

  // keep history bounded
  const extra = await SnippetVersion.find({ snippet: snippet._id })
    .sort({ versionNumber: -1 })
    .skip(MAX_VERSIONS)
    .select("_id");
  if (extra.length) {
    await SnippetVersion.deleteMany({ _id: { $in: extra.map((v) => v._id) } });
  }

  return version;
};

// true when any versioned field differs between the snippet and the incoming data
export const contentChanged = (snippet, next) =>
  ["title", "description", "code", "language"].some(
    (key) => next[key] !== undefined && next[key] !== "" && next[key] !== snippet[key]
  );
