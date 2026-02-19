<!--metadata
updated: 2026-02-19 20:15
last_added: Полный список всех шрифтов с детальным описанием (Starseed Pro отмечен как устарел)
-->

# DESIGN-GUIDELINES.md — Руководство по дизайну SMP Multiverse

Версия: 1.0 (февраль 2026)  
Стиль: Minecraft / Xaero's World Map — пиксельный, блочный, тёмный, минималистичный, но узнаваемо «майнкрафтовый».

## Основные принципы
- Всё выглядит так, будто сделано внутри Minecraft: пиксельные шрифты, блочные рамки, инвентарные слоты, тёмный фон GUI.
- Минимализм: никаких лишних анимаций, теней, градиентов — только то, что нужно для читаемости и атмосферы.
- Цветовая палитра — максимально близка к Minecraft GUI (серо-чёрный + акценты).
- Все новые элементы и правки **обязательно** используют переменные из этого файла.
- Старые sci-fi стили (cyan glow #00ffcc и т.п.) постепенно мигрируются на Minecraft-стиль.

## Шрифты

### Основные переменные:
```css
--font-primary: 'Glasstown', monospace, sans-serif;      /* Основной текст (не жирный, читабельный) */
--font-heading: 'ContraPhobotech', 'Glasstown', monospace; /* Заголовки (жирный пиксельный) */
--font-accent: 'Mintsoda', monospace;                     /* Курсив для акцентов */
--font-size-base: 16px;
--font-size-small: 12px;
--font-size-large: 20px;
```

### Нюансы: все шрифты локальные (в `assets/fonts/`), формат .woff2

## Цвета (Minecraft GUI палитра)
```css
--mc-bg-dark:    #3f3f3f;    /* Основной фон панелей, инвентаря */
--mc-bg-medium:  #2b2b2b;    /* Тёмные слоты, акценты */
--mc-bg-light:   #c6c6c6;    /* Светлые выделения, текст на тёмном */
--mc-border:     #000000;    /* Чёрные рамки, блочный стиль */
--mc-text:       #ffffff;    /* Основной белый текст */
--mc-text-dark:  #aaaaaa;    /* Вторичный серый текст */
--mc-accent:     #55ff55;    /* Зелёный акцент (hover, активные элементы) */
--mc-accent-dark:#2ecc71;    /* Тёмно-зелёный для pressed/hover deep */
--mc-red:        #ff5555;    /* Красный для ошибок, close-кнопки */
--mc-yellow:     #ffff55;    /* Жёлтый для предупреждений */
```

## Отступы и размеры (8×8 сетка Minecraft)
```css
--spacing-unit: 8px;         /* Базовый шаг сетки (как в Minecraft) */
--border-width: 2px;         /* Толщина блочных рамок */
--slot-size:    32px;        /* Размер инвентарных слотов/иконок */
--panel-padding: calc(var(--spacing-unit) * 2);
```

## Элементы интерфейса
- **Панели и модалки**  
  Фон: var(--mc-bg-dark)  
  Рамка: 2px solid var(--mc-border)  
  Опционально: border-image с паттерном (assets/ui/mc-border.png)  
  Тень: отсутствует (только рамка)

- **Кнопки и слоты**  
  Фон: url('assets/ui/mc-button.png') или url('assets/ui/mc-slot.png')  
  Hover: filter: brightness(1.2);  
  Active/pressed: filter: brightness(0.8);  
  Текст: var(--mc-text), шрифт Minecraftia

- **Тултипы / подписи**  
  Фон: var(--mc-bg-medium)  
  Рамка: 2px solid var(--mc-border)  
  Текст: var(--mc-text), маленький размер

- **Маркеры на карте (waypoints)**  
  Иконки: блочные, 24–32 px (assets/icons/planet-*.png в MC-стиле)  
  Постоянные подписи (labels): шрифт Minecraftia, белый с чёрной обводкой (text-shadow: 1px 1px #000)

- **Sidebar**  
  Слева, как меню Xaero — тёмная панель с блочными элементами списка  
  Коллапс: сворачивается в иконки (wrench, bell и т.д.)

- **Тест-панель (#test-panel)**  
  Floating справа, блочный стиль, как HUD в игре  
  Кнопки — маленькие слоты с emoji или иконками 24×24 px

## Icons & Asset Sizing
- Основной пак: **Lucid Icons (Leo Red, CC0)**. Можно использовать без атрибуции, включая коммерцию.
- Расположение: assets/Lucid_V1.2_icons/PNG/Flat/32/ (основной), 16/ — только для мелких статусов, 160/ и 256/ — для крупных декоративных элементов.
- Базовый размер — **32×32**. Отображение масштабируем через CSS, избегаем множества копий одного ассета.
- Не смешивать разные исходные размеры в одном компоненте.
- Для пиксель-арта всегда использовать `image-rendering: pixelated;`.
- Touch-target: минимум 44×44 px (desktop, mobile, Telegram Mini App).

**Рекомендация по иконкам SMP Multiverse**
- Dev tools: `Gear.png`
- Уведомления: `Message-Three-Dots.png` (empty), `Message-Exclamation.png` (active)
- Пользователь/аватар: `Person.png`

## Typography (Типографика)

### Русскоязычные пиксельные шрифты
Все шрифты — **локальные**, лежат в `assets/fonts/`. Никаких внешних CDN (для оффлайн-доступа и Telegram Mini App).

**Доступные шрифты:**

1. **Glasstown NBP** (`GlasstownNbpRegular-RyMM.woff2`) — Пиксельный не жирный
   - Основной шрифт для всего текста (body, p, li, описания)
   - Полная поддержка кириллицы, отличная читаемость
   - Переменная: `var(--font-primary)`
   - Источник: https://www.fontspace.com/glasstown-nbp-font-f14742

2. **Contra Phobotech Regular** (`Contra Phobotech Regular.woff2`) — Пиксельный жирный ИДЕАЛЬНЫЙ
   - Отличная читаемость, без артифактов рендеринга
   - Применение: h1, h2, h3, названия серверов, логотипы
   - Переменная: `var(--font-heading)` ✅ Основные
   - Источник: https://vseshrifty.ru/fonts/contra-phobotech

3. **HUD Sonic X1** (`HUD Sonic X1 Regular.woff2`) — Пиксельный полужирный
   - Хорошая читаемость, альтернатива Glasstown для выделения
   - Применение: управление, подсказки, вторичные заголовки
   - Статус: может заменить Glasstown в определённых элементах
   - Источник: https://vseshrifty.ru/fonts/hud-sonic-x1

4. **Mintsoda Lime Green** (`MintsodaLimeGreen13X16Regular-KVvzA.woff2`) — Пиксельный курсив
   - Применение: специальные акценты, цитаты, лор-тексты
   - Переменная: `var(--font-accent)`
   - Не используется в основной типографике
   - Источник: https://www.fontspace.com/mintsoda-lime-green-font-f92418

5. **Starseed Pro** (`StarseedPro.woff2`) — Пиксельный жирный (ПЛОХОЙ вариант) ❌ Устарел
   - НЕ рекомендируется: артифакты рендеринга, плохая читаемость
   - Статус: декомиссионирован, архивные копии только
   - Заменен на: **Contra Phobotech Regular**
   - Источник: https://thefonts.ru/528-starseed-pro.html (только для референса)

6. **Dungeonmode** + **Dungeonmode Inverted** — Пиксельные в стиле ретро-игр
   - Статус: зарезервированы для будущего
   - Потенциальное применение: dev-меню, консоль, специальные эффекты
   - Источник: https://datagoblin.itch.io/dungeonmode

### @font-face правила (в style.css)
Все шрифты подключены через @font-face в начале style.css:
```css
@font-face {
    font-family: 'Glasstown';
    src: url('assets/fonts/GlasstownNbpRegular-RyMM.woff2') format('woff2');
    font-weight: normal;
    font-style: normal;
    font-display: swap;  /* критически важно! → текст не исчезает при загрузке */
}
```

- Используй **font-display: swap;** для всех шрифтов (FOUT вместо FOIT — лучший UX)
- Формат **.woff2** — стандарт 2026 года (максимальное сжатие, поддержка всех браузеров)
- Fallback-иерархия: Glasstown (основной) → monospace → sans-serif
- Mintsoda не в fallback-цепочке — используется только для специальных акцентов

### Применение в CSS
```css
/* Базовый текст (основной читабельный) */
body, p, li, .server-description {
    font-family: var(--font-primary);  /* 'Glasstown', monospace, sans-serif */
}

/* Заголовки (жирный пиксельный) */
h1, h2, h3, .sidebar h2, .image-custom-title {
    font-family: var(--font-heading);  /* 'ContraPhobotech', 'Glasstown', monospace */
    text-shadow: 2px 2px 0 #000,     /* классический MC-эффект тени */
                 -2px -2px 0 #000,
                 2px -2px 0 #000,
                 -2px 2px 0 #000;
}

/* Курсивные акценты (цитаты, лор-тексты) */
.quote, .lore-text, .special-accent {
    font-family: var(--font-accent);   /* 'Mintsoda', monospace */
}
```

### Рекомендации по размерам
- UI-текст (кнопки, labels): **не меньше 14–16 px** (читаемость на мобильных и Telegram Mini App)
- Основной текст (body): **16–18 px** (var(--font-size-base))
- Заголовки: **20–24 px** (var(--font-size-large))
- Адаптив: на мобильных уменьшай font-size на 10–20%, но не ниже 14 px

### Тени и эффекты
Используй **text-shadow** в 2–3 px чёрного для аутентичного MC-вида:
```css
text-shadow: 2px 2px 0 #000;
```
Для подписей на карте (белый текст с чёрной обводкой):
```css
text-shadow: 1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000;
```

### Добавление новых шрифтов
Если добавляешь новый шрифт:
1. Конвертируй в .woff2 (если есть только .ttf/.otf) — transfonter.org или font squirrel
2. Положи в `assets/fonts/`
3. Добавь @font-face в начало style.css
4. Обнови :root переменные (если нужно)
5. Обнови этот раздел + протестируй на мобильном и Telegram Mini App

## Анимации
- Переходы: all 0.1s linear; (быстрые, без плавности — как в Minecraft)  
- Hover: brightness + лёгкий scale(1.05)  
- Breathing (для выбранных элементов): scale(1.0 → 1.05) с keyframes, duration 1.5s infinite

## Правила применения
1. Все новые классы и стили используют **только** переменные из этого файла.
2. Старые sci-fi переменные (--glow-color, --bg-color-dark и т.п.) постепенно заменяются на --mc-*
3. При добавлении новых элементов — сначала проверяйте, есть ли подходящий стиль в Minecraft GUI (слот, кнопка, рамка).
4. Если нужен новый ассет (рамка, слот, кнопка) — кладите в assets/ui/ с префиксом mc- (mc-button.png, mc-slot.png, mc-border.png).
5. Шрифт Minecraftia обязателен для заголовков, названий серверов, подписей на карте.

## Полезные ресурсы
- Пиксельные шрифты (локально в assets/fonts/): Glasstown NBP (основной), Contra Phobotech Regular (жирный ✓), HUD Sonic X1 (полужирный), Mintsoda (курсив), ~~Starseed Pro~~ (устарел), Dungeonmode (резерв)
- Lucid Icons: assets/Lucid_V1.2_icons/ (Leo Red, CC0 — пиксельные иконки для UI)
- Текстуры Minecraft GUI: можно взять из официальных текстур-паков (public domain) или перерисовать в пиксель-арте
- Xaero's World Map референс: скриншоты интерфейса, waypoints, мини-карта

## Миграция со старого sci-fi стиля
Постепенная замена существующих элементов:
1. **Фаза 1 (завершена)**: Добавление переменных --mc-* в :root, подключение локальных пиксельных шрифтов
2. **Фаза 2 (завершена)**: Замена body, #map, sidebar на новые переменные
3. **Фаза 3 (завершена)**: Переделка модалок (dev menu, settings) в MC-стиль, замена иконок на Lucid pack
4. **Фаза 4**: Редизайн кнопок toolbar и map-tools в блочный стиль
5. **Фаза 5**: Замена всех старых cyan-glow эффектов на зелёные MC-акценты

Последнее обновление: 19 февраля 2026  
- зоны нажатия минимум 44×44 px  
- alt-тексты у всех изображений и иконок  

Если следовать этим ориентирам, сайт уже на старте выглядит заметно чище и профессиональнее. Дальше можно постепенно добавлять анимированный маскот, портал-loading, звёздный фон или переключатель тем — в зависимости от того, какой вайб хочется усилить.

