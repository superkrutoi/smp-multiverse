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

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
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

function createBlobSet(random, size, radius) {
    const blobCount = 3 + Math.floor(random() * 3);
    const blobs = [];

    for (let i = 0; i < blobCount; i += 1) {
        const angle = random() * Math.PI * 2;
        const dist = random() * (radius * 0.5);
        blobs.push({
            x: (size * 0.5) + Math.cos(angle) * dist,
            y: (size * 0.5) + Math.sin(angle) * dist,
            radius: radius * (0.18 + random() * 0.2)
        });
    }

    return blobs;
}

function selectShade(dot) {
    if (dot > 0.35) {
        return 'light';
    }
    if (dot > -0.1) {
        return 'mid';
    }
    return 'dark';
}

function isInsideStyleMask(nx, ny, style) {
    if (style === 'cubic') {
        return Math.max(Math.abs(nx), Math.abs(ny)) <= 1;
    }

    if (style === 'hybrid') {
        const sphere = (nx * nx) + (ny * ny);
        const cube = Math.max(Math.abs(nx), Math.abs(ny));
        const hybrid = (sphere * 0.7) + ((cube * cube) * 0.3);
        return hybrid <= 1;
    }

    return (nx * nx) + (ny * ny) <= 1;
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

function drawRingPixel(ctx, center, radius, random, colorDark, colorLight, frontLayer) {
    const tilt = 0.45;
    const inner = radius * 1.18;
    const outer = radius * 1.42;

    for (let y = -Math.ceil(outer); y <= Math.ceil(outer); y += 1) {
        for (let x = -Math.ceil(outer); x <= Math.ceil(outer); x += 1) {
            const ex = x;
            const ey = y / tilt;
            const len = Math.sqrt((ex * ex) + (ey * ey));
            if (len < inner || len > outer) {
                continue;
            }

            if (frontLayer && y < 0) {
                continue;
            }
            if (!frontLayer && y >= 0) {
                continue;
            }

            const px = Math.round(center + x);
            const py = Math.round(center + y);
            const shadeJitter = random() > 0.6;
            ctx.fillStyle = shadeJitter ? rgbToString(colorLight, 0.85) : rgbToString(colorDark, 0.8);
            ctx.fillRect(px, py, 1, 1);
        }
    }
}

function drawClouds(ctx, size, radius, random) {
    const cloudBlobs = 2 + Math.floor(random() * 2);
    ctx.save();
    ctx.beginPath();
    ctx.arc(size * 0.5, size * 0.5, radius, 0, Math.PI * 2);
    ctx.clip();

    for (let i = 0; i < cloudBlobs; i += 1) {
        const x = (size * 0.5) + ((random() * 2 - 1) * radius * 0.5);
        const y = (size * 0.5) + ((random() * 2 - 1) * radius * 0.4);
        const r = radius * (0.15 + random() * 0.1);
        ctx.fillStyle = 'rgba(242, 247, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
}

export function generatePlanetTexture(seedValue, options = {}) {
    const size = options.size || 64;
    const style = options.style || 'hybrid';
    const radius = size * 0.5;
    const center = radius;
    const random = rng(seedValue || 1);

    const type = options.type || pickPlanetType(seedValue || 1);
    const paletteHex = PLANET_PALETTES[type] || PLANET_PALETTES.earth;
    const palette = {
        oceanDark: hexToRgb(paletteHex.oceanDark),
        oceanLight: hexToRgb(paletteHex.oceanLight),
        landDark: hexToRgb(paletteHex.landDark),
        landLight: hexToRgb(paletteHex.landLight),
        highlight: hexToRgb(paletteHex.highlight)
    };

    const hasClouds = options.hasClouds ?? (random() > 0.5);
    const ringType = options.ringType || (random() > 0.7 ? 'thin' : 'none');

    const canvas = createCanvas(size);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, size, size);

    const landBlobs = createBlobSet(random, size, radius);
    const lightDir = { x: -0.7, y: -0.3 };

    if (ringType !== 'none') {
        drawRingPixel(ctx, center, radius, random, palette.oceanDark, palette.oceanLight, false);
    }

    for (let y = 0; y < size; y += 1) {
        for (let x = 0; x < size; x += 1) {
            const nx = (x - center) / radius;
            const ny = (y - center) / radius;

            if (!isInsideStyleMask(nx, ny, style)) {
                continue;
            }

            const sphereLen = (nx * nx) + (ny * ny);
            if (sphereLen > 1) {
                continue;
            }

            const nz = Math.sqrt(Math.max(0, 1 - sphereLen));
            const dot = (nx * lightDir.x) + (ny * lightDir.y) + nz;
            const shade = selectShade(dot);

            let land = false;
            for (const blob of landBlobs) {
                const dx = x - blob.x;
                const dy = y - blob.y;
                if ((dx * dx) + (dy * dy) <= (blob.radius * blob.radius)) {
                    land = true;
                    break;
                }
            }

            let color = palette.oceanDark;
            if (!land && shade === 'mid') {
                color = palette.oceanLight;
            }
            if (!land && shade === 'light') {
                color = palette.highlight;
            }

            if (land && shade === 'dark') {
                color = palette.landDark;
            }
            if (land && shade === 'mid') {
                color = palette.landLight;
            }
            if (land && shade === 'light') {
                color = palette.highlight;
            }

            const dither = random() > 0.92;
            const toneShift = dither ? 1.08 : 1;
            const finalColor = {
                r: clamp(Math.round(color.r * toneShift), 0, 255),
                g: clamp(Math.round(color.g * toneShift), 0, 255),
                b: clamp(Math.round(color.b * toneShift), 0, 255)
            };

            ctx.fillStyle = rgbToString(finalColor);
            ctx.fillRect(x, y, 1, 1);
        }
    }

    if (hasClouds) {
        drawClouds(ctx, size, radius, random);
    }

    if (ringType !== 'none') {
        drawRingPixel(ctx, center, radius, random, palette.landDark, palette.highlight, true);
    }

    return {
        seed: seedValue,
        type,
        style,
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
    const style = options.style || 'hybrid';
    const grid = options.grid || Math.ceil(Math.sqrt(count));
    const atlasSize = grid * cellSize;
    const atlasCanvas = ensureAtlasCanvas(atlasSize);
    const ctx = atlasCanvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    const entries = [];

    for (let i = 0; i < count; i += 1) {
        const seed = (options.baseSeed || 1000) + i * 37;
        const planet = generatePlanetTexture(seed, { size: cellSize, style });

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
