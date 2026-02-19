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
        $files = @(Get-ChildItem -Path $folderPath -File | Select-Object -ExpandProperty Name)
        $manifest[$folder] = $files
    } else {
        $manifest[$folder] = @()
    }
}

# Записываем manifest.json с правильным форматированием массивов
$jsonSettings = New-Object System.Collections.Generic.List[string]
$jsonSettings.Add('{')
foreach ($key in $manifest.Keys) {
    $jsonSettings.Add("  `"$key`": [")
    $items = $manifest[$key]
    for ($i = 0; $i -lt $items.Count; $i++) {
        $comma = if ($i -lt $items.Count - 1) { "," } else { "" }
        $jsonSettings.Add("    `"$($items[$i])`"$comma")
    }
    $isLast = ($key -eq ($manifest.Keys | Select-Object -Last 1))
    $comma = if (-not $isLast) { "," } else { "" }
    $jsonSettings.Add("  ]$comma")
}
$jsonSettings.Add('}')

$jsonContent = $jsonSettings -join "`n"
Set-Content -Path $manifestPath -Value $jsonContent -Encoding UTF8

Write-Host "✅ manifest.json успешно создан!" -ForegroundColor Green
Write-Host "📁 Найдено файлов:" -ForegroundColor Cyan
foreach ($folder in $manifest.Keys) {
    $count = ($manifest[$folder] | Where-Object { -not $_.StartsWith('.') }).Count
    Write-Host "   $folder`: $count файл(ов)" -ForegroundColor White
}
