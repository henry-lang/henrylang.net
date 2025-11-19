export const BlendMode = {
    OVERWRITE: Symbol("OVERWRITE"),
    ADD: Symbol("ADD")
}

export class GlyphSet {
    constructor() {
        this.map = new Map();
    }

    set(id, matrix) {
        this.map.set(id, matrix);
    }

    get(id) {
        return this.map.get(id);
    }
}

export class Surface {
    constructor(rows, cols, glyphSet = null) {
        this.rows = rows;
        this.cols = cols;
        this.glyphSet = glyphSet;

        this.vram = new Uint8Array(rows * cols);
        this.clear(false);
    }

    index(row, col) {
        return row * this.cols + col;
    }

    inBounds(row, col) {
        return (
            row >= 0 &&
            row < this.rows &&
            col >= 0 &&
            col < this.cols
        );
    }

    setPixel(row, col, val) {
        if (!this.inBounds(row, col)) return;
        this.vram[this.index(row, col)] = val ? 1 : 0;
    }

    getPixel(row, col) {
        if (!this.inBounds(row, col)) return false;
        return this.vram[this.index(row, col)] === 1;
    }

    clear(val = false) {
        this.vram.fill(val ? 1 : 0);
    }

    drawRect(y, x, h, w, val) {
        for (let row = y; row < y + h; row++) {
            for (let col = x; col < x + w; col++) {
                this.setPixel(row, col, val);
            }
        }
    }

    drawLine(y0, x0, y1, x1) {
        let dx = Math.abs(x1 - x0);
        let sx = x0 < x1 ? 1 : -1;
        let dy = -Math.abs(y1 - y0);
        let sy = y0 < y1 ? 1 : -1;
        let error = dx + dy;

        while (true) {
            this.setPixel(y0, x0, true);

            if (x0 === x1 && y0 === y1) break;

            let e2 = 2 * error;
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

    // blendMode can either be overwrite or add
    drawGlyph(id, row, col, blendMode=BlendMode.ADD) {
        if (!this.glyphSet) return;
        const glyph = this.glyphSet.get(id);
        if (!glyph) return;

        const gr = glyph.length;
        const gc = glyph[0].length;

        for (let j = 0; j < gr; j++) {
            for (let i = 0; i < gc; i++) {
                if (blendMode == BlendMode.OVERWRITE) {
                    this.setPixel(row + j, col + i, glyph[j][i]);
                } else if (blendMode == BlendMode.ADD) {
                    if (glyph[j][i]) {
                        this.setPixel(row + j, col + i, glyph[j][i]);
                    }
                }
            }
        }
    }

    drawGlyphs(glyphs, row, col, spacing = 0) {
        if (!this.glyphSet) return;

        const gw = this.glyphSet.width;
        for (let i = 0; i < glyphs.length; i++) {
            this.drawGlyph(
                glyphs[i],
                row,
                col + i * (gw + spacing)
            );
        }
    }

    blitSurface(source, destRow, destCol, blendMode=BlendMode.ADD) {
        const srcRows = source.rows;
        const srcCols = source.cols;
        const srcVRAM = source.vram;

        for (let r = 0; r < srcRows; r++) {
            for (let c = 0; c < srcCols; c++) {

                const val = srcVRAM[r * srcCols + c];

                if (blendMode == BlendMode.OVERWRITE) {
                    this.setPixel(destRow + r, destCol + c, val === 1);
                } else if (blendMode == BlendMode.ADD) {
                    if (val === 1) {
                        this.setPixel(destRow + r, destCol + c, val === 1);
                    }
                }
            }
        }
    }

    drawText(text, row, col, spacing = 1) {
        if (!this.glyphSet) return;

        let x = col;

        for (let i = 0; i < text.length; i++) {
            const ch = text[i];
            const code = ch.charCodeAt(0);
            const glyph = this.glyphSet.get(code);

            if (!glyph) {
                continue;
            }

            // Draw the glyph
            this.drawGlyph(code, row, x);

            // Advance cursor by glyph width + spacing
            x += glyph[0].length + spacing;
        }
    }

    drawChar(ch, row, col) {
        if (!this.glyphSet) return;

        const code = typeof ch === "string" ? ch.charCodeAt(0) : ch;
        const glyph = this.glyphSet.get(code);
        if (!glyph) return;

        this.drawGlyph(code, row, col, BlendMode.OVERWRITE);
    }

    getVRAM() {
        return this.vram;
    }
}

export class Screen extends Surface {
    constructor(rows, cols, fadeTime, glyphSet = null) {
        super(rows, cols, glyphSet);

        this.fadeTime = fadeTime;
        this.amount = new Float32Array(rows * cols);
    }

    tickFade() {
        const delta = 1.0 / this.fadeTime;
        const N = this.rows * this.cols;

        for (let i = 0; i < N; i++) {
            if (this.vram[i]) {
                this.amount[i] = Math.min(1.0, this.amount[i] + delta);
            } else {
                this.amount[i] = Math.max(0.0, this.amount[i] - delta);
            }
        }
    }

    getFadeBuffer() {
        return this.amount;
    }
}