import { defaultGlyphSet } from "../glyphs.js";
import { Program } from "../program.js";
import { Surface } from "../screen.js";

export class DebuggerProgram extends Program {
    constructor() {
        super();

        this.systemData = {
            x: 30,
            y: 25,
            z: 0,
            width: 120,
            height: 60,
            title: "Debugger"
        };

        this.surface = new Surface(
            this.systemData.height,
            this.systemData.width,
            defaultGlyphSet
        );

        this.debugInfo = null
    }

    setSize(w, h) {
        this.systemData.width = w;
        this.systemData.height = h;
        this.surface = new Surface(h, w, defaultGlyphSet);
    }

    initialize() {
        
    }

    frame() {
        this.surface.clear();

        if(this.debugInfo) {
            this.surface.drawText(`Frame time: ${this.debugInfo.frameTime}ms`, 1, 1);
            this.surface.drawText(`Glyphs rendered: ${this.debugInfo.glyphsRendered}`, 9, 1);
            this.surface.drawText(`Lines rendered: ${this.debugInfo.linesRendered}`, 18, 1);
            this.surface.drawText(`Rects rendered: ${this.debugInfo.rectsRendered}`, 27, 1);
            this.surface.drawText(`Surface blits: ${this.debugInfo.surfaceBlits}`, 36, 1);
        }

        return this.surface;
    }

    processDebugInfo(debugInfo) {
        this.debugInfo = debugInfo;
    }
}