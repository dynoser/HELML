//import jsesc from './jsesc';

import * as vscode from 'vscode';
import HELML from './HELML';
import LineHELML from './LineHELML';
import phparr from './phparr';
import pythonarr from './pythonarr';

let HELMLLayersList: string[] = ['0'];
let errorLines: number[] = [];

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
    const cmdToBase64url = vscode.commands.registerCommand('helml.toBase64url', cre_conv_fn(SELECTIONtoBase64url));
    const cmdFromBase64url = vscode.commands.registerCommand('helml.fromBase64url', cre_conv_fn(SELECTIONfromBase64url));
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
            const changedLines: number[] = [];
            let tildaadd: boolean = false;
            for (const change of event.contentChanges) {

                for (let i = change.range.start.line; i <= change.range.end.line; i++) {
                    changedLines.push(i);
                }

                if (!tildaadd && change.text.includes('~')) {
                    tildaadd = true;
                }
            }
            
            const intersectedLines = errorLines.filter(x => changedLines.includes(x));

            if (intersectedLines.length) {
                editor.setDecorations(errorDecoration, []);
                highlightErrors(editor);
            }
            else if (tildaadd) {
                highlightErrors(editor);
            }

            if (changedLines.length > 1) {
                // do not continue for multiple-changes
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
            let line: LineHELML;
            let level: number = 0;
            let spc_cnt: number = 0;
            let keyName: string = '';
            while (prevLineNumber >= 0) {
                // get previous line and then move pointer
                prevLine = document.lineAt(prevLineNumber--);
                line = new LineHELML(prevLine.text);
                if (line.is_ignore) continue; // ignore empty lines and comments

                spc_cnt = line.spc_left_cnt;
                level = line.level;

                if (line.is_creat) {
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
            const afterSelection = currentPosition.with(lineNumber + 1, insertionStr.length + spc_cnt);
            editor.edit((builder) => {
                builder.insert(insertPosition, insertionStr);
            }).then(() => {
                editor.selection = new vscode.Selection(afterInsertPos, afterSelection);
            });
        }
    });
    
    context.subscriptions.push(disposable);

    // Decorator define
    const errorDecoration = vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(255, 0, 0, 0.3)',
        textDecoration: 'underline wavy',
    });

    function highlightErrors(editor: vscode.TextEditor) {
        const document = editor.document;
        const decorations = [];

        for (let i = 0; i < document.lineCount; i++) {
            const line = document.lineAt(i);
            const st  = line.text;
            if (st.indexOf('~') != -1) {
                errorLines.push(i);
                const range = new vscode.Range(line.range.start, line.range.end);
                decorations.push({ range });
            }
        }

        editor.setDecorations(errorDecoration, decorations);
    }

    const onchangesdis = vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (editor) {
            highlightErrors(editor);
        }
    });
    context.subscriptions.push(onchangesdis);

    context.subscriptions.push(cmdToJSON);
    context.subscriptions.push(cmdFromJsonDoc);
    context.subscriptions.push(cmdFromJSON);
    context.subscriptions.push(cmdToPHP);
    context.subscriptions.push(cmdToPython);
    //context.subscriptions.push(cmdToJavaSc);
    context.subscriptions.push(cmdToBase64url);
    
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
export function SELECTIONtoBase64url(sel_text: string): string | null {
    try {
        const inBase64url = HELML.base64Uencode(sel_text);
        return inBase64url;
    } catch(e) {
        vscode.window.showErrorMessage('Failed encode to base64url');
        return null;
    }
}

export function SELECTIONfromBase64url(sel_text: string): string | null {
    try {
        const inBase64url = HELML.base64Udecode(sel_text);
        return inBase64url;
    } catch(e) {
        vscode.window.showErrorMessage('Failed decode to base64url');
        return null;
    }
}

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
function exploreLine(src_str: string, word: string): string | null {
    if (src_str.indexOf('~') != -1) {
        return "Char `~` illegal for HELML, please encode it to base64";
    }

    let line = new LineHELML(src_str);

    if (line.is_ignore) {
        if (line.key === '#') {
            return "*Comment line*";
        }
        return null;
    }

    let key = line.key;
    let value = line.value;

    let key_str: string = key;
    let value_str: string = value;

    if (line.is_layer) {
        // Make value bold in Markdown
        value_str = '*' + value + '*';
        // layer key -+
        if (key === '-+') {
            if (value) {
                return "Layer temp: " + value_str;
            }
            return "Layer Next";
        }
        // Layer key -++
        if (value) {
            return "Layer init: " + value_str;
        }
        return "Layer init: 0";
    }

    // key analyze
    let keyIsSpec = false;
    let fc = key.charAt(0);
    if (fc === '-') {
        keyIsSpec = true;
        // Next key --
        if (key === '--') {
            key_str = "*NextNum*";
        } else {
            // -base64
            if (/^[A-Za-z0-9\-_+\/=]*$/.test(key)) {
                let decoded_key = HELML.base64Udecode(key.substring(1));
                if (null === decoded_key) {
                    return "ERROR: Can't decode KEY from base64url";
                }
                if (/^[ -~]+$/.test(decoded_key)) {
                    // show decoded key if possible
                    key_str = `(*${decoded_key}*)`;
                } else {
                    key_str = `(base64:${key})`;
                }
            } else {
                key_str = 'ERROR: KEY must contain chars from base64/base64url encode';
            }
        }
    } else if (fc === ' ') {
        return "ERROR: space before key";
    }

    // Creaters
    if (line.is_creat) {
        if (value === null) {
            return `Create Array: **${key_str}**`;
        }
        return `Create LIST: **${key_str}**`;
    }

    // Now value is not empty string. Key:value variants analyzing

    fc = value.charAt(0);
    const l = value.length;
    const sc = l > 1 ? value.charAt(1) : '';
    if (fc === ' ') {
        if (sc === ' ') {
            let slicedValue: string = value.slice(2); // strip left spaces
            switch(slicedValue) {
            case 'N': value_str = ' *null*'; break;
            case 'U': value_str = ' *undefined*'; break;
            case 'T': value_str = ' *true*'; break;
            case 'F': value_str = ' *false*'; break;
            case 'NAN': value_str = ' *NaN*'; break;
            case 'INF': value_str = ' *Infinity*'; break;
            case 'NIF': value_str = ' *-Infinity*'; break;
            default:
                if (/^-?\d+(.\d+)?$/.test(slicedValue)) {
                    // it's probably a numeric value
                    if (slicedValue.indexOf('.') !== -1) {
                        // if there's a decimal point, it's a floating point number
                        value_str = " *(float)*" + slicedValue;
                    } else {
                        // if there's no decimal point, it's an integer
                        value_str = " *(int)*" + slicedValue;
                    }
                } else {
                    value_str = " *(unknown)*" + slicedValue;
                }
            }

        } else if (!keyIsSpec) {
            // Plain key and Plain value
            return key + ': ' + value;
        }
    } else if (fc === '"' || fc === "'") {
        value_str = `${fc}*quoted value*"${fc}`;
    } else if (fc === '-') {
        if (l === 1) {
            value_str = '""';
        } else {
            if (/^[A-Za-z0-9\-_+\/=]*$/.test(value)) {
                let decoded_value = HELML.base64Udecode(value.substring(1));
                if (null === decoded_value) {
                    return "ERROR: Can't decode VALUE from base64url";
                }
                value_str = `(*${decoded_value}*)`;
            } else {
                return "ERROR: VALUE must contain chars from base64/base64url encode";
            }
        }
    } else {
        value_str =`UNKNOWN or USER-DEFINED VALUE, fc="${fc}"`;
    }

    return key_str + ":" + value_str;
}

const hoverProvider: vscode.HoverProvider = {
    provideHover(document: vscode.TextDocument, position: vscode.Position): vscode.ProviderResult<vscode.Hover> {
        const line = document.lineAt(position);
        const text = line.text;
        const wordRange = document.getWordRangeAtPosition(position);
        const word = document.getText(wordRange);

        const parsedText = exploreLine(text, word);
        if (parsedText) {
            return new vscode.Hover(parsedText);
        }

        return null;
    }
};

vscode.languages.registerHoverProvider('helml', hoverProvider);
