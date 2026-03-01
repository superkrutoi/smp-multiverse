import { State } from './state.js';
import { setupModal } from './modal.js';
import { createPlanetEditor } from './planet-editor.js';
import { generateCubeFaceTextures } from './generation/planet-generator.js';

const versions = ['1.21.4', '1.21.1', '1.20.6', '1.20.4'];
const cores = ['Paper', 'Fabric', 'Forge', 'Purpur'];

const grid = document.getElementById('serversGrid');
const emptyState = document.getElementById('emptyState');
const emptyCreateBtn = document.getElementById('emptyCreateBtn');
const addServerBtn = document.getElementById('addServerBtn');

const serverModal = document.getElementById('createServerModal');
const closeServerModal = document.getElementById('closeServerModal');
const closeServerModalSecondary = document.getElementById('closeServerModalSecondary');
const serverForm = document.getElementById('createServerForm');
const createServerTitle = document.getElementById('createServerTitle');
const saveServerBtn = document.getElementById('saveServerBtn');
const versionSelect = document.getElementById('serverVersion');
const coreSelect = document.getElementById('serverCore');
const planetPreview = document.getElementById('planetPreview');
const pickPlanetBtn = document.getElementById('pickPlanetBtn');

const planetModal = document.getElementById('planetModal');
const closePlanetModal = document.getElementById('closePlanetModal');
const applyPlanetBtn = document.getElementById('applyPlanetBtn');
const randomPlanetBtn = document.getElementById('randomPlanetBtn');
const planetCubePreview = document.getElementById('planetCubePreview');
const planetEditorPreviewWrap = document.querySelector('.planet-editor-preview-wrap');
const planetPreviewDetailControls = document.getElementById('planetPreviewDetailControls');
const planetLightOrbit = document.getElementById('planetLightOrbit');
const planetLightHandle = document.getElementById('planetLightHandle');
const planetAxisTiltCanvas = document.getElementById('planetAxisTiltCanvas');
const planetAxisTiltInput = document.getElementById('planetAxisTiltInput');
const planetAxisTiltSlider = document.getElementById('planetAxisTiltSlider');
const planetPreviewZoomIn = document.getElementById('planetPreviewZoomIn');
const planetPreviewZoomOut = document.getElementById('planetPreviewZoomOut');
const planetPreviewZoomValue = document.getElementById('planetPreviewZoomValue');
const planetEditorCanvas = document.getElementById('planetEditorCanvas');
const planetSeed = document.getElementById('planetSeed');
const planetPalette = document.getElementById('planetPalette');
const planetOceanColor1 = document.getElementById('planetOceanColor1');
const planetOceanColor2 = document.getElementById('planetOceanColor2');
const planetOceanColor3 = document.getElementById('planetOceanColor3');
const planetLandColor1 = document.getElementById('planetLandColor1');
const planetLandColor2 = document.getElementById('planetLandColor2');
const planetLandColor3 = document.getElementById('planetLandColor3');
const planetScale = document.getElementById('planetScale');
const planetSeaLevel = document.getElementById('planetSeaLevel');
const planetCloudDensity = document.getElementById('planetCloudDensity');
const planetAtmosphere = document.getElementById('planetAtmosphere');
const planetAtmosphereSize = document.getElementById('planetAtmosphereSize');
const planetRingType = document.getElementById('planetRingType');
const satelliteOrbitLayer = document.getElementById('satelliteOrbitLayer');
const satelliteTabs = document.getElementById('satelliteTabs');
const addSatelliteBtn = document.getElementById('addSatelliteBtn');
const satelliteNameInput = document.getElementById('satelliteNameInput');
const satelliteSeed = document.getElementById('satelliteSeed');
const satellitePreset = document.getElementById('satellitePreset');
const satelliteSize = document.getElementById('satelliteSize');
const satelliteMoonSizeHint = document.getElementById('satelliteMoonSizeHint');
const satelliteOrbitRadius = document.getElementById('satelliteOrbitRadius');
const satelliteOrbitSpeed = document.getElementById('satelliteOrbitSpeed');
const satelliteTilt = document.getElementById('satelliteTilt');
const satelliteSizeValue = document.getElementById('satelliteSizeValue');
const satelliteOrbitDistanceValue = document.getElementById('satelliteOrbitDistanceValue');
const satelliteTiltValue = document.getElementById('satelliteTiltValue');
const satelliteOrbitSpeedValue = document.getElementById('satelliteOrbitSpeedValue');
const randomSatelliteBtn = document.getElementById('randomSatelliteBtn');
const deleteSatelliteBtn = document.getElementById('deleteSatelliteBtn');
const satelliteDeleteConfirm = document.getElementById('satelliteDeleteConfirm');
const satelliteDeleteConfirmText = document.getElementById('satelliteDeleteConfirmText');
const satelliteDeleteConfirmYes = document.getElementById('satelliteDeleteConfirmYes');
const satelliteDeleteConfirmNo = document.getElementById('satelliteDeleteConfirmNo');

let selectedPlanetPreview = '';
let selectedPlanetData = null;
let editingServerId = null;

const PLANET_PREVIEW_ZOOM_MIN = 15;
const PLANET_PREVIEW_ZOOM_MAX = 220;
const PLANET_PREVIEW_ZOOM_STEP = 10;
const SATELLITE_ORBIT_RADIUS_MIN = 90;
const SATELLITE_ORBIT_RADIUS_MAX = 1200;
const SATELLITE_DISTANCE_BASE_KM = 50000;
const SATELLITE_DEFAULT_MOON_DISTANCE_KM = 384400;
const SATELLITE_DEFAULT_MOON_ORBIT_RADIUS = 120;
const SATELLITE_DISTANCE_PER_RADIUS_KM = (SATELLITE_DEFAULT_MOON_DISTANCE_KM - SATELLITE_DISTANCE_BASE_KM) /
    (SATELLITE_DEFAULT_MOON_ORBIT_RADIUS - SATELLITE_ORBIT_RADIUS_MIN);
const PLANET_PREVIEW_DETAIL_DEFAULT = 2;
const PLANET_LIGHT_DEFAULT = { x: -0.38, y: 0.74, z: 0.56 };
const PLANET_AXIS_TILT_DEFAULT = 23.44;
const PLANET_AXIS_TILT_MIN = 0;
const PLANET_AXIS_TILT_MAX = 180;
const MAX_SATELLITES = 5;
const SATELLITE_PLANET_CLEARANCE = 18;
const SATELLITE_SIZE_SNAP_THRESHOLD = 2;
const DETAIL_LEVEL_TO_SIZE = {
    1: 16,
    2: 32,
    3: 64,
    4: 128
};
const SATELLITE_PRESETS = {
    moon: {
        type: 'desert',
        seaLevel: 0.01,
        scale: 2.45,
        octaves: 5,
        persistence: 0.5,
        paletteColors: {
            ocean1: '#3d414a',
            ocean2: '#505660',
            ocean3: '#646b77',
            land1: '#7d848f',
            land2: '#9ca4ae',
            land3: '#c3c9d0'
        }
    },
    rocky: {
        type: 'desert',
        seaLevel: 0.02,
        scale: 2.2,
        octaves: 5,
        persistence: 0.53,
        paletteColors: {
            ocean1: '#3d352f',
            ocean2: '#5a4d44',
            ocean3: '#73645a',
            land1: '#8f7c6e',
            land2: '#ac9988',
            land3: '#d0c1b2'
        }
    },
    ice: {
        type: 'ice',
        seaLevel: 0.03,
        scale: 2.35,
        octaves: 5,
        persistence: 0.49,
        paletteColors: {
            ocean1: '#4d5e71',
            ocean2: '#63788f',
            ocean3: '#7f97b2',
            land1: '#96a9ba',
            land2: '#b7c8d7',
            land3: '#dce8f1'
        }
    }
};
let planetPreviewScale = 100;
let lightControlDragging = false;
let planetAxisTiltDeg = PLANET_AXIS_TILT_DEFAULT;
let satelliteItems = [];
let activeSatelliteIndex = 0;
let satelliteVisuals = [];
let satelliteAnimationId = null;
let satelliteLastFrameTs = 0;
let satelliteDeleteConfirmTarget = null;
let moonSizeTweenFrameId = null;
let previewZoomTweenFrameId = null;

const SATELLITE_DELETE_SOUND_SRC = '../assets/ui/sfx/JDSherbert_Pixel_UI_SFX_Pack/Stereo/wav (SD)/JDSherbert - Pixel UI SFX Pack - Error 2 (Square).wav';
const SATELLITE_DELETE_CONFIRM_YES_SOUND_SRC = '../assets/ui/sfx/JDSherbert_Pixel_UI_SFX_Pack/Stereo/wav (SD)/JDSherbert - Pixel UI SFX Pack - Error 2 (Sine).wav';
const SATELLITE_DELETE_CONFIRM_NO_SOUND_SRC = '../assets/ui/sfx/JDSherbert_Pixel_UI_SFX_Pack/Stereo/wav (SD)/JDSherbert - Pixel UI SFX Pack - Cursor 3 (Sine).wav';
let satelliteDeleteSound = null;
let satelliteDeleteConfirmYesSound = null;
let satelliteDeleteConfirmNoSound = null;

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function randomSatelliteSeed() {
    return Math.floor(Math.random() * 999999) + 1;
}

function getDefaultMoonSize() {
    const planetDiameter = getPlanetPreviewRadius() * 2;
    return clamp(Math.round(planetDiameter / 4), 22, 72);
}

function formatSatelliteSizePercent(sizeValue) {
    const moonSize = getDefaultMoonSize();
    if (!moonSize || !Number.isFinite(moonSize)) {
        return '';
    }
    const numericSize = Number(sizeValue) || moonSize;
    const percent = clamp((numericSize / moonSize) * 100, 10, 400);
    return `${Math.round(percent)}%`;
}

function getSatelliteDistanceKm(orbitRadius) {
    const radius = clamp(Number(orbitRadius) || SATELLITE_ORBIT_RADIUS_MIN, SATELLITE_ORBIT_RADIUS_MIN, SATELLITE_ORBIT_RADIUS_MAX);
    const offset = radius - SATELLITE_ORBIT_RADIUS_MIN;
    return SATELLITE_DISTANCE_BASE_KM + (offset * SATELLITE_DISTANCE_PER_RADIUS_KM);
}

function formatSatelliteDistanceLabel(orbitRadius) {
    const distanceKm = getSatelliteDistanceKm(orbitRadius);
    const thousands = clamp(distanceKm / 1000, 0, 999999);
    return thousands.toFixed(1).replace('.', ',');
}

function formatSatelliteTiltLabel(tiltDegRaw) {
    const value = clamp(Number(tiltDegRaw) || 0, 0, 180);
    return `${value.toFixed(0)}\u00b0`;
}

function playSatelliteDeletePromptSound() {
    try {
        if (!satelliteDeleteSound) {
            satelliteDeleteSound = new Audio(SATELLITE_DELETE_SOUND_SRC);
            satelliteDeleteSound.preload = 'auto';
        }
        satelliteDeleteSound.currentTime = 0;
        satelliteDeleteSound.play().catch(() => {});
    } catch {
        // ignore audio errors
    }
}

function playSatelliteDeleteConfirmYesSound() {
    try {
        if (!satelliteDeleteConfirmYesSound) {
            satelliteDeleteConfirmYesSound = new Audio(SATELLITE_DELETE_CONFIRM_YES_SOUND_SRC);
            satelliteDeleteConfirmYesSound.preload = 'auto';
        }
        satelliteDeleteConfirmYesSound.currentTime = 0;
        satelliteDeleteConfirmYesSound.play().catch(() => {});
    } catch {
        // ignore audio errors
    }
}

function playSatelliteDeleteConfirmNoSound() {
    try {
        if (!satelliteDeleteConfirmNoSound) {
            satelliteDeleteConfirmNoSound = new Audio(SATELLITE_DELETE_CONFIRM_NO_SOUND_SRC);
            satelliteDeleteConfirmNoSound.preload = 'auto';
        }
        satelliteDeleteConfirmNoSound.currentTime = 0;
        satelliteDeleteConfirmNoSound.play().catch(() => {});
    } catch {
        // ignore audio errors
    }
}

function createDefaultSatellite(index = 0) {
    const sizeValue = index === 0 ? getDefaultMoonSize() : 30;
    return {
        name: index === 0 ? 'Луна' : `спутник ${index + 1}`,
        seed: randomSatelliteSeed(),
        preset: 'moon',
        size: sizeValue,
        orbitRadius: 120 + (index * 40),
        orbitSpeed: 0.18 + (index * 0.06),
        phase: index * (Math.PI * 0.7),
        tilt: 0,
        spin: 0
    };
}

function createRandomizedSatellite(index = 1) {
    const presets = Object.keys(SATELLITE_PRESETS);
    return {
        name: `спутник ${index + 1}`,
        seed: randomSatelliteSeed(),
        preset: presets[Math.floor(Math.random() * presets.length)] || 'moon',
        size: Math.round(24 + (Math.random() * 42)),
        orbitRadius: clamp(Math.round(100 + (Math.random() * 140)), SATELLITE_ORBIT_RADIUS_MIN, SATELLITE_ORBIT_RADIUS_MAX),
        orbitSpeed: Number((0.08 + (Math.random() * 0.72)).toFixed(3)),
        phase: Math.random() * (Math.PI * 2),
        tilt: Math.round(Math.random() * 180),
        spin: 0
    };
}

function normalizeSatelliteItem(rawItem, index = 0) {
    const fallback = createDefaultSatellite(index);
    const presetValue = String(rawItem?.preset || fallback.preset);
    const preset = SATELLITE_PRESETS[presetValue] ? presetValue : fallback.preset;

    return {
        name: String(rawItem?.name || fallback.name).slice(0, 30),
        seed: clamp(Number(rawItem?.seed) || fallback.seed, 1, 999999),
        preset,
        size: clamp(Number(rawItem?.size) || fallback.size, 22, 72),
        orbitRadius: clamp(Number(rawItem?.orbitRadius) || fallback.orbitRadius, SATELLITE_ORBIT_RADIUS_MIN, SATELLITE_ORBIT_RADIUS_MAX),
        orbitSpeed: clamp(Number(rawItem?.orbitSpeed) || fallback.orbitSpeed, 0.05, 1.2),
        phase: Number.isFinite(Number(rawItem?.phase)) ? Number(rawItem.phase) : fallback.phase,
        tilt: clamp(Number(rawItem?.tilt) || fallback.tilt, 0, 180),
        spin: Number.isFinite(Number(rawItem?.spin)) ? Number(rawItem.spin) : 0
    };
}

function getPlanetPreviewRadius() {
    const cssValue = planetEditorPreviewWrap
        ? Number.parseFloat(getComputedStyle(planetEditorPreviewWrap).getPropertyValue('--planet-cube-size'))
        : Number.NaN;
    const planetSize = Number.isFinite(cssValue) && cssValue > 0 ? cssValue : 100;
    return planetSize * 0.5;
}

function getMinSatelliteOrbitForPlanet(satellite) {
    return getPlanetPreviewRadius() + (satellite.size * 0.5) + SATELLITE_PLANET_CLEARANCE;
}

function normalizeSatellites(inputSatellites) {
    const source = Array.isArray(inputSatellites) && inputSatellites.length > 0
        ? inputSatellites.slice(0, MAX_SATELLITES)
        : [createDefaultSatellite(0)];

    const normalized = source.map((item, index) => normalizeSatelliteItem(item, index));
    const first = normalized[0];
    if (first) {
        first.orbitRadius = clamp(
            Math.max(first.orbitRadius, Math.round(getMinSatelliteOrbitForPlanet(first))),
            SATELLITE_ORBIT_RADIUS_MIN,
            SATELLITE_ORBIT_RADIUS_MAX
        );
    }

    for (let index = 1; index < normalized.length; index += 1) {
        const previous = normalized[index - 1];
        const current = normalized[index];
        const minDistance = previous.orbitRadius + (previous.size * 0.5) + (current.size * 0.5) + 18;
        if (current.orbitRadius < minDistance) {
            current.orbitRadius = Math.min(SATELLITE_ORBIT_RADIUS_MAX, Math.round(minDistance));
        }
    }

    return normalized;
}

function serializeSatellites() {
    return satelliteItems.map((satellite) => ({
        name: satellite.name,
        seed: satellite.seed,
        preset: satellite.preset,
        size: satellite.size,
        orbitRadius: satellite.orbitRadius,
        orbitSpeed: satellite.orbitSpeed,
        phase: satellite.phase,
        tilt: satellite.tilt
    }));
}

function parseTiltValue(value) {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : Number.NaN;
    }

    if (typeof value === 'string') {
        const normalized = value.trim().replace(',', '.');
        if (!normalized) {
            return Number.NaN;
        }
        return Number.parseFloat(normalized);
    }

    return Number(value);
}

function normalizeTiltValue(value, fallback = PLANET_AXIS_TILT_DEFAULT) {
    const parsed = parseTiltValue(value);
    const base = Number.isFinite(parsed) ? parsed : fallback;
    return clamp(base, PLANET_AXIS_TILT_MIN, PLANET_AXIS_TILT_MAX);
}

function applyPlanetPreviewScale(value = planetPreviewScale) {
    if (!planetCubePreview) {
        return;
    }

    planetPreviewScale = clamp(Math.round(Number(value) || 100), PLANET_PREVIEW_ZOOM_MIN, PLANET_PREVIEW_ZOOM_MAX);
    const zoom = Math.max(0.1, planetPreviewScale / 100);
    planetCubePreview.style.setProperty('--cube-zoom', String(zoom));
    if (planetEditorPreviewWrap) {
        planetEditorPreviewWrap.style.setProperty('--preview-cube-zoom', String(zoom));
    }
    if (planetPreviewZoomValue) {
        planetPreviewZoomValue.textContent = `${planetPreviewScale}%`;
    }
}

function stopPreviewZoomTween() {
    if (previewZoomTweenFrameId !== null) {
        window.cancelAnimationFrame(previewZoomTweenFrameId);
        previewZoomTweenFrameId = null;
    }
}

function animatePlanetPreviewScaleTo(targetScale, durationMs = 260) {
    stopPreviewZoomTween();

    const from = planetPreviewScale;
    const to = clamp(Math.round(targetScale), PLANET_PREVIEW_ZOOM_MIN, PLANET_PREVIEW_ZOOM_MAX);
    if (from === to) {
        applyPlanetPreviewScale(to);
        return;
    }

    let startedAt = 0;
    const tick = (timestamp) => {
        if (!startedAt) {
            startedAt = timestamp;
        }

        const t = clamp((timestamp - startedAt) / durationMs, 0, 1);
        const eased = 1 - ((1 - t) ** 3);
        const next = Math.round(from + ((to - from) * eased));
        applyPlanetPreviewScale(next);

        if (t < 1) {
            previewZoomTweenFrameId = window.requestAnimationFrame(tick);
            return;
        }

        previewZoomTweenFrameId = null;
        applyPlanetPreviewScale(to);
    };

    previewZoomTweenFrameId = window.requestAnimationFrame(tick);
}

function forceSatellitePreviewFitOnAdd() {
    if (!planetEditorPreviewWrap || satelliteItems.length === 0) {
        return;
    }

    const wrapRect = planetEditorPreviewWrap.getBoundingClientRect();
    const availableDiameter = Math.max(80, Math.min(wrapRect.width, wrapRect.height) - 22);
    const farthestDistance = satelliteItems.reduce((maxDistance, satellite) => {
        const edgeDistance = satellite.orbitRadius + (satellite.size * 0.5);
        return Math.max(maxDistance, edgeDistance);
    }, getPlanetPreviewRadius());

    const requiredDiameter = Math.max(1, farthestDistance * 2);
    const requiredZoom = availableDiameter / requiredDiameter;
    const currentZoom = Math.max(0.1, planetPreviewScale / 100);
    if (requiredZoom < currentZoom) {
        animatePlanetPreviewScaleTo(requiredZoom * 100, 320);
    }
}

function zoomPlanetPreview(stepDelta) {
    stopPreviewZoomTween();
    applyPlanetPreviewScale(planetPreviewScale + stepDelta);
}

function setPreviewDetailButtonsState(levelValue) {
    if (!planetPreviewDetailControls) {
        return;
    }

    const normalized = String(Math.max(1, Math.min(4, Math.round(Number(levelValue) || PLANET_PREVIEW_DETAIL_DEFAULT))));
    planetPreviewDetailControls.querySelectorAll('[data-preview-detail-level]').forEach((button) => {
        const active = button.getAttribute('data-preview-detail-level') === normalized;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
}

function applyPreviewDetailLevel(levelValue) {
    const level = planetEditor.setPreviewDetailLevel(levelValue);
    setPreviewDetailButtonsState(level);
}

function formatTiltDegrees(value) {
    const normalized = normalizeTiltValue(value, PLANET_AXIS_TILT_DEFAULT);
    return `${normalized.toFixed(2).replace('.', ',')}°`;
}

function drawAxisTiltDiagram(tiltDeg = planetAxisTiltDeg) {
    if (!planetAxisTiltCanvas) {
        return;
    }

    const ctx = planetAxisTiltCanvas.getContext('2d');
    if (!ctx) {
        return;
    }

    const width = planetAxisTiltCanvas.width;
    const height = planetAxisTiltCanvas.height;
    const centerX = Math.round(width * 0.5);
    const centerY = Math.round(height * 0.5);
    const axisHalf = 34;
    const squareHalf = 10;

    ctx.clearRect(0, 0, width, height);
    ctx.imageSmoothingEnabled = false;

    ctx.strokeStyle = 'rgba(116, 196, 116, 0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX - axisHalf, centerY);
    ctx.lineTo(centerX + axisHalf, centerY);
    ctx.moveTo(centerX, centerY - axisHalf);
    ctx.lineTo(centerX, centerY + axisHalf);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(84, 234, 84, 0.98)';
    ctx.lineWidth = 2;
    ctx.strokeRect(centerX - squareHalf, centerY - squareHalf, squareHalf * 2, squareHalf * 2);

    const radians = (tiltDeg * Math.PI) / 180;
    const rx = Math.sin(radians);
    const ry = -Math.cos(radians);

    ctx.strokeStyle = 'rgba(192, 255, 192, 0.98)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(centerX - (rx * axisHalf), centerY - (ry * axisHalf));
    ctx.lineTo(centerX + (rx * axisHalf), centerY + (ry * axisHalf));
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(centerX, centerY, 18, -Math.PI / 2, -Math.PI / 2 + radians, false);
    ctx.strokeStyle = 'rgba(64, 220, 64, 0.98)';
    ctx.lineWidth = 2;
    ctx.stroke();
}

function setAxisTilt(value, syncInput = true) {
    const normalized = normalizeTiltValue(value, PLANET_AXIS_TILT_DEFAULT);
    planetAxisTiltDeg = Math.round(normalized * 100) / 100;

    if (planetEditorPreviewWrap) {
        planetEditorPreviewWrap.style.setProperty('--planet-axis-tilt-deg', `${planetAxisTiltDeg}deg`);
    }

    if (planetAxisTiltInput && syncInput) {
        planetAxisTiltInput.value = planetAxisTiltDeg.toFixed(2);
    }

    if (planetAxisTiltSlider && syncInput) {
        planetAxisTiltSlider.value = planetAxisTiltDeg.toFixed(2);
    }

    drawAxisTiltDiagram(planetAxisTiltDeg);
}

function setLightHandleFromDirection(direction) {
    if (!planetLightOrbit || !planetLightHandle) {
        return;
    }

    const rect = planetLightOrbit.getBoundingClientRect();
    const radius = rect.width / 2;
    const x = Math.max(-1, Math.min(1, Number(direction?.x) || 0));
    const z = Math.max(-1, Math.min(1, Number(direction?.z) || 0));
    const length = Math.hypot(x, z);
    const nx = length > 0.0001 ? x / length : 0;
    const nz = length > 0.0001 ? z / length : 0;

    planetLightHandle.style.left = `${radius + (nx * (radius - 6))}px`;
    planetLightHandle.style.top = `${radius + (nz * (radius - 6))}px`;

    const angle = (Math.atan2(nz, nx) * 180 / Math.PI + 360) % 360;
    planetLightOrbit.setAttribute('aria-valuenow', String(Math.round(angle)));
    updatePreviewSkyLightAngle({ x: nx, z: nz });
}

function updatePreviewSkyLightAngle(direction) {
    if (!planetEditorPreviewWrap) {
        return;
    }

    const x = Number(direction?.x) || 0;
    const z = Number(direction?.z) || 0;
    const length = Math.hypot(x, z);
    if (length < 0.0001) {
        return;
    }

    const nx = x / length;
    const nz = z / length;
    const sourceAngle = ((Math.atan2(nz, nx) * 180 / Math.PI) + 90 + 360) % 360;
    const gradientAngle = (sourceAngle + 180) % 360;
    planetEditorPreviewWrap.style.setProperty('--preview-sky-angle', `${gradientAngle.toFixed(1)}deg`);
}

function applyLightFromOrbitPointer(clientX, clientY) {
    if (!planetLightOrbit) {
        return;
    }

    const rect = planetLightOrbit.getBoundingClientRect();
    const radius = rect.width / 2;
    const cx = rect.left + radius;
    const cy = rect.top + radius;
    const dx = clientX - cx;
    const dy = clientY - cy;
    const distance = Math.hypot(dx, dy);
    const clamped = Math.min(distance, radius - 6);
    const nx = distance > 0.0001 ? dx / distance : 0;
    const nz = distance > 0.0001 ? dy / distance : 0;

    const lightDirection = {
        x: nx,
        y: 0.64,
        z: nz
    };

    const applied = planetEditor.setPreviewLightDirection(lightDirection);

    planetLightHandle.style.left = `${radius + (nx * clamped)}px`;
    planetLightHandle.style.top = `${radius + (nz * clamped)}px`;

    const angle = (Math.atan2(nz, nx) * 180 / Math.PI + 360) % 360;
    planetLightOrbit.setAttribute('aria-valuenow', String(Math.round(angle)));
    setLightHandleFromDirection(applied);
    renderSatelliteTextures();
}

function initLightControl() {
    if (!planetLightOrbit || !planetLightHandle) {
        return;
    }

    planetEditor.setPreviewLightDirection(PLANET_LIGHT_DEFAULT);
    setLightHandleFromDirection(PLANET_LIGHT_DEFAULT);

    planetLightOrbit.addEventListener('pointerdown', (event) => {
        lightControlDragging = true;
        planetLightOrbit.setPointerCapture(event.pointerId);
        applyLightFromOrbitPointer(event.clientX, event.clientY);
    });

    planetLightOrbit.addEventListener('pointermove', (event) => {
        if (!lightControlDragging) {
            return;
        }
        applyLightFromOrbitPointer(event.clientX, event.clientY);
    });

    const stopDragging = (event) => {
        lightControlDragging = false;
        if (planetLightOrbit.hasPointerCapture(event.pointerId)) {
            planetLightOrbit.releasePointerCapture(event.pointerId);
        }
    };

    planetLightOrbit.addEventListener('pointerup', stopDragging);
    planetLightOrbit.addEventListener('pointercancel', stopDragging);

    planetLightOrbit.addEventListener('keydown', (event) => {
        const current = planetEditor.getPreviewLightDirection();
        let nx = current.x;
        let nz = current.z;
        const step = 0.14;

        if (event.key === 'ArrowLeft') nx -= step;
        else if (event.key === 'ArrowRight') nx += step;
        else if (event.key === 'ArrowUp') nz -= step;
        else if (event.key === 'ArrowDown') nz += step;
        else return;

        event.preventDefault();
        const applied = planetEditor.setPreviewLightDirection({ x: nx, y: 0.64, z: nz });
        setLightHandleFromDirection(applied);
        renderSatelliteTextures();
    });
}

function randomizePlanetPreviewSky() {
    if (!planetEditorPreviewWrap) {
        return;
    }

    const comet1Top = `${Math.round(8 + (Math.random() * 36))}%`;
    const comet2Top = `${Math.round(34 + (Math.random() * 50))}%`;
    const comet1Left = `${-18 - Math.round(Math.random() * 36)}px`;
    const comet2Right = `${-16 - Math.round(Math.random() * 34)}px`;
    const comet1Duration = `${(6.2 + (Math.random() * 3.4)).toFixed(2)}s`;
    const comet2Duration = `${(7.4 + (Math.random() * 3.8)).toFixed(2)}s`;

    planetEditorPreviewWrap.style.setProperty('--comet-1-top', comet1Top);
    planetEditorPreviewWrap.style.setProperty('--comet-2-top', comet2Top);
    planetEditorPreviewWrap.style.setProperty('--comet-1-left', comet1Left);
    planetEditorPreviewWrap.style.setProperty('--comet-2-right', comet2Right);
    planetEditorPreviewWrap.style.setProperty('--comet-1-duration', comet1Duration);
    planetEditorPreviewWrap.style.setProperty('--comet-2-duration', comet2Duration);
}

function getCurrentPreviewTextureSize() {
    const level = planetEditor.getPreviewDetailLevel();
    return DETAIL_LEVEL_TO_SIZE[level] || 32;
}

function getSatellitePresetOptions(satellite) {
    const preset = SATELLITE_PRESETS[satellite.preset] || SATELLITE_PRESETS.moon;
    return {
        size: getCurrentPreviewTextureSize(),
        type: preset.type,
        scale: preset.scale,
        octaves: preset.octaves,
        persistence: preset.persistence,
        seaLevel: preset.seaLevel,
        paletteColors: preset.paletteColors,
        lightDirection: planetEditor.getPreviewLightDirection(),
        shadowTint: '#1f2a42',
        lightTint: '#dceeff',
        strictPalette: true
    };
}

function getSatelliteTabPreviewDataUrl(index) {
    const visual = satelliteVisuals[index];
    if (!visual || !visual.faceCanvases || !visual.faceCanvases.front) {
        return null;
    }

    const canvas = visual.faceCanvases.front;
    try {
        return canvas.toDataURL('image/png');
    } catch {
        return null;
    }
}

function renderSatelliteTabs() {
    if (!satelliteTabs) {
        return;
    }

    satelliteTabs.innerHTML = '';
    satelliteItems.forEach((satellite, index) => {
        const fullName = satellite.name || `спутник ${index + 1}`;
        const normalized = String(fullName).trim();

        let shortName;

        if (normalized) {
            const parts = normalized.split(/\s+/);

            if (parts.length >= 2) {
                const first = parts[0].charAt(0) || '';
                const secondWord = parts[1] || '';
                const digitMatch = secondWord.match(/\d/);

                if (digitMatch) {
                    shortName = (first + digitMatch[0]).toUpperCase();
                } else {
                    const second = secondWord.charAt(0) || '';
                    shortName = (first + second).toUpperCase();
                }
            } else {
                const compact = normalized.replace(/\s+/g, '');
                shortName = compact.slice(0, 2).toUpperCase();
            }
        }

        if (!shortName) {
            shortName = `С${index + 1}`;
        }
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `satellite-tab${index === activeSatelliteIndex ? ' is-active' : ''}`;
        button.setAttribute('data-satellite-index', String(index));
        button.setAttribute('role', 'tab');
        button.setAttribute('aria-selected', index === activeSatelliteIndex ? 'true' : 'false');
        button.textContent = shortName;
        button.title = fullName;
        const previewUrl = getSatelliteTabPreviewDataUrl(index);
        if (previewUrl) {
            button.style.backgroundImage = `url(${previewUrl})`;
        }
        satelliteTabs.appendChild(button);
    });
}

function updateSatelliteDeleteButtonState() {
    if (!deleteSatelliteBtn) {
        return;
    }

    const canDelete = satelliteItems.length > 1;
    deleteSatelliteBtn.disabled = !canDelete;
}

function updateMoonSizeHintState() {
    if (!satelliteMoonSizeHint) {
        return;
    }

    const current = satelliteItems[activeSatelliteIndex];
    if (!current) {
        satelliteMoonSizeHint.classList.remove('is-active');
        satelliteMoonSizeHint.setAttribute('aria-pressed', 'false');
        return;
    }

    const moonSize = getDefaultMoonSize();
    const isMoonSize = Math.abs(current.size - moonSize) < 0.5;
    satelliteMoonSizeHint.classList.toggle('is-active', isMoonSize);
    satelliteMoonSizeHint.setAttribute('aria-pressed', isMoonSize ? 'true' : 'false');
}

function stopMoonSizeTween() {
    if (moonSizeTweenFrameId !== null) {
        window.cancelAnimationFrame(moonSizeTweenFrameId);
        moonSizeTweenFrameId = null;
    }
}

function syncSatelliteEditorFields() {
    const current = satelliteItems[activeSatelliteIndex];
    if (!current) {
        return;
    }

    if (satelliteNameInput) satelliteNameInput.value = current.name;
    if (satelliteSeed) satelliteSeed.value = String(current.seed);
    if (satellitePreset) satellitePreset.value = current.preset;
    if (satelliteSize) satelliteSize.value = String(current.size);
    if (satelliteOrbitRadius) satelliteOrbitRadius.value = String(Math.round(current.orbitRadius));
    if (satelliteOrbitSpeed) satelliteOrbitSpeed.value = String(Math.round(current.orbitSpeed * 100));
    if (satelliteTilt) satelliteTilt.value = String(Math.round(current.tilt || 0));
    if (satelliteSizeValue) satelliteSizeValue.textContent = formatSatelliteSizePercent(current.size);
    if (satelliteOrbitDistanceValue) satelliteOrbitDistanceValue.innerHTML = formatSatelliteDistanceLabel(current.orbitRadius);
    if (satelliteOrbitSpeedValue) satelliteOrbitSpeedValue.textContent = `${Math.round(current.orbitSpeed * 100)}%`;
    if (satelliteTiltValue) satelliteTiltValue.textContent = formatSatelliteTiltLabel(current.tilt || 0);
    updateMoonSizeHintState();
}

function applyMoonSizeToActiveSatellite(animate = true) {
    const current = satelliteItems[activeSatelliteIndex];
    if (!current) {
        return;
    }

    const moonDefaultSize = getDefaultMoonSize();
    if (animate) {
        stopMoonSizeTween();
        const startSize = clamp(Number(current.size) || moonDefaultSize, 22, 72);
        const targetSize = moonDefaultSize;
        if (Math.abs(startSize - targetSize) < 0.001) {
            applyMoonSizeToActiveSatellite(false);
            return;
        }

        const durationMs = 240;
        let startTs = 0;
        const tick = (timestamp) => {
            if (!startTs) {
                startTs = timestamp;
            }

            const t = clamp((timestamp - startTs) / durationMs, 0, 1);
            const eased = 1 - ((1 - t) ** 3);
            const tweenSize = startSize + ((targetSize - startSize) * eased);

            current.size = clamp(tweenSize, 22, 72);
            if (satelliteSize) {
                satelliteSize.value = String(current.size);
            }

            ensureSatelliteSpacing(activeSatelliteIndex);
            rebuildSatelliteVisuals();
            renderSatelliteTextures();
            updateSatelliteOrbitPositions(0);
            updateMoonSizeHintState();

            if (t < 1) {
                moonSizeTweenFrameId = window.requestAnimationFrame(tick);
                return;
            }

            moonSizeTweenFrameId = null;
            applyMoonSizeToActiveSatellite(false);
        };

        moonSizeTweenFrameId = window.requestAnimationFrame(tick);
        return;
    }

    current.size = moonDefaultSize;
    if (satelliteSize) {
        satelliteSize.value = String(moonDefaultSize);
    }

    ensureSatelliteSpacing(activeSatelliteIndex);
    rebuildSatelliteVisuals();
    renderSatelliteTextures();
    updateSatelliteOrbitPositions(0);
    syncSatelliteEditorFields();
}

function ensureSatelliteSpacing(startIndex = 1) {
    const beginIndex = Math.max(0, startIndex);
    if (beginIndex <= 0 && satelliteItems[0]) {
        const first = satelliteItems[0];
        const minOrbitForPlanet = Math.round(getMinSatelliteOrbitForPlanet(first));
        if (first.orbitRadius < minOrbitForPlanet) {
            first.orbitRadius = Math.min(SATELLITE_ORBIT_RADIUS_MAX, minOrbitForPlanet);
        }
    }

    for (let index = Math.max(1, beginIndex); index < satelliteItems.length; index += 1) {
        const previous = satelliteItems[index - 1];
        const current = satelliteItems[index];
        const minRadius = previous.orbitRadius + (previous.size * 0.5) + (current.size * 0.5) + 18;
        if (current.orbitRadius < minRadius) {
            current.orbitRadius = Math.min(SATELLITE_ORBIT_RADIUS_MAX, Math.round(minRadius));
        }
    }
}

function rebuildSatelliteVisuals() {
    if (!satelliteOrbitLayer) {
        return;
    }

    satelliteOrbitLayer.innerHTML = '';
    satelliteVisuals = satelliteItems.map((satellite) => {
        const orbitTrack = document.createElement('div');
        orbitTrack.className = 'satellite-orbit-track';
        orbitTrack.style.setProperty('--orbit-radius', `${satellite.orbitRadius}px`);

        const cube = document.createElement('div');
        cube.className = 'satellite-cube';
        cube.style.setProperty('--sat-size', `${satellite.size}px`);

        const faceCanvases = {};
        ['front', 'back', 'left', 'right', 'top', 'bottom'].forEach((face) => {
            const faceCanvas = document.createElement('canvas');
            faceCanvas.className = `satellite-face face-${face}`;
            faceCanvas.width = 32;
            faceCanvas.height = 32;
            cube.appendChild(faceCanvas);
            faceCanvases[face] = faceCanvas;
        });

        satelliteOrbitLayer.appendChild(orbitTrack);
        satelliteOrbitLayer.appendChild(cube);

        return {
            orbitTrack,
            cube,
            faceCanvases
        };
    });
}

function renderSatelliteTextures() {
    satelliteItems.forEach((satellite, index) => {
        const visual = satelliteVisuals[index];
        if (!visual) {
            return;
        }

        visual.orbitTrack.style.setProperty('--orbit-radius', `${satellite.orbitRadius}px`);
        visual.cube.style.setProperty('--sat-size', `${satellite.size}px`);

        const options = getSatellitePresetOptions(satellite);
        const generated = generateCubeFaceTextures(satellite.seed, options);

        Object.entries(visual.faceCanvases).forEach(([faceName, targetCanvas]) => {
            const source = generated.faces[faceName];
            if (!source) {
                return;
            }

            targetCanvas.width = options.size;
            targetCanvas.height = options.size;
            const targetCtx = targetCanvas.getContext('2d', { willReadFrequently: true });
            if (!targetCtx) {
                return;
            }

            targetCtx.imageSmoothingEnabled = false;
            targetCtx.clearRect(0, 0, options.size, options.size);
            targetCtx.drawImage(source, 0, 0, options.size, options.size);
        });

        if (satelliteTabs) {
            const button = satelliteTabs.querySelector(`[data-satellite-index="${index}"]`);
            const previewUrl = getSatelliteTabPreviewDataUrl(index);
            if (button && previewUrl) {
                button.style.backgroundImage = `url(${previewUrl})`;
            }
        }
    });
}

function updateSatelliteOrbitPositions(deltaSec = 0) {
    satelliteItems.forEach((satellite, index) => {
        const visual = satelliteVisuals[index];
        if (!visual) {
            return;
        }

        satellite.phase += satellite.orbitSpeed * deltaSec;
        satellite.spin += deltaSec * 0.9;
        const orbitX = Math.cos(satellite.phase) * satellite.orbitRadius;
        const orbitY = Math.sin(satellite.phase) * satellite.orbitRadius;
        const spinDeg = satellite.spin * 57.2958;
        const tiltDeg = Number.isFinite(Number(satellite.tilt)) ? Number(satellite.tilt) : 0;

        visual.cube.style.transform = `translate3d(calc(-50% + ${orbitX.toFixed(2)}px), calc(-50% + ${orbitY.toFixed(2)}px), 0) rotateZ(${tiltDeg.toFixed(2)}deg) rotateY(${spinDeg.toFixed(2)}deg)`;
    });
}

function startSatelliteAnimation() {
    if (satelliteAnimationId !== null) {
        return;
    }

    satelliteLastFrameTs = 0;
    const tick = (timestamp) => {
        if (satelliteAnimationId === null) {
            return;
        }

        const deltaSec = satelliteLastFrameTs ? Math.min(0.05, (timestamp - satelliteLastFrameTs) / 1000) : (1 / 60);
        satelliteLastFrameTs = timestamp;
        updateSatelliteOrbitPositions(deltaSec);
        satelliteAnimationId = window.requestAnimationFrame(tick);
    };

    satelliteAnimationId = window.requestAnimationFrame(tick);
}

function stopSatelliteAnimation() {
    if (satelliteAnimationId !== null) {
        window.cancelAnimationFrame(satelliteAnimationId);
        satelliteAnimationId = null;
    }
    satelliteLastFrameTs = 0;
}

function setActiveSatellite(index) {
    activeSatelliteIndex = clamp(index, 0, Math.max(0, satelliteItems.length - 1));
    renderSatelliteTabs();
    syncSatelliteEditorFields();
    updateSatelliteDeleteButtonState();
}

function refreshSatelliteScene() {
    ensureSatelliteSpacing(0);
    rebuildSatelliteVisuals();
    renderSatelliteTextures();
    updateSatelliteOrbitPositions(0);
    renderSatelliteTabs();
    syncSatelliteEditorFields();
    updateSatelliteDeleteButtonState();
}

function loadSatellites(sourceSatellites) {
    satelliteItems = normalizeSatellites(sourceSatellites);
    activeSatelliteIndex = clamp(activeSatelliteIndex, 0, Math.max(0, satelliteItems.length - 1));
    refreshSatelliteScene();
}

function addSatellite() {
    if (satelliteItems.length >= MAX_SATELLITES) {
        return;
    }

    const nextIndex = satelliteItems.length;
    const previous = satelliteItems[nextIndex - 1] || createDefaultSatellite(0);
    const created = nextIndex === 0 ? createDefaultSatellite(0) : createRandomizedSatellite(nextIndex);
    created.orbitRadius = Math.min(SATELLITE_ORBIT_RADIUS_MAX, Math.round(previous.orbitRadius + (previous.size * 0.5) + (created.size * 0.5) + 24));
    created.phase = previous.phase + (0.65 + (Math.random() * 1.1));
    satelliteItems.push(created);
    forceSatellitePreviewFitOnAdd();
    setActiveSatellite(nextIndex);
    refreshSatelliteScene();
}

function randomizeActiveSatellite() {
    const current = satelliteItems[activeSatelliteIndex];
    if (!current) {
        return;
    }

    current.seed = randomSatelliteSeed();
    const presets = Object.keys(SATELLITE_PRESETS);
    current.preset = presets[Math.floor(Math.random() * presets.length)] || 'moon';
    current.size = Math.round(24 + (Math.random() * 42));
    current.orbitSpeed = Number((0.08 + (Math.random() * 0.72)).toFixed(3));
    current.orbitRadius = clamp(Math.round(100 + (Math.random() * 140)), SATELLITE_ORBIT_RADIUS_MIN, SATELLITE_ORBIT_RADIUS_MAX);
    current.tilt = Math.round(Math.random() * 180);
    ensureSatelliteSpacing(activeSatelliteIndex);
    refreshSatelliteScene();
    setActiveSatellite(activeSatelliteIndex);
}

function closeSatelliteDeleteConfirm() {
    satelliteDeleteConfirmTarget = null;
    if (!satelliteDeleteConfirm) {
        return;
    }

    satelliteDeleteConfirm.classList.add('hidden');
    satelliteDeleteConfirm.setAttribute('aria-hidden', 'true');
}

function openSatelliteDeleteConfirm() {
    if (!satelliteDeleteConfirm || satelliteItems.length <= 1) {
        return;
    }

    const current = satelliteItems[activeSatelliteIndex];
    if (!current) {
        return;
    }

    satelliteDeleteConfirmTarget = activeSatelliteIndex;
    if (satelliteDeleteConfirmText) {
        satelliteDeleteConfirmText.textContent = `Вы точно хотите удалить ${current.name}?`;
    }
    satelliteDeleteConfirm.classList.remove('hidden');
    satelliteDeleteConfirm.setAttribute('aria-hidden', 'false');
    playSatelliteDeletePromptSound();
}

function confirmSatelliteDelete() {
    if (!Number.isInteger(satelliteDeleteConfirmTarget)) {
        closeSatelliteDeleteConfirm();
        return;
    }

    if (satelliteItems.length <= 1) {
        closeSatelliteDeleteConfirm();
        return;
    }

    const indexToDelete = clamp(satelliteDeleteConfirmTarget, 0, satelliteItems.length - 1);
    satelliteItems.splice(indexToDelete, 1);
    satelliteItems = normalizeSatellites(satelliteItems);
    activeSatelliteIndex = clamp(indexToDelete, 0, satelliteItems.length - 1);
    refreshSatelliteScene();
    setActiveSatellite(activeSatelliteIndex);
    closeSatelliteDeleteConfirm();
}

function fillSelect(select, values) {
    select.innerHTML = values
        .map((value) => `<option value="${value}">${value}</option>`)
        .join('');
}

function formatDate(isoDate) {
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) {
        return '—';
    }

    return date.toLocaleDateString('ru-RU');
}

function renderServers() {
    const servers = State.getServers();
    grid.innerHTML = '';

    if (servers.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');

    servers.forEach((server) => {
        const card = document.createElement('article');
        card.className = 'server-card';
        card.innerHTML = `
            <div class="server-card-preview-wrap">
                <img class="server-card-preview" src="${server.planetPreview}" alt="Планета ${server.name}">
            </div>
            <h3 class="server-card-title">${server.name}</h3>
            <p class="server-card-meta">${server.version} • ${server.core}</p>
            <p class="server-card-date">${formatDate(server.createdAt)}</p>
            <div class="server-card-actions">
                <button class="server-edit-btn" data-edit-id="${server.id}" aria-label="Редактировать сервер ${server.name}">Редактировать</button>
                ${server.questionnaireUrl
                    ? `<a class="server-questionnaire-link" href="${server.questionnaireUrl}" target="_blank" rel="noopener noreferrer">Открыть анкету</a>`
                    : `<button class="server-questionnaire-btn" data-questionnaire-id="${server.id}" aria-label="Добавить анкету для сервера ${server.name}">Пройти анкету</button>`}
                <button class="server-delete-btn" data-delete-id="${server.id}" aria-label="Удалить сервер ${server.name}">Удалить</button>
            </div>
        `;

        grid.appendChild(card);
    });
}

function resetServerForm() {
    serverForm.reset();
    editingServerId = null;
    createServerTitle.textContent = 'Создание сервера';
    saveServerBtn.textContent = 'Создать';
    closeSatelliteDeleteConfirm();
    const generated = planetEditor.exportPlanet();
    selectedPlanetPreview = generated.preview;
    selectedPlanetData = generated.params;
    loadSatellites(null);
    planetPreview.src = selectedPlanetPreview;
}

function openCreateServerModal() {
    editingServerId = null;
    createServerTitle.textContent = 'Создание сервера';
    saveServerBtn.textContent = 'Создать';
    serverModalControls.open();
}

function openEditServerModal(id, focusQuestionnaire = false) {
    const server = State.getServerById(id);
    if (!server) {
        return;
    }

    editingServerId = id;
    createServerTitle.textContent = 'Редактирование сервера';
    saveServerBtn.textContent = 'Сохранить';

    serverForm.elements.name.value = server.name || '';
    serverForm.elements.description.value = server.description || '';
    serverForm.elements.version.value = server.version || versions[0];
    serverForm.elements.core.value = server.core || cores[0];
    serverForm.elements.questionnaireUrl.value = server.questionnaireUrl || '';

    selectedPlanetPreview = server.planetPreview || selectedPlanetPreview;
    selectedPlanetData = server.planetData || null;
    loadSatellites(server?.planetData?.satellites);
    setAxisTilt(server?.planetData?.axisTiltDeg, true);
    planetPreview.src = selectedPlanetPreview;

    serverModalControls.open();

    if (focusQuestionnaire) {
        setTimeout(() => {
            serverForm.elements.questionnaireUrl.focus();
        }, 0);
    }
}

const serverModalControls = setupModal({
    modal: serverModal,
    closeButton: closeServerModal,
    onClose: resetServerForm
});

closeServerModalSecondary.addEventListener('click', () => {
    serverModalControls.close();
});

const planetModalControls = setupModal({
    modal: planetModal,
    closeButton: closePlanetModal,
    onOpen: () => {
        closeSatelliteDeleteConfirm();
        randomizePlanetPreviewSky();
        applyPreviewDetailLevel(PLANET_PREVIEW_DETAIL_DEFAULT);
        setAxisTilt(selectedPlanetData?.axisTiltDeg, true);
        loadSatellites(selectedPlanetData?.satellites);
        planetEditor.setPreviewLightDirection(PLANET_LIGHT_DEFAULT);
        setLightHandleFromDirection(PLANET_LIGHT_DEFAULT);
        planetEditor.startAnimation();
        startSatelliteAnimation();
    },
    onClose: () => {
        closeSatelliteDeleteConfirm();
        planetEditor.stopAnimation();
        stopSatelliteAnimation();
    }
});

// Открытие настроек по Tab даже когда открыт редактор планеты
document.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') {
        return;
    }

    if (!planetModal || planetModal.classList.contains('hidden')) {
        return;
    }

    const settingsModal = document.getElementById('settings-modal');
    if (settingsModal && !settingsModal.classList.contains('hidden')) {
        return;
    }

    event.preventDefault();

    if (typeof window.__smpOpenSettingsModal === 'function') {
        window.__smpOpenSettingsModal();
    }
});

const planetEditor = createPlanetEditor({
    canvas: planetEditorCanvas,
    fields: {
        seed: planetSeed,
        palette: planetPalette,
        oceanColor1: planetOceanColor1,
        oceanColor2: planetOceanColor2,
        oceanColor3: planetOceanColor3,
        landColor1: planetLandColor1,
        landColor2: planetLandColor2,
        landColor3: planetLandColor3,
        scale: planetScale,
        seaLevel: planetSeaLevel,
        cloudDensity: planetCloudDensity,
        atmosphere: planetAtmosphere,
        atmosphereSize: planetAtmosphereSize,
        ringType: planetRingType
    }
});

const initialPlanet = planetEditor.exportPlanet();
selectedPlanetPreview = initialPlanet.preview;
selectedPlanetData = initialPlanet.params;

addServerBtn.addEventListener('click', openCreateServerModal);

emptyCreateBtn.addEventListener('click', openCreateServerModal);

pickPlanetBtn.addEventListener('click', () => {
    planetEditor.setParams(selectedPlanetData || null);
    loadSatellites(selectedPlanetData?.satellites);
    planetModalControls.open();
});

randomPlanetBtn.addEventListener('click', () => {
    planetEditor.randomize();
    renderSatelliteTextures();
});

if (planetPreviewZoomIn) {
    planetPreviewZoomIn.addEventListener('click', () => {
        zoomPlanetPreview(PLANET_PREVIEW_ZOOM_STEP);
    });
}

if (planetPreviewZoomOut) {
    planetPreviewZoomOut.addEventListener('click', () => {
        zoomPlanetPreview(-PLANET_PREVIEW_ZOOM_STEP);
    });
}

if (planetEditorPreviewWrap) {
    planetEditorPreviewWrap.addEventListener('wheel', (event) => {
        event.preventDefault();
        if (event.deltaY < 0) {
            zoomPlanetPreview(PLANET_PREVIEW_ZOOM_STEP);
            return;
        }

        zoomPlanetPreview(-PLANET_PREVIEW_ZOOM_STEP);
    }, { passive: false });
}

if (planetPreviewDetailControls) {
    planetPreviewDetailControls.addEventListener('click', (event) => {
        const button = event.target.closest('[data-preview-detail-level]');
        if (!button) {
            return;
        }

        applyPreviewDetailLevel(button.getAttribute('data-preview-detail-level'));
        renderSatelliteTextures();
    });
}

applyPlanetBtn.addEventListener('click', () => {
    const generated = planetEditor.exportPlanet();
    selectedPlanetPreview = generated.preview;
    selectedPlanetData = {
        ...generated.params,
        axisTiltDeg: planetAxisTiltDeg,
        satellites: serializeSatellites()
    };
    planetPreview.src = selectedPlanetPreview;
    planetModalControls.close();
});

if (planetAxisTiltInput) {
    planetAxisTiltInput.addEventListener('input', (event) => {
        setAxisTilt(event.target.value, false);
        if (planetAxisTiltSlider) {
            planetAxisTiltSlider.value = String(normalizeTiltValue(event.target.value, PLANET_AXIS_TILT_DEFAULT));
        }
    });

    planetAxisTiltInput.addEventListener('change', (event) => {
        setAxisTilt(event.target.value, true);
    });
}

if (planetAxisTiltSlider) {
    planetAxisTiltSlider.addEventListener('input', (event) => {
        setAxisTilt(event.target.value, false);
        if (planetAxisTiltInput) {
            planetAxisTiltInput.value = Number(event.target.value).toFixed(2);
        }
    });

    planetAxisTiltSlider.addEventListener('change', (event) => {
        setAxisTilt(event.target.value, true);
    });
}

grid.addEventListener('click', (event) => {
    const editButton = event.target.closest('[data-edit-id]');
    if (editButton) {
        openEditServerModal(editButton.getAttribute('data-edit-id'));
        return;
    }

    const questionnaireButton = event.target.closest('[data-questionnaire-id]');
    if (questionnaireButton) {
        openEditServerModal(questionnaireButton.getAttribute('data-questionnaire-id'), true);
        return;
    }

    const button = event.target.closest('[data-delete-id]');
    if (!button) {
        return;
    }

    const id = button.getAttribute('data-delete-id');
    State.deleteServer(id);
    renderServers();
});

serverForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const formData = new FormData(serverForm);
    const payload = {
        name: String(formData.get('name') || '').trim(),
        description: String(formData.get('description') || '').trim(),
        version: String(formData.get('version') || '').trim(),
        core: String(formData.get('core') || '').trim(),
        questionnaireUrl: String(formData.get('questionnaireUrl') || '').trim(),
        status: 'active',
        planetPreview: selectedPlanetPreview,
        planetData: selectedPlanetData
    };

    if (!payload.name) {
        return;
    }

    if (editingServerId) {
        State.updateServer(editingServerId, payload);
    } else {
        State.saveServer(payload);
    }

    serverModalControls.close();
    renderServers();
});

fillSelect(versionSelect, versions);
fillSelect(coreSelect, cores);
randomizePlanetPreviewSky();
applyPlanetPreviewScale();
setPreviewDetailButtonsState(PLANET_PREVIEW_DETAIL_DEFAULT);
setAxisTilt(PLANET_AXIS_TILT_DEFAULT);
initLightControl();
loadSatellites(selectedPlanetData?.satellites);

if (satelliteTabs) {
    satelliteTabs.addEventListener('click', (event) => {
        const button = event.target.closest('[data-satellite-index]');
        if (!button) {
            return;
        }

        setActiveSatellite(Number(button.getAttribute('data-satellite-index')));
    });
}

if (addSatelliteBtn) {
    addSatelliteBtn.addEventListener('click', () => {
        addSatellite();
    });
}

if (satelliteNameInput) {
    satelliteNameInput.addEventListener('input', (event) => {
        const current = satelliteItems[activeSatelliteIndex];
        if (!current) {
            return;
        }

        current.name = String(event.target.value || '').trim().slice(0, 30) || `спутник ${activeSatelliteIndex + 1}`;
        renderSatelliteTabs();
    });
}

if (satelliteSeed) {
    satelliteSeed.addEventListener('change', (event) => {
        const current = satelliteItems[activeSatelliteIndex];
        if (!current) {
            return;
        }

        current.seed = clamp(Number(event.target.value) || current.seed, 1, 999999);
        event.target.value = String(current.seed);
        renderSatelliteTextures();
    });
}

if (satellitePreset) {
    satellitePreset.addEventListener('change', (event) => {
        const current = satelliteItems[activeSatelliteIndex];
        if (!current) {
            return;
        }

        current.preset = SATELLITE_PRESETS[event.target.value] ? event.target.value : 'moon';
        renderSatelliteTextures();
    });
}

if (satelliteSize) {
    satelliteSize.addEventListener('input', (event) => {
        stopMoonSizeTween();
        const current = satelliteItems[activeSatelliteIndex];
        if (!current) {
            return;
        }

        let nextSize = clamp(Number(event.target.value) || current.size, 22, 72);
        if (activeSatelliteIndex === 0) {
            const moonDefaultSize = getDefaultMoonSize();
            if (Math.abs(nextSize - moonDefaultSize) <= SATELLITE_SIZE_SNAP_THRESHOLD) {
                nextSize = moonDefaultSize;
                event.target.value = String(moonDefaultSize);
            }
        }

        current.size = nextSize;
        ensureSatelliteSpacing(activeSatelliteIndex);
        rebuildSatelliteVisuals();
        renderSatelliteTextures();
        updateSatelliteOrbitPositions(0);
        syncSatelliteEditorFields();
    });
}

if (satelliteMoonSizeHint) {
    satelliteMoonSizeHint.addEventListener('click', () => {
        applyMoonSizeToActiveSatellite();
    });
}

if (satelliteOrbitRadius) {
    satelliteOrbitRadius.addEventListener('input', (event) => {
        const current = satelliteItems[activeSatelliteIndex];
        if (!current) {
            return;
        }

        current.orbitRadius = clamp(Number(event.target.value) || current.orbitRadius, SATELLITE_ORBIT_RADIUS_MIN, SATELLITE_ORBIT_RADIUS_MAX);
        ensureSatelliteSpacing(activeSatelliteIndex);
        rebuildSatelliteVisuals();
        renderSatelliteTextures();
        updateSatelliteOrbitPositions(0);
        syncSatelliteEditorFields();
    });
}

if (satelliteOrbitSpeed) {
    satelliteOrbitSpeed.addEventListener('input', (event) => {
        const current = satelliteItems[activeSatelliteIndex];
        if (!current) {
            return;
        }

        current.orbitSpeed = clamp((Number(event.target.value) || 26) / 100, 0.05, 1.2);
        if (satelliteOrbitSpeedValue) {
            satelliteOrbitSpeedValue.textContent = `${Math.round(current.orbitSpeed * 100)}%`;
        }
    });
}

if (satelliteTilt) {
    satelliteTilt.addEventListener('input', (event) => {
        const current = satelliteItems[activeSatelliteIndex];
        if (!current) {
            return;
        }

        current.tilt = clamp(Number(event.target.value) || 0, 0, 180);
        updateSatelliteOrbitPositions(0);
        syncSatelliteEditorFields();
    });
}

if (randomSatelliteBtn) {
    randomSatelliteBtn.addEventListener('click', () => {
        randomizeActiveSatellite();
    });
}

if (deleteSatelliteBtn) {
    deleteSatelliteBtn.addEventListener('click', () => {
        openSatelliteDeleteConfirm();
    });
}

if (satelliteDeleteConfirmNo) {
    satelliteDeleteConfirmNo.addEventListener('click', () => {
        playSatelliteDeleteConfirmNoSound();
        closeSatelliteDeleteConfirm();
    });
}

if (satelliteDeleteConfirmYes) {
    satelliteDeleteConfirmYes.addEventListener('click', () => {
        playSatelliteDeleteConfirmYesSound();
        confirmSatelliteDelete();
    });
}

if (satelliteDeleteConfirm) {
    satelliteDeleteConfirm.addEventListener('click', (event) => {
        if (event.target === satelliteDeleteConfirm) {
            closeSatelliteDeleteConfirm();
        }
    });
}

planetPreview.src = selectedPlanetPreview;
renderServers();
