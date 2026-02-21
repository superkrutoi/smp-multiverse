export const SPRITE_VERTEX_SHADER = `#version 300 es
precision mediump float;

layout(location=0) in vec2 aPos;
layout(location=1) in vec2 iPos;
layout(location=2) in float iSize;
layout(location=3) in float iRot;
layout(location=4) in float iTexIdx;

uniform mat3 uCamera;

out vec2 vUV;
flat out float vTexIdx;

void main() {
    mat2 rot = mat2(
        cos(iRot), -sin(iRot),
        sin(iRot), cos(iRot)
    );

    vec2 world = iPos + (rot * (aPos * iSize));
    vec3 proj = uCamera * vec3(world, 1.0);

    gl_Position = vec4(proj.xy, 0.0, 1.0);
    vUV = aPos + 0.5;
    vTexIdx = iTexIdx;
}
`;

export const SPRITE_FRAGMENT_SHADER = `#version 300 es
precision mediump float;

in vec2 vUV;
flat in float vTexIdx;

uniform sampler2D uAtlas;
uniform float uAtlasGrid;

out vec4 outColor;

vec2 computeAtlasUV(vec2 uv, float texIdx) {
    float tx = mod(texIdx, uAtlasGrid);
    float ty = floor(texIdx / uAtlasGrid);
    return (vec2(tx, ty) + uv) / uAtlasGrid;
}

void main() {
    vec2 atlasUV = computeAtlasUV(vUV, vTexIdx);
    vec4 color = texture(uAtlas, atlasUV);

    if (color.a < 0.1) {
        discard;
    }

    outColor = color;
}
`;

export const STARFIELD_VERTEX_SHADER = `#version 300 es
precision mediump float;

layout(location=0) in vec2 aPos;
out vec2 vUV;

void main() {
    vUV = (aPos + 1.0) * 0.5;
    gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

export const STARFIELD_FRAGMENT_SHADER = `#version 300 es
precision mediump float;

in vec2 vUV;
out vec4 outColor;

uniform vec2 uResolution;
uniform vec2 uCamera;
uniform float uZoom;
uniform float uTime;

float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 78.233);
    return fract(p.x * p.y);
}

void main() {
    vec2 frag = vUV * uResolution;
    vec2 world = (frag - (uResolution * 0.5)) / max(uZoom, 0.0001) + uCamera;

    vec2 cell = floor(world / 140.0);
    float n = hash(cell);

    vec2 local = fract(world / 140.0) - 0.5;
    float core = smoothstep(0.06, 0.0, length(local));
    float twinkle = 0.65 + 0.35 * sin(uTime * 1.3 + n * 12.0);
    float starMask = step(0.94, n) * core;

    vec3 base = vec3(0.02, 0.02, 0.08);
    vec3 star = vec3(0.62, 0.78, 1.0) * starMask * twinkle;

    outColor = vec4(base + star, 1.0);
}
`;

function compileShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const info = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error(info || 'Shader compilation failed');
    }

    return shader;
}

export function createProgram(gl, vertexSource, fragmentSource) {
    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const info = gl.getProgramInfoLog(program);
        gl.deleteProgram(program);
        throw new Error(info || 'Program linking failed');
    }

    return program;
}
