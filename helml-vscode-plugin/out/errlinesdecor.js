"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.highlightErrors = exports.clearAllDecorations = exports.errorDecoration = exports.errorLines = void 0;
const vscode = __importStar(require("vscode"));
// For ~-error string
exports.errorLines = [];
exports.errorDecoration = vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(255, 0, 0, 0.3)',
    textDecoration: 'underline wavy',
});
function clearAllDecorations(editor) {
    exports.errorLines = [];
    editor.setDecorations(exports.errorDecoration, []);
}
exports.clearAllDecorations = clearAllDecorations;
function highlightErrors(editor) {
    const document = editor.document;
    if (document.languageId !== 'helml') {
        return;
    }
    if (document.lineCount < 2) {
        // one string may be HELML-URL
        return;
    }
    const decorations = [];
    for (let i = 1; i < document.lineCount; i++) {
        const line = document.lineAt(i);
        const st = line.text;
        if (st.indexOf('~') != -1) {
            exports.errorLines.push(i);
            const range = new vscode.Range(line.range.start, line.range.end);
            decorations.push({ range });
        }
    }
    editor.setDecorations(exports.errorDecoration, decorations);
}
exports.highlightErrors = highlightErrors;
