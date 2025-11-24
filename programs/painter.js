import { Program } from "../program.js";
import { Surface } from "../screen.js";
import { defaultGlyphSet } from "../glyphs.js";

export class PainterProgram extends Program {
    constructor() {
        super();

        this.systemData = {
            x: 30,
            y: 30,
            z: 0,
            width: 100,
            height: 70,
            title: "Painter"
        };

        this.tool = "pencil"; // or "eraser"
        this.brushDown = false;

        this.lastBrushX = null;
        this.lastBrushY = null;

        this.eraserRadius = 3;

        this._createSurface();
    }

    _createSurface() {
        this.surface = new Surface(
            this.systemData.height,
            this.systemData.width,
            defaultGlyphSet
        );

        // The drawing canvas = whole area except bottom 10px toolbar
        const h = this.systemData.height;
        const w = this.systemData.width;

        this.canvas = new Array(h)
            .fill(null)
            .map(() => new Array(w).fill(false));
    }

    setSize(w, h) {
        this.systemData.width = w;
        this.systemData.height = h;
        this._createSurface();
    }

    _isInToolbar(y) {
        return y >= this.systemData.height - 10;
    }

    onMouseDown(x, y) {
        console.log("on mousedown")
        this.brushDown = true;

        const H = this.systemData.height;

        if (this._isInToolbar(y)) {
            // pencil icon region
            if (x >= 2 && x <= 10) {
                this.tool = "pencil";
            }

            // eraser icon region
            if (x >= 14 && x <= 22) {
                this.tool = "eraser";
            }

            return true;
        }

        this._applyBrush(x, y);
        return true;
    }

    onMouseUp() {
        this.brushDown = false;
        this.lastBrushX = null;
        this.lastBrushY = null;
    }

    onMouseMove(x, y) {
        if (!this.brushDown) return false;

        if (!this._isInToolbar(y)) {
            this._applyBrush(x, y);
        }

        return true;
    }

    _drawLine(x0, y0, x1, y1, fn) {
        if (isNaN(x0) || isNaN(y0) || isNaN(x1) || isNaN(y1)) return;

        const dx = x1 - x0;
        const dy = y1 - y0;
        const steps = Math.max(Math.abs(dx), Math.abs(dy));

        if (steps === 0) {
            fn(Math.round(x0), Math.round(y0));
            return;
        }

        const sx = dx / steps;
        const sy = dy / steps;

        let x = x0;
        let y = y0;

        for (let i = 0; i <= steps; i++) {
            fn(Math.round(x), Math.round(y));
            x += sx;
            y += sy;
        }
    }

    _applyBrush(x, y) {
        const H = this.systemData.height;
        const W = this.systemData.width;

        if (x < 0 || y < 0 || x >= W || y >= H - 10) return;

        const applyPoint = (px, py) => {
            if (px < 0 || py < 0 || px >= W || py >= H - 10) return;

            if (this.tool === "pencil") {
                this.canvas[py][px] = true;
            } else {
                // Eraser
                for (let dy = -this.eraserRadius; dy <= this.eraserRadius; dy++) {
                    for (let dx = -this.eraserRadius; dx <= this.eraserRadius; dx++) {
                        const nx = px + dx;
                        const ny = py + dy;
                        if (
                            nx >= 0 && ny >= 0 &&
                            nx < W && ny < H - 10 &&
                            dx*dx + dy*dy <= this.eraserRadius * this.eraserRadius
                        ) {
                            this.canvas[ny][nx] = false;
                        }
                    }
                }
            }
        };

        if (this.lastBrushX == null) {
            // first point
            applyPoint(x, y);
        } else {
            // draw smooth line between last and current point
            this._drawLine(this.lastBrushX, this.lastBrushY, x, y, applyPoint);
        }

        this.lastBrushX = x;
        this.lastBrushY = y;
    }

    frame() {
        this.surface.clear();

        const H = this.systemData.height;
        const W = this.systemData.width;

        // --- Draw pixels ---
        for (let y = 0; y < H - 10; y++) {
            for (let x = 0; x < W; x++) {
                if (this.canvas[y] && this.canvas[y][x]) {
                    this.surface.setPixel(y, x, true);
                }
            }
        }

        // --- Bottom toolbar ---
        const TY = H - 10;
        this.surface.drawLine(TY, 0, TY, W);

        // Pencil icon at (TY + 1, 2)
        this.surface.drawGlyph(100, TY + 2, 2);   // pencil glyph ID
        // Eraser icon
        this.surface.drawGlyph(101, TY + 2, 14);  // eraser glyph ID

        // Highlight selected tool
        if (this.tool === "pencil") {
            this.surface.drawRect(TY + 1, 1, 8, 12, true);
        } else {
            this.surface.drawRect(TY + 1, 13, 8, 12, true);
        }

        return this.surface;
    }
}