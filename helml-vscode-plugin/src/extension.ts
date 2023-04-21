//import jsesc from './jsesc';

import * as vscode from 'vscode';
import HELML from './HELML';
import * as extconfig from './extconfig';

import * as codefolding from './codefolding';
import symbolsprov from "./symbolsprov";

import * as menucontext from './menucontext';

import * as onchangeshook from './onchangeshook';
import * as hoverlook from './hoverlook';
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
        
        // Multi-selections support
        const { document, selections } = editor;
        const selectedTexts: string[] = [];
        
        for (const selection of selections) {
            const sel_text = document.getText(selection);
            if (sel_text) {
                selectedTexts.push(sel_text);
            }
        }
        
        if (selectedTexts.length === 0) {
            vscode.window.showWarningMessage('No text selected!');
            return;
        }
        
        const combinedText = selectedTexts.join("\n");

        const convertedText = converter_fn(combinedText);
        if (convertedText) {
            editor.edit(editBuilder => {
                editBuilder.replace(editor.selection, convertedText);
            }).then(() => {
                // call a reaction to a change in the selection
                menucontext.onSelectionChangeByEditor(editor);
            });
            blocklook.clearAllDecorations(editor);
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

    context.subscriptions.push(
        vscode.languages.registerFoldingRangeProvider('helml', new codefolding.HelmFoldingRangeProvider(':'))
    );

    context.subscriptions.push(onchangeshook.onChangeTextDisposable);
    context.subscriptions.push(onchangeshook.onChangeEventDisposable(context));

    vscode.languages.registerHoverProvider('helml', hoverlook.hoverProvider);

    context.subscriptions.push(
        vscode.languages.registerDocumentSymbolProvider({ language: 'helml' }, new symbolsprov())
    );

    vscode.window.onDidChangeTextEditorSelection(menucontext.onSelectionChange);
}

export function deactivate() { }

export function SELECTIONtoBase64url(sel_text: string): string | null {
    try {
        const inBase64url = HELML.base64Uencode(sel_text);
        return inBase64url;
    } catch(e: any) {
        vscode.window.showErrorMessage(`Failed encode to base64url: ${e.message}`);
    }
    return null;
}

export function SELECTIONfromBase64url(sel_text: string): string | null {
    try {
        const inBase64url = HELML.base64Udecode(sel_text);
        return inBase64url;
    } catch(e: any) {
        vscode.window.showErrorMessage(`Failed decode from base64url: ${e.message}`);
    }
    return null;
}

export function HELMLtoURL(sel_text: string): string | null {
    try {
        let objArr = objFromHELML(sel_text);
        if (objArr !== null) {
            const code_str = HELML.encode(objArr, 1);
            return code_str;
        }
    } catch(e: any) {
        vscode.window.showErrorMessage(`Failed encode to HELML-url: ${e.message}`);
    }
    return null;
}
export function HELMLtoLINE(sel_text: string): string | null {
    try {
        let objArr = objFromHELML(sel_text);
        if (objArr !== null) {
            const code_str = HELML.encode(objArr, 2);
            return code_str;
        }
    } catch(e: any) {
        vscode.window.showErrorMessage(`Failed encode to HELML-url: ${e.message}`);
    }
    return null;
}

export function HELMLtoPython(sel_text: string): string | null {
    try {
        let objArr = objFromHELML(sel_text);
        if (objArr !== null) {
            const code_str = pythonarr.toPythonArr(objArr, 1);
            return code_str;
        }
    } catch (e) {
        vscode.window.showErrorMessage('Failed to encode HELML to Python code');
    }
    return null;
}

export function HELMLtoPHP(sel_text: string): string | null {
    try {
        let objArr = objFromHELML(sel_text);
        if (objArr !== null) {
            const code_str = phparr.toPHParr(objArr, 1);
            return code_str;
        }
    } catch (e) {
        vscode.window.showErrorMessage('Failed to convert HELML to PHP array');
    }
    return null;
}

export function HELMLtoJSON(sel_text: string): string | null {
    try {
        let objArr = objFromHELML(sel_text);
        if (typeof objArr === 'object' && objArr !== null) {
            const json_str = JSON.stringify(objArr, null, '\t');
            return json_str;
        }
    } catch (e) {
        vscode.window.showErrorMessage('Failed to convert HELML to JSON');
    }
    return null;
}
function objFromHELML(sel_text: string) {
    // skip spaces from left
    let i = 0;
    while (i < sel_text.length && (sel_text[i] === " " || sel_text[i] === "\t" || sel_text[i] === "\n")) {
        i++;
    }
    // get first char
    let ench = sel_text.charAt(i);

    // may be it's json?
    let objArr = (ench === "{") ? fromjson.decodeJSONtry2(sel_text) : null;

    if (objArr !== null) {
        // yes, it is JSON
        return objArr;
    }

    // may be selected text is enclosed in quotations?
    if ('`\'"'.indexOf(ench) >= 0 && sel_text.endsWith(ench)) {
        // yes, remove quotations
        sel_text = sel_text.slice(i + 1, -1);
    }

    // decode from HELML
    return HELML.decode(sel_text, extconfig.HELMLLayersList);
}


export function HELMLfromJSON(sel_text: string): string | null {
    let objArr = fromjson.decodeJSONtry2(sel_text);
    if (objArr !== null) {
        const helml_str = HELML.encode(objArr);
        if (!menucontext.docIsHELML) {
            return "~\n" + helml_str;
        }
        return helml_str;
    }
    vscode.window.showErrorMessage('Failed to decode JSON to HELML!');
    return null;
}
