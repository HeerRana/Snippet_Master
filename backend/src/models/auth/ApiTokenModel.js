import mongoose from "mongoose";

// Personal access token for the VS Code extension.
// Only the sha256 hash is stored; the plain token is shown once at creation.
const ApiTokenSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 60 },
    tokenHash: { type: String, required: true, unique: true, index: true },
    prefix: { type: String, required: true },
    lastUsedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("ApiToken", ApiTokenSchema);
