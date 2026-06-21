# HSL Forum — one-shot setup for a new machine.
# Run from anywhere:  powershell -ExecutionPolicy Bypass -File .\setup.ps1
# Defaults to cloning into D:\hsl. Override:  .\setup.ps1 -Path "C:\code\hsl"

param(
  [string]$Path = "D:\hsl",
  [string]$RepoUrl = "https://github.com/shinkia/HSL.git"
)

$ErrorActionPreference = "Stop"

function Test-Cmd($name) {
  return (Get-Command $name -ErrorAction SilentlyContinue) -ne $null
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  HSL Forum — Machine Setup" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# 1) Prerequisites ------------------------------------------------------------
Write-Host "[1/5] Checking prerequisites..." -ForegroundColor Yellow

if (-not (Test-Cmd "git")) {
  Write-Host "  ERROR: git not found." -ForegroundColor Red
  Write-Host "  Install from: https://git-scm.com/download/win" -ForegroundColor Red
  exit 1
}
$gitVersion = (git --version) -replace 'git version ', ''
Write-Host "  git $gitVersion" -ForegroundColor Green

if (-not (Test-Cmd "node")) {
  Write-Host "  ERROR: node not found." -ForegroundColor Red
  Write-Host "  Install LTS 20+ from: https://nodejs.org/en/download" -ForegroundColor Red
  exit 1
}
$nodeVersion = node -v
Write-Host "  node $nodeVersion" -ForegroundColor Green

if (-not (Test-Cmd "npm")) {
  Write-Host "  ERROR: npm not found (comes with node)." -ForegroundColor Red
  exit 1
}
Write-Host "  npm $(npm -v)" -ForegroundColor Green
Write-Host ""

# 2) Clone or update ---------------------------------------------------------
Write-Host "[2/5] Setting up repo at $Path ..." -ForegroundColor Yellow

if (Test-Path "$Path\.git") {
  Write-Host "  Repo already exists — pulling latest from main..."
  Push-Location $Path
  git pull --rebase origin main
  Pop-Location
} else {
  if (Test-Path $Path) {
    $files = Get-ChildItem $Path -Force -ErrorAction SilentlyContinue
    if ($files) {
      Write-Host "  ERROR: $Path exists and is not empty. Move/rename it or pass -Path." -ForegroundColor Red
      exit 1
    }
  }
  git clone $RepoUrl $Path
}
Set-Location $Path
Write-Host "  OK" -ForegroundColor Green
Write-Host ""

# 3) .env file ---------------------------------------------------------------
Write-Host "[3/5] Writing .env file..." -ForegroundColor Yellow

$envContent = @"
VITE_SUPABASE_URL=https://zazmzusudsldkvahsxgo.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_BieD6Nu-vTn35l2NWJ7Plw_xObibb3h
VITE_SITE_URL=http://localhost:5173
"@

if (Test-Path ".env") {
  Write-Host "  .env already exists — leaving it untouched."
} else {
  Set-Content -Path ".env" -Value $envContent -NoNewline
  Write-Host "  .env created" -ForegroundColor Green
}
Write-Host ""

# 4) Install dependencies ----------------------------------------------------
Write-Host "[4/5] Running npm install (this takes 1-3 min)..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
  Write-Host "  npm install failed." -ForegroundColor Red
  exit 1
}
Write-Host "  Dependencies installed" -ForegroundColor Green
Write-Host ""

# 5) Done --------------------------------------------------------------------
Write-Host "[5/5] Done." -ForegroundColor Yellow
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Setup complete." -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next:"
Write-Host "  1. Open the folder in Cursor/VS Code:" -ForegroundColor White
Write-Host "       cursor `"$Path`"" -ForegroundColor Gray
Write-Host "  2. Add this folder to Cowork (so Claude can read/write it)"
Write-Host "  3. Start the dev server:" -ForegroundColor White
Write-Host "       npm run dev" -ForegroundColor Gray
Write-Host "     then open http://localhost:5173"
Write-Host ""
Write-Host "Day-to-day:"
Write-Host "  - Before switching machines: git add -A; git commit -m 'wip'; git push" -ForegroundColor Gray
Write-Host "  - After switching:           git pull" -ForegroundColor Gray
Write-Host ""
