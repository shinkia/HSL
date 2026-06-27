# HSL Forum — AI Handoff Document

**Purpose:** Complete project context so a new AI session (or new collaborator) can pick up exactly where the previous session left off. Read this entire document before doing any work.

**Last updated:** 2026-06-22

---

## 1. Project at a glance

- **Name:** 邻里荟 (Linlihui)
- **Type:** Chinese-language community forum + classifieds for Malaysia (KL, Cheras, Ampang, Negeri Sembilan)
- **Live URL:** https://hamsaplou.com
- **Staging URL:** https://staging--hsl1.netlify.app
- **Local dev:** `D:\hsl` → `npm run dev` → http://localhost:5173
- **Inspired by:** fungps01.com (classifieds + reviews pattern)
- **State:** Production-deployed with real users not yet onboarded. Content upload pending.

---

## 2. Stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend | React + Vite + Tailwind + Radix UI + Tiptap + React Router + TanStack Query | Migrated from Base44 → vanilla |
| Backend | Supabase (Postgres 17 + Auth + Storage + Edge Functions) | Project ID: `zazmzusudsldkvahsxgo`, region Tokyo (ap-northeast-1) |
| Hosting | Netlify | Site ID: `2ec259b9-7c7c-4983-8abf-94c3882affb3` |
| Domain | `hamsaplou.com` from Namecheap, DNS via Netlify nameservers (`*.p01.nsone.net`) |
| Email | Resend (SMTP into Supabase Auth) | DKIM/SPF/MX verified on `hamsaplou.com` |
| Auth | Supabase Auth (email/password + Google OAuth + soon Turnstile CAPTCHA) |
| Anti-spam | Rate-limit RPC, honeypot fields, first-post moderation trigger, Turnstile (being wired) |

---

## 3. Credentials & links

| What | Where |
|---|---|
| Production | https://hamsaplou.com |
| Staging | https://staging--hsl1.netlify.app |
| GitHub repo | https://github.com/shinkia/HSL (public) |
| Supabase dashboard | https://supabase.com/dashboard/project/zazmzusudsldkvahsxgo |
| Netlify dashboard | https://app.netlify.com/projects/hsl1 |
| Supabase URL | `https://zazmzusudsldkvahsxgo.supabase.co` |
| Supabase anon key | `sb_publishable_BieD6Nu-vTn35l2NWJ7Plw_xObibb3h` |
| Admin user | `dogdog@gmail.com` (role=admin) |
| Demo user | `demo@hsl.test` / `demo1234` (role=user; shared, used by 试用账号 button) |
| Owner | Zack — `jackietoh.sec@gmail.com` (GitHub `shinkia`) |
| Local code | `D:\hsl` |

---

## 4. Architecture — Drop-in shim pattern

**Critical:** the codebase still uses the original Base44 SDK interface (`base44.entities.X`, `base44.auth.X`, `base44.functions.invoke()`), but the implementation is now Supabase. Built shims at `src/lib/`:

```
src/lib/
  supabase.js      — Supabase client + must() helper
  db.js            — entity shim: Post, Comment, Category, Tag, MediaItem, Reaction, Report, BanLog, User
                     Category.list() queries the category_with_counts view (post counts free)
                     CategoryWithCounts and searchPosts also exported
  auth.js          — auth shim: login (positional+object), register, OAuth, password reset
  storage.js       — uploadPostImage / uploadAvatar + integrations.Core.UploadFile shim
  functions.js     — function-invoke shim: rate limit RPC wrapper, recordPostView, toggleLike,
                     submitReport, getPendingReportCount, getReports, actionReport, trackShare,
                     banUser, unbanUser, getSystemStatus, etc.
  AuthContext.jsx  — uses supabase.auth.onAuthStateChange listener
src/api/
  base44Client.js  — re-exports as { entities, auth, functions, integrations } so existing imports work
```

**Rule:** when editing pages, KEEP using `base44.entities.X` API. Do NOT call Supabase client directly from pages — go through the shim so the surface stays consistent.

---

## 5. Database schema (Supabase Postgres)

11 tables in `public` schema, all RLS-enabled:

- `profiles` (extends `auth.users`): username, role (admin/moderator/author/user), avatar, bio, email_verified, first_post_approved, first_comment_approved, banned, banned_reason, banned_until, banned_by, post_count, comment_count, last_seen
- `posts`: title, slug, content (HTML), excerpt, category_id, **location** (KL/Cheras/Ampang/Negeri Sembilan), user_id, **post_type** (classified/fr/qna), tags (text[]), images (text[]), status (draft/published/archived), cover_image, view_count, reply_count, like_count, share_count, contact_* (whatsapp/phone/telegram/link), SEO fields, is_pinned, search_tsv (generated tsvector for FT search)
- `post_tags` (junction, unused; tags is text[] on posts)
- `categories`: name, slug, color, description, sort_order. 6 seeded: 心得分享(fr), 问答(qna), 下水场, 按摩, 广告贴, 其他
- `tags`: name, slug
- `comments`: post_id, user_id, content, author_name, author_email, parent_id (recursive), status, like_count
- `reactions`: user_id, target_type (post/comment), target_id, UNIQUE(user_id, target_type, target_id)
- `reports`: reporter_id, target_type, target_id, reason (enum of 6 Chinese values), detail, status, admin_note, resolved_by/date, UNIQUE(reporter_id, target_type, target_id)
- `ban_logs`: admin_user_id, target_user_id, action (ban/unban), reason, banned_until
- `rate_limits`: identifier, action_type, created_at (for rate-limit window queries)
- `media_items`: name, url, type, size, user_id
- `post_views` (private, RLS deny-all): post_id, viewer_key, viewed_at (24h dedup for view counter)

**Views:**
- `category_with_counts` (SECURITY INVOKER): categories joined with published post count

**Triggers:**
- `set_updated_at` on profiles/posts/comments
- `reactions_after_insert/delete`: maintains like_count on posts/comments
- `comments_after_insert/delete/update`: maintains reply_count on posts + comment_count on profiles
- `posts_after_insert/delete/update`: maintains post_count on profiles
- `handle_new_user` on `auth.users`: auto-creates `profiles` row with username from metadata (fallback email prefix) + Dicebear avatar
- `profiles_safe_update_guard` (A1): blocks non-staff users from updating role, banned, email_verified, first_post_approved, counters, etc.
- `posts_safe_update_guard` (A2): blocks non-staff from updating is_pinned, counts, SEO fields, category_id, post_type, location, user_id
- `first_post_moderation_insert` (C12): forces new FR/Q&A posts to status='archived' if user.first_post_approved=false
- `first_post_approval_propagate` (C12): when staff publishes user's archived first post, flips first_post_approved=true
- `enforce_comment_depth` (D18): blocks comments deeper than 5 levels with Chinese error

**RPC functions:**
- `is_admin()`, `is_staff()`, `is_banned()` — SECURITY INVOKER helpers for RLS policies
- `current_user_role()` — returns role of caller
- `check_rate_limit(identifier, action_type, max_count, window_seconds)` (SECURITY DEFINER, callable by anon/auth) — atomic insert+count
- `prune_rate_limits()` — admin-only cleanup of >24h old rate-limit rows
- `record_post_view(post_id)` (SECURITY DEFINER, callable by anon) — 24h dedup view increment
- `search_posts(q, lim)` — uses search_tsv + ilike fallback
- `strip_html(html)` — utility for tsvector indexing

**Indexes:** trigram on title (extension `pg_trgm` in `extensions` schema), composite indexes on (location, status, created_at), (category_id, status, created_at), (user_id, created_at), (like_count desc) where published, (status, created_at) for reports.

**Storage buckets:**
- `post-images` (public): 10 MB limit, image/jpeg|png|webp|gif. RLS: public read, auth insert to `{user_id}/` prefix only, owner delete.
- `avatars` (public): 2 MB limit, image/jpeg|png|webp. Same prefix rule.

---

## 6. Edge Functions deployed

| Name | Auth | Purpose |
|---|---|---|
| `sitemap` | none (public) | Returns `<urlset>` XML for all published posts + 4 location pages + categories/tags. Netlify rewrites `/sitemap.xml` → here. |
| `storage-cleanup` | JWT required, admin-only check inside | Dry-run by default: lists orphaned files in `post-images` not referenced in posts.content/cover_image/og_image/twitter_image/images[]. Call with `?purge=true` to actually delete. Used via `/admin/system-status` UI. |

---

## 7. URL routing

- `/` — homepage, all locations mixed
- `/{location}` — location listing (`/kl`, `/cheras`, `/ampang`, `/negeri-sembilan`)
- `/{location}/{post-slug}` — post detail
- `/posts/{slug}` and `/post/{slug}` — 301 redirect to canonical `/{location}/{slug}`
- `/ns` — 301 redirect to `/negeri-sembilan`
- `/category/{slug}` — category listing
- `/tag/{slug}` — tag listing
- `/categories`, `/tags` — index pages
- `/search?q=` — full-text search via `search_posts` RPC
- `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify`, `/verify-pending` — auth
- `/write?type=fr|qna` — user post editor (locked to FR/Q&A only)
- `/user/{username}` — public profile (with edit button for own profile)
- `/admin/*` — admin pages (gated by `AdminLayout` checking `user.role` in {admin, moderator})

Pagination: 20 per page on Home/Location/Category/Tag pages with `LoadMoreButton` component.

---

## 8. Environments

| Tier | URL | Supabase | Notes |
|---|---|---|---|
| Local | localhost:5173 | prod (zazmzusudsldkvahsxgo) | Developer |
| Staging | staging--hsl1.netlify.app | **prod (same DB!)** | Hybrid free staging: frontend isolated, DB shared. For risky DB changes use Supabase branches on-demand (~$0.30/day) |
| Production | hamsaplou.com | prod (zazmzusudsldkvahsxgo) | Real users |

**Netlify env vars (set via MCP):**
- `VITE_SUPABASE_URL = https://zazmzusudsldkvahsxgo.supabase.co` (all contexts)
- `VITE_SUPABASE_ANON_KEY = sb_publishable_...` (all contexts)
- `VITE_SITE_URL = https://hamsaplou.com` (production)
- `VITE_SITE_URL = https://staging--hsl1.netlify.app` (branch-deploy context)
- `VITE_TURNSTILE_SITE_KEY` (TO BE ADDED — see §11 pending)

**Supabase Auth → URL Configuration:**
- Site URL: `https://hamsaplou.com`
- Additional Redirect URLs: `https://hamsaplou.com/*`, `https://staging--hsl1.netlify.app/*`, `http://localhost:5173/*`

**Supabase Auth → Email:** Custom SMTP via Resend (host `smtp.resend.com:465`, user `resend`, pass = Resend API key, sender `noreply@hamsaplou.com`). Email confirmation: **see §11 pending decision**.

**Supabase Auth → Google provider:** Enabled. Client ID + Secret from Google Cloud OAuth client `HSL Web` (project "HSL dot com").

**Supabase Auth → Attack Protection:** Captcha provider Turnstile being wired (§11 pending).

**Google OAuth Authorized JavaScript origins:** `hamsaplou.com`, `staging--hsl1.netlify.app`, `localhost:5173`.
**Google OAuth Authorized redirect URI:** `https://zazmzusudsldkvahsxgo.supabase.co/auth/v1/callback`.

---

## 9. Workflow / conventions

### Branches
- `main` = production (hamsaplou.com)
- `staging` = staging URL (staging--hsl1.netlify.app)
- **All non-trivial changes must go to `staging` first, then merge to `main`.**

### Deploy flow
```bash
git checkout staging
# edit code
git add -A && git commit -m "..." && git push origin staging
# test on staging URL
git checkout main && git merge staging && git push
# production auto-deploys
```

### Risky DB changes (schema migration, destructive Edge Function)
1. Create temporary Supabase branch via `mcp__supabase__create_branch` (cost ~$0.013/hr)
2. Apply migration to branch
3. Test
4. If good: apply to prod via `apply_migration`. If bad: drop branch.

### Code style
- UI strings: Simplified Chinese. Identifiers: English.
- Editor: Tiptap (NOT Quill — Quill's image handler was broken).
- Fonts: Noto Sans SC + PingFang SC + Microsoft YaHei fallbacks
- Colors: bg `#FAFAFA`, text `#1a1a1a`, accent teal `#0D9488`
- Tap targets: min 44×44px
- Toasts: import from `@/components/ui/use-toast` (NOT `@/hooks/use-toast`)

### Schema migration rules
- Use `apply_migration` (not `execute_sql`) for DDL
- Always enable RLS on new tables
- All functions: `SET search_path = public`
- Helper functions on `profiles`: `SECURITY INVOKER` (profiles has public read RLS)
- After DDL, run `get_advisors` for security + performance lints

### Git gotchas
- Stale `.git/index.lock` / `config.lock` — delete if blocking ops (Cursor IDE sometimes holds them)
- The nested `D:\hsl\HSL` folder kept reappearing via Cursor; add to `.gitignore` (done) and delete manually with File Explorer when seen
- Stop Vite dev server before git ops (releases locks)

---

## 10. ✅ What's been done

### Frontend polish (1-6)
Tiptap editor, loading/empty/error states, mobile responsiveness, visual + typography polish, navigation (breadcrumbs, 404, footer), pre-launch smoke test.

### Auth + features (B1, U1-U5)
- B1: User auth + profile + posting gates (anonymous can read, must login to post/comment)
- U1: User-facing FR + Q&A posting with single 发帖 button (modal picker)
- U2: Like/upvote on posts and comments
- U3: Report inappropriate content + admin moderation queue
- U4: Share button (copy link, WhatsApp, Telegram, WeChat QR, Weibo)
- U5: Location URL structure restructure

### Migration to Supabase (M1-M7)
- M1: Cloned to D:\hsl
- M2: 11 tables, RLS, triggers, indexes, 6 seeded categories
- M3: Email auth (Google was deferred, then later wired)
- M4: Storage buckets with RLS
- M5: Drop-in shim — preserves Base44 SDK surface
- M7: Deployed to Netlify

### Security (A1-A4)
- A1: profiles_safe_update_guard trigger blocks role escalation (tested — works)
- A2: posts_safe_update_guard trigger blocks author from editing is_pinned/counts/SEO
- A3: demo account demoted to role=user
- A4: VITE_SITE_URL + Supabase Site URL updated to hamsaplou.com

### Real Edge Functions / RPCs (C8-C12 + D15-D18)
- C8: check_rate_limit RPC (used by login attempts, post create, etc.)
- C10: sitemap Edge Function + Netlify rewrite
- C11: record_post_view RPC (24h dedup via post_views table)
- C12: first-post moderation triggers
- D15: category_with_counts view + Sidebar displays counts
- D16: search_tsv generated column + search_posts RPC
- D18: enforce_comment_depth trigger (max 5 levels)
- D14: Pagination (LoadMoreButton, 20/page) on Home/Location/Category/Tag

### Polish
- Page title `<title>` → "邻里荟 (Linlihui)" + OG/Twitter meta
- Profile edit UI (avatar upload, bio, username) at `/user/{me}`
- ProfileEditDialog component

### Domain + email
- hamsaplou.com from Namecheap, Netlify DNS, HTTPS via Netlify Let's Encrypt
- Resend wired into Supabase Auth SMTP
- Password reset flow works end-to-end (fixed positional vs object args bug in shim, fixed ResetPassword page to use Supabase recovery session not query token)

### Google OAuth
- Google Cloud OAuth client `HSL Web`
- Supabase Google provider enabled, Client ID + Secret pasted
- Login button works on hamsaplou.com

### Staging environment
- `staging` git branch
- Netlify auto-builds staging branch → staging--hsl1.netlify.app
- VITE_SITE_URL branch-context override
- Supabase + Google redirect URLs include staging

### Security hardening (this session, late)
- `/admin` role guard in `AdminLayout` (was missing — anyone could see admin UI shell)
- CSP, HSTS, Permissions-Policy headers in netlify.toml

### Storage cleanup
- Edge Function `storage-cleanup` deployed, admin-only, dry-run by default
- UI at `/admin/system-status` — scan + review + purge buttons

---

## 11. ⏸️ PENDING — pick up here

### IMMEDIATE: finish Turnstile + email verification (interrupted)

**Status:**
- C (email verification): user asked to toggle ON in Supabase dashboard (Auth → Providers → Email → Confirm email ON). **Need to verify they did this.**
- D (Turnstile CAPTCHA): partially done.
  - User got Cloudflare Turnstile site key + secret key
  - **NEEDS:** user to paste Site Key in chat so it can be set as `VITE_TURNSTILE_SITE_KEY` in Netlify
  - **NEEDS:** user to toggle "Enable Captcha protection" ON in Supabase → Attack Protection, paste Secret Key there
  - **NEEDS:** frontend wiring — add Turnstile widget to Register / Login / ForgotPassword pages, pass token via `options.captchaToken` to Supabase auth calls
  - After all that, push to staging, test, promote to main

### Then: critical gaps still open (from §12 audit)

1. **Untested on live:** Comment posting, comment depth trigger, report submission flow, moderation queue, first-post moderation, storage cleanup on actual orphan
2. **No 2FA for admin**
3. **No analytics** (Plausible / Umami recommended)
4. **No error tracking** (Sentry recommended)
5. **Many schema migrations bypassed staging today** — going forward, all DB changes must hit a Supabase branch first
6. **Content upload not started** — user said this is the real blocker

### Nice-to-have backlog
- OG image per post (link previews)
- PWA manifest
- Notifications (bell icon)
- Bookmarks
- @mentions
- Q&A best-answer marking
- Draft autosave
- RSS feed
- Edit history
- CI/CD (lint + typecheck on PR)
- Image CDN / WebP / lazy load

---

## 12. ⚠️ Critical gotchas / known traps

1. **Demo account is SHARED** — anyone who clicks 试用账号 logs in as the SAME user. They can vandalize each other's actions. Demoted to role=user (good) but still risky for sharing publicly.
2. **Email verification is OFF by default after our setup** (we disabled for demo). C task above re-enables it.
3. **`tags` is text[] on posts** even though `post_tags` junction table exists. Junction is unused; we kept text[] for shim compatibility.
4. **`created_date` field doesn't exist in Supabase**, only `created_at`. My shim maps `created_date` → `created_at` for orderBy/filter, but page code reading `post.created_date` will get undefined. Watch for this when porting old Base44 code.
5. **`profiles_safe_update_guard` trigger silently resets protected fields** instead of throwing. Users see "saved" but role/banned didn't change. This is intentional (no info leak) but can be confusing during debugging.
6. **Service-role key is set as Supabase Edge Function env var** but NEVER appear in client bundle. If you see `SUPABASE_SERVICE_ROLE_KEY` in any `src/` file, that's a critical leak.
7. **Hybrid staging shares prod DB.** Frontend changes are isolated. ANY DB change tested on "staging" actually affects production. For destructive DB ops use a Supabase branch instead.
8. **Tiptap stores images as full URLs inside HTML content.** Storage cleanup function scans `content`, `cover_image`, `og_image`, `twitter_image`, and `images[]` for the bucket URL prefix.
9. **The MX record at `@` for "Enable Receiving"** in Resend should stay OFF — Resend was for sending only.
10. **Captcha after wiring** will mean all auth API calls (signup, signin, password reset) MUST pass a Turnstile token. Without it Supabase rejects with HTTP 400.

---

## 13. Bug history (lessons)

| Bug | Cause | Fix |
|---|---|---|
| Vite "@base44/vite-plugin not found" | User in nested D:\hsl\HSL | Removed nested folder, cd D:\hsl |
| App boot "useNavigate() outside Router" | Hook used in AuthProvider | Removed useNavigate, used window.location |
| Register "Cannot read 'honeypot_caught'" | Shim returned raw data; Base44 SDK wraps in `{data:...}` | Wrapped all function responses |
| Login "Email not confirmed" | Supabase default required email verify | Manual SQL confirm + dashboard toggle off |
| Login "Email rate limit exceeded" | Supabase free SMTP throttle | Disable Confirm Email; we'll re-enable now that Resend is wired |
| Post create "Could not find 'tags' column" | Schema used junction table; code expects text[] | Added `tags text[]` column |
| Git push "No push destination" | origin remote dropped | `git remote add origin ...` |
| Git push "Rejected, non-fast-forward" | Diverged from remote | `git pull --rebase` |
| Netlify "Initializing failed" | Orphan HSL submodule gitlink | `git rm --cached HSL` + `.gitignore HSL/` |
| /recover "400: Password recovery requires an email" | Page called `resetPasswordRequest(email)` positional; shim expected `{email}` | Shim now accepts both forms |
| Reset password page "Invalid reset link" | Page checked `?token=` query but Supabase uses URL hash | Rewrote ResetPassword to listen for PASSWORD_RECOVERY event |
| Resend SMTP "Invalid username" | User had wrong value in Username field | Must be exactly `resend` (lowercase, no quotes) |
| `category_with_counts` view ERROR | View inherited SECURITY DEFINER from creator | Recreated with `WITH (security_invoker=true)` |
| /admin accessible to non-admins | AdminLayout had no role check | Added isStaff guard + Loader + 无访问权限 page |

---

## 14. File layout (key files)

```
D:\hsl
├── .env, .env.example           — VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_SITE_URL
├── netlify.toml                 — build cmd, SPA fallback, sitemap rewrite, security headers
├── CLAUDE.md                    — short context for Claude (auto-loaded)
├── PROJECT_STATUS.md            — earlier status snapshot
├── HANDOFF.md                   — THIS FILE
├── setup.ps1                    — one-shot machine setup script for new dev machines
├── public/
│   └── robots.txt               — currently blocks all crawlers (pre-launch mode)
├── src/
│   ├── api/base44Client.js      — Supabase shim wrapper
│   ├── lib/
│   │   ├── supabase.js          — Supabase client
│   │   ├── db.js                — entity shim
│   │   ├── auth.js              — auth shim
│   │   ├── storage.js           — upload helpers
│   │   ├── functions.js         — function-invoke shim
│   │   ├── AuthContext.jsx
│   │   ├── locations.js         — KL/Cheras/Ampang/NS location mapping
│   │   └── app-params.js        — legacy, no-op
│   ├── components/
│   │   ├── forum/               — Navbar, Sidebar, PostCard, CommentSection, LikeButton, ShareButton, ReportButton, ContactButtons, ProfileEditDialog, Breadcrumbs, etc.
│   │   ├── admin/               — AdminLayout (with role guard), PostEditor, TiptapEditor, ReportCard
│   │   ├── common/              — LoadMoreButton, EmptyState, ErrorState, PostListSkeleton, PostDetailSkeleton
│   │   └── ui/                  — Radix-based primitives (Button, Input, Dialog, etc.)
│   ├── pages/                   — Home, PostDetail, LocationPage, CategoryPage, TagPage, SearchPage, WritePost, ProfilePage, Login, Register, ForgotPassword, ResetPassword, Verify, Banned, StaticPage
│   ├── pages/admin/             — AdminDashboard, PostsList, CategoriesManager, TagsManager, MediaLibrary, UsersManager, ReportsManager, SystemStatus
│   ├── hooks/useLikes.js
│   └── App.jsx                  — React Router setup
└── base44/                      — old Base44 entity/function definitions (kept for reference, not used)
```

---

## 15. How to continue (next AI / collaborator)

**Read this entire file first.** Then:

1. **Check `git status` on D:\hsl** — confirm clean working tree, on `staging` branch
2. **Verify the live site loads** (https://hamsaplou.com) and admin login works
3. **Check current open task** from §11 (likely Turnstile CAPTCHA frontend wiring)
4. **Ask user to confirm:**
   - Did they toggle "Confirm email" ON in Supabase? (C task)
   - Do they have the Turnstile Site Key ready to paste?
5. **Resume from the pending item** — finish Turnstile wiring, push to staging, test, promote.

**For any new feature/fix:**
- Discuss approach with user before coding
- Use `staging` branch first
- Run `get_advisors` after DDL
- Update this file (HANDOFF.md) with any new decisions, gotchas, or pending items
- Keep CLAUDE.md in sync with major changes

**Tools available (Cowork session):**
- Supabase MCP (`mcp__f4d4232d-...`) — schema, RPCs, Edge Functions, RLS
- Netlify MCP (`mcp__9065e8ae-...`) — project info, env vars, deploys
- Cowork file tools — Read/Edit/Write on D:\hsl
- Workspace bash — `/sessions/.../mnt/hsl/` = D:\hsl
- mcp-registry — search for more connectors if needed

**What I (the AI) cannot do for the user:**
- Click in Google Cloud Console (OAuth credential UI)
- Click in Cloudflare dashboard (Turnstile)
- Click in Supabase dashboard for auth provider toggles
- Run git commands on user's local machine (sandbox can't push due to no credentials)
- See the live site rendered (sandbox fetch returns SPA shell, not JS-rendered content)

For those, give the user clear copy-pasteable instructions and ask for screenshots.

---

**End of handoff document.** When in doubt, ask the user.
