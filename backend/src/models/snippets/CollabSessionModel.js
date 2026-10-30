import mongoose from "mongoose";

// Live editing session for one snippet. Anyone holding the token can join.
const CollabSessionSchema = new mongoose.Schema(
  {
    snippet: { type: mongoose.Schema.Types.ObjectId, ref: "Snippet", required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    token: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// MongoDB removes the session automatically after expiresAt
CollabSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("CollabSession", CollabSessionSchema);
