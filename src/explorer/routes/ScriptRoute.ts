import { NPCPropID } from '@ceantixdev/node-grc/dist/misc/npcs';
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

let weaponListPromise: Promise<Iterable<types.ExplorerEntry | string>> | null = null;

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
                // 1. Get prefix from the resource path
                let prefix = req.resource.path;

                // Sanitize the prefix
                if (prefix.startsWith("/")) {
                    prefix = prefix.substring(1);
                }
                
                // This handles clicks on the root of your provider
                if (prefix === "" || prefix === "npcserver/weapons") {
                    prefix = "npcserver/weapons"; 
                }

                if (!prefix.endsWith("/")) {
                    prefix += "/"; // "npcserver/weapons/"
                }

                const rootPrefix = "npcserver/weapons/";

                // 2. Get the master weapon list (from cache or fetch it once)
                if (!weaponListPromise) {
                    
                    weaponListPromise = req.context.rcSession.NpcControl.requestWeaponList()
                        .catch(err => {
                            console.error("[Weapons Cache] Fetch failed, resetting cache:", err);
                            weaponListPromise = null;
                            throw err; 
                        });
                }

                // 3. Use the cached promise
                return weaponListPromise.then(masterList => {
                    let subfolder = "";

                    // This logic now works because 'prefix' is correct
                    if (prefix.length > rootPrefix.length) {
                        subfolder = prefix.substring(rootPrefix.length); // e.g., "-Player/"
                    }

                    let filteredList: (types.ExplorerEntry | string)[] = [];

                    if (subfolder === "") {
                        // Root request, use full list
                        filteredList = [...masterList];
                    } else {
                        // Subfolder request, filter the list
                        for (const item of masterList) {
                            const resourceName = typeof item === 'string' ? item : item.resource;
                            
                            if (resourceName.startsWith(subfolder)) {
                                const newItemName = resourceName.substring(subfolder.length);
                                if (newItemName.length === 0) continue; 

                                if (typeof item === 'string') {
                                    filteredList.push(newItemName);
                                } else {
                                    filteredList.push({ ...item, resource: newItemName });
                                }
                            }
                        }
                    }
                    
                    // 4. Create nodes
                    // This now passes the correct prefix and the correctly filtered list
                    return createContextMenu(types.ResourceType.weapons, prefix, filteredList);
                });
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
