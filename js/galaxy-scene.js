import { Camera } from './webgl/camera.js';
import { initWebGL2, resizeCanvasToDisplaySize, createTextureFromImage } from './webgl/glcore.js';
import { BatchInstancing } from './webgl/batch-instancing.js';
import { Renderer } from './webgl/renderer.js';
import { buildPlanetAtlas } from './generation/planet-generator.js';

function mulberry32(seedValue) {
    let t = seedValue >>> 0;
    return function next() {
        t += 0x6D2B79F5;
        let r = Math.imul(t ^ (t >>> 15), 1 | t);
        r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
        return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
}

function generateObjects(count, worldRadius, atlasCount, seed = 1337) {
    const rand = mulberry32(seed);
    const objects = [];

    for (let i = 0; i < count; i += 1) {
        const angle = rand() * Math.PI * 2;
        const radius = Math.sqrt(rand()) * worldRadius;
        objects.push({
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius,
            size: 8 + rand() * 20,
            rotation: rand() * Math.PI * 2,
            rotationSpeed: (rand() - 0.5) * 0.6,
            texIdx: Math.floor(rand() * atlasCount)
        });
    }

    return objects;
}

export class GalaxyScene {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.camera = new Camera();
        this.objectCount = options.objectCount || 10000;
        this.worldRadius = options.worldRadius || 12000;

        this.gl = null;
        this.renderer = null;
        this.batch = null;
        this.atlasTexture = null;
        this.atlasGrid = 1;
        this.atlasCount = 16;
        this.atlasReady = false;
        this.planetData = [];
        this.objects = [];
        this.elapsed = 0;
        this.disposed = false;

        this.dragging = false;
        this.lastPointerX = 0;
        this.lastPointerY = 0;

        this.onPointerDown = this.onPointerDown.bind(this);
        this.onPointerMove = this.onPointerMove.bind(this);
        this.onPointerUp = this.onPointerUp.bind(this);
        this.onWheel = this.onWheel.bind(this);
        this.onResize = this.onResize.bind(this);
    }

    init() {
        this.disposed = false;
        this.gl = initWebGL2(this.canvas);
        this.renderer = new Renderer(this.gl);
        this.batch = new BatchInstancing(this.gl, this.objectCount);
        this.objects = generateObjects(this.objectCount, this.worldRadius, this.atlasCount);

        this.prepareAtlas();

        this.canvas.addEventListener('pointerdown', this.onPointerDown);
        window.addEventListener('pointermove', this.onPointerMove);
        window.addEventListener('pointerup', this.onPointerUp);
        this.canvas.addEventListener('wheel', this.onWheel, { passive: false });
        window.addEventListener('resize', this.onResize);

        this.onResize();
    }

    async prepareAtlas() {
        const atlas = await buildPlanetAtlas({
            count: this.atlasCount,
            cellSize: 64,
            style: 'cube',
            baseSeed: 7000
        });

        if (!this.gl || this.disposed) {
            return;
        }

        if (this.atlasTexture) {
            this.gl.deleteTexture(this.atlasTexture);
        }

        this.atlasTexture = createTextureFromImage(this.gl, atlas.image);
        this.atlasGrid = atlas.grid;
        this.planetData = atlas.entries;
        this.atlasReady = true;

        if (atlas.image && typeof atlas.image.close === 'function') {
            atlas.image.close();
        }
    }

    dispose() {
        this.disposed = true;
        this.canvas.removeEventListener('pointerdown', this.onPointerDown);
        window.removeEventListener('pointermove', this.onPointerMove);
        window.removeEventListener('pointerup', this.onPointerUp);
        this.canvas.removeEventListener('wheel', this.onWheel);
        window.removeEventListener('resize', this.onResize);

        if (this.batch) {
            this.batch.dispose();
        }

        if (this.renderer) {
            this.renderer.dispose();
        }

        if (this.atlasTexture) {
            this.gl.deleteTexture(this.atlasTexture);
        }

        this.gl = null;
    }

    onResize() {
        resizeCanvasToDisplaySize(this.gl, this.canvas);
    }

    onPointerDown(event) {
        this.dragging = true;
        this.lastPointerX = event.clientX;
        this.lastPointerY = event.clientY;
        this.canvas.setPointerCapture(event.pointerId);
    }

    onPointerMove(event) {
        if (!this.dragging) {
            return;
        }

        const dx = event.clientX - this.lastPointerX;
        const dy = event.clientY - this.lastPointerY;

        this.lastPointerX = event.clientX;
        this.lastPointerY = event.clientY;

        this.camera.pan(-dx / this.camera.zoom, dy / this.camera.zoom);
    }

    onPointerUp(event) {
        this.dragging = false;
        if (this.canvas.hasPointerCapture(event.pointerId)) {
            this.canvas.releasePointerCapture(event.pointerId);
        }
    }

    onWheel(event) {
        event.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const localX = event.clientX - rect.left;
        const localY = event.clientY - rect.top;

        const factor = event.deltaY < 0 ? 1.1 : (1 / 1.1);
        this.camera.zoomAt(localX, localY, factor, this.canvas.clientWidth, this.canvas.clientHeight);
    }

    update(dt) {
        this.elapsed += dt;
        for (const object of this.objects) {
            object.rotation += object.rotationSpeed * dt;
        }
    }

    render() {
        const viewWidth = this.canvas.clientWidth;
        const viewHeight = this.canvas.clientHeight;
        this.renderer.clear(0.0, 0.0, 0.0, 1.0);
        this.renderer.drawBackground(
            viewWidth,
            viewHeight,
            this.camera.x,
            this.camera.y,
            this.camera.zoom,
            this.elapsed
        );

        this.batch.begin();
        if (!this.atlasReady || !this.atlasTexture) {
            return;
        }

        for (const object of this.objects) {
            if (!this.camera.isInView(object.x, object.y, object.size, viewWidth, viewHeight)) {
                continue;
            }

            this.batch.push(
                object.x,
                object.y,
                object.size,
                object.rotation,
                object.texIdx
            );
        }

        const matrix = this.camera.getMatrix(viewWidth, viewHeight);
        this.renderer.drawBatch(this.batch, matrix, this.atlasTexture, this.atlasGrid);
    }
}

export { GalaxyScene as GalaxyBootstrapScene };
