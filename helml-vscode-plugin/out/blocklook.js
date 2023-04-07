"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.edit_block_lookup = exports.clearAllDecorations = void 0;
const vscode = __importStar(require("vscode"));
const LineHELML_1 = __importDefault(require("./LineHELML"));
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
function clearAllDecorations(editor) {
    editor.setDecorations(upKeyListDecoration, []);
    editor.setDecorations(upKeyArrDecoration, []);
    editor.setDecorations(oneLevelKeysDecoration, []);
    editor.setDecorations(errorKeysDecoration, []);
}
exports.clearAllDecorations = clearAllDecorations;
let currLevelLinesArray = [];
let newLevelLinesArray = [];
function initOneLevelDeco() {
    newLevelLinesArray = [];
}
function pushOneLevelLine(cLineNumber, cLineHELML, cListVS) {
    let positionStartKey = cListVS.range.start.translate(0, cLineHELML.spc_left_cnt + cLineHELML.level);
    let positionAfterKey = positionStartKey.translate(0, cLineHELML.key.length);
    const range = new vscode.Range(positionStartKey, positionAfterKey);
    newLevelLinesArray.push([cLineNumber, range, cLineHELML]);
}
function showOneLevelDeco(editor, is_list) {
    let cLineNumber;
    let range;
    let cLineHELML;
    const oneKeyLevelDecorations = [];
    //const oneKeyErrDecorations = [];
    for (const arr of newLevelLinesArray) {
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
function setUpKeyDecorator(editor, range = null, up_key_line_new_num = -1, is_list = true) {
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
function edit_block_lookup(fromLineNumber) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }
    initOneLevelDeco();
    const { document, selection } = editor;
    let sel_text = document.getText(selection);
    let currLineNumber = -1;
    let currLineVS;
    let currLineHELML;
    let upKeyLineNumber = -1;
    let upKeyLineHELML;
    let downLineNumber = -1;
    // Lookup CurrLine
    let walkLineNumber = fromLineNumber;
    do {
        // get previous line and then move pointer
        currLineVS = document.lineAt(walkLineNumber);
        currLineHELML = new LineHELML_1.default(currLineVS.text);
        if (!currLineHELML.is_ignore) {
            // Line is not empty, not comment
            currLineNumber = walkLineNumber;
            break;
        }
    } while (--walkLineNumber >= 0);
    // if current line found, lookup upkey-line
    if (currLineNumber >= 0) {
        pushOneLevelLine(currLineNumber, currLineHELML, currLineVS);
        let currWorkLevel = currLineHELML.level;
        let walkLineVS;
        let walkLineHELML;
        while (--walkLineNumber >= 0) {
            walkLineVS = document.lineAt(walkLineNumber);
            walkLineHELML = new LineHELML_1.default(walkLineVS.text);
            if (walkLineHELML.level === currWorkLevel) {
                pushOneLevelLine(walkLineNumber, walkLineHELML, walkLineVS);
            }
            else if (walkLineHELML.level < currWorkLevel) { // if level down
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
            walkLineHELML = new LineHELML_1.default(walkLineVS.text);
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
exports.edit_block_lookup = edit_block_lookup;
