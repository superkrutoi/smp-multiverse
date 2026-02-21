export class BatchInstancing {
    constructor(gl, maxInstances = 4096) {
        this.gl = gl;
        this.maxInstances = maxInstances;
        this.stride = 5;
        this.instanceData = new Float32Array(this.maxInstances * this.stride);
        this.count = 0;

        this.vao = gl.createVertexArray();
        this.quadBuffer = gl.createBuffer();
        this.instanceBuffer = gl.createBuffer();

        this.setup();
    }

    setup() {
        const gl = this.gl;
        gl.bindVertexArray(this.vao);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -0.5, -0.5,
             0.5, -0.5,
             0.5,  0.5,
            -0.5, -0.5,
             0.5,  0.5,
            -0.5,  0.5
        ]), gl.STATIC_DRAW);

        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.instanceData.byteLength, gl.DYNAMIC_DRAW);

        const strideBytes = this.stride * 4;

        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, strideBytes, 0);
        gl.vertexAttribDivisor(1, 1);

        gl.enableVertexAttribArray(2);
        gl.vertexAttribPointer(2, 1, gl.FLOAT, false, strideBytes, 2 * 4);
        gl.vertexAttribDivisor(2, 1);

        gl.enableVertexAttribArray(3);
        gl.vertexAttribPointer(3, 1, gl.FLOAT, false, strideBytes, 3 * 4);
        gl.vertexAttribDivisor(3, 1);

        gl.enableVertexAttribArray(4);
        gl.vertexAttribPointer(4, 1, gl.FLOAT, false, strideBytes, 4 * 4);
        gl.vertexAttribDivisor(4, 1);

        gl.bindVertexArray(null);
    }

    begin() {
        this.count = 0;
    }

    push(x, y, size, rotation, texIdx) {
        if (this.count >= this.maxInstances) {
            return;
        }

        const base = this.count * this.stride;
        this.instanceData[base + 0] = x;
        this.instanceData[base + 1] = y;
        this.instanceData[base + 2] = size;
        this.instanceData[base + 3] = rotation;
        this.instanceData[base + 4] = texIdx;
        this.count += 1;
    }

    upload() {
        const gl = this.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.instanceData.subarray(0, this.count * this.stride));
    }

    bind() {
        this.gl.bindVertexArray(this.vao);
    }

    draw() {
        this.gl.drawArraysInstanced(this.gl.TRIANGLES, 0, 6, this.count);
    }

    dispose() {
        const gl = this.gl;
        gl.deleteBuffer(this.quadBuffer);
        gl.deleteBuffer(this.instanceBuffer);
        gl.deleteVertexArray(this.vao);
    }
}
