import path = require('path');
import * as vscode from 'vscode';
import { ServerlistNode } from './ServerListNode';

enum ServerCategory {
	classic = 0,
	gold = 1,
	hosted = 2,
	hidden = 3,
	g3d = 4
}

export interface Server {
	category: ServerCategory
	name: string
    language: string;
    description: string;
    url: string;
    version: string;
	pcount: number
	ip: string
	port: number
}

export interface ServerListProvider {
	getServerList(): Thenable<ServerlistNode[]>
	connectToServer(server: Server): void
}

function createDescriptionString(server: Server): vscode.MarkdownString
{
	const content = new vscode.MarkdownString(`<h2> ${server.name}</h2><hr>`);
	content.appendMarkdown(`<p><b> Players Online:</b> ${server.pcount}</p>`);
	content.appendMarkdown(`<p><b> Version:</b> ${server.version}</p>`);
	content.appendMarkdown(`<p><b> Language:</b> ${server.language}</p>`);
	content.appendMarkdown(`<p><b> Description:</b> ${server.description}</p>`);
	content.appendMarkdown(`<p><b> Website:</b> ${server.url}</p>`);
	content.supportHtml = true;
	content.isTrusted = true;
	return content;
}

class ServerListTreeDataProvider implements vscode.TreeDataProvider<ServerlistNode> {
	private _onDidChangeTreeData: vscode.EventEmitter<any> = new vscode.EventEmitter<any>();
	readonly onDidChangeTreeData: vscode.Event<any> = this._onDidChangeTreeData.event;

	refresh(): any {
		this.model.getServerList().then(() => this._onDidChangeTreeData.fire(undefined));
	}

	constructor(private readonly model: ServerListProvider) { }

	getTreeItem(element: ServerlistNode): vscode.TreeItem | Thenable<vscode.TreeItem> {
		return {
			resourceUri: element.resource,
			label: element.label,
			description: element.server?.description.toString(),
			tooltip: element.server ? createDescriptionString(element.server) : undefined,
			collapsibleState: element.children ? vscode.TreeItemCollapsibleState.Expanded : void 0,
			command: element.children && element.children.length > 0 ? void 0 : {
				command: 'serverListView.connect',
				arguments: [element.server],
				title: 'Connect to server'
			},
			iconPath: ( !element.children || element.children.length === 0 ? {
				light: path.join(__filename, '..', '..', '..', '..', 'resources', 'light', 'shiny-coin2.svg'),
				dark: path.join(__filename, '..', '..', '..', '..', 'resources', 'light', 'shiny-coin2.svg')
			} : undefined)
		};
	}

	getChildren(element?: ServerlistNode): vscode.ProviderResult<ServerlistNode[]> {
		if (element) {
			return element.children || [];
		}

		return this.model.getServerList();
	}
}

export class ServerListView {
	private treeView: vscode.TreeView<ServerlistNode>;
	
	constructor(context: vscode.ExtensionContext, model: ServerListProvider) {
		const treeDataProvider = new ServerListTreeDataProvider(model);

		this.treeView = vscode.window.createTreeView("serverListView", { treeDataProvider });

		const disposables = context.subscriptions;

		disposables.push(vscode.commands.registerCommand('serverListView.refresh', () => treeDataProvider.refresh()));

		disposables.push(vscode.commands.registerCommand('serverListView.connect', (server: Server) => {
			model.connectToServer(server);
		}));
	}
	
	static getDefaultRootNodes(): ServerlistNode[] {
		return [
			{
				resource: vscode.Uri.parse("serverlist:///classic/"),
				label: "Classic Servers",
				children: []
			},
			{
				resource: vscode.Uri.parse("serverlist:///gold/"),
				label: "Gold Servers",
				children: []
			},
			{
				resource: vscode.Uri.parse("serverlist:///hosted/"),
				label: "Hosted Servers",
				children: []
			},
			{
				resource: vscode.Uri.parse("serverlist:///hidden/"),
				label: "Hidden Servers",
				children: []
			},
			{
				resource: vscode.Uri.parse("serverlist:///g3d/"),
				label: "3D Servers",
				children: []
			}
		];
	}
}