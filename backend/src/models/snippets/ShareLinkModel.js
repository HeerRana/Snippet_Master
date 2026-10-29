import mongoose from "mongoose";

// Private share link: random token, optional password, optional expiry.
const ShareLinkSchema = new mongoose.Schema(
  {
    snippet: { type: mongoose.Schema.Types.ObjectId, ref: "Snippet", required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    token: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

// MongoDB removes the document automatically after expiresAt
ShareLinkSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("ShareLink", ShareLinkSchema);
