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

    if (!settingsModal || !settingsClose || !detailLevelControl) {
        return;
    }

    window.__smpSettingsShortcutInitialized = true;

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

    function syncSettingsForm() {
        setButtonsState(State.getPlanetDetailLevel());
        renderPlanetDetailPreviewWidgets();
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

    function openSettings() {
        syncSettingsForm();
        randomizePlanetDetailPreview();
        settingsModal.classList.remove('hidden');
        settingsModal.setAttribute('aria-hidden', 'false');
    }

    function closeSettings() {
        settingsModal.classList.add('hidden');
        settingsModal.setAttribute('aria-hidden', 'true');
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

    settingsClose.addEventListener('click', closeSettings);

    settingsModal.addEventListener('click', (event) => {
        if (event.target === settingsModal) {
            closeSettings();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key !== 'Tab') {
            return;
        }

        if (!settingsModal.classList.contains('hidden')) {
            return;
        }

        event.preventDefault();
        openSettings();
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSettingsShortcut, { once: true });
} else {
    initSettingsShortcut();
}
