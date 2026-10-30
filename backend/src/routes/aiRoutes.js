import express from "express";
import {
  analyzeCode,
  suggestImprovements,
  generateDocumentation,
  convertCode,
  suggestSnippetDetails,
} from "../controllers/ai/aiController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// AI routes - require authentication
router.post("/analyze-code", protect, analyzeCode);
router.post("/suggest-improvements", protect, suggestImprovements);
router.post("/generate-documentation", protect, generateDocumentation);
router.post("/convert-code", protect, convertCode);
router.post("/suggest-snippet-details", protect, suggestSnippetDetails);

export default router; 