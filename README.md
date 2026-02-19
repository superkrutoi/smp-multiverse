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

**Windows PowerShell (короткая команда):**
```powershell
$m=@{}; @("icons","images","ui")|%{$p="assets\$_"; $m[$_]=if(Test-Path $p){@(Get-ChildItem $p -File|Select -Expand Name)}else{@()}}; $j="{`n"+($m.Keys|%{"  `"$_`": [`n"+(($m[$_]|%{"    `"$_`""})-join",`n")+"`n  ]"}|%{$i++;$_+$(if($i-lt$m.Count){","}else{""})})-join"`n"+"`n}"; $j|Set-Content "assets\manifest.json" -Encoding UTF8; "manifest.json updated"
```

**Windows PowerShell (используя скрипт):**
```powershell
powershell -ExecutionPolicy Bypass -File generate-manifest.ps1
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