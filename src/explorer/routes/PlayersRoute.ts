import * as vscode from 'vscode';
import { createContextMenu } from '../ServerExplorer';
import * as types from '../types';

class PlayersRoute implements types.RouteController {
	public headRequest(req: types.HandlerReq) {
		console.log("[handlePlayerRequest] matched request: ", req.params, req.resource);
	};

	// getChildren(req: types.HandlerReq): vscode.ProviderResult<types.GTreeNode[]> {
    //     return createContextMenu(types.ResourceType.folder, req.resource.path.slice(1), [
    //         {resource: "gserver", label: "GServer"},
    //         {resource: "npcserver", label: "NPC-Server"},
    //     ]);
    // }
}

export default new PlayersRoute;