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
    constructor(systemData = {...defaultSystemData}) {
        this.systemData = systemData
        this.surface = new Surface(this.systemData.height, this.systemData.width)
    }

    initialize() {
        this.initialized = true;
    }

    frame() {
        this.surface.clear();
        for(let j = 0; j < this.systemData.height; j++) {
            for(let i = 0; i < this.systemData.width; i++) {
                this.surface.setPixel(j, i, Math.random() > 0.5);
            }
        }

        return this.surface;
    }
}