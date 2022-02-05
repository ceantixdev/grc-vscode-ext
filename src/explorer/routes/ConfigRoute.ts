import * as vscode from 'vscode';
import { createContextMenu } from '../ServerExplorer';
import * as types from '../types';

enum UriConstants {
    FolderConfig = "folderconfig",
    ServerFlags = "serverflags",
    ServerOptions = "serveroptions",
    NpcLevelList = "npclevellist"
}

class ConfigIndexRoute implements types.RouteController {
    getFileStat(req: types.HandlerReq): vscode.FileStat {
        console.log("Getfilestat called");

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

        const items = [];

        if (req.context.rcSession) {
            items.push({resource: UriConstants.FolderConfig, label: "Folder Configuration"});
            items.push({resource: UriConstants.ServerFlags, label: "Server Flags"});
            items.push({resource: UriConstants.ServerOptions, label: "Server Options"});

            if (req.context.rcSession.NpcControl) {
                items.push({resource: UriConstants.NpcLevelList, label: "NPC LevelList"});
            }
        }

        return createContextMenu(types.ResourceType.file, req.resource.path.slice(1), items);
    }

    headRequest(req: types.HandlerReq): void {
        switch (req.resource.query) {
            case "open": {
                vscode.window.showTextDocument(req.resource, {
                    preview: false
                });
                return;
            }
        }
    }
    
    getRequest(req: types.HandlerReq): vscode.ProviderResult<Buffer> {        
        switch (req.params.name) {
            case UriConstants.FolderConfig: {
                return req.context.rcSession?.requestFolderConfig?.().then((v) => Buffer.from(v));
            }

            case UriConstants.ServerFlags: {
                return req.context.rcSession?.requestServerFlags?.().then((v) => Buffer.from(v));
            }

            case UriConstants.ServerOptions: {
                return req.context.rcSession?.requestServerOptions?.().then((v) => Buffer.from(v));
            }

            case UriConstants.NpcLevelList: {
                return req.context.rcSession?.NpcControl?.requestLevelList().then((v) => Buffer.from(v));
            }

            default: {
                return;
            }
        }
    }

    putRequest(req: types.HandlerReq, content: Uint8Array): void {
		switch (req.params.name) {
            case UriConstants.FolderConfig: {
                return req.context.rcSession?.setFolderConfig?.(content.toString());
            }

            case UriConstants.ServerFlags: {
                return req.context.rcSession?.setServerFlags?.(content.toString());
            }

            case UriConstants.ServerOptions: {
                return req.context.rcSession?.setServerOptions?.(content.toString());
            }

            case UriConstants.NpcLevelList: {
                return req.context.rcSession?.NpcControl?.updateLevelList(content.toString());
            }
        }
    }

}

export default new ConfigIndexRoute;