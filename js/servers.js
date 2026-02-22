import { State } from './state.js';
import { setupModal } from './modal.js';
import { createPlanetEditor } from './planet-editor.js';

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
const planetRingType = document.getElementById('planetRingType');

let selectedPlanetPreview = '';
let selectedPlanetData = null;
let editingServerId = null;

const PLANET_PREVIEW_ZOOM_MIN = 60;
const PLANET_PREVIEW_ZOOM_MAX = 220;
const PLANET_PREVIEW_ZOOM_STEP = 10;
const PLANET_PREVIEW_DETAIL_DEFAULT = 2;
const PLANET_LIGHT_DEFAULT = { x: -0.38, y: 0.74, z: 0.56 };
const PLANET_AXIS_TILT_DEFAULT = 23.44;
const PLANET_AXIS_TILT_MIN = 0;
const PLANET_AXIS_TILT_MAX = 90;
let planetPreviewScale = 100;
let lightControlDragging = false;
let planetAxisTiltDeg = PLANET_AXIS_TILT_DEFAULT;

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
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
}

function zoomPlanetPreview(stepDelta) {
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
    const generated = planetEditor.exportPlanet();
    selectedPlanetPreview = generated.preview;
    selectedPlanetData = generated.params;
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
        randomizePlanetPreviewSky();
        applyPreviewDetailLevel(PLANET_PREVIEW_DETAIL_DEFAULT);
        setAxisTilt(selectedPlanetData?.axisTiltDeg, true);
        planetEditor.setPreviewLightDirection(PLANET_LIGHT_DEFAULT);
        setLightHandleFromDirection(PLANET_LIGHT_DEFAULT);
        planetEditor.startAnimation();
    },
    onClose: () => {
        planetEditor.stopAnimation();
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
    planetModalControls.open();
});

randomPlanetBtn.addEventListener('click', () => {
    planetEditor.randomize();
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
    });
}

applyPlanetBtn.addEventListener('click', () => {
    const generated = planetEditor.exportPlanet();
    selectedPlanetPreview = generated.preview;
    selectedPlanetData = {
        ...generated.params,
        axisTiltDeg: planetAxisTiltDeg
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
planetPreview.src = selectedPlanetPreview;
renderServers();
