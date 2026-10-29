import mongoose from "mongoose";

// A frozen copy of a snippet's content, saved every time the snippet changes.
const SnippetVersionSchema = new mongoose.Schema(
  {
    snippet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Snippet",
      required: true,
      index: true,
    },
    versionNumber: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    code: { type: String, required: true },
    language: { type: String, default: "javascript" },
    // why this version exists: "Edited", "Before restore of v3", ...
    note: { type: String, default: "Edited" },
    savedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

SnippetVersionSchema.index({ snippet: 1, versionNumber: -1 });

export default mongoose.model("SnippetVersion", SnippetVersionSchema);
