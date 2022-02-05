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
    statRequest(req: types.HandlerReq): Partial<vscode.FileStat> {
        console.log("Getfilestat called", req);
        
        const fileStat: Partial<vscode.FileStat> = {};

        if (req.params.name === UriConstants.NpcLevelList) {
            fileStat.permissions = vscode.FilePermission.Readonly;
        }

        return fileStat;
    }

    getChildren(req: types.HandlerReq): vscode.ProviderResult<types.GTreeNode[]> {
        const items = [];

        if (req.context.rcSession) {
            items.push({resource: UriConstants.FolderConfig, label: "Folder Configuration"});
            items.push({resource: UriConstants.ServerFlags, label: "Server Flags"});
            items.push({resource: UriConstants.ServerOptions, label: "Server Options"});

            if (req.context.rcSession.NpcControl) {
                items.push({resource: UriConstants.NpcLevelList, label: "NPC Level List"});
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
                // cant overwrite
                return;
            }
        }
    }

}

export default new ConfigIndexRoute;