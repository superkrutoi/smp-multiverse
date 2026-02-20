// Элементы
const sidebar = document.getElementById('sidebar');
const mapArea = document.getElementById('map-area');
const hideBtn = document.getElementById('hide-sidebar');
const showBtn = document.getElementById('show-sidebar');

// Инициализация: сайдбар видна по умолчанию, кнопка возврата скрыта
sidebar.classList.remove('hidden');
showBtn.classList.add('hidden');

function openSidebar() {
    sidebar.classList.remove('hidden');
    mapArea.classList.remove('expanded');
    showBtn.classList.add('hidden');
}

function closeSidebar() {
    sidebar.classList.add('hidden');
    mapArea.classList.add('expanded');
    showBtn.classList.remove('hidden');
}

function toggleSidebar() {
    if (sidebar.classList.contains('hidden')) {
        openSidebar();
    } else {
        closeSidebar();
    }
}

// Скрытие панели
hideBtn.addEventListener('click', () => {
    closeSidebar();
});

// Показ панели обратно
showBtn.addEventListener('click', () => {
    openSidebar();
});

// Toggle sidebar with Tab when on the map page
document.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;

    const target = e.target;
    const isEditable = target && target.closest('input, textarea, select, button, [contenteditable="true"]');
    if (isEditable) return;

    const devModal = document.getElementById('dev-menu-modal');
    const settingsModal = document.getElementById('settings-modal');
    const imageModal = document.getElementById('image-viewer-modal');
    const hasOpenModal =
        (devModal && !devModal.classList.contains('hidden')) ||
        (settingsModal && !settingsModal.classList.contains('hidden')) ||
        (imageModal && !imageModal.classList.contains('hidden'));
    if (hasOpenModal) return;

    e.preventDefault();
    toggleSidebar();
});

// Меню маскота — открыть/скрыть по клику на маскота (кнопки в меню не закрывают)
const mascotEl = document.getElementById('mascot');
mascotEl.addEventListener('click', (e) => {
    // если клик был внутри самого меню — не закрываем/не открываем
    if (e.target.closest('#mascot-menu')) return;

    // клик по картинке или по контейнеру маскота открывает меню
    if (e.target.closest('.mascot-img') || e.target === mascotEl) {
        mascotMenu.classList.toggle('hidden');
    }
});

// Закрывать меню маскота при клике вне него
document.addEventListener('click', (e) => {
    if (!mascotEl.contains(e.target) && !mascotMenu.contains(e.target)) {
        if (!mascotMenu.classList.contains('hidden')) {
            mascotMenu.classList.add('hidden');
        }
    }
});

// Notification Bell (toggle demo between bell1/bell2)
const notificationBtn = document.querySelector('.notification-bell');
const notificationImg = notificationBtn.querySelector('img');
let notificationCount = 0; // demo count

function updateNotificationIcon() {
    const emptySrc = notificationImg.dataset.bellEmpty;
    const activeSrc = notificationImg.dataset.bellActive;
    notificationImg.src = notificationCount > 0 ? activeSrc : emptySrc;
    if (notificationCount > 0) {
        notificationBtn.classList.add('has-notifications');
    } else {
        notificationBtn.classList.remove('has-notifications');
    }
}

// Если картинка не найдена — подставим data-атрибут или внешнюю заглушку
notificationImg.addEventListener('error', () => {
    const fallback = notificationImg.dataset.bellEmpty || 'https://placehold.co/24';
    if (notificationImg.src !== fallback) {
        console.warn('Notification icon failed to load, using fallback:', fallback);
        notificationImg.src = fallback;
    }
});

notificationBtn.addEventListener('click', () => {
    // Для демонстрации — переключаем между состояниями "есть уведомления" и "нет"
    notificationCount = notificationCount > 0 ? 0 : 3;
    updateNotificationIcon();
    console.log('Notifications clicked, count=', notificationCount);
});

// expose helper for other code (optional)
window.setNotificationCount = (n) => {
    notificationCount = Math.max(0, Number(n) || 0);
    updateNotificationIcon();
};

// Модальное окно настроек
const settingsModal = document.getElementById('settings-modal');
const settingsClose = document.querySelector('.settings-close');
const mascotMenu = document.getElementById('mascot-menu');

// Открыть настройки по клику на кнопку в меню маскота
mascotMenu.addEventListener('click', (e) => {
    if (e.target.textContent.trim() === 'Настройки') {
        settingsModal.classList.remove('hidden');
        mascotMenu.classList.add('hidden');
    }
});

// Закрыть настройки по клику на крестик
settingsClose.addEventListener('click', () => {
    settingsModal.classList.add('hidden');
});

// Закрыть настройки по клику вне окна (на фон)
settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
        settingsModal.classList.add('hidden');
    }
});
// Dev Menu Logic
const devMenuModal = document.getElementById('dev-menu-modal');
const devMenuClose = document.querySelector('.dev-menu-close');
const devMenuItems = document.querySelectorAll('.dev-menu-item');
const devMenuBody = document.getElementById('dev-menu-body');
const devHeaderSearchSlot = document.getElementById('dev-header-search-slot');

function renderHeaderSearch(onInput) {
    if (!devHeaderSearchSlot) return;
    devHeaderSearchSlot.innerHTML = '<div class="dev-header-search-wrap"><span class="dev-header-search-icon" aria-hidden="true">🔍</span><input id="dev-search" class="dev-header-search" type="search" placeholder="Поиск настроек..." aria-label="Поиск настроек" /></div>';
    devHeaderSearchSlot.classList.remove('hidden');
    devHeaderSearchSlot.setAttribute('aria-hidden', 'false');

    const searchInput = document.getElementById('dev-search');
    if (!searchInput) return;
    searchInput.addEventListener('input', (e) => onInput(e.target.value));
}

function clearHeaderSearch() {
    if (!devHeaderSearchSlot) return;
    devHeaderSearchSlot.innerHTML = '';
    devHeaderSearchSlot.classList.add('hidden');
    devHeaderSearchSlot.setAttribute('aria-hidden', 'true');
}

// Открыть меню разработчика
document.querySelector('.dev-toggle').addEventListener('click', () => {
    devMenuModal.classList.remove('hidden');
});

// Закрыть меню по крестику
devMenuClose.addEventListener('click', () => {
    devMenuModal.classList.add('hidden');
});

// Закрыть меню по клику на фон (вне контейнера)
devMenuModal.addEventListener('click', (e) => {
    if (e.target === devMenuModal) {
        devMenuModal.classList.add('hidden');
    }
});
// ===== GLOBAL MAP TOOLS STATE =====
let mapState = null;
let mapToolsAPI = null;
let mapToolsUI = null;

const renderDevMenuItem = async (itemNumber) => {
    devMenuBody.classList.toggle('dev-menu-body--images', String(itemNumber) === '2');

    const headerSubtabs = document.getElementById('dev-subtabs');
    const headerReportsTabs = document.getElementById('dev-reports-tabs');
    if (headerSubtabs) {
        headerSubtabs.classList.add('hidden');
        headerSubtabs.setAttribute('aria-hidden', 'true');
    }
    if (headerReportsTabs) {
        headerReportsTabs.classList.add('hidden');
        headerReportsTabs.setAttribute('aria-hidden', 'true');
    }

    if (String(itemNumber) === '1') {
        // Настройки — поисковая строка сверху + список настроек (восстановленный)
        const devSubtabs = document.getElementById('dev-subtabs');
        if (devSubtabs) devSubtabs.classList.add('hidden');
        clearHeaderSearch();

        devMenuBody.innerHTML = `
            <div class="dev-settings-container">
                <div id="dev-settings-list" class="dev-settings-list">
                    <!-- элементы списка будут вставлены JS -->
                </div>
            </div>
        `;

        const settings = [
            { id: 'ui-dark', name: 'Тёмная тема', type: 'checkbox', checked: true },
            { id: 'show-tooltips', name: 'Показывать подсказки', type: 'checkbox', checked: true },
            { id: 'compact-mode', name: 'Компактный режим', type: 'checkbox', checked: false },
            { id: 'map-animations', name: 'Анимация карты', type: 'checkbox', checked: true },
            { id: 'enable-sounds', name: 'Звуковые уведомления', type: 'checkbox', checked: false },
            { id: 'map-testing-interface', name: 'Интерфес тестирования карты', type: 'checkbox', checked: false },
            { id: 'hide-map-comments', name: 'Скрыть комментарии', type: 'checkbox', checked: false }
        ];

        const listEl = document.getElementById('dev-settings-list');
        function renderList(filter = '') {
            const q = filter.trim().toLowerCase();

            const filtered = settings.filter(s => s.name.toLowerCase().includes(q));
            const mainSettings = filtered.filter(s => s.id === 'map-testing-interface');
            const miscSettings = filtered.filter(s => s.id !== 'map-testing-interface');

            const renderSettingsItems = (items) => items.map(s => `
                <label class="setting-item">
                    <span class="setting-label">${s.name}</span>
                    <input type="${s.type}" id="${s.id}" ${s.checked ? 'checked' : ''} />
                    <span class="checkmark"></span>
                </label>
            `).join('');

            let html = '';
            if (mainSettings.length > 0) {
                html += `
                    <div class="settings-section">
                        <h2>ОСНОВНЫЕ</h2>
                        ${renderSettingsItems(mainSettings)}
                    </div>
                `;
            }

            if (miscSettings.length > 0) {
                html += `
                    <div class="settings-section">
                        <h2>ВСЯКАЯ ФИГНЯ</h2>
                        ${renderSettingsItems(miscSettings)}
                    </div>
                `;
            }

            listEl.innerHTML = html || '<div class="dev-settings-empty">Ничего не найдено</div>';
        }

        renderList();
        renderHeaderSearch((value) => renderList(value));

        // Синхронизация чекбокса с состоянием панели тестирования
        setTimeout(() => {
            const testToggle = document.getElementById('map-testing-interface');
            if (testToggle) {
                const isEnabled = localStorage.getItem('mapTestingEnabled') === 'true';
                testToggle.checked = isEnabled;
            }
        }, 10);

        // Обработчики для переключения (демо): сохраняем в localStorage
        listEl.addEventListener('change', (e) => {
            const input = e.target;
            if (input && input.id) {
                localStorage.setItem('dev.setting.' + input.id, input.checked);
                if (input.id === 'map-testing-interface' && typeof window.setMapTestingEnabled === 'function') {
                    window.setMapTestingEnabled(input.checked);
                }
                if (input.id === 'hide-map-comments' && mapState) {
                    mapState.setHideComments(input.checked);
                }
            }
        });
        return;
    }

    if (String(itemNumber) === '2') {
        // "Вид сайта" — header + content; subtabs live in the top-left of the main modal
        clearHeaderSearch();
        devMenuBody.innerHTML = `
            <div class="dev-viewsite">
                <div class="dev-tab-content" id="dev-tab-content">
                    <!-- content injected by JS -->
                </div>
            </div>
        `;

        // Themes presets
        const themes = [
            { id: 'theme-dark', name: 'Cosmic Dark', vars: { '--bg': '#08010b', '--accent': '#c79cff', '--muted': '#6b6178' } },
            { id: 'theme-pastel', name: 'Pastel Dream', vars: { '--bg': '#fff8fc', '--accent': '#ffb6d5', '--muted': '#b89aa8' } },
            { id: 'theme-neon', name: 'Neon', vars: { '--bg': '#050014', '--accent': '#00ffea', '--muted': '#6fffd6' } }
        ];

        const tabContent = document.getElementById('dev-tab-content');

        function renderColors() {
            tabContent.innerHTML = `
                <div class="theme-grid">
                    ${themes.map(t => `
                        <button class="theme-item" data-theme-id="${t.id}">
                            <div class="theme-swatch" style="background: linear-gradient(135deg, ${t.vars['--bg']}, ${t.vars['--accent']})"></div>
                            <div class="theme-name">${t.name}</div>
                        </button>
                    `).join('')}
                </div>
            `;

            document.querySelectorAll('.theme-item').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.dataset.themeId;
                    const theme = themes.find(t => t.id === id);
                    if (!theme) return;
                    Object.entries(theme.vars).forEach(([k, v]) => document.documentElement.style.setProperty(k, v));
                    localStorage.setItem('site.theme', id);
                });
            });
        }

        // Переменная для хранения manifest в памяти
        let manifest = null;

        // Функция для сканирования папки assets через File System Access API
        const scanAndUpdateManifest = async () => {
            if (!('showDirectoryPicker' in window)) {
                alert('Ваш браузер не поддерживает File System Access API. Используйте Chrome/Edge 86+ или запустите скрипт generate-manifest.ps1.');
                return;
            }

            try {
                const dirHandle = await window.showDirectoryPicker({ mode: 'read' });
                const allowedExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.bmp'];
                const newManifest = { icons: [], images: [], ui: [] };

                // Сканируем подпапки icons, images, ui
                const folderNames = ['icons', 'images', 'ui'];
                for (const folderName of folderNames) {
                    try {
                        const folderHandle = await dirHandle.getDirectoryHandle(folderName);
                        const files = [];
                        
                        for await (const entry of folderHandle.values()) {
                            if (entry.kind === 'file') {
                                const fileName = entry.name;
                                const ext = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
                                if (allowedExtensions.includes(ext)) {
                                    files.push(fileName);
                                }
                            }
                        }
                        
                        newManifest[folderName] = files.sort();
                        console.log(`Scanned ${folderName}: ${files.length} files`);
                    } catch (err) {
                        console.warn(`Folder ${folderName} not found or inaccessible:`, err);
                    }
                }

                // Обновляем manifest в памяти
                Object.assign(manifest, newManifest);
                console.log('Manifest updated:', manifest);
                alert(`Список файлов обновлён!\n\nicons: ${manifest.icons.length}\nimages: ${manifest.images.length}\nui: ${manifest.ui.length}`);
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Scan error:', err);
                    alert('Ошибка при сканировании папки. Убедитесь, что выбрали папку assets.');
                }
            }
        };

        async function renderImages() {
            tabContent.innerHTML = `<div class="dev-image-browser"><div class="dev-image-sidebar" id="image-sidebar">Загрузка...</div><div class="dev-image-main"><div class="dev-image-scroll" id="image-scroll"><div class="dev-image-content" id="image-content"></div></div></div></div>`;
            try {
                // Cache-busting: добавляем timestamp чтобы браузер не кэшировал
                const res = await fetch(`assets/manifest.json?v=${Date.now()}`);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                manifest = await res.json();
                console.log('Manifest loaded:', manifest);
                
                const sidebarEl = document.getElementById('image-sidebar');
                const contentEl = document.getElementById('image-content');
                
                // Build sidebar tree
                let sidebarHtml = '<ul class="image-tree">';
                const folderOrder = ['fonts', 'lucid-icons', 'icons', 'images', 'ui'];
                for (const key of folderOrder) {
                    if (manifest[key] !== undefined) {
                        const displayName = key === 'lucid-icons' ? 'Lucid Icons (32px)' : key;
                        sidebarHtml += `<li class="image-node" data-folder="${key}"><button class="image-folder-btn"><span class="folder-icon">📁</span><span class="folder-name">${displayName}</span></button></li>`;
                    }
                }
                sidebarHtml += '</ul>';
                sidebarEl.innerHTML = sidebarHtml;
                let folderRenderToken = 0;
                let activeFolderEntries = [];
                let activeFolderName = '';
                let activeSearchQuery = '';

                const renderFilesList = (folderName, searchQuery = '') => {
                    if (folderName !== activeFolderName) return;
                    const filesListEl = contentEl.querySelector('.image-files-list');
                    if (!filesListEl) return;

                    const normalizedQuery = (searchQuery || '').trim().toLowerCase();
                    const savedTitles = JSON.parse(localStorage.getItem('iconPreviewTitle') || '{}');

                    const filteredFiles = activeFolderEntries.filter(({ folderName: entryFolder, fileName, filePath, fontType }) => {
                        if (entryFolder !== folderName) return false;
                        if (!normalizedQuery) return true;

                        const customTitle = savedTitles[fileName] || '';
                        const description = fontType || (getImageMetadata(filePath).description || '');

                        return [fileName, customTitle, description]
                            .some(value => String(value).toLowerCase().includes(normalizedQuery));
                    });

                    if (filteredFiles.length === 0) {
                        filesListEl.innerHTML = '<div class="image-empty">Ничего не найдено</div>';
                        return;
                    }

                    let listHtml = '';
                    filteredFiles.forEach(({ fileName, filePath, meta, fontType }) => {
                        const customTitle = savedTitles[fileName];
                        
                        // Рендер шрифтов
                        if (folderName === 'fonts' && fontType) {
                            const sizeKB = meta && meta.size ? (meta.size / 1024).toFixed(1) : '?';
                            const metaLabel = `${sizeKB} KB`;
                            
                            let fileHtml = `<div class="image-file font-file">`;
                            fileHtml += `<div class="font-preview" data-font="${fileName}" title="Предпросмотр шрифта"><span class="font-preview-text">Aа</span></div>`;
                            fileHtml += `<div class="image-info">`;
                            fileHtml += `<span class="image-custom-title">${fontType}</span>`;
                            fileHtml += `<span class="image-name-meta">${fileName} • ${metaLabel}</span>`;
                            fileHtml += `</div></div>`;
                            listHtml += fileHtml;
                        } 
                        // Рендер изображений
                        else {
                            const metaLabel = meta
                                ? `${meta.width}×${meta.height} px • ${meta.sizeText}`
                                : 'Размер: — • Вес: —';

                            let fileHtml = `<div class="image-file"><img src="${filePath}" class="image-thumb" alt="${fileName}" data-fullsize="${filePath}"/><img src="${filePath}" class="image-zoom" alt=""/>`;
                            fileHtml += `<div class="image-info">`;
                            if (customTitle && customTitle !== 'Без названия') {
                                fileHtml += `<span class="image-custom-title">${customTitle}</span>`;
                            }
                            fileHtml += `<span class="image-name-meta">${fileName} • ${metaLabel}</span>`;
                            fileHtml += `</div></div>`;
                            listHtml += fileHtml;
                        }
                    });

                    filesListEl.innerHTML = listHtml;

                    contentEl.querySelectorAll('.image-thumb').forEach(thumb => {
                        thumb.addEventListener('click', () => {
                            const imageName = decodeURIComponent(thumb.dataset.fullsize.split('/').pop());
                            currentImageIndex = currentFolderImages.indexOf(imageName);
                            openImageViewer(thumb.dataset.fullsize);
                        });
                    });

                    updateImageStatusBadges();
                };
                
                // Function to display folder contents
                const displayFolder = async (folderName, searchQuery = '') => {
                    const renderToken = ++folderRenderToken;
                    activeFolderName = folderName;
                    activeSearchQuery = searchQuery;
                    activeFolderEntries = [];
                    currentFolder = folderName;
                    const items = manifest[folderName] || [];
                    
                    // Разная обработка для fonts (массив объектов) и изображений (массив строк)
                    const isFonts = folderName === 'fonts';
                    currentFolderImages = isFonts ? [] : items.filter(f => typeof f === 'string' && !f.startsWith('.'));
                    
                    console.log(`Displaying folder: ${folderName}`);
                    console.log(`Items in manifest[${folderName}]:`, items);
                    if (!isFonts) console.log(`Filtered image files:`, currentFolderImages);

                    contentEl.innerHTML = `
                        <div class="image-content-header">
                            <h4>${folderName.toUpperCase()}</h4>
                            <div class="image-header-controls">
                                <div class="image-header-search-wrap"><span class="image-header-search-icon" aria-hidden="true">🔍</span><input id="image-folder-search" class="image-folder-search" type="search" placeholder="Поиск файлов..." aria-label="Поиск файлов в папке" /></div>
                                <button id="image-refresh-btn" class="image-refresh-btn" title="Обновить список файлов из папки assets">🔄</button>
                            </div>
                        </div>
                        <div class="image-files-list"><div class="image-empty">Загрузка метаданных...</div></div>
                    `;

                    const searchInput = contentEl.querySelector('#image-folder-search');
                    if (searchInput) {
                        searchInput.value = activeSearchQuery;
                        searchInput.addEventListener('input', (e) => {
                            if (activeFolderName !== folderName) return;
                            activeSearchQuery = e.target.value;
                            renderFilesList(folderName, activeSearchQuery);
                        });
                    }

                    const refreshBtn = contentEl.querySelector('#image-refresh-btn');
                    if (refreshBtn) {
                        refreshBtn.addEventListener('click', async () => {
                            await scanAndUpdateManifest();
                            displayFolder(folderName, activeSearchQuery);
                        });
                    }

                    // Обработка шрифтов
                    if (isFonts) {
                        if (!items || items.length === 0) {
                            const filesListEl = contentEl.querySelector('.image-files-list');
                            if (filesListEl) filesListEl.innerHTML = '<div class="image-empty">Тут ничего нет</div>';
                        } else {
                            activeFolderEntries = items.map(fontObj => ({
                                folderName,
                                fileName: fontObj.file,
                                filePath: `assets/${folderName}/${fontObj.file}`,
                                fontType: fontObj.type,
                                meta: { size: fontObj.size }
                            }));
                        }
                    } 
                    // Обработка изображений
                    else {
                        if (currentFolderImages.length === 0) {
                            const filesListEl = contentEl.querySelector('.image-files-list');
                            if (filesListEl) filesListEl.innerHTML = '<div class="image-empty">Тут ничего нет</div>';
                        } else {
                            const filesWithMeta = await Promise.all(currentFolderImages.map(async (f) => {
                                // Специальный путь для Lucid Icons
                                const filePath = folderName === 'lucid-icons' 
                                    ? `assets/Lucid_V1.2_icons/PNG/Flat/32/${encodeURIComponent(f)}`
                                    : `assets/${folderName}/${encodeURIComponent(f)}`;
                                const meta = await getImageMeta(filePath);
                                return { folderName, fileName: f, filePath, meta };
                            }));

                            if (renderToken !== folderRenderToken || currentFolder !== folderName) {
                                return;
                            }
                            activeFolderEntries = filesWithMeta;
                        }
                    }

                    if (renderToken !== folderRenderToken || currentFolder !== folderName) {
                        return;
                    }

                    renderFilesList(folderName, activeSearchQuery);
                };
                
                // Add sidebar folder click handlers
                document.querySelectorAll('.dev-image-sidebar .image-folder-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const node = btn.closest('.image-node');
                        const folderIcon = btn.querySelector('.folder-icon');
                        const folder = node.dataset.folder;
                        
                        // Close all other folders
                        document.querySelectorAll('.image-node.open').forEach(openNode => {
                            if (openNode !== node) {
                                openNode.classList.remove('open');
                                const icon = openNode.querySelector('.folder-icon');
                                if (icon) icon.textContent = '📁';
                            }
                        });
                        
                        // Open current folder
                        node.classList.add('open');
                        if (folderIcon) folderIcon.textContent = '📂';
                        
                        // Mark as active
                        document.querySelectorAll('.image-folder-btn').forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                        
                        // Display folder contents
                        displayFolder(folder);
                    });
                });
                
                // Show first folder by default
                const firstBtn = sidebarEl.querySelector('.image-folder-btn');
                if (firstBtn) firstBtn.click();
            } catch (err) {
                console.error('Error:', err);
                tabContent.innerHTML = `<div class="error">Ошибка загрузки: ${err}</div>`;
            }
        }

        // Use the global subtabs in the modal (top-left) for switching
        const devSubtabs = document.getElementById('dev-subtabs');
        if (devSubtabs) {
            devSubtabs.classList.remove('hidden');
            devSubtabs.setAttribute('aria-hidden', 'false');
            const subButtons = devSubtabs.querySelectorAll('.dev-subtab');
            function setActiveSub(key) {
                subButtons.forEach(b => b.classList.toggle('active', b.dataset.sub === key));
            }
            // attach handlers
            subButtons.forEach(b => b.addEventListener('click', async () => {
                const key = b.dataset.sub;
                setActiveSub(key);
                if (key === 'colors') renderColors();
                if (key === 'images') await renderImages();
                if (key === 'sounds') await renderSounds();
            }));
            // default to images
            setActiveSub('images');
            await renderImages();
        
        // Функция для отображения звуков
        async function renderSounds() {
            tabContent.innerHTML = `<div class="dev-sounds-browser"><div class="dev-sounds-sidebar" id="sounds-sidebar">Загрузка...</div><div class="dev-sounds-main"><div class="dev-sounds-scroll" id="sounds-scroll"><div class="dev-sounds-content" id="sounds-content"></div></div></div></div>`;
            
            try {
                const soundsPath = 'assets/ui/sfx/JDSherbert_Pixel_UI_SFX_Pack';
                const manifestRes = await fetch(`${soundsPath}/manifest.json?v=${Date.now()}`);
                if (!manifestRes.ok) throw new Error(`HTTP ${manifestRes.status}`);
                const soundsManifest = await manifestRes.json();
                
                const sidebarEl = document.getElementById('sounds-sidebar');
                const contentEl = document.getElementById('sounds-content');
                
                // Build sidebar tree
                let sidebarHtml = '<ul class="sounds-tree">';
                for (const [category, formats] of Object.entries(soundsManifest.sounds)) {
                    sidebarHtml += `<li class="sounds-category"><button class="sounds-category-btn" data-category="${category}"><span class="folder-icon">📁</span><span>${category}</span></button><ul class="sounds-formats" style="display:none;">`;
                    for (const [format] of Object.entries(formats)) {
                        sidebarHtml += `<li class="sounds-format-item"><button class="sounds-format-btn" data-category="${category}" data-format="${format}"><span class="file-icon">🎵</span><span>${format}</span></button></li>`;
                    }
                    sidebarHtml += `</ul></li>`;
                }
                sidebarHtml += '</ul>';
                sidebarEl.innerHTML = sidebarHtml;

                // Handle category expansion
                sidebarEl.querySelectorAll('.sounds-category-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const list = btn.parentElement.querySelector('.sounds-formats');
                        const isVisible = list.style.display !== 'none';
                        list.style.display = isVisible ? 'none' : 'block';
                    });
                });

                // Handle format selection
                sidebarEl.querySelectorAll('.sounds-format-btn').forEach(btn => {
                    btn.addEventListener('click', async () => {
                        const category = btn.dataset.category;
                        const format = btn.dataset.format;
                        await displaySounds(category, format);
                    });
                });

                // Function to display sounds for a format
                const displaySounds = async (category, format) => {
                    const folderPath = `${soundsPath}/${category}/${format}`;
                    
                    contentEl.innerHTML = `
                        <div class="sounds-content-header">
                            <h4>${category} / ${format}</h4>
                        </div>
                        <div class="sounds-files-list" id="sounds-files-list"><div class="sounds-empty">Загрузка звуков...</div></div>
                    `;

                    try {
                        const soundFiles = (soundsManifest.sounds[category][format] || []).map(fileName => ({
                            name: fileName.replace(/JDSherbert - Pixel UI SFX Pack - /, '').replace(/\.(mp3|wav|m4a|ogg)$/, ''),
                            fileName: fileName.replace(/\.(mp3|wav|m4a|ogg)$/, '')
                        }));
                        
                        renderSoundsList(soundFiles, folderPath, format);
                    } catch (err) {
                        const filesListEl = document.getElementById('sounds-files-list');
                        filesListEl.innerHTML = `<div class="sounds-empty">Ошибка загрузки: ${err.message}</div>`;
                    }
                };

                // Render list of sounds
                const renderSoundsList = (soundFiles, folderPath, format) => {
                    const filesListEl = document.getElementById('sounds-files-list');
                    
                    if (soundFiles.length === 0) {
                        filesListEl.innerHTML = '<div class="sounds-empty">Звуки не найдены</div>';
                        return;
                    }

                    const ext = format;
                    let listHtml = '<div class="sounds-list">';
                    soundFiles.forEach(({ name, fileName }) => {
                        const soundPath = `${folderPath}/${fileName}.${ext}`;
                        
                        listHtml += `
                            <div class="sound-item">
                                <div class="sound-info">
                                    <span class="sound-name">${name}</span>
                                    <span class="sound-path">${fileName}</span>
                                </div>
                                <button class="sound-play-btn" data-src="${soundPath}" title="Воспроизвести">▶ Слушать</button>
                            </div>
                        `;
                    });
                    listHtml += '</div>';
                    filesListEl.innerHTML = listHtml;

                    // Attach play button handlers
                    filesListEl.querySelectorAll('.sound-play-btn').forEach(btn => {
                        btn.addEventListener('click', () => {
                            const audio = new Audio(btn.dataset.src);
                            audio.play().catch(err => console.error('Ошибка воспроизведения:', err));
                        });
                    });
                };

            } catch (err) {
                tabContent.innerHTML = `<div class="dev-sounds-browser"><div style="padding: 20px; color: var(--mc-red);">Ошибка загрузки звуков: ${err.message}</div></div>`;
            }
        }
        }

        const savedTheme = localStorage.getItem('site.theme');
        if (savedTheme) {
            const theme = themes.find(t => t.id === savedTheme);
            if (theme) Object.entries(theme.vars).forEach(([k, v]) => document.documentElement.style.setProperty(k, v));
        }

        return;
    }

    if (String(itemNumber) === '3') {
        // "Отчёты" — переключение между отчётами через subtabs
        const devReportsTabs = document.getElementById('dev-reports-tabs');
        const devSubtabs = document.getElementById('dev-subtabs');
        if (devSubtabs) devSubtabs.classList.add('hidden');
        if (devReportsTabs) {
            devReportsTabs.classList.remove('hidden');
            devReportsTabs.setAttribute('aria-hidden', 'false');
        }
        
        clearHeaderSearch();
        devMenuBody.innerHTML = `
            <div class="dev-reports-browser">
                <div class="dev-report-content" id="dev-report-content">
                    Загрузка отчёта...
                </div>
            </div>
        `;

        const reports = {
            main: { 
                title: 'Основной отчёт',
                file: 'отчёты/основной_отчет.md'
            },
            design: { 
                title: 'Дизайн-гайды',
                file: 'отчёты/DESIGN-GUIDELINES.md'
            },
            ui: { 
                title: 'Отчёт об интерфейсе',
                file: 'отчёты/отчет_интерфейс.md'
            }
        };

        const reportContent = document.getElementById('dev-report-content');

        async function renderReport(reportKey) {
            if (!reports[reportKey]) return;
            const report = reports[reportKey];
            
            try {
                const res = await fetch(report.file);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const text = await res.text();
                
                // Парсим metadata из HTML комментария в начале
                let metadata = { updated: '', last_added: '' };
                const metadataMatch = text.match(/<!--metadata\s*\n\s*updated:\s*(.+?)\s*\n\s*last_added:\s*(.+?)\s*\n\s*-->/);
                if (metadataMatch) {
                    metadata.updated = metadataMatch[1];
                    metadata.last_added = metadataMatch[2];
                }
                
                // Удаляем metadata из текста перед рендерингом
                let cleanedText = text.replace(/<!--metadata[\s\S]*?-->\s*/, '');
                
                // Простой рендер markdown (без библиотеки)
                const html = cleanedText
                    .replace(/^# (.*?)$/gm, '<h1>$1</h1>')
                    .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
                    .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em>$1</em>')
                    .replace(/```(.*?)```/gs, '<pre><code>$1</code></pre>')
                    .replace(/\n\n/g, '</p><p>')
                    .replace(/\n/g, '<br>');
                
                // Формируем HTML с metadata в правом верхнем углу
                const metadataHtml = metadata.updated ? `
                    <div style="position: absolute; top: 12px; right: 12px; font-size: 10px; color: var(--mc-text-dark); opacity: 0.7; text-align: right; font-family: var(--font-primary);">
                        <div>Обновлено: ${metadata.updated}</div>
                        <div style="margin-top: 4px; font-size: 9px;">Последнее: ${metadata.last_added}</div>
                    </div>
                ` : '';
                
                reportContent.innerHTML = `
                    <div class="report-wrapper" style="position: relative;">
                        <h2>${report.title}</h2>
                        ${metadataHtml}
                        <div class="report-body">
                            <p>${html}</p>
                        </div>
                    </div>
                `;
                reportContent.scrollTop = 0;
            } catch (err) {
                reportContent.innerHTML = `<div style="padding: 20px; color: var(--mc-red);">Ошибка загрузки отчёта: ${err.message}</div>`;
            }
        }

        // Обработка нажатий на кнопки отчётов
        const reportTabs = devReportsTabs.querySelectorAll('.dev-subtab');
        function setActiveReport(key) {
            reportTabs.forEach(b => b.classList.toggle('active', b.dataset.sub === key));
        }
        
        reportTabs.forEach(b => b.addEventListener('click', async () => {
            const key = b.dataset.sub;
            setActiveReport(key);
            await renderReport(key);
        }));

        // По умолчанию показываем основной отчёт
        setActiveReport('main');
        await renderReport('main');

        return;
    }

    // для других пунктов — скрываем глобальные subtabs и показываем плейсхолдер
    const globalSubtabs = document.getElementById('dev-subtabs');
    const globalReports = document.getElementById('dev-reports-tabs');
    if (globalSubtabs) globalSubtabs.classList.add('hidden');
    if (globalReports) globalReports.classList.add('hidden');
    clearHeaderSearch();
    // Хардкодный fallback для других пунктов — пока плейсхолдер
    devMenuBody.innerHTML = `<div style="padding-top: 70px; padding-left: 28px;"><p>тут будет пункт ${itemNumber}</p></div>`;
}

// Переключение между пунктами меню
devMenuItems.forEach((item) => {
    item.addEventListener('click', () => {
        devMenuItems.forEach((btn) => btn.classList.remove('active'));
        item.classList.add('active');
        const itemNumber = item.getAttribute('data-item');
        renderDevMenuItem(itemNumber);
    });
});

// При загрузке — отрисовать контент для активного пункта
const activeItem = document.querySelector('.dev-menu-item.active');
if (activeItem) {
    renderDevMenuItem(activeItem.getAttribute('data-item'));
}

// Image Viewer Modal Logic with metadata
const imageViewerModal = document.getElementById('image-viewer-modal');
const imageViewerImg = document.getElementById('image-viewer-img');

// Store image metadata (description, status, status-text) in localStorage
const IMAGE_METADATA_KEY = 'imageMetadata';

function getImageMetadata(imagePath) {
    const allMetadata = JSON.parse(localStorage.getItem(IMAGE_METADATA_KEY) || '{}');
    return allMetadata[imagePath] || {
        description: 'Нет описания',
        status: 'none',
        statusEmoji: '',
        statusText: 'Нет информации'
    };
}

function saveImageMetadata(imagePath, metadata) {
    const allMetadata = JSON.parse(localStorage.getItem(IMAGE_METADATA_KEY) || '{}');
    allMetadata[imagePath] = metadata;
    localStorage.setItem(IMAGE_METADATA_KEY, JSON.stringify(allMetadata));
}

// Status mapping
const STATUS_MAP = {
    'replace': { emoji: '🚩', label: 'требует замены' },
    'edit': { emoji: '✏️', label: 'требует редактирования' },
    'error': { emoji: '❓', label: 'ошибка отображения' },
    'issue': { emoji: '📑', label: 'Проблема' },
    'none': { emoji: '', label: 'Без статуса' }
};

let currentImagePath = '';
let currentFolder = '';
let currentFolderImages = [];
let currentImageIndex = -1;
const imageMetaCache = new Map();

function formatFileSize(bytes) {
    if (!Number.isFinite(bytes) || bytes < 0) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) {
        const kb = bytes / 1024;
        return `${kb >= 10 ? kb.toFixed(1) : kb.toFixed(2)} KB`;
    }
    const mb = bytes / (1024 * 1024);
    return `${mb >= 10 ? mb.toFixed(1) : mb.toFixed(2)} MB`;
}

function getImageDimensionsFromBlob(blob) {
    return new Promise((resolve, reject) => {
        const objectUrl = URL.createObjectURL(blob);
        const image = new Image();

        image.onload = () => {
            resolve({ width: image.naturalWidth, height: image.naturalHeight });
            URL.revokeObjectURL(objectUrl);
        };

        image.onerror = () => {
            reject(new Error('Image metadata load failed'));
            URL.revokeObjectURL(objectUrl);
        };

        image.src = objectUrl;
    });
}

async function getImageMeta(filePath) {
    if (imageMetaCache.has(filePath)) {
        return imageMetaCache.get(filePath);
    }

    const metaPromise = (async () => {
        try {
            const response = await fetch(filePath, { cache: 'force-cache' });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const blob = await response.blob();
            const dimensions = await getImageDimensionsFromBlob(blob);

            return {
                width: dimensions.width,
                height: dimensions.height,
                sizeBytes: blob.size,
                sizeText: formatFileSize(blob.size)
            };
        } catch (error) {
            console.warn('Cannot read image metadata:', filePath, error);
            return null;
        }
    })();

    imageMetaCache.set(filePath, metaPromise);
    return metaPromise;
}

function openImageViewer(imageSrc) {
    currentImagePath = imageSrc;
    imageViewerImg.src = imageSrc;
    
    // Load metadata
    const metadata = getImageMetadata(imageSrc);
    
    // Update description
    document.getElementById('image-description').textContent = metadata.description;
    document.getElementById('image-description-edit').value = metadata.description;
    
    // Update status text
    document.getElementById('image-status-text').textContent = metadata.statusText;
    document.getElementById('image-status-text-edit').value = metadata.statusText;
    
    // Update status button
    const statusEmoji = document.getElementById('current-status-emoji');
    statusEmoji.textContent = metadata.statusEmoji || '○';
    
    // Find usage of this image
    findImageUsage(imageSrc);
    
    imageViewerModal.classList.remove('hidden');
}

function closeImageViewer() {
    imageViewerModal.classList.add('hidden');
    imageViewerImg.src = '';
    currentImagePath = '';
    
    // Refresh image list if dev menu is open and on images tab
    const devMenuModal = document.querySelector('.dev-menu-modal');
    const devSubtabs = document.getElementById('dev-subtabs');
    const activeSubtab = devSubtabs?.querySelector('.dev-subtab.active');
    
    if (devMenuModal && !devMenuModal.classList.contains('hidden') && activeSubtab?.dataset.sub === 'images') {
        // Re-trigger the last clicked folder button to refresh the list
        const lastActiveFolder = document.querySelector('.image-folder-btn.active');
        if (lastActiveFolder) {
            lastActiveFolder.click();
        }
    }
}

// Find where the image is used
function findImageUsage(imagePath) {
    const usageList = document.getElementById('image-usage-list');
    const usages = [];
    
    // Search in HTML files (simplified - searches in current document)
    const allImages = document.querySelectorAll('img');
    allImages.forEach(img => {
        if (img.src && img.src.includes(imagePath.split('/').pop())) {
            const context = img.alt || img.parentElement.textContent.trim().substring(0, 50);
            usages.push(`Изображение: ${context || 'без описания'}`);
        }
    });
    
    // Search in CSS (check inline styles)
    const allElements = document.querySelectorAll('*');
    allElements.forEach(el => {
        const bgImage = window.getComputedStyle(el).backgroundImage;
        if (bgImage && bgImage.includes(imagePath.split('/').pop())) {
            usages.push(`Фоновое изображение: ${el.tagName.toLowerCase()}`);
        }
    });
    
    if (usages.length === 0) {
        usageList.innerHTML = '<li>Нигде не используется</li>';
    } else {
        usageList.innerHTML = usages.map(u => `<li>${u}</li>`).join('');
    }
}

// Edit buttons handlers
document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const field = btn.dataset.field;
        const textEl = document.getElementById(`image-${field}`);
        const editEl = document.getElementById(`image-${field}-edit`);
        
        if (textEl.classList.contains('hidden')) {
            // Save mode
            const newValue = editEl.value.trim() || (field === 'description' ? 'Нет описания' : 'Нет информации');
            textEl.textContent = newValue;
            
            // Save to metadata
            const metadata = getImageMetadata(currentImagePath);
            if (field === 'description') {
                metadata.description = newValue;
            } else if (field === 'status-text') {
                metadata.statusText = newValue;
            }
            saveImageMetadata(currentImagePath, metadata);
            
            // Switch back to view mode
            textEl.classList.remove('hidden');
            editEl.classList.add('hidden');
            btn.textContent = '✏️';
        } else {
            // Edit mode
            textEl.classList.add('hidden');
            editEl.classList.remove('hidden');
            editEl.focus();
            btn.textContent = '💾';
        }
    });
});

// Status selector
const statusBtn = document.getElementById('current-status-btn');
const statusDropdown = document.getElementById('status-dropdown');

statusBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    statusDropdown.classList.toggle('hidden');
});

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (!statusBtn.contains(e.target) && !statusDropdown.contains(e.target)) {
        statusDropdown.classList.add('hidden');
    }
});

// Status option selection
document.querySelectorAll('.status-option').forEach(option => {
    option.addEventListener('click', () => {
        const status = option.dataset.status;
        const emoji = option.dataset.emoji;
        
        // Update button
        document.getElementById('current-status-emoji').textContent = emoji || '○';
        
        // Save to metadata
        const metadata = getImageMetadata(currentImagePath);
        metadata.status = status;
        metadata.statusEmoji = emoji;
        saveImageMetadata(currentImagePath, metadata);
        
        // Close dropdown
        statusDropdown.classList.add('hidden');
        
        // Update status badge in image list if visible
        updateImageStatusBadges();
    });
});

// Update status badges in image list
function updateImageStatusBadges() {
    document.querySelectorAll('.image-thumb').forEach(thumb => {
        const imagePath = thumb.dataset.fullsize;
        const metadata = getImageMetadata(imagePath);
        
        // Remove existing badge
        const existingBadge = thumb.parentElement.querySelector('.image-status-badge');
        if (existingBadge) {
            existingBadge.remove();
        }
        
        // Add new badge if status exists
        if (metadata.statusEmoji) {
            const badge = document.createElement('span');
            badge.className = 'image-status-badge';
            badge.textContent = metadata.statusEmoji;
            badge.title = STATUS_MAP[metadata.status]?.label || '';
            thumb.parentElement.style.position = 'relative';
            thumb.parentElement.insertBefore(badge, thumb);
        }
    });
}

// ===== PREVIEW BACKGROUND CONTROL =====
// Background types for image preview (6 options)
const BG_TYPES = {
    checker: { class: 'preview-bg-checker', label: 'Фон: Шахматная доска' },
    white: { class: 'preview-bg-white', label: 'Фон: Белый' },
    black: { class: 'preview-bg-black', label: 'Фон: Чёрный' },
    dark: { class: 'preview-bg-dark', label: 'Фон: Тёмно-серый' },
    green: { class: 'preview-bg-green', label: 'Фон: Неон-зелёный' },
    blue: { class: 'preview-bg-blue', label: 'Фон: Неон-голубой' },
    red: { class: 'preview-bg-red', label: 'Фон: Красный' }
};

const PREVIEW_BG_KEY = 'iconPreviewBg';
const PREVIEW_TITLE_KEY = 'iconPreviewTitle';

// Get DOM elements
const previewArea = document.getElementById('preview-area');
const bgButtons = document.querySelectorAll('.bg-btn');
const previewTitle = document.getElementById('preview-title');
const previewTitleInput = document.getElementById('preview-title-input');
const editTitleBtn = document.getElementById('edit-title-btn');
const previewFilename = document.getElementById('preview-filename');

// Initialize preview background from localStorage
function initPreviewBackground() {
    const savedBg = localStorage.getItem(PREVIEW_BG_KEY) || 'checker';
    applyBackground(savedBg);
}

// Apply background to preview area
function applyBackground(bgKey) {
    if (!previewArea) return;
    
    // Remove all background classes
    Object.values(BG_TYPES).forEach(bg => {
        previewArea.classList.remove(bg.class);
    });
    
    // Apply selected background
    const selectedBg = BG_TYPES[bgKey];
    if (selectedBg) {
        previewArea.classList.add(selectedBg.class);
    }
    
    // Update button states
    bgButtons.forEach(btn => {
        if (btn.dataset.bg === bgKey) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Save to localStorage
    localStorage.setItem(PREVIEW_BG_KEY, bgKey);
}

// Event listeners for background buttons
bgButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const bgKey = btn.dataset.bg;
        applyBackground(bgKey);
    });
});

// ===== PREVIEW TITLE EDITING =====
let currentImageTitle = 'Без названия';

// Initialize title from localStorage or metadata
function initPreviewTitle(imageSrc) {
    // Try to get saved title for this image
    const savedTitles = JSON.parse(localStorage.getItem(PREVIEW_TITLE_KEY) || '{}');
    const imageKey = imageSrc.split('/').pop(); // Use filename as key
    
    currentImageTitle = savedTitles[imageKey] || 'Без названия';
    
    if (previewTitle) {
        previewTitle.textContent = currentImageTitle;
    }
    
    if (previewFilename) {
        previewFilename.textContent = imageKey;
    }
}

// Save title to localStorage
function savePreviewTitle(imageSrc, title) {
    const savedTitles = JSON.parse(localStorage.getItem(PREVIEW_TITLE_KEY) || '{}');
    const imageKey = imageSrc.split('/').pop();
    savedTitles[imageKey] = title;
    localStorage.setItem(PREVIEW_TITLE_KEY, JSON.stringify(savedTitles));
}

// Edit title button handler
if (editTitleBtn) {
    editTitleBtn.addEventListener('click', () => {
        if (previewTitle && previewTitleInput) {
            // Switch to edit mode
            previewTitle.classList.add('hidden');
            previewTitleInput.classList.remove('hidden');
            previewTitleInput.value = previewTitle.textContent;
            previewTitleInput.focus();
            previewTitleInput.select();
        }
    });
}

// Save on Enter or blur
if (previewTitleInput) {
    const saveTitle = () => {
        const newTitle = previewTitleInput.value.trim() || 'Без названия';
        currentImageTitle = newTitle;
        
        if (previewTitle) {
            previewTitle.textContent = newTitle;
            previewTitle.classList.remove('hidden');
        }
        
        previewTitleInput.classList.add('hidden');
        
        // Save to localStorage
        if (currentImagePath) {
            savePreviewTitle(currentImagePath, newTitle);
        }
    };
    
    previewTitleInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveTitle();
        } else if (e.key === 'Escape') {
            // Cancel editing
            previewTitleInput.classList.add('hidden');
            if (previewTitle) {
                previewTitle.classList.remove('hidden');
            }
        }
    });
    
    previewTitleInput.addEventListener('blur', saveTitle);
}

// Update openImageViewer to initialize title
const originalOpenImageViewer = openImageViewer;
openImageViewer = function(imageSrc) {
    originalOpenImageViewer(imageSrc);
    // Initialize background and title
    setTimeout(() => {
        initPreviewBackground();
        initPreviewTitle(imageSrc);
    }, 10);
};

// Navigation buttons
const navPrevBtn = document.getElementById('image-nav-prev');
const navNextBtn = document.getElementById('image-nav-next');

navPrevBtn.addEventListener('click', () => {
    if (currentFolderImages.length === 0) return;
    currentImageIndex = (currentImageIndex - 1 + currentFolderImages.length) % currentFolderImages.length;
    const nextImage = currentFolderImages[currentImageIndex];
    const imageSrc = `assets/${currentFolder}/${encodeURIComponent(nextImage)}`;
    openImageViewer(imageSrc);
});

navNextBtn.addEventListener('click', () => {
    if (currentFolderImages.length === 0) return;
    currentImageIndex = (currentImageIndex + 1) % currentFolderImages.length;
    const nextImage = currentFolderImages[currentImageIndex];
    const imageSrc = `assets/${currentFolder}/${encodeURIComponent(nextImage)}`;
    openImageViewer(imageSrc);
});

// Close by clicking outside the content
imageViewerModal.addEventListener('click', (e) => {
    if (e.target === imageViewerModal) {
        closeImageViewer();
    }
});

// Close by pressing ESC key
document.addEventListener('keydown', (e) => {
    if (imageViewerModal.classList.contains('hidden')) return;
    
    if (e.key === 'Escape') {
        closeImageViewer();
    } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (currentFolderImages.length === 0) return;
        currentImageIndex = (currentImageIndex - 1 + currentFolderImages.length) % currentFolderImages.length;
        const nextImage = currentFolderImages[currentImageIndex];
        const imageSrc = `assets/${currentFolder}/${encodeURIComponent(nextImage)}`;
        openImageViewer(imageSrc);
    } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (currentFolderImages.length === 0) return;
        currentImageIndex = (currentImageIndex + 1) % currentFolderImages.length;
        const nextImage = currentFolderImages[currentImageIndex];
        const imageSrc = `assets/${currentFolder}/${encodeURIComponent(nextImage)}`;
        openImageViewer(imageSrc);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    if (typeof window.L === 'undefined') {
        console.warn('Leaflet is not available: map initialization skipped.');
        return;
    }

    const mapContainer = document.getElementById('map');
    if (!mapContainer) {
        return;
    }

    window.servers = Array.isArray(window.servers) ? window.servers : [];

    // Enable/disable Map Tools dev mode
    window.setMapTestingEnabled = (enabled) => {
        localStorage.setItem('mapTestingEnabled', String(enabled));

        // Initialize Map Tools on first enable
        if (enabled && !mapState && typeof MapToolsState !== 'undefined') {
            mapState = new MapToolsState();
            mapToolsAPI = new MapToolsAPI('/api');
            mapToolsUI = new MapToolsUI(mapContainer, mapState, mapToolsAPI);

            mapState.setDevMode(true);
            mapToolsUI.loadComments();
        }

        // Toggle dev mode
        if (mapState) {
            mapState.setDevMode(enabled);
        }
    };

    // Initialize on page load
    window.setMapTestingEnabled(localStorage.getItem('mapTestingEnabled') === 'true' ? true : false);

    if (servers.length === 0) {
        servers.push(
            {
                name: 'Test SMP Alpha',
                ip: 'play.alpha.local',
                version: '1.20.4',
                coords: [0, 0]
            },
            {
                name: 'Test SMP Beta',
                ip: 'play.beta.local',
                version: '1.21',
                coords: [30, -25]
            }
        );
    }

    const map = L.map('map', {
        attributionControl: false,
        zoomControl: false,
        center: [0, 0],
        zoom: 2,
        minZoom: 1,
        maxZoom: 10,
        maxBounds: [[-100, -100], [100, 100]],
        maxBoundsViscosity: 1.0
    });

    window.multiverseMap = map;

    const zoomInBtn = document.getElementById('map-zoom-in');
    const zoomOutBtn = document.getElementById('map-zoom-out');
    if (zoomInBtn) {
        zoomInBtn.addEventListener('click', (e) => {
            e.preventDefault();
            map.zoomIn();
        });
    }
    if (zoomOutBtn) {
        zoomOutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            map.zoomOut();
        });
    }

    const mapBounds = [[-100, -100], [100, 100]];
    L.imageOverlay('assets/images/maxresdefault.jpg', mapBounds).addTo(map);

    const markerLayer = L.layerGroup().addTo(map);

    window.updateMapMarkers = function updateMapMarkers() {
        markerLayer.clearLayers();

        servers.forEach((server) => {
            if (!Array.isArray(server.coords) || server.coords.length !== 2) {
                return;
            }

            const markerOptions = {};
            if (server.icon) {
                markerOptions.icon = L.icon({
                    iconUrl: server.icon,
                    iconSize: [28, 28],
                    iconAnchor: [14, 14],
                    popupAnchor: [0, -14]
                });
            }

            L.marker(server.coords, markerOptions)
                .bindPopup(`<b>${server.name || 'Unknown Server'}</b><br>IP: ${server.ip || '—'}<br>Version: ${server.version || '—'}`)
                .addTo(markerLayer);
        });
    };

    window.updateMapMarkers();

    if (typeof window.generateTestServers === 'function' && !window.generateTestServers.__leafletHooked) {
        const originalGenerateTestServers = window.generateTestServers;
        const wrappedGenerateTestServers = function wrappedGenerateTestServers(...args) {
            const result = originalGenerateTestServers.apply(this, args);
            if (typeof window.updateMapMarkers === 'function') {
                window.updateMapMarkers();
            }
            return result;
        };

        wrappedGenerateTestServers.__leafletHooked = true;
        window.generateTestServers = wrappedGenerateTestServers;
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const starsCanvas = document.getElementById('stars');
    const universeCanvas = document.getElementById('universe');

    if (!starsCanvas || !universeCanvas) {
        return;
    }

    const starsCtx = starsCanvas.getContext('2d');
    const universeCtx = universeCanvas.getContext('2d');

    if (!starsCtx || !universeCtx) {
        return;
    }

    const overlayCount = document.getElementById('scene-server-count');
    const overlayScale = document.getElementById('scene-scale');
    const overlayFocus = document.getElementById('scene-focus');
    const overlayCoords = document.getElementById('scene-coords');

    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

    function seededRandom(initialSeed) {
        let seed = initialSeed % 2147483647;
        if (seed <= 0) {
            seed += 2147483646;
        }

        return function next() {
            seed = (seed * 16807) % 2147483647;
            return (seed - 1) / 2147483646;
        };
    }

    function hashString(value) {
        let hash = 0;
        for (let i = 0; i < value.length; i += 1) {
            hash = ((hash << 5) - hash) + value.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash) + 1;
    }

    function deriveServerSeed(server) {
        if (Number.isFinite(Number(server.seed))) {
            return Number(server.seed) || 1;
        }

        const source = `${server.name || ''}|${server.ip || ''}|${server.version || ''}`;
        return hashString(source);
    }

    function buildServerList() {
        const fallback = [
            { name: 'Alpha', players: 120, maxPlayers: 300, atmosphere: 0.8, activity: 0.6, seed: 12345, type: 'creative' },
            { name: 'Crimson PvP', players: 260, maxPlayers: 300, atmosphere: 0.25, activity: 0.95, seed: 45512, type: 'pvp' },
            { name: 'Roleplay Orion', players: 80, maxPlayers: 220, atmosphere: 0.55, activity: 0.45, seed: 87501, type: 'rp' },
            { name: 'Builder Nova', players: 56, maxPlayers: 160, atmosphere: 0.9, activity: 0.3, seed: 93474, type: 'creative' }
        ];

        const source = Array.isArray(window.servers) && window.servers.length > 0
            ? window.servers
            : fallback;

        return source.map((server, index) => {
            const maxPlayers = Math.max(1, Number(server.maxPlayers) || 300);
            const players = clamp(Number(server.players) || Math.floor(maxPlayers * 0.35), 0, maxPlayers);
            const atmosphere = clamp(Number(server.atmosphere) || 0.5, 0, 1);
            const activity = clamp(Number(server.activity) || 0.5, 0, 1);
            const seed = deriveServerSeed(server) + index * 97;
            const type = String(server.type || (server.mode || 'generic')).toLowerCase();

            return {
                name: server.name || `Server ${index + 1}`,
                players,
                maxPlayers,
                atmosphere,
                activity,
                seed,
                type
            };
        });
    }

    function serverColor(server) {
        const hue = Math.round(clamp(server.atmosphere, 0, 1) * 120);
        return {
            base: `hsl(${hue}, 70%, 50%)`,
            atmosphere: `hsla(${hue}, 80%, 60%, ${0.25 + server.activity * 0.45})`
        };
    }

    function buildPlanetTexture(server, radius) {
        const texture = document.createElement('canvas');
        const size = radius * 2;
        texture.width = size;
        texture.height = size;

        const textureCtx = texture.getContext('2d');
        if (!textureCtx) {
            return texture;
        }

        const rand = seededRandom(server.seed);
        const color = serverColor(server).base;
        const toxicity = clamp(1 - server.atmosphere, 0, 1);

        for (let y = -radius; y < radius; y += 1) {
            for (let x = -radius; x < radius; x += 1) {
                if ((x * x) + (y * y) > radius * radius) {
                    continue;
                }

                const noise = rand();
                const shade = rand();

                if (noise > (0.78 - toxicity * 0.28)) {
                    textureCtx.fillStyle = `rgba(28, 22, 34, ${0.55 + toxicity * 0.35})`;
                } else {
                    const lightnessShift = Math.round((shade - 0.5) * 14);
                    const hue = Math.round(server.atmosphere * 120);
                    textureCtx.fillStyle = `hsl(${hue}, 68%, ${clamp(50 + lightnessShift, 34, 68)}%)`;
                }

                textureCtx.fillRect(x + radius, y + radius, 1, 1);
            }
        }

        return texture;
    }

    let width = 0;
    let height = 0;
    let stars = [];
    let comets = [];
    let planets = [];
    let frame = 0;
    let nextCometFrame = 240;
    let hoveredPlanetName = '';
    let cameraZoom = 1;
    let cameraZoomTarget = 1;
    let cameraPanX = 0;
    let cameraPanY = 0;
    const minZoom = 0.55;
    const maxZoom = 2.4;
    const baseLerpSpeed = 0.12;
    let currentZoomSpeed = baseLerpSpeed;
    let lastZoomInputTime = 0;

    const pointer = { x: 0, y: 0, active: false };
    const dragState = {
        active: false,
        pointerId: null,
        lastX: 0,
        lastY: 0
    };
    const serverList = buildServerList();
    const cometRand = seededRandom(serverList.reduce((sum, server) => sum + server.seed, 73));

    if (overlayCount) {
        overlayCount.textContent = `Серверов: ${serverList.length}`;
    }

    function setCanvasSize() {
        const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
        width = window.innerWidth;
        height = window.innerHeight;

        [starsCanvas, universeCanvas].forEach((canvas) => {
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
        });

        starsCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        universeCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        starsCtx.imageSmoothingEnabled = false;
        universeCtx.imageSmoothingEnabled = false;

        createStars();
        createPlanets();
    }

    function createStars() {
        const density = 0.00042;
        const count = Math.max(450, Math.floor(width * height * density));
        const seed = hashString(`${width}x${height}:${serverList.length}`);
        const rand = seededRandom(seed);
        stars = [];

        for (let i = 0; i < count; i += 1) {
            stars.push({
                x: Math.floor(rand() * width),
                y: Math.floor(rand() * height),
                size: rand() > 0.92 ? 2 : 1,
                brightness: 0.35 + rand() * 0.65,
                twinkleOffset: rand() * Math.PI * 2,
                twinkleSpeed: 0.004 + rand() * 0.02
            });
        }
    }

    function createPlanets() {
        const minSide = Math.max(320, Math.min(width, height));
        const orbitStep = minSide / (serverList.length + 1);

        planets = serverList.map((server, index) => {
            const ratio = clamp(server.players / server.maxPlayers, 0, 1);
            const baseRadius = Math.round(20 + ratio * 40);
            const rand = seededRandom(server.seed);
            const orbitRadius = Math.round(orbitStep * (index + 1) + rand() * 24);
            const angle = rand() * Math.PI * 2;
            const texture = buildPlanetTexture(server, baseRadius);

            return {
                ...server,
                ratio,
                radius: baseRadius,
                orbitRadius,
                angle,
                x: 0,
                y: 0,
                texture,
                color: serverColor(server)
            };
        });
    }

    function setZoom(nextZoom) {
        const now = performance.now();
        const timeSinceLastInput = now - lastZoomInputTime;
        lastZoomInputTime = now;

        // Ускорение при частых вызовах: если прошло менее 150мс, увеличиваем скорость
        if (timeSinceLastInput < 150) {
            currentZoomSpeed = Math.min(currentZoomSpeed + 0.08, 0.4);
        } else {
            currentZoomSpeed = baseLerpSpeed;
        }

        cameraZoomTarget = clamp(nextZoom, minZoom, maxZoom);
    }

    function spawnComet() {
        const horizontalStart = cometRand() > 0.5;
        const startX = horizontalStart ? -30 : Math.floor(cometRand() * width);
        const startY = horizontalStart ? Math.floor(cometRand() * (height * 0.55)) : -30;
        const speedBase = 1.4 + cometRand() * 1.8;

        comets.push({
            x: startX,
            y: startY,
            vx: speedBase * (0.9 + cometRand() * 0.9),
            vy: speedBase * (0.7 + cometRand() * 0.9),
            maxLife: 140 + Math.floor(cometRand() * 90),
            life: 0
        });
    }

    function updateStars() {
        stars.forEach((star) => {
            const twinkle = Math.sin((frame * star.twinkleSpeed) + star.twinkleOffset) * 0.24;
            star.brightness = clamp(star.brightness + twinkle * 0.02, 0.3, 1);
        });
    }

    function updateComets() {
        if (frame >= nextCometFrame && comets.length < 4) {
            spawnComet();
            nextCometFrame = frame + 180 + Math.floor(cometRand() * 340);
        }

        comets = comets.filter((comet) => {
            comet.x += comet.vx;
            comet.y += comet.vy;
            comet.life += 1;

            return comet.life < comet.maxLife && comet.x < width + 50 && comet.y < height + 50;
        });
    }

    function updatePlanets() {
        planets.forEach((planet) => {
            planet.angle += 0.001 + (0.0035 * planet.activity);
            planet.x = Math.cos(planet.angle) * planet.orbitRadius;
            planet.y = Math.sin(planet.angle) * planet.orbitRadius;
        });
    }

    function drawStars() {
        starsCtx.globalAlpha = 1;
        starsCtx.fillStyle = '#000814';
        starsCtx.fillRect(0, 0, width, height);

        stars.forEach((star) => {
            starsCtx.globalAlpha = star.brightness;
            starsCtx.fillStyle = '#ffffff';
            starsCtx.fillRect(star.x, star.y, star.size, star.size);
        });

        starsCtx.globalAlpha = 1;
    }

    function drawComets() {
        starsCtx.fillStyle = '#d9f1ff';

        comets.forEach((comet) => {
            starsCtx.globalAlpha = 1;
            starsCtx.fillRect(comet.x, comet.y, 3, 3);

            for (let i = 1; i <= 12; i += 1) {
                starsCtx.globalAlpha = Math.max(0.03, 1 - i * 0.08);
                starsCtx.fillRect(comet.x - i * 2, comet.y - i * 2, 2, 2);
            }
        });

        starsCtx.globalAlpha = 1;
    }

    function drawPlanetDecor(planet) {
        const ctx = universeCtx;

        if (planet.type.includes('pvp')) {
            ctx.strokeStyle = 'rgba(255, 90, 90, 0.7)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(planet.x, planet.y, planet.radius + 8, 0, Math.PI * 2);
            ctx.stroke();
        }

        if (planet.type.includes('rp')) {
            ctx.strokeStyle = 'rgba(181, 111, 255, 0.68)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(planet.x, planet.y, planet.radius + 5, 0, Math.PI * 2);
            ctx.stroke();
        }

        if (planet.type.includes('creative')) {
            ctx.strokeStyle = 'rgba(110, 219, 255, 0.7)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(planet.x, planet.y, planet.radius + 6, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    function drawPlanets() {
        universeCtx.clearRect(0, 0, width, height);
        const centerX = (width / 2) + cameraPanX;
        const centerY = (height / 2) + cameraPanY;

        const pointerWorldX = centerX + (pointer.x - centerX) / cameraZoom;
        const pointerWorldY = centerY + (pointer.y - centerY) / cameraZoom;

        universeCtx.strokeStyle = 'rgba(150, 170, 255, 0.08)';
        universeCtx.lineWidth = 1;

        planets.forEach((planet) => {
            universeCtx.beginPath();
            universeCtx.arc(centerX, centerY, planet.orbitRadius * cameraZoom, 0, Math.PI * 2);
            universeCtx.stroke();
        });

        hoveredPlanetName = '';

        planets.forEach((planet) => {
            const screenX = centerX + (planet.x * cameraZoom);
            const screenY = centerY + (planet.y * cameraZoom);
            const drawRadius = planet.radius * cameraZoom;

            universeCtx.globalAlpha = 1;
            universeCtx.drawImage(
                planet.texture,
                Math.floor(screenX - drawRadius),
                Math.floor(screenY - drawRadius),
                Math.ceil(drawRadius * 2),
                Math.ceil(drawRadius * 2)
            );

            universeCtx.strokeStyle = planet.color.atmosphere;
            universeCtx.lineWidth = 2;
            universeCtx.beginPath();
            universeCtx.arc(screenX, screenY, drawRadius + 4, 0, Math.PI * 2);
            universeCtx.stroke();

            const decoratedPlanet = {
                ...planet,
                x: screenX,
                y: screenY,
                radius: drawRadius
            };
            drawPlanetDecor(decoratedPlanet);

            if (pointer.active) {
                const dx = pointerWorldX - (centerX + planet.x);
                const dy = pointerWorldY - (centerY + planet.y);
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance <= planet.radius + 10 && !hoveredPlanetName) {
                    hoveredPlanetName = `${planet.name} (${planet.players}/${planet.maxPlayers})`;

                    universeCtx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
                    universeCtx.lineWidth = 1;
                    universeCtx.beginPath();
                    universeCtx.arc(screenX, screenY, drawRadius + 10, 0, Math.PI * 2);
                    universeCtx.stroke();
                }
            }
        });
    }

    function updateOverlay() {
        if (overlayScale) {
            overlayScale.textContent = `Масштаб: ${cameraZoom.toFixed(2)}x`;
        }

        if (overlayFocus) {
            overlayFocus.textContent = `Фокус: ${hoveredPlanetName || '—'}`;
        }

        if (overlayCoords) {
            if (pointer.active) {
                const centerX = (width / 2) + cameraPanX;
                const centerY = (height / 2) + cameraPanY;
                const worldX = Math.round((pointer.x - centerX) / cameraZoom);
                const worldY = Math.round((pointer.y - centerY) / cameraZoom);
                overlayCoords.textContent = `Координаты: x ${worldX}, y ${worldY}`;
            } else {
                overlayCoords.textContent = 'Координаты: —';
            }
        }
    }

    function tick() {
        frame += 1;

        // Плавная интерполяция масштаба с динамической скоростью
        cameraZoom += (cameraZoomTarget - cameraZoom) * currentZoomSpeed;

        // Затухание скорости, если нет активных вводов
        const now = performance.now();
        if (now - lastZoomInputTime > 100) {
            currentZoomSpeed = Math.max(currentZoomSpeed - 0.01, baseLerpSpeed);
        }

        updateStars();
        updateComets();
        updatePlanets();

        drawStars();
        drawComets();
        drawPlanets();
        updateOverlay();

        requestAnimationFrame(tick);
    }

    universeCanvas.addEventListener('pointermove', (event) => {
        const rect = universeCanvas.getBoundingClientRect();
        const nextX = event.clientX - rect.left;
        const nextY = event.clientY - rect.top;

        if (dragState.active && dragState.pointerId === event.pointerId) {
            cameraPanX += nextX - dragState.lastX;
            cameraPanY += nextY - dragState.lastY;
            dragState.lastX = nextX;
            dragState.lastY = nextY;
        }

        pointer.x = nextX;
        pointer.y = nextY;
        pointer.active = true;
    });

    universeCanvas.addEventListener('pointerdown', (event) => {
        const rect = universeCanvas.getBoundingClientRect();
        dragState.active = true;
        dragState.pointerId = event.pointerId;
        dragState.lastX = event.clientX - rect.left;
        dragState.lastY = event.clientY - rect.top;
        universeCanvas.setPointerCapture(event.pointerId);
        universeCanvas.style.cursor = 'grabbing';
    });

    universeCanvas.addEventListener('pointerup', (event) => {
        if (dragState.pointerId !== event.pointerId) {
            return;
        }

        dragState.active = false;
        dragState.pointerId = null;
        universeCanvas.style.cursor = 'grab';
        if (universeCanvas.hasPointerCapture(event.pointerId)) {
            universeCanvas.releasePointerCapture(event.pointerId);
        }
    });

    universeCanvas.addEventListener('pointercancel', (event) => {
        if (dragState.pointerId !== event.pointerId) {
            return;
        }

        dragState.active = false;
        dragState.pointerId = null;
        universeCanvas.style.cursor = 'grab';
    });

    universeCanvas.addEventListener('pointerleave', () => {
        if (!dragState.active) {
            pointer.active = false;
        }
        hoveredPlanetName = '';
    });

    const zoomInBtn = document.getElementById('map-zoom-in');
    const zoomOutBtn = document.getElementById('map-zoom-out');
    const centerViewBtn = document.getElementById('map-center-view');

    if (zoomInBtn) {
        zoomInBtn.addEventListener('click', (event) => {
            event.preventDefault();
            setZoom(cameraZoom * 1.12);
        });
    }

    if (zoomOutBtn) {
        zoomOutBtn.addEventListener('click', (event) => {
            event.preventDefault();
            setZoom(cameraZoom / 1.12);
        });
    }

    if (centerViewBtn) {
        centerViewBtn.addEventListener('click', (event) => {
            event.preventDefault();
            cameraPanX = 0;
            cameraPanY = 0;
        });
    }

    universeCanvas.addEventListener('wheel', (event) => {
        event.preventDefault();
        const zoomFactor = event.deltaY < 0 ? 1.08 : (1 / 1.08);
        setZoom(cameraZoom * zoomFactor);
    }, { passive: false });

    universeCanvas.style.cursor = 'grab';

    window.addEventListener('resize', () => {
        setCanvasSize();
    });

    setCanvasSize();
    tick();
});