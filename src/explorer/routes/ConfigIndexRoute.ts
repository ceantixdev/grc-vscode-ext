import * as vscode from 'vscode';
import { createContextMenu } from '../ServerExplorer';
import * as types from '../types';

class ConfigIndexRoute implements types.RouteController {
    getFileStat(req: types.HandlerReq): vscode.FileStat {
        let fileStat: vscode.FileStat = {
            type: vscode.FileType.File,
            ctime: Date.now(),
            mtime: Date.now(),
            size: 0
        };

        if (req.resource.path.endsWith("folderconfig")) {
            fileStat.permissions = vscode.FilePermission.Readonly;
        }

        return fileStat;
    }

    getChildren(req: types.HandlerReq): vscode.ProviderResult<types.GTreeNode[]> {
        console.log("[ConfigIndexRoute] list request: ", req.params, req.resource);
        return createContextMenu(types.ResourceType.file, req.resource.path.slice(1), [
            {resource: "folderconfig", label: "Folder Configuration"},
            {resource: "serverflags", label: "Server Flags"},
            {resource: "serveroptions", label: "Server Options"},
        ]);
    }

    getRequest(req: types.HandlerReq): void {
        console.log("[ConfigIndexRoute] matched request: ", req.params, req.resource);
        
        switch (req.resource.query) {
            case "open": {
                vscode.window.showTextDocument(req.resource, {
                    preview: false,
                });
                return;
            }
        }
    }
    
    getRequestContent(req: types.HandlerReq): types.PromiseFn<Uint8Array> | undefined {
        console.log("[ConfigIndexRoute] getRequestContent: ", req.params, req.resource);
        
        return (resolve, reject) => {
            switch (req.params.name) {
				case "folderconfig": {
					req.context.rcSession?.requestFolderConfig?.();
					return true;
				}

				case "serverflags": {
					req.context.rcSession?.requestServerFlags?.();
					return true;
				}

				case "serveroptions": {
                    req.context.rcSession?.requestServerOptions?.();
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
}

export default new ConfigIndexRoute;