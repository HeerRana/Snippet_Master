import asyncHandler from "express-async-handler";
import crypto from "crypto";
import ApiToken from "../../models/auth/ApiTokenModel.js";

export const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const MAX_TOKENS = 10;

export const listApiTokens = asyncHandler(async (req, res) => {
  const tokens = await ApiToken.find({ user: req.user._id })
    .select("name prefix lastUsedAt createdAt")
    .sort({ createdAt: -1 });
  res.status(200).json({ tokens });
});

export const createApiToken = asyncHandler(async (req, res) => {
  const name = String(req.body?.name || "").trim() || "My token";

  if ((await ApiToken.countDocuments({ user: req.user._id })) >= MAX_TOKENS) {
    return res
      .status(400)
      .json({ message: `You can have at most ${MAX_TOKENS} tokens, delete one first` });
  }

  const token = `snp_${crypto.randomBytes(24).toString("hex")}`;
  const doc = await ApiToken.create({
    user: req.user._id,
    name: name.slice(0, 60),
    tokenHash: hashToken(token),
    prefix: token.slice(0, 8),
  });

  // the plain token is returned exactly once
  res.status(201).json({ token, id: doc._id, name: doc.name });
});

export const deleteApiToken = asyncHandler(async (req, res) => {
  const result = await ApiToken.deleteOne({
    _id: req.params.id,
    user: req.user._id,
  });
  if (!result.deletedCount) {
    return res.status(404).json({ message: "Token not found" });
  }
  res.status(200).json({ message: "Token deleted" });
});
