// Элементы
const appShell = document.getElementById('app-shell');
const sidebar = document.getElementById('sidebar');
const hideBtn = document.getElementById('hide-sidebar');
const showBtn = document.getElementById('show-sidebar');
const mapArea = document.getElementById('map-area');

if (mapArea) {
    mapArea.classList.add('is-initializing');
}

// Инициализация: сайдбар видна по умолчанию, кнопка возврата скрыта
appShell.classList.remove('sidebar-closed');

function openSidebar() {
    appShell.classList.remove('sidebar-closed');
}

function closeSidebar() {
    appShell.classList.add('sidebar-closed');
}

function toggleSidebar() {
    if (appShell.classList.contains('sidebar-closed')) {
        openSidebar();
    } else {
        closeSidebar();
    }
}

document.addEventListener('click', (event) => {
    const navTarget = event.target.closest('[data-nav]');
    if (!navTarget) {
        return;
    }

    const page = navTarget.getAttribute('data-nav');
    const routes = {
        map: 'index.html',
        'my-servers': 'pages/my-servers.html',
        profile: 'pages/profile.html',
        'galaxy-webgl': 'pages/galaxy-webgl.html'
    };

    if (page && routes[page]) {
        const target = routes[page];
        if (typeof window.navigateWithTransition === 'function') {
            window.navigateWithTransition(target);
        } else {
            window.location.href = target;
        }
    }
});

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
    const devModal = document.getElementById('dev-menu-modal');
    const settingsModalEl = document.getElementById('settings-modal');
    const imageModal = document.getElementById('image-viewer-modal');
    const mascotDropdown = document.getElementById('mascot-menu');
    const statusDropdown = document.getElementById('status-dropdown');

    const isSettingsOpen = settingsModalEl && !settingsModalEl.classList.contains('hidden');
    const isDevOpen = devModal && !devModal.classList.contains('hidden');
    const isImageOpen = imageModal && !imageModal.classList.contains('hidden');
    const isMascotOpen = mascotDropdown && !mascotDropdown.classList.contains('hidden');
    const isStatusOpen = statusDropdown && !statusDropdown.classList.contains('hidden');
    const isMenuContext = isDevOpen || isImageOpen || isMascotOpen || isStatusOpen;

    if (isMenuContext) {
        e.preventDefault();
        if (!isSettingsOpen) {
            openRegularSettingsModal();
        }
        return;
    }

    if (isEditable || isSettingsOpen) return;

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
const sitePlanetDetailLevelControl = document.getElementById('site-planet-detail-level');
const sitePlanetDetailPreviewCube = document.getElementById('site-planet-detail-preview-cube');
const mascotMenu = document.getElementById('mascot-menu');
let planetDetailPreviewSeed = Math.floor(Math.random() * 2147483647);
let planetDetailPreviewParams = null;
let planetGeneratorModulePromise = null;

function createPreviewRng(initialSeed) {
    let seed = initialSeed % 2147483647;
    if (seed <= 0) {
        seed += 2147483646;
    }

    return function next() {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
    };
}

function createPlanetDetailTexture(detailSize, seedValue) {
    const texture = document.createElement('canvas');
    texture.width = detailSize;
    texture.height = detailSize;
    const textureCtx = texture.getContext('2d');
    if (!textureCtx) {
        return null;
    }

    const rand = createPreviewRng(seedValue);
    const radius = Math.max(2, Math.floor(detailSize / 2) - 1);
    const center = Math.floor(detailSize / 2);
    const palette = ['#1d3f66', '#2f6aa3', '#3f6c2f', '#6ea24c', '#9bc27f'];

    textureCtx.clearRect(0, 0, detailSize, detailSize);
    for (let y = 0; y < detailSize; y += 1) {
        for (let x = 0; x < detailSize; x += 1) {
            const dx = x - center;
            const dy = y - center;
            if ((dx * dx) + (dy * dy) > radius * radius) {
                continue;
            }

            const n = rand();
            let color = palette[0];
            if (n > 0.22) color = palette[1];
            if (n > 0.45) color = palette[2];
            if (n > 0.68) color = palette[3];
            if (n > 0.86) color = palette[4];

            textureCtx.fillStyle = color;
            textureCtx.fillRect(x, y, 1, 1);
        }
    }

    return texture;
}

function createRandomPlanetDetailPreviewParams(seedValue) {
    const rand = createPreviewRng(seedValue ^ 0x9E3779B9);
    const palettes = ['earth', 'lava', 'ice', 'desert', 'dark'];
    const palette = palettes[Math.floor(rand() * palettes.length)] || 'earth';

    return {
        palette,
        scale: Number((1.4 + (rand() * 1.8)).toFixed(2)),
        octaves: 3 + Math.floor(rand() * 5),
        persistence: Number((0.4 + (rand() * 0.28)).toFixed(2)),
        seaLevel: Number((0.28 + (rand() * 0.44)).toFixed(2))
    };
}

function getPreviewLightDirection() {
    const phase = ((Date.now() % 16000) / 16000) * Math.PI * 2;
    const x = Math.cos(phase) * 0.42;
    const y = 0.74;
    const z = 0.52 + (Math.sin(phase) * 0.18);
    return { x, y, z };
}

function getPlanetGeneratorModule() {
    if (!planetGeneratorModulePromise) {
        planetGeneratorModulePromise = import('./js/generation/planet-generator.js');
    }
    return planetGeneratorModulePromise;
}

function buildFallbackFaceTextures(detailSize, seedValue) {
    const faceNames = ['front', 'back', 'left', 'right', 'top', 'bottom'];
    const faces = {};
    faceNames.forEach((faceName, index) => {
        faces[faceName] = createPlanetDetailTexture(detailSize, seedValue + ((index + 1) * 7919));
    });
    return faces;
}

async function getPlanetDetailFaceTextures(detailSize, seedValue) {
    try {
        const generatorModule = await getPlanetGeneratorModule();
        if (!generatorModule || typeof generatorModule.generateCubeFaceTextures !== 'function') {
            return buildFallbackFaceTextures(detailSize, seedValue);
        }

        if (!planetDetailPreviewParams) {
            planetDetailPreviewParams = createRandomPlanetDetailPreviewParams(seedValue);
        }

        const result = generatorModule.generateCubeFaceTextures(seedValue, {
            size: detailSize,
            type: planetDetailPreviewParams.palette,
            scale: planetDetailPreviewParams.scale,
            octaves: planetDetailPreviewParams.octaves,
            persistence: planetDetailPreviewParams.persistence,
            seaLevel: planetDetailPreviewParams.seaLevel,
            lightDirection: getPreviewLightDirection(),
            shadowTint: '#1f2a42',
            lightTint: '#dceeff',
            strictPalette: true
        });

        return result?.faces || buildFallbackFaceTextures(detailSize, seedValue);
    } catch {
        return buildFallbackFaceTextures(detailSize, seedValue);
    }
}

async function renderPlanetDetailPreviewCube(cubeElement, detailSize, seedValue) {
    if (!cubeElement) {
        return;
    }

    const faceNames = ['front', 'back', 'left', 'right', 'top', 'bottom'];
    const faces = await getPlanetDetailFaceTextures(detailSize, seedValue);

    faceNames.forEach((faceName) => {
        const faceCanvas = cubeElement.querySelector(`[data-face="${faceName}"]`);
        if (!faceCanvas) {
            return;
        }

        faceCanvas.width = detailSize;
        faceCanvas.height = detailSize;
        const faceCtx = faceCanvas.getContext('2d');
        if (!faceCtx) {
            return;
        }

        const texture = faces?.[faceName];
        if (!texture) {
            return;
        }

        faceCtx.imageSmoothingEnabled = false;
        faceCtx.clearRect(0, 0, detailSize, detailSize);
        faceCtx.drawImage(texture, 0, 0, detailSize, detailSize);
    });
}

async function renderPlanetDetailPreview(cubeElement, detailSize, seedValue) {
    if (!cubeElement) {
        return;
    }

    await renderPlanetDetailPreviewCube(cubeElement, detailSize, seedValue);
    cubeElement.style.setProperty('--cube-zoom', '1');
}

function renderPlanetDetailPreviewWidgets() {
    const detailSize = getPlanetDetailSize();
    const previewCubes = [
        sitePlanetDetailPreviewCube,
        document.getElementById('dev-planet-detail-preview-cube')
    ];

    previewCubes.forEach((previewCube) => {
        renderPlanetDetailPreview(previewCube, detailSize, planetDetailPreviewSeed);
    });
}

function randomizePlanetDetailPreview() {
    planetDetailPreviewSeed = Math.floor(Math.random() * 2147483647);
    planetDetailPreviewParams = createRandomPlanetDetailPreviewParams(planetDetailPreviewSeed);
    renderPlanetDetailPreviewWidgets();
}

function setDetailLevelButtonsState(container, levelValue) {
    if (!container) {
        return;
    }

    const normalizedLevel = String(normalizePlanetDetailLevel(levelValue));
    const buttons = container.querySelectorAll('[data-detail-level]');
    buttons.forEach((button) => {
        const isActive = button.getAttribute('data-detail-level') === normalizedLevel;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
}

function syncSiteSettingsForm() {
    if (!sitePlanetDetailLevelControl) {
        return;
    }

    setDetailLevelButtonsState(sitePlanetDetailLevelControl, getPlanetDetailLevel());
    renderPlanetDetailPreviewWidgets();
}

function openRegularSettingsModal() {
    if (typeof window.__smpOpenSettingsModal === 'function') {
        window.__smpOpenSettingsModal();
    } else if (settingsModal) {
        // Fallback to legacy behavior if shortcut script is not loaded
        syncSiteSettingsForm();
        randomizePlanetDetailPreview();
        settingsModal.classList.remove('hidden');
    }

    if (mascotMenu) {
        mascotMenu.classList.add('hidden');
    }

    if (typeof devMenuModal !== 'undefined' && devMenuModal && !devMenuModal.classList.contains('hidden')) {
        devMenuModal.classList.add('hidden');
    }

    const imageModal = document.getElementById('image-viewer-modal');
    if (imageModal && !imageModal.classList.contains('hidden')) {
        imageModal.classList.add('hidden');
    }
}

// Открыть настройки по клику на кнопку в меню маскота
mascotMenu.addEventListener('click', (e) => {
    if (e.target.textContent.trim() === 'Настройки') {
        openRegularSettingsModal();
    }
});

if (sitePlanetDetailLevelControl) {
    sitePlanetDetailLevelControl.addEventListener('click', (event) => {
        const button = event.target.closest('[data-detail-level]');
        if (!button) {
            return;
        }

        savePlanetDetailLevel(button.getAttribute('data-detail-level'));
    });
}

window.addEventListener('planet-detail-level-changed', () => {
    syncSiteSettingsForm();
    renderPlanetDetailPreviewWidgets();
});

// Закрыть настройки по клику на крестик (устаревший обработчик, оставлен для совместимости)
if (settingsClose && settingsModal) {
    settingsClose.addEventListener('click', () => {
        settingsModal.classList.add('hidden');
    });

    // Закрыть настройки по клику вне окна (на фон)
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.classList.add('hidden');
        }
    });
}
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

const GRAPHICS_SETTINGS_KEY = 'smp.multiverse.graphics';
const PLANET_DETAIL_LEVEL_TO_SIZE = {
    1: 16,
    2: 32,
    3: 64,
    4: 128
};

function normalizePlanetDetailLevel(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
        return 2;
    }
    return Math.max(1, Math.min(4, Math.round(numeric)));
}

function readGraphicsSettings() {
    try {
        const raw = localStorage.getItem(GRAPHICS_SETTINGS_KEY);
        const parsed = raw ? JSON.parse(raw) : {};
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
        return {};
    }
}

function getPlanetDetailLevel() {
    return normalizePlanetDetailLevel(readGraphicsSettings().planetDetailLevel);
}

function getPlanetDetailSize() {
    const level = getPlanetDetailLevel();
    return PLANET_DETAIL_LEVEL_TO_SIZE[level] || 32;
}

function savePlanetDetailLevel(levelValue) {
    const level = normalizePlanetDetailLevel(levelValue);
    const current = readGraphicsSettings();
    localStorage.setItem(GRAPHICS_SETTINGS_KEY, JSON.stringify({
        ...current,
        planetDetailLevel: level
    }));
    window.dispatchEvent(new CustomEvent('planet-detail-level-changed', {
        detail: {
            level,
            size: PLANET_DETAIL_LEVEL_TO_SIZE[level]
        }
    }));
    return level;
}

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
            {
                id: 'planet-detail-level',
                name: 'Детализация',
                type: 'buttons',
                options: [
                    { value: '1', label: 'Уровень 1 (16×16)' },
                    { value: '2', label: 'Уровень 2 (32×32)' },
                    { value: '3', label: 'Уровень 3 (64×64)' },
                    { value: '4', label: 'Уровень 4 (128×128)' }
                ],
                value: String(getPlanetDetailLevel())
            },
            { id: 'map-testing-interface', name: 'Интерфес тестирования карты', type: 'checkbox', checked: false },
            { id: 'hide-map-comments', name: 'Скрыть комментарии', type: 'checkbox', checked: false }
        ];

        const listEl = document.getElementById('dev-settings-list');
        function renderList(filter = '') {
            const q = filter.trim().toLowerCase();

            const filtered = settings.filter(s => s.name.toLowerCase().includes(q));
            const mainIds = ['map-testing-interface', 'planet-detail-level'];
            const mainSettings = filtered.filter(s => mainIds.includes(s.id));
            const miscSettings = filtered.filter(s => !mainIds.includes(s.id));

            const renderSettingsItems = (items) => items.map(s => `
                <label class="setting-item ${s.type === 'select' || s.type === 'buttons' ? 'setting-item--select' : ''} ${s.id === 'planet-detail-level' ? 'setting-item--detail' : ''}">
                    <span class="setting-label">${s.name}</span>
                    ${s.type === 'buttons'
                        ? ''
                        : s.type === 'select'
                        ? `<select id="${s.id}" class="setting-select">${(s.options || []).map(option => `<option value="${option.value}" ${String(option.value) === String(s.value) ? 'selected' : ''}>${option.label}</option>`).join('')}</select>`
                        : `<input type="${s.type}" id="${s.id}" ${s.checked ? 'checked' : ''} />
                    <span class="checkmark"></span>`}
                </label>
                ${s.id === 'planet-detail-level'
                    ? `<div class="planet-detail-preview-block planet-detail-preview-block--divider" aria-label="Предпросмотр детализации планеты">
                        <div class="planet-detail-preview-layout">
                            <div class="detail-level-control-group">
                                <span class="detail-level-control-title">Детализация</span>
                                <div id="${s.id}" class="detail-level-buttons" role="group" aria-label="Уровень детализации планет и объектов">${(s.options || []).map(option => `<button type="button" class="detail-level-btn ${String(option.value) === String(s.value) ? 'is-active' : ''}" data-detail-level="${option.value}" data-tooltip="${option.value === '1' ? '16×16' : option.value === '2' ? '32×32' : option.value === '3' ? '64×64' : '128×128'}" aria-pressed="${String(option.value) === String(s.value) ? 'true' : 'false'}">${option.value}</button>`).join('')}</div>
                            </div>
                            <div class="planet-detail-preview-card">
                                <div id="dev-planet-detail-preview-cube" class="planet-detail-preview-cube" aria-hidden="true">
                                    <canvas class="planet-detail-preview-face face-front" data-face="front" width="32" height="32"></canvas>
                                    <canvas class="planet-detail-preview-face face-back" data-face="back" width="32" height="32"></canvas>
                                    <canvas class="planet-detail-preview-face face-left" data-face="left" width="32" height="32"></canvas>
                                    <canvas class="planet-detail-preview-face face-right" data-face="right" width="32" height="32"></canvas>
                                    <canvas class="planet-detail-preview-face face-top" data-face="top" width="32" height="32"></canvas>
                                    <canvas class="planet-detail-preview-face face-bottom" data-face="bottom" width="32" height="32"></canvas>
                                </div>
                            </div>
                        </div>
                    </div>`
                    : ''}
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
            renderPlanetDetailPreviewWidgets();
        }

        renderList();
        renderHeaderSearch((value) => renderList(value));
        randomizePlanetDetailPreview();

        // Синхронизация чекбокса с состоянием панели тестирования
        setTimeout(() => {
            const testToggle = document.getElementById('map-testing-interface');
            if (testToggle) {
                const isEnabled = localStorage.getItem('mapTestingEnabled') === 'true';
                testToggle.checked = isEnabled;
            }

            const detailButtons = document.getElementById('planet-detail-level');
            if (detailButtons) {
                setDetailLevelButtonsState(detailButtons, getPlanetDetailLevel());
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

        listEl.addEventListener('click', (e) => {
            const button = e.target.closest('#planet-detail-level [data-detail-level]');
            if (!button) {
                return;
            }

            savePlanetDetailLevel(button.getAttribute('data-detail-level'));
            setDetailLevelButtonsState(document.getElementById('planet-detail-level'), getPlanetDetailLevel());
            renderPlanetDetailPreviewWidgets();
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

        // Просмотр шрифтов
        function renderFonts() {
            const escapeHtml = (value) => String(value || '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');

            const defaultSample = 'так выглядит на русском & it looks like this in English';
            const savedSample = localStorage.getItem('dev.fonts.sampleText') || defaultSample;

            tabContent.innerHTML = `
                <div class="dev-fonts-browser">
                    <div class="dev-fonts-header">
                        <label class="dev-fonts-label">
                            <span class="dev-fonts-label-text">Пример текста для предпросмотра шрифтов:</span>
                            <input id="dev-fonts-sample-input" class="dev-fonts-input" type="text" value="${escapeHtml(savedSample)}" />
                        </label>
                    </div>
                    <div class="dev-fonts-list" id="dev-fonts-list"></div>
                </div>
            `;

            const fonts = [
                {
                    id: 'TipoMine',
                    family: 'TipoMine',
                    file: 'tipo_mine.woff2',
                    role: 'Основной текст (var(--font-primary))',
                    status: 'used'
                },
                {
                    id: 'ContraPhobotech',
                    family: 'ContraPhobotech',
                    file: 'Contra Phobotech Regular.woff2',
                    role: 'Заголовки / UI (var(--font-heading), частично var(--font-ui))',
                    status: 'used'
                },
                {
                    id: 'Mintsoda',
                    family: 'Mintsoda',
                    file: 'MintsodaLimeGreen13X16Regular-KVvzA.woff2',
                    role: 'Акцентный курсив (var(--font-accent))',
                    status: 'used'
                },
                {
                    id: 'HUDSonic',
                    family: 'HUDSonic',
                    file: 'HUD Sonic X1 Regular.woff2',
                    role: 'UI, заголовки панелей (var(--font-ui))',
                    status: 'used'
                },
                {
                    id: 'Glasstown',
                    family: 'Glasstown',
                    file: 'GlasstownNbpRegular-RyMM.woff2',
                    role: 'Отдельные заголовки / карточки',
                    status: 'used'
                },
                {
                    id: 'PixelRegular',
                    family: 'PixelRegular',
                    file: 'Pixel-Regular.woff2',
                    role: 'Tab-кнопки и элементы интерфейса',
                    status: 'used'
                },
                {
                    id: 'Shylock',
                    family: 'Shylock',
                    file: 'Shylock.woff2',
                    role: 'Пиксельный шрифт для отдельных UI-кнопок',
                    status: 'used'
                },
                {
                    id: 'Dungeonmode',
                    family: 'Dungeonmode',
                    file: 'dungeon-mode.woff2',
                    role: 'Зарезервирован для ретро-эффектов',
                    status: 'reserved'
                },
                {
                    id: 'DungeonmodeInverted',
                    family: 'DungeonmodeInverted',
                    file: 'dungeon-mode-inverted.woff2',
                    role: 'Зарезервирован для ретро-эффектов (инвертированный)',
                    status: 'reserved'
                },
                {
                    id: 'StarseedProLegacy',
                    family: 'StarseedProLegacy',
                    file: 'StarseedPro.woff2',
                    role: 'Устаревший, заменён на Contra Phobotech',
                    status: 'legacy'
                },
                {
                    id: 'Datcub_DOTS',
                    family: null,
                    file: 'Datcub_DOTS.woff2',
                    role: 'Файл есть, но @font-face не объявлен в style.css',
                    status: 'unused'
                }
            ];

            const fontsListEl = document.getElementById('dev-fonts-list');
            if (!fontsListEl) return;

            const buildStatusLabel = (status) => {
                switch (status) {
                    case 'used': return 'используется';
                    case 'reserved': return 'зарезервирован';
                    case 'legacy': return 'устаревший';
                    case 'unused': return 'не используется';
                    default: return '';
                }
            };

            const rowsHtml = fonts.map((font) => {
                const statusLabel = buildStatusLabel(font.status);

                const roleParts = [];
                if (font.role) roleParts.push(font.role);
                if (statusLabel) roleParts.push(statusLabel);
                const roleLine = roleParts.join(' • ');

                const descParts = [];
                if (font.file) descParts.push(font.file);
                if (font.note) descParts.push(font.note);
                const descLine = descParts.join(' • ');

                const familyCss = font.family
                    ? `font-family: '${font.family}', var(--font-primary);`
                    : `font-family: var(--font-primary);`;

                return `
                    <div class="dev-font-row" data-font-id="${escapeHtml(font.id)}">
                        <div class="dev-font-header">
                            <div class="dev-font-name">${escapeHtml(font.id)}</div>
                            ${roleLine ? `<div class="dev-font-role">${escapeHtml(roleLine)}</div>` : ''}
                        </div>
                        ${descLine ? `<div class="dev-font-desc">${escapeHtml(descLine)}</div>` : ''}
                        <div class="dev-font-sample" style="${familyCss}">
                            <span class="dev-font-sample-text"></span>
                        </div>
                    </div>
                `;
            }).join('');

            fontsListEl.innerHTML = rowsHtml;

            const sampleInput = document.getElementById('dev-fonts-sample-input');
            const sampleEls = fontsListEl.querySelectorAll('.dev-font-sample-text');

            const applySampleText = (text) => {
                const value = text && text.length ? text : defaultSample;
                sampleEls.forEach((el) => {
                    el.textContent = value;
                });
            };

            applySampleText(savedSample);

            if (sampleInput) {
                sampleInput.addEventListener('input', (e) => {
                    const value = e.target.value;
                    localStorage.setItem('dev.fonts.sampleText', value);
                    applySampleText(value);
                });
            }
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
                if (key === 'fonts') renderFonts();
            }));
            // default to images
            setActiveSub('images');
            await renderImages();
        
        // Функция для отображения звуков
        async function renderSounds() {
            tabContent.innerHTML = `<div class="dev-sounds-browser"><div class="dev-sounds-sidebar" id="sounds-sidebar">Загрузка...</div><div class="dev-sounds-main"><div class="dev-sounds-scroll" id="sounds-scroll"><div class="dev-sounds-content" id="sounds-content"></div></div></div></div>`;

            try {
                const sidebarEl = document.getElementById('sounds-sidebar');
                const contentEl = document.getElementById('sounds-content');
                const globalAudio = document.getElementById('global-audio');

                const jdshPath = 'assets/ui/sfx/JDSherbert_Pixel_UI_SFX_Pack';
                const unholyPath = 'assets/ui/sfx/--Unholy';
                const pixelatedPath = 'assets/ui/sfx/Pixelated UI';

                const formatsToShow = ['mp3', 'ogg'];

                const folders = [
                    { id: 'JDSh_Ui', name: 'JDSh_Ui', type: 'jdsh', basePath: jdshPath, manifest: 'manifest.json' },
                    { id: 'Unholy', name: '--Unholy', type: 'flat', basePath: unholyPath, manifest: 'manifest.json' },
                    { id: 'PixelatedUI', name: 'Pixelated UI', type: 'flat', basePath: pixelatedPath, manifest: 'manifest.json' }
                ];

                const escapeHtml = (value) => String(value || '')
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#039;');

                const formatMs = (value) => {
                    const ms = Number(value) || 0;
                    const totalSec = Math.max(0, Math.floor(ms / 1000));
                    const mins = Math.floor(totalSec / 60);
                    const secs = totalSec % 60;
                    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
                };

                const formatBytes = (value) => {
                    const bytes = Number(value);
                    if (!Number.isFinite(bytes) || bytes <= 0) return '—';
                    if (bytes < 1024) return `${bytes} B`;
                    const kb = bytes / 1024;
                    if (kb < 1024) return `${Math.round(kb)} KB`;
                    const mb = kb / 1024;
                    return `${mb.toFixed(1)} MB`;
                };

                async function getFileSize(path) {
                    try {
                        const headRes = await fetch(path, { method: 'HEAD' });
                        const sizeHeader = headRes.headers.get('Content-Length');
                        if (sizeHeader) {
                            const parsed = Number(sizeHeader);
                            if (Number.isFinite(parsed)) return parsed;
                        }
                    } catch (err) {
                        console.warn('HEAD size failed for', path, err);
                    }

                    try {
                        const getRes = await fetch(path);
                        if (!getRes.ok) return null;
                        const blob = await getRes.blob();
                        return blob.size;
                    } catch (err) {
                        console.warn('GET size failed for', path, err);
                        return null;
                    }
                }

                function getDuration(path) {
                    return new Promise((resolve) => {
                        const audio = new Audio(path);
                        const finalize = (value) => resolve(Number.isFinite(value) ? Math.floor(value) : 0);
                        audio.addEventListener('loadedmetadata', () => finalize(audio.duration * 1000), { once: true });
                        audio.addEventListener('error', () => finalize(0), { once: true });
                    });
                }

                const stripPrefix = (fileName) => fileName
                    .replace(/JDSherbert - Pixel UI SFX Pack - /, '')
                    .replace(/\.(mp3|ogg|wav)$/i, '');

                const stripSimpleName = (filePath) => {
                    const justName = String(filePath).split(/[/\\]/).pop() || '';
                    return justName.replace(/\.(mp3|ogg|wav)$/i, '');
                };

                const buildJdshSoundsMap = (soundsManifest, soundsPath) => {
                    const soundsMap = new Map();
                    for (const [category, formats] of Object.entries(soundsManifest.sounds || {})) {
                        const normalizedCategory = String(category).toLowerCase();
                        if (normalizedCategory !== 'mono' && normalizedCategory !== 'stereo') continue;

                        for (const format of formatsToShow) {
                            const files = formats[format] || [];
                            files.forEach((fileName) => {
                                const title = stripPrefix(fileName);
                                if (!soundsMap.has(title)) {
                                    soundsMap.set(title, {
                                        title,
                                        files: {
                                            mono: { mp3: null, ogg: null },
                                            stereo: { mp3: null, ogg: null }
                                        }
                                    });
                                }

                                const entry = soundsMap.get(title);
                                const modeKey = normalizedCategory === 'stereo' ? 'stereo' : 'mono';
                                entry.files[modeKey][format] = `${soundsPath}/${category}/${format}/${fileName}`;
                            });
                        }
                    }

                    return Array.from(soundsMap.values()).sort((a, b) => a.title.localeCompare(b.title, 'ru'));
                };

                const buildFlatSoundsMap = (flatManifest, basePath) => {
                    const files = Array.isArray(flatManifest.files) ? flatManifest.files : [];
                    return files.map((relativePath) => {
                        const fullPath = `${basePath}/${relativePath}`;
                        const title = stripSimpleName(relativePath);
                        return {
                            title,
                            files: {
                                mono: { mp3: null, ogg: null, wav: fullPath },
                                stereo: { mp3: null, ogg: null, wav: null }
                            }
                        };
                    }).sort((a, b) => a.title.localeCompare(b.title, 'ru'));
                };

                async function buildSoundItem(rawSound) {
                    const pickSource = (format) => (rawSound.files.stereo && rawSound.files.stereo[format]) || (rawSound.files.mono && rawSound.files.mono[format]) || null;

                    const mp3Source = pickSource('mp3');
                    const oggSource = pickSource('ogg');
                    const wavSource = pickSource('wav');

                    const [mp3Size, oggSize, wavSize, mp3Dur, oggDur, wavDur] = await Promise.all([
                        mp3Source ? getFileSize(mp3Source) : Promise.resolve(null),
                        oggSource ? getFileSize(oggSource) : Promise.resolve(null),
                        wavSource ? getFileSize(wavSource) : Promise.resolve(null),
                        mp3Source ? getDuration(mp3Source) : Promise.resolve(0),
                        oggSource ? getDuration(oggSource) : Promise.resolve(0),
                        wavSource ? getDuration(wavSource) : Promise.resolve(0)
                    ]);

                    const formats = [];
                    if (mp3Source) formats.push('mp3');
                    if (oggSource) formats.push('ogg');
                    if (wavSource) formats.push('wav');

                    return {
                        title: rawSound.title,
                        formats,
                        fileSizes: { mp3: mp3Size, ogg: oggSize, wav: wavSize },
                        duration: Math.max(mp3Dur || 0, oggDur || 0, wavDur || 0),
                        files: rawSound.files
                    };
                }

                function createSoundHTML(soundObj, folderName) {
                    const stereoAvailable = soundObj.formats.some((format) => Boolean(soundObj.files.stereo[format]));
                    const monoAvailable = soundObj.formats.some((format) => Boolean(soundObj.files.mono[format]));

                    const defaultMode = stereoAvailable ? 'stereo' : (monoAvailable ? 'mono' : 'stereo');
                    const defaultSrc = soundObj.files[defaultMode].mp3 || soundObj.files[defaultMode].ogg || soundObj.files[defaultMode].wav || '';

                    const mp3Meta = soundObj.formats.includes('mp3') ? `MP3 (${formatBytes(soundObj.fileSizes.mp3)})` : null;
                    const oggMeta = soundObj.formats.includes('ogg') ? `OGG (${formatBytes(soundObj.fileSizes.ogg)})` : null;
                    const wavMeta = soundObj.formats.includes('wav') ? `WAV (${formatBytes(soundObj.fileSizes.wav)})` : null;
                    const metaChunks = [mp3Meta, oggMeta, wavMeta].filter(Boolean);
                    metaChunks.push(formatMs(soundObj.duration));
                    const metaLine = metaChunks.join(' • ');

                    return `
                        <div class="sound-card" data-default-src="${escapeHtml(defaultSrc)}" data-folder-name="${escapeHtml(folderName || '')}">
                            <button class="play-btn" type="button" aria-label="Воспроизвести">▶</button>
                            <div class="sound-info">
                                <div class="sound-title" title="${escapeHtml(soundObj.title)}">${escapeHtml(soundObj.title)}</div>
                                <div class="sound-meta">${escapeHtml(metaLine)}</div>
                                <div class="sound-controls-row">
                                    <div class="sound-mode-switcher">
                                        ${stereoAvailable ? `<button type="button" class="sound-mode-btn ${defaultMode === 'stereo' ? 'active' : ''}" data-mode="stereo" data-src="${escapeHtml(soundObj.files.stereo.mp3 || soundObj.files.stereo.ogg || soundObj.files.stereo.wav || '')}"><span class="mode-btn-text">L / R</span></button>` : ''}
                                        ${monoAvailable ? `<button type="button" class="sound-mode-btn ${defaultMode === 'mono' ? 'active' : ''}" data-mode="mono" data-src="${escapeHtml(soundObj.files.mono.mp3 || soundObj.files.mono.ogg || soundObj.files.mono.wav || '')}"><span class="mode-btn-text">M</span></button>` : ''}
                                    </div>
                                    <div class="sound-time"><span class="sound-current">00:00</span> / <span class="sound-duration">${formatMs(soundObj.duration)}</span></div>
                                </div>
                                <input type="range" class="sound-progress" min="0" max="100" value="0" step="0.1">
                            </div>
                        </div>
                    `;
                }

                async function renderSoundsList(soundItems, folderName) {
                    contentEl.innerHTML = `
                        <div class="sounds-content-header">
                            <h4>Папка: ${escapeHtml(folderName || 'Звуки')}</h4>
                        </div>
                        <div class="sounds-files-list" id="sounds-files-list"><div class="sounds-empty">Подготовка звуков...</div></div>
                    `;

                    const filesListEl = document.getElementById('sounds-files-list');
                    if (!filesListEl) return;
                    if (!soundItems.length) {
                        filesListEl.innerHTML = '<div class="sounds-empty">Звуки не найдены</div>';
                        return;
                    }

                    const builtItems = await Promise.all(soundItems.map((item) => buildSoundItem(item)));
                    const validItems = builtItems.filter((item) => item.formats.length > 0);

                    if (!validItems.length) {
                        filesListEl.innerHTML = '<div class="sounds-empty">Доступных mp3/ogg не найдено</div>';
                        return;
                    }

                    filesListEl.innerHTML = `<div class="sounds-list">${validItems.map(createSoundHTML).join('')}</div>`;

                    let currentPlayingCard = null;

                    const setPlayButtonState = (card, isPlaying) => {
                        if (!card) return;
                        const playBtn = card.querySelector('.play-btn');
                        if (!playBtn) return;
                        playBtn.textContent = isPlaying ? '⏸' : '▶';
                    };

                    const clearPlayingState = () => {
                        if (!currentPlayingCard) return;
                        currentPlayingCard.classList.remove('playing');
                        const progressBar = currentPlayingCard.querySelector('.sound-progress');
                        if (progressBar) progressBar.value = 0;
                        const currentTimeEl = currentPlayingCard.querySelector('.sound-current');
                        if (currentTimeEl) currentTimeEl.textContent = '00:00';
                        setPlayButtonState(currentPlayingCard, false);
                        currentPlayingCard = null;
                    };

                    const getActiveSource = (card) => {
                        const activeModeBtn = card.querySelector('.sound-mode-btn.active');
                        return activeModeBtn?.dataset.src || card.dataset.defaultSrc || '';
                    };

                    filesListEl.querySelectorAll('.sound-mode-btn').forEach((btn) => {
                        btn.addEventListener('click', () => {
                            const card = btn.closest('.sound-card');
                            if (!card) return;
                            card.querySelectorAll('.sound-mode-btn').forEach((b) => b.classList.remove('active'));
                            btn.classList.add('active');
                        });
                    });

                    filesListEl.querySelectorAll('.play-btn').forEach((playBtn) => {
                        playBtn.addEventListener('click', async () => {
                            const card = playBtn.closest('.sound-card');
                            if (!card) return;
                            const source = getActiveSource(card);
                            if (!source) return;

                            if (currentPlayingCard === card && globalAudio.src.includes(source)) {
                                if (globalAudio.paused) {
                                    await globalAudio.play().catch((err) => console.error('Play error:', err));
                                } else {
                                    globalAudio.pause();
                                }
                                return;
                            }

                            if (currentPlayingCard && currentPlayingCard !== card) {
                                setPlayButtonState(currentPlayingCard, false);
                                currentPlayingCard.classList.remove('playing');
                            }

                            globalAudio.src = source;
                            globalAudio.currentTime = 0;
                            currentPlayingCard = card;
                            card.classList.add('playing');
                            await globalAudio.play().catch((err) => console.error('Play error:', err));
                        });
                    });

                    filesListEl.querySelectorAll('.sound-progress').forEach((progressBar) => {
                        progressBar.addEventListener('input', (e) => {
                            if (!globalAudio.duration || !currentPlayingCard) return;
                            globalAudio.currentTime = (Number(e.target.value) / 100) * globalAudio.duration;
                        });
                    });

                    if (globalAudio._soundTimeUpdateHandler) {
                        globalAudio.removeEventListener('timeupdate', globalAudio._soundTimeUpdateHandler);
                    }
                    if (globalAudio._soundPlayHandler) {
                        globalAudio.removeEventListener('play', globalAudio._soundPlayHandler);
                    }
                    if (globalAudio._soundPauseHandler) {
                        globalAudio.removeEventListener('pause', globalAudio._soundPauseHandler);
                    }
                    if (globalAudio._soundEndedHandler) {
                        globalAudio.removeEventListener('ended', globalAudio._soundEndedHandler);
                    }

                    globalAudio._soundTimeUpdateHandler = () => {
                        if (!currentPlayingCard) return;
                        const progressBar = currentPlayingCard.querySelector('.sound-progress');
                        const currentTimeEl = currentPlayingCard.querySelector('.sound-current');
                        const durationEl = currentPlayingCard.querySelector('.sound-duration');
                        if (progressBar && globalAudio.duration) {
                            progressBar.value = ((globalAudio.currentTime / globalAudio.duration) * 100) || 0;
                        }
                        if (currentTimeEl) {
                            currentTimeEl.textContent = formatMs(globalAudio.currentTime * 1000);
                        }
                        if (durationEl && globalAudio.duration) {
                            durationEl.textContent = formatMs(globalAudio.duration * 1000);
                        }
                    };

                    globalAudio._soundPlayHandler = () => {
                        setPlayButtonState(currentPlayingCard, true);
                    };

                    globalAudio._soundPauseHandler = () => {
                        setPlayButtonState(currentPlayingCard, false);
                    };

                    globalAudio._soundEndedHandler = () => {
                        clearPlayingState();
                    };

                    globalAudio.addEventListener('timeupdate', globalAudio._soundTimeUpdateHandler);
                    globalAudio.addEventListener('play', globalAudio._soundPlayHandler);
                    globalAudio.addEventListener('pause', globalAudio._soundPauseHandler);
                    globalAudio.addEventListener('ended', globalAudio._soundEndedHandler);
                }

                let sidebarHtml = '<ul class="sounds-tree">';
                folders.forEach((folder) => {
                    const folderName = folder.name;
                    const isOpen = folderName === 'JDSh_Ui';
                    sidebarHtml += `
                        <li class="sounds-folder-item ${isOpen ? 'open' : ''}">
                            <button class="sounds-folder-btn ${isOpen ? 'active' : ''}" data-folder-id="${folder.id}" data-folder-name="${folderName}">
                                <span class="file-icon">📁</span>
                                <span>${folderName}</span>
                            </button>
                        </li>
                    `;
                });
                sidebarHtml += '</ul>';
                sidebarEl.innerHTML = sidebarHtml;

                const openFolder = async (folderId) => {
                    const folder = folders.find((f) => f.id === folderId) || folders[0];
                    if (!folder) return;

                    sidebarEl.querySelectorAll('.sounds-folder-btn').forEach((btn) => {
                        btn.classList.toggle('active', btn.dataset.folderId === folder.id);
                    });

                    try {
                        const manifestRes = await fetch(`${folder.basePath}/${folder.manifest}?v=${Date.now()}`);
                        if (!manifestRes.ok) throw new Error(`HTTP ${manifestRes.status}`);
                        const manifest = await manifestRes.json();

                        let rawSounds;
                        if (folder.type === 'jdsh') {
                            rawSounds = buildJdshSoundsMap(manifest, folder.basePath);
                        } else {
                            rawSounds = buildFlatSoundsMap(manifest, folder.basePath);
                        }

                        await renderSoundsList(rawSounds, folder.name);
                    } catch (err) {
                        contentEl.innerHTML = `<div style="padding: 20px; color: var(--mc-red);">Ошибка загрузки манифеста для ${escapeHtml(folder.name)}: ${escapeHtml(err.message)}</div>`;
                    }
                };

                sidebarEl.querySelectorAll('.sounds-folder-btn').forEach((btn) => {
                    btn.addEventListener('click', async () => {
                        await openFolder(btn.dataset.folderId);
                    });
                });

                const defaultFolderBtn = sidebarEl.querySelector('.sounds-folder-btn[data-folder-id="JDSh_Ui"]') || sidebarEl.querySelector('.sounds-folder-btn');
                if (defaultFolderBtn) {
                    await openFolder(defaultFolderBtn.dataset.folderId);
                }
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

                function convertMarkdownToHtml(markdownText) {
                    let htmlText = markdownText
                        .replace(/^# (.*?)$/gm, '<h1>$1</h1>')
                        .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
                        .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\*(.*?)\*/g, '<em>$1</em>')
                        .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

                    htmlText = htmlText.replace(/(?:^|\n)-\s+(.+?)(?=\n(?:-\s+|$)|\n\n|$)/g, (match) => {
                        const items = match
                            .trim()
                            .split('\n')
                            .map((line) => line.replace(/^-\s+/, '').trim())
                            .filter(Boolean)
                            .map((item) => `<li>${item}</li>`)
                            .join('');

                        return `\n<ul>${items}</ul>`;
                    });

                    htmlText = htmlText
                        .replace(/\n\n/g, '</p><p>')
                        .replace(/\n/g, '<br>');

                    return htmlText;
                }
                
                // Простой рендер markdown (без библиотеки)
                const html = convertMarkdownToHtml(cleanedText);
                
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

document.addEventListener('DOMContentLoaded', async () => {
    if (typeof window.L === 'undefined') {
        console.warn('Leaflet is not available: map initialization skipped.');
        return;
    }

    const mapContainer = document.getElementById('map');
    if (!mapContainer) {
        return;
    }

    function readStoredServers() {
        try {
            const raw = localStorage.getItem('smp.multiverse.servers');
            const parsed = raw ? JSON.parse(raw) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }

    function randomCoord(min, max) {
        return Number((Math.random() * (max - min) + min).toFixed(4));
    }

    function ensureServerCoords(server) {
        if (Array.isArray(server.coords) && server.coords.length === 2) {
            return server;
        }

        return {
            ...server,
            coords: [randomCoord(-80, 80), randomCoord(-170, 170)]
        };
    }

    const localServers = readStoredServers().map(ensureServerCoords);
    window.servers = localServers.length > 0
        ? localServers
        : (Array.isArray(window.servers) ? window.servers : []);

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

document.addEventListener('DOMContentLoaded', async () => {
    const starsCanvas = document.getElementById('stars');
    const universeCanvas = document.getElementById('universe');

    function revealMapScene() {
        if (!mapArea) {
            return;
        }

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                mapArea.classList.add('is-ready');
                mapArea.classList.remove('is-initializing');
            });
        });
    }

    if (!starsCanvas || !universeCanvas) {
        if (mapArea) {
            mapArea.classList.remove('is-initializing');
        }
        return;
    }

    const starsCtx = starsCanvas.getContext('2d');
    const universeCtx = universeCanvas.getContext('2d');

    if (!starsCtx || !universeCtx) {
        if (mapArea) {
            mapArea.classList.remove('is-initializing');
        }
        return;
    }

    const overlayCount = document.getElementById('scene-server-count');
    const overlayScale = document.getElementById('scene-scale');
    const overlayFocus = document.getElementById('scene-focus');
    const overlayCoords = document.getElementById('scene-coords');

    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
    let serverClockOffsetMs = 0;

    function getSynchronizedNowMs() {
        return Date.now() + serverClockOffsetMs;
    }

    async function syncServerClock() {
        try {
            const requestStartedAt = Date.now();
            const response = await fetch(`assets/manifest.json?clockSync=${requestStartedAt}`, {
                method: 'HEAD',
                cache: 'no-store'
            });
            const requestFinishedAt = Date.now();

            const serverDateHeader = response.headers.get('date');
            if (!serverDateHeader) {
                return false;
            }

            const serverNowMs = Date.parse(serverDateHeader);
            if (!Number.isFinite(serverNowMs)) {
                return false;
            }

            const midpointClientNow = requestStartedAt + ((requestFinishedAt - requestStartedAt) / 2);
            serverClockOffsetMs = serverNowMs - midpointClientNow;
            return true;
        } catch (error) {
            return false;
        }
    }

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
        const size = getPlanetDetailSize();
        const textureRadius = Math.max(2, Math.floor(size / 2));
        texture.width = size;
        texture.height = size;

        const textureCtx = texture.getContext('2d');
        if (!textureCtx) {
            return texture;
        }

        const rand = seededRandom(server.seed);
        const color = serverColor(server).base;
        const toxicity = clamp(1 - server.atmosphere, 0, 1);

        for (let y = -textureRadius; y < textureRadius; y += 1) {
            for (let x = -textureRadius; x < textureRadius; x += 1) {
                if ((x * x) + (y * y) > textureRadius * textureRadius) {
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

                textureCtx.fillRect(x + textureRadius, y + textureRadius, 1, 1);
            }
        }

        return texture;
    }

    let width = 0;
    let height = 0;
    let stars = [];
    let comets = [];
    let planets = [];
    const simulationEpochMs = Date.UTC(2026, 0, 1, 0, 0, 0);
    let simulationTimeSec = (getSynchronizedNowMs() - simulationEpochMs) / 1000;
    let simulationFrame = Math.floor(simulationTimeSec * 60);
    let nextCometFrame = simulationFrame + 240;
    let hoveredPlanetName = '';
    let cameraZoom = 1;
    let cameraZoomTarget = 1;
    let cameraPanX = 0;
    let cameraPanY = 0;
    let cameraPanTargetX = 0;
    let cameraPanTargetY = 0;
    let layoutPanX = 0;
    const minZoom = 0.55;
    const maxZoom = 2.4;
    const baseLerpSpeed = 0.12;
    const panLerpSpeed = 0.14;
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

    function getSidebarWidthPx() {
        const rawValue = getComputedStyle(document.documentElement).getPropertyValue('--sidebar-width').trim();
        const parsedValue = Number.parseFloat(rawValue);
        return Number.isFinite(parsedValue) ? parsedValue : 280;
    }

    function getSidebarTranslateXPx() {
        if (!sidebar) {
            return 0;
        }

        const transform = getComputedStyle(sidebar).transform;
        if (!transform || transform === 'none') {
            return 0;
        }

        const matrix3dMatch = transform.match(/^matrix3d\((.+)\)$/);
        if (matrix3dMatch) {
            const values = matrix3dMatch[1].split(',').map((part) => Number.parseFloat(part.trim()));
            return Number.isFinite(values[12]) ? values[12] : 0;
        }

        const matrixMatch = transform.match(/^matrix\((.+)\)$/);
        if (matrixMatch) {
            const values = matrixMatch[1].split(',').map((part) => Number.parseFloat(part.trim()));
            return Number.isFinite(values[4]) ? values[4] : 0;
        }

        return 0;
    }

    function getLayoutPanCompensation() {
        if (!appShell) {
            return 0;
        }

        const sidebarWidth = getSidebarWidthPx();
        const sidebarTranslateX = clamp(getSidebarTranslateXPx(), -sidebarWidth, 0);
        return -((sidebarWidth + sidebarTranslateX) / 2);
    }

    if (overlayCount) {
        overlayCount.textContent = `Серверов: ${serverList.length}`;
    }

    function setCanvasSize(preserveState = true) {
        const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
        const prevWidth = width;
        const prevHeight = height;
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

        const canScaleExisting = preserveState && prevWidth > 0 && prevHeight > 0;

        if (!canScaleExisting || stars.length === 0) {
            createStars();
        } else {
            stars.forEach((star) => {
                star.x = (star.x / prevWidth) * width;
                star.y = (star.y / prevHeight) * height;
            });
        }

        if (!canScaleExisting || planets.length === 0) {
            createPlanets();
        } else {
            const prevMinSide = Math.max(320, Math.min(prevWidth, prevHeight));
            const nextMinSide = Math.max(320, Math.min(width, height));
            const orbitScale = nextMinSide / prevMinSide;

            planets.forEach((planet) => {
                planet.orbitRadius *= orbitScale;
            });
        }

        if (canScaleExisting && comets.length > 0) {
            const scaleX = width / prevWidth;
            const scaleY = height / prevHeight;
            comets.forEach((comet) => {
                comet.startX *= scaleX;
                comet.startY *= scaleY;
                comet.vx *= scaleX;
                comet.vy *= scaleY;
            });
        }
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
                brightnessBase: 0.35 + rand() * 0.65,
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
                angleBase: angle,
                orbitSpeed: 0.06 + (0.21 * server.activity),
                angle,
                x: 0,
                y: 0,
                texture,
                color: serverColor(server)
            };
        });
    }

    window.addEventListener('planet-detail-level-changed', () => {
        createPlanets();
    });

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

    function spawnComet(spawnFrame) {
        const horizontalStart = cometRand() > 0.5;
        const startX = horizontalStart ? -30 : Math.floor(cometRand() * width);
        const startY = horizontalStart ? Math.floor(cometRand() * (height * 0.55)) : -30;
        const speedBase = 1.4 + cometRand() * 1.8;

        comets.push({
            startX,
            startY,
            vx: speedBase * (0.9 + cometRand() * 0.9),
            vy: speedBase * (0.7 + cometRand() * 0.9),
            maxLife: 140 + Math.floor(cometRand() * 90),
            spawnFrame
        });
    }

    function updateStars() {
        // Twinkle now derives from shared simulationTimeSec in drawStars()
    }

    function updateComets() {
        if (simulationFrame >= nextCometFrame && comets.length < 4) {
            spawnComet(nextCometFrame);
            nextCometFrame = simulationFrame + 180 + Math.floor(cometRand() * 340);
        }

        comets = comets.filter((comet) => {
            const age = simulationFrame - comet.spawnFrame;
            const x = comet.startX + (comet.vx * age);
            const y = comet.startY + (comet.vy * age);

            return age < comet.maxLife && x < width + 50 && y < height + 50;
        });
    }

    function updatePlanets() {
        planets.forEach((planet) => {
            planet.angle = planet.angleBase + (simulationTimeSec * planet.orbitSpeed);
            planet.x = Math.cos(planet.angle) * planet.orbitRadius;
            planet.y = Math.sin(planet.angle) * planet.orbitRadius;
        });
    }

    function drawStars() {
        starsCtx.globalAlpha = 1;
        starsCtx.fillStyle = '#000814';
        starsCtx.fillRect(0, 0, width, height);

        stars.forEach((star) => {
            const twinkle = Math.sin((simulationTimeSec * 60 * star.twinkleSpeed) + star.twinkleOffset) * 0.22;
            const brightness = clamp(star.brightnessBase + twinkle, 0.3, 1);
            starsCtx.globalAlpha = brightness;
            starsCtx.fillStyle = '#ffffff';
            starsCtx.fillRect(star.x, star.y, star.size, star.size);
        });

        starsCtx.globalAlpha = 1;
    }

    function drawComets() {
        starsCtx.fillStyle = '#d9f1ff';

        comets.forEach((comet) => {
            const age = simulationFrame - comet.spawnFrame;
            const x = comet.startX + (comet.vx * age);
            const y = comet.startY + (comet.vy * age);

            starsCtx.globalAlpha = 1;
            starsCtx.fillRect(x, y, 3, 3);

            for (let i = 1; i <= 12; i += 1) {
                starsCtx.globalAlpha = Math.max(0.03, 1 - i * 0.08);
                starsCtx.fillRect(x - i * 2, y - i * 2, 2, 2);
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
        const centerX = (width / 2) + cameraPanX + layoutPanX;
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
                const centerX = (width / 2) + cameraPanX + layoutPanX;
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
        simulationTimeSec = (getSynchronizedNowMs() - simulationEpochMs) / 1000;
        simulationFrame = Math.floor(simulationTimeSec * 60);
        layoutPanX = getLayoutPanCompensation();

        // Плавная интерполяция масштаба с динамической скоростью
        cameraZoom += (cameraZoomTarget - cameraZoom) * currentZoomSpeed;

        // Затухание скорости, если нет активных вводов
        const now = performance.now();
        if (now - lastZoomInputTime > 100) {
            currentZoomSpeed = Math.max(currentZoomSpeed - 0.01, baseLerpSpeed);
        }

        cameraPanX += (cameraPanTargetX - cameraPanX) * panLerpSpeed;
        cameraPanY += (cameraPanTargetY - cameraPanY) * panLerpSpeed;

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
            cameraPanTargetX = cameraPanX;
            cameraPanTargetY = cameraPanY;
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
            cameraPanTargetX = 0;
            cameraPanTargetY = 0;
        });
    }

    universeCanvas.addEventListener('wheel', (event) => {
        event.preventDefault();
        const zoomFactor = event.deltaY < 0 ? 1.08 : (1 / 1.08);
        setZoom(cameraZoom * zoomFactor);
    }, { passive: false });

    universeCanvas.style.cursor = 'grab';

    window.addEventListener('resize', () => {
        setCanvasSize(true);
    });

    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            syncServerClock();
        }
    });

    await Promise.race([
        syncServerClock(),
        new Promise((resolve) => setTimeout(() => resolve(false), 1200))
    ]);

    setInterval(() => {
        syncServerClock();
    }, 3 * 60 * 1000);

    setCanvasSize(false);
    tick();
    revealMapScene();
});