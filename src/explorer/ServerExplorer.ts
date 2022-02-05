import { NPCPropID } from '@xtjoeytx/node-grc/dist/misc/npcs';
import { Router } from 'tiny-request-router';
import * as vscode from 'vscode';
import { VSCodeContext } from "../VSCodeContext";
import { ServerExplorerFileSystem } from './ServerExplorerFileSystem';
import ServerExplorerRouter from './ServerExplorerRouter';
import { ServerExplorerProvider, ServerExplorerView } from "./ServerExplorerView";
import * as types from './types';


export function createContextMenu(type: types.ResourceType, prefix: string, list: Iterable<types.ExplorerEntry | string>) {
	const nodes: types.GTreeNode[] = [];

	if (prefix && !prefix.endsWith("/")) {
		prefix += "/";
	}

	for (const item of list) {
		const isString = typeof item === 'string';
		const path = isString ? item : item.resource;
		const obj = isString ? {} : item;

		nodes.push({
			isDirectory: type === types.ResourceType.folder,
			...obj,
			resource: vscode.Uri.parse(`${types.URI_SCHEME}:///${prefix}${path}`, true),
			type: type,
		});
	}

	return nodes;
}


const test = {
	requestGServerConfig(config: string): void { },
	requestNpcScript(): void { }
};

export class ServerExplorer implements ServerExplorerProvider {
	private serverExplorerRouter: Router<types.RouteController>;
	public serverExplorerView: ServerExplorerView;
	public fileSystem: ServerExplorerFileSystem;

	constructor(private readonly context: VSCodeContext) {
		this.serverExplorerRouter = ServerExplorerRouter(test);
		this.serverExplorerView = new ServerExplorerView(context.vsContext, this);
		this.fileSystem = new ServerExplorerFileSystem(context, this);
	}

	/////////////////////////////

	getFileStat(resource: vscode.Uri): vscode.FileStat {
		const match = this.serverExplorerRouter.match("GET", resource.path);
		if (match?.handler.getFileStat) {
			const res = match?.handler.getFileStat({
				context: this.context,
				params: match.params,
				resource,
			});

			return res;
		}

		throw vscode.FileSystemError.FileNotFound(resource);

		// const fileStat: vscode.FileStat = {
		// 	type: vscode.FileType.File,
		// 	ctime: Date.now(),
		// 	mtime: Date.now(),
		// 	size: 0,
		// 	permissions: vscode.FilePermission.Readonly
		// };

		// return fileStat;
	}

	getChildrenNodes(resource: vscode.Uri): vscode.ProviderResult<types.GTreeNode[]> {
		const match = this.serverExplorerRouter.match("GET", resource.path);
		if (match?.handler.getChildren) {
			const res: vscode.ProviderResult<types.GTreeNode[]> = match.handler.getChildren({
				context: this.context,
				params: match.params,
				resource,
			});

			return res;
		}

		return [];
	}

	getResource(resource: vscode.Uri): void {
		if (resource.scheme !== types.URI_SCHEME) {
			return;
		}

		console.log("-------BEGIN GET RESOURCE--------");
		console.log("Received getResource: ", resource);

		const match = this.serverExplorerRouter.match("GET", resource.path);
		if (match) {
			match.handler.getRequest?.({
				context: this.context,
				params: match.params,
				resource,
			});

			console.log(`Successfully matched getResource req`, match);
		}
		else {
			console.log(`Did not match getResource req`);
		}

		console.log("-------END GET RESOURCE--------");
	}

	getResourceContent(resource: vscode.Uri): types.PromiseFn<Uint8Array> | undefined {
		console.log("-------BEGIN GET RESOURCE CONTENT --------");
		console.log("Received getResourceContent: ", resource);

		const match = this.serverExplorerRouter.match("GET", resource.path);
		if (match) {
			console.log(`Successfully matched getResourceContent req`, match);
			console.log("-------END GET RESOURCE CONTENT--------");
			return match.handler.getRequestContent?.({
				context: this.context,
				params: match.params,
				resource,
			});
		}

		console.log(`Did not match getResourceContent req`);
		console.log("-------END GET RESOURCE CONTENT--------");
		throw vscode.FileSystemError.FileNotFound(resource);
	}

	putRequestContent(resource: vscode.Uri, content: Uint8Array): boolean {
		console.log("-------BEGIN PUT RESOURCE CONTENT --------");
		console.log("Received putRequestContent: ", resource);

		const match = this.serverExplorerRouter.match("GET", resource.path);
		if (match) {
			match.handler.putRequestContent?.({
				context: this.context,
				params: match.params,
				resource,
			}, content);
			console.log("-------END PUT RESOURCE CONTENT--------");
			return true;
		}

		console.log(`Did not match getResourceContent req`);
		console.log("-------END PUT RESOURCE CONTENT--------");
		throw vscode.FileSystemError.FileNotFound(resource);
	}
}
