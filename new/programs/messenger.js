import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";

import {
    getFirestore,
    collection,
    addDoc,
    serverTimestamp,
    query,
    orderBy,
    limit,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

import { Program } from "../program.js";
import { Surface } from "../screen.js";
import { defaultGlyphSet } from "../glyphs.js";

const firebaseConfig = {
    apiKey: "AIzaSyA_V6wqM9VbCpe-6QvwNfEqP7w2ufON6V8",
    authDomain: "henrylang-chat.firebaseapp.com",
    projectId: "henrylang-chat",
    storageBucket: "henrylang-chat.firebasestorage.app",
    messagingSenderId: "218457777426",
    appId: "1:218457777426:web:d34fcfe05178546af0ffcb"
};

initializeApp(firebaseConfig);
const db = getFirestore();

export class MessengerProgram extends Program {
    constructor() {
        super();

        this.systemData = {
            x: 30,
            y: 25,
            z: 0,
            width: 120,
            height: 90,
            title: "Messenger"
        };

        this.surface = new Surface(
            this.systemData.height,
            this.systemData.width,
            defaultGlyphSet
        );

        this.username = null;
        this.messages = [];

        this.input = "";
        this.cursorX = 0;
        this.cursorBlink = 0;
        this.hasFocus = false;

        this._setupListener();
    }

    setSize(w, h) {
        this.systemData.width = w;
        this.systemData.height = h;
        this.surface = new Surface(h, w, defaultGlyphSet);
    }

    _setupListener() {
        const q = query(
            collection(db, "messages"),
            orderBy("created", "desc"),
            limit(10)
        );

        onSnapshot(q, (snap) => {
            const arr = [];
            snap.forEach((doc) => arr.push(doc.data()));
            arr.reverse();
            this.messages = arr;
        });
    }

    async _sendMessage(text) {
        if (!this.username) return;

        await addDoc(collection(db, "messages"), {
            user: this.username,
            text,
            created: serverTimestamp()
        });
    }

    onMouseDown(x, y) {
        this.hasFocus = true;

        const barH = this.systemData.height - 12;
        if (y >= barH) {
            this.cursorX = this.input.length;
            return true;
        }

        return true;
    }

    onKeyDown(e) {
        if (!this.hasFocus) return false;

        // -------- USERNAME ENTRY --------
        if (!this.username) {
            if (e.key.length === 1) {
                this.input += e.key;
                this.cursorX++;
                return true;
            }
            if (e.key === "Backspace") {
                this.input = this.input.slice(0, -1);
                this.cursorX = Math.max(0, this.cursorX - 1);
                return true;
            }
            if (e.key === "Enter") {
                if (this.input.trim().length > 0) {
                    this.username = this.input.trim();
                }
                this.input = "";
                this.cursorX = 0;
                return true;
            }
            return true;
        }

        // -------- NORMAL MESSAGE INPUT --------
        if (e.key.length === 1) {
            this.input =
                this.input.slice(0, this.cursorX) +
                e.key +
                this.input.slice(this.cursorX);
            this.cursorX++;
            return true;
        }

        if (e.key === "Backspace") {
            if (this.cursorX > 0) {
                this.input =
                    this.input.slice(0, this.cursorX - 1) +
                    this.input.slice(this.cursorX);
                this.cursorX--;
            }
            return true;
        }

        if (e.key === "Enter") {
            if (this.input.trim().length > 0) {
                this._sendMessage(this.input.trim());
            }
            this.input = "";
            this.cursorX = 0;
            return true;
        }

        if (e.key === "ArrowLeft") {
            this.cursorX = Math.max(0, this.cursorX - 1);
            return true;
        }

        if (e.key === "ArrowRight") {
            this.cursorX = Math.min(this.input.length, this.cursorX + 1);
            return true;
        }

        return false;
    }

    _textWidth(str) {
        let total = 0;
        for (let i = 0; i < str.length; i++) {
            const g = this.surface.glyphSet.get(str.charCodeAt(i));
            if (!g) continue;
            total += g[0].length + 1;
        }
        return total;
    }

    _wrapText(str, maxWidthPx) {
        const words = str.split(" ");
        const lines = [];

        let current = "";
        let currentWidth = 0;

        const spaceGlyph = this.surface.glyphSet.get(" ".charCodeAt(0));
        const spaceWidth = (spaceGlyph ? spaceGlyph[0].length : 3) + 1;

        for (let w of words) {
            const wordWidth = this._textWidth(w);

            // If single word too long → break into chunks
            if (wordWidth > maxWidthPx) {
                if (current.length > 0) {
                    lines.push(current);
                    current = "";
                    currentWidth = 0;
                }

                let chunk = "";
                let chunkWidth = 0;

                for (let ch of w) {
                    const cw = this._textWidth(ch);
                    if (chunkWidth + cw > maxWidthPx) {
                        lines.push(chunk);
                        chunk = ch;
                        chunkWidth = cw;
                    } else {
                        chunk += ch;
                        chunkWidth += cw;
                    }
                }

                if (chunk.length > 0) lines.push(chunk);
                continue;
            }

            // Fits on current line
            if (currentWidth + wordWidth + (current ? spaceWidth : 0) <= maxWidthPx) {
                if (current.length === 0) {
                    current = w;
                    currentWidth = wordWidth;
                } else {
                    current += " " + w;
                    currentWidth += spaceWidth + wordWidth;
                }
            } else {
                // new line
                lines.push(current);
                current = w;
                currentWidth = wordWidth;
            }
        }

        if (current.length > 0) lines.push(current);

        return lines;
    }

    frame() {
        this.surface.clear();

        const H = this.systemData.height;
        const W = this.systemData.width;

        // ============ USERNAME MODE ============
        if (!this.username) {
            this.surface.drawText("Enter username:", 10, 4);
            this.surface.drawText(this.input, 20, 4);

            this.cursorBlink += 0.05;
            if (Math.sin(this.cursorBlink * 6) > 0) {
                const cx = this._textWidth(this.input);
                this.surface.setPixel(20, 4 + cx, true);
            }

            return this.surface;
        }

        // ------------------------------------------------------
        //   NEW MESSAGE RENDERING: bottom-up layout
        // ------------------------------------------------------

        const maxTextWidth = W - 4;
        const barY = H - 12;

        // Collect wrapped lines of ALL messages
        let wrappedLines = [];

        for (const msg of this.messages) {
            const text = `${msg.user}: ${msg.text}`;
            const lines = this._wrapText(text, maxTextWidth);

            // Keep each message grouped
            wrappedLines.push(...lines, ""); 
        }

        // Remove last empty line
        if (wrappedLines.length > 0 && wrappedLines[wrappedLines.length - 1] === "")
            wrappedLines.pop();

        const lineHeight = 8;
        const maxVisibleLines = Math.floor((barY - 2) / lineHeight);

        // Take only the bottom-visible chunk
        const visibleLines = wrappedLines.slice(-maxVisibleLines);

        // Compute starting Y so text hugs bottom
        let y = barY - visibleLines.length * lineHeight - 2;

        // Draw lines top → bottom
        for (const line of visibleLines) {
            this.surface.drawText(line, y, 2);
            y += lineHeight;
        }

        // ============ INPUT BAR ============
        this.surface.drawLine(barY, 0, barY, W);
        this.surface.drawText(this.input, barY + 2, 2);

        this.cursorBlink += 0.05;
        if (Math.sin(this.cursorBlink * 6) > 0) {
            const cx = this._textWidth(this.input);
            this.surface.setPixel(barY + 2, 2 + cx, true);
        }

        return this.surface;
    }
}
