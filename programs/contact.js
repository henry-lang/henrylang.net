import { Program } from "../program.js";
import { Surface } from "../screen.js";
import { defaultGlyphSet } from "../glyphs.js";

const API_BASE = "https://henrylang-net.onrender.com";
const STREAM_URL = `${API_BASE}/stream`;

export class ContactProgram extends Program {
  constructor() {
    super();

    this.systemData = {
      x: 30,
      y: 25,
      z: 0,
      width: 120,
      height: 90,
      title: "Contact",
    };

    this.surface = new Surface(
      this.systemData.height,
      this.systemData.width,
      defaultGlyphSet
    );

    this.messages = [];
    this.input = "";
    this.cursorX = 0;
    this.cursorBlink = 0;
    this.hasFocus = false;

    this.isStreaming = false;
    this.abortController = null;
  }

  setSize(w, h) {
    this.systemData.width = w;
    this.systemData.height = h;
    this.surface = new Surface(h, w, defaultGlyphSet);
  }

  onMouseDown(x, y) {
    this.hasFocus = true;
    const barY = this.systemData.height - 12;
    if (y >= barY) {
      this.cursorX = this.input.length;
      return true;
    }
    return true;
  }

  onKeyDown(e) {
    if (!this.hasFocus) return false;

    if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
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

    if (e.key === "ArrowLeft") {
      this.cursorX = Math.max(0, this.cursorX - 1);
      return true;
    }

    if (e.key === "ArrowRight") {
      this.cursorX = Math.min(this.input.length, this.cursorX + 1);
      return true;
    }

    if (e.key === "Enter") {
      const text = this.input.trim();
      if (text.length > 0) this._sendToAI(text);
      this.input = "";
      this.cursorX = 0;
      return true;
    }

    if (e.key === "Escape") {
      this._cancelStream();
      return true;
    }

    return false;
  }

  _cancelStream() {
    if (this.abortController) {
      try {
        this.abortController.abort();
      } catch {}
    }
    this.abortController = null;
    this.isStreaming = false;
  }

  async _sendToAI(text) {
    if (this.isStreaming) return;

    this.messages.push({ role: "client", content: text });

    const serverIndex = this.messages.length;
    this.messages.push({ role: "server", content: "" });

    this.isStreaming = true;
    this.abortController = new AbortController();

    const payload = {
      messages: this.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    };

    try {
      const res = await fetch(STREAM_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: this.abortController.signal,
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        this.messages[serverIndex].content = `Error: HTTP ${res.status} ${t}`.trim();
        this.isStreaming = false;
        this.abortController = null;
        return;
      }

      if (!res.body) {
        this.messages[serverIndex].content = "Error: response body missing";
        this.isStreaming = false;
        this.abortController = null;
        return;
      }

      await this._readSSE(res.body, (event, data) => {
        if (event === "delta") {
            console.log(`"${data}"`);
          this.messages[serverIndex].content += data;
        } else if (event === "error") {
          this.messages[serverIndex].content += `\n[${data}]`;
        }
      });
    } catch (err) {
      if (String(err?.name) !== "AbortError") {
        this.messages[serverIndex].content =
          (this.messages[serverIndex].content || "") +
          `\n[Network error: ${String(err)}]`;
      }
    } finally {
      this.isStreaming = false;
      this.abortController = null;
    }
  }

  async _readSSE(readableStream, onEvent) {
    const reader = readableStream.getReader();
    const decoder = new TextDecoder("utf-8");

    let buffer = "";
    let currentEvent = "message";
    let currentData = [];

    const flushFrame = () => {
      if (currentData.length === 0) return;
      const data = currentData.join("\n");
      onEvent(currentEvent, data);
      currentEvent = "message";
      currentData = [];
    };

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      while (true) {
        const nl = buffer.indexOf("\n");
        if (nl === -1) break;

        let line = buffer.slice(0, nl);
        buffer = buffer.slice(nl + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);

        if (line === "") {
          flushFrame();
          continue;
        }

        if (line.startsWith("event:")) {
          currentEvent = line.slice(6).trim() || "message";
          continue;
        }

        if (line.startsWith("data:")) {
          currentData.push(line.slice(6));
          continue;
        }
      }
    }

    flushFrame();
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

      if (currentWidth + wordWidth + (current ? spaceWidth : 0) <= maxWidthPx) {
        if (current.length === 0) {
          current = w;
          currentWidth = wordWidth;
        } else {
          current += " " + w;
          currentWidth += spaceWidth + wordWidth;
        }
      } else {
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

    const barY = H - 12;
    const maxTextWidth = W - 4;

    let wrappedLines = [];

    for (const msg of this.messages) {
      const prefix =
        msg.role === "client"
          ? "you: "
          : msg.role === "server"
          ? "ai: "
          : "sys: ";
      const text = prefix + (msg.content ?? "");
      const lines = this._wrapText(text, maxTextWidth);
      wrappedLines.push(...lines, "");
    }

    if (wrappedLines.length > 0 && wrappedLines[wrappedLines.length - 1] === "") {
      wrappedLines.pop();
    }

    const lineHeight = 8;
    const maxVisibleLines = Math.floor((barY - 2) / lineHeight);

    const visibleLines = wrappedLines.slice(-maxVisibleLines);
    let y = barY - visibleLines.length * lineHeight - 2;

    for (const line of visibleLines) {
      this.surface.drawText(line, y, 2);
      y += lineHeight;
    }

    this.surface.drawLine(barY, 0, barY, W);
    const prompt = this.isStreaming ? "(streaming…) " : "";
    this.surface.drawText(prompt + this.input, barY + 3, 2);

    this.cursorBlink += 0.05;
    if (Math.sin(this.cursorBlink * 6) > 0) {
      const cx = this._textWidth(prompt + this.input);
      this.surface.drawLine(barY + 2, 2 + cx, barY + 10, 2 + cx, true);
    }

    return this.surface;
  }
}
