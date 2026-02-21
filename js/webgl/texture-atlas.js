function createCanvas(size) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    return canvas;
}

function drawDotSprite(ctx, x, y, cell) {
    const cx = x + (cell / 2);
    const cy = y + (cell / 2);
    const r = cell * 0.24;

    ctx.fillStyle = 'rgba(140, 220, 255, 0.95)';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(220, 245, 255, 0.9)';
    ctx.fillRect(Math.round(cx - 1), Math.round(cy - 1), 2, 2);
}

function drawNebulaSprite(ctx, x, y, cell) {
    const grad = ctx.createRadialGradient(
        x + cell * 0.5,
        y + cell * 0.5,
        cell * 0.08,
        x + cell * 0.5,
        y + cell * 0.5,
        cell * 0.48
    );
    grad.addColorStop(0, 'rgba(170, 120, 255, 0.85)');
    grad.addColorStop(0.6, 'rgba(90, 180, 255, 0.4)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(x, y, cell, cell);
}

function drawCrossSprite(ctx, x, y, cell) {
    const c = Math.floor(cell / 2);
    ctx.fillStyle = 'rgba(175, 255, 205, 0.95)';
    ctx.fillRect(x + c - 1, y + 2, 2, cell - 4);
    ctx.fillRect(x + 2, y + c - 1, cell - 4, 2);
}

function drawDiamondSprite(ctx, x, y, cell) {
    const cx = x + (cell / 2);
    const cy = y + (cell / 2);
    const r = cell * 0.34;

    ctx.fillStyle = 'rgba(255, 220, 130, 0.9)';
    ctx.beginPath();
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx + r, cy);
    ctx.lineTo(cx, cy + r);
    ctx.lineTo(cx - r, cy);
    ctx.closePath();
    ctx.fill();
}

function drawPixelCluster(ctx, x, y, cell) {
    const points = [
        [0.3, 0.3, 2],
        [0.55, 0.4, 2],
        [0.4, 0.6, 2],
        [0.65, 0.65, 1]
    ];

    ctx.fillStyle = 'rgba(130, 190, 255, 0.92)';
    for (const [px, py, s] of points) {
        ctx.fillRect(x + Math.floor(px * cell), y + Math.floor(py * cell), s, s);
    }
}

function buildAtlasCanvas(cellSize = 16, grid = 4) {
    const atlasSize = cellSize * grid;
    const canvas = createCanvas(atlasSize);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, atlasSize, atlasSize);
    ctx.imageSmoothingEnabled = false;

    const drawFns = [
        drawDotSprite,
        drawNebulaSprite,
        drawCrossSprite,
        drawDiamondSprite,
        drawPixelCluster
    ];

    drawFns.forEach((drawFn, index) => {
        const gx = index % grid;
        const gy = Math.floor(index / grid);
        const x = gx * cellSize;
        const y = gy * cellSize;
        drawFn(ctx, x, y, cellSize);
    });

    return {
        canvas,
        grid,
        cellSize,
        spriteCount: drawFns.length
    };
}

export function createProceduralAtlas(gl, options = {}) {
    const cellSize = options.cellSize || 16;
    const grid = options.grid || 4;
    const atlas = buildAtlasCanvas(cellSize, grid);

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 0);
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        atlas.canvas
    );

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    return {
        texture,
        grid,
        spriteCount: atlas.spriteCount,
        dispose() {
            gl.deleteTexture(texture);
        }
    };
}
