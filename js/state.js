const STORAGE_KEYS = {
    servers: 'smp.multiverse.servers',
    profile: 'smp.multiverse.profile',
    auth: 'smp.multiverse.auth'
};

const defaultProfile = {
    name: 'Космоходец',
    email: 'user@multiverse.local',
    bio: 'Исследователь мультивселенной SMP.',
    discord: '',
    twitch: '',
    website: '',
    registeredAt: new Date().toISOString()
};

function readJson(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch {
        return fallback;
    }
}

function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function createId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
        return window.crypto.randomUUID();
    }

    return `srv-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
}

function generateRandomCoords() {
    const lat = Number(randomInRange(-80, 80).toFixed(4));
    const lng = Number(randomInRange(-170, 170).toFixed(4));
    return [lat, lng];
}

export const State = {
    getServers() {
        const value = readJson(STORAGE_KEYS.servers, []);
        return Array.isArray(value) ? value : [];
    },

    saveServer(serverPayload) {
        const servers = this.getServers();
        const server = {
            id: createId(),
            name: serverPayload.name || 'Без названия',
            ip: serverPayload.ip || '',
            description: serverPayload.description || '',
            version: serverPayload.version || '1.21',
            core: serverPayload.core || 'Paper',
            questionnaireUrl: serverPayload.questionnaireUrl || '',
            status: serverPayload.status || 'draft',
            planetPreview: serverPayload.planetPreview || 'assets/icons/aliens.png',
            planetData: serverPayload.planetData || null,
            coords: Array.isArray(serverPayload.coords) && serverPayload.coords.length === 2
                ? serverPayload.coords
                : generateRandomCoords(),
            players: Number(serverPayload.players) || 0,
            maxPlayers: Number(serverPayload.maxPlayers) || 100,
            createdAt: new Date().toISOString()
        };

        servers.push(server);
        writeJson(STORAGE_KEYS.servers, servers);
        return server;
    },

    getServerById(id) {
        return this.getServers().find((server) => server.id === id) || null;
    },

    updateServer(id, updates) {
        const servers = this.getServers();
        const index = servers.findIndex((server) => server.id === id);
        if (index < 0) {
            return null;
        }

        const current = servers[index];
        const next = {
            ...current,
            ...updates,
            id: current.id,
            createdAt: current.createdAt,
            coords: Array.isArray(updates.coords) && updates.coords.length === 2
                ? updates.coords
                : current.coords
        };

        servers[index] = next;
        writeJson(STORAGE_KEYS.servers, servers);
        return next;
    },

    deleteServer(id) {
        const next = this.getServers().filter((server) => server.id !== id);
        writeJson(STORAGE_KEYS.servers, next);
    },

    getProfile() {
        const profile = readJson(STORAGE_KEYS.profile, defaultProfile);
        return { ...defaultProfile, ...profile };
    },

    saveProfile(profileData) {
        const current = this.getProfile();
        const next = { ...current, ...profileData };
        writeJson(STORAGE_KEYS.profile, next);
        return next;
    },

    getStats() {
        const servers = this.getServers();
        return {
            serversCount: servers.length,
            planetsCount: servers.filter((item) => !!item.planetPreview).length,
            completedQuestionnaires: servers.filter((item) => Boolean(item.questionnaireUrl)).length
        };
    },

    getAuthFlag() {
        return localStorage.getItem(STORAGE_KEYS.auth) === 'true';
    },

    setAuthFlag(value) {
        localStorage.setItem(STORAGE_KEYS.auth, String(Boolean(value)));
    }
};
