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

const FACE_NAMES = ['front', 'back', 'left', 'right', 'top', 'bottom'];

const ATMOSPHERE_FACE_OFFSETS = {
    front: { x: 17, y: 31, z: 53 },
    back: { x: 211, y: 73, z: 149 },
    left: { x: 389, y: 127, z: 251 },
    right: { x: 563, y: 191, z: 337 },
    top: { x: 733, y: 257, z: 439 },
    bottom: { x: 907, y: 313, z: 541 }
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
        atmosphereSize: clamp(Number(input.atmosphereSize) || 5, 0, 35),
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
    const cubeWrapper = document.getElementById('planetCubePreview');

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
    let cloudOffset = 0;
    let lastAtmosphereFrameMs = 0;
    let atmosphereWrapper = null;
    const atmosphereFaceCanvases = {
        front: null,
        back: null,
        left: null,
        right: null,
        top: null,
        bottom: null
    };
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

    function lerp(a, b, t) {
        return a + ((b - a) * t);
    }

    function smoothstep(t) {
        const clamped = clamp(t, 0, 1);
        return clamped * clamped * (3 - (2 * clamped));
    }

    function hashNoise(x, y, z, seed) {
        const value = Math.sin((x * 127.1) + (y * 311.7) + (z * 74.7) + (seed * 0.01173)) * 43758.5453123;
        return value - Math.floor(value);
    }

    function valueNoise3D(x, y, z, seed) {
        const ix = Math.floor(x);
        const iy = Math.floor(y);
        const iz = Math.floor(z);
        const fx = smoothstep(x - ix);
        const fy = smoothstep(y - iy);
        const fz = smoothstep(z - iz);

        const n000 = hashNoise(ix, iy, iz, seed);
        const n100 = hashNoise(ix + 1, iy, iz, seed);
        const n010 = hashNoise(ix, iy + 1, iz, seed);
        const n110 = hashNoise(ix + 1, iy + 1, iz, seed);
        const n001 = hashNoise(ix, iy, iz + 1, seed);
        const n101 = hashNoise(ix + 1, iy, iz + 1, seed);
        const n011 = hashNoise(ix, iy + 1, iz + 1, seed);
        const n111 = hashNoise(ix + 1, iy + 1, iz + 1, seed);

        const nx00 = lerp(n000, n100, fx);
        const nx10 = lerp(n010, n110, fx);
        const nx01 = lerp(n001, n101, fx);
        const nx11 = lerp(n011, n111, fx);

        const nxy0 = lerp(nx00, nx10, fy);
        const nxy1 = lerp(nx01, nx11, fy);

        return lerp(nxy0, nxy1, fz);
    }

    function fbmNoise3D(x, y, z, seed) {
        let total = 0;
        let amplitude = 0.62;
        let frequency = 1;
        let normalizer = 0;

        for (let octave = 0; octave < 3; octave += 1) {
            total += valueNoise3D(x * frequency, y * frequency, z * frequency, seed + (octave * 97)) * amplitude;
            normalizer += amplitude;
            frequency *= 2.03;
            amplitude *= 0.52;
        }

        return normalizer > 0 ? total / normalizer : 0;
    }

    function getAtmosphereColor() {
        if (typeof window === 'undefined') {
            return { r: 255, g: 255, b: 255 };
        }

        const rootStyles = window.getComputedStyle(document.documentElement);
        const colorHex = normalizeHexColor(rootStyles.getPropertyValue('--mc-text').trim(), '#ffffff');
        return hexToRgb(colorHex);
    }

    function ensureAtmosphereLayer() {
        if (!cubeWrapper) {
            return;
        }

        if (atmosphereWrapper?.isConnected) {
            return;
        }

        atmosphereWrapper = cubeWrapper.querySelector('.planet-cube-atmosphere-wrapper');

        if (!atmosphereWrapper) {
            atmosphereWrapper = document.createElement('div');
            atmosphereWrapper.className = 'planet-cube-atmosphere-wrapper';

            FACE_NAMES.forEach((faceName) => {
                const faceCanvas = document.createElement('canvas');
                faceCanvas.className = `planet-cube-atmosphere-face face-${faceName}`;
                atmosphereWrapper.appendChild(faceCanvas);
                atmosphereFaceCanvases[faceName] = faceCanvas;
            });

            cubeWrapper.appendChild(atmosphereWrapper);
        }

        FACE_NAMES.forEach((faceName) => {
            if (!atmosphereFaceCanvases[faceName]) {
                atmosphereFaceCanvases[faceName] = atmosphereWrapper.querySelector(`.planet-cube-atmosphere-face.face-${faceName}`);
            }
        });
    }

    function drawAtmosphereFaces(detailLevel, forceRedraw = false) {
        ensureAtmosphereLayer();
        if (!atmosphereWrapper) {
            return;
        }

        const atmospherePower = clamp((params.atmosphere || 0) / 100, 0, 1);
        const atmosphereScale = 1 + (clamp(params.atmosphereSize || 0, 0, 35) / 100);
        atmosphereWrapper.style.setProperty('--planet-atmosphere-scale', atmosphereScale.toFixed(3));
        if (atmospherePower <= 0.001) {
            atmosphereWrapper.style.setProperty('--planet-atmosphere-alpha', '0');
            FACE_NAMES.forEach((faceName) => {
                const faceCanvas = atmosphereFaceCanvases[faceName];
                if (!faceCanvas) {
                    return;
                }
                const faceCtx = faceCanvas.getContext('2d');
                if (faceCtx) {
                    faceCtx.clearRect(0, 0, faceCanvas.width, faceCanvas.height);
                }
            });
            return;
        }

        atmosphereWrapper.style.setProperty('--planet-atmosphere-alpha', (0.28 + (atmospherePower * 0.5)).toFixed(3));

        const size = textureSize;
        const cloudDensity = clamp((params.cloudDensity || 0) / 100, 0, 1);
        const detail = Math.max(1, detailLevel || 1);
        const cloudNoiseScale = (0.05 / detail) * 0.5;
        const threshold = clamp(0.84 - (cloudDensity * 0.38) - (atmospherePower * 0.14), 0.34, 0.9);
        const alphaBase = 0.4 + (atmospherePower * 0.3);
        const glowRgb = getAtmosphereColor();

        FACE_NAMES.forEach((faceName, faceIndex) => {
            const faceCanvas = atmosphereFaceCanvases[faceName];
            if (!faceCanvas) {
                return;
            }

            if (faceCanvas.width !== size || faceCanvas.height !== size) {
                faceCanvas.width = size;
                faceCanvas.height = size;
            }

            const faceCtx = faceCanvas.getContext('2d', { willReadFrequently: true });
            if (!faceCtx) {
                return;
            }

            const image = faceCtx.createImageData(size, size);
            const data = image.data;
            const offset = ATMOSPHERE_FACE_OFFSETS[faceName] || { x: 0, y: 0, z: 0 };
            const driftX = cloudOffset * (10 + detail * 2.8);
            const driftY = Math.sin(cloudOffset * 1.1) * 5;
            const driftZ = cloudOffset * 1.7;

            for (let y = 0; y < size; y += 1) {
                for (let x = 0; x < size; x += 1) {
                    const nx = (x + offset.x + driftX) * cloudNoiseScale;
                    const ny = (y + offset.y + driftY) * cloudNoiseScale;
                    const nz = (offset.z + driftZ + (params.seed * 0.02) + (faceIndex * 11)) * cloudNoiseScale;

                    const cloudNoise = fbmNoise3D(nx, ny, nz, params.seed + (faceIndex * 131));
                    if (cloudNoise <= threshold) {
                        continue;
                    }

                    const t = clamp((cloudNoise - threshold) / Math.max(0.0001, 1 - threshold), 0, 1);
                    const alpha = clamp(alphaBase + (t * 0.3), 0, 1);
                    const pixel = ((y * size) + x) * 4;
                    data[pixel] = glowRgb.r;
                    data[pixel + 1] = glowRgb.g;
                    data[pixel + 2] = glowRgb.b;
                    data[pixel + 3] = Math.round(alpha * 255);
                }
            }

            faceCtx.clearRect(0, 0, size, size);
            faceCtx.putImageData(image, 0, 0);
        });

        if (forceRedraw) {
            lastAtmosphereFrameMs = 0;
        }
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
        drawAtmosphereFaces(getPreviewDetailLevel(), true);
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
            atmosphereSize: params.atmosphereSize,
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
        if (fields.atmosphereSize) {
            fields.atmosphereSize.value = String(params.atmosphereSize);
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
        if (fields.atmosphereSize) {
            params.atmosphereSize = clamp(Number(fields.atmosphereSize.value) || 0, 0, 35);
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
        params.atmosphereSize = 3 + Math.floor(Math.random() * 10);
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

        if (animationFrameId !== null) {
            return;
        }

        const run = (timestamp) => {
            if (animationFrameId === null) {
                return;
            }

            if (!lastAtmosphereFrameMs || (timestamp - lastAtmosphereFrameMs) >= 33) {
                cloudOffset += 0.005;
                drawAtmosphereFaces(getPreviewDetailLevel());
                lastAtmosphereFrameMs = timestamp;
            }

            animationFrameId = window.requestAnimationFrame(run);
        };

        animationFrameId = window.requestAnimationFrame(run);
    }

    function stopAnimation() {
        if (animationFrameId !== null) {
            window.cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }

        lastAtmosphereFrameMs = 0;
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
        fields.atmosphereSize,
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
