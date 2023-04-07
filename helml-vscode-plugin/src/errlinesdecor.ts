import * as vscode from 'vscode';

// For ~-error string
export let errorLines: number[] = [];
export const errorDecoration = vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(255, 0, 0, 0.3)',
    textDecoration: 'underline wavy',
});

export function clearAllDecorations(editor: vscode.TextEditor) {
    errorLines = [];
    editor.setDecorations(errorDecoration, []);
}

export function highlightErrors(editor: vscode.TextEditor) {
    const document = editor.document;
    if (document.languageId !== 'helml') {
        return;
    }
    if (document.lineCount < 2) {
        // one string may be HELML-URL
        return;
    }
    const decorations = [];

    for (let i = 1; i < document.lineCount; i++) {
        const line = document.lineAt(i);
        const st  = line.text;
        if (st.indexOf('~') != -1) {
            errorLines.push(i);
            const range = new vscode.Range(line.range.start, line.range.end);
            decorations.push({ range });
        }
    }

    editor.setDecorations(errorDecoration, decorations);
}

