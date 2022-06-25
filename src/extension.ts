import * as vscode from 'vscode';
import * as child_process from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const tmpfile = path.join(os.tmpdir(), "qmlextfmt.qml");

class QmlDocumentFormatter implements vscode.DocumentFormattingEditProvider {
	public provideDocumentFormattingEdits(
		document: vscode.TextDocument, options: vscode.FormattingOptions, token: vscode.CancellationToken)
		: vscode.ProviderResult<vscode.TextEdit[]> {
		const config = vscode.workspace.getConfiguration("qmlext");
		const qmlformat = config.get<string>("qmlformat"); // "C:\\Qt\\6.3.1\\msvc2019_64\\bin\\qmlformat.exe";
		const normalize = config.get<boolean>("normalize");
		fs.writeFileSync(tmpfile, document.getText());
		let param = " -lunix ";
		if (normalize) {
			param = param + "-n "
		}
		const ws = vscode.workspace.getWorkspaceFolder(document.uri)?.name;
		const result = child_process.execSync(qmlformat + param + tmpfile, { cwd: ws }).toString();
		var firstLine = document.lineAt(0);
		var lastLine = document.lineAt(document.lineCount - 1);
		var textRange = new vscode.Range(firstLine.range.start, lastLine.range.end);
		return [vscode.TextEdit.replace(textRange, result)];
	}
}

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "qmlext" is now active!');
	context.subscriptions.push(vscode.languages.registerDocumentFormattingEditProvider("qml", new QmlDocumentFormatter()));
}

export function deactivate() { }
