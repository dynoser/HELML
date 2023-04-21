import * as vscode from 'vscode';

export let docIsHELML: boolean = false;
let menuToJSONon: boolean = false;
let menuFromJSONon: boolean = false;
let menuToPHPon: boolean = false;
let menuToPython: boolean = false;
let docIsPHP: boolean = false;
let docIsPython: boolean = false;

export function onSelectionChange(event: vscode.TextEditorSelectionChangeEvent)
{
    return onSelectionChangeByEditor(event.textEditor);
}

export function onSelectionChangeByEditor(textEditor: vscode.TextEditor) {
    const { document, selection } = textEditor;

    const langID = document.languageId;

    docIsHELML = langID === 'helml';
    docIsPHP = langID === 'php';
    docIsPython = langID === 'python';

    let newMenuToJSON = false;
    let newMenuFromJSON = langID === 'json';
    let newMenuToPHP = false;
    let newMenuToPython = false;

    // try to detect integrateg-HELML by ~-prefix
    const sel_text = document.getText(selection);
    if (sel_text) {
        let strlen = sel_text.length;
        let lastCh = '';
        // reduce end of line of spaces
        while(strlen) {
            lastCh = sel_text[strlen-1];
            if (lastCh !== ' ' && lastCh !== "\t" && lastCh !== "\n") break;
            strlen--;
        }

        // skip spaces from left
        let i = 0;
        while (i < strlen && (sel_text[i] === " " || sel_text[i] === "\t" || sel_text[i] === "\n")) {
            i++;
            strlen--;
        }

        if (strlen) {
            let firstCh = sel_text.charAt(i);

            // try detect JSON-object between {}
            if ((firstCh === '{' && lastCh === "}") || (firstCh === '[' && lastCh === ']')) {
                newMenuFromJSON = true;
            } else if (!docIsHELML) {
                // if the selected text is enclosed in quotations
                if ('`\'"'.indexOf(firstCh) >= 0 && lastCh === firstCh) {
                    newMenuToJSON = true;
                } else {
                    // check "~" inside
                    newMenuToJSON = (sel_text.indexOf('~') >= 0);
                }
                if (docIsPHP) {
                    newMenuToPHP = newMenuToJSON;
                }
                if (docIsPython) {
                    newMenuToPython = newMenuToJSON;
                }
            }
        }
    }

    if (docIsHELML) {
        newMenuToJSON = true;
    }

    if (newMenuToJSON !== menuToJSONon) {
        menuToJSONon = newMenuToJSON;
        vscode.commands.executeCommand("setContext", "helml.isIntegrated", menuToJSONon).then(() => {
            return menuToJSONon;
        });
    }

    if (newMenuFromJSON !== menuFromJSONon) {
        menuFromJSONon = newMenuFromJSON;
        vscode.commands.executeCommand("setContext", "helml.canJSON", menuFromJSONon).then(() => {
            return menuFromJSONon;
        });
    }

    if (newMenuToPHP !== menuToPHPon) {
        menuToPHPon = newMenuToPHP;
        vscode.commands.executeCommand("setContext", "helml.canPHP", menuToPHPon).then(() => {
            return menuToPHPon;
        });
    }

    if (newMenuToPython !== menuToPython) {
        menuToPython = newMenuToPython;
        vscode.commands.executeCommand("setContext", "helml.canPython", menuToPython).then(() => {
            return menuToPython;
        });
    }

}