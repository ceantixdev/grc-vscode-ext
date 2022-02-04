import * as vscode from 'vscode';
import * as types from '../types';
import * as grc from '@xtjoeytx/node-grc';
import { createContextMenu } from '../ServerExplorer';

import * as fs from 'fs';
import * as path from 'path';

interface Params extends types.Params {
    type: string,
    name: string,
    path: string
}

interface HandlerReq extends types.HandlerReq {
    params: Params
}

const textEditorExtensions: readonly string[] = [".txt", ".nw", ".gani", ".json"];

class FileBrowserRoute implements types.RouteController {
    getChildren(req: HandlerReq): vscode.ProviderResult<types.GTreeNode[]> {
        if (!req.context.rcSession) {
            return;
        }

        req.params.path = req.params.path || "";

        return new Promise((resolve, reject) => {
            req.context.rcSession?.FileBrowser.cd(req.params.path).then((res: grc.DirectoryListing) => {
                const items: types.ExplorerEntry[] = [];

                for (const item of res.fileList) {
                    items.push({
                        resource: item.name,
                        label: item.name,
                        isDirectory: item.type === grc.FSEntryType.Directory
                    });
                }

                resolve(createContextMenu(types.ResourceType.folder, req.resource.path.slice(1), items));
            });

            setTimeout(() => {
                reject("Timed out");
            }, 5000);
        });
    }

	headRequest(req: HandlerReq) {
		console.log("[handleBrowserRequest] matched request: ", req.params, req.resource);

        switch (req.resource.query) {
            case "open": {
                // Text-based files
                const ext = path.extname(req.params.path);

                if (textEditorExtensions.indexOf(ext) >= 0) {
                    vscode.window.showTextDocument(req.resource, {
                        preview: true,
                    });

                    return;
                }

                // Save-as dialog
                const basename = path.basename(req.params.path);
                const saveUri = vscode.Uri.joinPath(vscode.Uri.parse(req.context.config.saveDir), basename);

                const saveFileFn = (saveAsUri: vscode.Uri) => {
                    Promise.resolve(this.getRequest(req)).then(content => {
                        if (content) {
                            fs.writeFileSync(saveAsUri.path, content);
                            vscode.commands.executeCommand('vscode.open', saveAsUri);
                            vscode.window.showInformationMessage(`Saved ${basename} to ${saveAsUri}`);
                        }
                    }).catch(v => vscode.window.showErrorMessage(v));
                };

                if (req.context.config.saveDir && !fs.existsSync(saveUri.path)) {
                    saveFileFn(saveUri);
                }
                else
                {
                    vscode.window.showSaveDialog({
                        defaultUri: saveUri
                    }).then((saveResourceUri: vscode.Uri | undefined) => {
                        if (saveResourceUri) {
                            saveFileFn(saveResourceUri);
                        }
                    });
                }
            }
        }
	}

    getRequest(req: HandlerReq): vscode.ProviderResult<Buffer> {
        console.log("[handleBrowserRequest] getRequestContent: ", req.params, req.resource);
        
        const directoryPath = path.dirname(req.params.path);
        const baseName = path.basename(req.params.path);

        return req.context.rcSession?.FileBrowser.cd(directoryPath).then(v => {
            return req.context.rcSession?.FileBrowser.get(baseName);
        });
    }

	putRequest?(req: HandlerReq, content: Uint8Array): void
    {
        const ext = path.extname(req.params.path);
        
        if (textEditorExtensions.indexOf(ext) >= 0) {
            const directoryPath = path.dirname(req.params.path);
            const baseName = path.basename(req.params.path);
    
            req.context.rcSession?.FileBrowser.cd(directoryPath).then(v => {
                req.context.rcSession?.FileBrowser.put(baseName, Buffer.from(content));
            });
        }
    }
}

export default new FileBrowserRoute;
