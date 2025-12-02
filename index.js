import { Screen, BlendMode, globalDebugInfo, resetGlobalDebugInfo } from "./screen.js"
import { defaultGlyphSet } from "./glyphs.js"
import { AppRegistry } from "./programs/registry.js";
import { BrowserProgram } from "./programs/browser.js";

const canvas = document.getElementById("canvas");
const gl = canvas.getContext("webgl");

const ext = gl.getExtension("OES_texture_float");
if (!ext) {
    alert("FLOAT textures not supported on this device.");
}

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

    // fade value
    vec2 texUV = (vec2(cell) + 0.5) / u_gridSize;
    float fade = texture2D(u_screenTex, texUV).r;

    vec4 fillColor   = mix(u_fillDisabled,   u_fillEnabled,   fade);
    vec4 strokeColor = mix(u_strokeDisabled, u_strokeEnabled, fade);

    // pixel-space coords inside the cell
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

function formatTime(date) {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();

    // Pad with leading zero if the value is a single digit
    const formattedHours = String(hours).padStart(2, '0');
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(seconds).padStart(2, '0');

    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
}

handleResize();

const CELL_SIZE = 8;
const gridW = Math.floor(canvas.width  / CELL_SIZE);
const gridH = Math.floor(canvas.height / CELL_SIZE);
const pixelCount = gridW * gridH;

const screen = new Screen(gridH, gridW, 10, defaultGlyphSet);
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
gl.uniform1i(u_screenTexLoc, 0);

let mouseX = null;
let mouseY = null;

let dragTarget = null;
let dragOffsetX = 0;
let dragOffsetY = 0;
let isDragging = false;

let resizeTarget = null;
let isResizing = false;
let resizeStartWidth = 0;
let resizeStartHeight = 0;
let resizeStartCol = 0;
let resizeStartRow = 0;

let menuOpen = false;
let hoveredMenuIndex = -1;

let runningPrograms = [];

runningPrograms.push(new BrowserProgram());

let lastFrameTime = -1;

for(let i = 0; i < runningPrograms.length; i++) {
    runningPrograms[i].initialize();
}

function frame() {
    const start = Date.now()
    screen.clear(false);
    
    for(let i = 0; i < runningPrograms.length; i++) {
        const data = runningPrograms[i].systemData;

        screen.drawRect(
            data.y + 1,
            data.x + 1,
            9,
            data.width,
            false
        );

        screen.drawLine(data.y, data.x, data.y + data.height + 11, data.x);
        screen.drawLine(data.y, data.x + data.width + 1, data.y + data.height + 11, data.x + data.width + 1);
        screen.drawLine(data.y + data.height + 11, data.x, data.y + data.height + 11, data.x + data.width + 1)
        screen.drawLine(data.y + 10, data.x, data.y + 10, data.x + data.width + 1)
        screen.drawLine(data.y, data.x, data.y, data.x + data.width + 1)
        screen.drawLine(data.y, data.x + data.width - 9, data.y + 10, data.x + data.width - 9);
        screen.drawText(data.title, data.y + 2, data.x + 2)
        screen.drawGlyph(1, data.y + 2, data.x + data.width - 7)

        const surface = runningPrograms[i].frame();

        screen.blitSurface(surface, data.y + 11, data.x + 1, BlendMode.OVERWRITE);
    }

    screen.drawLine(9, 0, 9, gridW);

    screen.drawRect(0, 0, 9, gridW);
    screen.drawRect(0, 0, 9, 29, menuOpen);
    screen.drawText("Apps", 1, 3, 1, BlendMode.ADD, !menuOpen);
    if (menuOpen) {
        let startRow = 2;  // under "Apps"
        let startCol = 1;
        
        screen.drawRect(10, 0, startRow + AppRegistry.length * 9 + 8, 60)

        for (let i = 0; i < AppRegistry.length; i++) {
            const app = AppRegistry[i];
            const y = startRow + i * 9 + 8;

            if (i === hoveredMenuIndex) {
                screen.drawRect(y, startCol, 9, 60, true);
            }

            screen.drawText(app.name, y + 1, startCol + 2, 1, BlendMode.ADD, i !== hoveredMenuIndex);
        }
    }

    const now = new Date();
    const currentTime = formatTime(now);
    screen.drawText(currentTime, 1, gridW - 6 * currentTime.length - 2)

    if(mouseX !== null && mouseY !== null) {
        const row = Math.floor(mouseY / CELL_SIZE);
        const col = Math.floor(mouseX / CELL_SIZE);

        screen.drawGlyph(0, row, col, BlendMode.OVERWRITE); // glyph 0 = mouse pointer
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

    const end = Date.now()
    lastFrameTime = end - start;
    let debugProgram = runningPrograms.find((program) => program.processDebugInfo != undefined)

    if (debugProgram) {
        debugProgram.processDebugInfo({frameTime: lastFrameTime, ...globalDebugInfo})
        resetGlobalDebugInfo();
    }

    requestAnimationFrame(frame);
}

function getLocalCoords(program, col, row) {
    return {
        x: col - program.systemData.x - 1,
        y: row - program.systemData.y - 11
    };
}

function isInsideProgram(program, col, row) {
    const d = program.systemData;
    return (
        col >= d.x + 1 &&
        col <= d.x + d.width &&
        row >= d.y + 11 &&
        row <= d.y + d.height + 11
    );
}

canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = (e.clientX - rect.left) * dpr;
    mouseY = (e.clientY - rect.top) * dpr;

    const row = Math.floor(mouseY / CELL_SIZE);
    const col = Math.floor(mouseX / CELL_SIZE);

    if (menuOpen) {
        const menuStart = 10;     // row where first item begins
        const itemHeight = 9;     // each item is 9 rows tall

        if (row >= menuStart) {
            const index = Math.floor((row - menuStart) / itemHeight);

            if (index >= 0 && index < AppRegistry.length) {
                hoveredMenuIndex = index;
            } else {
                hoveredMenuIndex = -1;
            }
        } else {
            hoveredMenuIndex = -1;
        }
    }

    if (isResizing && resizeTarget) {
        const data = resizeTarget.systemData;

        let dCol = col - resizeStartCol;
        let dRow = row - resizeStartRow;

        data.width = Math.max(5, resizeStartWidth + dCol);
        data.height = Math.max(5, resizeStartHeight + dRow);

        // Clamp so window doesn’t go offscreen
        data.width = Math.min(data.width, gridW - data.x - 2);
        data.height = Math.min(data.height, gridH - data.y - 12);

        return;
    }

    if (isDragging && dragTarget) {
        const data = dragTarget.systemData;

        data.x = col - dragOffsetX;
        data.y = row - dragOffsetY;

        // Clamp to screen bounds
        data.y = Math.max(9, data.y);
    }

    if (runningPrograms.length > 0) {
        const top = runningPrograms[runningPrograms.length - 1];
        
        if (isInsideProgram(top, col, row)) {
            const { x: lx, y: ly } = getLocalCoords(top, col, row);

            if (top.onMouseMove) {
                top.onMouseMove(lx, ly);
            }
        }
    }
});

canvas.addEventListener("mousedown", (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = (e.clientX - rect.left) * dpr;
    mouseY = (e.clientY - rect.top) * dpr;

    const row = Math.floor(mouseY / CELL_SIZE);
    const col = Math.floor(mouseX / CELL_SIZE);

    if (row >= 1 && row <= 7 && col >= 3 && col < 3 + 6*4) { 
        // "Apps" = 4 letters * ~6px avg width
        console.log("Menu open")
        menuOpen = !menuOpen;
        return;
    }

    if (menuOpen) {
        const startRow = 2;
        const startCol = 1;
        const itemHeight = 9;
        const itemWidth  = 60;

        let clickedIndex = -1;

        for (let i = 0; i < AppRegistry.length; i++) {
            const yTop = startRow + i * itemHeight + 8;
            const xLeft = startCol;

            if (
                row >= yTop && row < yTop + itemHeight &&
                col >= xLeft && col < xLeft + itemWidth
            ) {
                clickedIndex = i;
                break;
            }
        }

        if (clickedIndex !== -1) {
            const app = AppRegistry[clickedIndex].create();

            app.systemData.x = 20 + runningPrograms.length * 4;
            app.systemData.y = 30 + runningPrograms.length * 4;
            app.initialize();

            runningPrograms.push(app);
        }

        menuOpen = false;
        hoveredMenuIndex = -1;
        return;
    }

    // GIVE PROGRAMS FIRST CHANCE
    for (let i = runningPrograms.length - 1; i >= 0; i--) {
        const p = runningPrograms[i];
        if (!isInsideProgram(p, col, row)) continue;

        const { x: lx, y: ly } = getLocalCoords(p, col, row);
        
        if (p.onMouseDown(lx, ly)) {
            const bring = runningPrograms.splice(i, 1)[0];
            runningPrograms.push(bring);
            return;
        }
    }

    // (1) — CHECK X BUTTON FIRST
    for (let i = runningPrograms.length - 1; i >= 0; i--) {
        const data = runningPrograms[i].systemData;

        const bx1 = data.x + data.width - 9; // left
        const bx2 = data.x + data.width + 1; // right
        const by1 = data.y;                  // top
        const by2 = data.y + 10;             // bottom

        if (col >= bx1 && col <= bx2 && row >= by1 && row <= by2) {
            runningPrograms.splice(i, 1);
            return;
        }
    }

    for (let i = runningPrograms.length - 1; i >= 0; i--) {
        const data = runningPrograms[i].systemData;

        const handleCol = data.x + data.width + 1;
        const handleRow = data.y + data.height + 11;

        if (col === handleCol && row === handleRow) {
            resizeTarget = runningPrograms[i];
            isResizing = true;

            resizeStartWidth = data.width;
            resizeStartHeight = data.height;
            resizeStartCol = col;
            resizeStartRow = row;

            // Bring to front
            const p = runningPrograms.splice(i, 1)[0];
            runningPrograms.push(p);
            return;
        }
    }

    // (2) — CHECK TITLE BAR FOR DRAG
    // Title bar is from:
    // row = data.y ... data.y+10
    // col = data.x ... data.x+data.width+1
    for (let i = runningPrograms.length - 1; i >= 0; i--) {
        const data = runningPrograms[i].systemData;

        if (row >= data.y && row <= data.y + 10 &&
            col >= data.x && col <= data.x + data.width + 1) {

            // Start dragging
            dragTarget = runningPrograms[i];
            isDragging = true;

            // Offset so window doesn't jump
            dragOffsetX = col - data.x;
            dragOffsetY = row - data.y;

            // Bring window to front
            const p = runningPrograms.splice(i, 1)[0];
            runningPrograms.push(p);

            return;
        }
    }
});

window.addEventListener("mouseup", (e) => {
    // END resize:
    if (isResizing && resizeTarget) {
        const data = resizeTarget.systemData;
        resizeTarget.setSize(data.width, data.height);
    }
    isResizing = false;
    resizeTarget = null;

    // END dragging:
    isDragging = false;
    dragTarget = null;

    // Also forward mouseup to the top program if inside its window
    if (runningPrograms.length > 0) {
        const top = runningPrograms[runningPrograms.length - 1];

        const rect = canvas.getBoundingClientRect();
        let mx = (e.clientX - rect.left) * dpr;
        let my = (e.clientY - rect.top) * dpr;

        const row = Math.floor(my / CELL_SIZE);
        const col = Math.floor(mx / CELL_SIZE);

        if (isInsideProgram(top, col, row)) {
            const { x, y } = getLocalCoords(top, col, row);
            if (top.onMouseUp) top.onMouseUp(x, y);
        }
    }
});

window.addEventListener("keydown", (e) => {
    if(runningPrograms.length == 0) {
        return;
    }

    const top = runningPrograms[runningPrograms.length - 1];
    if (top.onKeyDown(e)) e.preventDefault();
});

window.addEventListener("keyup", (e) => {
    if(runningPrograms.length == 0) {
        return;
    }

    const top = runningPrograms[runningPrograms.length - 1];
    if (top.onKeyUp(e)) e.preventDefault();
});

window.addEventListener("wheel", (e) => {
    if (runningPrograms.length > 0) {
        const top = runningPrograms[runningPrograms.length - 1];

        const rect = canvas.getBoundingClientRect();
        let mx = (e.clientX - rect.left) * dpr;
        let my = (e.clientY - rect.top) * dpr;

        const row = Math.floor(my / CELL_SIZE);
        const col = Math.floor(mx / CELL_SIZE);

        if (isInsideProgram(top, col, row)) {
            if (top.onScroll) top.onScroll(e.deltaY);
        }
    }
});

window.addEventListener("resize", () => handleResize());

window.requestAnimationFrame(frame);
