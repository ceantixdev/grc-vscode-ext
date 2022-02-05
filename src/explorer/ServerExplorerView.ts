import path = require('path');
import * as vscode from 'vscode';

export const URI_SCHEME = "grc";

export enum ResourceType {
	file = 0,
	folder = 1,
	npcs = 2,
	scripts = 3,
	weapons = 4
}

export enum FolderType {
	fileBrowser = 0,
	npcList = 1,
	weaponList = 2,
	scriptList = 3
}

export interface GTreeNode {
	resource: vscode.Uri,
	type: ResourceType,
	folderType?: FolderType,
	label?: string,
	isDirectory: boolean,
	children?: GTreeNode[]
}

function getResourceContextValue(v: ResourceType): string | undefined {
	switch (v) {
		case ResourceType.file: return "file";
		case ResourceType.folder: return "folder";
		case ResourceType.npcs: return "npcs";
		case ResourceType.scripts: return "scripts";
		case ResourceType.weapons: return "weapons";
	}
}

function makeNode(resource: string, type: ResourceType = ResourceType.file, isDirectory = false, children: GTreeNode[] = [], folderType?: FolderType) : GTreeNode {
	return {
		resource: vscode.Uri.parse(resource, true),
		type: type,
		isDirectory: isDirectory,
		children: children,
		folderType: folderType
	};
}

export interface ServerExplorerProvider {
	get roots(): GTreeNode[];

	/**
	 * Retrieve a list of nodes below this resource
	 * 
	 * @param resource 
	 */
	getChildrenNodes(resource: vscode.Uri): GTreeNode[];

	/**
	 * Requests a resource from the server explorer. This can be used
	 * to refresh sub-resources, or open an editor for the resource which
	 * will be followed by a getResourceContent(resource) call
	 * 
	 * @param resource 
	 */
	getResource(resource: vscode.Uri): void;
	
	/**
	 * Fetch the content for a resource that will open in the text editor
	 * 
	 * @param resource 
	 * @returns vscode.ProviderResult<string>
	 */
	getResourceContent(resource: vscode.Uri): vscode.ProviderResult<string>;


	getChildren(node: GTreeNode): GTreeNode[];

	// getContent(resource: vscode.Uri): vscode.ProviderResult<string>;
	
	requestContent(resource: vscode.Uri): void;
}

class ServerExplorerTreeDataProvider implements vscode.TreeDataProvider<GTreeNode> {
	refresh(): any {
		this._onDidChangeTreeData.fire(undefined);
	}

	private _onDidChangeTreeData: vscode.EventEmitter<any> = new vscode.EventEmitter<any>();
	readonly onDidChangeTreeData: vscode.Event<any> = this._onDidChangeTreeData.event;

	constructor(private readonly dataProvider: ServerExplorerProvider) { }
	
	getTreeItem(element: GTreeNode): vscode.TreeItem | Thenable<vscode.TreeItem> {
		return {
			resourceUri: element.resource,
			label: element.label,
			collapsibleState: element.isDirectory ? vscode.TreeItemCollapsibleState.Collapsed : void 0,
			command: element.isDirectory ? void 0 : {
				command: 'serverExplorerView.openResource',
				arguments: [element.resource],
				title: 'Open Resource'
			},
			iconPath: {
				light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
				dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
			},
			contextValue: getResourceContextValue(element.type)
		};
	}

	getChildren(element?: GTreeNode): vscode.ProviderResult<GTreeNode[]> {
		return element ? this.dataProvider.getChildren(element) : this.dataProvider.roots;
	}
}

export class ServerExplorerView {
	private treeView: vscode.TreeView<GTreeNode>;
	private treeDataProvider: ServerExplorerTreeDataProvider;

	constructor(context: vscode.ExtensionContext, provider: ServerExplorerProvider) {
		this.treeDataProvider = new ServerExplorerTreeDataProvider(provider);

	   this.treeView = vscode.window.createTreeView("serverExplorerView", { treeDataProvider: this.treeDataProvider });
		
		vscode.commands.registerCommand('serverExplorerView.revealResource', () => this.reveal());
		vscode.commands.registerCommand('serverExplorerView.openResource', resource => provider.requestContent(resource));
		vscode.commands.registerCommand('serverExplorerView.refresh', () => this.refresh());

		// Treeview Context-Menu Commands
		vscode.commands.registerCommand('serverExplorerView.editFlags', (node: GTreeNode) => provider.getResource(node.resource.with({ query: "editflags"})));

		vscode.commands.registerCommand('serverExplorerView.editScript', (node: GTreeNode) => provider.getResource(node.resource.with({ query: "editscript"})));
		vscode.commands.registerCommand('serverExplorerView.deleteEntry', (node: GTreeNode) => provider.getResource(node.resource.with({ query: "delete"})));
	}

	public updateTitle(title: string): void {
		this.treeView.title = title;
	}

	public refresh(): void {
		this.treeDataProvider.refresh();
	}

	private reveal(): Thenable<void>|null {
		const node = this.getNode();
		if (node) {
			return this.treeView.reveal(node);
		}
		return null;
	}

	private getNode(): GTreeNode|null {
		if (vscode.window.activeTextEditor) {
			if (vscode.window.activeTextEditor.document.uri.scheme === URI_SCHEME) {
				return { resource: vscode.window.activeTextEditor.document.uri, type: ResourceType.file, isDirectory: false };
			}
		}
		return null;
	}

	static getDefaultRootNodes(): GTreeNode[] {
		return [
			{
				resource: vscode.Uri.parse(`${URI_SCHEME}:///gserver`, true),
				type: ResourceType.folder,
				isDirectory: true,
				label: "GServer",
				children: [
					makeNode(`${URI_SCHEME}:///gserver/Config`, ResourceType.folder, true, [
						makeNode(`${URI_SCHEME}:///gserver/config/Server Flags`, ResourceType.file),
						makeNode(`${URI_SCHEME}:///gserver/config/Server Options`, ResourceType.file),
					]),
					makeNode(`${URI_SCHEME}:///gserver/Players`, ResourceType.folder, true),
					makeNode(`${URI_SCHEME}:///gserver/Filebrowser`, ResourceType.folder, true, [], FolderType.fileBrowser)
				]
			},
		
			{
				resource: vscode.Uri.parse(`${URI_SCHEME}:///npcserver`, true),
				type: ResourceType.folder,
				isDirectory: true,
				label: "NPC-Server",
				children: [
					makeNode(`${URI_SCHEME}:///npcserver/NPCS`, ResourceType.folder, true, [], FolderType.npcList),
					makeNode(`${URI_SCHEME}:///npcserver/Scripts`, ResourceType.folder, true, [], FolderType.scriptList),
					makeNode(`${URI_SCHEME}:///npcserver/Weapons`, ResourceType.folder, true, [], FolderType.weaponList)
				]
			}
		];
	}
}