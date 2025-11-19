import { Screen, GlyphSet } from "./screen.js"

const canvas = document.getElementById("canvas");
const gl = canvas.getContext("webgl");

const ext = gl.getExtension("OES_texture_float");
if (!ext) {
    alert("FLOAT textures not supported on this device.");
}

const mouseGlyph = [
    [1,1,1,1,1,1,0,0],
    [1,1,1,1,1,1,0,0],
    [1,1,1,1,1,0,0,0],
    [1,1,1,1,1,0,0,0],
    [1,1,1,1,1,1,0,0],
    [1,1,0,0,1,1,1,0],
    [0,0,0,0,0,1,1,1],
    [0,0,0,0,0,0,1,1]
].map(row => row.map(v => v === 1));

const glyphSet = new GlyphSet();
glyphSet.set(0, mouseGlyph);

const dpr = window.devicePixelRatio || 1;

const vertexShader = `
attribute vec2 a_position;

void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const fragmentShader = `
precision mediump float;

uniform vec2 u_resolution;
uniform vec2 u_gridSize;
uniform sampler2D u_screenTex;
uniform vec4 u_fillEnabled;
uniform vec4 u_fillDisabled;
uniform vec4 u_strokeEnabled;
uniform vec4 u_strokeDisabled;

void main() {
    vec2 uv = vec2(
        gl_FragCoord.x / u_resolution.x,
        1.0 - (gl_FragCoord.y / u_resolution.y)
    );

    ivec2 cell = ivec2(floor(uv * u_gridSize));

    if (cell.x < 0 || cell.x >= int(u_gridSize.x) ||
        cell.y < 0 || cell.y >= int(u_gridSize.y)) {
        gl_FragColor = u_fillDisabled;
        return;
    }

    // --------- fade value ---------
    vec2 texUV = (vec2(cell) + 0.5) / u_gridSize;
    float fade = texture2D(u_screenTex, texUV).r;

    vec4 fillColor   = mix(u_fillDisabled,   u_fillEnabled,   fade);
    vec4 strokeColor = mix(u_strokeDisabled, u_strokeEnabled, fade);

    // --------- pixel-space coords inside the cell ---------
    // Compute local pixel coordinates inside this cell:
    vec2 cellUV = uv * u_gridSize - vec2(cell);

    // Convert local UV to pixel units
    // (1 / u_gridSize) is the size of 1 pixel in UV space
    vec2 pxInCell = cellUV * u_resolution / u_gridSize;

    // Stroke thickness: exactly 1 screen pixel
    float strokeWidth = 1.0;

    bool isStroke =
        pxInCell.x < strokeWidth ||
        pxInCell.y < strokeWidth ||
        pxInCell.x > (u_resolution.x / u_gridSize.x) - strokeWidth ||
        pxInCell.y > (u_resolution.y / u_gridSize.y) - strokeWidth;

    gl_FragColor = isStroke ? strokeColor : fillColor;
}
`;

const palette = {
    stroke: {
        disabled: [188/255, 218/255, 189/255, 255/255],
        enabled: [57/255, 56/255, 29/255, 255/255]
    },
    fill: {
        enabled: [77/255, 76/255, 49/255, 255/255],
        disabled: [208/255, 238/255, 209/255, 255/255]
    }
}

function handleResize() {
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    gl.viewport(0, 0, canvas.width, canvas.height);
}

function compileShader(type, source) {
    const s = gl.createShader(type);
    gl.shaderSource(s, source);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
        throw new Error(gl.getShaderInfoLog(s));
    return s;
}

handleResize();

const CELL_SIZE = 8;
const gridW = Math.floor(canvas.width  / CELL_SIZE);
const gridH = Math.floor(canvas.height / CELL_SIZE);
const pixelCount = gridW * gridH;

const screen = new Screen(gridH, gridW, 20, glyphSet);
screen.drawLine(0, 0, gridH - 1, gridW - 1);
screen.drawLine(5, 0, 5, gridW - 1);
screen.drawRect(10, 10, 5, 10, true);

const vs = compileShader(gl.VERTEX_SHADER, vertexShader);
const fs = compileShader(gl.FRAGMENT_SHADER, fragmentShader);

const program = gl.createProgram();
gl.attachShader(program, vs);
gl.attachShader(program, fs);
gl.linkProgram(program);
gl.useProgram(program);

const quad = new Float32Array([
    -1, -1,
     1, -1,
    -1,  1,
    -1,  1,
     1, -1,
     1,  1
]);

const buf = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buf);
gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);


const a_position = gl.getAttribLocation(program, "a_position");
gl.enableVertexAttribArray(a_position);
gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);

const screenData = new Float32Array(pixelCount);
for (let i = 0; i < pixelCount; i++)
    screenData[i] = 0;

const screenTex = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, screenTex);
gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.LUMINANCE,
    gridW,
    gridH,
    0,
    gl.LUMINANCE,
    gl.FLOAT,
    screenData
);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

gl.uniform2f(gl.getUniformLocation(program, "u_resolution"),
    canvas.width, canvas.height);
gl.uniform2f(gl.getUniformLocation(program, "u_gridSize"),
    gridW, gridH);
gl.uniform1f(gl.getUniformLocation(program, "u_totalPixels"),
    pixelCount);

// palette.fill colors
gl.uniform4f(gl.getUniformLocation(program, "u_fillEnabled"),
    77/255, 76/255, 49/255, 1.0);
gl.uniform4f(gl.getUniformLocation(program, "u_fillDisabled"),
    208/255, 238/255, 209/255, 1.0);
gl.uniform4f(
    gl.getUniformLocation(program, "u_strokeEnabled"),
    57/255, 56/255, 29/255, 1.0
);
gl.uniform4f(
    gl.getUniformLocation(program, "u_strokeDisabled"),
    188/255, 218/255, 189/255, 1.0
);

const u_screenTexLoc = gl.getUniformLocation(program, "u_screenTex");
gl.uniform1i(u_screenTexLoc, 0); // <-- IMPORTANT

let mouseX = null;
let mouseY = null;

function frame() {
    screen.clear(false); // clear VRAM only, not fade
                         // fade buffer stays as-is!
    if(mouseX !== null && mouseY !== null) {
        const row = Math.floor(mouseY / CELL_SIZE);
        const col = Math.floor(mouseX / CELL_SIZE);

        screen.drawGlyph(0, row, col); // glyph 0 = mouse pointer
    }

    screen.tickFade();

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, screenTex);

    gl.texSubImage2D(
        gl.TEXTURE_2D,
        0,
        0, 0,
        gridW,
        gridH,
        gl.LUMINANCE,
        gl.FLOAT,
        screen.getFadeBuffer()
    );

    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    requestAnimationFrame(frame);
}

canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = (e.clientX - rect.left) * dpr;
    mouseY = (e.clientY - rect.top) * dpr;
});

window.addEventListener("resize", () => handleResize());

window.requestAnimationFrame(frame);