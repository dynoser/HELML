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
const vscode = __importStar(require("vscode"));
class symbolsprov {
    provideDocumentSymbols(document, token) {
        const result = {};
        let stack = [];
        let lvl_ch = ':';
        let min_level = -1;
        let layer_init = "0";
        let layer_curr = layer_init;
        const layers_list = new Set(['0']);
        let lineText;
        const unisymkey = ".creater.symbol.";
        for (let i = 0; i < document.lineCount; i++) {
            lineText = document.lineAt(i).text;
            let spc_right_cnt = 0;
            let eol_pos = lineText.length;
            // count spaces in the end of line
            while (eol_pos) {
                const ch = lineText[eol_pos - 1];
                if (ch !== ' ' && ch !== "\t")
                    break;
                eol_pos--;
                spc_right_cnt++;
            }
            // count spaces from the begin of line and nested level
            let spc_left_cnt = 0;
            let level = 0;
            for (let i = 0; i < eol_pos; i++) {
                const ch = lineText[i];
                if (ch === ' ' || ch === "\t") {
                    spc_left_cnt++;
                }
                else {
                    for (let j = i; j < eol_pos; j++) {
                        if (lineText[j] === lvl_ch) {
                            level++;
                        }
                        else {
                            break;
                        }
                    }
                    break;
                }
            }
            // Skip empty and comment lines
            if (!lineText.length || lineText.charAt(spc_left_cnt) === '#')
                continue;
            lineText = lineText.substring(spc_left_cnt, eol_pos);
            if (lineText.startsWith('//'))
                continue; // also comment
            // If the line has colons at the beginning, remove them from the line
            if (level) {
                lineText = lineText.substring(level);
            }
            const firstDiv = lineText.indexOf(lvl_ch);
            let key = firstDiv === -1 ? lineText : lineText.substring(0, firstDiv);
            let value = firstDiv === -1 ? null : lineText.substring(firstDiv + 1);
            // check min_level
            if (min_level < 0 || min_level > level) {
                min_level = level;
            }
            // Remove keys from the stack if level decreased
            let extra_keys_cnt = stack.length - (level - min_level);
            if (extra_keys_cnt > 0) {
                // removing extra keys from stack
                while (stack.length && extra_keys_cnt--) {
                    stack.pop();
                }
                layer_curr = layer_init;
            }
            // Find the parent element in the result array for the current key
            let parent = result;
            for (let parentKey of stack) {
                parent = parent[parentKey];
            }
            // Check the key if it starts with an equals sign
            if (key.charAt(0) === '-') {
                if (key === '--') {
                    // Next number keys
                    key = (typeof parent === 'object') ? String(Object.keys(parent).length) : '0';
                }
                else if (key === '-+' || key === '-++' || key === '---') {
                    // Layer control keys
                    if (value !== null) {
                        value = value.trim();
                    }
                    if (key === '-++') {
                        layer_init = value ? value : '0';
                        layer_curr = layer_init;
                    }
                    else if (key === '-+') {
                        if (value == null) {
                            layer_curr = Number.isInteger(parseInt(layer_curr)) ? String(layer_curr + 1) : layer_init;
                        }
                        else {
                            layer_curr = (value === '') ? layer_init : value;
                        }
                    }
                    continue;
                }
                // Do not decode from base64
            }
            // Check the value is null, start a new array and add it to the parent array
            if (value === null || value === '') {
                let expNumKeys = value === null;
                if (expNumKeys && /[{}\<\>\(\),\"\'?]/.test(key)) {
                    return []; // if forbidden chars in CreateListKey = not HELML
                }
                const currSymbol = new vscode.DocumentSymbol(key, // name
                '', // details
                expNumKeys ? vscode.SymbolKind.Array : vscode.SymbolKind.Object, document.lineAt(i).range, document.lineAt(i).range);
                parent[key] = {};
                parent[key][unisymkey] = currSymbol;
                stack.push(key);
                layer_curr = layer_init;
            }
            else if (layers_list.has(layer_curr)) {
                parent[key] = new vscode.DocumentSymbol(key, // name
                value, // details
                vscode.SymbolKind.Variable, // kind
                new vscode.Range(new vscode.Position(i, spc_left_cnt), new vscode.Position(i, eol_pos)), new vscode.Range(new vscode.Position(i, spc_left_cnt + firstDiv + 1), new vscode.Position(i, eol_pos)));
            }
            if (token.isCancellationRequested) {
                return [];
            }
        }
        const symbols = [];
        let howManyUpdates = 0;
        const traverseTree = (tree) => {
            if (tree instanceof vscode.DocumentSymbol) {
                return tree;
            }
            let currSymbol;
            if (tree.hasOwnProperty(unisymkey)) {
                currSymbol = tree[unisymkey];
            }
            for (const key in tree) {
                if (key === unisymkey)
                    continue;
                let value = tree[key];
                if (!(value instanceof vscode.DocumentSymbol)) {
                    value = traverseTree(value);
                    if (typeof value === 'undefined')
                        continue;
                }
                if (currSymbol) {
                    currSymbol.children.push(value);
                }
                else {
                    symbols.push(value);
                }
            }
            if (currSymbol) {
                return currSymbol;
            }
            else {
                return undefined;
            }
        };
        traverseTree(result);
        return symbols;
    }
}
exports.default = symbolsprov;
