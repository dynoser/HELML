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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.edit_block_lookup = void 0;
const vscode = __importStar(require("vscode"));
const LineHELML_1 = __importDefault(require("./LineHELML"));
// For upKey of HELML-block
let up_key_decorated_line_num = -1;
const upKeyDecoration = vscode.window.createTextEditorDecorationType({
    border: '1px solid #880; padding: 4px;'
});
function edit_block_lookup(fromLineNumber) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }
    const { document, selection } = editor;
    let sel_text = document.getText(selection);
    let currLineNumber = -1;
    let currLineVS;
    let currLineHELML;
    let upKeyLineNumber = -1;
    let upKeyLineHELML;
    // List of line-numbers in one level with currLine
    let oneLevelLineNumbers = [];
    // Lookup CurrLine
    let walkLineNumber = fromLineNumber;
    do {
        // get previous line and then move pointer
        currLineVS = document.lineAt(walkLineNumber);
        currLineHELML = new LineHELML_1.default(currLineVS.text);
        if (!currLineHELML.is_ignore) {
            // Line is not empty, not comment
            currLineNumber = walkLineNumber;
            break;
        }
    } while (--walkLineNumber >= 0);
    // if current line found, lookup upkey-line
    if (currLineNumber >= 0) {
        let currWorkLevel = currLineHELML.level;
        let walkLineVS;
        let walkLineHELML;
        oneLevelLineNumbers.push(currLineNumber);
        while (--walkLineNumber >= 0) {
            walkLineVS = document.lineAt(walkLineNumber);
            walkLineHELML = new LineHELML_1.default(walkLineVS.text);
            if (walkLineHELML.level === currWorkLevel) {
                oneLevelLineNumbers.push(walkLineNumber);
            }
            else if (walkLineHELML.level < currWorkLevel) { // if level down
                if (walkLineHELML.level === currWorkLevel - 1 && walkLineHELML.is_creat) {
                    // upKey found
                    upKeyLineNumber = walkLineNumber;
                    upKeyLineHELML = walkLineHELML;
                    // upKey decorating
                    let up_key_line_new_num = walkLineNumber + 1;
                    if (up_key_decorated_line_num !== up_key_line_new_num) {
                        up_key_decorated_line_num = up_key_line_new_num;
                        const decorations = [];
                        editor.setDecorations(upKeyDecoration, []);
                        const range = new vscode.Range(walkLineVS.range.start, walkLineVS.range.end);
                        decorations.push({ range });
                        editor.setDecorations(upKeyDecoration, decorations);
                    }
                }
                break;
            }
        }
    }
    if (upKeyLineNumber < 0) { // if upkey not found, remove upKeyDecorators
        up_key_decorated_line_num = -1;
        editor.setDecorations(upKeyDecoration, []);
    }
    return {
        sel_text: sel_text,
        currLineNumber: currLineNumber,
        currLineVS: currLineVS,
        currLineHELML: currLineHELML,
        upKeyLineNumber: upKeyLineNumber,
        upKeyLineHELML: upKeyLineHELML,
        oneLevelLineNumbers: oneLevelLineNumbers
    };
}
exports.edit_block_lookup = edit_block_lookup;
