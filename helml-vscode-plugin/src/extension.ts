//import jsesc from './jsesc';

import * as vscode from 'vscode';
import HELML from './HELML';
import phparr from './phparr';
import pythonarr from './pythonarr';

let HELMLLayersList: string[] = ['0'];

function reloadConfig(event: vscode.ConfigurationChangeEvent | null = null) {
    const config = vscode.workspace.getConfiguration('helml');
    const extname = 'helml';

    const enableident = config.get<boolean>('enableident');
    const enablebones = config.get<boolean>('enablebones');
    const enableuplines = config.get<boolean>('enableuplines');
    const enablehashsym = config.get<boolean>('enablehashsym');

    if (enableident !== undefined && enableident !== HELML.ENABLE_SPC_IDENT) {
        config.update('enableident', enableident, true);
        HELML.ENABLE_SPC_IDENT = enableident;
    }

    if (enablebones !== undefined && enablebones !== HELML.ENABLE_BONES) {
        config.update('enablebones', enablebones, true);
        HELML.ENABLE_BONES = enablebones;
    }

    if (enableuplines !== undefined && enableuplines !== HELML.ENABLE_KEY_UPLINES) {
        config.update('enableuplines', enableuplines, true);
        HELML.ENABLE_KEY_UPLINES = enableuplines;
    }

    if (enablehashsym !== undefined && enableuplines !== HELML.ENABLE_HASHSYMBOLS) {
        config.update('enablehashsym', enablehashsym, true);
        HELML.ENABLE_HASHSYMBOLS = enablehashsym;
    }

    if (event === null || event.affectsConfiguration(extname + '.getlayers')) {
        const getlayers = config.get<string>('getlayers');
        if (getlayers) {
            HELMLLayersList = [];
            const layers = getlayers.split(',');
            layers.forEach(layer => HELMLLayersList.push(layer.trim()));
        }
    }
}

reloadConfig();

// Auto-update config on changes
vscode.workspace.onDidChangeConfiguration(event => {
    if (event.affectsConfiguration('helml')) {
        reloadConfig(event);
    }
});

function cre_conv_fn(converter_fn: (text: string) => string | null) {
    return () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }

        const { document, selection } = editor;
        const sel_text = document.getText(selection);

        if (!sel_text) {
            vscode.window.showWarningMessage('No text selected!');
            return;
        }

        const convertedText = converter_fn(sel_text);
        if (convertedText) {
            editor.edit(editBuilder => {
                editBuilder.replace(selection, convertedText);
            });
        }
    };
}

export function activate(context: vscode.ExtensionContext) {
    const cmdToJSON = vscode.commands.registerCommand('helml.toJSON', cre_conv_fn(HELMLtoJSON));
    const cmdFromJSON = vscode.commands.registerCommand('helml.fromJSON', cre_conv_fn(HELMLfromJSON));
    const cmdToPHP = vscode.commands.registerCommand('helml.toPHP', cre_conv_fn(HELMLtoPHP));
    const cmdToPython = vscode.commands.registerCommand('helml.toPython', cre_conv_fn(HELMLtoPython));
    //const cmdToJavaScript = vscode.commands.registerCommand('helml.toJavaScript', cre_conv_fn(HELMLtoJavaScript));
    

    const cmdFromJsonDoc = vscode.commands.registerCommand('helml.fromJSONDoc', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }

        const { document, selection } = editor;
        let sel_text = document.getText(selection);

        let wholeDocSel = !sel_text;
        let docIsSaved = !document.isDirty;
        let canCloseOld = wholeDocSel && docIsSaved;

        if (sel_text) {
            if (sel_text === document.getText()) {
                wholeDocSel = true;
            }
        } else {
            sel_text = document.getText();
        }

        let newFile: any;
        const convertedText = HELMLfromJSON(sel_text);
        if (convertedText) {
            let fileName = document.fileName;

            newFile = await vscode.workspace.openTextDocument({
                content: convertedText,
                language: 'helml',
            });
        }
        vscode.window.showTextDocument(newFile);
    })

    let disposable = vscode.workspace.onDidChangeTextDocument((event) => {
        const editor = vscode.window.activeTextEditor;
        if (editor && event.contentChanges.length) {
            const document = editor.document;
            if (document.languageId !== 'helml') {
                return;
            }
            const change = event.contentChanges[0];
            const newLine = change.text.includes('\n');
            if (!newLine) {
                return;
            }
            const lineNumber = event.contentChanges[0].range.start.line;
            let prevLineNumber = lineNumber;
            let prevLine: vscode.TextLine;
            let line: string;
            let level: number = 0;
            let spc_cnt: number = 0;
            let strlen: number;
            let keyName: string = '';
            while (prevLineNumber >= 0) {
                // get previous line and then move pointer
                prevLine = document.lineAt(prevLineNumber--);
                line  = prevLine.text;
                strlen = line.length;
                if (!strlen) continue; // ignore empty lines

                spc_cnt = 0;
                level = 0;
                for (let i = 0; i < strlen; i++) {
                    if (line[i] === ' ') {
                    spc_cnt++;
                    } else {
                    for (let j = i; j < strlen; j++) {
                        if (line[j] === ':') {
                        level++;
                        } else {
                        break;
                        }
                    }
                    break;
                    }
                }

                // Ignore comment lines starting with '#'
                if (line.charAt(spc_cnt) === '#') continue;

                // we found one of non-empty and non-comment line
                // check sub-array create
                const colonIndex = line.indexOf(':', spc_cnt + level + 1);
                const haveColonDiv = colonIndex > (spc_cnt + level);
                const onlyKeyNoDiv = (colonIndex < 0 && (spc_cnt + level) < strlen);
                const colonDivAtEnd = haveColonDiv && (colonIndex === strlen - 1);
                if (colonIndex > 0) {
                    keyName = line.substring(spc_cnt+level, colonIndex);
                }
                else if (onlyKeyNoDiv) {
                    keyName = line.substring(spc_cnt + level);
                }
                else {
                    keyName = '';
                }
                if (colonDivAtEnd || onlyKeyNoDiv) {
                    spc_cnt++;
                    level++;
                }
                break;
            }
            let insertionStr = ' '.repeat(spc_cnt) + ':'.repeat(level);
            if (keyName === '--') {
                insertionStr += keyName + ':';
            }

            const currentPosition = editor.selection.active;
            const insertPosition = currentPosition.with(lineNumber + 1, 0);
            const afterInsertPos = currentPosition.with(lineNumber + 1, insertionStr.length);
            editor.edit((builder) => {
                builder.insert(insertPosition, insertionStr);
            }).then(() => {
                editor.selection = new vscode.Selection(afterInsertPos, afterInsertPos);
            });
        }
    });
    
    context.subscriptions.push(disposable);

    context.subscriptions.push(cmdToJSON);
    context.subscriptions.push(cmdFromJsonDoc);
    context.subscriptions.push(cmdFromJSON);
    context.subscriptions.push(cmdToPHP);
    context.subscriptions.push(cmdToPython);
    //context.subscriptions.push(cmdToJavaSc);
    
}

export function deactivate() { }

// export function HELMLtoJavaScript(sel_text: string): string | null {
//     try {
//         const objArr = HELML.decode(sel_text);
//         const code_str = jsesc(objArr, {
//             'quotes': 'double',
//             'compact': false,
//             'indent': '\t'
//         });
//         return code_str;
//     } catch (e) {
//         console.error("Error: failed to encode HELML to JavaScript code", e);
//         vscode.window.showErrorMessage('Failed to encode HELML to JavaScript!');
//         return null;
//     }
// }

export function HELMLtoPython(sel_text: string): string | null {
    try {
        const objArr = HELML.decode(sel_text, HELMLLayersList);
        const code_str = pythonarr.toPythonArr(objArr, 1);
        return code_str;
    } catch (e) {
        console.error("Error: failed to encode HELML to Python code", e);
        vscode.window.showErrorMessage('Failed to encode HELML to Python code');
        return null;
    }
}

export function HELMLtoPHP(sel_text: string): string | null {
    try {
        const objArr = HELML.decode(sel_text, HELMLLayersList);
        const code_str = phparr.toPHParr(objArr, 1);
        return code_str;
    } catch (e) {
        console.error("Error: failed to encode HELML to PHP code", e);
        vscode.window.showErrorMessage('Failed to encode HELML to PHP code');
        return null;
    }
}

export function HELMLtoJSON(sel_text: string): string | null {
    try {
        const objArr = HELML.decode(sel_text, HELMLLayersList);
        const json_str = JSON.stringify(objArr, null, '\t');
        return json_str;
    } catch (e) {
        console.error("Error: failed to encode HELML to JSON", e);
        vscode.window.showErrorMessage('Failed to encode HELML to JSON');
        return null;
    }
}

export function removeJSONcomments(json_str: string): string {
    //return json_str;
    const re1 = /^(\s*)\/\/.*$/gm; // remove comments from string-begin
    const re2 = /\/\*[^*]*\*+([^\/*][^*]*\*+)*\//g; // remove comments from end

    return json_str
      .replace(re1, '')
      .replace(re2, '');
}
export function decodeJSONtry(json_str: string) {
    try {
        return JSON.parse(json_str);
    } catch (e) {
        return null;
    }
}

export function HELMLfromJSON(sel_text: string): string | null {
    try {
        // check selection text is from middle of the JSON
        sel_text = sel_text.trim();
        if (sel_text.startsWith('"')) {
            sel_text = '{' + sel_text;
            if (sel_text.endsWith(",")) {
                sel_text = sel_text.slice(0, -1);
            }
            sel_text += '}';
        }
        let objArr = decodeJSONtry(sel_text);
        if (objArr === null) {
            sel_text = removeJSONcomments(sel_text);
            objArr = JSON.parse(sel_text);
        }
        const helml_str = HELML.encode(objArr);
        return helml_str;
    } catch (e) {
        vscode.window.showErrorMessage('Failed to decode JSON to HELML!');
        return null;
    }
}

// Hover-controller block
function parseLine(line: string, word: string): string | null {
    let result_str: string | null = null;
    let key_str = "key";
    let value_str = " value";

    line = line.trim();

    if (!line.length || line.charAt(0) === '#') return null;

    let lvl_ch = ':';

    // Calculate the level of nesting
    let level = 0;
    while (line.charAt(level) === lvl_ch) {
        level++;
    }

    // If the line has colons at the beginning, remove them from the line
    if (level) {
        line = line.substring(level);
    }

    // Split the line into a
    const firstDiv = line.indexOf(lvl_ch);
    let key = firstDiv === -1 ? line : line.substring(0, firstDiv);
    let value = firstDiv === -1 ? null : line.substring(firstDiv + 1);

    // check key by first char
    if (key.charAt(0) === '-') {
        if (key === '--') {
            // The bone-key means "next number".
            key_str = "next";
            key = "[NextNum]";
        } else if (key.startsWith('-+')) {
            if (value) {
                return "Layer: " + value;
            } else {
                return "Layer Next";
            }
        } else {
            key_str = "-b64key";
            let decoded_key = HELML.base64Udecode(key.substring(1));
            if (null === decoded_key) {
                result_str = "ERROR: encoded KEY contain illegal chars";
            } else {
                const printableRegex = /^[ -~]+$/;
                if (printableRegex.test(decoded_key)) {
                  key_str = `-b64key(<i>${decoded_key}</i>)`;
                }
            }
        }
    }

    if (result_str === null) {
        if (value === null) {
            result_str = `Create [${key}] Array`;
        } else if (value === "") {
            result_str = `Create [${key}] LIST`;
        } else if (value.startsWith(' ')) {
            if (value.startsWith('  ')) {
                value_str = " value <i>(non-string)<i>";
            }
        } else if (value.charAt(0) === '-') {
            value_str = "-b64value";
            let decoded_value = HELML.base64Udecode(value.substring(1));
            if (null === decoded_value) {
                result_str = "ERROR: encoded VALUE contain illegal chars";
            } else {
                value_str = `-b64=${decoded_value}`;
            }
        } else {
            value_str = "UNKNOWN or USER-DEFINED VALUE";
        }
    }

    if (result_str === null) {
        result_str = key_str + ":" + value_str;
    }

    return result_str;
}

const hoverProvider: vscode.HoverProvider = {
    provideHover(document: vscode.TextDocument, position: vscode.Position): vscode.ProviderResult<vscode.Hover> {
        const line = document.lineAt(position);
        const text = line.text;
        const wordRange = document.getWordRangeAtPosition(position);
        const word = document.getText(wordRange);

        const parsedText = parseLine(text, word);
        if (parsedText) {
            return new vscode.Hover(parsedText);
        }

        return null;
    }
};

vscode.languages.registerHoverProvider('helml', hoverProvider);
