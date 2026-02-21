import { renderPlanetAtlas, normalizePlanetParams } from './planet/renderer-atlas.js';

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function randomSeed() {
    return Math.floor(Math.random() * 999999) + 1;
}

export function createPlanetEditor({
    canvas,
    fields
}) {
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    let params = normalizePlanetParams({
        seed: randomSeed(),
        palette: 'earth',
        terrain: 'mixed',
        clouds: 45,
        atmosphere: 60,
        ringType: 'none'
    });

    let rotation = 0;
    let cloudRotation = 0;
    let animationFrameId = null;
    let previousTimestamp = 0;
    let lastMeta = null;

    function renderNow() {
        lastMeta = renderPlanetAtlas(canvas, {
            ...params,
            rotation,
            cloudRotation
        });
    }

    function drawPlanet() {
        renderNow();
    }

    function syncFieldsFromParams() {
        fields.seed.value = String(params.seed);
        if (fields.palette) {
            fields.palette.value = String(params.palette);
        }
        if (fields.terrain) {
            fields.terrain.value = String(params.terrain);
        }
        fields.clouds.value = String(params.clouds);
        fields.atmosphere.value = String(params.atmosphere);
        fields.ringType.value = String(params.ringType);
    }

    function syncParamsFromFields() {
        params.seed = clamp(Number(fields.seed.value) || 1, 1, 999999);
        if (fields.palette) {
            params.palette = fields.palette.value || 'earth';
        }
        if (fields.terrain) {
            params.terrain = fields.terrain.value || 'mixed';
        }
        params.clouds = clamp(Number(fields.clouds.value) || 0, 0, 100);
        params.atmosphere = clamp(Number(fields.atmosphere.value) || 0, 0, 100);
        params.ringType = fields.ringType.value || 'none';
    }

    function setParams(nextParams) {
        params = normalizePlanetParams({ ...params, ...(nextParams || {}) });

        if (Number.isFinite(Number(nextParams?.rotation))) {
            rotation = Number(nextParams.rotation);
        }

        if (Number.isFinite(Number(nextParams?.cloudRotation))) {
            cloudRotation = Number(nextParams.cloudRotation);
        }

        syncFieldsFromParams();
        drawPlanet();
    }

    function randomize() {
        params.seed = randomSeed();
        const paletteKeys = ['earth', 'lava', 'ice', 'toxic'];
        params.palette = paletteKeys[Math.floor(Math.random() * paletteKeys.length)];
        const terrains = ['smooth', 'mixed', 'rough', 'cracked'];
        params.terrain = terrains[Math.floor(Math.random() * terrains.length)];
        params.clouds = Math.floor(Math.random() * 101);
        params.atmosphere = Math.floor(Math.random() * 101);
        params.ringType = Math.random() > 0.6 ? (Math.random() > 0.5 ? 'thin' : 'wide') : 'none';
        rotation = 0;
        cloudRotation = 0;

        syncFieldsFromParams();
        drawPlanet();
    }

    function exportPlanet() {
        drawPlanet();
        return {
            preview: canvas.toDataURL('image/png'),
            params: {
                ...params,
                ...(lastMeta || {}),
                rotation,
                cloudRotation
            }
        };
    }

    function tick(timestamp) {
        if (!previousTimestamp) {
            previousTimestamp = timestamp;
        }

        const dt = Math.min((timestamp - previousTimestamp) / 1000, 0.05);
        previousTimestamp = timestamp;
        rotation = (rotation + (dt * 0.22)) % (Math.PI * 2);
        cloudRotation = (cloudRotation + (dt * 0.08)) % (Math.PI * 2);
        renderNow();

        animationFrameId = window.requestAnimationFrame(tick);
    }

    function startAnimation() {
        if (animationFrameId) {
            return;
        }

        previousTimestamp = 0;
        animationFrameId = window.requestAnimationFrame(tick);
    }

    function stopAnimation() {
        if (!animationFrameId) {
            return;
        }

        window.cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
        previousTimestamp = 0;
    }

    const controls = [
        fields.seed,
        fields.palette,
        fields.terrain,
        fields.clouds,
        fields.atmosphere,
        fields.ringType
    ].filter(Boolean);

    controls.forEach((field) => {
        field.addEventListener('input', () => {
            syncParamsFromFields();
            drawPlanet();
        });
    });

    syncFieldsFromParams();
    drawPlanet();

    return {
        setParams,
        randomize,
        exportPlanet,
        startAnimation,
        stopAnimation,
        getParams() {
            return {
                ...params,
                rotation,
                cloudRotation
            };
        }
    };
}
