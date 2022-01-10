// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { FtpExplorer } from './gprovider';

import { Serverlist } from '@xtjoeytx/node-grc';

let cfg = {
	host: "localhost",
	account: "",
	password: ""
};

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	Serverlist.request(cfg).then((servers) => {
		console.log("Req server cb");
		console.log(servers);

		if (servers.length > 0)
		{
			// RemoteControl.connect(cfg, servers[0]);
			// new RemoteControl(cfg, servers[0]);
		}
		else {
			console.log("No servers received");
		}
		
	}, (err) => {
		console.log("failed promise?", err);
	});

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "vscode-grc" is now active!');

	const rootPath = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
		? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;
		
	vscode.commands.registerCommand('testView2.addEntry', async () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Add entry!!!');
		
		const input = await vscode.window.showInputBox();
		vscode.window.showInformationMessage(input || "unknown");
	});

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('vscode-grc.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from vscode-grc!');
	});

	new FtpExplorer(context);

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
