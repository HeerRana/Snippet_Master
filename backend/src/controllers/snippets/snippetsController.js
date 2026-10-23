import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import Snippet from "../../models/snippets/SnippetModel.js";

export const createSnippet = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const { title, description, code, language, tags, isPublic } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized! Please login" });
    }

    if (!title || title.length < 3) {
      return res.status(400).json({
        message: "Title is required and should be at least 3 characters long",
      });
    }

    if (!description || description.length < 10) {
      return res.status(400).json({
        message:
          "Description is required and should be at least 10 characters long",
      });
    }

    if (!code || code.length < 10) {
      return res.status(400).json({
        message: "Code is required and should be at least 10 characters long",
      });
    }

    // check if tags are provided
    if (!tags || tags.length === 0) {
      return res.status(400).json({ message: "Please provide at least one tag" });
    }

    // Process tags - handle both ObjectIds and string tags
    const processedTags = [];
    for (const tag of tags) {
      if (mongoose.Types.ObjectId.isValid(tag)) {
        // If it's a valid ObjectId, use it directly
        processedTags.push(tag);
      } else if (typeof tag === 'string' && tag.trim()) {
        // If it's a string, try to find or create the tag
        try {
          const Tags = mongoose.model('Tags');
          let existingTag = await Tags.findOne({ name: tag.trim().toLowerCase() });
          
          if (!existingTag) {
            // Create new tag
            existingTag = await Tags.create({
              name: tag.trim().toLowerCase(),
              user: userId,
            });
          }
          processedTags.push(existingTag._id);
        } catch (error) {
          console.log("Error processing tag:", error);
          return res.status(400).json({ message: `Invalid tag: ${tag}` });
        }
      } else {
        return res.status(400).json({ message: `Invalid tag format: ${tag}` });
      }
    }

    const snippet = new Snippet({
      title,
      description,
      code,
      language,
      tags: processedTags,
      isPublic,
      user: userId,
    });

    await snippet.save();

    // Populate user and tags for real-time broadcast
    const populatedSnippet = await Snippet.findById(snippet._id)
      .populate("tags", "name")
      .populate("user", "_id name photo");

    // Emit real-time event for new snippet
    const io = req.app.get("io");
    if (io && isPublic) {
      io.to("public-snippets").emit("new-snippet", populatedSnippet);
    }

    return res.status(201).json(populatedSnippet);
  } catch (error) {
    console.log("Error in createSnippet", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export const getPublicSnippets = asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const userId = req.query.userId;
    const tagId = req.query.tagId;
    const search = req.query.search;

    // calculate the number of documents to skip
    const skip = (page - 1) * limit;

    // build the query object
    const query = { isPublic: true };

    if (userId) {
      // filter by userId if userId is provided
      query.user = userId;
    }

    if (tagId) {
      // filter by tagId if tagId is provided
      query.tags = tagId;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } }, // i for case-insensitive
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const snippets = await Snippet.find(query)
      .populate("tags", "name")
      .populate("user", "_id name photo")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // get total snippets
    const totalSnippets = await Snippet.countDocuments(query);

    return res.status(200).json({
      totalSnippets,
      totalPages: Math.ceil(totalSnippets / limit),
      currentPage: page,
      snippets,
    });
  } catch (error) {
    console.log("Error in getPublicSnippets", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export const getUserSnippets = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const tagId = req.query.tagId;
    const search = req.query.search;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized! Please login" });
    }

    // limit the number of snippets to 10
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    // calculate the number of documents to skip
    const skip = (page - 1) * limit;

    // build the query object
    const query = { user: userId };

    if (tagId) {
      query.tags = { $in: [tagId] };
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } }, // i for case-insensitive
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const snippets = await Snippet.find(query)
      .populate("tags", "name")
      .populate("user", "_id name photo")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // get total snippets
    const totalSnippets = await Snippet.countDocuments({ user: userId });

    // send a paginated response
    return res.status(200).json({
      totalSnippets,
      totalPages: Math.ceil(totalSnippets / limit),
      currentPage: page,
      snippets,
    });
  } catch (error) {
    console.log("Error in getUserSnippets", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export const getUserSnippet = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const snippetId = req.params.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized! Please login" });
    }

    const snippet = await Snippet.findOne({ _id: snippetId, user: userId })
      .populate("tags", "name")
      .populate("user", "_id name photo");

    return res.status(200).json(snippet);
  } catch (error) {
    console.log("Error in getUserSnippet", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export const getPublicSnippet = asyncHandler(async (req, res) => {
  try {
    const snippetId = req.params.id;

    const snippet = await Snippet.findOne({ _id: snippetId, isPublic: true })
      .populate("tags", "name")
      .populate("user", "_id name photo");

    return res.status(200).json(snippet);
  } catch (error) {
    console.log("Error in getPublicSnippet", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export const updateSnippet = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const snippetId = req.params.id;
    const { title, description, code, language, tags, isPublic } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized! Please login" });
    }

    const snippet = await Snippet.findOne({ _id: snippetId, user: userId });

    if (!snippet) {
      return res.status(404).json({ message: "Snippet not found" });
    }

    snippet.title = title || snippet.title;
    snippet.description = description || snippet.description;
    snippet.code = code || snippet.code;
    snippet.language = language || snippet.language;
    snippet.tags = tags || snippet.tags;
    snippet.isPublic = isPublic !== undefined ? isPublic : snippet.isPublic;

    await snippet.save();

    // Populate user and tags for response
    const updatedSnippet = await Snippet.findById(snippet._id)
      .populate("tags", "name")
      .populate("user", "_id name photo");

    // Emit real-time event for snippet update if it's public
    const io = req.app.get("io");
    if (io && updatedSnippet.isPublic) {
      io.to("public-snippets").emit("snippet-updated", updatedSnippet);
    }

    return res.status(200).json(updatedSnippet);
  } catch (error) {
    console.log("Error in updateSnippet", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export const deleteSnippet = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const snippetId = req.params.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized! Please login" });
    }

    const snippet = await Snippet.findOne({ _id: snippetId, user: userId });

    if (!snippet) {
      return res.status(404).json({ message: "Snippet not found" });
    }

    // Emit real-time event for snippet deletion if it was public
    const io = req.app.get("io");
    if (io && snippet.isPublic) {
      io.to("public-snippets").emit("snippet-deleted", snippetId);
    }

    await Snippet.deleteOne({ _id: snippetId });

    return res.status(200).json({ message: "Snippet deleted successfully" });
  } catch (error) {
    console.log("Error in deleteSnippet", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// like a snippet
export const likeSnippet = asyncHandler(async (req, res) => {
  try {
    const snippetId = req.params.id;
    const userId = req.user._id;

    let snippet = await Snippet.findById(snippetId).populate("user", "_id name photo");

    if (!snippet) {
      return res.status(404).json({ message: "Snippet not found" });
    }

    // check if user has already like the snippet
    if (snippet.likedBy.includes(userId)) {
      // unlike snippet if the user has already liked it
      snippet.likes -= 1;
      snippet.likedBy = snippet.likedBy.filter((id) => {
        return id.toString() !== userId.toString();
      });
      await snippet.save();

      return res.status(200).json({ likes: snippet.likes });
    } else {
      // like the snippet
      snippet.likes += 1;
      snippet.likedBy.push(userId);

      await snippet.save();

      return res.status(200).json({
        message: "Snippet liked successfully",
        likes: snippet.likes,
      });
    }
  } catch (error) {
    console.log("Error in likeSnippet", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// get liked snippets
export const getLikedSnippets = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const tagId = req.query.tagId;
    const search = req.query.search;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized! Please login" });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // number of documents to skip
    const skip = (page - 1) * limit;

    //build the query object
    const query = { likedBy: userId }; // check if the user has liked the snippet

    if (tagId) {
      // filter by tagId if tagId is provided --> selects documnets whoses field array contains at least one element with a value in the specified array
      query.tags = { $in: [tagId] };
    }

    // search by title or description
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } }, // i for case-insensitive
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // fetch the paginated liked snippets
    const snippets = await Snippet.find(query)
      .populate("tags", "name")
      .populate("user", "_id name photo")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // get total snippets
    const totalSnippets = await Snippet.countDocuments(query);

    // send a paginated response
    return res.status(200).json({
      totalSnippets,
      totalPages: Math.ceil(totalSnippets / limit),
      currentPage: page,
      snippets,
    });
  } catch (error) {
    console.log("Error in getLikedSnippets", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export const getLeaderboard = asyncHandler(async (req, res) => {
  try {
    const leaderboard = await Snippet.aggregate([
      {
        $group: {
          _id: "$user", // group by user
          totalLikes: { $sum: "$likes" }, // sum of likes
          snippetCount: { $sum: 1 }, // count of snippets
        },
      },
      {
        $lookup: {
          from: "users", // join with users collection
          localField: "_id",
          foreignField: "_id", // join on _id field
          as: "userInfo", // The name of the new array field that will hold the user info
        },
      },
      {
        $unwind: "$userInfo", // flattern the userInfo array
      },
      {
        $project: {
          _id: "$userInfo._id",
          name: "$userInfo.name",
          photo: "$userInfo.photo",
          totalLikes: 1,
          snippetCount: 1,
          score: {
            $add: [
              { $toInt: "$totalLikes" },
              { $multiply: ["$snippetCount", 10] },
            ],
          },
        },
      },
      {
        $sort: { totalLikes: -1 }, // sort by total likes
      },

      {
        $limit: 100, // get top 100 users
      },
    ]);

    return res.status(200).json(leaderboard);
  } catch (error) {
    console.log("Error in getLeaderboard", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export const getPopularSnippets = asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const userId = req.query.userId;
    const tagId = req.query.tagId;
    const search = req.query.search;

    // calculate the number of documents to skip
    const skip = (page - 1) * limit;

    // build the query object
    const query = { isPublic: true };

    if (tagId) {
      // filter by tagId if tagId is provided
      query.tags = { $in: [tagId] };
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } }, // i for case-insensitive
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // fetch popular snippets
    const popularSnippets = await Snippet.find(query)
      .populate("tags", "name")
      .populate("user", "_id name photo")
      .sort({ likes: -1 })
      .skip(skip)
      .limit(limit * 10); // get 10 times the limit to get a good sample;

    // shuffle teh snippets
    const shuffledSnippets = popularSnippets.sort(() => 0.5 - Math.random());

    // get snippets for the current page
    const snippets = shuffledSnippets.slice((page - 1) * limit, page * limit);

    // send paginated response
    return res.status(200).json({
      totalSnippets: popularSnippets.length,
      totalPages: Math.ceil(popularSnippets.length / limit),
      currentPage: page,
      snippets,
    });
  } catch (error) {
    console.log("Error in getPopularSnippets", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});
