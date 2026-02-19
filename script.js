// Элементы
const sidebar = document.getElementById('sidebar');
const mapArea = document.getElementById('map-area');
const hideBtn = document.getElementById('hide-sidebar');
const showBtn = document.getElementById('show-sidebar');

// Инициализация: сайдбар видна по умолчанию, кнопка возврата скрыта
sidebar.classList.remove('hidden');
showBtn.classList.add('hidden');

// Скрытие панели
hideBtn.addEventListener('click', () => {
    sidebar.classList.add('hidden');
    mapArea.classList.add('expanded');
    showBtn.classList.remove('hidden');
});

// Показ панели обратно
showBtn.addEventListener('click', () => {
    sidebar.classList.remove('hidden');
    mapArea.classList.remove('expanded');
    showBtn.classList.add('hidden');
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
// Рендер содержимого для пунктов меню разработчика
async function renderDevMenuItem(itemNumber) {
    devMenuBody.classList.toggle('dev-menu-body--images', String(itemNumber) === '2');

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
            { id: 'map-testing-interface', name: 'Интерфес тестирования карты', type: 'checkbox', checked: false }
        ];

        const listEl = document.getElementById('dev-settings-list');
        function renderList(filter = '') {
            const q = filter.trim().toLowerCase();

            const filtered = settings.filter(s => s.name.toLowerCase().includes(q));
            const mainSettings = filtered.filter(s => s.id === 'map-testing-interface');
            const miscSettings = filtered.filter(s => s.id !== 'map-testing-interface');

            const renderSettingsItems = (items) => items.map(s => `
                <label class="dev-setting-item" data-name="${s.name}">
                    <span>${s.name}</span>
                    <input type="${s.type}" id="${s.id}" ${s.checked ? 'checked' : ''} />
                </label>
            `).join('');

            let html = '';
            if (mainSettings.length > 0) {
                html += `
                    <div class="dev-settings-group-title">Основные</div>
                    ${renderSettingsItems(mainSettings)}
                `;
            }

            if (miscSettings.length > 0) {
                html += `
                    <div class="dev-settings-group-title">Всякая фигня</div>
                    ${renderSettingsItems(miscSettings)}
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
                const res = await fetch('assets/manifest.json');
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                manifest = await res.json();
                console.log('Manifest loaded:', manifest);
                
                const sidebarEl = document.getElementById('image-sidebar');
                const contentEl = document.getElementById('image-content');
                
                // Build sidebar tree
                let sidebarHtml = '<ul class="image-tree">';
                const folderOrder = ['icons', 'images', 'ui'];
                for (const key of folderOrder) {
                    if (manifest[key] !== undefined) {
                        sidebarHtml += `<li class="image-node" data-folder="${key}"><button class="image-folder-btn"><span class="folder-icon">📁</span><span class="folder-name">${key}</span></button></li>`;
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

                    const filteredFiles = activeFolderEntries.filter(({ folderName: entryFolder, fileName, filePath }) => {
                        if (entryFolder !== folderName) return false;
                        if (!normalizedQuery) return true;

                        const customTitle = savedTitles[fileName] || '';
                        const description = (getImageMetadata(filePath).description || '');

                        return [fileName, customTitle, description]
                            .some(value => String(value).toLowerCase().includes(normalizedQuery));
                    });

                    if (filteredFiles.length === 0) {
                        filesListEl.innerHTML = '<div class="image-empty">Ничего не найдено</div>';
                        return;
                    }

                    let listHtml = '';
                    filteredFiles.forEach(({ fileName, filePath, meta }) => {
                        const customTitle = savedTitles[fileName];
                        const metaLabel = meta
                            ? `${meta.width}×${meta.height} px • ${meta.sizeText}`
                            : 'Размер: — • Вес: —';

                        let fileHtml = `<div class="image-file"><img src="${filePath}" class="image-thumb" alt="${fileName}" data-fullsize="${filePath}"/>`;
                        fileHtml += `<div class="image-info">`;
                        if (customTitle && customTitle !== 'Без названия') {
                            fileHtml += `<span class="image-custom-title">${customTitle}</span>`;
                        }
                        fileHtml += `<span class="image-name-meta">${fileName} • ${metaLabel}</span>`;
                        fileHtml += `</div></div>`;
                        listHtml += fileHtml;
                    });

                    filesListEl.innerHTML = listHtml;

                    contentEl.querySelectorAll('.image-thumb').forEach(thumb => {
                        thumb.addEventListener('click', () => {
                            const imageName = decodeURIComponent(thumb.dataset.fullsize.split('/').pop());
                            currentImageIndex = currentFolderImages.indexOf(imageName);
                            openImageViewer(thumb.dataset.fullsize);
                        });

                        thumb.addEventListener('mouseover', (e) => {
                            const preview = document.createElement('div');
                            preview.className = 'image-preview-tooltip';
                            preview.innerHTML = `<img src="${thumb.dataset.fullsize}" alt="preview"/>`;
                            document.body.appendChild(preview);
                            thumb.dataset.preview = true;

                            const updatePosition = (evt) => {
                                const offsetX = 15;
                                const offsetY = 15;
                                let x = evt.clientX + offsetX;
                                let y = evt.clientY + offsetY;

                                if (x + preview.offsetWidth > window.innerWidth) {
                                    x = evt.clientX - preview.offsetWidth - offsetX;
                                }
                                if (y + preview.offsetHeight > window.innerHeight) {
                                    y = evt.clientY - preview.offsetHeight - offsetY;
                                }

                                preview.style.left = x + 'px';
                                preview.style.top = y + 'px';
                            };

                            updatePosition(e);
                            thumb.dataset.previewEl = preview;
                            thumb.dataset.positionMove = (evt) => updatePosition(evt);
                            document.addEventListener('mousemove', thumb.dataset.positionMove);
                        });

                        thumb.addEventListener('mouseleave', () => {
                            if (thumb.dataset.previewEl) {
                                const el = thumb.dataset.previewEl;
                                el.remove();
                                if (thumb.dataset.positionMove) {
                                    document.removeEventListener('mousemove', thumb.dataset.positionMove);
                                }
                                delete thumb.dataset.previewEl;
                                delete thumb.dataset.positionMove;
                                delete thumb.dataset.preview;
                            }
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
                    currentFolderImages = items.filter(f => typeof f === 'string' && !f.startsWith('.'));
                    
                    console.log(`Displaying folder: ${folderName}`);
                    console.log(`Items in manifest[${folderName}]:`, items);
                    console.log(`Filtered image files:`, currentFolderImages);

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

                    if (currentFolderImages.length === 0) {
                        const filesListEl = contentEl.querySelector('.image-files-list');
                        if (filesListEl) filesListEl.innerHTML = '<div class="image-empty">Тут ничего нет</div>';
                    } else {
                        const filesWithMeta = await Promise.all(currentFolderImages.map(async (f) => {
                            const filePath = `assets/${folderName}/${encodeURIComponent(f)}`;
                            const meta = await getImageMeta(filePath);
                            return { folderName, fileName: f, filePath, meta };
                        }));

                        if (renderToken !== folderRenderToken || currentFolder !== folderName) {
                            return;
                        }
                        activeFolderEntries = filesWithMeta;
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
            }));
            // default to images
            setActiveSub('images');
            await renderImages();
        }

        const savedTheme = localStorage.getItem('site.theme');
        if (savedTheme) {
            const theme = themes.find(t => t.id === savedTheme);
            if (theme) Object.entries(theme.vars).forEach(([k, v]) => document.documentElement.style.setProperty(k, v));
        }

        return;
    }

    // для других пунктов — скрываем глобальные subtabs и показываем плейсхолдер
    const globalSubtabs = document.getElementById('dev-subtabs');
    if (globalSubtabs) globalSubtabs.classList.add('hidden');
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
    const servers = window.servers;

    const testPanel = document.getElementById('test-panel');
    const testServerModal = document.getElementById('test-server-modal');
    const addTestServerBtn = document.getElementById('add-test-server-btn');
    const addTestServerForm = document.getElementById('add-test-server-form');
    const testServerClose = document.getElementById('test-server-close');

    const fillTestServerDefaults = () => {
        const randomOctet = Math.floor(Math.random() * 255);
        const randomX = (Math.random() * 200 - 100).toFixed(2);
        const randomY = (Math.random() * 200 - 100).toFixed(2);

        const nameInput = document.getElementById('test-server-name');
        const ipInput = document.getElementById('test-server-ip');
        const versionInput = document.getElementById('test-server-version');
        const descInput = document.getElementById('test-server-desc');
        const xInput = document.getElementById('test-server-x');
        const yInput = document.getElementById('test-server-y');

        if (nameInput) nameInput.value = `Test SMP ${servers.length + 1}`;
        if (ipInput) ipInput.value = `127.0.0.${randomOctet}`;
        if (versionInput) versionInput.value = '1.20.4';
        if (descInput) descInput.value = 'Test server';
        if (xInput) xInput.value = randomX;
        if (yInput) yInput.value = randomY;
    };

    const openTestServerModal = () => {
        if (!testServerModal) return;
        fillTestServerDefaults();
        testServerModal.classList.remove('hidden');
        testServerModal.setAttribute('aria-hidden', 'false');
    };

    const closeTestServerModal = () => {
        if (!testServerModal) return;
        testServerModal.classList.add('hidden');
        testServerModal.setAttribute('aria-hidden', 'true');
    };

    window.setMapTestingEnabled = (enabled) => {
        if (!testPanel) return;
        testPanel.classList.toggle('hidden', !enabled);
        if (!enabled) {
            closeTestServerModal();
        }
        localStorage.setItem('mapTestingEnabled', String(enabled));
    };

    if (addTestServerBtn) {
        addTestServerBtn.addEventListener('click', openTestServerModal);
    }

    if (testServerClose) {
        testServerClose.addEventListener('click', closeTestServerModal);
    }

    if (testServerModal) {
        testServerModal.addEventListener('click', (e) => {
            if (e.target === testServerModal) {
                closeTestServerModal();
            }
        });
    }

    if (addTestServerForm) {
        addTestServerForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const name = document.getElementById('test-server-name')?.value?.trim() || `Test SMP ${servers.length + 1}`;
            const ip = document.getElementById('test-server-ip')?.value?.trim() || '127.0.0.1';
            const version = document.getElementById('test-server-version')?.value?.trim() || '1.20.4';
            const desc = document.getElementById('test-server-desc')?.value?.trim() || 'Test server';
            const icon = document.getElementById('test-server-icon')?.value || '';
            const x = Number(document.getElementById('test-server-x')?.value);
            const y = Number(document.getElementById('test-server-y')?.value);

            const coords = [Number.isFinite(x) ? x : 0, Number.isFinite(y) ? y : 0];

            servers.push({ name, ip, version, desc, icon, coords });

            if (typeof window.updateMapMarkers === 'function') {
                window.updateMapMarkers();
            }

            if (typeof window.updateSidebar === 'function') {
                window.updateSidebar();
            }

            closeTestServerModal();
        });
    }

    window.setMapTestingEnabled(localStorage.getItem('mapTestingEnabled') === 'true' ? true : false);

    // Синхронизация чекбокса в dev settings на инициализацию
    const syncTestingToggle = () => {
        const testToggle = document.getElementById('map-testing-interface');
        if (testToggle && testPanel) {
            const isEnabled = localStorage.getItem('mapTestingEnabled') === 'true';
            testToggle.checked = isEnabled;
            testPanel.classList.toggle('hidden', !isEnabled);
        }
    };
    syncTestingToggle();

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