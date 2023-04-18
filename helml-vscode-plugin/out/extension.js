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
const onchangeshook = __importStar(require("./onchangeshook"));
const hoverlook = __importStar(require("./hoverlook"));
//import * as errlinesdecor from './errlinesdecor';
const blocklook = __importStar(require("./blocklook"));
const fromjson = __importStar(require("./fromjson"));
const phparr_1 = __importDefault(require("./phparr"));
const pythonarr_1 = __importDefault(require("./pythonarr"));
// Create selection-converter function envelope for specified converter_fn
function cre_sel_conv_fn(converter_fn) {
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
            blocklook.clearAllDecorations(editor);
            //errlinesdecor.clearAllDecorations(editor);
        }
    };
}
function activate(context) {
    //Commands registration
    context.subscriptions.push(vscode.commands.registerCommand('helml.toJSON', cre_sel_conv_fn(HELMLtoJSON)));
    context.subscriptions.push(vscode.commands.registerCommand('helml.fromJSON', cre_sel_conv_fn(HELMLfromJSON)));
    context.subscriptions.push(vscode.commands.registerCommand('helml.toPHP', cre_sel_conv_fn(HELMLtoPHP)));
    context.subscriptions.push(vscode.commands.registerCommand('helml.toPython', cre_sel_conv_fn(HELMLtoPython)));
    context.subscriptions.push(vscode.commands.registerCommand('helml.toBase64url', cre_sel_conv_fn(SELECTIONtoBase64url)));
    context.subscriptions.push(vscode.commands.registerCommand('helml.fromBase64url', cre_sel_conv_fn(SELECTIONfromBase64url)));
    context.subscriptions.push(vscode.commands.registerCommand('helml.toURL', cre_sel_conv_fn(HELMLtoURL)));
    context.subscriptions.push(vscode.commands.registerCommand('helml.toLINE', cre_sel_conv_fn(HELMLtoLINE)));
    context.subscriptions.push(vscode.commands.registerCommand('helml.fromJSONDoc', () => __awaiter(this, void 0, void 0, function* () {
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
    })));
    context.subscriptions.push(vscode.languages.registerFoldingRangeProvider('helml', new codefolding.HelmFoldingRangeProvider(':')));
    context.subscriptions.push(onchangeshook.onChangeTextDisposable);
    context.subscriptions.push(onchangeshook.onChangeEventDisposable(context));
    vscode.languages.registerHoverProvider('helml', hoverlook.hoverProvider);
    context.subscriptions.push(vscode.languages.registerDocumentSymbolProvider({ language: 'helml' }, new symbolsprov_1.default()));
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
function SELECTIONtoBase64url(sel_text) {
    try {
        const inBase64url = HELML_1.default.base64Uencode(sel_text);
        return inBase64url;
    }
    catch (e) {
        vscode.window.showErrorMessage(`Failed encode to base64url: ${e.message}`);
        return null;
    }
}
exports.SELECTIONtoBase64url = SELECTIONtoBase64url;
function SELECTIONfromBase64url(sel_text) {
    try {
        const inBase64url = HELML_1.default.base64Udecode(sel_text);
        return inBase64url;
    }
    catch (e) {
        vscode.window.showErrorMessage(`Failed decode from base64url: ${e.message}`);
        return null;
    }
}
exports.SELECTIONfromBase64url = SELECTIONfromBase64url;
function HELMLtoURL(sel_text) {
    try {
        let objArr = fromjson.decodeJSONtry2(sel_text);
        if (objArr === null) {
            objArr = HELML_1.default.decode(sel_text, extconfig.HELMLLayersList);
        }
        const code_str = HELML_1.default.encode(objArr, 1);
        return code_str;
    }
    catch (e) {
        vscode.window.showErrorMessage(`Failed encode to HELML-url: ${e.message}`);
        return null;
    }
}
exports.HELMLtoURL = HELMLtoURL;
function HELMLtoLINE(sel_text) {
    try {
        let objArr = fromjson.decodeJSONtry2(sel_text);
        if (objArr === null) {
            objArr = HELML_1.default.decode(sel_text, extconfig.HELMLLayersList);
        }
        const code_str = HELML_1.default.encode(objArr, 2);
        return code_str;
    }
    catch (e) {
        vscode.window.showErrorMessage(`Failed encode to HELML-url: ${e.message}`);
        return null;
    }
}
exports.HELMLtoLINE = HELMLtoLINE;
function HELMLtoPython(sel_text) {
    try {
        let objArr = fromjson.decodeJSONtry2(sel_text);
        if (objArr === null) {
            objArr = HELML_1.default.decode(sel_text, extconfig.HELMLLayersList);
        }
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
        let objArr = fromjson.decodeJSONtry2(sel_text);
        if (objArr === null) {
            objArr = HELML_1.default.decode(sel_text, extconfig.HELMLLayersList);
        }
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
        let objArr = fromjson.decodeJSONtry2(sel_text);
        if (objArr === null) {
            objArr = HELML_1.default.decode(sel_text, extconfig.HELMLLayersList);
        }
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
    let objArr = fromjson.decodeJSONtry2(sel_text);
    if (objArr !== null) {
        const helml_str = HELML_1.default.encode(objArr);
        return helml_str;
    }
    vscode.window.showErrorMessage('Failed to decode JSON to HELML!');
    return null;
}
exports.HELMLfromJSON = HELMLfromJSON;
