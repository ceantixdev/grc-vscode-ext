import { Router } from 'tiny-request-router';
import * as types from './types';
import * as vscode from 'vscode';
import handleScriptRequest from './routes/ScriptRoute';
import indexRoute from './routes/IndexRoute';
import ConfigIndexRoute from './routes/ConfigIndexRoute';

import { createContextMenu } from './ServerExplorer';
import { NPCPropID } from '@xtjoeytx/node-grc/dist/misc/npcs';

interface SomeInf {
	requestGServerConfig(config: string): void

	requestNpcScript(): void
}

function getNpcList(context: types.Context) : types.GTreeNode[] {
	const npcs = context.rcSession?.nc?.npcs;
	if (!npcs) {
		return [];
	}

	const npcList = npcs.map(n => n.getProp(NPCPropID.NPCPROP_NAME) as string);
	return createContextMenu(types.ResourceType.npcs, "npcserver/npcs/", npcList);
}

function getScriptList(context: types.Context) : types.GTreeNode[] {
	const classes = context.rcSession?.nc?.classes;
	return createContextMenu(types.ResourceType.scripts, "npcserver/scripts/", classes || []);
}

function getWeaponList(context: types.Context) : types.GTreeNode[] {
	const weapons = context.rcSession?.nc?.weapons;
	return createContextMenu(types.ResourceType.weapons, "npcserver/weapons/", weapons || []);
}

function setupRouter(contract: SomeInf) {

	const router = new Router<types.RouteController>();

	const handleGetConfig = {
		getRequest: (req: types.HandlerReq) => {
			console.log("[handleGetConfig] matched request: ", req.params, req.resource);
		},

		getRequestContent: (req: types.HandlerReq) => {
			return undefined;
		}
	};

	const handlePlayerRequest = {
		getRequest: (req: types.HandlerReq) => {
			console.log("[handlePlayerRequest] matched request: ", req.params, req.resource);
		}
	};

	const handleBrowserRequest = {
		getRequest: (req: types.HandlerReq) => {
			console.log("[handleBrowserRequest] matched request: ", req.params, req.resource);
		}
	};

	const handleGserver = {
		getChildren: (req: types.HandlerReq): vscode.ProviderResult<types.GTreeNode[]> => {
			return createContextMenu(types.ResourceType.folder, req.resource.path.slice(1), [
				{resource: "config", label: "Config"},
				{resource: "players", label: "Players"},
				{resource: "filebrowser", label: "Filebrowser"}
			]);
		},

		getRequest: (req: types.HandlerReq) => {
			console.log("[handle-gserver] matched request: ", req.params, req.resource);
		},
	};

	const handleNpcserver = {
		getChildren: (req: types.HandlerReq): vscode.ProviderResult<types.GTreeNode[]> => {
			return createContextMenu(types.ResourceType.folder, req.resource.path.slice(1), [
				{resource: "npcs", label: "NPCs"},
				{resource: "scripts", label: "Scripts"},
				{resource: "weapons", label: "Weapons"}
			]);
		},
	};

	const handleScriptListing = {
		getChildren: (req: types.HandlerReq): vscode.ProviderResult<types.GTreeNode[]> => {
			switch (req.params.type) {
				case "npcs": return getNpcList(req.context);
				case "weapons": return getWeaponList(req.context);
				case "scripts": return getScriptList(req.context);
				default:
					return;
			}
		}
	};

	router.get("/", indexRoute);
	router.get("/:controller(gserver)", handleGserver);
	// router.get("/:controller(gserver)/:category(config)", ConfigIndexRoute);
	router.get("/:controller(gserver)/:category(config)/:name?", ConfigIndexRoute);
	router.get("/:controller(gserver)/:category(players)/(.*)", handlePlayerRequest);
	router.get("/:controller(gserver)/:category(filebrowser)/(.*)", handleBrowserRequest);

	router.get("/:controller(npcserver)", handleNpcserver);
	router.get("/:controller(npcserver)/:type(npcs|scripts|weapons)", handleScriptListing);
	router.get("/:controller(npcserver)/:type(npcs|scripts|weapons)/:name*", handleScriptRequest);
	return router;
}

export default setupRouter;