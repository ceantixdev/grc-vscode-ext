import * as vscode from 'vscode';
import { createContextMenu } from '../ServerExplorer';
import * as types from '../types';

class GServerRouter implements types.RouteController {

	getChildren(req: types.HandlerReq): vscode.ProviderResult<types.GTreeNode[]> {
		return createContextMenu(types.ResourceType.folder, req.resource.path.slice(1), [
			{resource: "config", label: "Config"},
			{resource: "players", label: "Players"},
			{resource: "filebrowser", label: "Filebrowser"}
		]);
	}

	headRequest(req: types.HandlerReq) {
		console.log("[handle-gserver] matched request: ", req.params, req.resource);
	}
}

export default new GServerRouter;
