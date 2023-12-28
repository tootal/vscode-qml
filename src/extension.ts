import * as vscode from 'vscode';
import * as child_process from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	Executable,
} from 'vscode-languageclient/node';

const tmpfile = path.join(os.tmpdir(), "qmlextfmt.qml");
let client: LanguageClient;

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
		// const ws = vscode.workspace.getWorkspaceFolder(document.uri)?.name;
		const result = child_process.execSync(qmlformat + param + tmpfile).toString();
		var firstLine = document.lineAt(0);
		var lastLine = document.lineAt(document.lineCount - 1);
		var textRange = new vscode.Range(firstLine.range.start, lastLine.range.end);
		return [vscode.TextEdit.replace(textRange, result)];
	}
}

function startQmlls(qmlls: string, qmllsBuildDir: string) {
	const serverExecutable : Executable = {
		command: qmlls,
		args: [ '--build-dir', qmllsBuildDir],
		// prints VSCode commands to qmlls into qmllsInput file and 
		// qmlls responses into qmllsOutput file
	};

	// If the extension is launched in debug mode then the debug server options are used
	// Otherwise the run options are used
	const serverOptions: ServerOptions = serverExecutable;

	// Options to control the language client
	const clientOptions: LanguageClientOptions = {
		documentSelector: [{ language: 'qml'}], //only works if qml extension is installed
		//documentSelector: [ { pattern: '*.qml'}], //does not work, VSCode does not call qmlls on .qml files
		synchronize: {
			fileEvents: vscode.workspace.createFileSystemWatcher('**/*.qml')
		}
	};

	// Create the language client and start the client.
	client = new LanguageClient(
		'languageServerExample',
		'Language Server Example',
		serverOptions,
		clientOptions
	);

	// Start the client. This will also launch the server
	client.start();
	console.log('QMLLS start');
}

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "qmlext" is now active!');
	context.subscriptions.push(vscode.languages.registerDocumentFormattingEditProvider("qml", new QmlDocumentFormatter()));
	// QML Language Server
	// The server is implemented in node

	const config = vscode.workspace.getConfiguration("qmlext");
	const qmlls = config.get<string>("qmlls");
	const qmllsBuildDir = config.get<string>("qmllsBuildDir");
	if (qmlls && qmllsBuildDir) {
		startQmlls(qmlls, qmllsBuildDir)
	}
}

export function deactivate() {
	if (!client) {
		return undefined;
	}
	console.log('QMLLS stop!');
	return client.stop();
}
