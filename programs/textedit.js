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
        this.scrollY = 0;

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
        this._setCursorFromPixel(x, y);
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
            this._ensureCursorVisible();
            return true;
        }

        if (e.key === "Backspace") {
            const line = this.lines[this.cursorY];
            if (this.cursorX > 0) {
                this.lines[this.cursorY] =
                    line.slice(0, this.cursorX - 1) +
                    line.slice(this.cursorX);
                this.cursorX--;
                this._ensureCursorVisible();
                return true;
            }
            if (this.cursorY > 0) {
                const prev = this.lines[this.cursorY - 1];
                this.cursorX = prev.length;
                this.lines[this.cursorY - 1] = prev + line;
                this.lines.splice(this.cursorY, 1);
                this.cursorY--;
                this._ensureCursorVisible();
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
            this._ensureCursorVisible();
            return true;
        }

        if (e.key === "ArrowLeft") {
            if (this.cursorX > 0) this.cursorX--;
            else if (this.cursorY > 0) {
                this.cursorY--;
                this.cursorX = this.lines[this.cursorY].length;
            }
            this._ensureCursorVisible();
            return true;
        }

        if (e.key === "ArrowRight") {
            const line = this.lines[this.cursorY];
            if (this.cursorX < line.length) this.cursorX++;
            else if (this.cursorY < this.lines.length - 1) {
                this.cursorY++;
                this.cursorX = 0;
            }
            this._ensureCursorVisible();
            return true;
        }

        if (e.key === "ArrowUp") {
            if (this.cursorY > 0) {
                this.cursorY--;
                this.cursorX = Math.min(this.cursorX, this.lines[this.cursorY].length);
            }
            this._ensureCursorVisible();
            return true;
        }

        if (e.key === "ArrowDown") {
            if (this.cursorY < this.lines.length - 1) {
                this.cursorY++;
                this.cursorX = Math.min(this.cursorX, this.lines[this.cursorY].length);
            }
            this._ensureCursorVisible();
            return true;
        }

        return false;
    }

    onScroll(deltaY) {
        const maxScroll = this._maxScroll();
        const beyondBounds = this.scrollY < 0 || this.scrollY > maxScroll;
        this.scrollY += (deltaY / 10) * (beyondBounds ? 0.35 : 1);
        this._clampRubberScroll();
    }

    tickScrollPhysics() {
        const maxScroll = this._maxScroll();

        if (this.scrollY < 0) {
            this.scrollY *= 0.72;
            if (this.scrollY > -0.05) this.scrollY = 0;
        } else if (this.scrollY > maxScroll) {
            this.scrollY = maxScroll + (this.scrollY - maxScroll) * 0.72;
            if (this.scrollY < maxScroll + 0.05) this.scrollY = maxScroll;
        }
    }

    frame() {
        this.surface.clear();

        const viewH = this.systemData.height;
        const lineHeight = 8;
        const startLine = Math.max(0, Math.floor(this.scrollY / lineHeight));
        const endLine = Math.min(
            this.lines.length,
            startLine + Math.ceil(viewH / lineHeight) + 1
        );

        for (let i = startLine; i < endLine; i++) {
            const line = this.lines[i] || "";
            const y = (i * lineHeight) - Math.floor(this.scrollY);
            if (y > -lineHeight && y < viewH) {
                this.surface.drawText(line, y, 0);
            }
        }

        // blinking cursor
        this.cursorBlink += 0.05;
        const showCursor = Math.sin(this.cursorBlink * 6) > 0;

        if (this.hasFocus && showCursor) {
            const cursorLine = this.lines[this.cursorY] || "";
            const offset = this._textWidth(cursorLine.slice(0, this.cursorX));
            const cursorY = (this.cursorY * lineHeight) - Math.floor(this.scrollY);

            if (cursorY >= 0 && cursorY + lineHeight <= viewH) {
                this.surface.drawLine(cursorY, offset, cursorY + lineHeight - 1, offset);
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

    _setCursorFromPixel(x, y) {
        const lineHeight = 8;
        const lineIndex = Math.floor((Math.max(0, y) + this.scrollY) / lineHeight);
        this.cursorY = Math.max(0, Math.min(lineIndex, this.lines.length - 1));
        const line = this.lines[this.cursorY] || "";
        this.cursorX = this._pixelToCharIndex(line, x);
        this._ensureCursorVisible();
    }

    _pixelToCharIndex(line, pixelX) {
        let currentX = 0;
        const targetX = Math.max(0, pixelX);

        for (let i = 0; i < line.length; i++) {
            const glyph = this.surface.glyphSet.get(line.charCodeAt(i));
            const charWidth = glyph ? glyph[0].length + 1 : 6;
            if (currentX + charWidth / 2 >= targetX) {
                return i;
            }
            currentX += charWidth;
        }

        return line.length;
    }

    _ensureCursorVisible() {
        const lineHeight = 8;
        const cursorTop = this.cursorY * lineHeight;
        const cursorBottom = cursorTop + lineHeight;

        if (cursorTop < this.scrollY) {
            this.scrollY = cursorTop;
        } else if (cursorBottom > this.scrollY + this.systemData.height) {
            this.scrollY = cursorBottom - this.systemData.height;
        }

        this._clampScroll();
    }

    _clampScroll() {
        const maxScroll = this._maxScroll();
        this.scrollY = Math.max(0, Math.min(this.scrollY, maxScroll));
    }

    _clampRubberScroll() {
        const maxScroll = this._maxScroll();
        const limit = Math.max(16, Math.floor(this.systemData.height * 0.35));
        this.scrollY = Math.max(-limit, Math.min(this.scrollY, maxScroll + limit));
    }

    _maxScroll() {
        const lineHeight = 8;
        return Math.max(0, (this.lines.length * lineHeight) - this.systemData.height);
    }
}
