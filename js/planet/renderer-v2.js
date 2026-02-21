function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function lerp(a, b, t) {
    return a + ((b - a) * t);
}

function smoothStep(edge0, edge1, x) {
    const t = clamp((x - edge0) / Math.max(edge1 - edge0, 1e-6), 0, 1);
    return t * t * (3 - (2 * t));
}

function normalize(vector) {
    const length = Math.sqrt((vector.x * vector.x) + (vector.y * vector.y) + (vector.z * vector.z)) || 1;
    return {
        x: vector.x / length,
        y: vector.y / length,
        z: vector.z / length
    };
}

function dot(a, b) {
    return (a.x * b.x) + (a.y * b.y) + (a.z * b.z);
}

function hash3(x, y, z, seed) {
    const n = (x * 15731) ^ (y * 789221) ^ (z * 1376312589) ^ (seed * 1013);
    const value = Math.sin(n * 0.000123) * 43758.5453123;
    return (value - Math.floor(value)) * 2 - 1;
}

function valueNoise3D(x, y, z, seed) {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const z0 = Math.floor(z);
    const x1 = x0 + 1;
    const y1 = y0 + 1;
    const z1 = z0 + 1;

    const tx = smoothStep(0, 1, x - x0);
    const ty = smoothStep(0, 1, y - y0);
    const tz = smoothStep(0, 1, z - z0);

    const c000 = hash3(x0, y0, z0, seed);
    const c100 = hash3(x1, y0, z0, seed);
    const c010 = hash3(x0, y1, z0, seed);
    const c110 = hash3(x1, y1, z0, seed);
    const c001 = hash3(x0, y0, z1, seed);
    const c101 = hash3(x1, y0, z1, seed);
    const c011 = hash3(x0, y1, z1, seed);
    const c111 = hash3(x1, y1, z1, seed);

    const nx00 = lerp(c000, c100, tx);
    const nx10 = lerp(c010, c110, tx);
    const nx01 = lerp(c001, c101, tx);
    const nx11 = lerp(c011, c111, tx);

    const nxy0 = lerp(nx00, nx10, ty);
    const nxy1 = lerp(nx01, nx11, ty);

    return lerp(nxy0, nxy1, tz);
}

function fbm3D(x, y, z, seed, octaves = 5) {
    let value = 0;
    let amplitude = 0.5;
    let frequency = 1;

    for (let i = 0; i < octaves; i += 1) {
        value += amplitude * valueNoise3D(x * frequency, y * frequency, z * frequency, seed + i * 37);
        frequency *= 2;
        amplitude *= 0.5;
    }

    return value;
}

function rotateY(vector, angle) {
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);
    return {
        x: (vector.x * cos) - (vector.z * sin),
        y: vector.y,
        z: (vector.x * sin) + (vector.z * cos)
    };
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

function bayer2x2(x, y) {
    const matrix = [
        [0, 2],
        [3, 1]
    ];
    return matrix[y % 2][x % 2] / 4;
}

function hexToRgb(hex) {
    const value = Number.parseInt(hex.replace('#', ''), 16);
    return {
        r: (value >> 16) & 255,
        g: (value >> 8) & 255,
        b: value & 255
    };
}

function mixColor(a, b, t) {
    return {
        r: Math.round(lerp(a.r, b.r, t)),
        g: Math.round(lerp(a.g, b.g, t)),
        b: Math.round(lerp(a.b, b.b, t))
    };
}

function shadeColor(color, factor) {
    return {
        r: clamp(Math.round(color.r * factor), 0, 255),
        g: clamp(Math.round(color.g * factor), 0, 255),
        b: clamp(Math.round(color.b * factor), 0, 255)
    };
}

const PALETTES = {
    earth: {
        water: ['#153d8f', '#1e54bf'],
        land: ['#5a9f4a', '#44783a', '#2f5429'],
        ice: ['#d9efff', '#eef8ff'],
        atmosphere: { r: 125, g: 176, b: 255 },
        ring: { r: 183, g: 198, b: 230 }
    },
    lava: {
        water: ['#4c0900', '#7e1200'],
        land: ['#ff8a19', '#d94700', '#811200'],
        ice: ['#ffd26b', '#fff3c4'],
        atmosphere: { r: 255, g: 108, b: 26 },
        ring: { r: 255, g: 126, b: 51 }
    },
    ice: {
        water: ['#5ba8d9', '#6dc0f2'],
        land: ['#d5ecf9', '#b3d8ec', '#8ebdd8'],
        ice: ['#f2fcff', '#ffffff'],
        atmosphere: { r: 177, g: 225, b: 255 },
        ring: { r: 182, g: 220, b: 255 }
    },
    toxic: {
        water: ['#2d5d13', '#3a7f17'],
        land: ['#8ecf2a', '#5f9620', '#355713'],
        ice: ['#d7ff9f', '#edffd0'],
        atmosphere: { r: 166, g: 255, b: 77 },
        ring: { r: 201, g: 255, b: 128 }
    }
};

const STAR_CACHE = new Map();

function createStarLayer(seed, width, height, count, depth) {
    const rand = mulberry32(seed);
    const stars = [];

    for (let i = 0; i < count; i += 1) {
        stars.push({
            x: rand() * width,
            y: rand() * height,
            size: rand() > 0.88 ? 2 : 1,
            twinkle: rand() * Math.PI * 2,
            depth
        });
    }

    return stars;
}

function getStarLayers(seed, size) {
    const key = `${seed}:${size}`;
    if (STAR_CACHE.has(key)) {
        return STAR_CACHE.get(key);
    }

    const layers = {
        far: createStarLayer(seed + 41, size, size, 44, 0.05),
        mid: createStarLayer(seed + 73, size, size, 74, 0.1),
        near: createStarLayer(seed + 97, size, size, 108, 0.2)
    };

    STAR_CACHE.set(key, layers);
    return layers;
}

function drawStars(ctx, size, layers, rotation, cloudRotation) {
    ctx.fillStyle = '#090914';
    ctx.fillRect(0, 0, size, size);

    const drawLayer = (stars, boost) => {
        for (const star of stars) {
            const shift = (rotation * star.depth * 70) + (cloudRotation * 35 * star.depth);
            let x = star.x - shift;
            if (x < -2) {
                x += size + 4;
            }
            if (x > size + 2) {
                x -= size + 4;
            }
            const alpha = 0.32 + (Math.sin((rotation * 1.8) + star.twinkle) * 0.18) + boost;
            ctx.fillStyle = `rgba(232, 240, 255, ${clamp(alpha, 0.15, 0.82)})`;
            ctx.fillRect(Math.round(x), Math.round(star.y), star.size, star.size);
        }
    };

    drawLayer(layers.far, 0.0);
    drawLayer(layers.mid, 0.06);
    drawLayer(layers.near, 0.12);
}

function generateCraters(seed, count) {
    const rand = mulberry32((seed * 73856093) ^ 0x9e3779b9);
    const craters = [];

    for (let i = 0; i < count; i += 1) {
        let x = 0;
        let y = 0;
        let attempts = 0;

        do {
            x = rand() * 2 - 1;
            y = rand() * 2 - 1;
            attempts += 1;
        } while (((x * x) + (y * y) > 0.92) && attempts < 8);

        craters.push({
            x,
            y,
            radius: 0.04 + (rand() * 0.1),
            depth: 0.08 + (rand() * 0.2)
        });
    }

    return craters;
}

function applyCraters(sampleX, sampleY, craters) {
    let delta = 0;

    for (const crater of craters) {
        const dx = sampleX - crater.x;
        const dy = sampleY - crater.y;
        const distance = Math.sqrt((dx * dx) + (dy * dy));

        if (distance < crater.radius) {
            const t = distance / crater.radius;
            const shape = (1 - (t * t)) * crater.depth;
            delta -= shape;
            continue;
        }

        if (distance < crater.radius * 1.2) {
            const rimT = (distance - crater.radius) / (crater.radius * 0.2);
            delta += 0.02 * (1 - rimT);
        }
    }

    return delta;
}

function heightToLandColor(height01, palette) {
    if (height01 < 0.6) {
        return hexToRgb(palette.land[0]);
    }

    if (height01 < 0.78) {
        return hexToRgb(palette.land[1]);
    }

    return hexToRgb(palette.land[2]);
}

function drawAtmosphere(ctx, center, radius, color, intensity) {
    const alpha = clamp(intensity / 100, 0, 1) * 0.65;
    const gradient = ctx.createRadialGradient(
        center, center, radius * 0.88,
        center, center, radius * 1.35
    );
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha.toFixed(3)})`);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(center, center, radius * 1.35, 0, Math.PI * 2);
    ctx.fill();
}

function ringNoise(angle, radiusNorm, seed) {
    const x = Math.cos(angle) * radiusNorm;
    const y = Math.sin(angle) * radiusNorm;
    return fbm3D(x * 2.2, y * 2.2, radiusNorm * 0.5, seed + 701, 3);
}

function drawRingPart(ctx, center, radius, ringColor, seed, front) {
    const inner = radius * 1.18;
    const outer = radius * 1.64;
    const tilt = -0.42;

    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(tilt);
    ctx.scale(1, 0.42);

    for (let r = inner; r <= outer; r += 1) {
        const radiusNorm = (r - inner) / Math.max(outer - inner, 1);
        const segments = 180;
        for (let i = 0; i < segments; i += 1) {
            const angle = (i / segments) * Math.PI * 2;
            if (front && angle > Math.PI) {
                continue;
            }
            if (!front && angle <= Math.PI) {
                continue;
            }

            const n = ringNoise(angle, radiusNorm + 0.001, seed);
            const alphaBase = 0.14 + (n * 0.12) + (0.1 * (1 - Math.abs(radiusNorm - 0.5)));
            const alpha = clamp(front ? alphaBase * 1.08 : alphaBase * 0.76, 0.03, 0.48);
            const x = Math.cos(angle) * r;
            const y = Math.sin(angle) * r;

            ctx.fillStyle = `rgba(${ringColor.r}, ${ringColor.g}, ${ringColor.b}, ${alpha.toFixed(3)})`;
            ctx.fillRect(x, y, 1, 1);
        }
    }

    if (!front) {
        ctx.globalCompositeOperation = 'multiply';
        ctx.beginPath();
        ctx.scale(1, 1 / 0.42);
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.fill();
    }

    ctx.restore();
}

function calculateHeight(sampleNormal, seed, noiseScale, rotation) {
    const sx = (sampleNormal.x * noiseScale * 2) + rotation;
    const sy = sampleNormal.y * noiseScale * 2;
    const sz = sampleNormal.z * noiseScale * 2;
    const raw = fbm3D(sx, sy, sz, seed, 6);
    return clamp((raw + 1) / 2, 0, 1);
}

function computeBumpNormal(sampleNormal, seed, noiseScale, rotation) {
    const e = 0.025;
    const hL = calculateHeight({ x: sampleNormal.x - e, y: sampleNormal.y, z: sampleNormal.z }, seed, noiseScale, rotation);
    const hR = calculateHeight({ x: sampleNormal.x + e, y: sampleNormal.y, z: sampleNormal.z }, seed, noiseScale, rotation);
    const hD = calculateHeight({ x: sampleNormal.x, y: sampleNormal.y - e, z: sampleNormal.z }, seed, noiseScale, rotation);
    const hU = calculateHeight({ x: sampleNormal.x, y: sampleNormal.y + e, z: sampleNormal.z }, seed, noiseScale, rotation);

    return normalize({
        x: hL - hR,
        y: hD - hU,
        z: 1
    });
}

export function renderPlanetV2(canvas, params) {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        return;
    }

    const size = canvas.width;
    const center = size / 2;
    const radius = (size / 2) - 10;
    const seed = Number(params.seed) || 1;
    const rotation = Number(params.rotation) || 0;
    const cloudRotation = Number(params.cloudRotation) || 0;
    const palette = PALETTES[params.palette] || PALETTES.earth;
    const waterLevel = clamp((params.waterLevel ?? 50) / 100, 0.1, 0.9);
    const noiseScale = 1 + ((params.noiseScale ?? 40) / 25);
    const craterLevel = clamp((params.craters ?? 30) / 100, 0, 1);

    const craterCount = Math.floor(10 + (craterLevel * 48));
    const craters = generateCraters(seed + 911, craterCount);

    const stars = getStarLayers(seed, size);

    ctx.clearRect(0, 0, size, size);
    drawStars(ctx, size, stars, rotation, cloudRotation);

    if (params.ring) {
        drawRingPart(ctx, center, radius, palette.ring, seed, false);
    }

    const imageData = ctx.createImageData(size, size);
    const data = imageData.data;
    const lightDir = normalize({ x: 0.8, y: -0.3, z: 0.5 });

    for (let y = 0; y < size; y += 1) {
        for (let x = 0; x < size; x += 1) {
            const index = (y * size + x) * 4;
            const dx = (x - center) / radius;
            const dy = (y - center) / radius;
            const distSq = (dx * dx) + (dy * dy);

            if (distSq > 1) {
                data[index + 3] = 0;
                continue;
            }

            const dz = Math.sqrt(1 - distSq);
            const normal = normalize({ x: dx, y: dy, z: dz });
            const sampleNormal = rotateY(normal, rotation);

            const baseHeight = calculateHeight(sampleNormal, seed, noiseScale, rotation);
            const craterDelta = applyCraters(sampleNormal.x, sampleNormal.y, craters);
            const height = clamp(baseHeight + craterDelta, 0, 1);
            const temperature = 1 - Math.abs(normal.y);

            let color;
            if (height < waterLevel) {
                const t = clamp(height / Math.max(waterLevel, 0.01), 0, 1);
                color = mixColor(hexToRgb(palette.water[0]), hexToRgb(palette.water[1]), t);
            } else if (temperature < 0.26) {
                const t = clamp((0.26 - temperature) / 0.26, 0, 1);
                color = mixColor(hexToRgb(palette.ice[0]), hexToRgb(palette.ice[1]), t);
            } else {
                color = heightToLandColor(height, palette);
            }

            const cloudRaw = fbm3D(
                sampleNormal.x * 3 + cloudRotation,
                sampleNormal.y * 3,
                sampleNormal.z * 3,
                seed + 501,
                4
            );
            const cloudMask = smoothStep(0.55, 0.7, (cloudRaw + 1) / 2);
            if (cloudMask > 0.01) {
                color = mixColor(color, { r: 255, g: 255, b: 255 }, clamp(cloudMask * 0.7, 0, 0.7));
            }

            const bumpNormal = computeBumpNormal(sampleNormal, seed, noiseScale, rotation);
            const diffuse = Math.max(dot(bumpNormal, lightDir), 0);
            const ambient = 0.25;
            const lighting = ambient + (diffuse * 0.8);

            const rim = Math.pow(1 - Math.abs(dot(normal, lightDir)), 3);
            const shaded = shadeColor(color, clamp(lighting, 0.22, 1.35));
            const rimMix = clamp(rim * (params.atmosphere / 100) * 0.4, 0, 0.45);
            const withRim = mixColor(shaded, palette.atmosphere, rimMix);

            const edgeDistance = Math.sqrt(distSq);
            const edgeFade = smoothStep(0, 1, clamp((1 - edgeDistance) / 0.12, 0, 1));
            const dither = bayer2x2(x, y) * 6 - 3;

            data[index] = clamp(withRim.r + dither, 0, 255);
            data[index + 1] = clamp(withRim.g + dither, 0, 255);
            data[index + 2] = clamp(withRim.b + dither, 0, 255);
            data[index + 3] = Math.round(255 * edgeFade);
        }
    }

    ctx.putImageData(imageData, 0, 0);

    if (params.atmosphere > 0) {
        drawAtmosphere(ctx, center, radius, palette.atmosphere, params.atmosphere);
    }

    if (params.ring) {
        drawRingPart(ctx, center, radius, palette.ring, seed, true);
    }
}
