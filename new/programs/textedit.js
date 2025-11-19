import { Program } from "../program.js";
import { Surface } from "../screen.js";
import { defaultGlyphSet } from "../glyphs.js";

export class TextEditProgram extends Program {
    constructor() {
        super();

        this.systemData = {
            x: 20,
            y: 20,
            z: 0,
            width: 80,
            height: 50,
            title: "Text Edit"
        };

        this.lines = [""];
        this.cursorX = 0;
        this.cursorY = 0;
        this.cursorBlink = 0;
        this.hasFocus = false;

        this._createSurface();
    }

    _createSurface() {
        this.surface = new Surface(
            this.systemData.height,
            this.systemData.width,
            defaultGlyphSet
        );
    }

    setSize(w, h) {
        this.systemData.width = w;
        this.systemData.height = h;
        this._createSurface();
    }

    onMouseDown(x, y) {
        if (y < 0 || y >= this.lines.length) {
            this.cursorY = Math.max(0, Math.min(y, this.lines.length - 1));
            return true;
        }

        const line = this.lines[y] || "";
        this.cursorY = y;
        this.cursorX = Math.max(0, Math.min(x, line.length));

        this.hasFocus = true;
        return true;
    }

    onKeyDown(e) {
        if (!this.hasFocus) return false;

        if (e.key.length === 1) {
            const line = this.lines[this.cursorY];
            const before = line.slice(0, this.cursorX);
            const after = line.slice(this.cursorX);
            this.lines[this.cursorY] = before + e.key + after;
            this.cursorX++;
            return true;
        }

        if (e.key === "Backspace") {
            const line = this.lines[this.cursorY];
            if (this.cursorX > 0) {
                this.lines[this.cursorY] =
                    line.slice(0, this.cursorX - 1) +
                    line.slice(this.cursorX);
                this.cursorX--;
                return true;
            }
            if (this.cursorY > 0) {
                const prev = this.lines[this.cursorY - 1];
                this.cursorX = prev.length;
                this.lines[this.cursorY - 1] = prev + line;
                this.lines.splice(this.cursorY, 1);
                this.cursorY--;
                return true;
            }
            return true;
        }

        if (e.key === "Enter") {
            const line = this.lines[this.cursorY];
            const before = line.slice(0, this.cursorX);
            const after = line.slice(this.cursorX);

            this.lines[this.cursorY] = before;
            this.lines.splice(this.cursorY + 1, 0, after);

            this.cursorY++;
            this.cursorX = 0;
            return true;
        }

        if (e.key === "ArrowLeft") {
            if (this.cursorX > 0) this.cursorX--;
            else if (this.cursorY > 0) {
                this.cursorY--;
                this.cursorX = this.lines[this.cursorY].length;
            }
            return true;
        }

        if (e.key === "ArrowRight") {
            const line = this.lines[this.cursorY];
            if (this.cursorX < line.length) this.cursorX++;
            else if (this.cursorY < this.lines.length - 1) {
                this.cursorY++;
                this.cursorX = 0;
            }
            return true;
        }

        if (e.key === "ArrowUp") {
            if (this.cursorY > 0) {
                this.cursorY--;
                this.cursorX = Math.min(this.cursorX, this.lines[this.cursorY].length);
            }
            return true;
        }

        if (e.key === "ArrowDown") {
            if (this.cursorY < this.lines.length - 1) {
                this.cursorY++;
                this.cursorX = Math.min(this.cursorX, this.lines[this.cursorY].length);
            }
            return true;
        }

        return false;
    }

    frame() {
        this.surface.clear();

        const viewH = this.systemData.height;

        for (let y = 0; y < viewH && y < this.lines.length; y++) {
            const line = this.lines[y];
            this.surface.drawText(line, y * 8, 0);
        }

        // blinking cursor
        this.cursorBlink += 0.05;
        const showCursor = Math.sin(this.cursorBlink * 6) > 0;

        if (this.hasFocus && showCursor) {
            const cursorLine = this.lines[this.cursorY] || "";
            const offset = this._textWidth(cursorLine.slice(0, this.cursorX));

            if (this.cursorY < viewH) {
                this.surface.setPixel(this.cursorY, offset, true);
            }
        }

        return this.surface;
    }

    _textWidth(str) {
        let total = 0;

        for (let i = 0; i < str.length; i++) {
            const code = str.charCodeAt(i);
            const glyph = this.surface.glyphSet.get(code);
            if (!glyph) continue;
            total += glyph[0].length + 1; // 1 pixel spacing
        }

        return total;
    }
}
