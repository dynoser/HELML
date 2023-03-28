'use strict';

const HELML = require('./HELML');
const jsesc = require('./jsesc');
const phparr = require('./phparr');
const pythonarr = require('./pythonarr');
//const htmlvshelml = require('./htmlvshelml');
//const toYaml = require('./toyaml');

Object.defineProperty(exports, "__esModule", { value: true });
exports.toJSON = exports.fromJSON = exports.deactivate = exports.activate = void 0;

const vscode = require("vscode");

function reloadConfig() {
    const config = vscode.workspace.getConfiguration('helml');
    const enableident = config.get('enableident');
    const enablebones = config.get('enablebones');
    if (enableident !== undefined && enableiden !== HELML.ENABLE_SPC_IDENT) {
      // устанавливаем значение в соответствии с настройками
      config.update('enableident', enableident, true);
      HELML.ENABLE_SPC_IDENT = enableident;
    }
    if (enablebones !== undefined && enablebones !== HELML.ENABLE_BONES) {
      // устанавливаем значение в соответствии с настройками
      config.update('enablebones', enablebones, true);
      HELML.ENABLE_BONES = enablebones;
    }
}
  
reloadConfig();

// Auto-update config on changes
vscode.workspace.onDidChangeConfiguration(event => {
    if (event.affectsConfiguration('helml.enableident')) {
        reloadConfig();
    }
    if (event.affectsConfiguration('helml.enablebones')) {
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
    const cmdToJSON      = vscode.commands.registerCommand('helml.toJSON'      , cre_conv_fn(HELMLtoJSON));
    const cmdFromJSON    = vscode.commands.registerCommand('helml.fromJSON'    , cre_conv_fn(HELMLfromJSON));
    const cmdToJavaSc    = vscode.commands.registerCommand('helml.toJavaScript', cre_conv_fn(HELMLtoJavaScript));
    const cmdToPHP       = vscode.commands.registerCommand('helml.toPHP'       , cre_conv_fn(HELMLtoPHP));
    const cmdToPython    = vscode.commands.registerCommand('helml.toPython'    , cre_conv_fn(HELMLtoPython));
//    const cmdHTMLtoHELML = vscode.commands.registerCommand('helml.HTMLtoHELML' , cre_conv_fn(HTMLtoHELML));
//    const cmdHELMLtoHTML = vscode.commands.registerCommand('helml.HELMLtoHTML' , cre_conv_fn(HELMLtoHTML));
    
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

            // if (canCloseOld && fileName.endsWith('.json')) {
            //     fileName = fileName.replace('.json', '.helml');
            //     if (!fs.existsSync(fileName)) {
            //         fs.writeFileSync(fileName, convertedText);
            //         vscode.window.showInformationMessage("Created: " + fileName);
            //         newFile = await vscode.workspace.openTextDocument(fileName);
            //     } else {
            //         vscode.window.showWarningMessage("Already exist: " + fileName);
            //     }
            // }
    
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

    context.subscriptions.push(cmdToJSON);
    context.subscriptions.push(cmdFromJsonDoc);
    context.subscriptions.push(cmdFromJSON);
    context.subscriptions.push(cmdToJavaSc);
    context.subscriptions.push(cmdToPHP);
    context.subscriptions.push(cmdToPython);
    //context.subscriptions.push(cmdHTMLtoHELML);
    //context.subscriptions.push(cmdHELMLtoHTML);
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

// Hover-controller block
function parseLine(line, word) {
    let result_str = null;
    let key_str = "plain-key";
    let value_str = " plain-value";

    line = line.trim();
    
    if (!line.length || line.charAt(0) === '#') return;

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

    // Split the line into a key and a value (or null if the line starts a new array)
    const firstDiv = line.indexOf(lvl_ch);
    let key = firstDiv === -1 ? line : line.substring(0, firstDiv);
    let value = firstDiv === -1 ? null : line.substring(firstDiv + 1);

    // check key by first char
    if (key.charAt(0) === '-') {
        if (key === '--') {
            // The bone-key means "next number".
            key_str = "NextNum-key";
            key = "[NextNum]";
        } else if (key.startsWith('-+')) {
            result_str = "Next-Layer";
        } else {
            key_str = "-base64-key";
            let decoded_key = HELML.base64Udecode(key.substring(1));
            if (false === decoded_key) {
                result_str = "ERROR: encoded KEY contain illegal chars";
            }
        }
    }

    if (result_str === null) {
        if (value === null) {
            result_str = "Create sub-array: " + key;
        } else if (value === "")  {
            result_str = "Create LIST: " + key;
        } else if (value.startsWith(' ')) {
            if (value.startsWith('  ')) {
                value_str = " value (<i>non-string<i>)";
            }
        } else if (value.charAt(0) === '-') {
            value_str = "-base64-value";
            let decoded_value = HELML.base64Udecode(value.substring(1));
            if (false === decoded_value) {
                result_str = "ERROR: encoded VALUE contain illegal chars";
            }
        } else {
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
  }
};

vscode.languages.registerHoverProvider('helml', hoverProvider);


// function HTMLtoHELML(sel_text) {
//     try {
//         const results_arr = htmlvshelml.html_to_helml(sel_text);
//         const helml_str = results_arr.join("\n");
//         return helml_str;
//     } catch (e) {
//         console.error("Error: can't convert HTML to HELML", e);
//         vscode.window.showErrorMessage("Can't convert HTML to HELML!");
//         return null;
//     }
// }

// exports.HTMLtoHELML = HTMLtoHELML;

// function HELMLtoHTML(sel_text) {
//     try {
//         const html_str = htmlvshelml.helml_to_html(sel_text);
//         return html_str;
//     } catch (e) {
//         console.error("Error: can't convert HELML to HTML", e);
//         vscode.window.showErrorMessage("Can't convert HELML to HTML!");
//         return null;
//     }
// }

// exports.HTMLtoHELML = HELMLtoHTML;


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
