export class Camera2D {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.zoom = 1;
        this.minZoom = 0.2;
        this.maxZoom = 8;
    }

    setZoom(nextZoom) {
        this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, nextZoom));
    }

    getMatrix(viewWidth, viewHeight) {
        const halfW = viewWidth / 2;
        const halfH = viewHeight / 2;

        const sx = this.zoom / halfW;
        const sy = this.zoom / halfH;

        return new Float32Array([
            sx, 0, 0,
            0, -sy, 0,
            -this.x * sx, this.y * sy, 1
        ]);
    }

    inView(x, y, padding, viewWidth, viewHeight) {
        const worldHalfW = (viewWidth / this.zoom) * 0.5;
        const worldHalfH = (viewHeight / this.zoom) * 0.5;

        return (
            x >= this.x - worldHalfW - padding &&
            x <= this.x + worldHalfW + padding &&
            y >= this.y - worldHalfH - padding &&
            y <= this.y + worldHalfH + padding
        );
    }
}

export class SceneManager {
    constructor() {
        this.current = null;
    }

    set(scene) {
        if (this.current && typeof this.current.dispose === 'function') {
            this.current.dispose();
        }

        this.current = scene;
        if (this.current && typeof this.current.init === 'function') {
            this.current.init();
        }
    }

    update(dt) {
        if (this.current && typeof this.current.update === 'function') {
            this.current.update(dt);
        }
    }

    render() {
        if (this.current && typeof this.current.render === 'function') {
            this.current.render();
        }
    }
}

export class Engine {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        this.running = false;
        this.lastTime = 0;
        this.rafId = null;
    }

    start() {
        if (this.running) {
            return;
        }

        this.running = true;
        this.lastTime = 0;
        this.rafId = requestAnimationFrame((t) => this.loop(t));
    }

    stop() {
        if (!this.running) {
            return;
        }

        this.running = false;
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    }

    loop(time) {
        if (!this.running) {
            return;
        }

        if (!this.lastTime) {
            this.lastTime = time;
        }

        const dt = Math.min((time - this.lastTime) / 1000, 0.05);
        this.lastTime = time;

        this.sceneManager.update(dt);
        this.sceneManager.render();

        this.rafId = requestAnimationFrame((t) => this.loop(t));
    }
}

export function createProgram(gl, vertexSource, fragmentSource) {
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexSource);
    gl.compileShader(vertexShader);

    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        throw new Error(`Vertex shader error: ${gl.getShaderInfoLog(vertexShader)}`);
    }

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentSource);
    gl.compileShader(fragmentShader);

    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        throw new Error(`Fragment shader error: ${gl.getShaderInfoLog(fragmentShader)}`);
    }

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(`Program link error: ${gl.getProgramInfoLog(program)}`);
    }

    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    return program;
}
