import * as vscode from 'vscode';

export default class symbolsprov {
    provideDocumentSymbols(document: vscode.TextDocument, token: vscode.CancellationToken):
        vscode.ProviderResult<vscode.SymbolInformation[] | vscode.DocumentSymbol[]>
    {
        const result: {[key: string]: any} = {};
        let stack: string[] = [];
        
        let lvl_ch = ':';
        let min_level: number = -1;

        let layer_init: string = "0";
        let layer_curr: string = layer_init;
        const layers_list = new Set(['0']);

        let lineText: string;
        const unisymkey = ".creater.symbol.";

        for (let i = 0; i < document.lineCount; i++) {
            lineText = document.lineAt(i).text;

            let spc_right_cnt = 0;
            let eol_pos = lineText.length;
    
            // count spaces in the end of line
            while(eol_pos) {
                const ch = lineText[eol_pos-1];
                if (ch !== ' ' && ch !== "\t") break;
                eol_pos--;
                spc_right_cnt++
            }

            // count spaces from the begin of line and nested level
            let spc_left_cnt = 0;
            let level = 0;
            for (let i = 0; i < eol_pos; i++) {
                const ch = lineText[i];
                if (ch === ' ' || ch === "\t") {
                    spc_left_cnt++;
                } else {
                    for (let j = i; j < eol_pos; j++) {
                        if (lineText[j] === lvl_ch) {
                            level++;
                        } else {
                            break;
                        }
                    }
                    break;
                }
            }

            // Skip empty and comment lines
            if (!lineText.length || lineText.charAt(spc_left_cnt) === '#') continue;
 
            lineText = lineText.substring(spc_left_cnt, eol_pos);

            if (lineText.startsWith('//')) continue; // also comment
    
            // If the line has colons at the beginning, remove them from the line
            if (level) {
                lineText = lineText.substring(level);
            }

            const firstDiv: number = lineText.indexOf(lvl_ch);
            let key: string = firstDiv === -1 ? lineText : lineText.substring(0, firstDiv);
            let value: string | null = firstDiv === -1 ? null : lineText.substring(firstDiv + 1);

            // check min_level
            if (min_level < 0 || min_level > level) {
                min_level = level;
            }

            // Remove keys from the stack if level decreased
            let extra_keys_cnt: number = stack.length - (level - min_level);
            if (extra_keys_cnt > 0) {
                // removing extra keys from stack
                while(stack.length && extra_keys_cnt--) {
                    stack.pop();
                }
                layer_curr = layer_init;
            }

            // Find the parent element in the result array for the current key
            let parent: any = result;
            for (let parentKey of stack) {
                parent = parent[parentKey];
            }

            // Check the key if it starts with an equals sign
            if (key.charAt(0) === '-') {
                if (key === '--') {
                    // Next number keys
                    key = (typeof parent === 'object') ? String(Object.keys(parent).length) : '0';
                } else if (key === '-+' || key === '-++' || key === '---') {
                    // Layer control keys
                    if (value !== null) {
                        value = value.trim();
                    }
                    if (key === '-++') {
                        layer_init = value ? value : '0'
                        layer_curr = layer_init
                    } else if (key === '-+') {
                        if (value == null) {
                            layer_curr =  Number.isInteger(parseInt(layer_curr)) ? String(layer_curr + 1) : layer_init;
                        } else {
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
                const currSymbol = new vscode.DocumentSymbol(
                    key, // name
                    '', // details
                    expNumKeys ? vscode.SymbolKind.Array : vscode.SymbolKind.Object,
                    document.lineAt(i).range,
                    document.lineAt(i).range
                );
                parent[key] = {};
                parent[key][unisymkey] = currSymbol;

                stack.push(key);
                layer_curr = layer_init;
            } else if (layers_list.has(layer_curr)) {
                parent[key] = new vscode.DocumentSymbol(
                    key, // name
                    value, // details
                    vscode.SymbolKind.Variable, // kind
                    new vscode.Range(new vscode.Position(i, spc_left_cnt), new vscode.Position(i, eol_pos)),
                    new vscode.Range(new vscode.Position(i, spc_left_cnt + firstDiv + 1), new vscode.Position(i, eol_pos))
                );
            }

            if (token.isCancellationRequested) {
                return [];
            }
        }

        const symbols: vscode.DocumentSymbol[] = [];

        let howManyUpdates = 0;

        const traverseTree = (tree: any) => {
            if (tree instanceof vscode.DocumentSymbol) {
                return tree;
            }
            let currSymbol: vscode.DocumentSymbol | undefined;
            if (tree.hasOwnProperty(unisymkey)) {
                currSymbol = tree[unisymkey];
            }
            for (const key in tree) {
                if (key === unisymkey) continue;
                let value = tree[key];
                if (!(value instanceof vscode.DocumentSymbol)) {
                    value = traverseTree(value);
                    if (typeof value === 'undefined') continue;
                }
                if (currSymbol) {
                    currSymbol.children.push(value);
                } else {
                    symbols.push(value);
                }
            }
            if (currSymbol) {
                return currSymbol;
            } else {
                return undefined;
            }
        }
        traverseTree(result);

        return symbols;
    }
}
