import { NPCPropID } from '@xtjoeytx/node-grc/dist/misc/npcs';
import * as vscode from 'vscode';
import { splitWeaponScript } from '../../utils';
import { createContextMenu } from '../ServerExplorer';
import * as types from '../types';

interface Params extends types.Params {
	type: string,
	name: string,
}

interface HandlerReq extends types.HandlerReq {
	params: Params
}

class ScriptRoute implements types.RouteController {
	statRequest(req: types.HandlerReq): Partial<vscode.FileStat> {
        console.log("Getfilestat called");

        const fileStat: Partial<vscode.FileStat> = {};

		if (req.resource.path.endsWith(".attrs")) {
			fileStat.permissions = vscode.FilePermission.Readonly;
		}
		
        return fileStat;
    }

	getChildren(req: types.HandlerReq): vscode.ProviderResult<types.GTreeNode[]> {
		if (!req.context.rcSession?.NpcControl) {
			return;
		}

		switch (req.params.type) {
			case "npcs": {
				const npcList = req.context.rcSession.NpcControl.npcs.map(n => n.getProp(NPCPropID.NPCPROP_NAME) as string);
				return createContextMenu(types.ResourceType.npcs, "npcserver/npcs/", npcList);
			}

			case "scripts": {
				return createContextMenu(types.ResourceType.scripts, "npcserver/scripts/", req.context.rcSession.NpcControl.classes);
			}

			case "weapons": {
				return req.context.rcSession.NpcControl.requestWeaponList()
					.then((v) => createContextMenu(types.ResourceType.weapons, "npcserver/weapons/", v));
			}

			default: {
				return;
			}
		}
	}

	headRequest(req: types.HandlerReq): void {
		console.log("[handleScriptRequest] matched request: ", req.params, req.resource);

		switch (req.resource.query) {
			case "open": {
				vscode.window.showTextDocument(req.resource, {
					preview: false,
				})
				.then((v) => vscode.languages.setTextDocumentLanguage(v.document, "csharp"));

				return;
			}
		}
	}

	getRequest(req: types.HandlerReq): vscode.ProviderResult<Buffer> {
		console.log("[handleScriptRequest] getRequestContent: ", req.params, req.resource);

		switch (req.params.type.toLowerCase()) {
			case "npcs": {
				if (req.resource.path.endsWith(".attrs")) {
					return req.context.rcSession?.NpcControl?.requestNpcAttributes?.(req.params.name.slice(0, -6)).then((v) => Buffer.from(v));
				} else if (req.resource.path.endsWith(".flags")) {
					return req.context.rcSession?.NpcControl?.requestNpcFlags?.(req.params.name.slice(0, -6)).then((v) => Buffer.from(v));
				} else {
					return req.context.rcSession?.NpcControl?.requestNpcScript?.(req.params.name).then((v) => Buffer.from(v));
				}
			}

			case "scripts": {
				return req.context.rcSession?.NpcControl?.requestClass?.(req.params.name).then((v) => Buffer.from(v));
			}

			case "weapons": {
				return req.context.rcSession?.NpcControl?.requestWeapon?.(req.params.name).then((v) => {
					const [image, script] = v;
					const adjustedScript = `//#IMAGE: ${image}\n\n` + script;
					return Buffer.from(adjustedScript);
				});
			}

			default: {
				return;
			}
		}
	}

	putRequest(req: HandlerReq, content: Uint8Array): void {
		switch (req.params.type.toLowerCase()) {
			case "npcs": {
				if (req.resource.path.endsWith(".attrs")) {
					// invalid
				} else if (req.resource.path.endsWith(".flags")) {
					req.context.rcSession?.NpcControl?.setNpcFlags?.(req.params.name.slice(0, -6), content.toString());
				} else {
					req.context.rcSession?.NpcControl?.setNpcScript?.(req.params.name, content.toString());
				}

				break;
			}

			case "scripts": {
				req.context.rcSession?.NpcControl?.setClassScript?.(req.params.name, content.toString());
				break;
			}

			case "weapons": {
				const [image, script] = splitWeaponScript(content.toString());
				req.context.rcSession?.NpcControl?.setWeaponScript?.(req.params.name, image, script);
				break;
			}

			default: {
				throw vscode.FileSystemError.FileNotFound(req.resource);
			}
		}
	}
}

export default new ScriptRoute;
