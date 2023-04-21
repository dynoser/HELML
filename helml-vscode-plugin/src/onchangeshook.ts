import * as vscode from 'vscode';
import * as blocklook from './blocklook';

export let onChangeTextDisposable = vscode.workspace.onDidChangeTextDocument(event => {
    const editor = vscode.window.activeTextEditor;
    if (editor && event.contentChanges.length) {

        const document = editor.document;
        if (document.languageId !== 'helml') {
            blocklook.clearAllDecorations(editor);
            return;
        }

        // collect line numbers where changes were made
        const changedLines: number[] = [];
        let tildasModify: boolean = false;
        for (const change of event.contentChanges) {
            for (let i = change.range.start.line; i <= change.range.end.line; i++) {
                changedLines.push(i);
            }
            if (!tildasModify && change.text.includes('~')) {
                tildasModify = true;
            }
        }
        
        if (changedLines.length > 1) {
            // do not continue for multiple-changes
            return;
        }

        // Last change analyzing
        const change = event.contentChanges[0];

        // How many new lines?
        let oneNewLine = change.text.indexOf("\n");
        if (oneNewLine > -1 && oneNewLine < change.text.length - 1) {
            // if new-line is not at EOL
            if (change.text.indexOf("\n", oneNewLine + 1) != -1) {
                // changes have more than 1 new-line
                oneNewLine = -1;
            }
        }
        // oneNewLine >= 0 if only one new line
        if (oneNewLine < 0) {
            return;
        }

        const wherePressEnterLineNumber = event.contentChanges[0].range.start.line;
        let currBlockObj = blocklook.edit_block_lookup(wherePressEnterLineNumber);
        if (currBlockObj === undefined || currBlockObj.currLineNumber < 0) {
            return;
        }

        let currLineHELML = currBlockObj.currLineHELML;
        const currWorkKey = currLineHELML.key;
        let currWorkLevel = currLineHELML.level;
        let currWorkSpCnt = currLineHELML.spc_left_cnt;

        if (currWorkKey === '' || currWorkLevel < 1) {
            // do not insert any idents if previous key not entered, or current level too small
            return;
        }

        if (currLineHELML.is_creat) {
            currWorkSpCnt++;
            currWorkLevel++;
        }

        let insertionStr = ' '.repeat(currWorkSpCnt) + ':'.repeat(currWorkLevel);
        if (currWorkKey === '--' || currBlockObj.upKeyLineHELML?.is_list) {
            insertionStr += '--:';
        }
        if (!insertionStr.length) {
            return;
        }
        const currentPosition = editor.selection.active;
        const insertPosition = currentPosition.with(wherePressEnterLineNumber + 1, 0);
        const afterInsertPos = currentPosition.with(wherePressEnterLineNumber + 1, insertionStr.length);
        const afterSelection = currentPosition.with(wherePressEnterLineNumber + 1, insertionStr.length + currWorkSpCnt);
        editor.edit((builder) => {
            builder.insert(insertPosition, insertionStr);
        }).then(() => {
            editor.selection = new vscode.Selection(afterInsertPos, afterSelection);
        });
    }
});

let langDisposable: vscode.Disposable | undefined;
let langDispEditorURI: vscode.Uri | undefined;

// Will subscribe on onDidChangeActiveTextEditor, then subscribe on languages.change
export let onChangeEventDisposable = (context: vscode.ExtensionContext) => {
    return vscode.window.onDidChangeActiveTextEditor(editor => {
        const currURI = editor?.document.uri;
        if (currURI) {
            if (!langDisposable || currURI !== langDispEditorURI) {
                langDispEditorURI = currURI;
                langDisposable = vscode.languages.onDidChangeDiagnostics(event => {
                    if (event.uris.includes(currURI)) {
                        blocklook.clearAllDecorations(editor);
                        langDisposable = undefined;
                    }
                });
                context.subscriptions.push(langDisposable);
            }
        }
    });
}
