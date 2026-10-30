# Snippet Master for VS Code

Save the code you select to Snippet Master and search or insert your snippets without
leaving the editor. No dependencies.

## Set up

1. In the web app open **Settings → VS Code extension** and click **Create token**. Copy it
   right away, it is shown once.
2. Open this folder in VS Code and press **F5** to start an Extension Development Host.
3. In that window open Settings, search "Snippet Master" and set:
   - `snippetMaster.apiUrl`: your backend, for example `https://snippet-master.onrender.com/api/v1`
   - `snippetMaster.token`: the token from step 1

## Use

- Select code, right-click → **Snippet Master: Save selection as snippet**.
- Command Palette → **Snippet Master: Search and insert snippet**.

## Install permanently

```bash
npx @vscode/vsce package
```

Then in VS Code: **Extensions → … → Install from VSIX**.
