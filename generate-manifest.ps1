# Manifest generator script
# Scans assets folders and writes assets/manifest.json

$assetsPath = Join-Path (Get-Location) "assets"
$manifestPath = Join-Path $assetsPath "manifest.json"

$manifest = @{
    icons = @()
    images = @()
    ui = @()
}

$imageExtensions = @('.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.bmp')
$folders = @('icons', 'images', 'ui')

foreach ($folder in $folders) {
    $folderPath = Join-Path $assetsPath $folder

    if (-not (Test-Path $folderPath)) {
        Write-Host "Folder not found: $folderPath"
        continue
    }

    Write-Host "Scanning folder: $folder"

    $files = Get-ChildItem -Path $folderPath -File | Where-Object {
        $imageExtensions -contains $_.Extension.ToLowerInvariant()
    }

    foreach ($file in $files) {
        Write-Host "  Found file: $($file.Name)"
        $manifest[$folder] += $file.Name
    }

    $manifest[$folder] = @($manifest[$folder] | Sort-Object)
    Write-Host "  Total files in ${folder}: $($manifest[$folder].Count)"
}

$json = $manifest | ConvertTo-Json -Depth 10
Set-Content -Path $manifestPath -Value $json -Encoding UTF8

Write-Host ""
Write-Host "manifest.json generated at: $manifestPath"
Write-Host ""
Write-Host "Content:"
Write-Host ($json | Out-String)
