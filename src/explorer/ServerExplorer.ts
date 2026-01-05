import * as vscode from 'vscode';
import { VSCodeContext } from "../VSCodeContext";
import { ServerExplorerFileSystem } from './ServerExplorerFileSystem';
import { ServerExplorerRouter } from './ServerExplorerRouter';
import { ServerExplorerView } from "./ServerExplorerView";
import * as types from './types';

export function createContextMenu(type: types.ResourceType, prefix: string, list: Iterable<types.ExplorerEntry | string>) {
	const nodes: types.GTreeNode[] = [];
	let nodeSet = new Set<string>();

	if (prefix && !prefix.endsWith("/")) {
		prefix += "/";
	}

	for (const item of list) {
		const isString = typeof item === 'string';
		const obj: types.ExplorerEntry = isString ? { resource: item } : item;

		// if its a weapon with a path check if we need to make a folder node
		if(prefix.split("/")[1] === "weapons" && obj.resource.split("/").length > 1){
			//make weapon folder node
			const folderName = obj.resource.split("/")[0] + "/";
			if(!nodeSet.has(folderName)){
				nodes.push({
					isDirectory: true,
					type: types.ResourceType.weaponsfolder,
					resource: vscode.Uri.parse(`${types.URI_SCHEME}:///${prefix}${folderName}`, true),
					label: folderName.slice(0, -1),
				});
				nodeSet.add(folderName);
			}
			continue;
		}4

		nodes.push({
			isDirectory: type === types.ResourceType.folder,
			type: type,
			...obj,
			resource: vscode.Uri.parse(`${types.URI_SCHEME}:///${prefix}${obj.resource}`, true)
		});
	}

	return nodes;
}

export class ServerExplorer /* implements ServerExplorerProvider*/ {
	private serverExplorerRouter: ServerExplorerRouter;
	public serverExplorerView: ServerExplorerView;
	public fileSystem: ServerExplorerFileSystem;

	constructor(private readonly context: VSCodeContext) {
		this.serverExplorerRouter = new ServerExplorerRouter(context);
		this.serverExplorerView = new ServerExplorerView(context.vsContext, this.serverExplorerRouter);
		this.fileSystem = new ServerExplorerFileSystem(context, this.serverExplorerRouter);
	}
}
