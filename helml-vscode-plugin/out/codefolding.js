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
exports.HelmFoldingRangeProvider = void 0;
const vscode = __importStar(require("vscode"));
class HelmFoldingRangeProvider {
    constructor(levelChar = ":") {
        this.levelChar = levelChar;
    }
    provideFoldingRanges(document, context, token) {
        const kind = vscode.FoldingRangeKind.Region;
        const foldingRanges = [];
        const levelChar = this.levelChar;
        let currentBlockStartLine = [0];
        let currentBlockLevel = [0];
        let currentBlockIndex = 0;
        let currEmptyLines = 0;
        let actuali = 0;
        for (let i = 0; i < document.lineCount; i++) {
            const line = document.lineAt(i);
            const lineText = line.text.trimLeft();
            // Skip empty lines and comment lines starting with '#'
            if (!lineText.length || lineText.charAt(0) === '#' || lineText.startsWith('//')) {
                currEmptyLines++;
                continue;
            }
            else {
                actuali = i - currEmptyLines;
                currEmptyLines = 0;
            }
            // Calculate the level of nesting for the current line by counting the number of colons at the beginning
            let level = 0;
            while (lineText.charAt(level) === levelChar) {
                level++;
            }
            if (!currentBlockStartLine[currentBlockIndex]) {
                // block not opened
                if (level > currentBlockLevel[currentBlockIndex]) {
                    // new block started
                    currentBlockStartLine[currentBlockIndex] = actuali;
                }
                currentBlockLevel[currentBlockIndex] = level;
                continue;
            }
            // if block opened
            if (level === currentBlockLevel[currentBlockIndex])
                continue; // continue block in current level
            // nested block start
            if (level > currentBlockLevel[currentBlockIndex]) {
                currentBlockIndex++;
                currentBlockStartLine.push(actuali);
                currentBlockLevel.push(level);
                continue;
            }
            while (currentBlockLevel[currentBlockIndex] > level) {
                // block finished
                const foldingRange = new vscode.FoldingRange(currentBlockStartLine[currentBlockIndex] - 1, i - 1, kind);
                foldingRanges.push(foldingRange);
                if (currentBlockIndex > 0) {
                    currentBlockStartLine.pop();
                    currentBlockLevel.pop();
                }
                else {
                    currentBlockStartLine[currentBlockIndex] = 0; // block not opened now
                    currentBlockLevel[currentBlockIndex] = level;
                }
                if (!currentBlockIndex)
                    break;
                currentBlockIndex--;
            }
        }
        // End the final block (if any) and add it to the folding ranges
        if (currentBlockStartLine) {
            const foldingRange = new vscode.FoldingRange(currentBlockStartLine[currentBlockIndex] - 1, document.lineCount - 1, kind);
            foldingRanges.push(foldingRange);
        }
        return foldingRanges;
    }
}
exports.HelmFoldingRangeProvider = HelmFoldingRangeProvider;
