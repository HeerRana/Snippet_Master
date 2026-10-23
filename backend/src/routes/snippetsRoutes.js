import express from "express";
import {
  createSnippet,
  getPublicSnippets,
  getUserSnippets,
  getUserSnippet,
  getPublicSnippet,
  updateSnippet,
  deleteSnippet,
  likeSnippet,
  getLikedSnippets,
  getLeaderboard,
  getPopularSnippets,
} from "../controllers/snippets/snippetsController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/create-snippet", protect, createSnippet);
router.get("/snippets/public", getPublicSnippets);
router.get("/snippets", protect, getUserSnippets);
router.get("/snippet/:id", protect, getUserSnippet);
router.get("/snippet/public/:id", getPublicSnippet);

// update snippet
router.patch("/snippet/:id", protect, updateSnippet);
// delete snippet
router.delete("/snippet/:id", protect, deleteSnippet);

// like a snippet
router.patch("/snippet/like/:id", protect, likeSnippet);

// get liked snippets
router.get("/snippets/liked", protect, getLikedSnippets);

// get leaderboard
router.get("/leaderboard", getLeaderboard);

// get random most liked snippets
router.get("/snippets/popular", getPopularSnippets);

export default router;
