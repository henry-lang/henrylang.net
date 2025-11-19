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

        this.frameTime = null
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

        this.surface.drawText(`Frame time: ${this.frameTime}ms`, 1, 1);

        return this.surface;
    }

    processDebugInfo(debugInfo) {
        if(debugInfo.frameTime) {
            this.frameTime = debugInfo.frameTime;
        }
    }
}