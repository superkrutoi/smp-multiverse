import { State } from './state.js';

const profileForm = document.getElementById('profileForm');
const serversCountEl = document.getElementById('serversCount');
const planetsCountEl = document.getElementById('planetsCount');
const questionnaireCountEl = document.getElementById('questionnaireCount');
const registeredAtEl = document.getElementById('registeredAt');

function fillProfile() {
    const profile = State.getProfile();
    const stats = State.getStats();

    profileForm.elements.name.value = profile.name || '';
    profileForm.elements.email.value = profile.email || '';
    profileForm.elements.bio.value = profile.bio || '';
    profileForm.elements.discord.value = profile.discord || '';
    profileForm.elements.twitch.value = profile.twitch || '';
    profileForm.elements.website.value = profile.website || '';

    serversCountEl.textContent = String(stats.serversCount);
    planetsCountEl.textContent = String(stats.planetsCount);
    questionnaireCountEl.textContent = `${stats.completedQuestionnaires}/${stats.serversCount}`;

    const date = new Date(profile.registeredAt);
    registeredAtEl.textContent = Number.isNaN(date.getTime())
        ? '—'
        : date.toLocaleDateString('ru-RU');
}

profileForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const formData = new FormData(profileForm);
    State.saveProfile({
        name: String(formData.get('name') || '').trim(),
        email: String(formData.get('email') || '').trim(),
        bio: String(formData.get('bio') || '').trim(),
        discord: String(formData.get('discord') || '').trim(),
        twitch: String(formData.get('twitch') || '').trim(),
        website: String(formData.get('website') || '').trim()
    });

    fillProfile();
});

fillProfile();
