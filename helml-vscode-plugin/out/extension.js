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
exports.HELMLfromJSON = exports.HELMLtoJSON = exports.HELMLtoPHP = exports.HELMLtoPython = exports.HELMLtoLINE = exports.HELMLtoURL = exports.SELECTIONfromBase64url = exports.SELECTIONtoBase64url = exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const HELML_1 = __importDefault(require("./HELML"));
const extconfig = __importStar(require("./extconfig"));
const codefolding = __importStar(require("./codefolding"));
const symbolsprov_1 = __importDefault(require("./symbolsprov"));
const menucontext = __importStar(require("./menucontext"));
const onchangeshook = __importStar(require("./onchangeshook"));
const hoverlook = __importStar(require("./hoverlook"));
const blocklook = __importStar(require("./blocklook"));
const fromjson = __importStar(require("./fromjson"));
const phparr_1 = __importDefault(require("./phparr"));
const pythonarr_1 = __importDefault(require("./pythonarr"));
// Create selection-converter function envelope for specified converter_fn
function cre_sel_conv_fn(converter_fn, targetLang = '') {
    return () => __awaiter(this, void 0, void 0, function* () {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        // Multi-selections support
        const { document, selections } = editor;
        const selectedTexts = [];
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
                const newFile = yield vscode.workspace.openTextDocument({
                    content: convertedText,
                    language: targetLang,
                });
                vscode.window.showTextDocument(newFile);
            }
            else {
                editor.edit(editBuilder => {
                    editBuilder.replace(editor.selection, convertedText);
                }).then(() => {
                    // call a reaction to a change in the selection
                    menucontext.onSelectionChangeByEditor(editor);
                });
                blocklook.clearAllDecorations(editor);
            }
        }
    });
}
function activate(context) {
    //Commands registration
    context.subscriptions.push(vscode.commands.registerCommand('helml.toJSON', cre_sel_conv_fn(HELMLtoJSON)));
    context.subscriptions.push(vscode.commands.registerCommand('helml.toJSONDoc', cre_sel_conv_fn(HELMLtoJSON, 'json')));
    context.subscriptions.push(vscode.commands.registerCommand('helml.fromJSON', cre_sel_conv_fn(HELMLfromJSON)));
    context.subscriptions.push(vscode.commands.registerCommand('helml.toPHP', cre_sel_conv_fn(HELMLtoPHP)));
    context.subscriptions.push(vscode.commands.registerCommand('helml.toPython', cre_sel_conv_fn(HELMLtoPython)));
    context.subscriptions.push(vscode.commands.registerCommand('helml.toBase64url', cre_sel_conv_fn(SELECTIONtoBase64url)));
    context.subscriptions.push(vscode.commands.registerCommand('helml.fromBase64url', cre_sel_conv_fn(SELECTIONfromBase64url)));
    context.subscriptions.push(vscode.commands.registerCommand('helml.toURL', cre_sel_conv_fn(HELMLtoURL)));
    context.subscriptions.push(vscode.commands.registerCommand('helml.toLINE', cre_sel_conv_fn(HELMLtoLINE)));
    context.subscriptions.push(vscode.commands.registerCommand('helml.fromJSONDoc', cre_sel_conv_fn(HELMLfromJSON, 'helml')));
    context.subscriptions.push(vscode.languages.registerFoldingRangeProvider('helml', new codefolding.HelmFoldingRangeProvider(':')));
    context.subscriptions.push(onchangeshook.onChangeTextDisposable);
    context.subscriptions.push(onchangeshook.onChangeEventDisposable(context));
    vscode.languages.registerHoverProvider('helml', hoverlook.hoverProvider);
    context.subscriptions.push(vscode.languages.registerDocumentSymbolProvider({ language: 'helml' }, new symbolsprov_1.default()));
    vscode.window.onDidChangeTextEditorSelection(menucontext.onSelectionChange);
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
function SELECTIONtoBase64url(sel_text) {
    try {
        const inBase64url = HELML_1.default.base64Uencode(sel_text.trim());
        return '-' + inBase64url;
    }
    catch (e) {
        vscode.window.showErrorMessage(`Failed encode to base64url: ${e.message}`);
    }
    return null;
}
exports.SELECTIONtoBase64url = SELECTIONtoBase64url;
function SELECTIONfromBase64url(sel_text) {
    try {
        const pfx = sel_text.charAt(0) === '-';
        const inBase64url = HELML_1.default.base64Udecode(pfx ? sel_text.substring(1) : sel_text);
        if (pfx)
            return ' ' + inBase64url;
        return inBase64url;
    }
    catch (e) {
        vscode.window.showErrorMessage(`Failed decode from base64url: ${e.message}`);
    }
    return null;
}
exports.SELECTIONfromBase64url = SELECTIONfromBase64url;
function HELMLtoURL(sel_text) {
    try {
        let objArr = objFromHELML(sel_text);
        if (objArr !== null) {
            const code_str = HELML_1.default.encode(objArr, 1);
            return code_str;
        }
    }
    catch (e) {
        vscode.window.showErrorMessage(`Failed encode to HELML-url: ${e.message}`);
    }
    return null;
}
exports.HELMLtoURL = HELMLtoURL;
function HELMLtoLINE(sel_text) {
    try {
        let objArr = objFromHELML(sel_text);
        if (objArr !== null) {
            const code_str = HELML_1.default.encode(objArr, 2);
            return code_str;
        }
    }
    catch (e) {
        vscode.window.showErrorMessage(`Failed encode to HELML-url: ${e.message}`);
    }
    return null;
}
exports.HELMLtoLINE = HELMLtoLINE;
function HELMLtoPython(sel_text) {
    try {
        let objArr = objFromHELML(sel_text);
        if (objArr !== null) {
            const code_str = pythonarr_1.default.toPythonArr(objArr, 1);
            return code_str;
        }
    }
    catch (e) {
        vscode.window.showErrorMessage('Failed to encode HELML to Python code');
    }
    return null;
}
exports.HELMLtoPython = HELMLtoPython;
function HELMLtoPHP(sel_text) {
    try {
        let objArr = objFromHELML(sel_text);
        if (objArr !== null) {
            const code_str = phparr_1.default.toPHParr(objArr, 1);
            return code_str;
        }
    }
    catch (e) {
        vscode.window.showErrorMessage('Failed to convert HELML to PHP array');
    }
    return null;
}
exports.HELMLtoPHP = HELMLtoPHP;
function HELMLtoJSON(sel_text) {
    try {
        let objArr = objFromHELML(sel_text);
        if (typeof objArr === 'object' && objArr !== null) {
            const json_str = JSON.stringify(objArr, null, '\t');
            return json_str;
        }
    }
    catch (e) {
        vscode.window.showErrorMessage('Failed to convert HELML to JSON');
    }
    return null;
}
exports.HELMLtoJSON = HELMLtoJSON;
function objFromHELML(sel_text) {
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
    return HELML_1.default.decode(sel_text, extconfig.HELMLLayersList);
}
function HELMLfromJSON(sel_text) {
    let objArr = fromjson.decodeJSONtry2(sel_text);
    if (objArr !== null) {
        const helml_str = HELML_1.default.encode(objArr);
        if (!menucontext.docIsHELML && (helml_str.charAt(0) !== '~')) {
            return "~\n" + helml_str;
        }
        return helml_str;
    }
    vscode.window.showErrorMessage('Failed to decode JSON to HELML!');
    return null;
}
exports.HELMLfromJSON = HELMLfromJSON;
