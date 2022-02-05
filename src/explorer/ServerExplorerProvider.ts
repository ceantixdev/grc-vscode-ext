import * as vscode from 'vscode';
import * as types from './types';


export interface ServerExplorerProvider {
	/**
	 * Retrieve a list of nodes below this resource
	 *
	 * @param resource
	 */
	getChildren(resource: vscode.Uri): vscode.ProviderResult<types.GTreeNode[]>;

	/**
	 * Requests a resource from the server explorer. This can be used
	 * to refresh sub-resources, or request an editor for the resource which
	 * may be followed by an additional getResource(resource) call for the content
	 *
	 * @param resource
	 */
	headRequest(resource: vscode.Uri): void;

	/**
	 * Requests a resource from the server explorer. This can be used
	 * to refresh sub-resources, or request an editor for the resource which
	 * may be followed by an additional getResourceContent(resource) call for the content
	 *
	 * @param resource
	 * @returns Uint8Array | Thenable<Uint8Array>
	 */
	getRequest(resource: vscode.Uri): vscode.ProviderResult<Buffer>;

	/**
	 * Requests a resource from the server explorer. This can be used
	 * to refresh sub-resources, or request an editor for the resource which
	 * may be followed by an additional getResourceContent(resource) call for the content
	 *
	 * @param resource
	 * @returns Uint8Array | Thenable<Uint8Array>
	 */
	putRequest(resource: vscode.Uri, content: Uint8Array): boolean;
}
