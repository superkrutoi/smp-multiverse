import { createProgram } from './core.js';
import { createProceduralAtlas } from './texture-atlas.js';

const VERTEX_SHADER = `#version 300 es
precision mediump float;

layout(location=0) in vec2 a_position;
layout(location=1) in vec2 i_pos;
layout(location=2) in float i_size;
layout(location=3) in float i_rotation;
layout(location=4) in float i_texIndex;

uniform mat3 u_camera;
uniform float u_atlasGrid;

out vec2 v_uv;
flat out float v_texIndex;

void main() {
    mat2 rot = mat2(
        cos(i_rotation), -sin(i_rotation),
        sin(i_rotation),  cos(i_rotation)
    );

    vec2 world = i_pos + rot * (a_position * i_size);
    vec3 projected = u_camera * vec3(world, 1.0);

    gl_Position = vec4(projected.xy, 0.0, 1.0);
    v_uv = a_position + 0.5;
    v_texIndex = i_texIndex;
}
`;

const FRAGMENT_SHADER = `#version 300 es
precision mediump float;

in vec2 v_uv;
flat in float v_texIndex;

uniform sampler2D u_atlas;
uniform float u_atlasGrid;

out vec4 outColor;

void main() {
    float grid = u_atlasGrid;
    float tx = mod(v_texIndex, grid);
    float ty = floor(v_texIndex / grid);

    vec2 cellUV = (vec2(tx, ty) + v_uv) / grid;
    vec4 color = texture(u_atlas, cellUV);

    if (color.a < 0.08) {
        discard;
    }

    outColor = color;
}
`;

function mulberry32(seedValue) {
    let t = seedValue >>> 0;
    return function next() {
        t += 0x6D2B79F5;
        let r = Math.imul(t ^ (t >>> 15), 1 | t);
        r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
        return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
}

function generateUniverseNodes(count, worldRadius, spriteCount, seed = 1357) {
    const rand = mulberry32(seed);
    const nodes = [];

    for (let i = 0; i < count; i += 1) {
        const angle = rand() * Math.PI * 2;
        const radius = Math.sqrt(rand()) * worldRadius;

        nodes.push({
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius,
            size: 5 + rand() * 14,
            rotation: rand() * Math.PI * 2,
            rotSpeed: (rand() - 0.5) * 0.5,
            texIndex: Math.floor(rand() * spriteCount)
        });
    }

    return nodes;
}

export class GalaxyScene {
    constructor({ gl, camera, canvas, nodeCount = 6000, worldRadius = 12000 }) {
        this.gl = gl;
        this.camera = camera;
        this.canvas = canvas;
        this.nodeCount = nodeCount;
        this.worldRadius = worldRadius;

        this.program = null;
        this.vao = null;
        this.instanceBuffer = null;

        this.uCameraLocation = null;
        this.uAtlasGridLocation = null;
        this.uAtlasLocation = null;

        this.atlas = null;

        this.nodes = [];
        this.visibleInstances = new Float32Array(this.nodeCount * 5);
        this.visibleCount = 0;

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
        const gl = this.gl;

        this.program = createProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER);
        this.uCameraLocation = gl.getUniformLocation(this.program, 'u_camera');
        this.uAtlasGridLocation = gl.getUniformLocation(this.program, 'u_atlasGrid');
        this.uAtlasLocation = gl.getUniformLocation(this.program, 'u_atlas');

        this.atlas = createProceduralAtlas(gl, { cellSize: 16, grid: 4 });
        this.nodes = generateUniverseNodes(this.nodeCount, this.worldRadius, this.atlas.spriteCount);

        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);

        const quadBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -0.5, -0.5,
            0.5, -0.5,
            0.5, 0.5,
            -0.5, -0.5,
            0.5, 0.5,
            -0.5, 0.5
        ]), gl.STATIC_DRAW);

        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

        this.instanceBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.visibleInstances.byteLength, gl.DYNAMIC_DRAW);

        const stride = 5 * 4;

        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, stride, 0);
        gl.vertexAttribDivisor(1, 1);

        gl.enableVertexAttribArray(2);
        gl.vertexAttribPointer(2, 1, gl.FLOAT, false, stride, 2 * 4);
        gl.vertexAttribDivisor(2, 1);

        gl.enableVertexAttribArray(3);
        gl.vertexAttribPointer(3, 1, gl.FLOAT, false, stride, 3 * 4);
        gl.vertexAttribDivisor(3, 1);

        gl.enableVertexAttribArray(4);
        gl.vertexAttribPointer(4, 1, gl.FLOAT, false, stride, 4 * 4);
        gl.vertexAttribDivisor(4, 1);

        gl.bindVertexArray(null);

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        this.canvas.addEventListener('pointerdown', this.onPointerDown);
        window.addEventListener('pointermove', this.onPointerMove);
        window.addEventListener('pointerup', this.onPointerUp);
        this.canvas.addEventListener('wheel', this.onWheel, { passive: false });
        window.addEventListener('resize', this.onResize);

        this.onResize();
    }

    dispose() {
        const gl = this.gl;
        this.canvas.removeEventListener('pointerdown', this.onPointerDown);
        window.removeEventListener('pointermove', this.onPointerMove);
        window.removeEventListener('pointerup', this.onPointerUp);
        this.canvas.removeEventListener('wheel', this.onWheel);
        window.removeEventListener('resize', this.onResize);

        if (this.atlas) this.atlas.dispose();
        if (this.instanceBuffer) gl.deleteBuffer(this.instanceBuffer);
        if (this.vao) gl.deleteVertexArray(this.vao);
        if (this.program) gl.deleteProgram(this.program);
    }

    onResize() {
        const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
        const w = window.innerWidth;
        const h = window.innerHeight;
        this.canvas.width = w * dpr;
        this.canvas.height = h * dpr;
        this.canvas.style.width = `${w}px`;
        this.canvas.style.height = `${h}px`;
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
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

        this.camera.x -= dx / this.camera.zoom;
        this.camera.y += dy / this.camera.zoom;
    }

    onPointerUp(event) {
        this.dragging = false;
        if (this.canvas.hasPointerCapture(event.pointerId)) {
            this.canvas.releasePointerCapture(event.pointerId);
        }
    }

    onWheel(event) {
        event.preventDefault();
        const factor = event.deltaY < 0 ? 1.1 : (1 / 1.1);
        this.camera.setZoom(this.camera.zoom * factor);
    }

    update(dt) {
        for (const node of this.nodes) {
            node.rotation += node.rotSpeed * dt;
        }
    }

    collectVisibleInstances() {
        const viewW = this.canvas.clientWidth;
        const viewH = this.canvas.clientHeight;
        const padding = 40;

        let offset = 0;
        for (const node of this.nodes) {
            if (!this.camera.inView(node.x, node.y, padding, viewW, viewH)) {
                continue;
            }

            this.visibleInstances[offset + 0] = node.x;
            this.visibleInstances[offset + 1] = node.y;
            this.visibleInstances[offset + 2] = node.size;
            this.visibleInstances[offset + 3] = node.rotation;
            this.visibleInstances[offset + 4] = node.texIndex;
            offset += 5;
        }

        this.visibleCount = offset / 5;
    }

    render() {
        const gl = this.gl;
        this.collectVisibleInstances();

        gl.clearColor(0.02, 0.02, 0.08, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(this.program);
        gl.bindVertexArray(this.vao);

        const cameraMatrix = this.camera.getMatrix(this.canvas.clientWidth, this.canvas.clientHeight);
        gl.uniformMatrix3fv(this.uCameraLocation, false, cameraMatrix);
        gl.uniform1f(this.uAtlasGridLocation, this.atlas.grid);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.atlas.texture);
        gl.uniform1i(this.uAtlasLocation, 0);

        const instanceData = this.visibleInstances.subarray(0, this.visibleCount * 5);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, instanceData);

        gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, this.visibleCount);

        gl.bindVertexArray(null);
    }
}
