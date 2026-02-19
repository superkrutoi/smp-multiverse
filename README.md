# SMP Multiverse

Сайт-карта мультивселенной для SMP-серверов Minecraft.  
Интерфейс как Yandex Maps в космическом стиле

## Текущий статус
- Базовый layout: сайдбар, маскот, заглушка карты
- GitHub: https://github.com/superkrutoi/smp-multiverse

## Как запустить локально
1. Открой index.html в браузере
2. Или используй Live Server в VS Code

## Автоматическое обновление списка изображений

При добавлении новых изображений в папки `assets/icons`, `assets/images` или `assets/ui`, нужно обновить файл `manifest.json`:

**Windows PowerShell:**
```powershell
$manifest = @{}; foreach ($folder in @("icons", "images", "ui")) { $folderPath = "assets\$folder"; if (Test-Path $folderPath) { $files = Get-ChildItem -Path $folderPath -File | Select-Object -ExpandProperty Name; $manifest[$folder] = $files } else { $manifest[$folder] = @() } }; $json = $manifest | ConvertTo-Json -Depth 10; Set-Content -Path "assets\manifest.json" -Value $json -Encoding UTF8; Write-Host "manifest.json updated"
```

**Linux/Mac (Node.js):**
```bash
node generate-manifest.js
```

**Важно:** В браузере невозможно напрямую читать файловую систему, поэтому используется `manifest.json` как индекс файлов. После добавления новых изображений запустите команду обновления манифеста.

## Планы
- Добавить кнопку возврата панели
- Подключить Leaflet.js для карты
- Заменить эмодзи маскота на GIF

- ✓ Базовая структура страницы  
- ✓ Левая панель (сайдбар)  
- ✓ Маскот в правом нижнем углу  
- ✗ Интерактивная карта (заглушка)  
- ✗ Анимация / GIF маскота  
- ✗ Мобильная адаптивность