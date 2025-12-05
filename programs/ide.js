import { Program } from "../program.js";
import { Surface } from "../screen.js";
import { defaultGlyphSet, PLAY_BUTTON_GLYPH } from "../glyphs.js";
import { BrowserProgram } from "./browser.js";

export class IDEProgram extends Program {
    constructor() {
        super();

        this.systemData = {
            x: 30,
            y: 25,
            z: 0,
            width: 200,
            height: 150,
            title: "IDE"
        };

        this.lines = [
            "constructor() {",
            "    super();",
            "    ",
            "    this.systemData = {",
            "        x: 50,",
            "        y: 50,",
            "        z: 0,",
            "        width: 80,",
            "        height: 50,",
            "        title: \"Program\"",
            "    };",
            "    ",
            "    this._createSurface();",
            "}",
            "",
            "_createSurface() {",
            "    this.surface = new Surface(",
            "        this.systemData.height,",
            "        this.systemData.width,",
            "        defaultGlyphSet",
            "    );",
            "}",
            "",
            "setSize(w, h) {",
            "    this.systemData.width = w;",
            "    this.systemData.height = h;",
            "    this._createSurface();",
            "}",
            "",
            "initialize() {",
            "    ",
            "}",
            "",
            "frame() {",
            "    return this.surface;",
            "}",
            "",
            "onMouseDown(x, y) { return false; }",
            "onMouseUp(x, y) { return false; }",
            "onMouseMove(x, y) { return false; }",
            "onMouseDrag(x, y, dx, dy) { return false; }",
            "",
            "onKeyDown(e) { return false; }",
            "onKeyUp(e) { return false; }"
        ];
        this.cursorX = 0;
        this.cursorY = 0;
        this.cursorBlink = 0;
        this.hasFocus = false;
        this.scrollY = 0;

        this._createSurface();
    }

    initialize(context) {
        this.context = context;
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

    compile() {
        const code = this.lines.join("\n");
        const completeSource = `
const c = class extends Program {
${code}
};

c
`
        const compiledClass = eval(completeSource);
        console.log(compiledClass);
        return compiledClass;
    }

    onMouseDown(x, y) {
        if (x >= 1 && y >= 1 && x <= 9 && y <= 9) {
            const ProgramClass = this.compile();
            this.context.spawn(new ProgramClass());
            return true;
        }

        // Text editing area
        const textStartY = 12;
        const lineHeight = 8;
        
        if (y < textStartY) {
            return true;
        }

        const relativeY = y - textStartY + this.scrollY;
        const lineIndex = Math.floor(relativeY / lineHeight);

        if (lineIndex >= 0 && lineIndex < this.lines.length) {
            const line = this.lines[lineIndex] || "";
            const charIndex = this._pixelToCharIndex(line, x - 2);
            
            this.cursorY = lineIndex;
            this.cursorX = charIndex;
            this.hasFocus = true;
            return true;
        }

        this.hasFocus = true;
        return true;
    }

    onKeyDown(e) {
        if (!this.hasFocus) return false;

        if (e.key.length === 1) {
            const line = this.lines[this.cursorY] || "";
            const before = line.slice(0, this.cursorX);
            const after = line.slice(this.cursorX);
            this.lines[this.cursorY] = before + e.key + after;
            this.cursorX++;
            return true;
        }

        if (e.key === "Backspace") {
            const line = this.lines[this.cursorY] || "";
            if (this.cursorX > 0) {
                this.lines[this.cursorY] =
                    line.slice(0, this.cursorX - 1) +
                    line.slice(this.cursorX);
                this.cursorX--;
                return true;
            }
            if (this.cursorY > 0) {
                const prev = this.lines[this.cursorY - 1] || "";
                this.cursorX = prev.length;
                this.lines[this.cursorY - 1] = prev + line;
                this.lines.splice(this.cursorY, 1);
                this.cursorY--;
                return true;
            }
            return true;
        }

        if (e.key === "Enter") {
            const line = this.lines[this.cursorY] || "";
            const before = line.slice(0, this.cursorX);
            const after = line.slice(this.cursorX);

            this.lines[this.cursorY] = before;
            this.lines.splice(this.cursorY + 1, 0, after);

            this.cursorY++;
            this.cursorX = 0;
            return true;
        }

        if (e.key === "ArrowLeft") {
            if (this.cursorX > 0) {
                this.cursorX--;
            } else if (this.cursorY > 0) {
                this.cursorY--;
                this.cursorX = (this.lines[this.cursorY] || "").length;
            }
            return true;
        }

        if (e.key === "ArrowRight") {
            const line = this.lines[this.cursorY] || "";
            if (this.cursorX < line.length) {
                this.cursorX++;
            } else if (this.cursorY < this.lines.length - 1) {
                this.cursorY++;
                this.cursorX = 0;
            }
            return true;
        }

        if (e.key === "ArrowUp") {
            if (this.cursorY > 0) {
                this.cursorY--;
                const line = this.lines[this.cursorY] || "";
                this.cursorX = Math.min(this.cursorX, line.length);
            }
            return true;
        }

        if (e.key === "ArrowDown") {
            if (this.cursorY < this.lines.length - 1) {
                this.cursorY++;
                const line = this.lines[this.cursorY] || "";
                this.cursorX = Math.min(this.cursorX, line.length);
            }
            return true;
        }

        return false;
    }

    onScroll(deltaY) {
        this.scrollY += deltaY / 10;
        this.scrollY = Math.max(0, this.scrollY);
        const maxScroll = Math.max(0, (this.lines.length * 8) - (this.systemData.height - 12));
        this.scrollY = Math.min(this.scrollY, maxScroll);
    }

    frame() {
        this.surface.clear();

        const viewH = this.systemData.height;
        const textStartY = 12;
        const lineHeight = 8;

        // Draw visible lines
        const startLine = Math.floor(this.scrollY / lineHeight);
        const endLine = Math.min(
            this.lines.length,
            startLine + Math.ceil((viewH - textStartY) / lineHeight) + 1
        );

        for (let i = startLine; i < endLine; i++) {
            const line = this.lines[i] || "";
            const y = textStartY + (i * lineHeight) - Math.floor(this.scrollY);
            
            if (y < viewH) {
                this.surface.drawText(line, y, 2);
            }
        }

        this.cursorBlink += 0.05;
        const showCursor = Math.sin(this.cursorBlink * 6) > 0;

        if (this.hasFocus && showCursor) {
            const cursorLine = this.lines[this.cursorY] || "";
            const offset = this._textWidth(cursorLine.slice(0, this.cursorX));
            const cursorY = textStartY + (this.cursorY * lineHeight) - Math.floor(this.scrollY);
            const cursorX = 2 + offset;

            if (cursorY >= textStartY && cursorY + lineHeight <= viewH) {
                this.surface.drawLine(cursorY, cursorX, cursorY + lineHeight - 1, cursorX);
            }
        }

        this.surface.drawRect(0, 0, 10, this.systemData.width, false);
        this.surface.drawLine(9, 0, 9, this.systemData.width);
        this.surface.drawGlyph(PLAY_BUTTON_GLYPH, 1, 1);
        this.surface.drawLine(0, 9, 9, 9);

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

    _pixelToCharIndex(line, pixelX) {
        let currentX = 0;
        
        for (let i = 0; i <= line.length; i++) {
            const char = line[i];
            if (char) {
                const code = char.charCodeAt(0);
                const glyph = this.surface.glyphSet.get(code);
                if (glyph) {
                    const charWidth = glyph[0].length + 1;
                    if (currentX + charWidth / 2 > pixelX) {
                        return i;
                    }
                    currentX += charWidth;
                }
            } else {
                // End of line
                if (currentX > pixelX) {
                    return i;
                }
            }
        }
        
        return line.length;
    }
}

