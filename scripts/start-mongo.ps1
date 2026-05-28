$mongoBase = "C:\Program Files\MongoDB\Server"
if (-not (Test-Path $mongoBase)) {
    Write-Host "MongoDB not found in C:\Program Files\MongoDB\Server." -ForegroundColor Yellow
    Write-Host "If you installed MongoDB elsewhere, update this script or run mongod.exe directly." -ForegroundColor Yellow
    exit 1
}

$versions = Get-ChildItem $mongoBase | Where-Object { $_.PSIsContainer } | Sort-Object Name -Descending
if (-not $versions) {
    Write-Host "No MongoDB versions found under $mongoBase." -ForegroundColor Yellow
    exit 1
}

$versionDir = $versions[0].FullName
$mongodPath = Join-Path $versionDir "bin\mongod.exe"
if (-not (Test-Path $mongodPath)) {
    Write-Host "mongod.exe not found at expected path: $mongodPath" -ForegroundColor Red
    exit 1
}

$dbPath = "C:\data\db"
if (-not (Test-Path $dbPath)) {
    New-Item -ItemType Directory -Path $dbPath | Out-Null
    Write-Host "Created data directory: $dbPath"
}

Write-Host "Starting MongoDB from: $mongodPath" -ForegroundColor Green
Write-Host "Using dbpath: $dbPath" -ForegroundColor Green
Start-Process -FilePath $mongodPath -ArgumentList "--dbpath `"$dbPath`"" -NoNewWindow
Write-Host "MongoDB start command sent. Verify the server is running on mongodb://127.0.0.1:27017." -ForegroundColor Green
