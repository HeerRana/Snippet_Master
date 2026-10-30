import express from "express";
import { protect, optionalAuth } from "../middleware/authMiddleware.js";
import {
  listCollections,
  createCollection,
  updateCollection,
  deleteCollection,
  getCollection,
  addToCollection,
  removeFromCollection,
} from "../controllers/snippets/collectionsController.js";
import {
  startCollab,
  getCollab,
  endCollab,
} from "../controllers/snippets/collabController.js";
import {
  listApiTokens,
  createApiToken,
  deleteApiToken,
} from "../controllers/auth/apiTokenController.js";

const router = express.Router();

// collections (folders of snippets)
router.get("/collections", protect, listCollections);
router.post("/collections", protect, createCollection);
router.get("/collections/:id", protect, getCollection);
router.patch("/collections/:id", protect, updateCollection);
router.delete("/collections/:id", protect, deleteCollection);
router.put("/collections/:id/snippets/:snippetId", protect, addToCollection);
router.delete("/collections/:id/snippets/:snippetId", protect, removeFromCollection);

// live collaboration
router.post("/snippet/:id/collab", protect, startCollab);
router.get("/collab/:token", optionalAuth, getCollab);
router.delete("/collab/:token", protect, endCollab);

// personal access tokens for the VS Code extension
router.get("/api-tokens", protect, listApiTokens);
router.post("/api-tokens", protect, createApiToken);
router.delete("/api-tokens/:id", protect, deleteApiToken);


export default router;
