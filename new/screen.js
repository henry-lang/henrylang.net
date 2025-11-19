export class GlyphSet {
    constructor() {
        this.map = new Map();
        this.width = 8;
        this.height = 8;
    }

    set(id, matrix) {
        this.map.set(id, matrix);
    }

    get(id) {
        return this.map.get(id);
    }
}

export class Screen {
    constructor(rows, cols, fadeTime, glyphSet = null) {
        this.rows = rows;
        this.cols = cols;
        this.fadeTime = fadeTime;
        this.glyphSet = glyphSet;

        this.vram = new Uint8Array(rows * cols);
        this.amount = new Float32Array(rows * cols);

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

    drawGlyph(id, row, col) {
        if (!this.glyphSet) return;
        const glyph = this.glyphSet.get(id);
        if (!glyph) return;

        const gr = glyph.length;
        const gc = glyph[0].length;

        for (let j = 0; j < gr; j++) {
            for (let i = 0; i < gc; i++) {
                this.setPixel(row + j, col + i, glyph[j][i]);
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

    getVRAM() {
        return this.vram;
    }
}
