import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import Collection from "../../models/snippets/CollectionModel.js";
import Snippet from "../../models/snippets/SnippetModel.js";

const validId = (id) => mongoose.Types.ObjectId.isValid(id);

// the signed-in user's collections with snippet counts
export const listCollections = asyncHandler(async (req, res) => {
  const collections = await Collection.find({ user: req.user._id }).sort({
    updatedAt: -1,
  });
  res.status(200).json({
    collections: collections.map((c) => ({
      _id: c._id,
      name: c.name,
      description: c.description,
      count: c.snippets.length,
      snippetIds: c.snippets,
      updatedAt: c.updatedAt,
    })),
  });
});

export const createCollection = asyncHandler(async (req, res) => {
  const name = String(req.body?.name || "").trim();
  const description = String(req.body?.description || "").trim();

  if (name.length < 2) {
    return res.status(400).json({ message: "Name must be at least 2 characters" });
  }

  try {
    const collection = await Collection.create({
      user: req.user._id,
      name: name.slice(0, 60),
      description: description.slice(0, 200),
    });
    res.status(201).json(collection);
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: "You already have a collection with that name" });
    }
    throw error;
  }
});

export const updateCollection = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!validId(id)) return res.status(400).json({ message: "Invalid id" });

  const collection = await Collection.findOne({ _id: id, user: req.user._id });
  if (!collection) return res.status(404).json({ message: "Collection not found" });

  if (req.body.name !== undefined) {
    const name = String(req.body.name).trim();
    if (name.length < 2) {
      return res.status(400).json({ message: "Name must be at least 2 characters" });
    }
    collection.name = name.slice(0, 60);
  }
  if (req.body.description !== undefined) {
    collection.description = String(req.body.description).trim().slice(0, 200);
  }

  try {
    await collection.save();
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: "You already have a collection with that name" });
    }
    throw error;
  }
  res.status(200).json(collection);
});

export const deleteCollection = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!validId(id)) return res.status(400).json({ message: "Invalid id" });

  const result = await Collection.deleteOne({ _id: id, user: req.user._id });
  if (!result.deletedCount) {
    return res.status(404).json({ message: "Collection not found" });
  }
  res.status(200).json({ message: "Collection deleted" });
});

// one collection with its snippets (only ones the user is allowed to see)
export const getCollection = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!validId(id)) return res.status(400).json({ message: "Invalid id" });

  const collection = await Collection.findOne({ _id: id, user: req.user._id });
  if (!collection) return res.status(404).json({ message: "Collection not found" });

  const snippets = await Snippet.find({
    _id: { $in: collection.snippets },
    $or: [{ isPublic: true }, { user: req.user._id }],
  })
    .populate("tags", "name")
    .populate("user", "_id name photo")
    .populate("forkedFrom", "_id title")
    .sort({ createdAt: -1 });

  res.status(200).json({
    collection: {
      _id: collection._id,
      name: collection.name,
      description: collection.description,
    },
    snippets,
  });
});

export const addToCollection = asyncHandler(async (req, res) => {
  const { id, snippetId } = req.params;
  if (!validId(id) || !validId(snippetId)) {
    return res.status(400).json({ message: "Invalid id" });
  }

  const collection = await Collection.findOne({ _id: id, user: req.user._id });
  if (!collection) return res.status(404).json({ message: "Collection not found" });

  const snippet = await Snippet.findOne({
    _id: snippetId,
    $or: [{ isPublic: true }, { user: req.user._id }],
  }).select("_id");
  if (!snippet) return res.status(404).json({ message: "Snippet not found" });

  await Collection.updateOne(
    { _id: id },
    { $addToSet: { snippets: snippet._id } }
  );
  res.status(200).json({ message: "Added to collection" });
});

export const removeFromCollection = asyncHandler(async (req, res) => {
  const { id, snippetId } = req.params;
  if (!validId(id) || !validId(snippetId)) {
    return res.status(400).json({ message: "Invalid id" });
  }

  const result = await Collection.updateOne(
    { _id: id, user: req.user._id },
    { $pull: { snippets: snippetId } }
  );
  if (!result.matchedCount) {
    return res.status(404).json({ message: "Collection not found" });
  }
  res.status(200).json({ message: "Removed from collection" });
});
