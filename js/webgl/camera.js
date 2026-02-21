export class Camera {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.zoom = 1;
        this.minZoom = 0.2;
        this.maxZoom = 8;
    }

    pan(deltaX, deltaY) {
        this.x += deltaX;
        this.y += deltaY;
    }

    setZoom(nextZoom) {
        this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, nextZoom));
    }

    zoomAt(screenX, screenY, factor, viewWidth, viewHeight) {
        const before = this.screenToWorld(screenX, screenY, viewWidth, viewHeight);
        this.setZoom(this.zoom * factor);
        const after = this.screenToWorld(screenX, screenY, viewWidth, viewHeight);
        this.pan(before.x - after.x, before.y - after.y);
    }

    screenToWorld(screenX, screenY, viewWidth, viewHeight) {
        return {
            x: this.x + (screenX - (viewWidth * 0.5)) / this.zoom,
            y: this.y - (screenY - (viewHeight * 0.5)) / this.zoom
        };
    }

    getMatrix(viewWidth, viewHeight) {
        const sx = (2 * this.zoom) / viewWidth;
        const sy = (2 * this.zoom) / viewHeight;

        return new Float32Array([
            sx, 0, 0,
            0, -sy, 0,
            -this.x * sx, this.y * sy, 1
        ]);
    }

    isInView(worldX, worldY, radius, viewWidth, viewHeight) {
        const halfW = (viewWidth / this.zoom) * 0.5 + radius;
        const halfH = (viewHeight / this.zoom) * 0.5 + radius;
        return (
            worldX >= this.x - halfW &&
            worldX <= this.x + halfW &&
            worldY >= this.y - halfH &&
            worldY <= this.y + halfH
        );
    }
}
