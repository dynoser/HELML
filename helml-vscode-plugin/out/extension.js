'use strict';
const HELML = require('./HELML');

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
    context.subscriptions.push(jsonEncoded);
    context.subscriptions.push(helmlEncoded);
}

exports.activate = activate;

function deactivate() { }

exports.deactivate = deactivate;


function HELMLtoJSON(sel_text) {
    try {
        const objArr = HELML.decode(sel_text);
        const json_str = JSON.stringify(objArr, null, '\t');
        return json_str;
    } catch (e) {
        console.error("Error: failed to encode HELML to JSON", e);
        vscode.window.showErrorMessage('Failed to encode HELML to JSON!');
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
