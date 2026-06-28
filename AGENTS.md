# AGENTS.md — Hamsaplou Forum Project Doctrine

> Single source of truth for AI agents working on this project.
> Tool-agnostic: Cursor, Claude Code, Codex, and humans all read this.
> For deep historical context (full schema, bug log, file map, backlog), open `HANDOFF.md`.

---

## 1. Project facts

- **Name:** Hamsaplou (HSL)
- **Type:** Chinese-language community forum + classifieds for Malaysia (KL, Cheras, Ampang, Negeri Sembilan, Seremban)
- **Live URL:** https://hamsaplou.com
- **Staging URL:** https://staging--hsl1.netlify.app
- **Repo:** https://github.com/shinkia/HSL (public)
- **Local code:** `D:\hsl`

### Stack
React + Vite + Tailwind + Radix UI + Tiptap + React Router + TanStack Query · Supabase (Postgres 17 + Auth + Storage + Edge Functions, project `zazmzusudsldkvahsxgo`) · Netlify hosting · Resend SMTP · Google OAuth.

---

## 2. Architecture — drop-in shim pattern (NON-NEGOTIABLE)

The codebase calls `base44.entities.X`, `base44.auth.X`, `base44.functions.invoke()`. Under the hood these are routed through `src/lib/` shims to Supabase. **Pages and components MUST go through the shim. Never call the Supabase client directly from `src/pages/**` or `src/components/**`.**

```
src/api/base44Client.js → src/lib/{db,auth,functions,storage,supabase}.js → Supabase
```

Reason: lets us swap the backend without editing 50+ files. Maintain it.

---

## 3. Branches & environments

| Tier | URL | Supabase | Branch |
|---|---|---|---|
| Local | localhost:5173 | prod (`zazmzusudsldkvahsxgo`) | feature branch |
| Staging | staging--hsl1.netlify.app | **prod (shared!)** | `staging` |
| Production | hamsaplou.com | prod | `main` |

**Hybrid free staging caveat:** staging frontend is isolated; staging DB is the SAME as production. Any backend change tested "on staging" actually mutates prod data. For risky DB ops, use a temporary Supabase branch (~$0.30/day) instead.

---

## 4. Workflow — one feature, end to end

```
1. Triage      → "quick fix" (1 file, <50 LOC) or "feature" (multi-file or DB)
2. Plan        → planner agent produces step list + file list + rollback note  ← human approves
3. Build       → main Claude session edits on `staging` branch
4. DB change?  → db-migrator agent only; needs human "go" before applying      ← human approves
5. Review      → reviewer agent on the diff (no edits)
6. Push staging→ deployer checklist (preflight.ps1 + git push + watch Netlify)
7. Human test  → click through on staging URL
8. Promote     → git checkout main && git merge --no-ff staging && git push
9. Verify prod → load hamsaplou.com, hard-refresh, sanity check
10. Update docs → HANDOFF.md if shape of project changed
```

**Hard gates (never skip):**
- No production DDL without dry-run on a Supabase branch + human "go"
- No `git push --force` ever
- No skipping `get_advisors` after DDL
- No marking task "done" without sanity-checking the live URL

---

## 5. Specialist agents

Builder = the main Claude Code session you're in. Deployer = checklist (`scripts/preflight.ps1` + manual git/netlify steps). The rest are subagents:

| Agent | Scope | Tools | When |
|---|---|---|---|
| **planner** | Plan only, no edits | Read, Grep, Glob, WebFetch | Spec a feature before coding |
| **reviewer** | Read-only diff review | Read, Grep, Glob, Bash (read-only commands) | Second opinion on a diff before push |
| **db-migrator** | Schema work only | Supabase MCP (read + apply_migration + get_advisors) | Any DDL or RLS change |
| builder (main) | Code + docs edits | Full | Default session |
| deployer (script) | git push + verify | preflight.ps1 + manual | After review passes |

Subagent files live in `.claude/agents/`. Cursor users can manually invoke them via "Use as agent" or just paste the contents as a system prompt.

---

## 6. Safety matrix

### Supabase
- ❌ Never `execute_sql` for DDL — use `apply_migration` (versioned, replayable, ends up in `supabase/migrations/`).
- ❌ Never drop a table / disable RLS without explicit human "go".
- ❌ Service role key MUST NOT appear in `src/`. Only Edge Function env.
- ✅ After any DDL: `get_advisors` (security + performance), fix WARN/ERROR before declaring done.
- ✅ Destructive Edge Functions default to dry-run (e.g., storage-cleanup).
- ⚠️ Staging DB == prod DB. For risky migrations, create a Supabase branch first.

### Netlify
- ❌ Never delete env vars without confirmation.
- ❌ Never rename or unpublish the production project.
- ✅ `VITE_*` env vars are build-time inlined — changes need a new deploy.
- ✅ Verify deploy state = `ready` via `get-project` before declaring "shipped".

### Git
- ❌ Never `git push --force` / `--force-with-lease` without explicit "go".
- ❌ Never push direct to `main` from a feature branch — go through `staging`.
- ✅ `git pull --rebase` before every push.
- ✅ Stop Vite dev server before git ops (file lock).
- ✅ Stale `.git/index.lock` / `.git/config.lock`: delete only after confirming no process holds them.
- ✅ Watch for the nested `D:\hsl\HSL` folder reappearing; gitignored but if `git status` shows it tracked, run `git rm --cached HSL`.

### Auth & secrets
- ❌ Never log plaintext passwords, API keys, tokens, JWTs (incl. session access_tokens).
- ❌ Never weaken RLS on `profiles` — the `profiles_safe_update_guard` trigger is load-bearing.
- ✅ If you change any profile RLS, re-run the A1 escalation test (see HANDOFF §13).
- ✅ Email verification: default ON. Only flip OFF with a documented reason.

---

## 7. Conventions

- **UI strings:** Simplified Chinese. Identifiers/code: English.
- **Editor:** Tiptap (NOT Quill — Quill's image handler was broken).
- **Fonts:** Noto Sans SC + PingFang SC + Microsoft YaHei fallbacks.
- **Colors:** bg `#FAFAFA`, text `#1a1a1a`, accent teal `#0D9488`.
- **Tap targets:** min 44×44px.
- **Toasts:** import from `@/components/ui/use-toast` (NOT `@/hooks/use-toast`).
- **State:** TanStack Query for server data; local React state for UI-only state.
- **Commits:** Conventional-ish: `<type>: <imperative summary>` — types: feat, fix, refactor, docs, chore, db. Example: `fix: handle reset password URL hash`.

---

## 8. Where to find what

| Need | File |
|---|---|
| Quick context (this doc summary) | `CLAUDE.md` |
| Full schema, RLS, triggers, RPCs, Edge Functions | `HANDOFF.md` §5–§6 |
| Bug history + gotchas | `HANDOFF.md` §12–§13 |
| Pending work + backlog | `HANDOFF.md` §11 |
| Recent changes | `git log --oneline -20` |
| Schema versioning | `supabase/migrations/` (going forward) |
| Cursor inline AI rules | `.cursor/rules/*.mdc` |
| Subagent definitions | `.claude/agents/*.md` |
| Preflight script | `scripts/preflight.ps1` |

---

## 9. Open / pending (snapshot — see HANDOFF.md §11 for live list)

1. Verify latest deploy shows Hamsaplou logo + Seremban tab on hamsaplou.com
2. Finish Turnstile CAPTCHA wiring (user has keys; needs frontend widget + Supabase Attack Protection toggle)
3. Smoke test live: comments, depth trigger, reports, first-post moderation
4. Compress logo.png (currently 495 KB)
5. Backlog: notifications, bookmarks, mentions, RSS, 2FA, CI/CD, analytics — see HANDOFF.md §11.6

---

**Last updated:** 2026-06-28. When the project shape changes, update this file before closing the session.
