import { generatePlanetTexture, generateCubeFaceTextures, getEditablePalette } from './generation/planet-generator.js';
import { State } from './state.js';

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function randomSeed() {
    return Math.floor(Math.random() * 999999) + 1;
}

function normalizeLightDirection(value) {
    const x = Number(value?.x);
    const y = Number(value?.y);
    const z = Number(value?.z);

    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
        return { x: -0.38, y: 0.74, z: 0.56 };
    }

    const len = Math.hypot(x, y, z);
    if (len < 0.00001) {
        return { x: -0.38, y: 0.74, z: 0.56 };
    }

    return {
        x: x / len,
        y: y / len,
        z: z / len
    };
}

const DETAIL_LEVEL_TO_SIZE = {
    1: 16,
    2: 32,
    3: 64,
    4: 128
};

function normalizeHexColor(value, fallback) {
    if (typeof value !== 'string') {
        return fallback;
    }

    const raw = value.trim();
    const short = /^#[0-9a-fA-F]{3}$/;
    const full = /^#[0-9a-fA-F]{6}$/;

    if (full.test(raw)) {
        return raw.toLowerCase();
    }

    if (short.test(raw)) {
        const r = raw[1];
        const g = raw[2];
        const b = raw[3];
        return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
    }

    return fallback;
}

function hexToRgb(hex) {
    const value = Number.parseInt(String(hex).replace('#', ''), 16);
    return {
        r: (value >> 16) & 255,
        g: (value >> 8) & 255,
        b: value & 255
    };
}

function rgbToHex(color) {
    const toHex = (value) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, '0');
    return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
}

function mixHex(a, b, t) {
    const c1 = hexToRgb(a);
    const c2 = hexToRgb(b);
    return rgbToHex({
        r: c1.r + ((c2.r - c1.r) * t),
        g: c1.g + ((c2.g - c1.g) * t),
        b: c1.b + ((c2.b - c1.b) * t)
    });
}

function normalizePaletteColors(value, paletteKey) {
    const defaults = getEditablePalette(paletteKey);
    const ocean1 = normalizeHexColor(value?.ocean1, defaults.ocean1);
    const legacyOcean3 = normalizeHexColor(value?.ocean2, defaults.ocean3);
    const hasOcean3 = value?.ocean3 !== undefined && value?.ocean3 !== null;

    return {
        ocean1,
        ocean2: normalizeHexColor(value?.ocean2, hasOcean3 ? defaults.ocean2 : mixHex(ocean1, legacyOcean3, 0.52)),
        ocean3: normalizeHexColor(value?.ocean3, hasOcean3 ? defaults.ocean3 : legacyOcean3),
        land1: normalizeHexColor(value?.land1, defaults.land1),
        land2: normalizeHexColor(value?.land2, defaults.land2),
        land3: normalizeHexColor(value?.land3, defaults.land3)
    };
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

function cleanupAlphaBuffer(ctx, width, height) {
    const image = ctx.getImageData(0, 0, width, height);
    const data = image.data;

    for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3];
        if (alpha < 120) {
            data[i + 3] = 0;
            continue;
        }
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
    const palette = ['earth', 'lava', 'ice', 'desert', 'dark'].includes(rawPalette)
        ? rawPalette
        : 'earth';

    return {
        seed: clamp(Number(input.seed) || randomSeed(), 1, 999999),
        palette,
        paletteColors: normalizePaletteColors(input.paletteColors, palette),
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

    const cubeFaceCanvases = {
        front: document.getElementById('planetFaceFront'),
        back: document.getElementById('planetFaceBack'),
        left: document.getElementById('planetFaceLeft'),
        right: document.getElementById('planetFaceRight'),
        top: document.getElementById('planetFaceTop'),
        bottom: document.getElementById('planetFaceBottom')
    };

    let textureSize = typeof State.getPlanetDetailSize === 'function'
        ? State.getPlanetDetailSize()
        : 32;
    let previewTextureSizeOverride = null;

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
    let previewLightDirection = normalizeLightDirection({ x: -0.38, y: 0.74, z: 0.56 });
    let spriteBounds = {
        x: 0,
        y: 0,
        width: textureSize,
        height: textureSize
    };

    function syncTextureSizeFromSettings() {
        const nextSize = Number.isFinite(previewTextureSizeOverride)
            ? previewTextureSizeOverride
            : (typeof State.getPlanetDetailSize === 'function' ? State.getPlanetDetailSize() : 32);

        if (nextSize === textureSize) {
            return;
        }

        textureSize = nextSize;
        buffer.width = textureSize;
        buffer.height = textureSize;
        bufferCtx.imageSmoothingEnabled = false;
        spriteBounds = {
            x: 0,
            y: 0,
            width: textureSize,
            height: textureSize
        };
    }

    function drawCubeFaces() {
        const lightDirection = previewLightDirection;
        const faceTextures = generateCubeFaceTextures(params.seed, {
            size: textureSize,
            type: params.palette,
            scale: params.scale,
            octaves: params.octaves,
            persistence: params.persistence,
            seaLevel: params.seaLevel,
            paletteColors: params.paletteColors,
            lightDirection,
            shadowTint: '#1f2a42',
            lightTint: '#dceeff',
            strictPalette: true
        });

        for (const [faceName, targetCanvas] of Object.entries(cubeFaceCanvases)) {
            if (!targetCanvas) {
                continue;
            }

            const source = faceTextures.faces[faceName];
            if (!source) {
                continue;
            }

            targetCanvas.width = textureSize;
            targetCanvas.height = textureSize;
            const faceCtx = targetCanvas.getContext('2d', { willReadFrequently: true });
            faceCtx.imageSmoothingEnabled = false;
            faceCtx.clearRect(0, 0, textureSize, textureSize);
            faceCtx.drawImage(source, 0, 0, textureSize, textureSize);
        }
    }

    function regenerateBase() {
        syncTextureSizeFromSettings();
        drawCubeFaces();
        const lightDirection = previewLightDirection;

        const generated = generatePlanetTexture(params.seed, {
            size: textureSize,
            type: params.palette,
            style: 'cube',
            scale: params.scale,
            octaves: params.octaves,
            persistence: params.persistence,
            seaLevel: params.seaLevel,
            paletteColors: params.paletteColors,
            lightDirection,
            shadowTint: '#1f2a42',
            lightTint: '#dceeff',
            cloudDensity: params.cloudDensity,
            hasClouds: params.cloudDensity > 12,
            ringType: params.ringType
        });

        bufferCtx.clearRect(0, 0, textureSize, textureSize);
        bufferCtx.drawImage(generated.canvas, 0, 0, textureSize, textureSize);
        cleanupAlphaBuffer(bufferCtx, textureSize, textureSize);
        spriteBounds = getOpaqueBounds(bufferCtx, textureSize, textureSize);

        lastMeta = {
            generator: 'cube-v1',
            style: 'cube',
            type: generated.type,
            lightDirection: { ...previewLightDirection },
            ringType: params.ringType,
            hasClouds: params.cloudDensity > 12,
            seaLevel: params.seaLevel,
            paletteColors: { ...params.paletteColors },
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
        if (fields.oceanColor1) {
            fields.oceanColor1.value = params.paletteColors.ocean1;
        }
        if (fields.oceanColor2) {
            fields.oceanColor2.value = params.paletteColors.ocean2;
        }
        if (fields.oceanColor3) {
            fields.oceanColor3.value = params.paletteColors.ocean3;
        }
        if (fields.landColor1) {
            fields.landColor1.value = params.paletteColors.land1;
        }
        if (fields.landColor2) {
            fields.landColor2.value = params.paletteColors.land2;
        }
        if (fields.landColor3) {
            fields.landColor3.value = params.paletteColors.land3;
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
        const prevPalette = params.palette;
        if (fields.palette) {
            params.palette = fields.palette.value || 'earth';
        }
        const paletteChanged = params.palette !== prevPalette;
        if (paletteChanged && fields.palette) {
            params.paletteColors = normalizePaletteColors(undefined, params.palette);
        } else {
            params.paletteColors = normalizePaletteColors({
                ocean1: fields.oceanColor1?.value || params.paletteColors.ocean1,
                ocean2: fields.oceanColor2?.value || params.paletteColors.ocean2,
                ocean3: fields.oceanColor3?.value || params.paletteColors.ocean3,
                land1: fields.landColor1?.value || params.paletteColors.land1,
                land2: fields.landColor2?.value || params.paletteColors.land2,
                land3: fields.landColor3?.value || params.paletteColors.land3
            }, params.palette);
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

    function setPreviewDetailLevel(levelValue) {
        const level = Math.max(1, Math.min(4, Math.round(Number(levelValue) || 2)));
        const nextSize = DETAIL_LEVEL_TO_SIZE[level] || 32;
        previewTextureSizeOverride = nextSize;
        dirty = true;
        drawPlanet();
        return level;
    }

    function setPreviewLightDirection(direction) {
        previewLightDirection = normalizeLightDirection(direction);
        dirty = true;
        drawPlanet();
        return { ...previewLightDirection };
    }

    function getPreviewLightDirection() {
        return { ...previewLightDirection };
    }

    function getPreviewDetailLevel() {
        const activeSize = Number.isFinite(previewTextureSizeOverride)
            ? previewTextureSizeOverride
            : textureSize;

        const pairs = Object.entries(DETAIL_LEVEL_TO_SIZE);
        const match = pairs.find(([, size]) => size === activeSize);
        return match ? Number(match[0]) : 2;
    }

    function randomize() {
        params.seed = randomSeed();
        const paletteKeys = ['earth', 'lava', 'ice', 'desert', 'dark'];
        params.palette = paletteKeys[Math.floor(Math.random() * paletteKeys.length)];
        params.paletteColors = normalizePaletteColors(undefined, params.palette);
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
        fields.oceanColor1,
        fields.oceanColor2,
        fields.oceanColor3,
        fields.landColor1,
        fields.landColor2,
        fields.landColor3,
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
        setPreviewDetailLevel,
        getPreviewDetailLevel,
        setPreviewLightDirection,
        getPreviewLightDirection,
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
