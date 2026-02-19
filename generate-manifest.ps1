# Скрипт для генерации manifest.json
# Сканирует папки assets и создаёт список всех файлов

$assetsPath = Join-Path (Get-Location) "assets"
$manifestPath = Join-Path $assetsPath "manifest.json"

# Инициализируем объект для манифеста
$manifest = @{
    icons = @()
    images = @()
    ui = @()
}

# Получаем поддерживаемые расширения
$imageExtensions = @('.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.bmp')

# Сканируем каждую папку
foreach ($folder in @('icons', 'images', 'ui')) {
    $folderPath = Join-Path $assetsPath $folder
    
    if (Test-Path $folderPath) {
        Write-Host "Сканирую папку: $folder"
        
        $files = Get-ChildItem -Path $folderPath -File | Where-Object {
            $imageExtensions -contains $_.Extension.ToLower()
        }
        
        foreach ($file in $files) {
            Write-Host "  Найден файл: $($file.Name)"
            $manifest[$folder] += $file.Name
        }
        
        Write-Host "  Всего файлов в $folder : $($manifest[$folder].Count)"
    } else {
        Write-Host "Папка не найдена: $folderPath"
    }
}

# Сортируем файлы в каждой папке
foreach ($folder in @('icons', 'images', 'ui')) {
    $manifest[$folder] = @($manifest[$folder] | Sort-Object)
}

# Сохраняем в JSON
$json = $manifest | ConvertTo-Json -Depth 10
Set-Content -Path $manifestPath -Value $json -Encoding UTF8

Write-Host ""
Write-Host "✓ manifest.json создан в: $manifestPath"
Write-Host ""
Write-Host "Содержимое:"
Write-Host ($json | Out-String)
