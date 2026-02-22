const PLANET_PALETTES = {
    earth: {
        oceanDark: '#1d3f66',
        oceanLight: '#2f6aa3',
        landDark: '#3f6c2f',
        landLight: '#6ea24c',
        highlight: '#c7e7ff'
    },
    lava: {
        oceanDark: '#3b0f08',
        oceanLight: '#6f1f12',
        landDark: '#8f2e10',
        landLight: '#de6523',
        highlight: '#ffd27f'
    },
    ice: {
        oceanDark: '#426986',
        oceanLight: '#75a7cc',
        landDark: '#b9dff3',
        landLight: '#f1fbff',
        highlight: '#ffffff'
    },
    desert: {
        oceanDark: '#6e4f2e',
        oceanLight: '#947043',
        landDark: '#bb8f45',
        landLight: '#e0b86f',
        highlight: '#fff1c9'
    },
    dark: {
        oceanDark: '#19122b',
        oceanLight: '#2d1f47',
        landDark: '#4d2e73',
        landLight: '#6a4299',
        highlight: '#e2d5ff'
    }
};

const PLANET_TYPES = ['earth', 'lava', 'ice', 'desert', 'dark'];
const FACE_NAMES = ['top', 'bottom', 'left', 'right', 'front', 'back'];

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function lerp(a, b, t) {
    return a + ((b - a) * t);
}

function smoothStep(t) {
    return t * t * (3 - (2 * t));
}

function hexToRgb(hex) {
    const value = Number.parseInt(hex.replace('#', ''), 16);
    return {
        r: (value >> 16) & 255,
        g: (value >> 8) & 255,
        b: value & 255
    };
}

function rgbToString(color, alpha = 1) {
    return `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
}

function rgbToHex(color) {
    const toHex = (value) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, '0');
    return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
}

function normalizeHexColor(value, fallbackHex) {
    if (typeof value !== 'string') {
        return fallbackHex;
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

    return fallbackHex;
}

function mixColor(a, b, t) {
    return {
        r: Math.round(lerp(a.r, b.r, t)),
        g: Math.round(lerp(a.g, b.g, t)),
        b: Math.round(lerp(a.b, b.b, t))
    };
}

function shadeColor(color, amount) {
    return {
        r: clamp(Math.round(color.r * amount), 0, 255),
        g: clamp(Math.round(color.g * amount), 0, 255),
        b: clamp(Math.round(color.b * amount), 0, 255)
    };
}

export function rng(seed) {
    return function random() {
        seed |= 0;
        seed = (seed + 0x6D2B79F5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function pickPlanetType(seedValue) {
    return PLANET_TYPES[Math.abs(seedValue) % PLANET_TYPES.length];
}

export function getEditablePalette(type = 'earth') {
    const base = PLANET_PALETTES[type] || PLANET_PALETTES.earth;
    const oceanMid = rgbToHex(mixColor(hexToRgb(base.oceanDark), hexToRgb(base.oceanLight), 0.52));
    const landPeak = rgbToHex(mixColor(hexToRgb(base.landLight), hexToRgb(base.highlight), 0.35));

    return {
        ocean1: base.oceanDark,
        ocean2: oceanMid,
        ocean3: base.oceanLight,
        land1: base.landDark,
        land2: base.landLight,
        land3: landPeak
    };
}

function createCanvas(size) {
    if (typeof OffscreenCanvas !== 'undefined') {
        return new OffscreenCanvas(size, size);
    }

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    return canvas;
}

function hashInt3(x, y, z, seed) {
    let h = (x * 374761393) ^ (y * 668265263) ^ (z * 2147483647) ^ (seed * 1274126177);
    h = (h ^ (h >>> 13)) | 0;
    h = Math.imul(h, 1274126177);
    h = h ^ (h >>> 16);
    return ((h >>> 0) / 4294967295) * 2 - 1;
}

function createNoise3D(seed) {
    return function noise3D(x, y, z) {
        const xi = Math.floor(x);
        const yi = Math.floor(y);
        const zi = Math.floor(z);
        const xf = x - xi;
        const yf = y - yi;
        const zf = z - zi;

        const u = smoothStep(xf);
        const v = smoothStep(yf);
        const w = smoothStep(zf);

        const n000 = hashInt3(xi, yi, zi, seed);
        const n100 = hashInt3(xi + 1, yi, zi, seed);
        const n010 = hashInt3(xi, yi + 1, zi, seed);
        const n110 = hashInt3(xi + 1, yi + 1, zi, seed);
        const n001 = hashInt3(xi, yi, zi + 1, seed);
        const n101 = hashInt3(xi + 1, yi, zi + 1, seed);
        const n011 = hashInt3(xi, yi + 1, zi + 1, seed);
        const n111 = hashInt3(xi + 1, yi + 1, zi + 1, seed);

        const x00 = lerp(n000, n100, u);
        const x10 = lerp(n010, n110, u);
        const x01 = lerp(n001, n101, u);
        const x11 = lerp(n011, n111, u);

        const y0 = lerp(x00, x10, v);
        const y1 = lerp(x01, x11, v);
        return lerp(y0, y1, w);
    };
}

function fbm(noise3D, x, y, z, octaves, persistence, lacunarity) {
    let value = 0;
    let amplitude = 1;
    let frequency = 1;
    let sumAmplitude = 0;

    for (let i = 0; i < octaves; i += 1) {
        value += noise3D(x * frequency, y * frequency, z * frequency) * amplitude;
        sumAmplitude += amplitude;
        amplitude *= persistence;
        frequency *= lacunarity;
    }

    return sumAmplitude > 0 ? value / sumAmplitude : 0;
}

function faceToXYZ(face, u, v) {
    switch (face) {
        case 'top':
            return [u, 1, -v];
        case 'bottom':
            return [u, -1, v];
        case 'left':
            return [-1, v, u];
        case 'right':
            return [1, v, -u];
        case 'front':
            return [u, v, 1];
        default:
            return [-u, v, -1];
    }
}

function sampleFace(faceMap, x, y, sourceSize) {
    const px = clamp(Math.floor((x + 0.5) * sourceSize), 0, sourceSize - 1);
    const py = clamp(Math.floor((y + 0.5) * sourceSize), 0, sourceSize - 1);
    return faceMap[px][py];
}

function biomeColor(heightValue, seaLevel, palette) {
    if (heightValue < seaLevel) {
        const depthRatio = clamp(heightValue / Math.max(0.0001, seaLevel), 0, 1);
        if (depthRatio < 0.36) {
            return palette.oceanColors[0];
        }
        if (depthRatio < 0.72) {
            return palette.oceanColors[1];
        }
        return palette.oceanColors[2];
    }

    const landT = clamp((heightValue - seaLevel) / Math.max(0.0001, 1 - seaLevel), 0, 1);
    if (landT < 0.34) {
        return palette.landColors[0];
    }
    if (landT < 0.74) {
        return palette.landColors[1];
    }
    return palette.landColors[2];
}

function projectIso(x, y, z, originX, originY, scaleX, scaleY, scaleZ) {
    return {
        x: originX + ((x - z) * scaleX),
        y: originY + ((x + z) * scaleY) - (y * scaleZ)
    };
}

function getCubeProjectedBounds(scaleX, scaleY, scaleZ) {
    const points = [
        [0, 1, 0], [1, 1, 0], [1, 1, 1], [0, 1, 1],
        [0, 0, 1], [1, 0, 1], [1, 0, 0]
    ];

    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    for (const [x, y, z] of points) {
        const p = projectIso(x, y, z, 0, 0, scaleX, scaleY, scaleZ);
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
    }

    return { minX, minY, maxX, maxY };
}

function drawQuad(ctx, p1, p2, p3, p4, color) {
    ctx.fillStyle = rgbToString(color);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.lineTo(p4.x, p4.y);
    ctx.closePath();
    ctx.fill();
}

function orderedDitherFactor(col, row) {
    const matrix = [
        [0, 2],
        [3, 1]
    ];
    const threshold = matrix[row & 1][col & 1] / 3;
    return 0.985 + (threshold * 0.03);
}

function normalizeVector3(vector) {
    if (!vector || typeof vector !== 'object') {
        return { x: -0.35, y: 0.72, z: 0.6 };
    }

    const vx = Number(vector.x);
    const vy = Number(vector.y);
    const vz = Number(vector.z);
    if (!Number.isFinite(vx) || !Number.isFinite(vy) || !Number.isFinite(vz)) {
        return { x: -0.35, y: 0.72, z: 0.6 };
    }

    const length = Math.hypot(vx, vy, vz);
    if (length < 0.00001) {
        return { x: -0.35, y: 0.72, z: 0.6 };
    }

    return {
        x: vx / length,
        y: vy / length,
        z: vz / length
    };
}

function dotVec3(a, b) {
    return (a.x * b.x) + (a.y * b.y) + (a.z * b.z);
}

function faceBasis(faceName) {
    switch (faceName) {
        case 'top':
            return {
                normal: { x: 0, y: 1, z: 0 },
                tangentU: { x: 1, y: 0, z: 0 },
                tangentV: { x: 0, y: 0, z: -1 }
            };
        case 'bottom':
            return {
                normal: { x: 0, y: -1, z: 0 },
                tangentU: { x: 1, y: 0, z: 0 },
                tangentV: { x: 0, y: 0, z: 1 }
            };
        case 'left':
            return {
                normal: { x: -1, y: 0, z: 0 },
                tangentU: { x: 0, y: 0, z: 1 },
                tangentV: { x: 0, y: 1, z: 0 }
            };
        case 'right':
            return {
                normal: { x: 1, y: 0, z: 0 },
                tangentU: { x: 0, y: 0, z: -1 },
                tangentV: { x: 0, y: 1, z: 0 }
            };
        case 'front':
            return {
                normal: { x: 0, y: 0, z: 1 },
                tangentU: { x: 1, y: 0, z: 0 },
                tangentV: { x: 0, y: 1, z: 0 }
            };
        default:
            return {
                normal: { x: 0, y: 0, z: -1 },
                tangentU: { x: -1, y: 0, z: 0 },
                tangentV: { x: 0, y: 1, z: 0 }
            };
    }
}

function buildLitNormal(faceName, slopeU, slopeV, strength = 2.8) {
    const basis = faceBasis(faceName);
    const nx = basis.normal.x - ((basis.tangentU.x * slopeU * strength) + (basis.tangentV.x * slopeV * strength));
    const ny = basis.normal.y - ((basis.tangentU.y * slopeU * strength) + (basis.tangentV.y * slopeV * strength));
    const nz = basis.normal.z - ((basis.tangentU.z * slopeU * strength) + (basis.tangentV.z * slopeV * strength));
    return normalizeVector3({ x: nx, y: ny, z: nz });
}

function cubePointFromFaceUV(faceName, u, v) {
    const px = clamp((u * 2) - 1, -1, 1);
    const py = clamp(1 - (v * 2), -1, 1);
    const pz = clamp((v * 2) - 1, -1, 1);

    switch (faceName) {
        case 'top':
            return { x: px, y: 1, z: pz };
        case 'bottom':
            return { x: px, y: -1, z: -pz };
        case 'left':
            return { x: -1, y: py, z: px };
        case 'right':
            return { x: 1, y: py, z: -px };
        case 'front':
            return { x: px, y: py, z: 1 };
        default:
            return { x: -px, y: py, z: -1 };
    }
}

function computeLightSpotMask(faceName, u, v, lightDirection) {
    const point = cubePointFromFaceUV(faceName, u, v);
    const radialNormal = normalizeVector3(point);
    const alignment = dotVec3(radialNormal, lightDirection);

    const outerEdge = 0.18;
    const innerEdge = 0.76;
    const t = clamp((alignment - outerEdge) / Math.max(0.00001, innerEdge - outerEdge), 0, 1);
    return smoothStep(t);
}

function quantizeLighting(value) {
    const shades = [0.74, 0.8, 0.86, 0.92, 0.98, 1.04, 1.1, 1.16, 1.22];
    let best = shades[0];
    let bestDiff = Math.abs(value - shades[0]);

    for (let i = 1; i < shades.length; i += 1) {
        const diff = Math.abs(value - shades[i]);
        if (diff < bestDiff) {
            best = shades[i];
            bestDiff = diff;
        }
    }

    return best;
}

function blendColor(base, tint, amount) {
    const t = clamp(amount, 0, 1);
    return {
        r: clamp(Math.round((base.r * (1 - t)) + (tint.r * t)), 0, 255),
        g: clamp(Math.round((base.g * (1 - t)) + (tint.g * t)), 0, 255),
        b: clamp(Math.round((base.b * (1 - t)) + (tint.b * t)), 0, 255)
    };
}

function resolveTintColor(value, fallbackHex) {
    const hex = normalizeHexColor(value, fallbackHex);
    return hexToRgb(hex);
}

function applyPixelLighting(baseColor, options) {
    const {
        faceName,
        faceU,
        faceV,
        slopeU,
        slopeV,
        lightDirection,
        exposure,
        dither,
        shadowTint,
        lightTint
    } = options;

    const normal = buildLitNormal(faceName, slopeU, slopeV, 2.8);
    const diffuse = clamp(dotVec3(normal, lightDirection), -1, 1);
    const halfLambert = (diffuse * 0.5) + 0.5;
    const softDirect = Math.pow(halfLambert, 1.2);
    const spotMask = computeLightSpotMask(faceName, faceU, faceV, lightDirection);
    const ambient = 0.56 + (spotMask * 0.22);
    const direct = softDirect * (0.07 + (spotMask * 0.34));
    const raw = (ambient + direct) * exposure * dither;
    const lit = quantizeLighting(clamp(raw, 0.58, 1.24));

    let shaded = shadeColor(baseColor, lit);
    const shadowAmount = clamp(((1 - spotMask) * 0.28) + ((0.5 - halfLambert) * 0.24), 0, 0.34);
    const lightAmount = clamp((spotMask * (halfLambert - 0.24)) * 0.26, 0, 0.18);

    shaded = blendColor(shaded, shadowTint, shadowAmount);
    shaded = blendColor(shaded, lightTint, lightAmount);
    return shaded;
}

function drawCubeFace(ctx, options) {
    const {
        faceName,
        faceMap,
        faceResolution,
        sourceResolution,
        seaLevel,
        palette,
        originX,
        originY,
        scaleX,
        scaleY,
        scaleZ,
        shadeFactor,
        lightDirection,
        shadowTint,
        lightTint,
        strictPalette
    } = options;

    for (let row = 0; row < faceResolution; row += 1) {
        for (let col = 0; col < faceResolution; col += 1) {
            const x0 = col / faceResolution;
            const x1 = (col + 1) / faceResolution;
            const y0 = row / faceResolution;
            const y1 = (row + 1) / faceResolution;
            const faceU = (x0 + x1) * 0.5;
            const faceV = (y0 + y1) * 0.5;

            let p1;
            let p2;
            let p3;
            let p4;

            if (faceName === 'top') {
                p1 = projectIso(x0, 1, y0, originX, originY, scaleX, scaleY, scaleZ);
                p2 = projectIso(x1, 1, y0, originX, originY, scaleX, scaleY, scaleZ);
                p3 = projectIso(x1, 1, y1, originX, originY, scaleX, scaleY, scaleZ);
                p4 = projectIso(x0, 1, y1, originX, originY, scaleX, scaleY, scaleZ);
            } else if (faceName === 'right') {
                const ry0 = 1 - y0;
                const ry1 = 1 - y1;
                p1 = projectIso(1, ry0, x0, originX, originY, scaleX, scaleY, scaleZ);
                p2 = projectIso(1, ry0, x1, originX, originY, scaleX, scaleY, scaleZ);
                p3 = projectIso(1, ry1, x1, originX, originY, scaleX, scaleY, scaleZ);
                p4 = projectIso(1, ry1, x0, originX, originY, scaleX, scaleY, scaleZ);
            } else {
                const fy0 = 1 - y0;
                const fy1 = 1 - y1;
                p1 = projectIso(x0, fy0, 1, originX, originY, scaleX, scaleY, scaleZ);
                p2 = projectIso(x1, fy0, 1, originX, originY, scaleX, scaleY, scaleZ);
                p3 = projectIso(x1, fy1, 1, originX, originY, scaleX, scaleY, scaleZ);
                p4 = projectIso(x0, fy1, 1, originX, originY, scaleX, scaleY, scaleZ);
            }

            const faceHeight = sampleFace(faceMap, faceU - 0.5, faceV - 0.5, sourceResolution);
            const faceHeightX = sampleFace(faceMap, faceU + (1 / sourceResolution) - 0.5, faceV - 0.5, sourceResolution);
            const faceHeightY = sampleFace(faceMap, faceU - 0.5, faceV + (1 / sourceResolution) - 0.5, sourceResolution);
            const slopeX = faceHeightX - faceHeight;
            const slopeY = faceHeightY - faceHeight;
            const base = biomeColor(faceHeight, seaLevel, palette);
            const dither = orderedDitherFactor(col, row);
            const shaded = applyPixelLighting(base, {
                faceName,
                faceU,
                faceV,
                slopeU: slopeX,
                slopeV: slopeY,
                lightDirection,
                exposure: shadeFactor,
                dither: strictPalette ? 1 : dither,
                shadowTint,
                lightTint
            });

            drawQuad(ctx, p1, p2, p3, p4, shaded);
        }
    }
}

function generateCubeMaps(size, seedValue, params) {
    const faces = {
        top: Array.from({ length: size }, () => new Array(size).fill(0)),
        bottom: Array.from({ length: size }, () => new Array(size).fill(0)),
        left: Array.from({ length: size }, () => new Array(size).fill(0)),
        right: Array.from({ length: size }, () => new Array(size).fill(0)),
        front: Array.from({ length: size }, () => new Array(size).fill(0)),
        back: Array.from({ length: size }, () => new Array(size).fill(0))
    };

    const noise3D = createNoise3D(seedValue || 1);
    const scale = params.scale;
    const octaves = params.octaves;
    const persistence = params.persistence;
    const lacunarity = params.lacunarity;

    for (const faceName of FACE_NAMES) {
        const face = faces[faceName];
        for (let x = 0; x < size; x += 1) {
            for (let y = 0; y < size; y += 1) {
                const u = ((x + 0.5) / size) * 2 - 1;
                const v = ((y + 0.5) / size) * 2 - 1;
                const [nx, ny, nz] = faceToXYZ(faceName, u, v);
                const n = fbm(noise3D, nx * scale, ny * scale, nz * scale, octaves, persistence, lacunarity);
                face[x][y] = clamp((n + 1) * 0.5, 0, 1);
            }
        }
    }

    return faces;
}

function resolvePaletteFromOptions(type, options) {
    const defaultEditable = getEditablePalette(type);
    const rawEditable = options.paletteColors || {};
    const ocean1Hex = normalizeHexColor(rawEditable.ocean1, defaultEditable.ocean1);
    const hasLegacyOcean = rawEditable.ocean3 === undefined || rawEditable.ocean3 === null;
    const legacyOceanLightHex = normalizeHexColor(rawEditable.ocean2, defaultEditable.ocean3);
    const fallbackOcean2Hex = rgbToHex(mixColor(hexToRgb(ocean1Hex), hexToRgb(legacyOceanLightHex), 0.52));
    const editable = {
        ocean1: ocean1Hex,
        ocean2: normalizeHexColor(rawEditable.ocean2, hasLegacyOcean ? fallbackOcean2Hex : defaultEditable.ocean2),
        ocean3: normalizeHexColor(rawEditable.ocean3, hasLegacyOcean ? legacyOceanLightHex : defaultEditable.ocean3),
        land1: normalizeHexColor(rawEditable.land1, defaultEditable.land1),
        land2: normalizeHexColor(rawEditable.land2, defaultEditable.land2),
        land3: normalizeHexColor(rawEditable.land3, defaultEditable.land3)
    };

    return {
        oceanColors: [hexToRgb(editable.ocean1), hexToRgb(editable.ocean2), hexToRgb(editable.ocean3)],
        landColors: [hexToRgb(editable.land1), hexToRgb(editable.land2), hexToRgb(editable.land3)]
    };
}

function renderFlatFaceTexture(faceName, faceMap, size, seaLevel, palette, strictPalette, lightDirection, shadowTint, lightTint) {
    const canvas = createCanvas(size);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.imageSmoothingEnabled = false;

    const faceShade = {
        front: 0.88,
        back: 0.72,
        left: 0.8,
        right: 0.9,
        top: 1.02,
        bottom: 0.68
    }[faceName] || 0.86;

    for (let x = 0; x < size; x += 1) {
        for (let y = 0; y < size; y += 1) {
            const h = faceMap[x][y];
            const base = biomeColor(h, seaLevel, palette);
            const hX = sampleFace(faceMap, ((x + 0.5) / size) + (1 / size) - 0.5, (y + 0.5) / size - 0.5, size);
            const hY = sampleFace(faceMap, (x + 0.5) / size - 0.5, ((y + 0.5) / size) + (1 / size) - 0.5, size);
            const color = applyPixelLighting(base, {
                faceName,
                slopeU: hX - h,
                slopeV: hY - h,
                lightDirection,
                exposure: faceShade,
                dither: strictPalette ? 1 : orderedDitherFactor(x, y),
                shadowTint,
                lightTint
            });
            ctx.fillStyle = rgbToString(color);
            ctx.fillRect(x, y, 1, 1);
        }
    }

    return canvas;
}

export function generateCubeFaceTextures(seedValue, options = {}) {
    const size = options.size || 64;
    const type = options.type || pickPlanetType(seedValue || 1);
    const strictPalette = options.strictPalette ?? Boolean(options.paletteColors);
    const lightDirection = normalizeVector3(options.lightDirection || { x: -0.35, y: 0.72, z: 0.6 });
    const shadowTint = resolveTintColor(options.shadowTint, '#1f2940');
    const lightTint = resolveTintColor(options.lightTint, '#dcecff');
    const palette = resolvePaletteFromOptions(type, options);

    const params = {
        scale: options.scale || 2.2,
        octaves: options.octaves || 5,
        persistence: options.persistence || 0.5,
        lacunarity: options.lacunarity || 2,
        seaLevel: clamp(options.seaLevel ?? 0.5, 0.15, 0.85)
    };

    const faceMaps = generateCubeMaps(size, seedValue || 1, params);
    const faces = {};

    for (const faceName of FACE_NAMES) {
        faces[faceName] = renderFlatFaceTexture(
            faceName,
            faceMaps[faceName],
            size,
            params.seaLevel,
            palette,
            strictPalette,
            lightDirection,
            shadowTint,
            lightTint
        );
    }

    return {
        seed: seedValue,
        type,
        size,
        faces,
        seaLevel: params.seaLevel
    };
}

export function generatePlanetTexture(seedValue, options = {}) {
    const size = options.size || 64;
    const random = rng(seedValue || 1);
    const type = options.type || pickPlanetType(seedValue || 1);
    const hasClouds = options.hasClouds ?? (random() > 0.58);
    const rawCloudDensity = Number(options.cloudDensity);
    const cloudDensity = clamp(
        Number.isFinite(rawCloudDensity) ? rawCloudDensity / 100 : (hasClouds ? 0.5 : 0),
        0,
        1
    );
    const ringType = options.ringType || 'none';
    const strictPalette = options.strictPalette ?? Boolean(options.paletteColors);
    const lightDirection = normalizeVector3(options.lightDirection || { x: -0.35, y: 0.72, z: 0.6 });
    const shadowTint = resolveTintColor(options.shadowTint, '#1f2940');
    const lightTint = resolveTintColor(options.lightTint, '#dcecff');

    const palette = resolvePaletteFromOptions(type, options);

    const params = {
        scale: options.scale || 2.2,
        octaves: options.octaves || 5,
        persistence: options.persistence || 0.5,
        lacunarity: options.lacunarity || 2,
        seaLevel: clamp(options.seaLevel ?? 0.5, 0.15, 0.85)
    };

    const faceMaps = generateCubeMaps(size, seedValue || 1, params);

    const canvas = createCanvas(size);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, size, size);

    const faceResolution = clamp(Math.floor(size / 2.2), 10, 40);
    const scaleX = size * 0.26;
    const scaleY = size * 0.13;
    const verticalSquash = 0.86;
    const scaleZ = size * 0.38 * verticalSquash;
    const bounds = getCubeProjectedBounds(scaleX, scaleY, scaleZ);
    const boundsCenterX = (bounds.minX + bounds.maxX) * 0.5;
    const boundsCenterY = (bounds.minY + bounds.maxY) * 0.5;
    const originX = (size * 0.5) - boundsCenterX;
    const originY = (size * 0.5) - boundsCenterY;

    drawCubeFace(ctx, {
        faceName: 'right',
        faceMap: faceMaps.right,
        faceResolution,
        sourceResolution: size,
        seaLevel: params.seaLevel,
        palette,
        originX,
        originY,
        scaleX,
        scaleY,
        scaleZ,
        shadeFactor: 0.72,
        lightDirection,
        shadowTint,
        lightTint,
        strictPalette
    });

    drawCubeFace(ctx, {
        faceName: 'front',
        faceMap: faceMaps.front,
        faceResolution,
        sourceResolution: size,
        seaLevel: params.seaLevel,
        palette,
        originX,
        originY,
        scaleX,
        scaleY,
        scaleZ,
        shadeFactor: 0.82,
        lightDirection,
        shadowTint,
        lightTint,
        strictPalette
    });

    drawCubeFace(ctx, {
        faceName: 'top',
        faceMap: faceMaps.top,
        faceResolution,
        sourceResolution: size,
        seaLevel: params.seaLevel,
        palette,
        originX,
        originY,
        scaleX,
        scaleY,
        scaleZ,
        shadeFactor: 1.06,
        lightDirection,
        shadowTint,
        lightTint,
        strictPalette
    });

    if (!strictPalette && cloudDensity > 0.2) {
        const cloudCount = 1 + Math.floor(cloudDensity * 4);
        for (let i = 0; i < cloudCount; i += 1) {
            const cx = random();
            const cz = random();
            const p = projectIso(cx, 1.04, cz, originX, originY, scaleX, scaleY, scaleZ);
            const radius = size * (0.009 + (cloudDensity * 0.014) + (random() * 0.008));
            const alpha = 0.08 + (cloudDensity * 0.1);
            ctx.fillStyle = `rgba(236, 244, 255, ${alpha.toFixed(3)})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    return {
        seed: seedValue,
        type,
        style: 'cube',
        ringType,
        hasClouds,
        canvas,
        orbitRadius: 450 + Math.floor(random() * 1500),
        orbitSpeed: 0.05 + (random() * 0.2),
        rotationSpeed: 0.08 + (random() * 0.35)
    };
}

async function toImageBitmapOrCanvas(canvasLike) {
    if (typeof createImageBitmap === 'function') {
        return createImageBitmap(canvasLike);
    }
    return canvasLike;
}

function ensureAtlasCanvas(size) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    return canvas;
}

export async function buildPlanetAtlas(options = {}) {
    const count = options.count || 16;
    const cellSize = options.cellSize || 64;
    const style = options.style || 'cube';
    const grid = options.grid || Math.ceil(Math.sqrt(count));
    const atlasSize = grid * cellSize;
    const atlasCanvas = ensureAtlasCanvas(atlasSize);
    const ctx = atlasCanvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    const entries = [];

    for (let i = 0; i < count; i += 1) {
        const seed = (options.baseSeed || 1000) + (i * 37);
        const planet = generatePlanetTexture(seed, {
            size: cellSize,
            style,
            scale: 1.8 + ((i % 7) * 0.17),
            octaves: 4 + (i % 2),
            persistence: 0.5,
            lacunarity: 2,
            seaLevel: 0.42 + ((i % 5) * 0.05),
            lightDirection: options.lightDirection,
            shadowTint: options.shadowTint,
            lightTint: options.lightTint
        });

        const gx = i % grid;
        const gy = Math.floor(i / grid);
        const x = gx * cellSize;
        const y = gy * cellSize;

        ctx.drawImage(planet.canvas, x, y, cellSize, cellSize);
        entries.push({
            seed: planet.seed,
            type: planet.type,
            ringType: planet.ringType,
            hasClouds: planet.hasClouds,
            orbitRadius: planet.orbitRadius,
            orbitSpeed: planet.orbitSpeed,
            rotationSpeed: planet.rotationSpeed,
            texIdx: i
        });
    }

    const image = await toImageBitmapOrCanvas(atlasCanvas);

    return {
        image,
        canvas: atlasCanvas,
        grid,
        cellSize,
        count,
        entries
    };
}
