import * as vscode from 'vscode';
import LineHELML from './LineHELML';

// For upKey of HELML-block
let up_key_decorated_line_num = -1;
const upKeyListDecoration = vscode.window.createTextEditorDecorationType({
    border: '1px solid #880; padding: 4px;'
});
const upKeyArrDecoration = vscode.window.createTextEditorDecorationType({
    border: '1px solid #0D0; padding: 4px;'
});
//    textDecoration: 'underline #000 dotted; border-bottom: 1px dashed;'
const oneLevelKeysDecoration = vscode.window.createTextEditorDecorationType({
    backgroundColor: '#040;'
});
//    textDecoration: 'underline #000 waved;',
const errorKeysDecoration = vscode.window.createTextEditorDecorationType({
    backgroundColor: '#800'
}); 

export function clearAllDecorations(editor: vscode.TextEditor): void {
    editor.setDecorations(upKeyListDecoration, []);
    editor.setDecorations(upKeyArrDecoration, []);
    editor.setDecorations(oneLevelKeysDecoration, []);
    editor.setDecorations(errorKeysDecoration, []);
}

let currLevelLinesArray = [];
let  newLevelLinesArray: Array<any[]> = [];

function initOneLevelDeco() {
    newLevelLinesArray = [];
}
function pushOneLevelLine (cLineNumber: number, cLineHELML: LineHELML, cListVS: vscode.TextLine) {
    let positionStartKey: vscode.Position = cListVS.range.start.translate(0, cLineHELML.spc_left_cnt + cLineHELML.level);
    let positionAfterKey: vscode.Position = positionStartKey.translate(0, cLineHELML.key.length);
    const range = new vscode.Range(positionStartKey, positionAfterKey);
    newLevelLinesArray.push([cLineNumber, range, cLineHELML]);
}

function showOneLevelDeco(editor: vscode.TextEditor, is_list: boolean) {
    let cLineNumber: number;
    let range: vscode.Range;
    let cLineHELML: LineHELML;
    
    const oneKeyLevelDecorations = [];
    //const oneKeyErrDecorations = [];

    for(const arr of newLevelLinesArray) {
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

    initOneLevelDeco();

    const { document, selection } = editor;
    let sel_text = document.getText(selection);

    let currLineNumber: number = -1;
    let currLineVS: vscode.TextLine;
    let currLineHELML: LineHELML;

    let upKeyLineNumber = -1;
    let upKeyLineHELML: LineHELML | undefined;
    let downLineNumber = -1;

    // Lookup CurrLine
    let walkLineNumber = fromLineNumber;
    do {
        // get previous line and then move pointer
        currLineVS = document.lineAt(walkLineNumber);
        currLineHELML = new LineHELML(currLineVS.text);
        if (!currLineHELML.is_ignore) {
            // Line is not empty, not comment
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

        while(--walkLineNumber >= 0) {
            walkLineVS = document.lineAt(walkLineNumber);
            walkLineHELML = new LineHELML(walkLineVS.text);
            if (walkLineHELML.level === currWorkLevel) {
                pushOneLevelLine(walkLineNumber, walkLineHELML, walkLineVS);
            } else if (walkLineHELML.level < currWorkLevel) { // if level down
                if (walkLineHELML.level === currWorkLevel - 1 && walkLineHELML.is_creat) {
                    // upKey found
                    upKeyLineNumber = walkLineNumber;
                    upKeyLineHELML = walkLineHELML;

                    // upKey decorating
                    const range = new vscode.Range(walkLineVS.range.start, walkLineVS.range.end);
                    setUpKeyDecorator(editor, range, walkLineNumber + 1, upKeyLineHELML.is_list);
                }
                break;
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
        }
    }

    if (upKeyLineNumber < 0) {
        // if upkey not found, remove upKeyDecorators
        setUpKeyDecorator(editor);
    }

    showOneLevelDeco(editor, currLineHELML.is_list);

    return {
        sel_text: sel_text,

        currLineNumber: currLineNumber,
        currLineVS: currLineVS,
        currLineHELML: currLineHELML,

        upKeyLineNumber: upKeyLineNumber,
        upKeyLineHELML: upKeyLineHELML,
        downLineNumber: downLineNumber
    };
}
