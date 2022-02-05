import * as vscode from 'vscode';
import { Server } from './ServerListView';

export interface ServerlistNode {
    resource: vscode.Uri;
    label: string;
    server?: Server;
    children?: ServerlistNode[];
}
