# PowerShell скрипт для генерации manifest.json
# Использование: .\generate-manifest.ps1

$assetsDir = Join-Path $PSScriptRoot "assets"
$manifestPath = Join-Path $assetsDir "manifest.json"

# Папки для сканирования
$folders = @("icons", "images", "ui")

$manifest = @{}

foreach ($folder in $folders) {
    $folderPath = Join-Path $assetsDir $folder
    
    if (Test-Path $folderPath) {
        $files = Get-ChildItem -Path $folderPath -File | Select-Object -ExpandProperty Name
        $manifest[$folder] = $files
    } else {
        $manifest[$folder] = @()
    }
}

# Записываем manifest.json
$json = $manifest | ConvertTo-Json -Depth 10
Set-Content -Path $manifestPath -Value $json -Encoding UTF8

Write-Host "✅ manifest.json успешно создан!" -ForegroundColor Green
Write-Host "📁 Найдено файлов:" -ForegroundColor Cyan
foreach ($folder in $manifest.Keys) {
    $count = ($manifest[$folder] | Where-Object { -not $_.StartsWith('.') }).Count
    Write-Host "   $folder`: $count файл(ов)" -ForegroundColor White
}
