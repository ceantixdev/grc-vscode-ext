import path = require('path');
import * as vscode from 'vscode';

export enum ResourceType {
	file = 0,
	npcs = 1,
	scripts = 2,
	weapons = 3
}

export interface GTreeNode {
	resource: vscode.Uri,
	type: ResourceType,
	isDirectory: boolean
}

const testNodeData: GTreeNode[] = [
	{
		resource: vscode.Uri.parse("testView:///filebrowser/"),
		type: ResourceType.file,
		isDirectory: true
	},
	{
		resource: vscode.Uri.parse("testView:///npcs/"),
		type: ResourceType.npcs,
		isDirectory: true
	},
	{
		resource: vscode.Uri.parse("testView:///scripts/"),
		type: ResourceType.scripts,
		isDirectory: true
	},
	{
		resource: vscode.Uri.parse("testView:///weapons/"),
		type: ResourceType.weapons,
		isDirectory: true
	},
];

export class SuperDuperClass {
	public get roots(): GTreeNode[] {
		return testNodeData;
	}

	public getContent(resource: vscode.Uri): string {
		return "nada for " + resource.toString();
	}

	public getChildren(node: GTreeNode): GTreeNode[] {
		console.log(`Get children for ${node.resource}`);
		console.log(node.resource);
		return [
			{
				resource: node.resource,
				type: node.type,
				isDirectory: false
			}
		];
		// return this.connect().then(client => {
		// 	return new Promise((c, e) => {
		// 		client.list(node.resource.fsPath, (err, list) => {
		// 			if (err) {
		// 				return e(err);
		// 			}

		// 			client.end();

		// 			return c(this.sort(list.map(entry => ({ resource: vscode.Uri.parse(`${node.resource.fsPath}/${entry.name}`), isDirectory: entry.type === 'd' }))));
		// 		});
		// 	});
		// });
	}
}

export class GTreeDataProvider implements vscode.TreeDataProvider<GTreeNode>, vscode.TextDocumentContentProvider {
	private _onDidChangeTreeData: vscode.EventEmitter<any> = new vscode.EventEmitter<any>();
	readonly onDidChangeTreeData: vscode.Event<any> = this._onDidChangeTreeData.event;

	constructor(private readonly model: SuperDuperClass) { }

	getTreeItem(element: GTreeNode): vscode.TreeItem | Thenable<vscode.TreeItem> {
		return {
			resourceUri: element.resource,
			collapsibleState: element.isDirectory ? vscode.TreeItemCollapsibleState.Collapsed : void 0,
			command: /*element.isDirectory*/ false ? void 0 : {
				command: 'testView.openFtpResource',
				arguments: [element.resource],
				title: 'Open FTP Resource'
			},
			iconPath: {
				light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
				dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
			}
		};
	}

	getChildren(element?: GTreeNode): vscode.ProviderResult<GTreeNode[]> {
		return element ? this.model.getChildren(element) : this.model.roots;
	}

	public provideTextDocumentContent(uri: vscode.Uri, token: vscode.CancellationToken): vscode.ProviderResult<string> {
		return this.model.getContent(uri);
	}
}

export class FtpExplorer {

	private ftpViewer: vscode.TreeView<GTreeNode>;

	constructor(context: vscode.ExtensionContext) {
		const ftpModel = new SuperDuperClass();
		const treeDataProvider = new GTreeDataProvider(ftpModel);
		context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider('testView', treeDataProvider));

		this.ftpViewer = vscode.window.createTreeView('testView', { treeDataProvider });

		// vscode.commands.registerCommand('testView.refresh', () => treeDataProvider.refresh());
		vscode.commands.registerCommand('testView.openFtpResource', resource => this.openResource(resource));
		vscode.commands.registerCommand('testView.revealResource', () => this.reveal());
		vscode.commands.registerCommand('testView.addEntry', (node: vscode.TreeItem) => vscode.window.showInformationMessage(`Successfully called add entry.`));
		vscode.commands.registerCommand('testView.editEntry', (node: vscode.TreeItem) => vscode.window.showInformationMessage(`Successfully called edit entry on ${node.label}.`));
		vscode.commands.registerCommand('testView.deleteEntry', (node: vscode.TreeItem) => vscode.window.showInformationMessage(`Successfully called delete entry on ${node.label}.`));
	}

	private openResource(resource: vscode.Uri): void {
		vscode.window.showTextDocument(resource);
	}

	private reveal(): Thenable<void>|null {
		const node = this.getNode();
		if (node) {
			return this.ftpViewer.reveal(node);
		}
		return null;
	}

	private getNode(): GTreeNode|null {
		if (vscode.window.activeTextEditor) {
			if (vscode.window.activeTextEditor.document.uri.scheme === 'testView') {
				return { resource: vscode.window.activeTextEditor.document.uri, type: ResourceType.file, isDirectory: false };
			}
		}
		return null;
	}
}