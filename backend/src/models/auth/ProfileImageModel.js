import mongoose from "mongoose";

// Profile picture stored in MongoDB (no external image service needed).
const ProfileImageSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    contentType: { type: String, required: true },
    data: { type: Buffer, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("ProfileImage", ProfileImageSchema);
