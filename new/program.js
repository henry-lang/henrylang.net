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
}