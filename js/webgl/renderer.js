import {
    createProgram,
    SPRITE_FRAGMENT_SHADER,
    SPRITE_VERTEX_SHADER,
    STARFIELD_FRAGMENT_SHADER,
    STARFIELD_VERTEX_SHADER
} from './shader.js';

export class Renderer {
    constructor(gl) {
        this.gl = gl;
        this.program = createProgram(gl, SPRITE_VERTEX_SHADER, SPRITE_FRAGMENT_SHADER);
        this.backgroundProgram = createProgram(gl, STARFIELD_VERTEX_SHADER, STARFIELD_FRAGMENT_SHADER);

        this.backgroundQuad = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.backgroundQuad);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -1, -1,
             1, -1,
            -1, 1,
            -1, 1,
             1, -1,
             1, 1
        ]), gl.STATIC_DRAW);

        this.uCamera = gl.getUniformLocation(this.program, 'uCamera');
        this.uAtlas = gl.getUniformLocation(this.program, 'uAtlas');
        this.uAtlasGrid = gl.getUniformLocation(this.program, 'uAtlasGrid');

        this.uBgResolution = gl.getUniformLocation(this.backgroundProgram, 'uResolution');
        this.uBgCamera = gl.getUniformLocation(this.backgroundProgram, 'uCamera');
        this.uBgZoom = gl.getUniformLocation(this.backgroundProgram, 'uZoom');
        this.uBgTime = gl.getUniformLocation(this.backgroundProgram, 'uTime');
    }

    clear(r = 0.03, g = 0.03, b = 0.08, a = 1) {
        this.gl.clearColor(r, g, b, a);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    }

    drawBackground(width, height, cameraX, cameraY, zoom, timeSeconds) {
        const gl = this.gl;

        gl.useProgram(this.backgroundProgram);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.backgroundQuad);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

        gl.uniform2f(this.uBgResolution, width, height);
        gl.uniform2f(this.uBgCamera, cameraX, cameraY);
        gl.uniform1f(this.uBgZoom, zoom);
        gl.uniform1f(this.uBgTime, timeSeconds);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    drawBatch(batch, cameraMatrix, texture, atlasGrid = 1) {
        const gl = this.gl;
        gl.useProgram(this.program);

        gl.uniformMatrix3fv(this.uCamera, false, cameraMatrix);
        gl.uniform1f(this.uAtlasGrid, atlasGrid);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(this.uAtlas, 0);

        batch.bind();
        batch.upload();
        batch.draw();
    }

    dispose() {
        this.gl.deleteBuffer(this.backgroundQuad);
        this.gl.deleteProgram(this.backgroundProgram);
        this.gl.deleteProgram(this.program);
    }
}
