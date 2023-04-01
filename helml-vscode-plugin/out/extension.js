"use strict";
//import jsesc from './jsesc';
//import phparr from './phparr';
//import pythonarr from './pythonarr';
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
exports.HELMLfromJSON = exports.HELMLtoJSON = exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const HELML_1 = __importDefault(require("./HELML"));
function reloadConfig() {
    const config = vscode.workspace.getConfiguration('helml');
    const enableident = config.get('enableident');
    const enablebones = config.get('enablebones');
    const enableuplines = config.get('enableuplines');
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
}
reloadConfig();
// Auto-update config on changes
vscode.workspace.onDidChangeConfiguration(event => {
    if (event.affectsConfiguration('helml.enableident') || event.affectsConfiguration('helml.enablebones')) {
        reloadConfig();
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
    //const cmdToJavaScript = vscode.commands.registerCommand('helml.toJavaScript', cre_conv_fn(HELMLtoJavaScript));
    //const cmdToPHP = vscode.commands.registerCommand('helml.toPHP', cre_conv_fn(HELMLtoPHP));
    //const cmdToPython = vscode.commands.registerCommand('helml.toPython', cre_conv_fn(HELMLtoPython));
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
        }
        else {
            sel_text = document.getText();
        }
        let newFile;
        const convertedText = HELMLfromJSON(sel_text);
        if (convertedText) {
            let fileName = document.fileName;
            newFile = await vscode.workspace.openTextDocument({
                content: convertedText,
                language: 'helml',
            });
        }
        vscode.window.showTextDocument(newFile);
    });
    context.subscriptions.push(cmdToJSON);
    context.subscriptions.push(cmdFromJsonDoc);
    context.subscriptions.push(cmdFromJSON);
    //context.subscriptions.push(cmdToJavaSc);
    //context.subscriptions.push(cmdToPHP);
    //context.subscriptions.push(cmdToPython);
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
// export function HELMLtoPython(sel_text: string): string | null {
//     try {
//         const objArr = HELML.decode(sel_text);
//         const code_str = pythonarr(objArr, 1);
//         return code_str;
//     } catch (e) {
//         console.error("Error: failed to encode HELML to Python code", e);
//         vscode.window.showErrorMessage('Failed to encode HELML to Python code');
//         return null;
//     }
// }
// export function HELMLtoPHP(sel_text: string): string | null {
//     try {
//         const objArr = HELML.decode(sel_text);
//         const code_str = phparr(objArr, ' ');
//         return code_str;
//     } catch (e) {
//         console.error("Error: failed to encode HELML to PHP code", e);
//         vscode.window.showErrorMessage('Failed to encode HELML to PHP code');
//         return null;
//     }
// }
function HELMLtoJSON(sel_text) {
    try {
        const objArr = HELML_1.default.decode(sel_text);
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
function HELMLfromJSON(sel_text) {
    try {
        const objArr = JSON.parse(sel_text);
        const helml_str = HELML_1.default.encode(objArr);
        return helml_str;
    }
    catch (e) {
        console.error("Error: failed to decode JSON to HELML", e);
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
