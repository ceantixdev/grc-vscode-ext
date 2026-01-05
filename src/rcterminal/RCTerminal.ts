import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as grc from '@ceantixdev/node-grc';
import { VSCodeContext } from "../VSCodeContext";
import { RCTerminalEvents, RCTerminalView } from "./RCTerminalView";

export class RCTerminal implements RCTerminalEvents {
	private terminalView?: RCTerminalView;
	private buffered: string[] = [];
	
	constructor(private readonly context: VSCodeContext) {

	}

	public close(): void {
		this.terminalView?.closeTerminal();
		this.terminalView = undefined;
	}

	public clear(): void {
		this.terminalView?.clearTerminal();
	}

	public start(): void {
		if (this.terminalView) {
			return;
		}

		this.terminalView = new RCTerminalView(this);
	}

	public write(text: string): void {
		if (this.terminalView && this.terminalView.opened) {
			this.writeBufferArray();
			this.terminalView.writeToTerminal(text);
			return;
		}

		this.buffered.push(text);
	}

	private writeBufferArray(): void {
		const buffer = [...this.buffered];
		this.buffered = [];

		for (const buf of buffer) {
			this.write(buf);
		}
	}
	
	onTerminalInput(text: string): void {
		if (text.trim() === "/clear") {
			this.clear();
			return;
		}

		if (text.trim() === "/backup") {
			this.startBackup();
			return;
		}

		this.context.rcSession?.sendRCChat(text);
	}

	private async startBackup() {
		const options: vscode.OpenDialogOptions = {
			canSelectFiles: false,
			canSelectFolders: true,
			canSelectMany: false,
			openLabel: 'Select Backup Folder'
		};

		const folderUri = await vscode.window.showOpenDialog(options);
		if (folderUri && folderUri[0]) {
			const localRoot = folderUri[0].fsPath;
			this.write(`Starting backup to ${localRoot}...\r\n`);
			
			try {
				await this.backupRecursive("", localRoot);
				this.write("Backup completed successfully!\r\n");
			} catch (err) {
				this.write(`Backup failed: ${err}\r\n`);
			}
		}
	}

	private async backupRecursive(remotePath: string, localPath: string) {
		if (!this.context.rcSession) return;

		// Ensure remote path ends with / if not empty
		if (remotePath && !remotePath.endsWith("/")) remotePath += "/";

		this.write(`Scanning ${remotePath || "/"}...\r\n`);
		const listing = await this.context.rcSession.FileBrowser.cd(remotePath);

		for (const item of listing.fileList) {
			if (item.type === grc.FSEntryType.File) {
				this.write(`Downloading ${item.name}...\r\n`);
				// Ensure we are in the right directory before downloading
				await this.context.rcSession.FileBrowser.cd(remotePath);
				const content = await this.context.rcSession.FileBrowser.get(item.name);
				fs.writeFileSync(path.join(localPath, item.name), content);
			} else if (item.type === grc.FSEntryType.Directory) {
				const newLocalPath = path.join(localPath, item.name);
				if (!fs.existsSync(newLocalPath)) {
					fs.mkdirSync(newLocalPath);
				}
				await this.backupRecursive(remotePath + item.name, newLocalPath);
			}
		}
	}

	onTerminalClosed(): void {
		this.context.disconnectRemoteControl();
		this.terminalView = undefined;
	}

	onTerminalOpened(): void {
		this.writeBufferArray();
	}
}
