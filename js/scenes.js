import { SceneManager, Engine } from './scene-manager.js';
import { GalaxyScene } from './galaxy-scene.js';

const canvas = document.getElementById('galaxy-webgl');
if (!canvas) {
    throw new Error('Canvas #galaxy-webgl not found');
}

const sceneManager = new SceneManager();
const engine = new Engine(sceneManager);

const galaxyScene = new GalaxyScene(canvas, { objectCount: 10000, worldRadius: 14000 });
sceneManager.setScene(galaxyScene);
engine.start();

window.addEventListener('beforeunload', () => {
    engine.stop();
    if (sceneManager.current && typeof sceneManager.current.dispose === 'function') {
        sceneManager.current.dispose();
    }
});

const zoomInButton = document.getElementById('zoom-in');
const zoomOutButton = document.getElementById('zoom-out');

if (zoomInButton) {
    zoomInButton.addEventListener('click', () => {
        galaxyScene.camera.setZoom(galaxyScene.camera.zoom * 1.2);
    });
}

if (zoomOutButton) {
    zoomOutButton.addEventListener('click', () => {
        galaxyScene.camera.setZoom(galaxyScene.camera.zoom / 1.2);
    });
}
