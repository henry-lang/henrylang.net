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
    }

    setSize(width, height) {

    }

    initialize() {

    }

    frame() {

    }

    onMouseDown(x, y) { return false; }
    onMouseUp(x, y) { return false; }
    onMouseMove(x, y) { return false; }
    onMouseDrag(x, y, dx, dy) { return false; }

    onKeyDown(e) { return false; }
    onKeyUp(e) { return false; }
}