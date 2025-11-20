import { Program } from "../program.js";
import { Surface } from "../screen.js";
import { defaultGlyphSet } from "../glyphs.js";
import { BlendMode } from "../screen.js";

export class BrowserProgram extends Program {
    constructor() {
        super();

        this.systemData = {
            x: 30,
            y: 25,
            z: 0,
            width: 200,
            height: 140,
            title: "Browser"
        };

        this.surface = new Surface(
            this.systemData.height,
            this.systemData.width,
            defaultGlyphSet
        );

        this.url = "/new/intro.md"
        this.data = null;
        this.loading = false;
        this.offsetY = 0;
        this.linkRects = [];
    }

    setSize(w, h) {
        this.systemData.width = w;
        this.systemData.height = h;
        this.surface = new Surface(h, w, defaultGlyphSet);
    }

    _fetch() {
        this.offsetY = 0;

        const fetchData = async () => {
            this.loading = true;

            const request = await fetch(this.url);
            const text = await request.text();

            this.data = this._parseMarkdown(text);
            console.log(text)
            this.loading = false;
        };

        fetchData();
    }

    initialize() {
        this._fetch();
    }

    frame() {
        this.surface.clear();

        if (this.loading) {
            this.surface.drawText("Loading...", 20, 4);
        } else if (this.data) {
            const maxWidth = this.systemData.width - 4;

            let y = 14 - Math.floor(this.offsetY); // below header bar

            for (const block of this.data) {
                const scale = block.scale;
                const lines = this._wrapText(block.text, maxWidth, scale);

                for (const line of lines) {
                    const lineHeight = 8 * scale + 2;   // 8px tall glyphs + small padding

                    this.surface.drawText(line, y, 2, 1, BlendMode.ADD, true, scale);

                    // link underlines...
                    if (block.links.length > 0) {
                        for (const link of block.links) {
                            const before = line.substring(0, link.start);
                            const linkText = link.text;

                            const pxStart = 2 + this._textWidth(before, scale);
                            const pxEnd = pxStart + this._textWidth(linkText, scale) - 2;
                            const underlineY = y + (8 * scale) - 1;

                            this.surface.drawLine(underlineY, pxStart, underlineY, pxEnd, true);

                            this.linkRects.push({
                                x1: pxStart,
                                y1: y,
                                x2: pxEnd,
                                y2: y + 8 * scale,
                                url: link.url
                            });
                        }
                    }

                    // ⬅️ THIS IS THE FIX
                    y += lineHeight;
                }

                y += 4;
            }
        }

        this.surface.drawRect(0, 0, 10, this.systemData.width, false);
        this.surface.drawLine(10, 0, 10, this.systemData.width);
        this.surface.drawText(this.url, 1, 16);

        return this.surface;
    }

    _parseMarkdown(text) {
        const lines = text.split("\n");
        const blocks = [];

        const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

        for (let raw of lines) {
            let line = raw.trim();

            // HEADER
            if (line.startsWith("# ")) {
                blocks.push({
                    type: "header",
                    scale: 2,
                    text: line.substring(2),
                    links: [] // headers don't get links
                });
                continue;
            }

            // TEXT WITH OPTIONAL LINKS
            let links = [];
            let clean = line;

            let match;
            while ((match = linkRegex.exec(line)) !== null) {
                links.push({
                    text: match[1],
                    url: match[2],
                    start: clean.indexOf(match[1]) - 1 // pixel mapping done later
                });
                clean = clean.replace(match[0], match[1]); // remove markdown syntax
            }

            blocks.push({
                type: "text",
                scale: 1,
                text: clean,
                links
            });
        }

        return blocks;
    }

    // Simple pixel-width calculator based on glyph widths
    _textWidth(str, scale = 1) {
        let total = 0;
        for (let i = 0; i < str.length; i++) {
            const g = this.surface.glyphSet.get(str.charCodeAt(i));
            if (!g) continue;
            total += (g[0].length * scale) + 1;
        }
        return total;
    }

    // Word-based wrapping, but scale-aware
    _wrapText(str, maxWidthPx, scale = 1) {
        const words = str.split(" ");
        const lines = [];

        let current = "";
        let currentWidth = 0;

        const spaceGlyph = this.surface.glyphSet.get(" ".charCodeAt(0));
        const spaceWidth = ((spaceGlyph ? spaceGlyph[0].length : 3) * scale) + 1;

        for (const w of words) {
            const wordWidth = this._textWidth(w, scale);

            if (currentWidth + wordWidth + (current ? spaceWidth : 0) <= maxWidthPx) {
                if (!current) {
                    current = w;
                    currentWidth = wordWidth;
                } else {
                    current += " " + w;
                    currentWidth += spaceWidth + wordWidth;
                }
            } else {
                lines.push(current);
                current = w;
                currentWidth = wordWidth;
            }
        }

        if (current) lines.push(current);
        return lines;
    }

    onMouseDown(x, y) {
        // Check if click is inside any link rect
        for (const rect of this.linkRects) {
            if (x >= rect.x1 && x <= rect.x2 &&
                y >= rect.y1 && y <= rect.y2) {

                this.url = rect.url;
                this._fetch();
                return true;
            }
        }

        return true;
    }

    onScroll(deltaY) {
        this.offsetY += deltaY / 10
        this.offsetY = Math.max(this.offsetY, 0)
    }
}