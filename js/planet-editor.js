function seededRandom(seedValue) {
    let seed = Math.floor(Number(seedValue) || 1) % 2147483647;
    if (seed <= 0) {
        seed += 2147483646;
    }

    return function next() {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
    };
}

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

    let params = {
        seed: randomSeed(),
        hue: 210,
        water: 40,
        atmosphere: 60,
        craters: 35,
        ring: false
    };

    function drawPlanet() {
        const size = 96;
        const radius = 42;
        const centerX = Math.floor(canvas.width / 2);
        const centerY = Math.floor(canvas.height / 2);
        const x0 = centerX - Math.floor(size / 2);
        const y0 = centerY - Math.floor(size / 2);
        const rand = seededRandom(params.seed);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (params.ring) {
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(-0.38);
            ctx.fillStyle = 'rgba(190, 210, 255, 0.45)';
            ctx.fillRect(-58, -6, 116, 12);
            ctx.fillStyle = 'rgba(100, 120, 170, 0.5)';
            ctx.fillRect(-50, -2, 100, 4);
            ctx.restore();
        }

        for (let y = 0; y < size; y += 1) {
            for (let x = 0; x < size; x += 1) {
                const dx = x - size / 2;
                const dy = y - size / 2;
                if ((dx * dx) + (dy * dy) > radius * radius) {
                    continue;
                }

                const noise = rand();
                const shade = rand();
                const polar = clamp((dy / radius + 1) / 2, 0, 1);

                const hue = params.hue;
                const sat = 55 + (params.water * 0.3);
                const light = clamp(42 + ((shade - 0.5) * 18), 24, 70);

                let color = `hsl(${hue}, ${sat}%, ${light}%)`;

                if (noise > (0.82 - params.craters / 200)) {
                    color = `hsl(${hue}, ${Math.max(25, sat - 35)}%, ${Math.max(15, light - 20)}%)`;
                }

                if (noise < (params.water / 200)) {
                    color = `hsl(${clamp(hue + 18, 0, 360)}, ${clamp(sat + 12, 20, 95)}%, ${clamp(light + 8, 18, 80)}%)`;
                }

                if (polar < 0.2 || polar > 0.8) {
                    color = `hsl(${clamp(hue - 6, 0, 360)}, ${Math.max(24, sat - 15)}%, ${clamp(light + 10, 22, 86)}%)`;
                }

                ctx.fillStyle = color;
                ctx.fillRect(x0 + x, y0 + y, 1, 1);
            }
        }

        if (params.atmosphere > 0) {
            ctx.strokeStyle = `hsla(${clamp(params.hue + 10, 0, 360)}, 90%, 72%, ${clamp(params.atmosphere / 100, 0.08, 0.75)})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius + 4, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    function syncFieldsFromParams() {
        fields.seed.value = String(params.seed);
        fields.hue.value = String(params.hue);
        fields.water.value = String(params.water);
        fields.atmosphere.value = String(params.atmosphere);
        fields.craters.value = String(params.craters);
        fields.ring.checked = Boolean(params.ring);
    }

    function syncParamsFromFields() {
        params.seed = clamp(Number(fields.seed.value) || 1, 1, 999999);
        params.hue = clamp(Number(fields.hue.value) || 0, 0, 360);
        params.water = clamp(Number(fields.water.value) || 0, 0, 100);
        params.atmosphere = clamp(Number(fields.atmosphere.value) || 0, 0, 100);
        params.craters = clamp(Number(fields.craters.value) || 0, 0, 100);
        params.ring = Boolean(fields.ring.checked);
    }

    function setParams(nextParams) {
        params = {
            ...params,
            ...(nextParams || {})
        };
        syncFieldsFromParams();
        drawPlanet();
    }

    function randomize() {
        params.seed = randomSeed();
        params.hue = Math.floor(Math.random() * 361);
        params.water = Math.floor(Math.random() * 101);
        params.atmosphere = Math.floor(Math.random() * 101);
        params.craters = Math.floor(Math.random() * 101);
        params.ring = Math.random() > 0.55;

        syncFieldsFromParams();
        drawPlanet();
    }

    function exportPlanet() {
        drawPlanet();
        return {
            preview: canvas.toDataURL('image/png'),
            params: { ...params }
        };
    }

    [fields.seed, fields.hue, fields.water, fields.atmosphere, fields.craters, fields.ring].forEach((field) => {
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
        getParams() {
            return { ...params };
        }
    };
}
