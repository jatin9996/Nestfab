$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not (Test-Path "apps\api\.env")) {
  Copy-Item "apps\api\.env.example" "apps\api\.env"
}
if (-not (Test-Path "apps\web\.env.local")) {
  Copy-Item "apps\web\.env.example" "apps\web\.env.local"
}

Write-Host "Starting Postgres..."
docker compose up -d

Write-Host "Installing packages..."
npm install

Write-Host "Waiting for Postgres..."
$ready = $false
for ($i = 0; $i -lt 30; $i++) {
  docker exec nestfab-db pg_isready -U nestfab -d nestfab | Out-Null
  if ($LASTEXITCODE -eq 0) { $ready = $true; break }
  Start-Sleep -Seconds 2
}
if (-not $ready) { throw "Postgres did not become ready. Is Docker Desktop running?" }

Write-Host "Creating tables and seed data..."
npm run db:push
npm run db:seed

Write-Host ""
Write-Host "Nestfab is ready. Start it with: npm run dev"
Write-Host "Store:  http://localhost:3001"
Write-Host "Admin:  http://localhost:3001/admin"
Write-Host "API:    http://localhost:4000/api/health"
