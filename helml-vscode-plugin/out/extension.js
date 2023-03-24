'use strict';
const fs = require('fs');

const HELML = require('./HELML');
const jsesc = require('./jsesc');
const phparr = require('./phparr');
const pythonarr = require('./pythonarr');
//const toYaml = require('./toyaml');

Object.defineProperty(exports, "__esModule", { value: true });
exports.toJSON = exports.fromJSON = exports.deactivate = exports.activate = void 0;

const vscode = require("vscode");

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
    const jsonEncoded   = vscode.commands.registerCommand('helml.toJSON'      , cre_conv_fn(HELMLtoJSON));
    const helmlEncoded  = vscode.commands.registerCommand('helml.fromJSON'    , cre_conv_fn(HELMLfromJSON));
    const jsEncoded     = vscode.commands.registerCommand('helml.toJavaScript', cre_conv_fn(HELMLtoJavaScript));
    const phpEncoded    = vscode.commands.registerCommand('helml.toPHP'       , cre_conv_fn(HELMLtoPHP));
    const pythonEncoded = vscode.commands.registerCommand('helml.toPython'    , cre_conv_fn(HELMLtoPython));
    
    const helmlEncodedDoc = vscode.commands.registerCommand('helml.fromJSONDoc', async () => {
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
            if (sel_text == document.getText()) {
                wholeDocSel = true;
            }
        } else {
            sel_text = document.getText();
        }
    
        const convertedText = HELMLfromJSON(sel_text);
        if (convertedText) {

            let fileName = document.fileName;
            let newFile = undefined;

            if (canCloseOld && fileName.endsWith('.json')) {
                fileName = fileName.replace('.json', '.helml');
                if (!fs.existsSync(fileName)) {
                    fs.writeFileSync(fileName, convertedText);
                    vscode.window.showInformationMessage("Created: " + fileName);
                    newFile = await vscode.workspace.openTextDocument(fileName);
                } else {
                    vscode.window.showWarningMessage("Already exist: " + fileName);
                }
            }
    
            if (newFile === undefined) {
                newFile = await vscode.workspace.openTextDocument({
                    content: convertedText,
                    language: 'helml',
                    
                });
            }
            vscode.window.showTextDocument(newFile);

            if (canCloseOld) {
                // Close old document
                await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
            }
        }
    });

    context.subscriptions.push(jsonEncoded);
    context.subscriptions.push(helmlEncodedDoc);
    context.subscriptions.push(helmlEncoded);
    context.subscriptions.push(jsEncoded);
    context.subscriptions.push(phpEncoded);
    context.subscriptions.push(pythonEncoded);
    // context.subscriptions.push(yamlEncoded);

    // context.subscriptions.push(
    //     vscode.languages.registerContextMenuProvider('json', {
    //         provideContextMenu: (document, selection) => {
    //             const convertToHelmlMenuItem = new vscode.MenuItem(
    //                 "Convert to HELML",
    //                 () => vscode.commands.executeCommand('helml.fromJSON')
    //             );
    //             return [convertToHelmlMenuItem];
    //         }
    //     })
    // );
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

// function HELMLtoYAML(sel_text) {
//     try {
//         const objArr = HELML.decode(sel_text);
//         const code_str = toYaml(objArr, 1);
//         return code_str;
//     } catch (e) {
//         console.error("Error: failed to encode HELML to YAML code", e);
//         vscode.window.showErrorMessage('Failed to encode HELML to YAML code');
//         return null;
//     }
// }

// exports.HELMLtoYAML = HELMLtoYAML;

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
