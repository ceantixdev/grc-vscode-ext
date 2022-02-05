import { RouteMatch, Router } from 'tiny-request-router';
import * as vscode from 'vscode';
import { VSCodeContext } from '../VSCodeContext';
import ConfigIndexRoute from './routes/ConfigRoute';
import FileBrowserRoute from './routes/FileBrowserRoute';
import GServerRoute from './routes/GServerRoute';
import indexRoute from './routes/IndexRoute';
import NPCServerRoute from './routes/NPCServerRoute';
import PlayersRoute from './routes/PlayersRoute';
import ScriptRoute from './routes/ScriptRoute';
import { ServerExplorerProvider } from "./ServerExplorerProvider";
import * as types from './types';

export class ServerExplorerRouter implements ServerExplorerProvider {
	private router: Router<types.RouteController>;

	constructor(private readonly context: VSCodeContext) {
		this.router = new Router<types.RouteController>();
		this.initializeRoutes();
	}

	public match(path: string): RouteMatch<types.RouteController> | null {
		return this.router.match("GET", path);
	}

	///////////////

	initializeRoutes() {
		this.router.get("/", indexRoute);
		this.router.get("/:controller(gserver)", GServerRoute);
		this.router.get("/:controller(gserver)/:category(config)/:name(.*)?", ConfigIndexRoute);
		this.router.get("/:controller(gserver)/:category(players)/(.*)", PlayersRoute);
		this.router.get("/:controller(gserver)/:category(filebrowser)/:path(.*)?", FileBrowserRoute);
	
		this.router.get("/:controller(npcserver)", NPCServerRoute);
		// this.router.get("/:controller(npcserver)/:type(npcs|scripts|weapons)/:name()", ScriptRoute);
		this.router.get("/:controller(npcserver)/:type(npcs|scripts|weapons)/:name(.*)?", ScriptRoute);
	}

	///////////////

	statRequest(resource: vscode.Uri): vscode.ProviderResult<types.PartialFileStat> {
		const match = this.router.match("GET", resource.path);
		if (match?.handler.statRequest) {
			const res = match?.handler.statRequest({
				context: this.context,
				params: match.params,
				resource,
			});

			return res;
		}

		return {};
		// throw vscode.FileSystemError.FileNotFound(resource);
	}

	getChildren(resource: vscode.Uri): vscode.ProviderResult<types.GTreeNode[]> {
		const match = this.router.match("GET", resource.path);
		if (match?.handler.getChildren) {
			return match.handler.getChildren({
				context: this.context,
				params: match.params,
				resource,
			});
		}

		return [];
	}

	headRequest(resource: vscode.Uri): void {
		if (resource.scheme !== types.URI_SCHEME) {
			return;
		}

		console.log("-------BEGIN GET RESOURCE--------");
		console.log("Received getResource: ", resource);

		const match = this.router.match("GET", resource.path);
		if (match?.handler.headRequest) {
			match.handler.headRequest({
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

	getRequest(resource: vscode.Uri): vscode.ProviderResult<Buffer> {
		console.log("-------BEGIN GET RESOURCE CONTENT --------");
		console.log("Received getResourceContent: ", resource);

		const match = this.router.match("GET", resource.path);
		if (match?.handler.getRequest) {
			console.log(`Successfully matched getResourceContent req`, match);
			console.log("-------END GET RESOURCE CONTENT--------");
			return match.handler.getRequest({
				context: this.context,
				params: match.params,
				resource,
			});
		}

		console.log(`Did not match getResourceContent req`);
		console.log("-------END GET RESOURCE CONTENT--------");
		throw vscode.FileSystemError.FileNotFound(resource);
	}

	putRequest(resource: vscode.Uri, content: Uint8Array): boolean {
		console.log("-------BEGIN PUT RESOURCE CONTENT --------");
		console.log("Received putRequestContent: ", resource);

		const match = this.router.match("GET", resource.path);
		if (match?.handler.putRequest) {
			match.handler.putRequest({
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