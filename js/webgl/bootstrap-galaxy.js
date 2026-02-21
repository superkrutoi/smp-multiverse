import { Camera2D, SceneManager, Engine } from './core.js';
import { GalaxyScene } from './galaxy-scene.js';

const canvas = document.getElementById('galaxy-webgl');
if (!canvas) {
    throw new Error('Canvas #galaxy-webgl not found');
}

const gl = canvas.getContext('webgl2', {
    antialias: false,
    alpha: false,
    powerPreference: 'high-performance'
});

if (!gl) {
    throw new Error('WebGL2 is not supported in this browser');
}

const camera = new Camera2D();
const sceneManager = new SceneManager();
const engine = new Engine(sceneManager);

const galaxyScene = new GalaxyScene({
    gl,
    camera,
    canvas,
    nodeCount: 10000,
    worldRadius: 18000
});

sceneManager.set(galaxyScene);
engine.start();

window.addEventListener('beforeunload', () => {
    engine.stop();
    if (sceneManager.current && typeof sceneManager.current.dispose === 'function') {
        sceneManager.current.dispose();
    }
});
