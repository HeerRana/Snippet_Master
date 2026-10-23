import express from "express";
import {
  bulkAddTags,
  createTag,
  deleteTag,
  getTagById,
  getTags,
  getTagsByUser,
  updateTagUsage,
} from "../controllers/tags/tagsController.js";
import { adminMiddleware, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// create a new tag
router.post("/create-tag", protect, createTag);
router.get("/tags", getTags);
router.get("/user-tags", protect, getTagsByUser);
router.get("/tag/:id", getTagById);
router.delete("/tag/:id", protect, deleteTag);
router.put("/tag/:tagId/usage", protect, updateTagUsage);

router.post("/bulk-tags", protect, adminMiddleware, bulkAddTags);

export default router;
