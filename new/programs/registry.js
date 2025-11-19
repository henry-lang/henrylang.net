import { MusicProgram } from "./music.js";
import { TextEditProgram } from "./textedit.js";
import { MessengerProgram } from "./messenger.js";

export const AppRegistry = [
    { name: "Music", create: () => new MusicProgram() },
    { name: "Text Edit", create: () => new TextEditProgram() },
    { name: "Messenger", create: () => new MessengerProgram() },
];