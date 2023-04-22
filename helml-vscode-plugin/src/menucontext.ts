import * as vscode from 'vscode';

export let docIsHELML: boolean = false;
let menuCanHELML: boolean = false;
let menuCanJSON: boolean = false;
let menuCanB64: boolean = false;
let menuCanToB64: boolean = false;

export function onSelectionChange(event: vscode.TextEditorSelectionChangeEvent)
{
    return onSelectionChangeByEditor(event.textEditor);
}

export function onSelectionChangeByEditor(textEditor: vscode.TextEditor) {
    const { document, selection } = textEditor;

    const langID = document.languageId;

    docIsHELML = langID === 'helml';
    let canHELML = docIsHELML;
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
        while(strlen) {
            lastCh = sel_text[strlen-1];
            if (spcs.indexOf(lastCh) < 0) break;
            strlen--;
        }

        // reduce line by start-spaces
        let i = 0;
        while (i < strlen) {
            if (spcs.indexOf(sel_text[i]) < 0) break;
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

            canHELML = inBbrackets ? false : (docIsHELML || haveTilda);

            if (isOneLine) {
                if (!haveTilda && !inBbrackets) {
                    canB64 = /^[A-Za-z0-9\-_+\/=]+$/.test(sel_text.substring(i, i+strlen));
                }
                canToB64 = docIsHELML;
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