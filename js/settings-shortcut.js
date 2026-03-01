import { State } from './state.js';
import { generateCubeFaceTextures } from './generation/planet-generator.js';

const DETAIL_LEVEL_TO_SIZE = {
    1: 16,
    2: 32,
    3: 64,
    4: 128
};

const DETAIL_PREVIEW_FACES = ['front', 'back', 'left', 'right', 'top', 'bottom'];

function initSettingsShortcut() {
    if (window.__smpSettingsShortcutInitialized) {
        return;
    }

    const settingsModal = document.getElementById('settings-modal');
    const settingsClose = document.querySelector('.settings-close');
    const detailLevelControl = document.getElementById('site-planet-detail-level');
    const detailPreviewCube = document.getElementById('site-planet-detail-preview-cube');
    const detailLevelTooltip = document.getElementById('site-planet-detail-tooltip');
    const fullscreenButton = document.getElementById('settings-fullscreen-toggle');
    const tabButtons = settingsModal ? Array.from(settingsModal.querySelectorAll('.settings-tab-button')) : [];
    const tabPanels = settingsModal ? Array.from(settingsModal.querySelectorAll('[data-tab-panel]')) : [];
    const volumeMasterInput = document.getElementById('settings-volume-master');
    const volumeSfxInput = document.getElementById('settings-volume-sfx');
    const volumeMusicInput = document.getElementById('settings-volume-music');

    if (!settingsModal || !settingsClose || !detailLevelControl) {
        return;
    }

    window.__smpSettingsShortcutInitialized = true;

    const canUseFullscreen = !!(document.documentElement && document.documentElement.requestFullscreen && document.exitFullscreen);

    const clampLevel = (value) => Math.max(1, Math.min(4, Math.round(Number(value) || 2)));
    let previewSeed = Math.floor(Math.random() * 999999) + 1;

    function setButtonsState(levelValue) {
        const normalized = String(clampLevel(levelValue));
        detailLevelControl.querySelectorAll('[data-detail-level]').forEach((button) => {
            const isActive = button.getAttribute('data-detail-level') === normalized;
            button.classList.toggle('is-active', isActive);
            button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });
    }

    function showDetailTooltip(text) {
        if (!detailLevelTooltip) {
            return;
        }

        const value = String(text || '').trim();
        detailLevelTooltip.textContent = value;
        const isVisible = value.length > 0;
        detailLevelTooltip.classList.toggle('is-visible', isVisible);
        detailLevelTooltip.setAttribute('aria-hidden', isVisible ? 'false' : 'true');
    }

    function syncSettingsForm() {
        setButtonsState(State.getPlanetDetailLevel());
        renderPlanetDetailPreviewWidgets();
    }

    function normalizeVolumePercent(value) {
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) {
            return 100;
        }
        return Math.max(0, Math.min(100, Math.round(numeric)));
    }

    function syncAudioSettingsForm() {
        if (!volumeMasterInput || !volumeSfxInput || !volumeMusicInput) {
            return;
        }

        const audio = State.getAudioSettings();
        volumeMasterInput.value = normalizeVolumePercent(audio.masterVolume * 100);
        volumeSfxInput.value = normalizeVolumePercent(audio.sfxVolume * 100);
        volumeMusicInput.value = normalizeVolumePercent(audio.musicVolume * 100);
    }

    function saveAudioSettingsFromForm() {
        if (!volumeMasterInput || !volumeSfxInput || !volumeMusicInput) {
            return;
        }

        const toScalar = (input) => {
            const numeric = Number(input.value);
            if (!Number.isFinite(numeric)) {
                return 1;
            }
            return Math.max(0, Math.min(1, numeric / 100));
        };

        const next = State.saveAudioSettings({
            masterVolume: toScalar(volumeMasterInput),
            sfxVolume: toScalar(volumeSfxInput),
            musicVolume: toScalar(volumeMusicInput)
        });

        const globalAudio = document.getElementById('global-audio');
        if (globalAudio && typeof globalAudio.volume === 'number') {
            globalAudio.volume = next.masterVolume;
        }

        window.dispatchEvent(new CustomEvent('audio-settings-changed', {
            detail: next
        }));
    }

    function randomizePlanetDetailPreview() {
        previewSeed = Math.floor(Math.random() * 999999) + 1;
        renderPlanetDetailPreviewWidgets();
    }

    function renderPlanetDetailPreviewWidgets() {
        if (!detailPreviewCube) {
            return;
        }

        const level = clampLevel(State.getPlanetDetailLevel());
        const textureSize = DETAIL_LEVEL_TO_SIZE[level] || 32;
        const generated = generateCubeFaceTextures(previewSeed, {
            size: textureSize,
            type: 'earth',
            scale: 2.2,
            octaves: 5,
            persistence: 0.5,
            seaLevel: 0.5,
            strictPalette: false,
            lightDirection: { x: -0.38, y: 0.74, z: 0.56 }
        });

        DETAIL_PREVIEW_FACES.forEach((faceName) => {
            const canvas = detailPreviewCube.querySelector(`[data-face="${faceName}"]`);
            const source = generated.faces[faceName];
            if (!canvas || !source) {
                return;
            }

            canvas.width = textureSize;
            canvas.height = textureSize;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) {
                return;
            }

            ctx.imageSmoothingEnabled = false;
            ctx.clearRect(0, 0, textureSize, textureSize);
            ctx.drawImage(source, 0, 0, textureSize, textureSize);
        });
    }

    function setActiveTab(tabId) {
        const targetTab = String(tabId || 'main');

        tabButtons.forEach((button) => {
            const isActive = button.getAttribute('data-tab') === targetTab;
            button.classList.toggle('is-active', isActive);
            button.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });

        tabPanels.forEach((panel) => {
            const isActive = panel.getAttribute('data-tab-panel') === targetTab;
            panel.classList.toggle('hidden', !isActive);
            panel.setAttribute('aria-hidden', isActive ? 'false' : 'true');
        });
    }

    function openSettings() {
        syncSettingsForm();
        syncAudioSettingsForm();
        randomizePlanetDetailPreview();
        setActiveTab('main');
        settingsModal.classList.remove('hidden');
        settingsModal.setAttribute('aria-hidden', 'false');
    }

    function closeSettings() {
        settingsModal.classList.add('hidden');
        settingsModal.setAttribute('aria-hidden', 'true');
    }

    function updateFullscreenButtonLabel() {
        if (!fullscreenButton) {
            return;
        }

        if (!canUseFullscreen) {
            fullscreenButton.disabled = true;
            fullscreenButton.textContent = 'Полноэкранный режим недоступен';
            return;
        }

        const isFullscreen = !!document.fullscreenElement;
        fullscreenButton.textContent = isFullscreen
            ? 'Выйти из полноэкранного режима'
            : 'Открыть сайт на весь экран';
    }

    detailLevelControl.addEventListener('click', (event) => {
        const button = event.target.closest('[data-detail-level]');
        if (!button) {
            return;
        }

        State.saveGraphicsSettings({
            planetDetailLevel: clampLevel(button.getAttribute('data-detail-level'))
        });
        syncSettingsForm();
        window.dispatchEvent(new CustomEvent('planet-detail-level-changed'));
    });

    // Общая подсказка под кнопками детализации
    if (detailLevelControl && detailLevelTooltip) {
        const getTooltipText = (target) => target?.getAttribute('data-tooltip') || '';

        detailLevelControl.addEventListener('mouseenter', (event) => {
            const button = event.target.closest('[data-detail-level]');
            if (!button) {
                return;
            }
            showDetailTooltip(getTooltipText(button));
        });

        detailLevelControl.addEventListener('mousemove', (event) => {
            const button = event.target.closest('[data-detail-level]');
            if (!button) {
                return;
            }
            showDetailTooltip(getTooltipText(button));
        });

        detailLevelControl.addEventListener('mouseleave', () => {
            showDetailTooltip('');
        });

        detailLevelControl.addEventListener('focusin', (event) => {
            const button = event.target.closest('[data-detail-level]');
            if (!button) {
                return;
            }
            showDetailTooltip(getTooltipText(button));
        });

        detailLevelControl.addEventListener('focusout', (event) => {
            if (!detailLevelControl.contains(event.relatedTarget)) {
                showDetailTooltip('');
            }
        });
    }

    if (tabButtons.length) {
        tabButtons.forEach((button) => {
            button.addEventListener('click', () => {
                const tabId = button.getAttribute('data-tab') || 'main';
                setActiveTab(tabId);
            });
        });
    }

    if (volumeMasterInput && volumeSfxInput && volumeMusicInput) {
        const onVolumeInput = () => {
            saveAudioSettingsFromForm();
        };

        volumeMasterInput.addEventListener('input', onVolumeInput);
        volumeSfxInput.addEventListener('input', onVolumeInput);
        volumeMusicInput.addEventListener('input', onVolumeInput);
    }

    if (fullscreenButton) {
        updateFullscreenButtonLabel();

        if (canUseFullscreen) {
            fullscreenButton.addEventListener('click', async () => {
                try {
                    if (document.fullscreenElement) {
                        await document.exitFullscreen();
                    } else {
                        await document.documentElement.requestFullscreen();
                    }
                } catch (error) {
                    console.error('Fullscreen toggle failed', error);
                }
            });

            document.addEventListener('fullscreenchange', updateFullscreenButtonLabel);
        } else {
            updateFullscreenButtonLabel();
        }
    }

    settingsClose.addEventListener('click', closeSettings);

    settingsModal.addEventListener('click', (event) => {
        if (event.target === settingsModal) {
            closeSettings();
        }
    });

    document.addEventListener('keydown', (event) => {
        const planetModal = document.getElementById('planetModal');
        const isPlanetModalOpen = planetModal && !planetModal.classList.contains('hidden');
        const isInPlanetModal = isPlanetModalOpen && event.target instanceof HTMLElement && planetModal.contains(event.target);

        const isInputTarget = event.target instanceof HTMLElement &&
            (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA' || event.target.isContentEditable);

        if (event.key === 'Tab') {
            const settingsHidden = settingsModal.classList.contains('hidden');

            // В модалке планеты Tab всегда открывает настройки, даже из инпутов
            if (isPlanetModalOpen && isInPlanetModal && settingsHidden) {
                event.preventDefault();
                openSettings();
                return;
            }

            if (!isInputTarget && settingsHidden) {
                event.preventDefault();
                openSettings();
                return;
            }
        }

        if (!isInputTarget && event.key === 'Enter' && event.altKey) {
            if (!fullscreenButton || !canUseFullscreen) {
                return;
            }

            event.preventDefault();

            if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => {});
            } else {
                document.documentElement.requestFullscreen().catch(() => {});
            }
        }
    });

    // Expose helper for other scripts (e.g. mascot menu on index)
    window.__smpOpenSettingsModal = openSettings;
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSettingsShortcut, { once: true });
} else {
    initSettingsShortcut();
}
