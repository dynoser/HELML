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
exports.onSelectionChangeByEditor = exports.onSelectionChange = exports.docIsHELML = void 0;
const vscode = __importStar(require("vscode"));
exports.docIsHELML = false;
let menuToJSONon = false;
let menuFromJSONon = false;
let menuToPHPon = false;
let menuToPython = false;
let docIsPHP = false;
let docIsPython = false;
function onSelectionChange(event) {
    return onSelectionChangeByEditor(event.textEditor);
}
exports.onSelectionChange = onSelectionChange;
function onSelectionChangeByEditor(textEditor) {
    const { document, selection } = textEditor;
    const langID = document.languageId;
    exports.docIsHELML = langID === 'helml';
    docIsPHP = langID === 'php';
    docIsPython = langID === 'python';
    let newMenuToJSON = false;
    let newMenuFromJSON = langID === 'json';
    let newMenuToPHP = false;
    let newMenuToPython = false;
    // try to detect integrateg-HELML by ~-prefix
    const sel_text = document.getText(selection);
    if (sel_text) {
        let strlen = sel_text.length;
        let lastCh = '';
        // reduce end of line of spaces
        while (strlen) {
            lastCh = sel_text[strlen - 1];
            if (lastCh !== ' ' && lastCh !== "\t" && lastCh !== "\n")
                break;
            strlen--;
        }
        // skip spaces from left
        let i = 0;
        while (i < strlen && (sel_text[i] === " " || sel_text[i] === "\t" || sel_text[i] === "\n")) {
            i++;
            strlen--;
        }
        if (strlen) {
            let firstCh = sel_text.charAt(i);
            // try detect JSON-object between {}
            if ((firstCh === '{' && lastCh === "}") || (firstCh === '[' && lastCh === ']')) {
                newMenuFromJSON = true;
            }
            else if (!exports.docIsHELML) {
                // if the selected text is enclosed in quotations
                if ('`\'"'.indexOf(firstCh) >= 0 && lastCh === firstCh) {
                    newMenuToJSON = true;
                }
                else {
                    // check "~" inside
                    newMenuToJSON = (sel_text.indexOf('~') >= 0);
                }
                if (docIsPHP) {
                    newMenuToPHP = newMenuToJSON;
                }
                if (docIsPython) {
                    newMenuToPython = newMenuToJSON;
                }
            }
        }
    }
    if (exports.docIsHELML) {
        newMenuToJSON = true;
    }
    if (newMenuToJSON !== menuToJSONon) {
        menuToJSONon = newMenuToJSON;
        vscode.commands.executeCommand("setContext", "helml.isIntegrated", menuToJSONon).then(() => {
            return menuToJSONon;
        });
    }
    if (newMenuFromJSON !== menuFromJSONon) {
        menuFromJSONon = newMenuFromJSON;
        vscode.commands.executeCommand("setContext", "helml.canJSON", menuFromJSONon).then(() => {
            return menuFromJSONon;
        });
    }
    if (newMenuToPHP !== menuToPHPon) {
        menuToPHPon = newMenuToPHP;
        vscode.commands.executeCommand("setContext", "helml.canPHP", menuToPHPon).then(() => {
            return menuToPHPon;
        });
    }
    if (newMenuToPython !== menuToPython) {
        menuToPython = newMenuToPython;
        vscode.commands.executeCommand("setContext", "helml.canPython", menuToPython).then(() => {
            return menuToPython;
        });
    }
}
exports.onSelectionChangeByEditor = onSelectionChangeByEditor;
