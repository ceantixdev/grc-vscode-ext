import * as vscode from 'vscode';
import * as router from 'tiny-request-router';
import { VSCodeContext } from '../VSCodeContext';

export const URI_SCHEME = "grc";

export type Params = router.Params;
export type Context = VSCodeContext;

export interface HandlerReq {
	context: Context,
	resource: vscode.Uri,
	params: Params
}

export type HandlerFn = (req: HandlerReq) => void;

export enum ResourceType {
	file = 0,
	folder = 1,
	npcsfolder = 2,
	npcs = 3,
	scripts = 4,
	weapons = 5
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
	resource: string,
	type?: ResourceType,
	label?: string,
	isDirectory?: boolean
}

export type PartialFileStat = Partial<vscode.FileStat>;

export interface RouteController {
	getChildren?(req: HandlerReq): vscode.ProviderResult<GTreeNode[]>
	
	deleteRequest?(req: HandlerReq): void
	getRequest?(req: HandlerReq): vscode.ProviderResult<Buffer>
	headRequest?(req: HandlerReq): void
	putRequest?(req: HandlerReq, content: Uint8Array): void
	statRequest?(req: HandlerReq): vscode.ProviderResult<PartialFileStat>
}
