import * as vscode from 'vscode';
import { splitWeaponScript } from '../../utils';
import * as types from '../types';

interface Params extends types.Params {
    type: string,
    name: string,
}

interface HandlerReq extends types.HandlerReq {
    params: Params
}

class ScriptRoute implements types.RouteController {
    getRequest(req: types.HandlerReq): void {
        console.log("[handleScriptRequest] matched request: ", req.params, req.resource);
        console.log("Script type: ", req.params.type);
        console.log("Script name: ", req.params.name);

        switch (req.resource.query) {
            case "open": {
				// vscode.workspace.openTextDocument({ language: "php", content: "test"}).then(doc => {
				// 	doc.uri
				// 	vscode.window.showTextDocument(doc).then(e => {
				// 		e.document.fileName
				// 	})
				// });

                vscode.window.showTextDocument(req.resource, {
                    preview: false,
				});
				
				return;
            }
        }
    }

    getRequestContent(req: types.HandlerReq): types.PromiseFn<Uint8Array> | undefined {
        console.log("[handleScriptRequest] getRequestContent: ", req.params, req.resource);
        
        return (resolve, reject) => {
			switch (req.params.type.toLowerCase()) {
				case "npcs": {
					if (req.resource.path.endsWith(".attrs")) {
						req.context.rcSession?.nc?.requestNpcAttributes?.(req.params.name.slice(0, -6));
					} else if (req.resource.path.endsWith(".flags")) {
						req.context.rcSession?.nc?.requestNpcFlags?.(req.params.name.slice(0, -6));
					} else {
						req.context.rcSession?.nc?.requestNpcScript?.(req.params.name);
					}
					return true;
				}

				case "scripts": {
					req.context.rcSession?.nc?.requestClass?.(req.params.name);
					return true;
				}

				case "weapons": {
					req.context.rcSession?.nc?.requestWeapon?.(req.params.name);
					return true;
				}

				default: {
					reject(() => {
						throw vscode.FileSystemError.FileNotFound(req.resource);
					});
					return false;
				}
			}
		};
    }

	putRequestContent(req: HandlerReq, content: Uint8Array): void
	{
		console.log(req);

		const split = req.resource.path.split('/');
        if (split.length < 4) {
            throw vscode.FileSystemError.FileNotFound(req.resource);
        }

        const requestPath = split.slice(3).join("/");
        if (split[1] === "npcserver")
        {
            switch (split[2].toLowerCase()) {
                case "npcs": {
                    req.context.rcSession?.nc?.setNpcScript?.(requestPath, content.toString());
                    break;
                }

                case "scripts": {
                    req.context.rcSession?.nc?.setClassScript?.(requestPath, content.toString());
                    break;
                }

                case "weapons": {
                    const [image, script] = splitWeaponScript(content.toString());
                    req.context.rcSession?.nc?.setWeaponScript?.(requestPath, image, script);
                    break;
                }

                default: {
                    throw vscode.FileSystemError.FileNotFound();
                }
            }
		}

		console.log("[putRequestContent] ", req.params, req.resource);
        console.log(content);
	}
}

export default new ScriptRoute;
