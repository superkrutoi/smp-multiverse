function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function mulberry32(seedValue) {
    let t = seedValue >>> 0;
    return function next() {
        t += 0x6D2B79F5;
        let r = Math.imul(t ^ (t >>> 15), 1 | t);
        r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
        return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
}

function hexToRgb(hex) {
    const value = Number.parseInt(hex.replace('#', ''), 16);
    return {
        r: (value >> 16) & 255,
        g: (value >> 8) & 255,
        b: value & 255
    };
}

function shade(color, factor) {
    return {
        r: clamp(Math.round(color.r * factor), 0, 255),
        g: clamp(Math.round(color.g * factor), 0, 255),
        b: clamp(Math.round(color.b * factor), 0, 255)
    };
}

const PALETTES = {
    earth: {
        base: '#3f8d3f',
        secondary: '#2f5f2b',
        accent: '#87d7ff',
        atmosphere: { r: 130, g: 188, b: 255 },
        ring: { r: 185, g: 201, b: 230 }
    },
    lava: {
        base: '#b14610',
        secondary: '#5f1a00',
        accent: '#ffcc61',
        atmosphere: { r: 255, g: 125, b: 64 },
        ring: { r: 255, g: 146, b: 84 }
    },
    ice: {
        base: '#c7e6f8',
        secondary: '#8eb9cf',
        accent: '#ffffff',
        atmosphere: { r: 186, g: 231, b: 255 },
        ring: { r: 194, g: 230, b: 255 }
    },
    toxic: {
        base: '#7ac526',
        secondary: '#3d6a16',
        accent: '#dcff8f',
        atmosphere: { r: 176, g: 255, b: 96 },
        ring: { r: 198, g: 255, b: 132 }
    }
};

const TERRAIN_TO_VARIANT = {
    smooth: 0,
    mixed: 1,
    rough: 2,
    cracked: 3
};

const ATLAS_CACHE = new Map();

function drawTexturedPlanetCell(ctx, x, y, size, palette, variant, seed) {
    const center = x + (size / 2);
    const radius = (size / 2) - 3;
    const rand = mulberry32(seed + (variant * 9973));

    const base = hexToRgb(palette.base);
    const secondary = hexToRgb(palette.secondary);
    const accent = hexToRgb(palette.accent);

    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, Math.PI * 2);
    ctx.clip();

    const gradient = ctx.createLinearGradient(x, y, x + size, y + size);
    gradient.addColorStop(0, `rgb(${shade(base, 1.12).r}, ${shade(base, 1.12).g}, ${shade(base, 1.12).b})`);
    gradient.addColorStop(1, `rgb(${shade(secondary, 0.8).r}, ${shade(secondary, 0.8).g}, ${shade(secondary, 0.8).b})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, size, size);

    const dotCount = 60 + (variant * 30);
    for (let i = 0; i < dotCount; i += 1) {
        const dx = (rand() * 2 - 1) * radius;
        const dy = (rand() * 2 - 1) * radius;
        const d = Math.sqrt((dx * dx) + (dy * dy));
        if (d > radius) {
            continue;
        }

        const px = Math.round(center + dx);
        const py = Math.round(center + dy);
        const sizePx = rand() > 0.75 ? 2 : 1;
        const tone = rand() > 0.65 ? accent : (rand() > 0.5 ? base : secondary);
        const alpha = 0.22 + (rand() * 0.42);
        ctx.fillStyle = `rgba(${tone.r}, ${tone.g}, ${tone.b}, ${alpha.toFixed(3)})`;
        ctx.fillRect(px, py, sizePx, sizePx);
    }

    if (variant === 3) {
        for (let i = 0; i < 10; i += 1) {
            const ay = y + 8 + Math.floor(rand() * (size - 16));
            const ax = x + 6 + Math.floor(rand() * (size - 12));
            const len = 8 + Math.floor(rand() * 20);
            ctx.strokeStyle = `rgba(${shade(secondary, 0.55).r}, ${shade(secondary, 0.55).g}, ${shade(secondary, 0.55).b}, 0.45)`;
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(ax + len, ay + ((rand() > 0.5 ? 1 : -1) * (2 + Math.floor(rand() * 5))));
            ctx.stroke();
        }
    }

    const rim = ctx.createRadialGradient(
        center - (radius * 0.2),
        center - (radius * 0.25),
        radius * 0.2,
        center,
        center,
        radius
    );
    rim.addColorStop(0, 'rgba(255,255,255,0.28)');
    rim.addColorStop(1, 'rgba(0,0,0,0.42)');
    ctx.fillStyle = rim;
    ctx.fillRect(x, y, size, size);

    ctx.restore();
}

function buildPlanetAtlas(paletteKey, grid = 4, cellSize = 64) {
    const palette = PALETTES[paletteKey] || PALETTES.earth;
    const size = grid * cellSize;
    const atlas = document.createElement('canvas');
    atlas.width = size;
    atlas.height = size;

    const ctx = atlas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    let spriteIndex = 0;
    for (let row = 0; row < grid; row += 1) {
        for (let col = 0; col < grid; col += 1) {
            const x = col * cellSize;
            const y = row * cellSize;
            const variant = spriteIndex % 4;
            drawTexturedPlanetCell(ctx, x, y, cellSize, palette, variant, 1000 + spriteIndex * 37);
            spriteIndex += 1;
        }
    }

    return {
        canvas: atlas,
        grid,
        cellSize,
        spriteCount: grid * grid,
        palette
    };
}

function getAtlas(paletteKey) {
    if (!ATLAS_CACHE.has(paletteKey)) {
        ATLAS_CACHE.set(paletteKey, buildPlanetAtlas(paletteKey));
    }

    return ATLAS_CACHE.get(paletteKey);
}

function drawStars(ctx, size, seed, time) {
    const rand = mulberry32(seed ^ 0xA53A9B1);
    ctx.fillStyle = '#070814';
    ctx.fillRect(0, 0, size, size);

    for (let i = 0; i < 130; i += 1) {
        const x = Math.floor(rand() * size);
        const y = Math.floor(rand() * size);
        const twinkle = 0.35 + (Math.sin(time * 1.2 + rand() * Math.PI * 2) * 0.25);
        const alpha = clamp(0.25 + twinkle, 0.2, 0.8);
        ctx.fillStyle = `rgba(229,240,255,${alpha.toFixed(3)})`;
        ctx.fillRect(x, y, rand() > 0.85 ? 2 : 1, rand() > 0.85 ? 2 : 1);
    }
}

function drawRing(ctx, center, radius, ringColor, type, front) {
    const widthFactor = type === 'wide' ? 0.44 : 0.24;
    const inner = radius * 1.18;
    const outer = radius * (1.18 + widthFactor);

    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(-0.45);
    ctx.scale(1, 0.42);

    const segments = 220;
    for (let i = 0; i < segments; i += 1) {
        const angle = (i / segments) * Math.PI * 2;
        if (front && angle > Math.PI) {
            continue;
        }
        if (!front && angle <= Math.PI) {
            continue;
        }

        const spread = (0.35 + (Math.sin(i * 0.27) * 0.15));
        const alpha = clamp(front ? spread * 0.46 : spread * 0.28, 0.08, 0.6);
        const x1 = Math.cos(angle) * inner;
        const y1 = Math.sin(angle) * inner;
        const x2 = Math.cos(angle) * outer;
        const y2 = Math.sin(angle) * outer;

        ctx.strokeStyle = `rgba(${ringColor.r}, ${ringColor.g}, ${ringColor.b}, ${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }

    ctx.restore();
}

function drawClouds(ctx, center, radius, cloudLevel, cloudRotation) {
    if (cloudLevel <= 0) {
        return;
    }

    const alpha = clamp(cloudLevel / 100, 0, 1) * 0.36;
    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, Math.PI * 2);
    ctx.clip();

    const offset = Math.floor((cloudRotation * 22) % 40);
    for (let y = -radius; y < radius; y += 6) {
        const stripeWidth = 6 + Math.abs(((y + offset) % 16) - 8);
        ctx.fillStyle = `rgba(245, 248, 255, ${(alpha * (0.4 + (stripeWidth / 20))).toFixed(3)})`;
        ctx.fillRect(center - radius + offset - 20, center + y, (radius * 2) + 40, 2);
    }

    ctx.restore();
}

function drawAtmosphere(ctx, center, radius, color, level) {
    if (level <= 0) {
        return;
    }

    const alpha = clamp(level / 100, 0, 1) * 0.6;
    const gradient = ctx.createRadialGradient(
        center, center, radius * 0.84,
        center, center, radius * 1.34
    );
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha.toFixed(3)})`);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(center, center, radius * 1.34, 0, Math.PI * 2);
    ctx.fill();
}

function computeSpriteIndex(seed, terrain, spriteCount) {
    const terrainOffset = TERRAIN_TO_VARIANT[terrain] ?? 0;
    return Math.abs((Number(seed) || 1) + (terrainOffset * 7)) % spriteCount;
}

export function renderPlanetAtlas(canvas, params) {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        return;
    }

    const size = canvas.width;
    const center = size / 2;
    const radius = (size / 2) - 10;

    const seed = Number(params.seed) || 1;
    const paletteKey = params.palette || 'earth';
    const terrain = params.terrain || 'mixed';
    const cloudLevel = clamp(Number(params.clouds ?? 50), 0, 100);
    const atmosphereLevel = clamp(Number(params.atmosphere ?? 50), 0, 100);
    const ringType = params.ringType || 'none';
    const rotation = Number(params.rotation) || 0;
    const cloudRotation = Number(params.cloudRotation) || 0;

    const atlas = getAtlas(paletteKey);
    const spriteIndex = computeSpriteIndex(seed, terrain, atlas.spriteCount);
    const spriteX = (spriteIndex % atlas.grid) * atlas.cellSize;
    const spriteY = Math.floor(spriteIndex / atlas.grid) * atlas.cellSize;

    ctx.imageSmoothingEnabled = false;
    drawStars(ctx, size, seed, rotation);

    if (ringType !== 'none') {
        drawRing(ctx, center, radius, atlas.palette.ring, ringType, false);
    }

    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, Math.PI * 2);
    ctx.clip();

    const bodySize = radius * 2;
    ctx.drawImage(
        atlas.canvas,
        spriteX,
        spriteY,
        atlas.cellSize,
        atlas.cellSize,
        center - radius,
        center - radius,
        bodySize,
        bodySize
    );

    const phase = (rotation * 0.35) % 1;
    const nightAlpha = 0.22 + (Math.sin(phase * Math.PI * 2) * 0.08);
    const terminator = ctx.createLinearGradient(center - radius, center, center + radius, center);
    terminator.addColorStop(clamp(0.22 + phase, 0.02, 0.98), `rgba(0,0,0,${clamp(nightAlpha, 0.12, 0.38).toFixed(3)})`);
    terminator.addColorStop(1, 'rgba(0,0,0,0.02)');
    ctx.fillStyle = terminator;
    ctx.fillRect(center - radius, center - radius, bodySize, bodySize);

    drawClouds(ctx, center, radius, cloudLevel, cloudRotation);

    ctx.restore();

    if (ringType !== 'none') {
        drawRing(ctx, center, radius, atlas.palette.ring, ringType, true);
    }

    drawAtmosphere(ctx, center, radius, atlas.palette.atmosphere, atmosphereLevel);

    return {
        atlasIndex: spriteIndex,
        renderMode: 'atlas-v1'
    };
}

export function normalizePlanetParams(input) {
    const base = input || {};

    const legacyRing = typeof base.ring === 'boolean' ? (base.ring ? 'thin' : 'none') : null;
    const legacyTerrain = base.noiseScale != null
        ? (Number(base.noiseScale) > 70 ? 'rough' : Number(base.noiseScale) < 30 ? 'smooth' : 'mixed')
        : null;

    return {
        seed: clamp(Number(base.seed) || 1, 1, 999999),
        palette: base.palette || 'earth',
        terrain: base.terrain || legacyTerrain || 'mixed',
        clouds: clamp(Number(base.clouds ?? base.waterLevel ?? 45), 0, 100),
        atmosphere: clamp(Number(base.atmosphere ?? 60), 0, 100),
        ringType: base.ringType || legacyRing || 'none',
        rotation: Number(base.rotation) || 0,
        cloudRotation: Number(base.cloudRotation) || 0,
        renderMode: 'atlas-v1'
    };
}
