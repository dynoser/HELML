//import jsesc from './jsesc';

import * as vscode from 'vscode';
import HELML from './HELML';

import * as extconfig from './extconfig';

import * as onchangeshook from './onchangeshook';
import * as hoverlook from './hoverlook';
//import * as errlinesdecor from './errlinesdecor';
import * as blocklook from './blocklook';

import * as fromjson from './fromjson';

import phparr from './phparr';
import pythonarr from './pythonarr';

// Create selection-converter function envelope for specified converter_fn
function cre_sel_conv_fn(converter_fn: (text: string) => string | null) {
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
            blocklook.clearAllDecorations(editor);
            //errlinesdecor.clearAllDecorations(editor);
        }
    };
}

export function activate(context: vscode.ExtensionContext) {
    
    //Commands registration

    context.subscriptions.push(
        vscode.commands.registerCommand('helml.toJSON', cre_sel_conv_fn(HELMLtoJSON))
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('helml.fromJSON', cre_sel_conv_fn(HELMLfromJSON))
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('helml.toPHP', cre_sel_conv_fn(HELMLtoPHP))
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('helml.toPython', cre_sel_conv_fn(HELMLtoPython))
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('helml.toBase64url', cre_sel_conv_fn(SELECTIONtoBase64url))
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('helml.fromBase64url', cre_sel_conv_fn(SELECTIONfromBase64url))
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('helml.toURL', cre_sel_conv_fn(HELMLtoURL))
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('helml.toLINE', cre_sel_conv_fn(HELMLtoLINE))
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('helml.fromJSONDoc', async () => {
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
    );

    context.subscriptions.push(onchangeshook.onChangeTextDisposable);
    context.subscriptions.push(onchangeshook.onChangeEventDisposable(context));

    vscode.languages.registerHoverProvider('helml', hoverlook.hoverProvider);
}

export function deactivate() { }

export function SELECTIONtoBase64url(sel_text: string): string | null {
    try {
        const inBase64url = HELML.base64Uencode(sel_text);
        return inBase64url;
    } catch(e: any) {
        vscode.window.showErrorMessage(`Failed encode to base64url: ${e.message}`);
        return null;
    }
}

export function SELECTIONfromBase64url(sel_text: string): string | null {
    try {
        const inBase64url = HELML.base64Udecode(sel_text);
        return inBase64url;
    } catch(e: any) {
        vscode.window.showErrorMessage(`Failed decode from base64url: ${e.message}`);
        return null;
    }
}

export function HELMLtoURL(sel_text: string): string | null {
    try {
        let objArr = fromjson.decodeJSONtry2(sel_text);
        if (objArr === null) {
            objArr = HELML.decode(sel_text, extconfig.HELMLLayersList);
        }
        const code_str = HELML.encode(objArr, 1);
        return code_str;
    } catch(e: any) {
        vscode.window.showErrorMessage(`Failed encode to HELML-url: ${e.message}`);
        return null;
    }
}
export function HELMLtoLINE(sel_text: string): string | null {
    try {
        let objArr = fromjson.decodeJSONtry2(sel_text);
        if (objArr === null) {
            objArr = HELML.decode(sel_text, extconfig.HELMLLayersList);
        }
        const code_str = HELML.encode(objArr, 2);
        return code_str;
    } catch(e: any) {
        vscode.window.showErrorMessage(`Failed encode to HELML-url: ${e.message}`);
        return null;
    }
}

export function HELMLtoPython(sel_text: string): string | null {
    try {
        let objArr = fromjson.decodeJSONtry2(sel_text);
        if (objArr === null) {
            objArr = HELML.decode(sel_text, extconfig.HELMLLayersList);
        }
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
        let objArr = fromjson.decodeJSONtry2(sel_text);
        if (objArr === null) {
            objArr = HELML.decode(sel_text, extconfig.HELMLLayersList);
        }
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
        let objArr = fromjson.decodeJSONtry2(sel_text);
        if (objArr === null) {
            objArr = HELML.decode(sel_text, extconfig.HELMLLayersList);
        }
        const json_str = JSON.stringify(objArr, null, '\t');
        return json_str;
    } catch (e) {
        console.error("Error: failed to encode HELML to JSON", e);
        vscode.window.showErrorMessage('Failed to encode HELML to JSON');
        return null;
    }
}


export function HELMLfromJSON(sel_text: string): string | null {
    let objArr = fromjson.decodeJSONtry2(sel_text);
    if (objArr !== null) {
        const helml_str = HELML.encode(objArr);
        return helml_str;
    }
    vscode.window.showErrorMessage('Failed to decode JSON to HELML!');
    return null;
}
