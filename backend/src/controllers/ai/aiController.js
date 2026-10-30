import asyncHandler from "express-async-handler";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

// Models tried in order. All of these are free of charge on the Gemini API free
// tier (checked against ai.google.dev pricing). The older gemini-1.5-* and
// gemini-2.0-* models have been shut down, so they are not listed.
// Override with GEMINI_MODELS="model-a,model-b" without touching the code.
const DEFAULT_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-3-flash-preview",
];

const modelNames = process.env.GEMINI_MODELS
  ? process.env.GEMINI_MODELS.split(",").map((m) => m.trim()).filter(Boolean)
  : DEFAULT_MODELS;

const models = modelNames.map((name) => ({
  name,
  model: genAI.getGenerativeModel({ model: name }),
}));

// Run the prompt on the first model that answers. Falls through to the next
// model on any error (quota, overload, model retired) without a test call, so
// the free-tier request quota is only spent on real work.
const generate = async (prompt) => {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set on the server");
  }

  let lastError;
  for (const { name, model } of models) {
    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      if (text) return { text, model: name };
    } catch (error) {
      console.log(`Model ${name} failed: ${error.message}`);
      lastError = error;
    }
  }
  throw lastError || new Error("All models are currently unavailable");
};

export const analyzeCode = asyncHandler(async (req, res) => {
  try {
    const { code, language } = req.body;

    if (!code) {
      return res.status(400).json({ message: "Code is required" });
    }

    const prompt = `Analyze this ${language || 'code'} and provide a comprehensive analysis in a clear, readable format.

Code:
${code}

Please provide:
1. Code Quality Score (1-10) with explanation
2. Potential improvements with specific suggestions
3. Security concerns if any
4. Performance tips and optimizations
5. Best practices recommendations

Format your response in a clear, readable way with proper headings and bullet points. Do not use JSON format.`;

    const { text: analysis, model: usedModel } = await generate(prompt);

    res.status(200).json({
      analysis: analysis,
      model: usedModel
    });
  } catch (error) {
    console.log("Error in analyzeCode", error);
    res.status(500).json({ message: error.message?.includes("GEMINI_API_KEY") ? "AI is not configured on the server" : "Error analyzing code" });
  }
});

export const suggestImprovements = asyncHandler(async (req, res) => {
  try {
    const { code, language, specificIssue } = req.body;

    if (!code) {
      return res.status(400).json({ message: "Code is required" });
    }

    const prompt = `Given this ${language || 'code'}${specificIssue ? ` and the specific issue: ${specificIssue}` : ''}, suggest specific improvements with code examples.

Code:
${code}

Please provide:
1. Specific issues identified
2. Improved code examples with explanations
3. Alternative approaches
4. Best practices recommendations

Format your response in a clear, readable way with proper headings, code blocks, and explanations. Do not use JSON format.`;

    const { text: suggestions, model: usedModel } = await generate(prompt);

    res.status(200).json({
      suggestions: suggestions,
      model: usedModel
    });
  } catch (error) {
    console.log("Error in suggestImprovements", error);
    res.status(500).json({ message: error.message?.includes("GEMINI_API_KEY") ? "AI is not configured on the server" : "Error generating suggestions" });
  }
});

export const generateDocumentation = asyncHandler(async (req, res) => {
  try {
    const { code, language } = req.body;

    if (!code) {
      return res.status(400).json({ message: "Code is required" });
    }

    const prompt = `Generate comprehensive documentation for this ${language || 'code'} including:
1. Function/class descriptions
2. Parameter explanations
3. Return value descriptions
4. Usage examples
5. Edge cases and considerations

Code:
${code}

Please provide well-formatted documentation in a clear, readable format with proper headings, code examples, and explanations. Do not use JSON format.`;

    const { text: documentation, model: usedModel } = await generate(prompt);

    res.status(200).json({
      documentation: documentation,
      model: usedModel
    });
  } catch (error) {
    console.log("Error in generateDocumentation", error);
    res.status(500).json({ message: error.message?.includes("GEMINI_API_KEY") ? "AI is not configured on the server" : "Error generating documentation" });
  }
});

export const convertCode = asyncHandler(async (req, res) => {
  try {
    const { code, sourceLanguage, targetLanguage } = req.body;

    if (!code || !sourceLanguage || !targetLanguage) {
      return res.status(400).json({ 
        message: "Code, source language, and target language are required" 
      });
    }

    const prompt = `Convert this ${sourceLanguage} code to ${targetLanguage}. Return ONLY the converted code with proper formatting, indentation, and syntax. No comments, no explanations, no markdown formatting, no code blocks. Just pure, well-formatted ${targetLanguage} code:

${code}`;

    const { text: convertedCode, model: usedModel } = await generate(prompt);

    res.status(200).json({
      convertedCode: convertedCode,
      model: usedModel,
      sourceLanguage,
      targetLanguage
    });
  } catch (error) {
    console.log("Error in convertCode", error);
    res.status(500).json({ message: error.message?.includes("GEMINI_API_KEY") ? "AI is not configured on the server" : "Error converting code" });
  }
});

// ---------- snippet form: suggest title, description, language and tags ----------
const SNIPPET_LANGUAGES = [
  "c", "c#", "c++", "css", "django", "go", "haskell", "html", "java",
  "javascript", "json", "kotlin", "lua", "php", "python", "r", "ruby",
  "rust", "sql", "swift", "typescript",
];

// the model sometimes wraps JSON in markdown fences or adds a sentence around it
const extractJson = (text) => {
  const cleaned = text.replace(/```json|```/gi, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("AI did not return JSON");
  return JSON.parse(cleaned.slice(start, end + 1));
};

export const suggestSnippetDetails = asyncHandler(async (req, res) => {
  try {
    const { code, existingTags } = req.body;

    if (!code || String(code).trim().length < 10) {
      return res
        .status(400)
        .json({ message: "Add some code first (at least 10 characters)" });
    }

    const tagList = Array.isArray(existingTags)
      ? existingTags.map(String).slice(0, 60)
      : [];

    const prompt = `You label code snippets for a snippet-sharing site.
Read the code and reply with ONLY a JSON object, no markdown, no extra text:
{"title": string, "description": string, "language": string, "tags": string[]}

Rules:
- title: 3 to 60 characters, specific, no quotes at the ends.
- description: one or two sentences, 15 to 200 characters, says what the code does and how it is used.
- language: exactly one of: ${SNIPPET_LANGUAGES.join(", ")}.
- tags: 3 to 5 short lowercase tags. Prefer tags from this existing list when they fit: ${tagList.join(", ") || "(none)"}. You may add at most 2 new tags.

Code:
${String(code).slice(0, 6000)}`;

    const { text, model } = await generate(prompt);
    const data = extractJson(text);

    const language = String(data.language || "").toLowerCase().trim();
    const tags = [
      ...new Set(
        (Array.isArray(data.tags) ? data.tags : [])
          .map((t) => String(t).toLowerCase().trim())
          .filter((t) => t.length >= 2 && t.length <= 30)
      ),
    ].slice(0, 5);

    res.status(200).json({
      title: String(data.title || "").trim().slice(0, 80),
      description: String(data.description || "").trim().slice(0, 300),
      language: SNIPPET_LANGUAGES.includes(language) ? language : null,
      tags,
      model,
    });
  } catch (error) {
    console.log("Error in suggestSnippetDetails", error);
    res.status(500).json({
      message: error.message?.includes("GEMINI_API_KEY")
        ? "AI is not configured on the server"
        : "Could not generate suggestions, please try again",
    });
  }
});
