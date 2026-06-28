# Developer Workflow — Hamsaplou (HSL)

> This is the practical loop for every change: Make → Test → Debug → Stage → Deploy.
> Rules and architecture live in CLAUDE.md and AGENTS.md. This file is the "how to actually do it."

---

## Phase A — Make the Change

**Rule: always go through the base44 shim. Never call Supabase directly from pages or components.**

| What you're changing | File to edit |
|---|---|
| Reading/writing data (posts, users, comments…) | Add/fix method in `src/lib/db.js` → call via `base44.entities.X` |
| Login, register, logout, OAuth | Add/fix method in `src/lib/auth.js` → call via `base44.auth.X` |
| Server-side logic (rate limit, likes, reports…) | Add/fix handler in `src/lib/functions.js` → call via `base44.functions.invoke('name', args)` |
| File uploads | Edit `src/lib/storage.js` → call via `base44.integrations.Core.UploadFile` |
| UI / pages | Edit `src/pages/XYZ.jsx` — import `{ base44 } from "@/api/base44Client"` |

**Quick shim check:** after editing, run this in terminal — if any result prints, you broke the shim rule:
```powershell
Select-String -Path "src\pages\**\*.jsx" -Pattern "supabase\.from\(" -Recurse
```

---

## Phase B — Test Locally

Start the dev server:
```powershell
npm run dev
# Opens at localhost:5173
```

**In the browser — open DevTools (F12):**

1. **Console tab** — any red errors? Fix before continuing. Common ones:

   | Error message | Cause | Fix |
   |---|---|---|
   | `Failed to fetch` | Missing env var (SUPABASE_URL etc.) | Check `.env.local` has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` |
   | `JWT expired` | Session timed out | Refresh page or re-login |
   | `permission denied for table X` | RLS blocked the query | Check RLS policy in Supabase dashboard |
   | `new row violates row-level security` | INSERT blocked by RLS | Same as above |
   | `Cannot read properties of undefined` | base44 returned undefined | Check the method in `src/lib/db.js` returns `.data` correctly |

2. **Network tab** → filter by `Fetch/XHR` → do your calls return 200?
   - Click a failing request → look at the **Response** tab — the error body will say exactly what went wrong

3. **Click through the feature** — verify it actually works end-to-end in the UI

**Read Supabase logs from the CLI (when console isn't enough):**
- Ask Claude to run `mcp__claude_ai_Supabase__get_logs` with `service: "api"` — shows recent DB errors
- Or: Supabase Dashboard → your project → Logs → API

---

## Phase C — Stage

```powershell
git add src/pages/Login.jsx src/lib/auth.js   # list specific files, never git add .
git commit -m "feat: brief description"
git push origin staging                         # triggers Netlify staging deploy
```

**Verify staging:**
1. Open https://app.netlify.com → site **hsl1** → Deploys tab → wait for green tick
2. Open https://staging--hsl1.netlify.app → hard refresh (Ctrl+Shift+R)
3. Test the feature again end-to-end

**If Netlify build fails:** click the red deploy → read the build log at the bottom — usually a missing env var, a bad import, or a TypeScript error.

**Env vars on Netlify:** Site settings → Environment variables. Add any `VITE_*` vars there; they don't come from your local `.env.local`.

---

## Phase D — Deploy to Prod

Only after staging looks good:
```powershell
git checkout main
git pull --rebase origin main
git merge --no-ff staging
git push origin main           # triggers prod deploy
```

**Verify prod:**
1. Netlify → Deploys → wait for green tick on main branch
2. Open https://hamsaplou.com → hard refresh (Ctrl+Shift+R)
3. Smoke-test the feature once more

---

## DB Changes (DDL only — migrations)

Never use `execute_sql` for schema changes. Always:
1. Write the SQL
2. Ask Claude to apply it via `apply_migration` MCP
3. Ask Claude to run `get_advisors` after — catches RLS holes and missing indexes
4. Risky changes (DROP, large ALTER) → create a Supabase branch first (~$0.30/day), test there, then apply to prod

---

## Quick Reference — Base44 Shim Methods

```js
// Entities (CRUD)
base44.entities.Post.list("-created_date", 20)
base44.entities.Post.filter({ status: "published", category_id: id }, "-created_date", 20)
base44.entities.Post.get(id)
base44.entities.Post.create({ title, content, ... })
base44.entities.Post.update(id, { title })
base44.entities.Post.delete(id)

// Auth
base44.auth.me()
base44.auth.loginViaEmailPassword(email, password)
base44.auth.register({ email, password })
base44.auth.loginWithProvider("google", returnUrl)
base44.auth.logout()
base44.auth.updateMe({ username, avatar })

// Server functions
base44.functions.invoke("checkRateLimit", { action: "post_create", identifier: userId })
base44.functions.invoke("toggleLike", { target_type: "post", target_id: postId })
base44.functions.invoke("submitReport", { target_type, target_id, reason })

// File upload
base44.integrations.Core.UploadFile({ file })  // returns { file_url, path }
```

---

## Common Gotchas

- **`created_date` vs `created_at`** — Base44 used `created_date`; Supabase uses `created_at`. The shim maps it for entity methods. But if you read `post.created_date` directly on a raw Supabase response, you get `undefined`. Always go through entity methods.
- **Staging and prod share the same DB.** Frontend is isolated (different URL), but DB writes on staging hit production data.
- **Order prefix `-` means descending.** `"-created_date"` = newest first. No prefix = ascending.
- **`profiles_safe_update_guard`** — the DB trigger silently drops changes to `role` or `banned` fields from regular users. If you update a profile and those fields don't change, that's why. Intentional.
