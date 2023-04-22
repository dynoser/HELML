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
let menuCanHELML = false;
let menuCanJSON = false;
let menuCanB64 = false;
let menuCanToB64 = false;
function onSelectionChange(event) {
    return onSelectionChangeByEditor(event.textEditor);
}
exports.onSelectionChange = onSelectionChange;
function onSelectionChangeByEditor(textEditor) {
    const { document, selection } = textEditor;
    const langID = document.languageId;
    exports.docIsHELML = langID === 'helml';
    let canHELML = exports.docIsHELML;
    let canJSON = langID === 'json';
    let canB64 = false;
    let canToB64 = false;
    // try to detect integrateg-HELML by ~-prefix
    const sel_text = document.getText(selection);
    if (sel_text) {
        // one line in selection?
        let isOneLine = sel_text.indexOf("\n") < 0;
        if (isOneLine && sel_text.indexOf("\r") >= 0) {
            isOneLine = false;
        }
        let strlen = sel_text.length;
        let lastCh = '';
        // reduce line by end-spaces
        const spcs = " \t\n\r";
        while (strlen) {
            lastCh = sel_text[strlen - 1];
            if (spcs.indexOf(lastCh) < 0)
                break;
            strlen--;
        }
        // reduce line by start-spaces
        let i = 0;
        while (i < strlen) {
            if (spcs.indexOf(sel_text[i]) < 0)
                break;
            i++;
            strlen--;
        }
        if (strlen) {
            const firstCh = sel_text.charAt(i);
            // Is the selected text enclosed in quotation?
            const inQuotas = (lastCh === firstCh) && ('`\'"'.indexOf(firstCh) >= 0);
            // Is the selected text enclosed in {} or [] ?
            const inBbrackets = inQuotas ? false : (firstCh === '{' && lastCh === "}") || (firstCh === '[' && lastCh === ']');
            // May be JSON-object ?
            canJSON = canJSON || inBbrackets;
            let haveTilda = sel_text.indexOf('~') >= 0;
            canHELML = inBbrackets ? false : (exports.docIsHELML || haveTilda);
            if (isOneLine) {
                if (!haveTilda && !inBbrackets) {
                    canB64 = /^[A-Za-z0-9\-_+\/=]+$/.test(sel_text.substring(i, i + strlen));
                }
                canToB64 = exports.docIsHELML;
            }
        }
    }
    if (canHELML !== menuCanHELML) {
        menuCanHELML = canHELML;
        vscode.commands.executeCommand("setContext", "helml.canHELML", menuCanHELML).then(() => {
            return menuCanHELML;
        });
    }
    if (canJSON !== menuCanJSON) {
        menuCanJSON = canJSON;
        vscode.commands.executeCommand("setContext", "helml.canJSON", menuCanJSON).then(() => {
            return menuCanJSON;
        });
    }
    if (canB64 !== menuCanB64) {
        menuCanB64 = canB64;
        vscode.commands.executeCommand("setContext", "helml.canB64", menuCanB64).then(() => {
            return menuCanB64;
        });
    }
    if (canToB64 !== menuCanToB64) {
        menuCanToB64 = canToB64;
        vscode.commands.executeCommand("setContext", "helml.canToB64", menuCanToB64).then(() => {
            return menuCanToB64;
        });
    }
}
exports.onSelectionChangeByEditor = onSelectionChangeByEditor;
