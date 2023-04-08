import * as vscode from 'vscode';
import * as extconfig from './extconfig';

import LineHELML from './LineHELML';

// Default style, may be changed in config, parameter helml.style.upkey
let upKeyListDecoration: vscode.TextEditorDecorationType;
let upKeyArrDecoration: vscode.TextEditorDecorationType;
let oneLevelKeysDecoration: vscode.TextEditorDecorationType;
let subLevelKeysDecoration: vscode.TextEditorDecorationType;
let errorKeysDecoration: vscode.TextEditorDecorationType;

export function reloadConfig() {
    upKeyListDecoration = vscode.window.createTextEditorDecorationType(extconfig.styles.upkeylist || extconfig.styles.upkey || extconfig.styles.upkeyarr  || {
        border: '1px solid #880; padding: 4px;'
    });

    upKeyArrDecoration = vscode.window.createTextEditorDecorationType(extconfig.styles.upkeyarr || extconfig.styles.upkey || extconfig.styles.upkeylist || {
        border: '1px solid #0D0; padding: 4px;'
    });

    oneLevelKeysDecoration = vscode.window.createTextEditorDecorationType(extconfig.styles.onelevelkeys || {
        backgroundColor: '#040;'
    });

//    textDecoration: 'underline #000 dotted; border-bottom: 1px dashed;'

    subLevelKeysDecoration = vscode.window.createTextEditorDecorationType(extconfig.styles.subkeys || {
        backgroundColor: '#224;'
    });
//    textDecoration: 'underline #000 waved;',
    errorKeysDecoration = vscode.window.createTextEditorDecorationType({
        backgroundColor: '#800'
    });
}

export function clearAllDecorations(editor: vscode.TextEditor): void {
    editor.setDecorations(upKeyListDecoration, []);
    editor.setDecorations(upKeyArrDecoration, []);
    editor.setDecorations(oneLevelKeysDecoration, []);
    editor.setDecorations(errorKeysDecoration, []);
}

let oneLevelLinesArray: Array<any[]> = [];
let subLevelLinesArray: Array<any[]> = [];

function initLevelLinesDecor() {
    oneLevelLinesArray = [];
    subLevelLinesArray = [];
}
function pushOneLevelLine (cLineNumber: number, cLineHELML: LineHELML, cListVS: vscode.TextLine) {
    let positionStartKey: vscode.Position = cListVS.range.start.translate(0, cLineHELML.spc_left_cnt + cLineHELML.level);
    let positionAfterKey: vscode.Position = positionStartKey.translate(0, cLineHELML.key.length);
    const range = new vscode.Range(positionStartKey, positionAfterKey);
    oneLevelLinesArray.push([cLineNumber, range, cLineHELML]);
}
function pushSubLevelLine(cLineNumber: number, cLineHELML: LineHELML, cListVS: vscode.TextLine) {
    let positionStartKey: vscode.Position = cListVS.range.start.translate(0, cLineHELML.spc_left_cnt + cLineHELML.level);
    let positionAfterKey: vscode.Position = positionStartKey.translate(0, cLineHELML.key.length);
    const range = new vscode.Range(positionStartKey, positionAfterKey);
    subLevelLinesArray.push([cLineNumber, range, cLineHELML]);
}

function showOneLevelDecor(editor: vscode.TextEditor, is_list: boolean) {
    let cLineNumber: number;
    let range: vscode.Range;
    let cLineHELML: LineHELML;
    
    const oneKeyLevelDecorations = [];
    //const oneKeyErrDecorations = [];

    for(const arr of oneLevelLinesArray) {
        [cLineNumber, range, cLineHELML] = arr;
        // const currKey = cLineHELML.key;
        // if (is_list && (currKey.charAt(0) !== '-' && !(/^-?\d+(.\d+)?$/.test(currKey)))) {
        //     oneKeyErrDecorations.push({ range});
        // } else {
            oneKeyLevelDecorations.push({ range });
        // }
    }
    editor.setDecorations(oneLevelKeysDecoration, oneKeyLevelDecorations);
    // editor.setDecorations(errorKeysDecoration, oneKeyErrDecorations);
}

function showSubLevelDecor(editor: vscode.TextEditor) {
    let cLineNumber: number;
    let range: vscode.Range;
    let cLineHELML: LineHELML;
    
    const subKeyLevelDecorations = [];

    for(const arr of subLevelLinesArray) {
        [cLineNumber, range, cLineHELML] = arr;
        subKeyLevelDecorations.push({ range });
    }
    editor.setDecorations(subLevelKeysDecoration, subKeyLevelDecorations);
}

function setUpKeyDecorator(
    editor: vscode.TextEditor,
    range: vscode.Range | null = null,
    up_key_line_new_num: number = -1,
    is_list: boolean = true
) {
    if (setUpKeyDecorator.up_key_decorated_is_list !== is_list) {
        // clear previous decorator another type
        editor.setDecorations(is_list ? upKeyArrDecoration : upKeyListDecoration, []);
    }

    if (setUpKeyDecorator.up_key_decorated_line_num !== up_key_line_new_num) {
        setUpKeyDecorator.up_key_decorated_line_num = up_key_line_new_num;
        const decorations = [];

        if (range !== null && up_key_line_new_num >= 0) {
            decorations.push({ range });
        }
        editor.setDecorations(is_list ? upKeyListDecoration : upKeyArrDecoration, decorations);
        setUpKeyDecorator.up_key_decorated_is_list = is_list;
    }
}
setUpKeyDecorator.up_key_decorated_line_num = -1;
setUpKeyDecorator.up_key_decorated_is_list = false;


export function edit_block_lookup(fromLineNumber: number) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }

    initLevelLinesDecor();

    const { document, selection } = editor;
    let sel_text = document.getText(selection);

    let currLineNumber: number = -1;
    let currLineHELML: LineHELML;
    let currLineVS: vscode.TextLine;

    let upKeyLineNumber = -1;
    let upKeyLineHELML: LineHELML | undefined;

    let upKeyRange: vscode.Range | undefined;

    let downLineNumber = -1;
    let isHELML = true;

    // Lookup CurrLine
    let walkLineNumber = fromLineNumber;
    do {
        // get previous line and then move pointer
        currLineVS = document.lineAt(walkLineNumber);
        currLineHELML = new LineHELML(currLineVS.text);
        if (!currLineHELML.is_ignore) {
            // Line is not empty, not comment
            if (currLineHELML.key.indexOf(' ') != -1) break; //space or quote in key means not a HELML
            if (currLineHELML.key.indexOf('"') != -1) break;

            currLineNumber = walkLineNumber;
            break;
        }
    } while (--walkLineNumber >= 0);

     // if current line found, lookup upkey-line
    if (currLineNumber >= 0) {
        pushOneLevelLine(currLineNumber, currLineHELML, currLineVS);

        let currWorkLevel: number = currLineHELML.level;

        let walkLineVS: vscode.TextLine;
        let walkLineHELML: LineHELML;

        for( ;walkLineNumber >= 0; walkLineNumber--) {
            walkLineVS = document.lineAt(walkLineNumber);
            walkLineHELML = new LineHELML(walkLineVS.text);
            if (walkLineHELML.is_ignore) {
                continue;
            }
            if (walkLineHELML.level === currWorkLevel) {
                pushOneLevelLine(walkLineNumber, walkLineHELML, walkLineVS);
            } else if (walkLineHELML.level < currWorkLevel) { // if level down
                if (walkLineHELML.level === currWorkLevel - 1 && walkLineHELML.is_creat) {
                    // upKey found
                    upKeyLineNumber = walkLineNumber;
                    upKeyLineHELML = walkLineHELML;

                    // upKey decorating
                    upKeyRange = new vscode.Range(walkLineVS.range.start, walkLineVS.range.end);
                }
                break;
            } else if (walkLineHELML.level === currWorkLevel + 1) {
                // if level up at one step
                pushSubLevelLine(walkLineNumber, walkLineHELML, walkLineVS);
            }
        }

        // walk from current line to down
        for (let i = currLineNumber + 1; i < document.lineCount; i++) {
            walkLineVS = document.lineAt(i);
            walkLineHELML = new LineHELML(walkLineVS.text);
            if (walkLineHELML.is_ignore) {
                continue;
            }
            if (walkLineHELML.level === currWorkLevel) {
                pushOneLevelLine(i, walkLineHELML, walkLineVS);
                downLineNumber = i;
            }
            else if (walkLineHELML.level < currWorkLevel) { // if level down
                break;
            }
            else if (walkLineHELML.level === currWorkLevel + 1) { // if level up at one step
                pushSubLevelLine(walkLineNumber, walkLineHELML, walkLineVS);
            }
        }
    } else {
        isHELML = false;
    }

    if (upKeyLineNumber < 0) {
        // if upkey not found, remove upKeyDecorators
        setUpKeyDecorator(editor);
    } else {
        setUpKeyDecorator(editor, upKeyRange, upKeyLineNumber, upKeyLineHELML?.is_list);
    }

    if (isHELML) {
        showOneLevelDecor(editor, currLineHELML.is_list);
        showSubLevelDecor(editor);
    }

    return {
        sel_text: sel_text,

        isHELML: isHELML,

        currLineNumber: currLineNumber,
        currLineVS: currLineVS,
        currLineHELML: currLineHELML,

        upKeyLineNumber: upKeyLineNumber,
        upKeyLineHELML: upKeyLineHELML,
        downLineNumber: downLineNumber
    };
}
