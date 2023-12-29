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
function cre_sel_conv_fn(converter_fn: (text: string) => string | null, targetLang: string = '') {
    return async () => {
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
        let combinedText = selectedTexts.join("\n");
        
        let wholeDocSel = combinedText.length < 3;
        let docIsSaved = !document.isDirty;

        if (wholeDocSel) {
            if (!targetLang) {
                vscode.window.showWarningMessage('No text selected!');
                return;
            }
            combinedText = document.getText();
        }

        const convertedText = converter_fn(combinedText);

        if (convertedText) {
            if (targetLang) {
                const newFile = await vscode.workspace.openTextDocument({
                    content: convertedText,
                    language: targetLang,
                });
                vscode.window.showTextDocument(newFile);
            } else {
                editor.edit(editBuilder => {
                    editBuilder.replace(editor.selection, convertedText);
                }).then(() => {
                    // call a reaction to a change in the selection
                    menucontext.onSelectionChangeByEditor(editor);
                });
                blocklook.clearAllDecorations(editor);
            }
        }
    };
}

export function activate(context: vscode.ExtensionContext) {
    
    //Commands registration

    context.subscriptions.push(
        vscode.commands.registerCommand('helml.toJSON', cre_sel_conv_fn(HELMLtoJSON))
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('helml.toJSONDoc', cre_sel_conv_fn(HELMLtoJSON, 'json'))
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
        vscode.commands.registerCommand('helml.toHex', cre_sel_conv_fn(SELECTIONtoHEX))
    );
    context.subscriptions.push(
        vscode.commands.registerCommand('helml.fromHex', cre_sel_conv_fn(SELECTIONfromHEX))
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
        vscode.commands.registerCommand('helml.fromJSONDoc', cre_sel_conv_fn(HELMLfromJSON, 'helml'))
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

export function SELECTIONtoHEX(sel_text: string): string | null {
    return '%' + toHex(sel_text);
}

export function toHex(sel_text: string): string | null {
    if (typeof Buffer !== 'undefined') {
        try {
            return Buffer.from(sel_text, 'utf-8').toString('hex');
        } catch(e: any) {
        }
    }
    try {
        const base64String = HELML.base64Uencode(sel_text, false);
        return Base64ToHex(base64String);
    } catch(e: any) {
        vscode.window.showErrorMessage(`Failed encode to HEX: ${e.message}`);
    }
    return null;
}

export function Base64ToHex(base64String: string): string {
    const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let hexString = '';

    for (let i = 0; i < base64String.length; i += 4) {
        const block = (
            (base64Chars.indexOf(base64String[i]) << 18) |
            (base64Chars.indexOf(base64String[i + 1]) << 12) |
            (base64Chars.indexOf(base64String[i + 2]) << 6) |
            (base64Chars.indexOf(base64String[i + 3]))
        );
        const validHexDigits = base64String[i + 2] === '=' ? 2 : base64String[i + 3] === '=' ? 4 : 6;

        for (let j = 0; j < validHexDigits; j++) {
            const hexDigit = (block >> (20 - j * 4)) & 0xF;
            hexString += hexDigit.toString(16);
        }
    }
    return hexString;
}

export function SELECTIONfromHEX(sel_text: string): string | null {
    try {
        const pfx = sel_text.charAt(0) === '%';
        const hexString = pfx ? sel_text.substring(1) : sel_text;
        // const decodedBuffer = Buffer.from(hexString, 'hex');
        // const decodedText = decodedBuffer.toString('utf-8');
        const decodedText = HELML.hexDecode(hexString);
        if (pfx) return ' ' + decodedText;
        return decodedText;
    } catch(e: any) {
        vscode.window.showErrorMessage(`Failed to decode from HEX: ${e.message}`);
    }
    return null;
}

export function SELECTIONtoBase64url(sel_text: string): string | null {
    try {
        const inBase64url = HELML.base64Uencode(sel_text.trim());
        return '-' + inBase64url;
    } catch(e: any) {
        vscode.window.showErrorMessage(`Failed encode to base64url: ${e.message}`);
    }
    return null;
}

export function SELECTIONfromBase64url(sel_text: string): string | null {
    try {
        const pfx = sel_text.charAt(0) === '-';
        const inBase64url = HELML.base64Udecode(pfx ? sel_text.substring(1) : sel_text);
        if (pfx) return ' ' + inBase64url;
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
        if (!menucontext.docIsHELML && (helml_str.charAt(0) !== '~')) {
            return "~\n" + helml_str;
        }
        return helml_str;
    }
    vscode.window.showErrorMessage('Failed to decode JSON to HELML!');
    return null;
}
