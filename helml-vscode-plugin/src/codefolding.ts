import * as vscode from 'vscode';

export class HelmFoldingRangeProvider implements vscode.FoldingRangeProvider {
    private readonly levelChar: string;

    constructor(levelChar: string = ":") {
        this.levelChar = levelChar;
    }

    provideFoldingRanges(
        document: vscode.TextDocument,
        context: vscode.FoldingContext,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.FoldingRange[]> {
        const kind: vscode.FoldingRangeKind = vscode.FoldingRangeKind.Region;

        const foldingRanges: vscode.FoldingRange[] = [];

        const levelChar = this.levelChar;

        let currentBlockStartLine: number[] = [0];
        let currentBlockLevel: number[] = [0];
        let currentBlockIndex: number = 0;

        let currEmptyLines: number = 0;
        let actuali: number = 0;

        for (let i = 0; i < document.lineCount; i++) {
            const line = document.lineAt(i);
            const lineText = line.text.trimLeft();

            // Skip empty lines and comment lines starting with '#'
            if (!lineText.length || lineText.charAt(0) === '#' || lineText.startsWith('//')) {
                currEmptyLines++;
                continue;
            } else {
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
            if (level === currentBlockLevel[currentBlockIndex]) continue; // continue block in current level

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
                 } else {
                    currentBlockStartLine[currentBlockIndex] = 0; // block not opened now
                    currentBlockLevel[currentBlockIndex] = level;    
                 }
                 if (!currentBlockIndex) break;
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
