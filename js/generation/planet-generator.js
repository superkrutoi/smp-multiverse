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
        return depthRatio > 0.58 ? palette.oceanLight : palette.oceanDark;
    }

    const landT = clamp((heightValue - seaLevel) / Math.max(0.0001, 1 - seaLevel), 0, 1);
    if (landT > 0.86) {
        return palette.highlight;
    }

    return landT > 0.42 ? palette.landLight : palette.landDark;
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
    return 0.96 + (threshold * 0.08);
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
        shadeFactor
    } = options;

    for (let row = 0; row < faceResolution; row += 1) {
        for (let col = 0; col < faceResolution; col += 1) {
            const x0 = col / faceResolution;
            const x1 = (col + 1) / faceResolution;
            const y0 = row / faceResolution;
            const y1 = (row + 1) / faceResolution;

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

            const faceHeight = sampleFace(faceMap, (x0 + x1) * 0.5 - 0.5, (y0 + y1) * 0.5 - 0.5, sourceResolution);
            const faceHeightX = sampleFace(faceMap, ((x0 + x1) * 0.5) + (1 / sourceResolution) - 0.5, (y0 + y1) * 0.5 - 0.5, sourceResolution);
            const faceHeightY = sampleFace(faceMap, (x0 + x1) * 0.5 - 0.5, ((y0 + y1) * 0.5) + (1 / sourceResolution) - 0.5, sourceResolution);
            const slopeX = faceHeightX - faceHeight;
            const slopeY = faceHeightY - faceHeight;
            const localLight = clamp(0.88 + ((-slopeX) * 1.9) + ((-slopeY) * 1.3), 0.7, 1.22);
            const dither = orderedDitherFactor(col, row);
            const base = biomeColor(faceHeight, seaLevel, palette);
            const shaded = shadeColor(base, shadeFactor * localLight * dither);
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

export function generatePlanetTexture(seedValue, options = {}) {
    const size = options.size || 64;
    const random = rng(seedValue || 1);
    const type = options.type || pickPlanetType(seedValue || 1);
    const hasClouds = options.hasClouds ?? (random() > 0.58);
    const ringType = options.ringType || 'none';

    const paletteHex = PLANET_PALETTES[type] || PLANET_PALETTES.earth;
    const palette = {
        oceanDark: hexToRgb(paletteHex.oceanDark),
        oceanLight: hexToRgb(paletteHex.oceanLight),
        landDark: hexToRgb(paletteHex.landDark),
        landLight: hexToRgb(paletteHex.landLight),
        highlight: hexToRgb(paletteHex.highlight)
    };

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
    const scaleZ = size * 0.38;
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
        shadeFactor: 0.72
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
        shadeFactor: 0.82
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
        shadeFactor: 1.06
    });

    if (hasClouds) {
        const cloudCount = 3 + Math.floor(random() * 4);
        for (let i = 0; i < cloudCount; i += 1) {
            const cx = random();
            const cz = random();
            const p = projectIso(cx, 1.04, cz, originX, originY, scaleX, scaleY, scaleZ);
            const radius = size * (0.018 + random() * 0.028);
            ctx.fillStyle = 'rgba(235, 244, 255, 0.35)';
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
            seaLevel: 0.42 + ((i % 5) * 0.05)
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
