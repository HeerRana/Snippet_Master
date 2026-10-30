// Languages the snippet form supports, and the mapping from a file name to one
// of them (used when a code file is opened or dropped onto the editor).

export const SUPPORTED_LANGUAGES = [
  "c",
  "c#",
  "c++",
  "css",
  "django",
  "go",
  "haskell",
  "html",
  "java",
  "javascript",
  "json",
  "kotlin",
  "lua",
  "php",
  "python",
  "r",
  "ruby",
  "rust",
  "sql",
  "swift",
  "typescript",
] as const;

const EXTENSIONS: Record<string, string> = {
  js: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  jsx: "javascript",
  ts: "typescript",
  tsx: "typescript",
  mts: "typescript",
  cts: "typescript",
  py: "python",
  pyw: "python",
  java: "java",
  c: "c",
  h: "c",
  cpp: "c++",
  cc: "c++",
  cxx: "c++",
  hpp: "c++",
  hh: "c++",
  hxx: "c++",
  "c++": "c++",
  cs: "c#",
  go: "go",
  rs: "rust",
  rb: "ruby",
  rake: "ruby",
  php: "php",
  phtml: "php",
  swift: "swift",
  kt: "kotlin",
  kts: "kotlin",
  sql: "sql",
  html: "html",
  htm: "html",
  css: "css",
  scss: "css",
  json: "json",
  lua: "lua",
  r: "r",
  hs: "haskell",
  lhs: "haskell",
  xhtml: "html",
};

export function languageFromFilename(name: string): string | null {
  // no extension at all (a file just called "go" or "c") must not match
  const dot = name.lastIndexOf(".");
  if (dot <= 0 || dot === name.length - 1) return null;
  return EXTENSIONS[name.slice(dot + 1).toLowerCase()] ?? null;
}
