import { Router } from 'tiny-request-router';
import * as grc from '@xtjoeytx/node-grc';
import * as vscode from 'vscode';
import { ServerExplorerFileSystem } from './ServerExplorerFileSystem';
import ServerExplorerRouter from './ServerExplorerRouter';
import { GTreeNode, ResourceType, ServerExplorerProvider, ServerExplorerView, URI_SCHEME } from "./ServerExplorerView";
import { VSCodeContext } from "../VSCodeContext";
import { NPCPropID } from '@xtjoeytx/node-grc/dist/misc/npcs';

function getUrlSchemeForResource(type: ResourceType) {
	switch (type) {
		case ResourceType.npcs: return "NPCS";
		case ResourceType.scripts: return "Scripts";
		case ResourceType.weapons: return "Weapons";

		default:
			throw new Error('Invalid url scheme');
	}
}

function createContextMenu(type: ResourceType, list: Iterable<string>) {
	const res: GTreeNode[] = [];
	
	for (const item of list) {
		res.push({
			resource: vscode.Uri.parse(`${URI_SCHEME}:///npcserver/${getUrlSchemeForResource(type)}/${item}`, true),
			type: type,
			isDirectory: false,
		});
	}

	return res;
}

function getNpcList(context: VSCodeContext) : GTreeNode[] {
	const npcs = context.rcInstance?.nc?.npcs;
	if (!npcs) {
		return [];
	}

	const npcList = npcs.map(n => n.getProp(NPCPropID.NPCPROP_NAME) as string);
	return createContextMenu(ResourceType.npcs, npcList);
}

function getScriptList(context: VSCodeContext) : GTreeNode[] {
	const classes = context.rcInstance?.nc?.classes;
	return createContextMenu(ResourceType.scripts, classes || []);
}

function getWeaponList(context: VSCodeContext) : GTreeNode[] {
	const weapons = context.rcInstance?.nc?.weapons;
	return createContextMenu(ResourceType.weapons, weapons || []);
}

const test = {
	requestGServerConfig(config: string): void {},
	requestNpcScript(): void {}
};

export class ServerExplorerContext implements ServerExplorerProvider {
	private serverExplorerRouter: Router;
	public serverExplorerView: ServerExplorerView;
	public fileSystem: ServerExplorerFileSystem;

	constructor(private readonly context: VSCodeContext) {
		this.serverExplorerRouter = ServerExplorerRouter(test);
		this.serverExplorerView = new ServerExplorerView(context.vsContext, this);
		this.fileSystem = new ServerExplorerFileSystem(context);
	}

	public get roots(): GTreeNode[] {
		return ServerExplorerView.getDefaultRootNodes();
	}
	
	public getChildren(node: GTreeNode): GTreeNode[] {
		const vsuri = node.resource;

		console.log(vsuri);

		const dirList = vsuri.path.split('/').filter(v => v);
		console.log(dirList);

		if (dirList[0] === "gserver") {
			// Forward to gserver controller
			// GServerController->getChildren($dirlist)

		}
		else if (dirList[0] === "npcserver") {
			// Forward to NPC-Server controller
		}
		else
		{
			// Unknown
		}
		
		if (dirList[0] === "gserver") {
			if (dirList.length > 0) {
				switch (dirList[1]) {
					case "config": {
						// display options: server flags, server options, folder config
						break;
					}
					case "players": {
						// return player list
						break;
					}
					case "filebrowser": {
						// return root of ftp
						break;
					}
				}
			}

			console.log("gserver req");
		} else if (dirList[0] === "npcserver") {

			if (dirList.length > 1 && dirList[1].length > 0) {
				console.log("Dir list: ", dirList);
				switch (dirList[1]) {
					case "NPCS": {
						return getNpcList(this.context);
					}

					case "Scripts": {
						return getScriptList(this.context);
					}

					case "Weapons": {
						return getWeaponList(this.context);
					}
				}
			}
			
			console.log("nc req");
		}
		else
		{
			console.log(`Unknown dir list: ${dirList[0]}`);
		}
		
		
		console.log(`Get children for ${node.resource}`);
		console.log(node.resource);
		return node.children || [];
	}

	// public getContent(resource: vscode.Uri): string {
	// 	const match = this.serverExplorerRouter.match("GET", resource.path);
	// 	if (match) {
	// 		match.handler(match.params);
		
	// 		console.log(`Successfully matched getContent req`, match);
	// 	}
	// 	else {
	// 		console.log(`Did not match getContent req`);
	// 	}

	// 	console.log(`Get content for ${resource}`);
	// 	return "nada for " + resource.toString();
	// }
	
	public requestContent(resource: vscode.Uri): void {
		if (resource.scheme !== URI_SCHEME) {
			return;
		}

		// Validate URI
		const regex = /(?<Controller>npcserver|gserver)\/(?<Type>[^\/]+)\/(?<Path>.*)/;
		const m = resource.path.match(regex);
		if (!m) {
			return;
		}

		// switch (m.groups?.["Controller"])
		// {
		// 	case "npcserver": {

		// 		break;
		// 	}
		// }
		
		// console.log(m);

		// Validate the path against the correct controller
		

		// Validate if the uri path is valid, and leads to a document
		console.log(`Called openResource for ${resource}`);
		vscode.window.showTextDocument(resource, {
			preview: false,
		});
	}

	getChildrenNodes(resource: vscode.Uri): GTreeNode[] {
		throw new Error('Method not implemented.');
	}

	getResource(resource: vscode.Uri): void {
		console.log("-------BEGIN GET RESOURCE--------");
		console.log("getResource called with ", resource);

		const match = this.serverExplorerRouter.match("GET", resource.path);
		if (match) {
			match.handler(match.params);
			console.log(`Successfully matched getResource req`, match);
		}
		else {
			console.log(`Did not match getResource req`);
		}

		console.log("-------END GET RESOURCE--------");
	}

	getResourceContent(resource: vscode.Uri): string {
		throw new Error('Method not implemented.');
	}
}