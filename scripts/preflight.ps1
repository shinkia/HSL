# preflight.ps1 — run before `git push` to catch the usual mistakes
# Usage:  cd D:\hsl ; .\scripts\preflight.ps1
# Exit codes:  0 = OK to push,  1 = fix something first

$ErrorActionPreference = "Stop"

function Write-OK   ($msg) { Write-Host "[OK]   $msg" -ForegroundColor Green }
function Write-Warn ($msg) { Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Fail ($msg) { Write-Host "[FAIL] $msg" -ForegroundColor Red }

$problems = 0

# ---------- 0. Are we in D:\hsl? ----------
$cwd = (Get-Location).Path
if ($cwd -notlike "*\hsl" -and $cwd -notlike "*\hsl\*") {
  Write-Warn "Current dir doesn't look like the project: $cwd"
} else {
  Write-OK "In project root: $cwd"
}

# ---------- 1. Branch check ----------
$branch = (git rev-parse --abbrev-ref HEAD).Trim()
Write-Host ""
if ($branch -eq "main") {
  Write-Warn "You are on 'main'. Convention: develop on 'staging' or a feature branch, then merge to main."
  Write-Warn "If you intentionally want to push to main, type 'y' and Enter to continue; anything else aborts."
  $ans = Read-Host
  if ($ans -ne "y") { Write-Fail "Aborted by user."; exit 1 }
} else {
  Write-OK "Branch: $branch"
}

# ---------- 2. Working tree status ----------
$status = git status --porcelain
if (-not $status) {
  Write-OK "Working tree clean — nothing to commit."
} else {
  $modified = ($status -split "`n").Count
  Write-OK "$modified file(s) staged/modified for commit."
}

# ---------- 3. Forbidden patterns in staged files ----------
$staged = git diff --cached --name-only
if (-not $staged) { $staged = git diff --name-only }   # nothing staged? check working tree

$badPatterns = @(
  @{Pattern = "SUPABASE_SERVICE_ROLE_KEY"; Msg = "Service role key leaking into source"},
  @{Pattern = "sb_secret_";                 Msg = "Supabase secret key in source"},
  @{Pattern = "console\.log\(.*password";  Msg = "console.log of password"},
  @{Pattern = "console\.log\(.*token";     Msg = "console.log of token"},
  @{Pattern = "import.*supabase.*from.*@/lib/supabase"; Msg = "Direct supabase import in a page/component (use the base44 shim)"}
)

foreach ($file in $staged) {
  if ($file -notmatch "\.(js|jsx|ts|tsx|json|md|html|css)$") { continue }
  if ($file -like "src/lib/*") { continue }    # lib files are allowed to import supabase
  if (-not (Test-Path $file)) { continue }
  $content = Get-Content $file -Raw -ErrorAction SilentlyContinue
  foreach ($bp in $badPatterns) {
    if ($content -match $bp.Pattern) {
      # Skip the shim-pattern check if file is under src/lib
      if ($bp.Msg -like "*shim*" -and $file -like "src/lib/*") { continue }
      Write-Fail "$file matches forbidden pattern: $($bp.Msg)"
      $problems++
    }
  }
}

if ($problems -eq 0) {
  Write-OK "No forbidden patterns in staged files."
}

# ---------- 4. .env not committed ----------
$envTracked = git ls-files .env 2>$null
if ($envTracked) {
  Write-Fail ".env is tracked by git! Remove it: git rm --cached .env"
  $problems++
} else {
  Write-OK ".env not tracked (good)."
}

# ---------- 5. Nested HSL folder guard ----------
if (Test-Path "HSL" -PathType Container) {
  $hsltracked = git ls-files HSL 2>$null
  if ($hsltracked) {
    Write-Fail "Nested HSL folder is tracked. Run: git rm --cached HSL"
    $problems++
  } else {
    Write-Warn "Nested HSL folder exists on disk but not tracked (gitignored). You can delete it manually."
  }
}

# ---------- 6. Lint (best-effort) ----------
Write-Host ""
Write-Host "Running lint (best-effort)..." -ForegroundColor Cyan
try {
  $lintOutput = npm run lint 2>&1 | Out-String
  if ($LASTEXITCODE -ne 0) {
    Write-Warn "Lint reported issues. Output:"
    Write-Host $lintOutput
    Write-Warn "Continue anyway? (y/n)"
    $ans = Read-Host
    if ($ans -ne "y") { Write-Fail "Aborted by user."; exit 1 }
  } else {
    Write-OK "Lint clean."
  }
} catch {
  Write-Warn "Could not run lint (npm not installed or no lint script): $_"
}

# ---------- 7. Ahead/behind remote ----------
git fetch origin --quiet 2>$null
$ahead  = (git rev-list --count "origin/$branch..HEAD" 2>$null)
$behind = (git rev-list --count "HEAD..origin/$branch" 2>$null)
Write-Host ""
if ($behind -gt 0) {
  Write-Fail "Branch is $behind commits BEHIND origin/$branch. Run: git pull --rebase"
  $problems++
} else {
  Write-OK "Up to date with origin/$branch (ahead by $ahead commits to push)."
}

# ---------- 8. Vite dev server running? ----------
$viteProc = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -match "vite|hsl" }
if ($viteProc) {
  Write-Warn "Node/Vite process detected — stop the dev server before git ops to avoid file locks."
}

# ---------- Final verdict ----------
Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
if ($problems -eq 0) {
  Write-Host "PREFLIGHT OK — safe to push." -ForegroundColor Green
  exit 0
} else {
  Write-Host "PREFLIGHT FAILED — $problems issue(s) above. Fix before push." -ForegroundColor Red
  exit 1
}
