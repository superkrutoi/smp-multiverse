import { setupModal } from './modal.js';

export function setupPlanetGenerator({
    modal,
    closeButton,
    iframe,
    onPlanetSelected
}) {
    const controls = setupModal({ modal, closeButton });

    function handlePlanetMessage(event) {
        const { data } = event;
        if (!data || typeof data !== 'object') {
            return;
        }

        if (data.type !== 'planetGenerated' && data.type !== 'planetExport') {
            return;
        }

        const preview = data.image || data.preview || '';
        const params = data.params || data.planetData || null;

        if (preview && typeof onPlanetSelected === 'function') {
            onPlanetSelected({ preview, params });
        }

        controls.close();
    }

    window.addEventListener('message', handlePlanetMessage);

    function openGenerator() {
        if (!iframe.getAttribute('src')) {
            iframe.setAttribute('src', 'assets/planet_web/PixelPlanets.html');
        }
        controls.open();
    }

    return {
        openGenerator,
        closeGenerator: controls.close
    };
}
