import { State } from './state.js';
import { setupModal } from './modal.js';
import { setupPlanetGenerator } from './planet-generator-wrapper.js';

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
const planetFrame = document.getElementById('planetFrame');

let selectedPlanetPreview = 'assets/planet_web/PixelPlanets.icon.png';
let selectedPlanetData = null;
let editingServerId = null;

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
    selectedPlanetPreview = 'assets/planet_web/PixelPlanets.icon.png';
    selectedPlanetData = null;
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

    selectedPlanetPreview = server.planetPreview || 'assets/planet_web/PixelPlanets.icon.png';
    selectedPlanetData = server.planetData || null;
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

const planetGenerator = setupPlanetGenerator({
    modal: planetModal,
    closeButton: closePlanetModal,
    iframe: planetFrame,
    onPlanetSelected: ({ preview, params }) => {
        selectedPlanetPreview = preview;
        selectedPlanetData = params;
        planetPreview.src = preview;
    }
});

addServerBtn.addEventListener('click', openCreateServerModal);

emptyCreateBtn.addEventListener('click', openCreateServerModal);

pickPlanetBtn.addEventListener('click', () => {
    planetGenerator.openGenerator();
});

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
planetPreview.src = selectedPlanetPreview;
renderServers();
