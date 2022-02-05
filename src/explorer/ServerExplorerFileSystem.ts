import * as vscode from 'vscode';
import { VSCodeContext } from '../VSCodeContext';
import { splitWeaponScript } from '../utils';
import { URI_SCHEME } from './ServerExplorerView';

export class File implements vscode.FileStat {

    type: vscode.FileType;
    ctime: number;
    mtime: number;
    size: number;

    name: string;
    data?: Uint8Array;

    constructor(name: string) {
        this.type = vscode.FileType.File;
        this.ctime = Date.now();
        this.mtime = Date.now();
        this.size = 0;
        this.name = name;
    }
}

export class Directory implements vscode.FileStat {

    type: vscode.FileType;
    ctime: number;
    mtime: number;
    size: number;

    name: string;
    entries: Map<string, File | Directory>;

    constructor(name: string) {
        this.type = vscode.FileType.Directory;
        this.ctime = Date.now();
        this.mtime = Date.now();
        this.size = 0;
        this.name = name;
        this.entries = new Map();
    }
}

export type Entry = File | Directory;

export type PromiseFn<T> = (resolve: (value: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => boolean;

export interface PromiseData<T> {
	resolve(val: T | PromiseLike<T>): void
	reject(reason?: any): void
}

export class ServerExplorerFileSystem implements vscode.FileSystemProvider {
    promiseData: {[uri: string]: PromiseData<any>} = {};

    root = new Directory('');

    constructor(private readonly context: VSCodeContext)
    {
        context.vsContext.subscriptions.push(vscode.workspace.registerFileSystemProvider(URI_SCHEME, this, { isCaseSensitive: true }));
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
        let split = uri.path.split('/');
        let clsName = split[split.length - 1];

        return new File(clsName);
    }

    readFile(uri: vscode.Uri): Uint8Array | Thenable<Uint8Array> {
        console.log("readFile: ", uri);

        if (!this.context.rcInstance) {
            throw vscode.FileSystemError.Unavailable(uri);
        }

        const split = uri.path.split('/');
        if (split.length < 4) {
            throw vscode.FileSystemError.FileNotFound(uri);
        }

        const requestPath = split.slice(3).join("/");

        if (split[1] === "npcserver") {
            return this.createPromise(uri.path, (resolve, reject) => {
                switch (split[2].toLowerCase()) {
                    case "npcs": {
                        this.context.rcInstance?.nc?.requestNpcScript?.(requestPath);
                        return true;
                    }

                    case "scripts": {
                        this.context.rcInstance?.nc?.requestClass?.(requestPath);
                        return true;
                    }

                    case "weapons": {
                        this.context.rcInstance?.nc?.requestWeapon?.(requestPath);
                        return true;
                    }

                    default: {
                        reject(() => {
                            throw vscode.FileSystemError.FileNotFound(uri);
                        });
                        return false;
                    }
                }
            });
        } else {
            throw vscode.FileSystemError.Unavailable(uri);
        }
    }

    writeFile(uri: vscode.Uri, content: Uint8Array, options: { create: boolean; overwrite: boolean; }): void | Thenable<void> {
        console.log("writeFile: ", uri);

        if (!this.context.rcInstance) {
            throw vscode.FileSystemError.Unavailable(uri);
        }

        const split = uri.path.split('/');
        if (split.length < 4) {
            throw vscode.FileSystemError.FileNotFound(uri);
        }

        const requestPath = split.slice(3).join("/");

        if (split[1] === "npcserver")
        {
            switch (split[2].toLowerCase()) {
                case "npcs": {
                    this.context.rcInstance?.nc?.setNpcScript?.(requestPath, content.toString());
                    break;
                }

                case "scripts": {
                    this.context.rcInstance?.nc?.setClassScript?.(requestPath, content.toString());
                    break;
                }

                case "weapons": {
                    const [image, script] = splitWeaponScript(content.toString());
                    this.context.rcInstance?.nc?.setWeaponScript?.(requestPath, image, script);
                    break;
                }

                default: {
                    throw vscode.FileSystemError.FileNotFound();
                }
            }
            
            // this._fireSoon({ type: vscode.FileChangeType.Changed, uri });
        }
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

    createPromise<Type>(uri: string, fn: PromiseFn<Type>): Promise<Type> {
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