import * as vscode from 'vscode';
import * as router from 'tiny-request-router';
import { VSCodeContext } from '../VSCodeContext';

export const URI_SCHEME = "grc";

export type Params = router.Params;
export type Context = VSCodeContext;

export type PromiseFn<T> = (resolve: (value: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => boolean;

export interface HandlerReq {
	context: Context,
	resource: vscode.Uri,
	params: Params
}

export type HandlerFn = (req: HandlerReq) => void;

export enum ResourceType {
	file = 0,
	folder = 1,
	npcs = 2,
	scripts = 3,
	weapons = 4
}

export enum FolderType {
	fileBrowser = 0,
	npcList = 1,
	weaponList = 2,
	scriptList = 3
}

export interface GTreeNode {
	resource: vscode.Uri,
	type: ResourceType,
	folderType?: FolderType,
	label?: string,
	isDirectory: boolean
}

export interface ExplorerEntry {
	resource: string
	label?: string
}

export interface RouteController {
	getFileStat?(req: HandlerReq): vscode.FileStat
	getChildren?(req: HandlerReq): vscode.ProviderResult<GTreeNode[]>
	getRequest?(req: HandlerReq): void
	getRequestContent?(req: HandlerReq): PromiseFn<Uint8Array> | undefined
	putRequestContent?(req: HandlerReq, content: Uint8Array): void
	deleteResource?(req: HandlerReq): void
}
