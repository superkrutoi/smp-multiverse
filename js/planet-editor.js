import { generatePlanetTexture } from './generation/planet-generator.js';

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function randomSeed() {
    return Math.floor(Math.random() * 999999) + 1;
}

function createBuffer(width, height) {
    if (typeof OffscreenCanvas !== 'undefined') {
        return new OffscreenCanvas(width, height);
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
}

function posterizeBuffer(ctx, width, height) {
    const image = ctx.getImageData(0, 0, width, height);
    const data = image.data;
    const step = 32;

    for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3];
        if (alpha < 140) {
            data[i + 3] = 0;
            continue;
        }

        data[i] = Math.round(data[i] / step) * step;
        data[i + 1] = Math.round(data[i + 1] / step) * step;
        data[i + 2] = Math.round(data[i + 2] / step) * step;
        data[i + 3] = 255;
    }

    ctx.putImageData(image, 0, 0);
}

function getOpaqueBounds(ctx, width, height) {
    const image = ctx.getImageData(0, 0, width, height);
    const data = image.data;

    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
            const alpha = data[((y * width) + x) * 4 + 3];
            if (alpha < 10) {
                continue;
            }

            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (x > maxX) maxX = x;
            if (y > maxY) maxY = y;
        }
    }

    if (maxX < minX || maxY < minY) {
        return {
            x: 0,
            y: 0,
            width,
            height
        };
    }

    return {
        x: minX,
        y: minY,
        width: (maxX - minX + 1),
        height: (maxY - minY + 1)
    };
}

function normalizePlanetParams(input = {}) {
    const fallbackScale = Number(input.scale);
    const fallbackSea = Number(input.seaLevel);
    const rawPalette = input.palette === 'toxic' ? 'dark' : input.palette;

    return {
        seed: clamp(Number(input.seed) || randomSeed(), 1, 999999),
        palette: ['earth', 'lava', 'ice', 'desert', 'dark'].includes(rawPalette)
            ? rawPalette
            : 'earth',
        scale: clamp(Number.isFinite(fallbackScale) ? fallbackScale : 2.2, 1.2, 3.4),
        octaves: clamp(Math.round(Number(input.octaves) || 5), 3, 7),
        persistence: clamp(Number(input.persistence) || 0.5, 0.3, 0.75),
        seaLevel: clamp(Number.isFinite(fallbackSea) ? fallbackSea : 0.5, 0.25, 0.8),
        cloudDensity: clamp(Number(input.cloudDensity) || 40, 0, 100),
        atmosphere: clamp(Number(input.atmosphere) || 60, 0, 100),
        ringType: input.ringType || 'none'
    };
}

export function createPlanetEditor({
    canvas,
    fields
}) {
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    const textureSize = 64;

    const buffer = createBuffer(textureSize, textureSize);
    const bufferCtx = buffer.getContext('2d');
    bufferCtx.imageSmoothingEnabled = false;

    let params = normalizePlanetParams({
        seed: randomSeed(),
        palette: 'earth',
        scale: 2.2,
        octaves: 5,
        seaLevel: 0.5,
        cloudDensity: 45,
        atmosphere: 60,
        ringType: 'none'
    });

    let animationFrameId = null;
    let lastMeta = null;
    let dirty = true;
    let spriteBounds = {
        x: 0,
        y: 0,
        width: textureSize,
        height: textureSize
    };

    function regenerateBase() {
        const generated = generatePlanetTexture(params.seed, {
            size: textureSize,
            type: params.palette,
            style: 'cube',
            scale: params.scale,
            octaves: params.octaves,
            persistence: params.persistence,
            seaLevel: params.seaLevel,
            hasClouds: params.cloudDensity > 12,
            ringType: params.ringType
        });

        bufferCtx.clearRect(0, 0, textureSize, textureSize);
        bufferCtx.drawImage(generated.canvas, 0, 0, textureSize, textureSize);
        posterizeBuffer(bufferCtx, textureSize, textureSize);
        spriteBounds = getOpaqueBounds(bufferCtx, textureSize, textureSize);

        lastMeta = {
            generator: 'cube-v1',
            style: 'cube',
            type: generated.type,
            ringType: params.ringType,
            hasClouds: params.cloudDensity > 12,
            seaLevel: params.seaLevel,
            scale: params.scale,
            octaves: params.octaves,
            persistence: params.persistence,
            cloudDensity: params.cloudDensity,
            atmosphere: params.atmosphere,
            textureSize,
            previewCanvasSize: canvas.width
        };
        dirty = false;
    }

    function renderNow() {
        if (dirty) {
            regenerateBase();
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const maxPreviewSize = Math.floor(Math.min(canvas.width, canvas.height) * 0.9);
        const sourceWidth = Math.max(1, spriteBounds.width);
        const sourceHeight = Math.max(1, spriteBounds.height);
        const fitScale = Math.min(maxPreviewSize / sourceWidth, maxPreviewSize / sourceHeight);
        const pixelScale = Math.max(1, Math.floor(fitScale));
        const drawWidth = Math.max(1, sourceWidth * pixelScale);
        const drawHeight = Math.max(1, sourceHeight * pixelScale);
        const drawX = Math.round((canvas.width - drawWidth) * 0.5);
        const drawY = Math.round((canvas.height - drawHeight) * 0.5);

        ctx.drawImage(
            buffer,
            spriteBounds.x,
            spriteBounds.y,
            sourceWidth,
            sourceHeight,
            drawX,
            drawY,
            drawWidth,
            drawHeight
        );
    }

    function drawPlanet() {
        renderNow();
    }

    function syncFieldsFromParams() {
        fields.seed.value = String(params.seed);
        if (fields.palette) {
            fields.palette.value = String(params.palette);
        }
        if (fields.scale) {
            fields.scale.value = String(Math.round(params.scale * 100));
        }
        if (fields.octaves) {
            fields.octaves.value = String(params.octaves);
        }
        if (fields.seaLevel) {
            fields.seaLevel.value = String(Math.round(params.seaLevel * 100));
        }
        if (fields.cloudDensity) {
            fields.cloudDensity.value = String(params.cloudDensity);
        }
        if (fields.atmosphere) {
            fields.atmosphere.value = String(params.atmosphere);
        }
        if (fields.ringType) {
            fields.ringType.value = String(params.ringType);
        }
    }

    function syncParamsFromFields() {
        params.seed = clamp(Number(fields.seed.value) || 1, 1, 999999);
        if (fields.palette) {
            params.palette = fields.palette.value || 'earth';
        }
        if (fields.scale) {
            params.scale = clamp((Number(fields.scale.value) || 220) / 100, 1.2, 3.4);
        }
        if (fields.octaves) {
            params.octaves = clamp(Math.round(Number(fields.octaves.value) || 5), 3, 7);
        }
        if (fields.seaLevel) {
            params.seaLevel = clamp((Number(fields.seaLevel.value) || 50) / 100, 0.25, 0.8);
        }
        if (fields.cloudDensity) {
            params.cloudDensity = clamp(Number(fields.cloudDensity.value) || 0, 0, 100);
        }
        if (fields.atmosphere) {
            params.atmosphere = clamp(Number(fields.atmosphere.value) || 0, 0, 100);
        }
        if (fields.ringType) {
            params.ringType = fields.ringType.value || 'none';
        }
        dirty = true;
    }

    function setParams(nextParams) {
        params = normalizePlanetParams({ ...params, ...(nextParams || {}) });
        dirty = true;

        syncFieldsFromParams();
        drawPlanet();
    }

    function randomize() {
        params.seed = randomSeed();
        const paletteKeys = ['earth', 'lava', 'ice', 'desert', 'dark'];
        params.palette = paletteKeys[Math.floor(Math.random() * paletteKeys.length)];
        params.scale = Number((1.4 + Math.random() * 1.8).toFixed(2));
        params.octaves = 3 + Math.floor(Math.random() * 5);
        params.seaLevel = Number((0.3 + Math.random() * 0.4).toFixed(2));
        params.cloudDensity = Math.floor(Math.random() * 101);
        params.atmosphere = Math.floor(Math.random() * 101);
        params.ringType = Math.random() > 0.6 ? (Math.random() > 0.5 ? 'thin' : 'wide') : 'none';
        dirty = true;

        syncFieldsFromParams();
        drawPlanet();
    }

    function exportPlanet() {
        drawPlanet();
        return {
            preview: canvas.toDataURL('image/png'),
            params: {
                ...params,
                ...(lastMeta || {})
            }
        };
    }

    function startAnimation() {
        renderNow();
    }

    function stopAnimation() {
        if (animationFrameId) {
            window.cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    }

    const controls = [
        fields.seed,
        fields.palette,
        fields.scale,
        fields.octaves,
        fields.seaLevel,
        fields.cloudDensity,
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
                ...params
            };
        }
    };
}
