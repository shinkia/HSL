# HSL Forum — Claude Context

> This file is auto-loaded by Claude when working in this repo. It captures project state, conventions, and open issues so any new Claude session can pick up without re-deriving context.

**Last updated:** 2026-06-21
**Project:** 邻里荟 (Linlihui) — Chinese-language community forum/classifieds for KL / Cheras / Ampang / Negeri Sembilan
**Live URL:** https://hsl1.netlify.app
**Repo:** https://github.com/shinkia/HSL

---

## Stack

- **Frontend:** React + Vite + Tailwind + Radix UI + Tiptap + React Router
- **Backend:** Supabase (Postgres 17 + Auth + Storage + RLS) — project `zazmzusudsldkvahsxgo`, region Tokyo (ap-northeast-1)
- **Hosting:** Netlify
- **Local dev:** `D:\hsl` → `npm run dev` → http://localhost:5173

## Quick links

| What | Where |
|---|---|
| Live site | https://hsl1.netlify.app |
| GitHub | https://github.com/shinkia/HSL |
| Supabase dashboard | https://supabase.com/dashboard/project/zazmzusudsldkvahsxgo |
| Netlify dashboard | https://app.netlify.com/projects/hsl1 |
| Supabase URL | `https://zazmzusudsldkvahsxgo.supabase.co` |
| Supabase anon key | `sb_publishable_BieD6Nu-vTn35l2NWJ7Plw_xObibb3h` |
| Admin user | `dogdog@gmail.com` |
| Demo user | `demo@hsl.test` / `demo1234` (shared, admin — risky) |

---

## Architecture — Drop-in shim approach

Migrated from Base44 → Supabase WITHOUT editing every page. Built shims at `src/lib/`:

- `supabase.js` — Supabase client + helpers
- `db.js` — entity shim (`Post.list()`, `User.me()`, etc. — Base44-compatible API)
- `auth.js` — auth shim (login, register, OAuth, password reset)
- `storage.js` — upload helpers + `integrations.Core.UploadFile` shim
- `functions.js` — function-invoke shim (5 client-side replacements; rest stubbed)
- `AuthContext.jsx` — rewritten on Supabase Auth with `onAuthStateChange`

`src/api/base44Client.js` re-exports above as `base44.*` so existing code that imported the Base44 SDK keeps working without edits.

**When editing pages: keep using `base44.entities.X` / `base44.auth.X` / `base44.functions.invoke()` API.** Do NOT call Supabase client directly from pages — go through the shim so the surface stays consistent.

## Schema highlights

11 tables, all RLS-enabled. Key tables:
- `profiles` (extends `auth.users`, holds username/role/bio/avatar/ban state)
- `posts` (with `location` enum: KL / Cheras / Ampang / Negeri Sembilan; `post_type` enum: classified / fr / qna)
- `comments`, `reactions`, `reports`, `ban_logs`, `categories`, `tags`, `post_tags`, `rate_limits`, `media_items`

Triggers auto-maintain `like_count`, `reply_count`, `post_count`, `comment_count`.
`handle_new_user` trigger on `auth.users` auto-creates `profiles` row with username + Dicebear avatar.
pg_trgm extension for substring search.
Helper RLS functions: `is_admin()`, `is_staff()`, `is_banned()`.

6 seeded categories: 心得分享, 问答, 下水场, 按摩, 广告贴, 其他.

## URL structure

- Location listing: `/{kl|cheras|ampang|negeri-sembilan}`
- Post detail: `/{location}/{post-slug}`
- Old `/posts/{slug}` URLs 301-redirect to new format
- `/ns` 301 → `/negeri-sembilan`
- Category routes `/category/{slug}` preserved

---

## Conventions for code changes

- **Language:** UI strings must be Simplified Chinese. Code identifiers stay English.
- **Editor:** Tiptap (not Quill — Quill was replaced because its image handler was unreliable).
- **Fonts:** Noto Sans SC with fallbacks (PingFang SC, Microsoft YaHei).
- **Colors:** off-white `#FAFAFA`, charcoal `#1a1a1a`, teal accent `#0D9488`.
- **Spacing:** card padding 16px mobile / 24px desktop.
- **Tap targets:** min 44x44px.
- **Component lib:** Radix UI primitives + Tailwind.
- **State:** React Query for data fetching (set up at App.jsx).
- **Toasts:** use `useToast` from `@/components/ui/use-toast` (not `@/hooks/use-toast`).

## Conventions for schema changes

- Use `apply_migration` MCP tool (not raw `execute_sql`) for DDL.
- Always enable RLS on new tables.
- Add `created_at` / `updated_at timestamptz` defaults.
- Set `search_path = public` on every function (security advisor flags missing search_path).
- Helper functions on `profiles` should be `SECURITY INVOKER` (profiles has public read RLS).
- After DDL, run `get_advisors` (security + performance) and address warnings.

## Conventions for commits

- Branch: `main`
- Always run `git pull --rebase` before push to avoid divergence.
- Watch for stale `.git/index.lock` / `.git/config.lock` — delete if blocking ops.
- Stop Vite dev server before git ops (releases locks).

---

## ⚠️ Open issues — must be aware

### 🔴 Critical (block public launch)

1. **Privilege escalation:** RLS `profiles_update_own` allows users to update `role` → can self-promote to admin. Restrict to safe column whitelist.
2. **Demo account is shared admin** — anyone can vandalize via "试用账号" button. Demote or nightly reset.
3. **Author can edit forbidden fields** (`is_pinned`, `like_count`, SEO, `category_id`, `post_type`) on own FR/Q&A posts. Restrict `posts_update_author` policy.
4. **`VITE_SITE_URL` not set on Netlify** — share links + email redirects fall back to current origin.

### 🟠 High (production-readiness)

5. Orphaned storage files (deleted post images stay in `post-images` bucket).
6. Rate limiting stubs always return `ok:true` — no real protection.
7. reCAPTCHA called client-side but ignored server-side.
8. `sitemap.xml` is a no-op stub.
9. `view_count` never auto-increments.
10. `first_post_approved` field exists but never checked — new accounts can flood.

### 🟡 Medium

11. No pagination on homepage.
12. Categories don't show post counts.
13. Search is substring `ilike` — not full-text.
14. Trigram indexes index raw HTML.
15. No profile edit UI for users.
16. No comment thread depth limit.
17. No email service wired (Resend / SendGrid).
18. No analytics or error tracking.

### 🟢 Low (later)

Custom domain, OG images, PWA, image CDN, robots.txt, notifications, bookmarks, @mentions, Q&A best-answer, draft autosave, RSS, edit history, 2FA, CI.

---

## Roadmap — what to do next

### Stage A — Lock down security (~1 hour)
1. SQL: restrict `profiles_update_own` to safe columns
2. SQL: restrict `posts_update_author` to safe columns
3. Demote demo account from admin OR set up nightly auto-reset
4. Set `VITE_SITE_URL` in Netlify + Supabase Site URL in dashboard

### Stage B — Wire up real services (~2 hours)
5. Google OAuth (Google Console + Supabase paste)
6. Resend email (signup + API key + Edge Function)
7. Test password reset end-to-end

### Stage C — Real Edge Functions (~2–4 hours)
8. Rate limiting (server-side, IP + user)
9. reCAPTCHA verification on server
10. `sitemap.xml` generator
11. View count increment (deduplicated)
12. First-post moderation flow

### Stage D — Polish (ongoing)
13. Profile edit UI
14. Pagination
15. Category post counts
16. Full-text search
17. Storage cleanup job
18. Comment depth cap

### Stage E — Production launch
19. Custom domain
20. DNS to Netlify
21. Analytics (Plausible) + error tracking (Sentry)
22. Broader testers
23. Iterate from logs

---

## Bug history (lessons)

| Stage | Bug | Cause | Fix |
|---|---|---|---|
| Local dev | "@base44/vite-plugin not found" | Nested `D:\hsl\HSL` folder | Removed, cd `D:\hsl` |
| App boot | "useNavigate() outside Router" | Hook in AuthProvider | Removed, used `window.location` |
| Register | "Cannot read 'honeypot_caught'" | Shim returned raw data; Base44 wraps in `{data:...}` | Wrapped all responses |
| Login | "Email not confirmed" | Supabase requires verification | Manual SQL confirm + dashboard toggle off |
| Login | "Email rate limit exceeded" | Free-tier SMTP limits | Turn off Confirm Email |
| Post create | "Could not find 'tags' column" | Junction table vs text[] mismatch | Added `tags text[]` |
| Git push | "No push destination" | Remote dropped | `git remote add origin` |
| Git push | "Non-fast-forward rejected" | Diverged | `git pull --rebase` |
| Netlify | "Initializing failed" | Orphan submodule gitlink (mode 160000) | `git rm --cached HSL` |
