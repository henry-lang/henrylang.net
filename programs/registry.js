import { MusicProgram } from "./music.js";
import { TextEditProgram } from "./textedit.js";
import { MessengerProgram } from "./messenger.js";
import { PainterProgram } from "./painter.js";
import { DebuggerProgram } from "./debugger.js";
import { BrowserProgram } from "./browser.js";
import { IDEProgram } from "./ide.js";

export const AppRegistry = [
    { name: "Browser", create: () => new BrowserProgram() },
    { name: "Music", create: () => new MusicProgram() },
    { name: "Text Edit", create: () => new TextEditProgram() },
    { name: "Messenger", create: () => new MessengerProgram() },
    { name: "Painter", create: () => new PainterProgram() },
    { name: "IDE", create: () => new IDEProgram() },
    { name: "Debugger", create: () => new DebuggerProgram() }
];