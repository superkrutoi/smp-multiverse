export class SceneManager {
    constructor() {
        this.current = null;
    }

    setScene(scene) {
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
        this.rafId = 0;
        this.running = false;
        this.lastTime = 0;
        this.loop = this.loop.bind(this);
    }

    start() {
        if (this.running) {
            return;
        }

        this.running = true;
        this.lastTime = 0;
        this.rafId = requestAnimationFrame(this.loop);
    }

    stop() {
        this.running = false;
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = 0;
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

        this.rafId = requestAnimationFrame(this.loop);
    }
}
