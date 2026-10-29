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
import { protect, optionalAuth } from "../middleware/authMiddleware.js";
import {
  getVersions,
  restoreVersion,
} from "../controllers/snippets/versionsController.js";
import {
  forkSnippet,
  getComments,
  addComment,
  deleteComment,
  createShareLink,
  listShareLinks,
  revokeShareLink,
  openShareLink,
  embedSnippet,
} from "../controllers/snippets/snippetExtrasController.js";
import {
  importGist,
  exportGist,
} from "../controllers/snippets/gistController.js";

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

// version history + rollback
router.get("/snippet/:id/versions", protect, getVersions);
router.post("/snippet/:id/versions/:versionId/restore", protect, restoreVersion);

// forking
router.post("/snippet/:id/fork", protect, forkSnippet);

// inline line comments
router.get("/snippet/:id/comments", optionalAuth, getComments);
router.post("/snippet/:id/comments", protect, addComment);
router.delete("/snippet/:id/comments/:commentId", protect, deleteComment);

// private share links (expiry + password)
router.post("/snippet/:id/share", protect, createShareLink);
router.get("/snippet/:id/share", protect, listShareLinks);
router.delete("/share/:linkId", protect, revokeShareLink);
router.post("/shared/:token", openShareLink);

// embeddable widget (iframe)
router.get("/embed/:id", embedSnippet);

// GitHub Gist import / export
router.post("/gist/import", protect, importGist);
router.post("/gist/export", protect, exportGist);

export default router;
