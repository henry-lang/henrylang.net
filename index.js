import { Screen, BlendMode, globalDebugInfo, resetGlobalDebugInfo } from "./screen.js"
import { defaultGlyphSet } from "./glyphs.js"
import { AppRegistry } from "./programs/registry.js";
import { BrowserProgram } from "./programs/browser.js";

const canvas = document.getElementById("canvas");
canvas.tabIndex = 0;
canvas.setAttribute("inputmode", "none");
const gl = canvas.getContext("webgl");

const ext = gl.getExtension("OES_texture_float");
const screenTextureType = ext ? gl.FLOAT : gl.UNSIGNED_BYTE;

let dpr = window.devicePixelRatio || 1;
const CELL_SIZE = 8;

let gridW = 0;
let gridH = 0;
let pixelCount = 0;
let screen = null;
let screenData = null;
let screenUploadData = null;
let screenTex = null;

let uResolutionLoc = null;
let uGridSizeLoc = null;
let uTotalPixelsLoc = null;

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

function resizeScreenBuffers(cols, rows) {
    gridW = cols;
    gridH = rows;
    pixelCount = gridW * gridH;

    screen = new Screen(gridH, gridW, 10, defaultGlyphSet);
    screenData = ext ? new Float32Array(pixelCount) : new Uint8Array(pixelCount);
    screenUploadData = ext ? null : new Uint8Array(pixelCount);

    gl.bindTexture(gl.TEXTURE_2D, screenTex);
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.LUMINANCE,
        gridW,
        gridH,
        0,
        gl.LUMINANCE,
        screenTextureType,
        screenData
    );

    if (uGridSizeLoc) gl.uniform2f(uGridSizeLoc, gridW, gridH);
    if (uTotalPixelsLoc) gl.uniform1f(uTotalPixelsLoc, pixelCount);
}

function handleResize() {
    dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(window.innerWidth * dpr));
    canvas.height = Math.max(1, Math.floor(window.innerHeight * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);

    if (uResolutionLoc) gl.uniform2f(uResolutionLoc, canvas.width, canvas.height);

    const nextGridW = Math.max(1, Math.floor(canvas.width / CELL_SIZE));
    const nextGridH = Math.max(1, Math.floor(canvas.height / CELL_SIZE));
    if (screenTex && (nextGridW !== gridW || nextGridH !== gridH)) {
        resizeScreenBuffers(nextGridW, nextGridH);
    }
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

screenTex = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, screenTex);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

uResolutionLoc = gl.getUniformLocation(program, "u_resolution");
uGridSizeLoc = gl.getUniformLocation(program, "u_gridSize");
uTotalPixelsLoc = gl.getUniformLocation(program, "u_totalPixels");
handleResize();

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

const MOBILE_BREAKPOINT = 700;
const MOBILE_TOP_BAR_H = 9;
const MOBILE_BOTTOM_BAR_H = 19;
const MOBILE_ICON_SIZE = 24;
const MOBILE_HOME_COLS = 2;
const MOBILE_HOME_ROWS = 2;
const MOBILE_PAGE_SIZE = MOBILE_HOME_COLS * MOBILE_HOME_ROWS;
const MOBILE_KEYBOARD_H = 55;
const MOBILE_KEYBOARD_BAR_H = 10;
const MOBILE_KEY_H = 10;
const MOBILE_KEY_GAP = 1;

const mobileIconStyles = {
    Browser: "browser",
    Contact: "contact",
    Music: "music",
    "Text Edit": "text",
    Messenger: "messenger",
    Painter: "painter",
    IDE: "ide",
    Debugger: "debugger"
};

const mobileDisplayNames = {
    "Text Edit": "Text",
    Messenger: "Msg",
    Debugger: "Debug"
};

const mobileHome = {
    page: 0,
    scrollCol: 0,
    startScrollCol: 0,
    pointerDown: false,
    startCol: 0,
    startRow: 0,
    currentCol: 0,
    moved: false,
    iconTargets: []
};

const mobileProgramTouch = {
    program: null,
    pointerDown: false,
    startRow: 0,
    startCol: 0,
    lastRow: 0,
    lastCol: 0,
    velocity: 0,
    moved: false,
    pendingTap: false
};

const mobileScrollMomentum = {
    program: null,
    velocity: 0
};

const mobileKeyboard = {
    mode: "letters",
    targets: []
};

function isMobileViewport() {
    return window.innerWidth <= MOBILE_BREAKPOINT;
}

function mobilePageCount() {
    return Math.max(1, Math.ceil(AppRegistry.length / MOBILE_PAGE_SIZE));
}

function clampMobilePage() {
    mobileHome.page = Math.max(0, Math.min(mobileHome.page, mobilePageCount() - 1));
}

function mobilePageScrollCol() {
    return mobileHome.page * gridW;
}

function syncMobilePageScroll() {
    mobileHome.scrollCol = mobilePageScrollCol();
    mobileHome.startScrollCol = mobileHome.scrollCol;
}

function lineValue(y0, x0, y1, x1, value) {
    let dx = Math.abs(x1 - x0);
    let sx = x0 < x1 ? 1 : -1;
    let dy = -Math.abs(y1 - y0);
    let sy = y0 < y1 ? 1 : -1;
    let error = dx + dy;

    while (true) {
        screen.setPixel(y0, x0, value);
        if (x0 === x1 && y0 === y1) break;

        const e2 = 2 * error;
        if (e2 >= dy) {
            if (x0 === x1) break;
            error += dy;
            x0 += sx;
        }
        if (e2 <= dx) {
            if (y0 === y1) break;
            error += dx;
            y0 += sy;
        }
    }
}

function circleValue(centerRow, centerCol, radius, value) {
    for (let angle = 0; angle < 360; angle += 5) {
        const rad = angle * Math.PI / 180;
        const row = Math.round(centerRow + Math.sin(rad) * radius);
        const col = Math.round(centerCol + Math.cos(rad) * radius);
        screen.setPixel(row, col, value);
    }
}

function ovalValue(centerRow, centerCol, radiusRow, radiusCol, value) {
    for (let row = centerRow - radiusRow; row <= centerRow + radiusRow; row++) {
        for (let col = centerCol - radiusCol; col <= centerCol + radiusCol; col++) {
            const dy = (row - centerRow) / radiusRow;
            const dx = (col - centerCol) / radiusCol;
            if (dx * dx + dy * dy <= 1) {
                screen.setPixel(row, col, value);
            }
        }
    }
}

function drawRoundedSquare(row, col, size, value) {
    const radius = 4;
    screen.drawRect(row + radius, col, size - radius * 2, size, value);
    screen.drawRect(row, col + radius, size, size - radius * 2, value);
    screen.drawRect(row + 2, col + 2, size - 4, size - 4, value);
}

function drawIconSymbol(kind, row, col, size) {
    const cx = col + Math.floor(size / 2);
    const cy = row + Math.floor(size / 2);

    if (kind === "browser") {
        circleValue(cy, cx, 7, false);
        lineValue(cy, cx - 7, cy, cx + 7, false);
        lineValue(cy - 7, cx, cy + 7, cx, false);
        lineValue(cy - 5, cx - 4, cy + 5, cx + 4, false);
        lineValue(cy - 5, cx + 4, cy + 5, cx - 4, false);
        return;
    }

    if (kind === "contact") {
        circleValue(cy - 4, cx, 4, false);
        screen.drawRect(cy + 2, cx - 7, 2, 14, false);
        screen.drawRect(cy + 4, cx - 9, 2, 18, false);
        screen.drawRect(cy + 6, cx - 6, 2, 12, false);
        return;
    }

    if (kind === "music") {
        screen.drawRect(cy - 8, cx - 2, 3, 12, false);
        screen.drawRect(cy - 8, cx - 2, 13, 3, false);
        screen.drawRect(cy - 5, cx + 7, 12, 3, false);
        ovalValue(cy + 4, cx - 5, 4, 5, false);
        ovalValue(cy + 6, cx + 4, 4, 5, false);
        return;
    }

    if (kind === "text") {
        screen.drawRect(row + 5, col + 6, size - 10, size - 12, false);
        screen.drawRect(row + 7, col + 8, 1, size - 16, true);
        for (let i = 0; i < 4; i++) {
            screen.drawRect(row + 9 + i * 3, col + 9, 1, size - 18 - (i % 2) * 3, false);
        }
        return;
    }

    if (kind === "messenger") {
        screen.drawRect(cy - 8, cx - 8, 9, 14, false);
        screen.drawRect(cy - 3, cx - 3, 9, 14, false);
        screen.drawRect(cy + 1, cx - 6, 3, 3, false);
        screen.drawRect(cy + 6, cx + 6, 3, 3, false);
        return;
    }

    if (kind === "painter") {
        circleValue(cy, cx - 2, 7, false);
        screen.drawRect(cy - 4, cx - 6, 3, 3, true);
        screen.drawRect(cy - 2, cx + 2, 3, 3, true);
        screen.drawRect(cy + 4, cx - 3, 3, 3, true);
        lineValue(cy + 7, cx + 3, cy - 8, cx + 9, false);
        return;
    }

    if (kind === "ide") {
        lineValue(cy - 6, cx - 6, cy, cx - 11, false);
        lineValue(cy, cx - 11, cy + 6, cx - 6, false);
        lineValue(cy - 6, cx + 6, cy, cx + 11, false);
        lineValue(cy, cx + 11, cy + 6, cx + 6, false);
        lineValue(cy + 7, cx - 2, cy - 7, cx + 2, false);
        return;
    }

    if (kind === "debugger") {
        circleValue(cy, cx, 7, false);
        lineValue(cy, cx - 10, cy, cx + 10, false);
        lineValue(cy - 10, cx, cy + 10, cx, false);
        screen.drawRect(cy - 2, cx - 2, 5, 5, true);
    }
}

function drawMobileIcon(app, index, row, col) {
    drawRoundedSquare(row, col, MOBILE_ICON_SIZE, true);
    drawIconSymbol(mobileIconStyles[app.name], row, col, MOBILE_ICON_SIZE);

    const label = mobileDisplayNames[app.name] || app.name;
    const maxChars = Math.floor((MOBILE_ICON_SIZE + 20) / 6);
    const displayLabel = label.length > maxChars ? label.slice(0, maxChars - 1) + "." : label;
    const labelCol = col + Math.floor((MOBILE_ICON_SIZE - displayLabel.length * 6) / 2);
    screen.drawText(displayLabel, row + MOBILE_ICON_SIZE + 4, labelCol);

    mobileHome.iconTargets.push({
        index,
        col1: col - 4,
        col2: col + MOBILE_ICON_SIZE + 4,
        row1: row - 4,
        row2: row + MOBILE_ICON_SIZE + 14
    });
}

function drawMobileTopBar() {
    screen.drawRect(0, 0, MOBILE_TOP_BAR_H, gridW, false);
    screen.drawLine(MOBILE_TOP_BAR_H, 0, MOBILE_TOP_BAR_H, gridW);

    const now = new Date();
    const currentTime = formatTime(now);
    screen.drawText(currentTime, 1, Math.max(1, gridW - 6 * currentTime.length - 2));
}

function drawMobileBottomBar() {
    const top = gridH - MOBILE_BOTTOM_BAR_H;
    screen.drawLine(top, 0, top, gridW);
    screen.drawRect(top + 1, 0, MOBILE_BOTTOM_BAR_H - 1, gridW, false);

    const buttonRow = top + 9;
    const buttonCol = Math.floor(gridW / 2);
    circleValue(buttonRow, buttonCol, 7, true);
    circleValue(buttonRow, buttonCol, 6, false);
}

function mobileKeyboardVisible() {
    if (!isMobileViewport() || runningPrograms.length === 0) return false;
    const top = runningPrograms[runningPrograms.length - 1];
    return top && top.hasFocus === true && typeof top.onKeyDown === "function";
}

function mobileKeyboardTop() {
    return gridH - MOBILE_BOTTOM_BAR_H - MOBILE_KEYBOARD_H;
}

function mobileKeyboardDoneTarget() {
    const width = Math.min(28, Math.max(24, Math.floor(gridW * 0.24)));
    return {
        action: "done",
        label: "Done",
        row: mobileKeyboardTop() + 1,
        col: gridW - width - 3,
        height: MOBILE_KEYBOARD_BAR_H - 2,
        width
    };
}

function buildMobileKeyboardTargets() {
    const targets = [];
    const isSymbols = mobileKeyboard.mode === "symbols";
    const rows = isSymbols
        ? [
            ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
            ["-", "/", ":", ";", "(", ")", "$", "&", "@"],
            [".", ",", "?", "!", "'"]
        ]
        : [
            ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
            ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
            ["z", "x", "c", "v", "b", "n", "m"]
        ];
    const top = mobileKeyboardTop() + MOBILE_KEYBOARD_BAR_H + 1;

    rows.forEach((keys, rowIndex) => {
        const deleteW = rowIndex === 2 ? 16 : 0;
        const deleteGap = rowIndex === 2 ? MOBILE_KEY_GAP : 0;
        const availableW = gridW - deleteW - deleteGap - MOBILE_KEY_GAP * (keys.length + 1);
        const keyW = Math.min(12, Math.max(7, Math.floor(availableW / keys.length)));
        const totalW = keys.length * keyW + (keys.length - 1) * MOBILE_KEY_GAP + deleteW + deleteGap;
        const startCol = Math.floor((gridW - totalW) / 2);
        const row = top + rowIndex * (MOBILE_KEY_H + MOBILE_KEY_GAP);

        keys.forEach((key, index) => {
            const col = startCol + index * (keyW + MOBILE_KEY_GAP);
            targets.push({ key, label: key, row, col, height: MOBILE_KEY_H, width: keyW });
        });

        if (rowIndex === 2) {
            const col = startCol + keys.length * (keyW + MOBILE_KEY_GAP);
            targets.push({ key: "Backspace", label: "", row, col, height: MOBILE_KEY_H, width: deleteW });
        }
    });

    const controlRow = top + 3 * (MOBILE_KEY_H + MOBILE_KEY_GAP);
    const modeW = 16;
    const enterW = 18;
    const spaceW = Math.max(28, gridW - modeW - enterW - MOBILE_KEY_GAP * 4);
    let col = Math.floor((gridW - modeW - spaceW - enterW - MOBILE_KEY_GAP * 2) / 2);
    targets.push({
        action: "toggleMode",
        label: isSymbols ? "ABC" : "123",
        row: controlRow,
        col,
        height: MOBILE_KEY_H,
        width: modeW
    });
    col += modeW + MOBILE_KEY_GAP;
    targets.push({ key: " ", label: "space", row: controlRow, col, height: MOBILE_KEY_H, width: spaceW });
    col += spaceW + MOBILE_KEY_GAP;
    targets.push({ key: "Enter", label: "ret", row: controlRow, col, height: MOBILE_KEY_H, width: enterW });

    return targets;
}

function drawMobileKeyboard() {
    if (!mobileKeyboardVisible()) {
        mobileKeyboard.targets = [];
        return;
    }

    const top = mobileKeyboardTop();
    screen.drawLine(top, 0, top, gridW);
    screen.drawRect(top + 1, 0, MOBILE_KEYBOARD_H - 1, gridW, false);
    screen.drawLine(top + MOBILE_KEYBOARD_BAR_H, 0, top + MOBILE_KEYBOARD_BAR_H, gridW);

    const done = mobileKeyboardDoneTarget();
    screen.drawText(done.label, done.row + 1, done.col + Math.max(1, done.width - 25), 1, BlendMode.ADD, true);

    mobileKeyboard.targets = buildMobileKeyboardTargets();
    for (const target of mobileKeyboard.targets) {
        screen.drawRect(target.row, target.col, target.height, target.width, true);
        if (target.key === "Backspace") {
            const midRow = target.row + Math.floor(target.height / 2);
            const leftCol = target.col + 4;
            const rightCol = target.col + target.width - 4;
            lineValue(midRow, leftCol, midRow, rightCol, false);
            lineValue(midRow, leftCol, midRow - 3, leftCol + 3, false);
            lineValue(midRow, leftCol, midRow + 3, leftCol + 3, false);
            continue;
        }

        const labelCol = target.col + Math.max(1, Math.floor((target.width - target.label.length * 6) / 2));
        const labelRow = target.row + Math.max(1, Math.floor((target.height - 7) / 2));
        screen.drawText(target.label, labelRow, labelCol, 1, BlendMode.ADD, false);
    }
}

function drawMobilePageDots() {
    const pages = mobilePageCount();
    const row = gridH - MOBILE_BOTTOM_BAR_H - 5;
    const start = Math.floor(gridW / 2) - pages * 3;

    for (let i = 0; i < pages; i++) {
        const col = start + i * 6;
        if (i === mobileHome.page) {
            screen.drawRect(row, col, 2, 4, true);
        } else {
            screen.setPixel(row, col + 1, true);
            screen.setPixel(row + 1, col + 1, true);
        }
    }
}

function drawMobileHome() {
    drawMobileTopBar();

    for (let row = MOBILE_TOP_BAR_H + 12; row < gridH - MOBILE_BOTTOM_BAR_H - 8; row += 16) {
        const offset = (row / 16) % 2 === 0 ? 7 : 17;
        for (let col = offset; col < gridW; col += 30) {
            screen.setPixel(row, col, true);
        }
    }

    mobileHome.iconTargets = [];
    clampMobilePage();

    const pageWidth = gridW;
    const dragCols = mobileHome.pointerDown ? mobileHome.currentCol - mobileHome.startCol : 0;
    if (mobileHome.pointerDown) {
        mobileHome.scrollCol = mobileHome.startScrollCol - dragCols;
    } else {
        const targetScroll = mobilePageScrollCol();
        mobileHome.scrollCol += (targetScroll - mobileHome.scrollCol) * 0.22;
        if (Math.abs(targetScroll - mobileHome.scrollCol) < 0.05) {
            mobileHome.scrollCol = targetScroll;
        }
    }

    const scrollOffset = mobileHome.scrollCol;
    const colGap = Math.max(10, Math.floor((gridW - MOBILE_HOME_COLS * MOBILE_ICON_SIZE) / (MOBILE_HOME_COLS + 1)));
    const gridWidth = MOBILE_HOME_COLS * MOBILE_ICON_SIZE + (MOBILE_HOME_COLS - 1) * colGap;
    const startCol = Math.floor((gridW - gridWidth) / 2);
    const rowGap = 16;
    const gridHeight = MOBILE_HOME_ROWS * (MOBILE_ICON_SIZE + 11) + (MOBILE_HOME_ROWS - 1) * rowGap;
    const startRow = Math.max(MOBILE_TOP_BAR_H + 12, Math.floor((gridH - MOBILE_BOTTOM_BAR_H - gridHeight) / 2));

    for (let i = 0; i < AppRegistry.length; i++) {
        const page = Math.floor(i / MOBILE_PAGE_SIZE);
        const slot = i % MOBILE_PAGE_SIZE;
        const slotRow = Math.floor(slot / MOBILE_HOME_COLS);
        const slotCol = slot % MOBILE_HOME_COLS;
        const x = Math.round(page * pageWidth + startCol + slotCol * (MOBILE_ICON_SIZE + colGap) - scrollOffset);
        const y = startRow + slotRow * (MOBILE_ICON_SIZE + 11 + rowGap);

        if (x > -MOBILE_ICON_SIZE - 20 && x < gridW + 20) {
            drawMobileIcon(AppRegistry[i], i, y, x);
        }
    }

    drawMobilePageDots();
    drawMobileBottomBar();
}

function setMobileProgramFrame(program) {
    const data = program.systemData;
    const keyboardInset = mobileKeyboardVisible() ? MOBILE_KEYBOARD_H : 0;
    data.x = 2;
    data.y = MOBILE_TOP_BAR_H + 2;
    data.width = Math.max(40, gridW - 5);
    data.height = Math.max(40, gridH - MOBILE_TOP_BAR_H - MOBILE_BOTTOM_BAR_H - keyboardInset - 16);
    if (program.setSize) {
        program.setSize(data.width, data.height);
    }
}

function launchProgram(program, front = true) {
    if (isMobileViewport()) {
        setMobileProgramFrame(program);
    }

    if (front) {
        runningPrograms.push(program);
    } else {
        runningPrograms.unshift(program);
    }

    program.initialize(context);
}

const context = {
    spawn: (program) => {
        launchProgram(program, false);
    }
}

let wasMobileViewport = isMobileViewport();

if (!wasMobileViewport) {
    launchProgram(new BrowserProgram());
}

function handleViewportResize() {
    const isMobile = isMobileViewport();
    handleResize();
    clampMobilePage();
    syncMobilePageScroll();
    mobileHome.pointerDown = false;
    mobileHome.moved = false;

    if (isMobile) {
        if (!wasMobileViewport) {
            runningPrograms = [];
            menuOpen = false;
            hoveredMenuIndex = -1;
        } else {
            runningPrograms.forEach(setMobileProgramFrame);
        }
    } else if (wasMobileViewport && runningPrograms.length === 0) {
        launchProgram(new BrowserProgram());
    }

    wasMobileViewport = isMobile;
}

window.addEventListener("resize", handleViewportResize);

let lastFrameTime = -1;

function applyMobileScrollPhysics() {
    if (
        isMobileViewport() &&
        mobileScrollMomentum.program &&
        !mobileProgramTouch.pointerDown &&
        typeof mobileScrollMomentum.program.onScroll === "function"
    ) {
        mobileScrollMomentum.program.onScroll(mobileScrollMomentum.velocity, { phase: "momentum" });
        mobileScrollMomentum.velocity *= 0.92;

        if (Math.abs(mobileScrollMomentum.velocity) < 0.08) {
            mobileScrollMomentum.program = null;
            mobileScrollMomentum.velocity = 0;
        }
    }

    for (const program of runningPrograms) {
        if (typeof program.tickScrollPhysics === "function") {
            program.tickScrollPhysics();
        }
    }
}

function frame() {
    const start = Date.now()
    screen.clear(false);
    applyMobileScrollPhysics();
    
    if (isMobileViewport() && runningPrograms.length === 0) {
        drawMobileHome();
    } else {
        if (isMobileViewport()) {
            runningPrograms.forEach(setMobileProgramFrame);
        }

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
            screen.drawText(data.title, data.y + 2, data.x + 2)
            if (!isMobileViewport()) {
                screen.drawLine(data.y, data.x + data.width - 9, data.y + 10, data.x + data.width - 9);
                screen.drawGlyph(1, data.y + 2, data.x + data.width - 7)
            }

            const surface = runningPrograms[i].frame();

            screen.blitSurface(surface, data.y + 11, data.x + 1, BlendMode.OVERWRITE);
        }

        if (isMobileViewport()) {
            drawMobileTopBar();
            drawMobileKeyboard();
            drawMobileBottomBar();
        } else {
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
        }
    }

    if(!isMobileViewport() && mouseX !== null && mouseY !== null) {
        const row = Math.floor(mouseY / CELL_SIZE);
        const col = Math.floor(mouseX / CELL_SIZE);

        screen.drawGlyph(0, row, col, BlendMode.OVERWRITE); // glyph 0 = mouse pointer
    }

    screen.tickFade();

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, screenTex);

    let uploadData = screen.getFadeBuffer();
    if (screenTextureType === gl.UNSIGNED_BYTE) {
        for (let i = 0; i < uploadData.length; i++) {
            screenUploadData[i] = Math.round(uploadData[i] * 255);
        }
        uploadData = screenUploadData;
    }

    gl.texSubImage2D(
        gl.TEXTURE_2D,
        0,
        0, 0,
        gridW,
        gridH,
        gl.LUMINANCE,
        screenTextureType,
        uploadData
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

function getEventCell(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const x = (clientX - rect.left) * dpr;
    const y = (clientY - rect.top) * dpr;

    return {
        row: Math.floor(y / CELL_SIZE),
        col: Math.floor(x / CELL_SIZE),
        x,
        y
    };
}

function isMobileHomeButton(row, col) {
    const buttonRow = gridH - MOBILE_BOTTOM_BAR_H + 9;
    const buttonCol = Math.floor(gridW / 2);
    const dRow = row - buttonRow;
    const dCol = col - buttonCol;
    return dRow * dRow + dCol * dCol <= 11 * 11;
}

function launchMobileApp(index) {
    const app = AppRegistry[index].create();
    launchProgram(app);
}

function resetMobileProgramTouch() {
    mobileProgramTouch.program = null;
    mobileProgramTouch.pointerDown = false;
    mobileProgramTouch.velocity = 0;
    mobileProgramTouch.moved = false;
    mobileProgramTouch.pendingTap = false;
}

function sendMobileKey(key) {
    if (!mobileKeyboardVisible()) return false;
    const top = runningPrograms[runningPrograms.length - 1];
    const event = {
        key,
        metaKey: false,
        ctrlKey: false,
        altKey: false,
        preventDefault() {}
    };
    return top.onKeyDown(event);
}

function handleMobileKeyboardDown(row, col) {
    if (!mobileKeyboardVisible()) return false;
    if (row < mobileKeyboardTop() || row >= gridH - MOBILE_BOTTOM_BAR_H) return false;

    const done = mobileKeyboardDoneTarget();
    if (
        row >= done.row &&
        row < done.row + done.height &&
        col >= done.col &&
        col < done.col + done.width
    ) {
        runningPrograms[runningPrograms.length - 1].hasFocus = false;
        return true;
    }

    const targets = buildMobileKeyboardTargets();
    const target = targets.find((key) => (
        row >= key.row &&
        row < key.row + key.height &&
        col >= key.col &&
        col < key.col + key.width
    ));

    if (target?.action === "toggleMode") {
        mobileKeyboard.mode = mobileKeyboard.mode === "letters" ? "symbols" : "letters";
    } else if (target) {
        sendMobileKey(target.key);
    }
    return true;
}

function handleMobileDown(row, col) {
    if (!isMobileViewport()) return false;
    canvas.focus({ preventScroll: true });

    if (isMobileHomeButton(row, col)) {
        runningPrograms = [];
        menuOpen = false;
        hoveredMenuIndex = -1;
        return true;
    }

    if (handleMobileKeyboardDown(row, col)) {
        return true;
    }

    if (runningPrograms.length > 0) {
        const top = runningPrograms[runningPrograms.length - 1];
        if (isInsideProgram(top, col, row)) {
            const { x, y } = getLocalCoords(top, col, row);
            mobileProgramTouch.program = top;
            mobileProgramTouch.pointerDown = true;
            mobileProgramTouch.startRow = row;
            mobileProgramTouch.startCol = col;
            mobileProgramTouch.lastRow = row;
            mobileProgramTouch.lastCol = col;
            mobileProgramTouch.velocity = 0;
            mobileProgramTouch.moved = false;
            mobileProgramTouch.pendingTap = typeof top.onScroll === "function";
            mobileScrollMomentum.program = null;
            mobileScrollMomentum.velocity = 0;

            if (!mobileProgramTouch.pendingTap && top.onMouseDown) {
                top.onMouseDown(x, y);
            }
        }
        return true;
    }

    mobileHome.pointerDown = true;
    mobileHome.startCol = col;
    mobileHome.startRow = row;
    mobileHome.currentCol = col;
    mobileHome.startScrollCol = mobileHome.scrollCol;
    mobileHome.moved = false;
    return true;
}

function handleMobileMove(row, col) {
    if (!isMobileViewport()) return false;

    if (runningPrograms.length > 0) {
        const top = mobileProgramTouch.program || runningPrograms[runningPrograms.length - 1];
        if (mobileProgramTouch.pointerDown && mobileProgramTouch.pendingTap) {
            const totalRows = row - mobileProgramTouch.startRow;
            const totalCols = col - mobileProgramTouch.startCol;
            if (Math.abs(totalRows) > 1 || Math.abs(totalCols) > 2) {
                mobileProgramTouch.moved = true;
            }

            const scrollDelta = (mobileProgramTouch.lastRow - row) * CELL_SIZE;
            if (mobileProgramTouch.moved && typeof top.onScroll === "function") {
                top.onScroll(scrollDelta, { phase: "drag" });
                mobileProgramTouch.velocity = mobileProgramTouch.velocity * 0.35 + scrollDelta * 0.65;
            }

            mobileProgramTouch.lastRow = row;
            mobileProgramTouch.lastCol = col;
            return true;
        }

        if (isInsideProgram(top, col, row)) {
            const { x, y } = getLocalCoords(top, col, row);
            if (top.onMouseMove) top.onMouseMove(x, y);
        }
        return true;
    }

    if (mobileHome.pointerDown) {
        mobileHome.currentCol = col;
        if (Math.abs(col - mobileHome.startCol) > 3) {
            mobileHome.moved = true;
        }
        return true;
    }

    return true;
}

function handleMobileUp(row, col) {
    if (!isMobileViewport()) return false;

    if (runningPrograms.length > 0) {
        const top = mobileProgramTouch.program || runningPrograms[runningPrograms.length - 1];
        const inside = isInsideProgram(top, col, row);
        if (inside && mobileProgramTouch.pendingTap && !mobileProgramTouch.moved) {
            const { x, y } = getLocalCoords(top, col, row);
            if (top.onMouseDown) top.onMouseDown(x, y);
            if (top.onMouseUp) top.onMouseUp(x, y);
        } else if (inside && !mobileProgramTouch.pendingTap) {
            const { x, y } = getLocalCoords(top, col, row);
            if (top.onMouseUp) top.onMouseUp(x, y);
        }
        if (mobileProgramTouch.pendingTap && mobileProgramTouch.moved && Math.abs(mobileProgramTouch.velocity) > 0.25) {
            mobileScrollMomentum.program = top;
            mobileScrollMomentum.velocity = mobileProgramTouch.velocity;
        }
        resetMobileProgramTouch();
        return true;
    }

    if (!mobileHome.pointerDown) return true;

    const delta = col - mobileHome.startCol;
    const releaseScrollCol = mobileHome.startScrollCol - delta;
    const threshold = Math.max(12, Math.floor(gridW * 0.18));
    mobileHome.scrollCol = releaseScrollCol;

    if (Math.abs(delta) >= threshold) {
        mobileHome.page += delta < 0 ? 1 : -1;
        clampMobilePage();
    } else if (!mobileHome.moved) {
        const target = mobileHome.iconTargets.find((icon) => (
            col >= icon.col1 &&
            col <= icon.col2 &&
            row >= icon.row1 &&
            row <= icon.row2
        ));

        if (target) {
            launchMobileApp(target.index);
        }
    } else {
        mobileHome.page = Math.round(releaseScrollCol / gridW);
        clampMobilePage();
    }

    mobileHome.pointerDown = false;
    mobileHome.moved = false;
    mobileHome.currentCol = col;
    return true;
}

canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = (e.clientX - rect.left) * dpr;
    mouseY = (e.clientY - rect.top) * dpr;

    const row = Math.floor(mouseY / CELL_SIZE);
    const col = Math.floor(mouseX / CELL_SIZE);

    if (handleMobileMove(row, col)) {
        return;
    }

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

    if (handleMobileDown(row, col)) {
        return;
    }

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
            launchProgram(app);
        }

        menuOpen = false;
        hoveredMenuIndex = -1;
        return;
    }

    // (1) — CHECK X BUTTON FIRST (highest priority)
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

    // (2) — CHECK RESIZE HANDLE (second priority)
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

    // (3) — CHECK TITLE BAR FOR DRAG
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

    // (4) — GIVE PROGRAMS CHANCE (after window controls)
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
});

window.addEventListener("mouseup", (e) => {
    if (isMobileViewport()) {
        const { row, col } = getEventCell(e);
        handleMobileUp(row, col);
        return;
    }

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

canvas.addEventListener("touchstart", (e) => {
    if (!isMobileViewport()) return;
    e.preventDefault();
    const { row, col, x, y } = getEventCell(e);
    mouseX = x;
    mouseY = y;
    handleMobileDown(row, col);
}, { passive: false });

canvas.addEventListener("touchmove", (e) => {
    if (!isMobileViewport()) return;
    e.preventDefault();
    const { row, col, x, y } = getEventCell(e);
    mouseX = x;
    mouseY = y;
    handleMobileMove(row, col);
}, { passive: false });

canvas.addEventListener("touchend", (e) => {
    if (!isMobileViewport()) return;
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = e.changedTouches[0];
    const x = (touch.clientX - rect.left) * dpr;
    const y = (touch.clientY - rect.top) * dpr;
    handleMobileUp(Math.floor(y / CELL_SIZE), Math.floor(x / CELL_SIZE));
}, { passive: false });

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
