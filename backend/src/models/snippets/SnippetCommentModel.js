import mongoose from "mongoose";

// Comment attached to a specific line of a snippet (like a code review).
const SnippetCommentSchema = new mongoose.Schema(
  {
    snippet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Snippet",
      required: true,
      index: true,
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    line: { type: Number, required: true, min: 1 },
    text: { type: String, required: true, trim: true, maxLength: 1000 },
  },
  { timestamps: true }
);

export default mongoose.model("SnippetComment", SnippetCommentSchema);
