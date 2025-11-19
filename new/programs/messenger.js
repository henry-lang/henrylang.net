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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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

        this.messages = [];
        this.username = null;

        this.input = "";
        this.cursorX = 0;
        this.cursorBlink = 0;
        this.hasFocus = false;

        this.db = getFirestore();
        this._setupListener();
    }

    setSize(w, h) {
        this.systemData.width = w;
        this.systemData.height = h;
        this.surface = new Surface(h, w, defaultGlyphSet);
    }

    _setupListener() {
        const q = query(
            collection(this.db, "messages"),
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

        await addDoc(collection(this.db, "messages"), {
            user: this.username,
            text,
            created: serverTimestamp()
        });
    }

    onMouseDown(x, y) {
        this.hasFocus = true;

        // Click inside input box
        if (y >= this.systemData.height - 10) {
            const before = this.input.slice(0, this.cursorX);
            this.cursorX = Math.min(before.length, this.input.length);
            return true;
        }

        return true;
    }

    onKeyDown(e) {
        if (!this.hasFocus) return false;

        // Prompt for username first
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
                this.username = this.input.trim();
                this.input = "";
                this.cursorX = 0;
                return true;
            }
            return true;
        }

        // Normal message typing
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

    frame() {
        this.surface.clear();

        const H = this.systemData.height;
        const W = this.systemData.width;

        // -------------- USERNAME MODE --------------
        if (!this.username) {
            this.surface.drawText("Enter username:", 10, 4);
            this.surface.drawText(this.input, 20, 4);

            // Draw cursor
            this.cursorBlink += 0.05;
            const showCursor = Math.sin(this.cursorBlink * 6) > 0;
            if (showCursor) {
                const cx = this._textWidth(this.input);
                this.surface.setPixel(20, 4 + cx, true);
            }

            return this.surface;
        }

        // -------------- MESSAGE LIST --------------
        let y = 2;

        for (const msg of this.messages) {
            const txt = `${msg.user}: ${msg.text}`;
            this.surface.drawText(txt, y, 2);
            y += 10; // spacing between lines (pixel height)
        }

        // -------------- INPUT BAR --------------
        const barY = H - 12;

        this.surface.drawLine(barY, 0, barY, W);

        this.surface.drawText(this.input, barY + 2, 2);

        // Input cursor
        this.cursorBlink += 0.05;
        const showCursor = Math.sin(this.cursorBlink * 6) > 0;

        if (showCursor) {
            const cx = this._textWidth(this.input);
            this.surface.setPixel(barY + 2, 2 + cx, true);
        }

        return this.surface;
    }
}