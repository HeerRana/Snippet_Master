import mongoose from "mongoose";

// A named folder of snippets, e.g. "React hooks".
const CollectionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 60 },
    description: { type: String, trim: true, maxlength: 200, default: "" },
    snippets: [{ type: mongoose.Schema.Types.ObjectId, ref: "Snippet" }],
  },
  { timestamps: true }
);

CollectionSchema.index({ user: 1, name: 1 }, { unique: true });

export default mongoose.model("Collection", CollectionSchema);
