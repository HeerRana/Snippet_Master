# New features: what was added and what to configure

Everything below is free. Nothing here needs a paid API.

## 1. Environment variables

| Where | Variable | Required? | Purpose |
|---|---|---|---|
| Render (backend) | `GOOGLE_CLIENT_ID` | Only for Google Sign-In | Verifies Google ID tokens |
| Vercel (frontend) | `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Only for Google Sign-In | Renders the "Continue with Google" button (same value as above) |
| Render | `CLIENT_URL` | Already set | Used for embed links. Must be your Vercel URL |
| Render | `USER_EMAIL`, `EMAIL_PASS` | Already set | Needed for the emailed login code (2-step verification) |

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
- The emailed login code uses the same SMTP account as email verification. If that account cannot send mail, leave 2-step verification off.
- The code runner with test cases is left as future scope, as planned.

## 6. Profile picture upload

- Cloudinary was removed completely (code, packages and env variables). Pictures are stored in MongoDB (`ProfileImage` collection) and served from `GET /api/v1/user/:id/photo`. No external service, no keys.
- The browser crops the photo to a 400x400 JPEG before uploading, so each one is roughly 30-60 KB.
- `client/next.config.mjs` allows images from your backend host and Google avatars. Previously only GitHub avatars were allowed, which blocks other hosts in `next/image`.
- You can delete the three `CLOUDINARY_*` variables from Render.
