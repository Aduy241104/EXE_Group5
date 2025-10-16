$ErrorActionPreference = "Stop"

# 1) Giải nén
if (Test-Path ".\Uni_work") { Remove-Item ".\Uni_work" -Recurse -Force }
Expand-Archive -Path ".\Uni.zip" -DestinationPath ".\Uni_work" -Force

# 2) Xác định FE/BE
function Find-Dir($root, $cands) {
  Get-ChildItem -Recurse -Directory $root | Where-Object { $cands -contains $_.Name.ToLower() } | Select-Object -First 1
}

$root = ".\Uni_work"
$fe = Find-Dir $root @("frontend","client","web","fe","ui","app")
$be = Find-Dir $root @("backend","api","be","server")

if (-not $fe) { $fe = New-Item -ItemType Directory (Join-Path $root "Frontend") }
if (-not $be) { $be = New-Item -ItemType Directory (Join-Path $root "backend") }

Write-Host "FE: $($fe.FullName)"
Write-Host "BE: $($be.FullName)"

# 3) Chạy fixers
node .\fix_backend.mjs "$($be.FullName)"
node .\fix_frontend.mjs "$($fe.FullName)"

Write-Host "`n================ NEXT STEPS ================" -ForegroundColor Cyan
Write-Host "Backend:"
Write-Host "  cd $($be.FullName)"
Write-Host "  del package-lock.json ; rmdir /s /q node_modules"
Write-Host "  npm cache clean --force"
Write-Host "  npm i"
Write-Host "  npm run dev"
Write-Host ""
Write-Host "Frontend:"
Write-Host "  cd $($fe.FullName)"
Write-Host "  del package-lock.json ; rmdir /s /q node_modules"
Write-Host "  npm cache clean --force"
Write-Host "  npm i"
Write-Host "  npm run dev"
Write-Host "============================================"
