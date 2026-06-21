# HSL Forum — Project Status

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

---

## Stages completed

### Phase 1 — Built on Base44 (UI + features)

1. Swapped Quill editor for Tiptap (inline image upload working)
2. Empty / loading / error states across all pages
3. Mobile responsiveness pass
4. Visual + typography polish (Noto Sans SC)
5. Navigation (breadcrumbs, 404, footer, /categories, /tags)
6. Pre-launch smoke test
7. **B1:** User auth + profile + gate posting/commenting
8. **U1:** FR + Q&A user-posting flow with single 发帖 button
9. **U2:** Like / upvote on posts and comments
10. **U3:** Report inappropriate content + admin moderation queue
11. **U4:** Share button (copy link, WhatsApp, Telegram, WeChat QR, Weibo)
12. **U5:** Location-based URL structure (`/kl`, `/cheras`, `/ampang`, `/negeri-sembilan`)
13. **B2:** Anti-spam scaffolding + email verification scaffold

### Phase 2 — Migration to Supabase

14. **M1:** Cloned GitHub repo to D:\hsl
15. **M2:** Built Supabase schema — 11 tables, RLS, triggers, indexes, 6 seed categories
16. **M3:** Configured Supabase email auth (Google OAuth deferred)
17. **M4:** Set up Storage buckets — `post-images`, `avatars`
18. **M5:** Rewrote data layer — drop-in shim (`base44.entities.X` / `base44.auth.X` / `base44.functions.invoke`) routes through Supabase
19. **M7:** Deployed to Netlify (https://hsl1.netlify.app)

---

## Deferred / pending

- **M5b** — Real Edge Functions for: rate limiting, email send, sitemap, first-post moderation. Currently stubbed.
- **M6** — Data migration from old Base44 app. Skipped (fresh start).
- **Email verification** — code path exists; waiting on Resend or SendGrid API key.
- **Google OAuth** — 3-stage instructions ready; paused before completing.
- **Custom domain** — currently `hsl1.netlify.app`.
- **`VITE_SITE_URL`** env var on Netlify — still unset.
- **Supabase Site URL** config in dashboard — not yet done.

---

## Bugs hit (lessons)

| Stage | Bug | Cause | Fix |
|---|---|---|---|
| Local dev start | Vite "@base44/vite-plugin not found" | User in nested `D:\hsl\HSL`, not `D:\hsl` | Removed nested folder, `cd D:\hsl` |
| App boot | "useNavigate() outside Router" | Hook used in AuthProvider (wraps Router) | Removed useNavigate, used `window.location` |
| Register | "Cannot read 'honeypot_caught'" | Function shim returned raw data; Base44 expects `{data:...}` wrapper | Wrapped all responses in `{data:...}` |
| Login | "Email not confirmed" | Supabase default requires email verification | Manual SQL confirm + dashboard toggle off |
| Login | "Email rate limit exceeded" | Supabase free-tier SMTP limits | Turn off Confirm Email in dashboard |
| Post create | "Could not find 'tags' column" | Schema used junction table; code expected text[] | Added `tags text[]` for compatibility |
| Git push | "No push destination" | Origin remote dropped | `git remote add origin ...` |
| Git push | "Rejected, non-fast-forward" | Diverged from remote | `git pull --rebase` |
| Netlify deploy | "Initializing failed" | Broken submodule reference (orphan `HSL` gitlink) | `git rm --cached HSL` + push |

---

## ⚠️ Open issues — must be aware

### 🔴 Critical — fix before public launch

1. **Privilege escalation:** Users can update their own `role` to `admin` because RLS `profiles_update_own` allows all columns. Anyone can self-promote.
2. **Demo account is shared admin** — anyone clicking "试用账号" can vandalize site.
3. **Author can edit fields they shouldn't** (`is_pinned`, `like_count`, SEO) on their own FR/Q&A posts via `posts_update_author`.
4. **`VITE_SITE_URL` not set in production** — share links + email redirects use fallback.

### 🟠 High — production-readiness blockers

5. Orphaned storage files (deleted post images never cleaned up).
6. Rate limiting is theater — stubs always return `ok:true`.
7. reCAPTCHA called in code but ignored on backend.
8. `sitemap.xml` is a no-op (SEO can't crawl).
9. `view_count` never auto-increments.
10. `first_post_approved` never checked — new accounts flood homepage.

### 🟡 Medium — quality of life

11. No pagination on homepage (fine ~50 posts, painful past 200).
12. Categories don't show post counts.
13. Search is substring only (`ilike '%query%'`).
14. Trigram indexes index raw HTML — match on tags.
15. No profile edit UI for users (bio / avatar / username).
16. No comment thread depth limit.
17. No email service wired (no password reset, verification, notifications).
18. No analytics or error tracking.

### 🟢 Low — nice to have later

- Custom domain
- OG images per post
- PWA manifest
- Image CDN / WebP / lazy-load
- `robots.txt`
- Notifications (bell icon)
- Bookmarks / save posts
- @mentions
- Q&A best-answer marking
- Draft autosave
- RSS feed
- Edit history on posts/comments
- 2FA for admins
- CI/CD (lint + typecheck on PR)

---

## Where we are NOW

- ✅ Live URL working: https://hsl1.netlify.app
- ✅ Auth flow working (email + demo button)
- ✅ Posts, comments, likes, reports, share — all functional
- ✅ Admin dashboard works
- ⚠️ **Soft-launch ready** for friends / internal testing only
- ❌ **NOT safe to share publicly** until critical fixes #1–#4 are done

**Admin user:** `dogdog@gmail.com`
**Demo user:** `demo@hsl.test` / `demo1234` (shared, admin — risky)

---

## What to do NEXT

### Stage A — Lock down security (~1 hour, mostly SQL)

1. SQL: restrict `profiles_update_own` to safe columns only
2. SQL: restrict `posts_update_author` to safe columns only
3. Demote demo account from admin OR set up nightly auto-reset
4. Set `VITE_SITE_URL` in Netlify + Supabase Site URL in dashboard

### Stage B — Wire up real services (~2 hours)

5. Google OAuth (10 min — Google Console + Supabase paste)
6. Resend email setup (15 min — signup + API key + Edge Function)
7. Test password reset end-to-end

### Stage C — Real Edge Functions (~2–4 hours)

8. Rate limiting (server-side, IP + user-based)
9. reCAPTCHA verification on server
10. `sitemap.xml` generator
11. View count increment (with deduplication)
12. First-post moderation flow

### Stage D — Polish (ongoing)

13. Profile edit UI
14. Pagination on homepage + listing pages
15. Category post counts
16. Search upgrade to full-text
17. Storage cleanup job
18. Comment depth cap

### Stage E — Production launch

19. Buy custom domain
20. Point DNS to Netlify
21. Add analytics (Plausible) + error tracking (Sentry)
22. Share with broader testers
23. Watch logs, iterate

---

## Quick reference — credentials & links

| What | Where |
|---|---|
| Live site | https://hsl1.netlify.app |
| GitHub repo | https://github.com/shinkia/HSL |
| Supabase dashboard | https://supabase.com/dashboard/project/zazmzusudsldkvahsxgo |
| Netlify dashboard | https://app.netlify.com/projects/hsl1 |
| Local code | `D:\hsl` |
| Local dev | `npm run dev` → http://localhost:5173 |
| Supabase URL | `https://zazmzusudsldkvahsxgo.supabase.co` |
| Supabase anon key | `sb_publishable_BieD6Nu-vTn35l2NWJ7Plw_xObibb3h` |

---

## Architecture notes

### Drop-in shim approach
Instead of rewriting every page when migrating off Base44, we built shims at `src/lib/`:
- `supabase.js` — Supabase client + helpers
- `db.js` — entity shim (`Post.list()`, `User.me()`, etc. — drop-in for Base44)
- `auth.js` — auth shim (login, register, OAuth, password reset)
- `storage.js` — upload helpers + `integrations.Core.UploadFile` shim
- `functions.js` — function-invoke shim (5 client-side replacements; rest stubbed)
- `AuthContext.jsx` — rewritten on Supabase Auth with `onAuthStateChange` listener

`src/api/base44Client.js` re-exports all of the above as `base44.*` so existing code that imported the Base44 SDK keeps working without edits.

### Schema highlights
- 11 tables, all RLS-enabled
- Triggers auto-maintain `like_count`, `reply_count`, `post_count`, `comment_count`
- `handle_new_user` trigger on `auth.users` auto-creates `profiles` row with username + Dicebear avatar
- pg_trgm extension for substring search on titles + content
- Helper RLS functions: `is_admin()`, `is_staff()`, `is_banned()`
- 6 seeded categories: 心得分享, 问答, 下水场, 按摩, 广告贴, 其他

### URL structure
- Location listing: `/{kl|cheras|ampang|negeri-sembilan}`
- Post detail: `/{location}/{post-slug}`
- Old `/posts/{slug}` URLs 301-redirect to new format
- `/ns` 301 → `/negeri-sembilan`
- Category routes `/category/{slug}` preserved
