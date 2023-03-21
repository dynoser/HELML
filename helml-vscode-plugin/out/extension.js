'use strict';
const HELML = require('./HELML');
const jsesc = require('./jsesc');
const phparr = require('./phparr');
const pythonarr = require('./pythonarr');

Object.defineProperty(exports, "__esModule", { value: true });
exports.toJSON = exports.fromJSON = exports.deactivate = exports.activate = void 0;

const vscode = require("vscode");

function activate(context) {
    const jsonEncoded = vscode.commands.registerCommand('helml.toJSON', () => {
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

        const convertedText = HELMLtoJSON(sel_text);
        if (convertedText) {
            editor.edit(editBuilder => {
                editBuilder.replace(selection, convertedText);
            });
        }
    });
    const helmlEncoded = vscode.commands.registerCommand('helml.fromJSON', () => {
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

        const convertedText = HELMLfromJSON(sel_text);
        if (convertedText) {
            editor.edit(editBuilder => {
                editBuilder.replace(selection, convertedText);
            });
        }
    });
    
    const jsEncoded = vscode.commands.registerCommand('helml.toJavaScript', () => {
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

        const convertedText = HELMLtoJavaScript(sel_text);
        if (convertedText) {
            editor.edit(editBuilder => {
                editBuilder.replace(selection, convertedText);
            });
        }
    });

    const phpEncoded = vscode.commands.registerCommand('helml.toPHP', () => {
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

        const convertedText = HELMLtoPHP(sel_text);
        if (convertedText) {
            editor.edit(editBuilder => {
                editBuilder.replace(selection, convertedText);
            });
        }
    });
    
    const pythonEncoded = vscode.commands.registerCommand('helml.toPython', () => {
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

        const convertedText = HELMLtoPython(sel_text);
        if (convertedText) {
            editor.edit(editBuilder => {
                editBuilder.replace(selection, convertedText);
            });
        }
    });

    context.subscriptions.push(jsonEncoded);
    context.subscriptions.push(helmlEncoded);
    context.subscriptions.push(jsEncoded);
    context.subscriptions.push(phpEncoded);
    context.subscriptions.push(pythonEncoded);
}

exports.activate = activate;

function deactivate() { }

exports.deactivate = deactivate;

function HELMLtoJavaScript(sel_text) {
    try {
        const objArr = HELML.decode(sel_text);
        const code_str = jsesc(objArr,  {
            'quotes': 'double',
            'compact': false,
            'indent': '\t'
          });
        return code_str;
    } catch (e) {
        console.error("Error: failed to encode HELML to JavaScript code", e);
        vscode.window.showErrorMessage('Failed to encode HELML to JavaScript!');
        return null;
    }
}

exports.HELMLtoJavaScript = HELMLtoJavaScript;

function HELMLtoPython(sel_text) {
    try {
        const objArr = HELML.decode(sel_text);
        const code_str = pythonarr(objArr, 1);
        return code_str;
    } catch (e) {
        console.error("Error: failed to encode HELML to Python code", e);
        vscode.window.showErrorMessage('Failed to encode HELML to Python code');
        return null;
    }
}

exports.HELMLtoPHP = HELMLtoPython;

function HELMLtoPHP(sel_text) {
    try {
        const objArr = HELML.decode(sel_text);
        const code_str = phparr(objArr, ' ');
        return code_str;
    } catch (e) {
        console.error("Error: failed to encode HELML to PHP code", e);
        vscode.window.showErrorMessage('Failed to encode HELML to PHP code');
        return null;
    }
}

exports.HELMLtoPHP = HELMLtoPHP;

function HELMLtoJSON(sel_text) {
    try {
        const objArr = HELML.decode(sel_text);
        const json_str = JSON.stringify(objArr, null, '\t');
        return json_str;
    } catch (e) {
        console.error("Error: failed to encode HELML to JSON", e);
        vscode.window.showErrorMessage('Failed to encode HELML to JSON');
        return null;
    }
}

exports.HELMLtoJSON = HELMLtoJSON;

function HELMLfromJSON(sel_text) {
    try {
        const objArr = JSON.parse(sel_text);
        const helml_str = HELML.encode(objArr);
        return helml_str;
    } catch (e) {
        console.error("Error: failed to decode JSON to HELML", e);
        vscode.window.showErrorMessage('Failed to decode JSON to HELML!');
        return null;
    }
}

exports.HELMLfromJSON = HELMLfromJSON;
