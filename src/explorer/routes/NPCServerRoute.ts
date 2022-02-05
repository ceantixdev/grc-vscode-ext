import * as vscode from 'vscode';
import { createContextMenu } from '../ServerExplorer';
import * as types from '../types';

class NPCServerRoute implements types.RouteController {

	getChildren(req: types.HandlerReq): vscode.ProviderResult<types.GTreeNode[]> {
		return createContextMenu(types.ResourceType.folder, req.resource.path.slice(1), [
			{resource: "npcs", label: "NPCs", isDirectory: true, type: types.ResourceType.npcsfolder},
			{resource: "scripts", label: "Scripts"},
			{resource: "weapons", label: "Weapons"}
		]);
	}

	headRequest(req: types.HandlerReq) {
		console.log("[handle-npcserver] matched request: ", req.params, req.resource);
	}
}

export default new NPCServerRoute;
