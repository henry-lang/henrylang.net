import { Surface } from "./screen.js";

const defaultSystemData = {
    x: 50,
    y: 50,
    z: 0,
    width: 80,
    height: 50,
    title: "Program"
};

export class Program {
    constructor(systemData = { ...defaultSystemData }) {
        this.systemData = systemData;
        this._createSurface();
    }

    _createSurface() {
        this.surface = new Surface(this.systemData.height, this.systemData.width);
    }

    setSize(width, height) {
        this.systemData.width = width;
        this.systemData.height = height;
        this._createSurface();   // <-- recreate backing buffer
    }

    initialize() {
        this.initialized = true;
    }

    frame() {
        this.surface.clear();

        // Use the *current* size:
        const h = this.systemData.height;
        const w = this.systemData.width;

        for (let j = 0; j < h; j++) {
            for (let i = 0; i < w; i++) {
                this.surface.setPixel(j, i, Math.random() > 0.5);
            }
        }

        return this.surface;
    }
}