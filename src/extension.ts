// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { VSCodeContext } from './VSCodeContext';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	const rootPath = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
		? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;

	// Get configuration
	const vsConfig = vscode.workspace.getConfiguration();

	// Instantiates all additional components related to the extension
	const vsExtContext = new VSCodeContext(context, {
		host: vsConfig.get<string>('graalRC.listServer.Address', "listserver.graal.in"),
		port: vsConfig.get<number>('graalRC.listServer.Port', 14922),
		account: vsConfig.get<string>('graalRC.login.Account', ""),
		password: vsConfig.get<string>('graalRC.login.Password', ""),
		nickname: vsConfig.get<string>('graalRC.login.Nickname', "")
	});

	// Watch for configuration changes
	context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
		let listServerConfigChanged = false;

		if (e.affectsConfiguration('graalRC.listServer.Address')) {
			vsExtContext.config.host = vscode.workspace.getConfiguration().get<string>("graalRC.listServer.Address") || vsExtContext.config.host;
			listServerConfigChanged = true;
		}

		if (e.affectsConfiguration('graalRC.listServer.Port')) {
			vsExtContext.config.port = vscode.workspace.getConfiguration().get<number>("graalRC.listServer.Port") || vsExtContext.config.port;
			listServerConfigChanged = true;
		}

		if (e.affectsConfiguration('graalRC.login.Account')) {
			vsExtContext.config.account = vscode.workspace.getConfiguration().get<string>("graalRC.login.Account") || vsExtContext.config.account;
			listServerConfigChanged = true;
		}

		if (e.affectsConfiguration('graalRC.login.Password')) {
			vsExtContext.config.password = vscode.workspace.getConfiguration().get<string>("graalRC.login.Password") || vsExtContext.config.password;
			listServerConfigChanged = true;
		}

		if (e.affectsConfiguration('graalRC.login.Nickname')) {
			vsExtContext.config.nickname = vscode.workspace.getConfiguration().get<string>("graalRC.login.Nickname") || vsExtContext.config.account;
			vsExtContext.rcInstance?.setNickName(vsExtContext.config.nickname);
		}

		if (listServerConfigChanged) {
			vscode.commands.executeCommand("serverListView.refresh");
		}
	}));
}

// this method is called when your extension is deactivated
export function deactivate() {

}
