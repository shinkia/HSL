# CLAUDE.md — quick reference

> Auto-loaded every turn. Keep slim.
> **For doctrine + safety rules + agent workflow: read `AGENTS.md`.**
> **For deep technical context (schema, bug history, file map, backlog): read `HANDOFF.md`.**

**Last updated:** 2026-06-29

---

## Project at a glance

- **Hamsaplou (HSL)** — Chinese-language community forum/classifieds for KL / Cheras / Ampang / Negeri Sembilan / Seremban
- **Live:** https://hamsaplou.com · **Staging:** https://staging--hsl1.netlify.app
- **Repo:** https://github.com/shinkia/HSL · **Local:** `D:\hsl`
- **Stack:** React + Vite + Tailwind + Radix + Tiptap + TanStack Query · Supabase (`zazmzusudsldkvahsxgo`, Tokyo) · Netlify · Resend SMTP · Google OAuth

---

## The 5 rules you must not break

1. **Shim only.** Pages/components import from `@/api/base44Client`. Never call Supabase client directly from `src/pages/**` or `src/components/**`.
2. **DDL via `apply_migration`,** never `execute_sql`. Run `get_advisors` after. Don't drop/disable-RLS without explicit "go".
3. **Branch protocol.** `staging` first, then `main`. No `--force` push ever. Always `git pull --rebase`.
4. **Staging DB == prod DB.** Risky DB changes go on a Supabase branch first (~$0.30/day).
5. **No secrets in `src/`.** Service role key lives in Edge Function env only.

---

## Working conventions

- UI strings: Simplified Chinese. Code: English.
- Editor: Tiptap (NOT Quill).
- Toasts: `@/components/ui/use-toast` (NOT `@/hooks/use-toast`).
- Fonts: Noto Sans SC stack. Colors: bg `#FAFAFA`, text `#1a1a1a`, accent `#0D9488`. Tap targets ≥ 44px.

---

## Shim cheatsheet

```
src/api/base44Client.js  → exports `base44`
src/lib/db.js            → Post, Comment, Category, Tag, MediaItem, Reaction, Report, BanLog, User
src/lib/auth.js          → login, register, OAuth, password reset
src/lib/storage.js       → uploadPostImage, uploadAvatar
src/lib/functions.js     → invoke('checkRateLimit'|'recordPostView'|'submitReport'|…)
```

When editing pages: `import { base44 } from "@/api/base44Client"` then `base44.entities.Post.list(...)`, `base44.auth.me()`, etc.

---

## Local dev workflow (Cursor + live preview)

This is the closest thing to Base44 — AI edits local files, Vite hot-reloads instantly.

**One-time setup (in Cursor terminal):**
```bash
npm install -g @anthropic-ai/claude-code   # install Claude Code CLI
cp .env.example .env.local                 # then fill in VITE_SUPABASE_ANON_KEY
```
Anon key is in `setup.ps1` lines 73–77.

**Every session — open 2 terminals in Cursor:**
```
Terminal A:  npm run dev        → http://localhost:5173 (live browser)
Terminal B:  claude             → AI edits files → Vite hot-reloads instantly
```

**Ship when ready:**
```
staging branch  →  staging--hsl1.netlify.app  (review here)
main branch     →  hamsaplou.com              (go live)
```

> **Warning:** local dev hits the **prod Supabase** DB. For destructive tests, create a Supabase branch first (`~$0.30/day`).

---

## Where to find what

| Need | File |
|---|---|
| Agent doctrine + safety + workflow | `AGENTS.md` |
| Full schema, RLS, triggers, RPCs | `HANDOFF.md` §5–§6 |
| Bug history + gotchas | `HANDOFF.md` §12–§13 |
| Pending work + backlog | `HANDOFF.md` §11 |
| Recent commits | `git log --oneline -20` |
| Schema migrations | `supabase/migrations/` |
| Cursor inline rules | `.cursor/rules/*.mdc` |
| Subagent definitions | `.claude/agents/*.md` |
| Preflight before push | `scripts/preflight.ps1` |
