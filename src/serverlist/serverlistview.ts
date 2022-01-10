import * as vscode from 'vscode';

interface Server {
	name: string
	// language: string
	// description: string
	// url: string
	// version: string
	pcount: number
	ip: string
	port: number
}

export interface ServerlistNode {
	resource: vscode.Uri,
	server: Server
}

