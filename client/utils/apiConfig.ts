// API and Server URL Configuration
const rawUrl =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_SERVER_URL ||
  "https://snippet-master.onrender.com";

// Base server URL (without /api/v1 or trailing slash), e.g. "https://snippet-master.onrender.com"
export const SERVER_URL = rawUrl.replace(/\/api\/v1\/?$/, "").replace(/\/$/, "");

// Full API v1 URL, e.g. "https://snippet-master.onrender.com/api/v1"
export const API_URL = `${SERVER_URL}/api/v1`;
