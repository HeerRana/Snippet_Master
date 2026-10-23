import asyncHandler from "express-async-handler";
import Tags from "../../models/tags/TagsModel.js";

// Create a new tag
export const createTag = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const { name } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "Not Authotised! Please Login" });
    }

    if (!name || name === "") {
      return res.status(400).json({ message: "Tag name is required" });
    }

    const tag = await Tags.create({
      name,
      user: userId,
    });

    await tag.save();

    return res.status(201).json(tag);
  } catch (error) {
    console.log("Error in createTag", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

export const getTags = asyncHandler(async (req, res) => {
  try {
    const tags = await Tags.find({}).sort({ usageCount: -1, name: 1 });

    return res.status(200).json(tags);
  } catch (error) {
    console.log("Error in getTags", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

export const getTagsByUser = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const tags = await Tags.find({ user: userId }).sort({ usageCount: -1, name: 1 });

    return res.status(200).json(tags);
  } catch (error) {
    console.log("Error in getTagsByUser", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

export const getTagById = asyncHandler(async (req, res) => {
  try {
    const tag = await Tags.findById(req.params.id);

    if (!tag) {
      return res.status(404).json({ message: "Tag not found" });
    }

    return res.status(200).json(tag);
  } catch (error) {
    console.log("Error in getTagById", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

export const deleteTag = asyncHandler(async (req, res) => {
  try {
    const tag = await Tags.findById(req.params.id);

    if (!tag) {
      return res.status(404).json({ message: "Tag not found" });
    }

    await Tags.findByIdAndDelete(req.params.id);

    return res.status(200).json({ message: "Tag deleted" });
  } catch (error) {
    console.log("Error in deleteTag", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// Bulk add tags --> only admin can do this
export const bulkAddTags = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;

    const { tags } = req.body; // expecting an array of tag names

    if (!userId) {
      return res.status(400).json({ message: "Not Authotised! Login" });
    }

    if (!tags || tags.length === 0 || !Array.isArray(tags)) {
      return res.status(400).json({ message: "No tags provided" });
    }

    const createdTags = [];
    const existingTags = [];

    for (const tagName of tags) {
      // Check if tag already exists
      const existingTag = await Tags.findOne({ name: tagName });
      
      if (existingTag) {
        existingTags.push(existingTag);
      } else {
        // Create new tag
        const newTag = await Tags.create({
          name: tagName,
          user: userId,
        });
        createdTags.push(newTag);
      }
    }

    return res.status(201).json({ 
      message: "Tags processed", 
      createdTags,
      existingTags,
      totalProcessed: tags.length
    });
  } catch (error) {
    console.log("Error in bulkAddTags", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// Update tag usage count
export const updateTagUsage = asyncHandler(async (req, res) => {
  try {
    const { tagId } = req.params;
    const { increment = 1 } = req.body;

    const tag = await Tags.findById(tagId);
    
    if (!tag) {
      return res.status(404).json({ message: "Tag not found" });
    }

    tag.usageCount += increment;
    await tag.save();

    return res.status(200).json(tag);
  } catch (error) {
    console.log("Error in updateTagUsage", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});
