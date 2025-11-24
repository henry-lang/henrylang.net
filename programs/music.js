import { defaultGlyphSet } from "../glyphs.js";
import { Program } from "../program.js";
import { Surface } from "../screen.js";

export class MusicProgram extends Program {
    constructor() {
        super();

        this.systemData = {
            x: 50,
            y: 50,
            z: 0,
            width: 80,
            height: 100,
            title: "Music"
        };

        this.fetchedData = null;
        this.imageMatrix = null;
        this.titleScroll = 0;
        this._createSurface();
    }

    _createSurface() {
        this.surface = new Surface(
            this.systemData.height,
            this.systemData.width,
            defaultGlyphSet
        );
    }

    setSize(width, height) {
        this.systemData.width = width;
        this.systemData.height = height;
        this._createSurface();
    }

    initialize() {
        const fetchData = async () => {
            const url =
                "https://lastfm-last-played.biancarosa.com.br/henrylang/latest-song";

            const response = await fetch(url);
            const result = await response.json();
            this.fetchedData = result;
            this.fullTitle = `${this.fetchedData.track.name} - ${this.fetchedData.track.artist["#text"]}`;
            
            const imgUrl = result.track.image.find((i) => i.size === "large")["#text"];
            const imgReq = await fetch(imgUrl);
            const blob = await imgReq.blob();

            const image = new Image();
            image.src = URL.createObjectURL(blob);
            await image.decode();

            const SIZE = 80;

            const tempCanvas = document.createElement("canvas");
            tempCanvas.width = SIZE;
            tempCanvas.height = SIZE;

            const ctx = tempCanvas.getContext("2d");
            ctx.drawImage(image, 0, 0, SIZE, SIZE);

            const raw = ctx.getImageData(0, 0, SIZE, SIZE).data;

            const matrix = [];
            for (let y = 0; y < SIZE; y++) {
                const row = [];
                for (let x = 0; x < SIZE; x++) {
                    const idx = (y * SIZE + x) * 4;
                    const r = raw[idx];
                    const g = raw[idx + 1];
                    const b = raw[idx + 2];
                    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
                    row.push(gray / 255);
                }
                matrix.push(row);
            }

            this.imageMatrix = matrix;
        };

        fetchData();
    }

    frame() {
        this.surface.clear();

        const h = this.systemData.height;
        const w = this.systemData.width;

        if (!this.fetchedData || !this.imageMatrix) {
            for (let j = 0; j < h; j++) {
                for (let i = 0; i < w; i++) {
                    this.surface.setPixel(j, i, Math.random() > 0.5);
                }
            }
            return this.surface;
        }

        const img = this.imageMatrix;
        const SIZE = 80;

        for (let y = 1; y < SIZE - 1; y++) {
            for (let x = 1; x < SIZE - 1; x++) {
                const tl = img[y-1][x-1];
                const  t = img[y-1][x];
                const tr = img[y-1][x+1];
                const  l = img[y][x-1];
                const  r = img[y][x+1];
                const bl = img[y+1][x-1];
                const  b = img[y+1][x];
                const br = img[y+1][x+1];

                const gx = -tl + tr + -2*l + 2*r + -bl + br;
                const gy = -tl - 2*t - tr + bl + 2*b + br;

                const edge = Math.sqrt(gx * gx + gy * gy);

                this.surface.setPixel(y, x, edge > 0.18);
            }
        }

        this.surface.drawLine(81, 0, 81, this.systemData.width);

        this.surface.drawText(this.fullTitle, 83, 1 - Math.floor(this.titleScroll));
        this.titleScroll += 0.1

        return this.surface;
    }
}