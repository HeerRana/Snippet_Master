# New features: what was added and what to configure

Everything below is free. Nothing here needs a paid API.

## 1. Environment variables

| Where | Variable | Required? | Purpose |
|---|---|---|---|
| Render (backend) | `GOOGLE_CLIENT_ID` | Only for Google Sign-In | Verifies Google ID tokens |
| Vercel (frontend) | `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Only for Google Sign-In | Renders the "Continue with Google" button (same value as above) |
| Render | `CLIENT_URL` | Already set | Used for embed links. Must be your Vercel URL |
| Render | `BREVO_API_KEY`, `BREVO_SENDER_EMAIL` | Recommended | Sends the login code, verification and reset emails over HTTPS (see section 8). Render's free tier blocks SMTP, so this is what makes email work there |
| Render | `USER_EMAIL`, `EMAIL_PASS` | Fallback | Used only when `BREVO_API_KEY` is not set (SMTP) |
| Render | `GEMINI_API_KEY` | For the AI features | Free key from Google AI Studio (`GOOGLE_AI_API_KEY` also works) |
| Render | `GEMINI_MODELS` | Optional | Comma separated model ids to try in order, defaults to the free gemini-3.x flash models |

No other variables are needed. After changing env vars, redeploy both services.
Without the Google variables the button is simply hidden and email/password login keeps working.

## 2. Google Sign-In (Google Cloud Console)

1. https://console.cloud.google.com -> your existing project -> **APIs & Services** -> **OAuth consent screen**. Keep it in *Testing* mode and add your own Google account (and any interview demo account) under **Test users**.
2. **Credentials** -> **Create credentials** -> **OAuth client ID** -> type **Web application** (or edit the one you already have).
3. **Authorized JavaScript origins**: add `http://localhost:3000` and your Vercel URL, for example `https://snippet-master-one.vercel.app`.
4. You do **not** need a redirect URI or a client secret. The app uses Google Identity Services and the backend verifies the ID token.
5. Copy the **Client ID** into `GOOGLE_CLIENT_ID` (Render) and `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (Vercel).

## 3. Features and how to demo them

| Feature | Where | Notes |
|---|---|---|
| Light / dark theme | Sun/moon button in the header | Remembers the choice, follows the OS theme on first visit |
| Version history + rollback | Clock icon on your own snippet | A version is saved on every edit. Pick one to see a diff against the current code, then restore. Restoring saves the current code first, so it can be undone. Last 50 versions kept |
| Fork | Branch icon on any snippet | Creates a private copy with a "forked from" link |
| Line comments | Open a snippet page, click any line of code | Review style comments, author or snippet owner can delete |
| Private share link | Share icon on your own snippet | Expiry (1h to never) and optional password. Expired links are removed automatically by MongoDB |
| Embed widget | Same Share dialog | Copy an `<iframe>` for blogs and docs, dark or light. Public snippets only |
| GitHub Gist import / export | Sidebar -> GitHub Gists | Import by URL or id. Export needs a GitHub token with only the `gist` scope. The token is not stored |
| Google Sign-In | Login and Register pages | Links to an existing account with the same verified email |
| 2-step login verification | Settings -> 2-step verification | Opt-in. After the password, a 6-digit code is emailed. Code expires in 10 minutes, 5 attempts, 30 second resend cooldown |
| Security hardening | Backend | `helmet` headers and `express-rate-limit` (stricter on login, register, Google, password reset and shared-link endpoints) |

## 4. New API routes (all under `/api/v1`)

```
GET    /snippet/:id/versions                       owner
POST   /snippet/:id/versions/:versionId/restore    owner
POST   /snippet/:id/fork
GET    /snippet/:id/comments
POST   /snippet/:id/comments                       { line, text }
DELETE /snippet/:id/comments/:commentId
POST   /snippet/:id/share                          { expiresInHours, password }
GET    /snippet/:id/share
DELETE /share/:linkId
POST   /shared/:token                              { password }  (public)
GET    /embed/:id?theme=dark|light                 (public, HTML for iframes)
POST   /gist/import                                { gist, token?, isPublic? }
POST   /gist/export                                { snippetIds, token, isPublic? }
POST   /login/verify-otp                           { challengeToken, otp }
POST   /login/resend-otp                           { challengeToken }
POST   /auth/google                                { credential }
PATCH  /two-factor                                 { enabled, password }
```

## 5. Notes

- New backend dependencies: `helmet`, `express-rate-limit`, `google-auth-library`. Run `npm install` in `backend/` before deploying (Render does this on build).
- No existing routes, models or env variables were removed. New model fields have defaults, so existing data keeps working. Older snippets get their first history entry the next time they are edited.
- The emailed login code, email verification and password reset all use the same mailer: Brevo when `BREVO_API_KEY` is set, otherwise SMTP. If neither can send mail, leave 2-step verification off.
- The code runner with test cases is left as future scope, as planned.

## 6. Profile picture upload

- Cloudinary was removed completely (code, packages and env variables). Pictures are stored in MongoDB (`ProfileImage` collection) and served from `GET /api/v1/user/:id/photo`. No external service, no keys.
- The browser crops the photo to a 400x400 JPEG before uploading, so each one is roughly 30-60 KB.
- `client/next.config.mjs` allows images from your backend host and Google avatars. Previously only GitHub avatars were allowed, which blocks other hosts in `next/image`.
- You can delete the three `CLOUDINARY_*` variables from Render.

## 7. Second update: collections, live editing, image export, VS Code extension

| Feature | Where | Notes |
|---|---|---|
| Collections | Sidebar -> Collections, folder button on any snippet | Folders like "React hooks". One snippet can be in many collections |
| Full-text search | Search box in the header | Now matches title, description, code and language |
| Live collaboration | Users icon on your own snippet | Starts a session link (valid 6 hours). Anyone with the link edits together in real time (Yjs CRDT over Socket.IO). Only the owner saves back to the snippet |
| Smarter snippet form | Create Snippet | "Suggest title, description & tags" asks Gemini to fill empty fields (new tags are created on save). A code file can be dropped on the editor or opened with "Open file" (max 300 KB); the language is set from the file type. Your own tags can be typed in (2 to 30 characters, up to 5 new ones per save, created by the server; works when editing too). Collections can be chosen in the form. The form is autosaved in the browser; a banner offers "Restore draft" next time |
| Export as image | Camera button on any snippet | Styled PNG for Twitter / LinkedIn, rendered in the browser |
| VS Code extension | `tools/vscode-extension` | Save the selected code and search / insert snippets from the editor. Signs in with a personal access token (Settings -> VS Code extension, stored hashed). See its README |

New dependencies: `yjs` (backend and client), `html-to-image` (client). No new environment variables.
New routes (`backend/src/routes/devRoutes.js`): `/collections...`, `/snippet/:id/collab`, `/collab/:token`, `/api-tokens...`. AI: `POST /suggest-snippet-details` (needs the new backend and `GEMINI_API_KEY`).

## 8. Email (Brevo), AI models, VS Code extension, UI

**Brevo (free, 300 emails a day, no domain needed)**
1. Sign up at brevo.com. Under **Senders, domains, IPs -> Senders** add a Gmail address you can open, then click the verification link Brevo emails to it.
2. **SMTP & API -> API keys & MCP -> Generate API key**. Name it, keep access *Restricted* and set **Transactional email** to **All**. Copy the key (starts with `xkeysib-`, shown once).
3. Do not activate IP blocking for API or SMTP keys, Render's IP addresses change.
4. On Render add `BREVO_API_KEY` and `BREVO_SENDER_EMAIL` (the verified address), then redeploy.
5. Check: turn on 2-step verification in Settings, log out, log in, the code should arrive (look in spam too).
Errors in the Render logs: `Brevo 401` wrong key, `Brevo 403` key without Transactional email access, `Brevo 400` sender not verified.

**AI features**
The old model names (gemini-1.5-*, gemini-2.0-*) are shut down. The backend now tries gemini-3.8-flash, 3.6-flash, 3.5-flash-lite, 3.1-flash-lite and 3-flash-preview in order, which are free of charge on the free tier. Check the current list at ai.google.dev/gemini-api/docs/models and set `GEMINI_MODELS` if it changes.

**Live collaboration**
Needs the updated backend to be deployed (new routes `/snippet/:id/collab`, `/collab/:token`). Against an old backend the button shows "Live editing is not available on this server yet". Sessions last 6 hours; guests only need a display name; only the owner can save the result back to the snippet.

**VS Code extension**
See `tools/vscode-extension/README.md`. Create a token in Settings -> VS Code extension, press F5 in that folder, set `snippetMaster.apiUrl` (your backend + `/api/v1`) and `snippetMaster.token`.

**UI**
All glass styling is in `client/app/glass.css`. Remove its import from `client/app/layout.tsx` to return to the flat look. The green/red "Connected" badge in the bottom-right corner only appears in `npm run dev`, never on the deployed site.
