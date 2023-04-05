"use strict";
//import jsesc from './jsesc';
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HELMLfromJSON = exports.decodeJSONtry = exports.removeJSONcomments = exports.HELMLtoJSON = exports.HELMLtoPHP = exports.HELMLtoPython = exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const HELML_1 = __importDefault(require("./HELML"));
const phparr_1 = __importDefault(require("./phparr"));
const pythonarr_1 = __importDefault(require("./pythonarr"));
let HELMLLayersList = ['0'];
function reloadConfig(event = null) {
    const config = vscode.workspace.getConfiguration('helml');
    const extname = 'helml';
    const enableident = config.get('enableident');
    const enablebones = config.get('enablebones');
    const enableuplines = config.get('enableuplines');
    const enablehashsym = config.get('enablehashsym');
    if (enableident !== undefined && enableident !== HELML_1.default.ENABLE_SPC_IDENT) {
        config.update('enableident', enableident, true);
        HELML_1.default.ENABLE_SPC_IDENT = enableident;
    }
    if (enablebones !== undefined && enablebones !== HELML_1.default.ENABLE_BONES) {
        config.update('enablebones', enablebones, true);
        HELML_1.default.ENABLE_BONES = enablebones;
    }
    if (enableuplines !== undefined && enableuplines !== HELML_1.default.ENABLE_KEY_UPLINES) {
        config.update('enableuplines', enableuplines, true);
        HELML_1.default.ENABLE_KEY_UPLINES = enableuplines;
    }
    if (enablehashsym !== undefined && enableuplines !== HELML_1.default.ENABLE_HASHSYMBOLS) {
        config.update('enablehashsym', enablehashsym, true);
        HELML_1.default.ENABLE_HASHSYMBOLS = enablehashsym;
    }
    if (event === null || event.affectsConfiguration(extname + '.getlayers')) {
        const getlayers = config.get('getlayers');
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
function cre_conv_fn(converter_fn) {
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
function activate(context) {
    const cmdToJSON = vscode.commands.registerCommand('helml.toJSON', cre_conv_fn(HELMLtoJSON));
    const cmdFromJSON = vscode.commands.registerCommand('helml.fromJSON', cre_conv_fn(HELMLfromJSON));
    const cmdToPHP = vscode.commands.registerCommand('helml.toPHP', cre_conv_fn(HELMLtoPHP));
    const cmdToPython = vscode.commands.registerCommand('helml.toPython', cre_conv_fn(HELMLtoPython));
    //const cmdToJavaScript = vscode.commands.registerCommand('helml.toJavaScript', cre_conv_fn(HELMLtoJavaScript));
    const cmdFromJsonDoc = vscode.commands.registerCommand('helml.fromJSONDoc', () => __awaiter(this, void 0, void 0, function* () {
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
        }
        else {
            sel_text = document.getText();
        }
        let newFile;
        const convertedText = HELMLfromJSON(sel_text);
        if (convertedText) {
            let fileName = document.fileName;
            newFile = yield vscode.workspace.openTextDocument({
                content: convertedText,
                language: 'helml',
            });
        }
        vscode.window.showTextDocument(newFile);
    }));
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
            let prevLine;
            let line;
            let level = 0;
            let spc_cnt = 0;
            let strlen;
            let keyName = '';
            while (prevLineNumber >= 0) {
                // get previous line and then move pointer
                prevLine = document.lineAt(prevLineNumber--);
                line = prevLine.text;
                strlen = line.length;
                if (!strlen)
                    continue; // ignore empty lines
                spc_cnt = 0;
                level = 0;
                for (let i = 0; i < strlen; i++) {
                    if (line[i] === ' ') {
                        spc_cnt++;
                    }
                    else {
                        for (let j = i; j < strlen; j++) {
                            if (line[j] === ':') {
                                level++;
                            }
                            else {
                                break;
                            }
                        }
                        break;
                    }
                }
                // Ignore comment lines starting with '#'
                if (line.charAt(spc_cnt) === '#')
                    continue;
                // we found one of non-empty and non-comment line
                // check sub-array create
                const colonIndex = line.indexOf(':', spc_cnt + level + 1);
                const haveColonDiv = colonIndex > (spc_cnt + level);
                const onlyKeyNoDiv = (colonIndex < 0 && (spc_cnt + level) < strlen);
                const colonDivAtEnd = haveColonDiv && (colonIndex === strlen - 1);
                if (colonIndex > 0) {
                    keyName = line.substring(spc_cnt + level, colonIndex);
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
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
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
function HELMLtoPython(sel_text) {
    try {
        const objArr = HELML_1.default.decode(sel_text, HELMLLayersList);
        const code_str = pythonarr_1.default.toPythonArr(objArr, 1);
        return code_str;
    }
    catch (e) {
        console.error("Error: failed to encode HELML to Python code", e);
        vscode.window.showErrorMessage('Failed to encode HELML to Python code');
        return null;
    }
}
exports.HELMLtoPython = HELMLtoPython;
function HELMLtoPHP(sel_text) {
    try {
        const objArr = HELML_1.default.decode(sel_text, HELMLLayersList);
        const code_str = phparr_1.default.toPHParr(objArr, 1);
        return code_str;
    }
    catch (e) {
        console.error("Error: failed to encode HELML to PHP code", e);
        vscode.window.showErrorMessage('Failed to encode HELML to PHP code');
        return null;
    }
}
exports.HELMLtoPHP = HELMLtoPHP;
function HELMLtoJSON(sel_text) {
    try {
        const objArr = HELML_1.default.decode(sel_text, HELMLLayersList);
        const json_str = JSON.stringify(objArr, null, '\t');
        return json_str;
    }
    catch (e) {
        console.error("Error: failed to encode HELML to JSON", e);
        vscode.window.showErrorMessage('Failed to encode HELML to JSON');
        return null;
    }
}
exports.HELMLtoJSON = HELMLtoJSON;
function removeJSONcomments(json_str) {
    //return json_str;
    const re1 = /^(\s*)\/\/.*$/gm; // remove comments from string-begin
    const re2 = /\/\*[^*]*\*+([^\/*][^*]*\*+)*\//g; // remove comments from end
    return json_str
        .replace(re1, '')
        .replace(re2, '');
}
exports.removeJSONcomments = removeJSONcomments;
function decodeJSONtry(json_str) {
    try {
        return JSON.parse(json_str);
    }
    catch (e) {
        return null;
    }
}
exports.decodeJSONtry = decodeJSONtry;
function HELMLfromJSON(sel_text) {
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
        const helml_str = HELML_1.default.encode(objArr);
        return helml_str;
    }
    catch (e) {
        vscode.window.showErrorMessage('Failed to decode JSON to HELML!');
        return null;
    }
}
exports.HELMLfromJSON = HELMLfromJSON;
// Hover-controller block
function parseLine(line, word) {
    let result_str = null;
    let key_str = "key";
    let value_str = " value";
    line = line.trim();
    if (!line.length || line.charAt(0) === '#')
        return null;
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
        }
        else if (key.startsWith('-+')) {
            if (value) {
                return "Layer: " + value;
            }
            else {
                return "Layer Next";
            }
        }
        else {
            key_str = "-b64key";
            let decoded_key = HELML_1.default.base64Udecode(key.substring(1));
            if (null === decoded_key) {
                result_str = "ERROR: encoded KEY contain illegal chars";
            }
            else {
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
        }
        else if (value === "") {
            result_str = `Create [${key}] LIST`;
        }
        else if (value.startsWith(' ')) {
            if (value.startsWith('  ')) {
                value_str = " value <i>(non-string)<i>";
            }
        }
        else if (value.charAt(0) === '-') {
            value_str = "-b64value";
            let decoded_value = HELML_1.default.base64Udecode(value.substring(1));
            if (null === decoded_value) {
                result_str = "ERROR: encoded VALUE contain illegal chars";
            }
            else {
                value_str = `-b64=${decoded_value}`;
            }
        }
        else {
            value_str = "UNKNOWN or USER-DEFINED VALUE";
        }
    }
    if (result_str === null) {
        result_str = key_str + ":" + value_str;
    }
    return result_str;
}
const hoverProvider = {
    provideHover(document, position) {
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
