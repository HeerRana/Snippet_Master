// Snippet Master for VS Code. No dependencies; uses the global fetch of the
// editor's Node runtime (VS Code 1.80+).
const vscode = require("vscode");

const config = () => vscode.workspace.getConfiguration("snippetMaster");

const api = async (method, route, body) => {
  const token = config().get("token");
  if (!token) {
    throw new Error(
      "Set snippetMaster.token in Settings (create a token in Snippet Master > Settings > VS Code extension)"
    );
  }
  const base = String(config().get("apiUrl")).replace(/\/$/, "");
  const res = await fetch(`${base}${route}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
  return data;
};

const LANGS = {
  javascript: "javascript", javascriptreact: "javascript", typescript: "typescript",
  typescriptreact: "typescript", python: "python", java: "java", c: "c", cpp: "c++",
  csharp: "c#", go: "go", rust: "rust", ruby: "ruby", php: "php", swift: "swift",
  kotlin: "kotlin", sql: "sql", html: "html", css: "css", json: "json", lua: "lua",
  r: "r", shellscript: "bash",
};

async function saveSelection() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;
  const code = editor.document.getText(editor.selection);
  if (code.trim().length < 10) {
    return vscode.window.showWarningMessage("Select at least 10 characters of code first.");
  }

  const title = await vscode.window.showInputBox({ prompt: "Snippet title", ignoreFocusOut: true });
  if (!title) return;
  const language = LANGS[editor.document.languageId] || "javascript";
  const tagsText = await vscode.window.showInputBox({
    prompt: "Tags (comma separated)",
    value: language,
    ignoreFocusOut: true,
  });
  if (!tagsText) return;
  const pick = await vscode.window.showQuickPick(["Private", "Public"], {
    placeHolder: "Who can see it?",
  });
  if (!pick) return;

  try {
    const snippet = await api("POST", "/create-snippet", {
      title,
      description: `Saved from VS Code (${editor.document.fileName.split(/[\\/]/).pop()})`,
      code,
      language,
      tags: tagsText.split(",").map((t) => t.trim()).filter(Boolean),
      isPublic: pick === "Public",
    });
    vscode.window.showInformationMessage(`Saved "${snippet.title}" to Snippet Master`);
  } catch (error) {
    vscode.window.showErrorMessage(error.message);
  }
}

async function searchAndInsert() {
  const editor = vscode.window.activeTextEditor;
  const query = await vscode.window.showInputBox({
    prompt: "Search your snippets (title, description, code)",
    ignoreFocusOut: true,
  });
  if (query === undefined) return;

  try {
    const data = await api("GET", `/snippets?search=${encodeURIComponent(query)}&limit=30`);
    if (!data.snippets?.length) {
      return vscode.window.showInformationMessage("No snippets found.");
    }
    const picked = await vscode.window.showQuickPick(
      data.snippets.map((s) => ({
        label: s.title,
        description: s.language,
        detail: s.description,
        snippet: s,
      })),
      { matchOnDetail: true, placeHolder: "Pick a snippet to insert" }
    );
    if (!picked) return;

    if (editor) {
      await editor.edit((edit) => edit.replace(editor.selection, picked.snippet.code));
    } else {
      await vscode.env.clipboard.writeText(picked.snippet.code);
      vscode.window.showInformationMessage("No editor open, code copied to clipboard.");
    }
  } catch (error) {
    vscode.window.showErrorMessage(error.message);
  }
}

function activate(context) {
  context.subscriptions.push(
    vscode.commands.registerCommand("snippetMaster.save", saveSelection),
    vscode.commands.registerCommand("snippetMaster.search", searchAndInsert)
  );
}

module.exports = { activate, deactivate() {} };
