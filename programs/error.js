import { Program } from "../program.js";
import { Surface } from "../screen.js";
import { defaultGlyphSet, ERROR_GLYPH } from "../glyphs.js";

export class ErrorProgram extends Program {
    constructor(errorMessage) {
        super();

        this.systemData = {
            x: 50,
            y: 50,
            z: 0,
            width: 200,
            height: 80,
            title: "Error"
        };

        this.surface = new Surface(
            this.systemData.height,
            this.systemData.width,
            defaultGlyphSet
        );

        this.errorMessage = errorMessage;
    }

    setSize(w, h) {
        this.systemData.width = w;
        this.systemData.height = h;
        this.surface = new Surface(h, w, defaultGlyphSet);
    }

    frame() {
        this.surface.clear();

        this.surface.drawGlyph(ERROR_GLYPH, 20, 20);
        this.surface.drawText(this.errorMessage, 20, 30);

        return this.surface;
    }
}

