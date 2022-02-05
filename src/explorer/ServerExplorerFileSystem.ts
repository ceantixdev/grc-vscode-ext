import * as vscode from 'vscode';
import { VSCodeContext } from '../VSCodeContext';
import { ServerExplorerProvider } from "./ServerExplorerProvider";
import * as types from './types';

export class ServerExplorerFileSystem implements vscode.FileSystemProvider {
    constructor(private readonly context: VSCodeContext, private readonly provider: ServerExplorerProvider)  {
        context.vsContext.subscriptions.push(vscode.workspace.registerFileSystemProvider(types.URI_SCHEME, this, { isCaseSensitive: true }));
    }

    // --- manage file events
    private _emitter = new vscode.EventEmitter<vscode.FileChangeEvent[]>();

    readonly onDidChangeFile: vscode.Event<vscode.FileChangeEvent[]> = this._emitter.event;

    // private _bufferedEvents: vscode.FileChangeEvent[] = [];
    // private _fireSoonHandle?: NodeJS.Timer;

    // private _fireSoon(...events: vscode.FileChangeEvent[]): void {
    //     this._bufferedEvents.push(...events);

    //     if (this._fireSoonHandle) {
    //         clearTimeout(this._fireSoonHandle);
    //     }

    //     this._fireSoonHandle = setTimeout(() => {
    //         this._emitter.fire(this._bufferedEvents);
    //         this._bufferedEvents.length = 0;
    //     }, 5);
    // }
    
    watch(_resource: vscode.Uri): vscode.Disposable {
        // ignore, fires for all changes...
        return new vscode.Disposable(() => { });
    }
   
    stat(uri: vscode.Uri): vscode.FileStat | Thenable<vscode.FileStat> {
        let fileStat: vscode.FileStat = {
            type: vscode.FileType.File,
            ctime: Date.now(),
            mtime: Date.now(),
            size: 0
        };

        console.log(`Queried for ${uri}: ${uri.path}`, uri);

        if (uri.path.endsWith(".attrs")) {
            fileStat.permissions = vscode.FilePermission.Readonly;
        }
        
        if (uri.path.endsWith("npclevellist")) {
            fileStat.permissions = vscode.FilePermission.Readonly;
        }

        return fileStat;
    }

    readFile(uri: vscode.Uri): Uint8Array | Thenable<Uint8Array> {
        console.log("readFile: ", uri);

        if (!this.context.rcSession) {
            throw vscode.FileSystemError.Unavailable(uri);
        }

        const result = this.provider.getRequest(uri);

        return Promise.resolve(result).then((v) => {
            if (v) {
                return v;
            }

            throw vscode.FileSystemError.FileNotFound(uri);
        });
    }

    writeFile(uri: vscode.Uri, content: Uint8Array, options: { create: boolean; overwrite: boolean; }): void | Thenable<void> {
        console.log("writeFile: ", uri);

        if (!this.context.rcSession) {
            throw vscode.FileSystemError.Unavailable(uri);
        }

        const result = this.provider.putRequest(uri, content);
        if (!result) {
            throw vscode.FileSystemError.FileNotFound(uri);
        }

        // this._fireSoon({ type: vscode.FileChangeType.Changed, uri });
    }
    
    ////////////////////////////

    readDirectory(uri: vscode.Uri): [string, vscode.FileType][] | Thenable<[string, vscode.FileType][]> {
        console.log("readDirectory", uri);
        throw new Error('Method not implemented.');
    }
    createDirectory(uri: vscode.Uri): void | Thenable<void> {
        console.log("createDirectory", uri);
        throw new Error('Method not implemented.');
    }
    delete(uri: vscode.Uri, options: { recursive: boolean; }): void | Thenable<void> {
        console.log("delete", uri);
        throw new Error('Method not implemented.');
    }
    rename(oldUri: vscode.Uri, newUri: vscode.Uri, options: { overwrite: boolean; }): void | Thenable<void> {
        console.log("rename", oldUri, "to", newUri);
        throw new Error('Method not implemented.');
    }
}