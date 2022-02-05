import * as vscode from 'vscode';
import { VSCodeContext } from '../VSCodeContext';
import { splitWeaponScript } from '../utils';
import { ServerExplorerProvider } from './ServerExplorerView';
import * as types from './types';

export interface PromiseData<T> {
	resolve(val: T | PromiseLike<T>): void
	reject(reason?: any): void
}

export class ServerExplorerFileSystem implements vscode.FileSystemProvider {
    promiseData: {[uri: string]: PromiseData<any>} = {};

    constructor(private readonly context: VSCodeContext, private readonly provider: ServerExplorerProvider)  {
        context.vsContext.subscriptions.push(vscode.workspace.registerFileSystemProvider(types.URI_SCHEME, this, { isCaseSensitive: true }));
    }

    // --- manage file events
    private _emitter = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
    private _bufferedEvents: vscode.FileChangeEvent[] = [];
    private _fireSoonHandle?: NodeJS.Timer;

    readonly onDidChangeFile: vscode.Event<vscode.FileChangeEvent[]> = this._emitter.event;

    private _fireSoon(...events: vscode.FileChangeEvent[]): void {
        this._bufferedEvents.push(...events);

        if (this._fireSoonHandle) {
            clearTimeout(this._fireSoonHandle);
        }

        this._fireSoonHandle = setTimeout(() => {
            this._emitter.fire(this._bufferedEvents);
            this._bufferedEvents.length = 0;
        }, 5);
    }
    
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

        if (uri.path.endsWith(".attrs")) {
            fileStat.permissions = vscode.FilePermission.Readonly;
        }

        return fileStat;
    }

    readFile(uri: vscode.Uri): Uint8Array | Thenable<Uint8Array> {
        console.log("readFile: ", uri);

        if (!this.context.rcSession) {
            throw vscode.FileSystemError.Unavailable(uri);
        }

        const result = this.provider.getResourceContent(uri);
        if (!result) {
            throw vscode.FileSystemError.FileNotFound(uri);
        }

        return this.createPromise(uri.path, result);
    }

    writeFile(uri: vscode.Uri, content: Uint8Array, options: { create: boolean; overwrite: boolean; }): void | Thenable<void> {
        console.log("writeFile: ", uri);

        if (!this.context.rcSession) {
            throw vscode.FileSystemError.Unavailable(uri);
        }

        const result = this.provider.putRequestContent(uri, content);
        if (!result) {
            throw vscode.FileSystemError.FileNotFound(uri);
        }

        // const split = uri.path.split('/');
        // if (split.length < 4) {
        //     throw vscode.FileSystemError.FileNotFound(uri);
        // }

        // const requestPath = split.slice(3).join("/");
        // if (split[1] === "npcserver")
        // {
        //     switch (split[2].toLowerCase()) {
        //         case "npcs": {
        //             this.context.rcSession?.nc?.setNpcScript?.(requestPath, content.toString());
        //             break;
        //         }

        //         case "scripts": {
        //             this.context.rcSession?.nc?.setClassScript?.(requestPath, content.toString());
        //             break;
        //         }

        //         case "weapons": {
        //             const [image, script] = splitWeaponScript(content.toString());
        //             this.context.rcSession?.nc?.setWeaponScript?.(requestPath, image, script);
        //             break;
        //         }

        //         default: {
        //             throw vscode.FileSystemError.FileNotFound();
        //         }
        //     }
            
            // this._fireSoon({ type: vscode.FileChangeType.Changed, uri });
        // }
    }
    
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

    ////////////////////////////

    createPromise<Type>(uri: string, fn: types.PromiseFn<Type>): Promise<Type> {
        return new Promise<Type>((resolve, reject) => {
            if (fn(resolve, reject)) {
                this.promiseData[uri] = {
                    resolve: resolve,
                    reject: reject
                };
            }
        });
    }

    resolvePromise(uri: string, data: string): void {
        if (uri in this.promiseData) {
            this.promiseData[uri].resolve(Buffer.from(data));
            delete this.promiseData[uri];
        }
    }

    rejectPromise(uri: string): void {
        if (uri in this.promiseData) {
            this.promiseData[uri].reject();
            delete this.promiseData[uri];
        }
    }
}